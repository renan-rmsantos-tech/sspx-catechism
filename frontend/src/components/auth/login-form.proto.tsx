import { definePrototype, type PrototypeProps } from "@compozy/proto";
import { LoginForm } from "./login-form";
import { pendingAttendance, rateLimitedError } from "./login-form.fixtures";

export const meta = definePrototype({
  title: "Login",
  spec: "acesso",
  route: "/login",
  states: [
    { id: "padrao", label: "Primeiro acesso" },
    { id: "chamadas-guardadas", label: "Chamadas guardadas no aparelho" },
    { id: "muitas-tentativas", label: "Muitas tentativas" },
  ],
});

export default function Prototype({ state }: PrototypeProps) {
  return (
    <LoginForm
      error={state === "muitas-tentativas" ? rateLimitedError : null}
      isSubmitting={false}
      pendingAttendance={state === "chamadas-guardadas" ? pendingAttendance : 0}
      onSubmit={() => {}}
    />
  );
}
