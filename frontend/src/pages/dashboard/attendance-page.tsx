import { ArrowLeft, LogOut, WifiOff } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AttendanceRow, tallyMarks } from "@/components/ui/attendance-row";
import { Button } from "@/components/ui/button";
import { NetworkChip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchField } from "@/components/ui/field";
import { ProgressRail } from "@/components/ui/metrics";
import { useAuth } from "@/contexts/auth-context";
import { Chip } from "@/components/ui/chip";
import type {
  AttendanceSession,
  PendingSession,
} from "@/lib/attendance-types";
import {
  submitAttendanceSession,
  getPendingSessionCount,
  syncPendingSessions,
} from "@/lib/attendance-sync";
import { isDateScheduledOffline } from "@/lib/class-dates-cache";
import {
  loadAttendanceSheetData,
  type DashboardStudent,
} from "@/lib/dashboard-api";
import { localToday } from "@/lib/dates";

type Mark = boolean | null;
const today = () => localToday();
function formatDisplayDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}
function makeSession(
  classId: string,
  catechistId: string,
  students: DashboardStudent[],
  marks: Record<string, Mark>,
): PendingSession {
  return {
    id: crypto.randomUUID(),
    classId,
    date: today(),
    catechistId,
    records: students.map((student) => ({
      studentId: student.id,
      present: marks[student.id] === true,
    })),
    createdAt: Date.now(),
  };
}

