import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
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
const routes = [
  { name: "enrollment", path: "/inscricao" },
  { name: "login", path: "/login" },
  {
    name: "change-password",
    path: "/trocar-senha",
    authenticatedUser: {
      id: "baseline-user",
      email: "catequista@paroquia.org",
      fullName: "Catequista",
      role: "catechist",
      mustChangePassword: true,
    },
  },
  {
    name: "dashboard",
    path: "/dashboard",
    authenticatedUser: {
      id: "baseline-user",
      email: "catequista@paroquia.org",
      fullName: "Catequista",
      role: "catechist",
      mustChangePassword: false,
    },
  },
  {
    name: "attendance",
    path: "/dashboard/turmas/baseline-class/chamada",
    authenticatedUser: {
      id: "baseline-user",
      email: "catequista@paroquia.org",
      fullName: "Catequista",
      role: "catechist",
      mustChangePassword: false,
    },
  },
  {
    name: "attendance-offline",
    path: "/dashboard/turmas/baseline-class/chamada",
    authenticatedUser: {
      id: "baseline-user",
      email: "catequista@paroquia.org",
      fullName: "Catequista",
      role: "catechist",
      mustChangePassword: false,
    },
    offline: true,
  },
];
const activeRoutes = wave === "onda-3-inscricao"
  ? routes.filter((route) => route.name === "enrollment")
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
const baselineToday = new Date().toISOString().slice(0, 10);

function apiResponse(pathname: string) {
  if (pathname === "/api/classes") return [baselineClass];
  if (pathname === "/api/academic-years")
    return [{ id: "baseline-year", year: 2026, isActive: true }];
  if (pathname === "/api/attendance") return [];
  if (pathname === "/api/class-dates?academicYearId=baseline-year")
    return { dates: [baselineToday], lockedDates: [] };
  if (pathname === "/api/classes/baseline-class/students")
    return baselineStudents;
  return null;
}

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
