import { CalendarCheck, LogOut, RefreshCw, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Brand } from "@/components/ui/brand";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip, NetworkChip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { Meter } from "@/components/ui/metrics";
import { useAuth } from "@/contexts/auth-context";
import { cacheClassDates } from "@/lib/class-dates-cache";
import { loadDashboardData, type DashboardData } from "@/lib/dashboard-api";
import {
  getPendingSessionCount,
  registerAttendanceSyncHandlers,
  syncPendingSessions,
} from "@/lib/attendance-sync";
import { greetingForHour, localToday } from "@/lib/dates";

const today = () => localToday();

function formatGreetingDate(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function DashboardPage() {
  const { user, logout } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  async function refreshPendingCount() {
    setPendingCount(await getPendingSessionCount());
  }
  async function refreshData() {
    setIsLoading(true);
    setError(null);
    try {
      const next = await loadDashboardData();
      setData(next);
      if (next.activeYear)
        await cacheClassDates(next.activeYear.id, next.classDates);
      await refreshPendingCount();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar dashboard",
      );
    } finally {
      setIsLoading(false);
    }
  }
  async function syncNow() {
    setSyncing(true);
    try {
      const result = await syncPendingSessions();
      setSyncNotice(
        result.skipped > 0
          ? `${result.skipped} chamada${result.skipped === 1 ? "" : "s"} não ${result.skipped === 1 ? "foi aceita" : "foram aceitas"} pelo servidor (já registrada ou fora do calendário). Fale com a coordenação se precisar corrigir.`
          : null,
      );
      await refreshData();
    } catch {
      await refreshPendingCount();
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => {
    registerAttendanceSyncHandlers();
    void refreshData().then(async () => {
      // A promessa "será sincronizada automaticamente" precisa valer também
      // para quem reabre o app já online (o evento 'online' não dispara aí).
      if (navigator.onLine && (await getPendingSessionCount()) > 0) {
        void syncNow();
      }
    });
  }, []);
  useEffect(() => {
    const onOnline = () => void syncNow();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);

  const view = useMemo(() => {
    if (!data) return null;
    const currentDate = today();
    const isScheduledDay = data.classDates.includes(currentDate);
    const todayClassIds = new Set(
      data.attendance
        .filter((session) => session.date === currentDate)
        .map((session) => session.classId),
    );
    const statsByClass = Object.fromEntries(
      data.classes.map((item) => {
        const records = data.attendance
          .filter((session) => session.classId === item.id)
          .flatMap((session) => session.records);
        return [
          item.id,
          {
            percent: records.length
              ? Math.round(
                  (records.filter((record) => record.present).length /
                    records.length) *
                    100,
                )
              : 0,
            doneToday: todayClassIds.has(item.id),
          },
        ];
      }),
    );
    return {
      isScheduledDay,
      statsByClass,
      pendingClass:
        data.classes.find((item) => !todayClassIds.has(item.id)) ?? null,
    };
  }, [data]);

  const firstName = user?.fullName.split(" ")[0] ?? "Catequista";
  return (
    <main className="min-h-screen bg-background pb-28">
      <header
        className="sticky top-0 z-10 border-b border-border bg-surface/90 px-4 py-3 backdrop-blur"
        data-od-id="appbar"
      >
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <Brand compact className="shrink-0" />
          <span className="hidden text-sm font-semibold text-fg sm:block">
            Minhas turmas
          </span>
          <span className="flex-1" />
          <NetworkChip />
          <span className="hidden text-right leading-tight sm:block">
            <span className="block text-sm font-semibold">
              {user?.fullName ?? "Catequista"}
            </span>
            <span className="eyebrow block text-[10px]">Catequista</span>
          </span>
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-3 text-muted"
            aria-hidden="true"
          >
            <UserRound size={18} />
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => void logout()}
            aria-label="Sair"
            title="Sair"
          >
            <LogOut aria-hidden="true" size={18} />
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        <section className="space-y-2" data-od-id="greeting">
          <p className="eyebrow">{formatGreetingDate(new Date())}</p>
          <h1>
            {greetingForHour(new Date().getHours())}, {firstName}
          </h1>
          <p className="max-w-2xl text-sm text-muted">
            {data
              ? `${data.classes.length} turma${data.classes.length === 1 ? "" : "s"} atribuída${data.classes.length === 1 ? "" : "s"} a você neste ano letivo.`
              : "Aqui você encontra suas turmas e as chamadas de hoje."}
          </p>
        </section>

        {pendingCount > 0 && (
          <section
            role="status"
            className="flex flex-wrap items-center gap-3 rounded-[var(--r)] border border-warn bg-warn-soft p-4 text-sm text-warn-ink"
            data-od-id="sync-state"
          >
            <RefreshCw
              aria-hidden="true"
              size={18}
              className={syncing ? "animate-spin" : ""}
            />
            <p className="min-w-48 flex-1">
              <strong className="num">{pendingCount}</strong> chamada
              {pendingCount === 1 ? "" : "s"} aguardando envio. Foi registrada
              sem conexão e será sincronizada automaticamente.
            </p>
            <Button
              variant="secondary"
              disabled={syncing}
              disabledReason="Enviando…"
              onClick={() => void syncNow()}
            >
              {syncing ? "Enviando…" : "Sincronizar agora"}
            </Button>
          </section>
        )}

        {syncNotice && (
          <section
            role="status"
            className="rounded-[var(--r)] border border-warn bg-warn-soft p-4 text-sm text-warn-ink"
            data-testid="sync-skipped-notice"
          >
            {syncNotice}
          </section>
        )}

        {isLoading && (
          <p className="py-8 text-sm text-muted">Carregando turmas...</p>
        )}
        {error && (
          <div
            role="alert"
            className="rounded-[var(--r)] border border-danger bg-danger-soft p-4 text-sm text-danger-ink"
          >
            {error}
          </div>
        )}
        {data && view && (
          <>
            {data.classes.length === 0 ? (
              <EmptyState
                title="Nenhuma turma atribuída."
                description="Fale com a coordenação para receber uma turma antes de registrar a chamada."
              />
            ) : (
              <>
                {view.isScheduledDay && view.pendingClass && (
                  <Card
                    variant="accent"
                    className="grid gap-5 shadow-2 md:grid-cols-[1fr_auto] md:items-center"
                    data-od-id="today-card"
                  >
                    <div className="min-w-0">
                      <p className="eyebrow text-accent-ink">Próxima chamada</p>
                      <h2 className="mt-1 overflow-wrap-anywhere">
                        {view.pendingClass.name}
                      </h2>
                      <p className="mt-1 text-sm text-muted">
                        {view.pendingClass.schedule ?? "Horário a confirmar"} ·{" "}
                        <span className="num">
                          {data.studentsByClass[view.pendingClass.id]?.length ??
                            0}
                        </span>{" "}
                        alunos
                      </p>
                    </div>
                    <Link
                      to={`/dashboard/turmas/${view.pendingClass.id}/chamada`}
                      className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-[var(--r)] bg-accent px-5 text-base font-semibold text-primary-foreground shadow-2"
                      data-testid="btn-iniciar-chamada"
                      data-od-id="start-attendance"
                    >
                      <CalendarCheck aria-hidden="true" size={20} />
                      Iniciar chamada
                    </Link>
                  </Card>
                )}
                <section className="space-y-4" data-od-id="classes">
                  <div className="flex flex-wrap items-end justify-between gap-2">
                    <h2>Minhas turmas</h2>
                    <span className="eyebrow">
                      Ano letivo {data.activeYear?.year ?? "—"}
                    </span>
                  </div>
                  <div
                    className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
                    data-testid="class-list"
                  >
                    {data.classes.map((item) => {
                      const stat = view.statsByClass[item.id];
                      const students = data.studentsByClass[item.id] ?? [];
                      return (
                        <Card
                          key={item.id}
                          className="space-y-4"
                          data-testid="class-card"
                          data-od-id={`class-card-${item.id}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="overflow-wrap-anywhere">
                                {item.name}
                              </h3>
                              <p className="mt-1 text-sm text-muted">
                                {item.schedule ? `${item.schedule} · ` : ""}
                                <span className="num">
                                  {students.length}
                                </span>{" "}
                                aluno{students.length === 1 ? "" : "s"}
                              </p>
                            </div>
                            {view.isScheduledDay ? (
                              <Chip tone={stat.doneToday ? "ok" : "warn"}>
                                {stat.doneToday ? "Feita hoje" : "Pendente"}
                              </Chip>
                            ) : (
                              <Chip dot={false}>Sem aula hoje</Chip>
                            )}
                          </div>
                          <Meter
                            percent={stat.percent}
                            label="Presença acumulada"
                          />
                          <Link
                            to={`/dashboard/turmas/${item.id}/chamada`}
                            className="inline-flex min-h-touch items-center justify-center rounded-[var(--r)] border border-border px-4 text-sm font-semibold text-fg transition-colors hover:bg-surface-2"
                            data-testid={`class-card-open-${item.id}`}
                          >
                            Abrir chamada
                          </Link>
                        </Card>
                      );
                    })}
                  </div>
                </section>
              </>
            )}
          </>
        )}
      </div>
      {data && view && (
        <div className="fixed inset-x-0 bottom-0 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur md:hidden">
          <div className="mx-auto max-w-6xl">
            {!view.isScheduledDay ? (
              <p className="text-center text-sm text-muted">
                Não há aula programada para hoje
              </p>
            ) : view.pendingClass ? (
              <Link
                to={`/dashboard/turmas/${view.pendingClass.id}/chamada`}
                className="flex min-h-[52px] items-center justify-center gap-2 rounded-[var(--r)] bg-accent px-4 font-semibold text-primary-foreground shadow-2"
              >
                Iniciar chamada · {view.pendingClass.name}
              </Link>
            ) : (
              <p className="text-center text-sm text-muted">
                Todas as chamadas de hoje foram registradas
              </p>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
