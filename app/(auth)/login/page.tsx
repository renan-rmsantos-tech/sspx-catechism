'use client'

import { useActionState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginFormData } from '@/lib/auth/schemas'
import { loginAction } from './actions'

export default function LoginPage() {
  const [state, formAction] = useActionState(loginAction, null)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  function onSubmit(data: LoginFormData) {
    const formData = new FormData()
    formData.set('email', data.email)
    formData.set('password', data.password)
    startTransition(() => {
      formAction(formData)
    })
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FFFDF7]">
      <div className="w-full max-w-sm rounded-xl border border-[#F5E6C0] bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-2xl font-semibold text-[#1C1208]">Entrar</h1>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium text-[#1C1208]">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register('email')}
              className="rounded-lg border border-[#F5E6C0] px-3 py-2 text-sm outline-none focus:border-[#B45309] focus:ring-1 focus:ring-[#B45309]"
              placeholder="seu@email.com"
            />
            {errors.email && (
              <p role="alert" className="text-xs text-[#DC2626]">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-medium text-[#1C1208]">
              Senha
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register('password')}
              className="rounded-lg border border-[#F5E6C0] px-3 py-2 text-sm outline-none focus:border-[#B45309] focus:ring-1 focus:ring-[#B45309]"
              placeholder="••••••••"
            />
            {errors.password && (
              <p role="alert" className="text-xs text-[#DC2626]">
                {errors.password.message}
              </p>
            )}
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
            {isPending ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </main>
  )
}
