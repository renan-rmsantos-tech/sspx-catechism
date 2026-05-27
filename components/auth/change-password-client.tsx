'use client'

import { useActionState, useTransition } from 'react'
import { changePasswordAction } from '@/app/(auth)/trocar-senha/actions'

export default function ChangePasswordClient() {
  const [state, formAction] = useActionState(changePasswordAction, null)
  const [isPending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(() => {
      formAction(formData)
    })
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FFFDF7]">
      <div className="w-full max-w-sm rounded-xl border border-[#F5E6C0] bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-2xl font-semibold text-[#1C1208]">Trocar Senha</h1>
        <p className="mb-6 text-sm text-[#78716C]">
          Você precisa criar uma nova senha antes de continuar.
        </p>

        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-medium text-[#1C1208]">
              Nova senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              className="rounded-lg border border-[#F5E6C0] px-3 py-2 text-sm outline-none focus:border-[#B45309] focus:ring-1 focus:ring-[#B45309]"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="confirm_password" className="text-sm font-medium text-[#1C1208]">
              Confirmar senha
            </label>
            <input
              id="confirm_password"
              name="confirm_password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              className="rounded-lg border border-[#F5E6C0] px-3 py-2 text-sm outline-none focus:border-[#B45309] focus:ring-1 focus:ring-[#B45309]"
              placeholder="Repita a nova senha"
            />
          </div>

          {state?.error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-[#DC2626]">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="mt-2 rounded-lg bg-[#B45309] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#78350F] disabled:opacity-60"
          >
            {isPending ? 'Salvando...' : 'Salvar nova senha'}
          </button>
        </form>
      </div>
    </main>
  )
}
