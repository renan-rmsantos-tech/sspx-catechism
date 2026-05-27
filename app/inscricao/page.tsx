import { createSupabaseAdminClient } from '@/lib/supabase/server'
import EnrollmentForm from './enrollment-form'

async function getEnrollmentPeriod() {
  const supabase = createSupabaseAdminClient()
  const { data } = await supabase
    .from('academic_years')
    .select('enrollment_starts_at, enrollment_ends_at')
    .eq('is_active', true)
    .single()

  if (!data?.enrollment_starts_at || !data?.enrollment_ends_at) return false

  const today = new Date().toISOString().split('T')[0]
  return today >= data.enrollment_starts_at && today <= data.enrollment_ends_at
}

export default async function InscricaoPage() {
  const isOpen = await getEnrollmentPeriod()

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--bg)' }}
    >
      <header
        className="py-6 text-center"
        style={{ borderBottom: '1.5px solid var(--border)' }}
      >
        <h1
          className="text-2xl font-bold"
          style={{ color: 'var(--text-primary)' }}
        >
          Inscrição na Catequese
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Preencha o formulário abaixo para inscrever seu filho(a)
        </p>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-8">
        {isOpen ? (
          <EnrollmentForm />
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--accent-light)' }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h2
              className="text-xl font-bold"
              style={{ color: 'var(--text-primary)' }}
            >
              Inscrições encerradas
            </h2>
            <p
              className="text-sm max-w-md"
              style={{ color: 'var(--text-secondary)' }}
            >
              O período de inscrições para a catequese não está aberto no
              momento. Entre em contato com a coordenação da paróquia para mais
              informações.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
