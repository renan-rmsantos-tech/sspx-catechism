import { definePrototype, type PrototypeProps } from "@compozy/proto";
import { NetworkStatusChip } from "@/components/ui/chip";
import { DashboardView } from "./dashboard-view";
import {
  catechistName,
  dashboard,
  loadError,
  noClasses,
  pendingSessions,
  saturdayMorning,
  wednesday,
} from "./dashboard-view.fixtures";

export const meta = definePrototype({
  title: "Minhas turmas",
  spec: "catequista",
  route: "/dashboard",
  states: [
    { id: "dia-de-aula", label: "Dia de aula, chamada pendente" },
    { id: "offline", label: "Offline com chamadas na fila" },
    { id: "sem-aula", label: "Dia sem aula" },
    { id: "sem-turmas", label: "Sem turma atribuída" },
    { id: "erro", label: "Falha ao carregar" },
  ],
});

export default function Prototype({ state }: PrototypeProps) {
  const offline = state === "offline";
  const queued = offline ? pendingSessions : 0;
  return (
    <DashboardView
      userName={catechistName}
      data={state === "erro" ? null : state === "sem-turmas" ? noClasses : dashboard}
      isLoading={false}
      error={state === "erro" ? loadError : null}
      pendingCount={queued}
      syncing={false}
      syncNotice={null}
      now={state === "sem-aula" ? wednesday : saturdayMorning}
      networkStatus={<NetworkStatusChip online={!offline} pending={queued} />}
      onSync={() => {}}
      onLogout={() => {}}
    />
  );
}
