import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

const baseUrl = process.env.BASELINE_URL ?? "http://localhost:5173";
const wave = process.argv[2] ?? "fase-0";
const destination = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../docs/visual-baseline",
  wave,
);
const viewports = [
  { name: "mobile", width: 390, height: 844 },
  { name: "desktop", width: 1280, height: 800 },
];
const catechistUser = {
  id: "baseline-user",
  email: "catequista@paroquia.org",
  fullName: "Catequista",
  role: "catechist",
  mustChangePassword: false,
};
const coordinatorUser = {
  id: "baseline-coordinator",
  email: "coordenacao@paroquia.org",
  fullName: "Coordenação",
  role: "coordinator",
  mustChangePassword: false,
};
export const routes = [
  { name: "enrollment", path: "/inscricao" },
  { name: "login", path: "/login" },
  {
    name: "change-password",
    path: "/trocar-senha",
    authenticatedUser: {
      ...catechistUser,
      mustChangePassword: true,
    },
  },
  {
    name: "dashboard",
    path: "/dashboard",
    authenticatedUser: {
      ...catechistUser,
    },
  },
  {
    name: "attendance",
    path: "/dashboard/turmas/baseline-class/chamada",
    authenticatedUser: {
      ...catechistUser,
    },
  },
  {
    name: "attendance-offline",
    path: "/dashboard/turmas/baseline-class/chamada",
    authenticatedUser: {
      ...catechistUser,
    },
    offline: true,
  },
  { name: "admin-years", path: "/admin/anos", authenticatedUser: coordinatorUser },
  { name: "admin-calendar", path: "/admin/calendario", authenticatedUser: coordinatorUser },
  { name: "admin-classes", path: "/admin/turmas", authenticatedUser: coordinatorUser },
  { name: "admin-students", path: "/admin/alunos", authenticatedUser: coordinatorUser },
  { name: "admin-catechists", path: "/admin/catequistas", authenticatedUser: coordinatorUser },
  { name: "admin-enrollments", path: "/admin/inscricoes", authenticatedUser: coordinatorUser },
  { name: "admin-reports", path: "/admin/relatorios", authenticatedUser: coordinatorUser },
];
const activeRoutes = wave === "onda-3-inscricao"
  ? routes.filter((route) => route.name === "enrollment")
  : wave === "fase-4-primitivos"
    ? routes
  : routes;

const baselineClass = {
  id: "baseline-class",
  academicYearId: "baseline-year",
  name: "Primeira Comunhão",
  level: null,
  schedule: "Sábado, 10h30",
  isArchived: false,
  catechistIds: ["baseline-user"],
};
const baselineStudents = [
  {
    id: "baseline-student-1",
    classId: baselineClass.id,
    fullName: "Ana Clara",
    isActive: true,
  },
  {
    id: "baseline-student-2",
    classId: baselineClass.id,
    fullName: "Bruno Santos",
    isActive: true,
  },
];
const baselineYear = {
  id: "baseline-year",
  year: 2026,
  isActive: true,
  classDays: [6],
  enrollmentStartsAt: "2026-01-01",
  enrollmentEndsAt: "2026-02-01",
};
const baselineCatechists = [{
  id: "baseline-catechist",
  email: "maria@paroquia.org",
  fullName: "Maria Oliveira",
  role: "catechist",
  isActive: true,
  mustChangePassword: false,
}];
const baselineStudent = {
  ...baselineStudents[0],
  className: baselineClass.name,
  birthDate: "2017-05-12",
  city: "São Paulo",
  firstCommunion: false,
  confirmation: false,
  previousCatechism: null,
  religiousBooks: null,
  guardianFatherName: "João Clara",
  guardianMotherName: "Paula Clara",
  guardianPhone: "(11) 99999-9999",
  guardianEmail: "paula@example.com",
};
const baselineEnrollment = {
  id: "baseline-enrollment",
  academicYearId: baselineYear.id,
  status: "pending",
  fullName: "Pedro Santos",
  birthDate: "2018-02-01",
  city: "São Paulo",
  firstCommunion: false,
  confirmation: false,
  previousCatechism: null,
  religiousBooks: null,
  guardianFatherName: "Carlos Santos",
  guardianMotherName: "Paula Santos",
  guardianPhone: "(11) 98888-7777",
  guardianEmail: "paula@example.com",
  isRenewal: false,
  previousName: null,
  rejectionReason: null,
  approvedClassId: null,
  approvedStudentId: null,
  reviewedBy: null,
  reviewedAt: null,
  createdAt: "2026-01-02T10:00:00Z",
};
const baselineToday = new Date().toISOString().slice(0, 10);

export function apiResponse(pathname: string) {
  if (pathname === "/api/classes") return [baselineClass];
  if (pathname === "/api/academic-years")
    return [baselineYear];
  if (pathname === "/api/attendance") return [];
  if (pathname === "/api/class-dates?academicYearId=baseline-year")
    return { dates: [baselineToday], lockedDates: [] };
  if (pathname === "/api/classes/baseline-class/students")
    return baselineStudents;
  if (pathname === "/api/catechists") return baselineCatechists;
  if (pathname.startsWith("/api/students?")) return [baselineStudent];
  if (pathname.startsWith("/api/enrollments?")) return [baselineEnrollment];
  if (pathname.includes("/api/reports/attendance") && pathname.includes("format=json")) {
    return {
      className: baselineClass.name,
      from: "2026-01-01",
      to: "2026-01-31",
      students: [{ id: baselineStudent.id, full_name: baselineStudent.fullName }],
      sessions: [{ id: "baseline-session", date: baselineToday }],
      records: [{ session_id: "baseline-session", student_id: baselineStudent.id, present: true }],
    };
  }
  return null;
}

export async function captureBaseline() {
  await mkdir(destination, { recursive: true });
  const browser = await chromium.launch(
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : undefined,
  );
  try {
    for (const viewport of viewports) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
      });
      for (const route of activeRoutes) {
        await context.route("**/api/**", (request) => {
          const url = new URL(request.request().url());
          if (url.pathname === "/api/auth/me" && route.authenticatedUser)
            return request.fulfill({
              contentType: "application/json",
              body: JSON.stringify(route.authenticatedUser),
            });
          const body = apiResponse(`${url.pathname}${url.search}`);
          return body === null
            ? request.fulfill({
                status: 404,
                contentType: "application/json",
                body: JSON.stringify({ error: "Não encontrado" }),
              })
            : request.fulfill({
                contentType: "application/json",
                body: JSON.stringify(body),
              });
        });
        const page = await context.newPage();
        await page.goto(new URL(route.path, baseUrl).toString(), {
          waitUntil: "networkidle",
        });
        if (route.offline) {
          await context.setOffline(true);
          await page
            .getByRole("button", { name: "Marcar todos presentes" })
            .click();
          await page.getByRole("button", { name: "Confirmar chamada" }).click();
          await page.getByTestId("offline-saved-message").waitFor();
        }
        await page.screenshot({
          path: path.join(destination, `${route.name}-${viewport.name}.png`),
          fullPage: true,
        });
        if (route.offline) await context.setOffline(false);
        await page.close();
        await context.unroute("**/api/**");
      }
      await context.close();
    }
  } finally {
    await browser.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await captureBaseline();
}
