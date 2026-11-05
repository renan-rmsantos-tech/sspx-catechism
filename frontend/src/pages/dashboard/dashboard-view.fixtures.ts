import type { DashboardData } from "@/lib/dashboard-api";

/** Sábado de manhã, dia de catequese no calendário das fixtures. */
export const saturdayMorning = new Date(2026, 10, 7, 9, 30);
/** Quarta-feira, fora do calendário. */
export const wednesday = new Date(2026, 10, 4, 15, 0);

export const catechistName = "Maria Aparecida Souza";

const yearId = "ano-2026";
const catechistId = "catequista-maria";

const classes: DashboardData["classes"] = [
  {
    id: "primeira-comunhao",
    academicYearId: yearId,
    name: "Primeira Comunhão",
    level: null,
    schedule: "Sábado 9h",
    isArchived: false,
    catechistIds: [catechistId],
  },
  {
    id: "perseveranca",
    academicYearId: yearId,
    name: "Perseverança",
    level: null,
    schedule: "Sábado 10h30",
    isArchived: false,
    catechistIds: [catechistId],
  },
];

function students(classId: string, names: string[]) {
  return names.map((fullName, index) => ({
    id: `${classId}-${index + 1}`,
    classId,
    fullName,
    isActive: true,
  }));
}

const studentsByClass: DashboardData["studentsByClass"] = {
  "primeira-comunhao": students("primeira-comunhao", [
    "Ana Clara Ribeiro",
    "Bruno Santos",
    "Cecília Moraes",
    "Davi Lucas Pereira",
  ]),
  perseveranca: students("perseveranca", ["Elisa Fontes", "Felipe Andrade", "Gabriel Rocha"]),
};

function session(classId: string, date: string, present: boolean[]): DashboardData["attendance"][number] {
  const roster = studentsByClass[classId];
  return {
    id: `${classId}-${date}`,
    classId,
    date,
    catechistId,
    syncedAt: `${date}T12:00:00Z`,
    records: present.map((isPresent, index) => ({
      id: `${classId}-${date}-${index}`,
      studentId: roster[index].id,
      present: isPresent,
    })),
  };
}

/** Duas turmas; a Perseverança já fez a chamada de hoje, a Primeira Comunhão não. */
export const dashboard: DashboardData = {
  classes,
  studentsByClass,
  activeYear: { id: yearId, year: 2026, isActive: true },
  classDates: ["2026-10-24", "2026-10-31", "2026-11-07", "2026-11-14"],
  attendance: [
    session("primeira-comunhao", "2026-10-24", [true, true, false, true]),
    session("primeira-comunhao", "2026-10-31", [true, true, true, false]),
    session("perseveranca", "2026-10-31", [true, false, true]),
    session("perseveranca", "2026-11-07", [true, true, true]),
  ],
};

/** Catequista sem turma atribuída no ano letivo. */
export const noClasses: DashboardData = { ...dashboard, classes: [], studentsByClass: {}, attendance: [] };

export const pendingSessions = 2;

export const loadError = "erro ao comunicar com o servidor";
