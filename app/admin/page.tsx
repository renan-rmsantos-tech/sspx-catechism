import { logoutAction } from '@/app/(auth)/login/actions'

export default function AdminPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#FFFDF7]">
      <h1 className="text-2xl font-semibold text-[#1C1208]">Painel do Coordenador</h1>
      <p className="text-[#78716C]">Área administrativa — em construção.</p>
      <form action={logoutAction}>
        <button
          type="submit"
          className="rounded-lg border border-[#F5E6C0] px-4 py-2 text-sm text-[#78716C] hover:bg-[#FEF3C7]"
        >
          Sair
        </button>
      </form>
    </main>
  )
}
