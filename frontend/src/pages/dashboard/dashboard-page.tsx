import { useEffect, useState } from "react";
import { NetworkChip } from "@/components/ui/network-chip";
import { useAuth } from "@/contexts/auth-context";
import { cacheClassDates } from "@/lib/class-dates-cache";
import { loadDashboardData, type DashboardData } from "@/lib/dashboard-api";
import {
  getPendingSessionCount,
  registerAttendanceSyncHandlers,
  syncPendingSessions,
} from "@/lib/attendance-sync";
import { DashboardView } from "@/pages/dashboard/dashboard-view";

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

  return (
    <DashboardView
      userName={user?.fullName ?? null}
      data={data}
      isLoading={isLoading}
      error={error}
      pendingCount={pendingCount}
      syncing={syncing}
      syncNotice={syncNotice}
      now={new Date()}
      networkStatus={<NetworkChip />}
      onSync={() => void syncNow()}
      onLogout={() => void logout()}
    />
  );
}
