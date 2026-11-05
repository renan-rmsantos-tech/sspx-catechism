import { useEffect, useState } from "react";
import { NetworkStatusChip } from "@/components/ui/chip";
import { getPendingSessionCount } from "@/lib/attendance-sync";

/** Chip de rede ligado ao aparelho: conexão do navegador e fila de chamadas offline. */
export function NetworkChip({ className }: { className?: string }) {
  const [online, setOnline] = useState(
    () => typeof navigator === "undefined" || navigator.onLine,
  );
  const [pending, setPending] = useState(0);
  useEffect(() => {
    const refresh = () =>
      void getPendingSessionCount()
        .then(setPending)
        .catch(() => undefined);
    const goOnline = () => {
      setOnline(true);
      refresh();
    };
    const goOffline = () => {
      setOnline(false);
      refresh();
    };
    refresh();
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);
  return (
    <NetworkStatusChip className={className} online={online} pending={pending} />
  );
}
