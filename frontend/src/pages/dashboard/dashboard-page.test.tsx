import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { App } from "@/App";
import { db } from "@/lib/db";
import { enqueuePendingSession } from "@/lib/attendance-sync";
import { localToday } from "@/lib/dates";

const catechistUser = {
  id: "22222222-2222-2222-2222-222222222222",
  email: "catequista@example.com",
  fullName: "Maria Catequista",
  role: "catechist",
  mustChangePassword: false,
};

const classItem = {
  id: "11111111-1111-1111-1111-111111111111",
  academicYearId: "year-1",
  name: "Primeira Comunhão",
  level: null,
  schedule: "Sábado 9h",
  isArchived: false,
  catechistIds: [catechistUser.id],
};

const students = [
  {
    id: "33333333-3333-3333-3333-333333333333",
    classId: classItem.id,
    fullName: "Ana Clara",
    isActive: true,
  },
  {
    id: "44444444-4444-4444-4444-444444444444",
    classId: classItem.id,
    fullName: "Bruno Santos",
    isActive: true,
  },
];

const today = () => localToday();

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function setupDashboardFetch() {
  const calls: Array<{ path: string; init?: RequestInit }> = [];
  const fetchMock = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const path = String(input);
      calls.push({ path, init });
      if (path === "/api/auth/me") return jsonResponse(catechistUser);
      if (path === "/api/classes") return jsonResponse([classItem]);
      if (path === "/api/academic-years") {
        return jsonResponse([{ id: "year-1", year: 2026, isActive: true }]);
      }
      if (path === "/api/attendance" && init?.method === "POST") {
        return jsonResponse({ synced: 1, skipped: 0 });
      }
      if (path === "/api/attendance") return jsonResponse([]);
      if (path === "/api/class-dates?academicYearId=year-1") {
        return jsonResponse({ dates: [today()], lockedDates: [] });
      }
      if (path === `/api/classes/${classItem.id}/students`)
        return jsonResponse(students);
      return jsonResponse({ status: "ok" });
    },
  );
  vi.stubGlobal("fetch", fetchMock);
  return { calls };
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe("catechist dashboard pages", () => {
  beforeEach(async () => {
    await db.pending_sessions.clear();
    await db.cached_class_dates.clear();
  });

  afterEach(async () => {
    await db.pending_sessions.clear();
    await db.cached_class_dates.clear();
    vi.restoreAllMocks();
  });

  it("renders assigned classes and links to the scheduled attendance sheet", async () => {
    setupDashboardFetch();
    renderAt("/dashboard");

    await screen.findAllByText("Primeira Comunhão");
    await waitFor(() =>
      expect(
        screen.queryByText("Carregando turmas..."),
      ).not.toBeInTheDocument(),
    );

    expect(screen.getByTestId("class-card")).toHaveTextContent("2 alunos");
    expect(screen.getByTestId("btn-iniciar-chamada")).toHaveAttribute(
      "href",
      `/dashboard/turmas/${classItem.id}/chamada`,
    );
    expect(await db.cached_class_dates.get(["year-1", today()])).toBeTruthy();
  });

  it("submits an online attendance sheet to the attendance API", async () => {
    const { calls } = setupDashboardFetch();
    renderAt(`/dashboard/turmas/${classItem.id}/chamada`);

    await screen.findByText("Ana Clara");
    fireEvent.click(screen.getByLabelText("Marcar Ana Clara como presente"));
    fireEvent.click(screen.getByLabelText("Marcar Bruno Santos como ausente"));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar chamada" }));

    await waitFor(() =>
      expect(
        calls.some(
          (call) =>
            call.path === "/api/attendance" && call.init?.method === "POST",
        ),
      ).toBe(true),
    );
    const post = calls.find(
      (call) => call.path === "/api/attendance" && call.init?.method === "POST",
    );
    expect(JSON.parse(String(post?.init?.body))).toMatchObject({
      sessions: [
        {
          classId: classItem.id,
          catechistId: catechistUser.id,
          date: today(),
          records: [
            { studentId: students[0].id, present: true },
            { studentId: students[1].id, present: false },
          ],
        },
      ],
    });
  });

  it("keeps the confirmation disabled with an honest remaining count, then enables it after every mark", async () => {
    setupDashboardFetch();
    renderAt(`/dashboard/turmas/${classItem.id}/chamada`);

    await screen.findByText("Ana Clara");
    expect(screen.getByRole("button", { name: "Faltam 2" })).toBeDisabled();
    fireEvent.click(screen.getByLabelText("Marcar Ana Clara como presente"));
    expect(screen.getByRole("button", { name: "Faltam 1" })).toBeDisabled();
    fireEvent.click(screen.getByLabelText("Marcar Bruno Santos como ausente"));
    expect(
      screen.getByRole("button", { name: "Confirmar chamada" }),
    ).toBeEnabled();
    expect(
      screen.getByText("1", { selector: ".text-accent-ink" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("1", { selector: ".text-danger-ink" }),
    ).toBeInTheDocument();
  });

  it("filters the roster and marks every visible student present", async () => {
    setupDashboardFetch();
    renderAt(`/dashboard/turmas/${classItem.id}/chamada`);

    await screen.findByText("Ana Clara");
    fireEvent.change(
      screen.getByRole("searchbox", { name: "Buscar aluno na lista" }),
      { target: { value: "ana" } },
    );
    expect(screen.queryByText("Bruno Santos")).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Marcar todos presentes" }),
    );
    expect(
      screen.getByLabelText("Marcar Ana Clara como presente"),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Faltam 1" })).toBeDisabled();
  });

  it("shows the offline queue, network state, and explicitly syncs queued calls", async () => {
    await enqueuePendingSession({
      id: "55555555-5555-5555-5555-555555555555",
      classId: classItem.id,
      catechistId: catechistUser.id,
      date: today(),
      records: [],
      createdAt: 1,
    });
    const { calls } = setupDashboardFetch();
    const online = navigator.onLine;
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: false,
    });
    renderAt("/dashboard");

    await screen.findByText(/chamada.*aguardando envio/i);
    expect(screen.getByText("Offline")).toBeInTheDocument();
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: online,
    });
    fireEvent.click(screen.getByRole("button", { name: "Sincronizar agora" }));
    await waitFor(() =>
      expect(
        calls.some(
          (call) =>
            call.path === "/api/attendance" && call.init?.method === "POST",
        ),
      ).toBe(true),
    );
    await waitFor(() =>
      expect(screen.queryByText(/aguardando envio/i)).not.toBeInTheDocument(),
    );
  });

  it("queues an offline attendance submission, exposes it, and synchronizes it later", async () => {
    const { calls } = setupDashboardFetch();
    const online = navigator.onLine;
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: false,
    });
    renderAt(`/dashboard/turmas/${classItem.id}/chamada`);

    await screen.findByText("Ana Clara");
    fireEvent.click(
      screen.getByRole("button", { name: "Marcar todos presentes" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Confirmar chamada" }));
    expect(
      await screen.findByTestId("offline-saved-message"),
    ).toHaveTextContent("salva no aparelho");
    expect(
      await screen.findByText(/chamada aguardando envio/i),
    ).toBeInTheDocument();
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: online,
    });
    fireEvent.click(screen.getByRole("button", { name: "Sincronizar agora" }));
    await waitFor(() =>
      expect(
        calls.some(
          (call) =>
            call.path === "/api/attendance" && call.init?.method === "POST",
        ),
      ).toBe(true),
    );
    await waitFor(() =>
      expect(screen.queryByText(/aguardando envio/i)).not.toBeInTheDocument(),
    );
  });

  it("sincroniza a fila pendente ao abrir o app já online (BUG-20260724-salvando-infinito-offline)", async () => {
    const { calls } = setupDashboardFetch();
    await enqueuePendingSession({
      id: "55555555-5555-5555-5555-555555555555",
      classId: classItem.id,
      date: today(),
      catechistId: catechistUser.id,
      records: [{ studentId: students[0].id, present: true }],
      createdAt: Date.now(),
    });

    renderAt("/dashboard");

    await waitFor(() =>
      expect(
        calls.some(
          (call) => call.path === "/api/attendance" && call.init?.method === "POST",
        ),
      ).toBe(true),
    );
    await waitFor(async () => expect(await db.pending_sessions.count()).toBe(0));
  });

  it("avisa quando o servidor descarta chamadas na sincronização (BUG-20260724-refazer-chamada-descartada-em-silencio)", async () => {
    const { calls } = setupDashboardFetch();
    vi.mocked(fetch).mockImplementation(async (input, init) => {
      const path = String(input);
      calls.push({ path, init: init ?? undefined });
      if (path === "/api/auth/me") return jsonResponse(catechistUser);
      if (path === "/api/classes") return jsonResponse([classItem]);
      if (path === "/api/academic-years")
        return jsonResponse([{ id: "year-1", year: 2026, isActive: true }]);
      if (path === "/api/attendance" && init?.method === "POST")
        return jsonResponse({ synced: 0, skipped: 1 });
      if (path === "/api/attendance") return jsonResponse([]);
      if (path === "/api/class-dates?academicYearId=year-1")
        return jsonResponse({ dates: [today()], lockedDates: [] });
      if (path === `/api/classes/${classItem.id}/students`)
        return jsonResponse(students);
      return jsonResponse({ status: "ok" });
    });
    await enqueuePendingSession({
      id: "66666666-6666-6666-6666-666666666666",
      classId: classItem.id,
      date: today(),
      catechistId: catechistUser.id,
      records: [{ studentId: students[0].id, present: true }],
      createdAt: Date.now(),
    });

    renderAt("/dashboard");

    await screen.findByTestId("sync-skipped-notice");
    expect(screen.getByTestId("sync-skipped-notice").textContent).toMatch(/não foi aceita/i);
  });

  it("cada card de turma dá acesso à própria chamada (BUG-20260724-so-proxima-turma-tem-chamada)", async () => {
    setupDashboardFetch();

    renderAt("/dashboard");

    const link = await screen.findByTestId(`class-card-open-${classItem.id}`);
    expect(link).toHaveAttribute(
      "href",
      `/dashboard/turmas/${classItem.id}/chamada`,
    );
  });
});