export function AttendancePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [className, setClassName] = useState("");
  const [students, setStudents] = useState<DashboardStudent[]>([]);
  const [isScheduled, setIsScheduled] = useState(true);
  const [marks, setMarks] = useState<Record<string, Mark>>({});
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [offlineSaved, setOfflineSaved] = useState(false);
  const [doneSession, setDoneSession] = useState<AttendanceSession | null>(
    null,
  );
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const refreshPendingCount = async () =>
    setPendingCount(await getPendingSessionCount());
  useEffect(() => {
    if (!id) return;
    const classId = id;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await loadAttendanceSheetData(classId);
        if (!data.classItem) throw new Error("Turma não encontrada");
        let scheduled = data.classDates.includes(today());
        if (!scheduled && data.scheduleYearId)
          scheduled = await isDateScheduledOffline(data.scheduleYearId, today());
        if (cancelled) return;
        setClassName(data.classItem.name);
        setStudents(data.students);
        setIsScheduled(scheduled);
        // Chamada de hoje já registrada abre em modo leitura — remarcar seria
        // descartado pelo servidor (política decidida no
        // BUG-20260724-refazer-chamada-descartada-em-silencio).
        const existing =
          data.attendance.find(
            (session) =>
              session.classId === classId && session.date === today(),
          ) ?? null;
        setDoneSession(existing);
        setMarks(
          Object.fromEntries(
            data.students.map((student) => {
              const record = existing?.records.find(
                (item) => item.studentId === student.id,
              );
              return [student.id, record ? record.present : null];
            }),
          ),
        );
        await refreshPendingCount();
      } catch (err) {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Erro ao carregar chamada",
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);
  const counts = useMemo(
    () =>
      tallyMarks(
        students.map((student) => marks[student.id]),
        students.length,
      ),
    [marks, students],
  );
  const allMarked = students.length > 0 && counts.pending === 0;
  const visibleStudents = useMemo(
    () =>
      students.filter((student) =>
        student.fullName
          .toLocaleLowerCase("pt-BR")
          .includes(query.trim().toLocaleLowerCase("pt-BR")),
      ),
    [students, query],
  );
  function mark(studentId: string, value: boolean | null) {
    setMarks((current) => ({ ...current, [studentId]: value }));
  }
  function markVisiblePresent() {
    setMarks((current) => ({
      ...current,
      ...Object.fromEntries(
        visibleStudents.map((student) => [student.id, true]),
      ),
    }));
  }
  async function confirmAttendance() {
    if (!id || !user || !allMarked || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await submitAttendanceSession(
        makeSession(id, user.id, students, marks),
      );
      if (result === "queued") {
        setOfflineSaved(true);
        await refreshPendingCount();
        return;
      }
      if (result === "queued-expired") {
        // A chamada ficou na fila; o 401 derruba a sessão local e o guard leva
        // ao login, que mostra o aviso de chamada guardada.
        await refreshPendingCount();
        return;
      }
      if (result === "skipped") {
        setError(
          "O servidor não aceitou esta chamada (já registrada ou fora do calendário). Nada foi alterado — fale com a coordenação.",
        );
        return;
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar chamada");
    } finally {
      setSubmitting(false);
    }
  }
  async function syncNow() {
    setSyncing(true);
    try {
      await syncPendingSessions();
      await refreshPendingCount();
    } catch {
      await refreshPendingCount();
    } finally {
      setSyncing(false);
    }
  }
  return (
    <main className="min-h-screen bg-background pb-44">
      <header
        className="sticky top-0 z-20 border-b border-border bg-surface"
        data-od-id="sheet-header"
      >
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3">
          <Link
            to="/dashboard"
            className="flex size-touch shrink-0 items-center justify-center rounded-[var(--r)] text-muted hover:bg-surface-2 hover:text-fg"
            aria-label="Voltar para minhas turmas"
          >
            <ArrowLeft aria-hidden="true" size={20} />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="eyebrow truncate">{formatDisplayDate(today())}</p>
            <h1 className="mt-0.5 truncate text-[19px]">
              {className || "Turma"}
            </h1>
          </div>
          <NetworkChip />
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
        <ProgressRail
          done={counts.present + counts.absent}
          total={students.length}
        />
      </header>
      <div className="mx-auto max-w-4xl space-y-4 px-4 py-6">
        <section
          className="flex gap-3 rounded-[var(--r)] border border-info bg-info-soft p-4 text-sm text-info-ink"
          data-od-id="offline-note"
        >
          <WifiOff aria-hidden="true" size={18} className="mt-0.5 shrink-0" />
          <p>
            Pode marcar sem conexão. A chamada fica salva no aparelho e sobe
            sozinha quando o sinal voltar.
          </p>
        </section>
        {pendingCount > 0 && (
          <section
            className="flex flex-wrap items-center gap-3 rounded-[var(--r)] border border-warn bg-warn-soft p-4 text-sm text-warn-ink"
            data-od-id="sync-state"
          >
            <p className="flex-1">
              <strong className="num">{pendingCount}</strong> chamada
              {pendingCount === 1 ? "" : "s"} aguardando envio.
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
        {loading && (
          <p className="py-8 text-sm text-muted">Carregando alunos...</p>
        )}
        {error && (
          <div
            role="alert"
            className="rounded-[var(--r)] border border-danger bg-danger-soft p-4 text-sm text-danger-ink"
          >
            {error}
          </div>
        )}
        {!loading && !isScheduled && (
          <EmptyState
            title="Hoje não há aula programada"
            description="Confira com a coordenação a próxima data de chamada desta turma."
          />
        )}
        {!loading && isScheduled && doneSession && (
          <>
            <section
              role="status"
              className="rounded-[var(--r)] border border-accent-line bg-accent-soft p-4 text-sm text-accent-ink"
              data-testid="attendance-readonly"
            >
              Chamada de hoje já registrada
              {doneSession.syncedAt
                ? ` às ${new Date(doneSession.syncedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
                : ""}
              . Para corrigir alguma presença, fale com a coordenação.
            </section>
            <section
              className="overflow-hidden rounded-[var(--r-lg)] border border-border bg-surface"
              data-testid="student-list-readonly"
            >
              {students.map((student) => (
                <div
                  key={student.id}
                  className="flex min-h-touch items-center justify-between gap-3 border-b border-border px-4 py-3 last:border-b-0"
                >
                  <span className="text-sm font-medium">
                    {student.fullName}
                  </span>
                  <Chip tone={marks[student.id] ? "ok" : "warn"}>
                    {marks[student.id] ? "Presente" : "Ausente"}
                  </Chip>
                </div>
              ))}
            </section>
          </>
        )}
        {!loading && isScheduled && !doneSession && (
          <>
            <section
              className="flex flex-wrap gap-3"
              data-od-id="sheet-toolbar"
            >
              <SearchField
                className="min-w-52 flex-1"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar aluno"
                label="Buscar aluno na lista"
              />
              <Button
                variant="secondary"
                onClick={markVisiblePresent}
                disabled={visibleStudents.length === 0}
                disabledReason="Sem alunos"
              >
                Marcar todos presentes
              </Button>
              {query && (
                <Button variant="ghost" onClick={() => setQuery("")}>
                  Limpar
                </Button>
              )}
            </section>
            <section
              className="overflow-hidden rounded-[var(--r-lg)] border border-border bg-surface"
              data-testid="student-list"
              data-od-id="student-list"
            >
              {students.length === 0 ? (
                <EmptyState
                  title="Nenhum aluno nesta turma"
                  description="Peça à coordenação para vincular os catequizandos antes de fazer a chamada."
                />
              ) : visibleStudents.length === 0 ? (
                <EmptyState
                  title="Nenhum aluno com esse nome"
                  description="Limpe a busca ou tente outro nome da turma."
                  action={
                    <Button variant="secondary" onClick={() => setQuery("")}>
                      Limpar a busca
                    </Button>
                  }
                />
              ) : (
                visibleStudents.map((student) => (
                  <AttendanceRow
                    key={student.id}
                    student={{ id: student.id, name: student.fullName }}
                    mark={marks[student.id]}
                    onMark={(value) => mark(student.id, value)}
                    data-testid="student-row"
                  />
                ))
              )}
            </section>
          </>
        )}
      </div>
      {isScheduled && !doneSession && (
        <div
          className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur"
          data-od-id="confirm-bar"
        >
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4">
            <div className="flex gap-5 text-sm">
              <span>
                <strong className="num text-accent-ink">
                  {counts.present}
                </strong>
                <span className="ml-1 text-muted">presentes</span>
              </span>
              <span>
                <strong className="num text-danger-ink">{counts.absent}</strong>
                <span className="ml-1 text-muted">ausentes</span>
              </span>
              <span>
                <strong className="num">{counts.pending}</strong>
                <span className="ml-1 text-muted">sem marcar</span>
              </span>
            </div>
            <Button
              size="lg"
              disabled={!allMarked || submitting}
              disabledReason={
                submitting ? "Salvando…" : `Faltam ${counts.pending}`
              }
              onClick={() => void confirmAttendance()}
              data-testid="btn-confirm"
            >
              Confirmar chamada
            </Button>
            {offlineSaved && (
              <p
                role="status"
                className="w-full text-sm text-accent-ink"
                data-testid="offline-saved-message"
              >
                Chamada salva no aparelho. Será enviada quando a conexão
                retornar.
              </p>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
