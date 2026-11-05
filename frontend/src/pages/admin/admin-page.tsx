import { zodResolver } from '@hookform/resolvers/zod'
import {
  CalendarDays,
  Check,
  Download,
  FileSpreadsheet,
  GraduationCap,
  Layers,
  Search,
  Trash2,
  UserCheck,
  Users,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/chip'
import { NetworkChip } from '@/components/ui/network-chip'
import { Checkbox } from '@/components/ui/choice'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Drawer } from '@/components/ui/drawer'
import { EmptyState } from '@/components/ui/empty-state'
import { Field, Input, SearchField, Select, Textarea } from '@/components/ui/field'
import { BarChart, Meter, StatCard } from '@/components/ui/metrics'
import { Sidebar } from '@/components/ui/sidebar'
import { Table, TableWrap } from '@/components/ui/table'
import {
  adminApi,
  type AcademicYear,
  type AttendanceReport,
  type Catechist,
  type ClassItem,
  type CreatedCatechist,
  type Enrollment,
  type EnrollmentStatus,
  type Student,
} from '@/lib/admin-api'
import { ApiError } from '@/lib/api'
import { localToday } from '@/lib/dates'
import { useAuth } from '@/contexts/auth-context'
import {
  academicYearSchema,
  approveEnrollmentSchema,
  calendarSchema,
  catechistSchema,
  classSchema,
  reportSchema,
  splitDates,
  studentSchema,
  type AcademicYearFormValues,
  type AcademicYearPayload,
  type ApproveEnrollmentPayload,
  type ApproveEnrollmentFormValues,
  type CalendarFormValues,
  type CatechistFormValues,
  type ClassFormValues,
  type ClassPayload,
  type ReportFormValues,
  type StudentFormValues,
  type StudentPayload,
} from './schemas'

const weekdays = [
  ['0', 'Domingo'],
  ['1', 'Segunda'],
  ['2', 'Terça'],
  ['3', 'Quarta'],
  ['4', 'Quinta'],
  ['5', 'Sexta'],
  ['6', 'Sábado'],
] as const

function useAdminData() {
  const [years, setYears] = useState<AcademicYear[]>([])
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [catechists, setCatechists] = useState<Catechist[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingEnrollments, setPendingEnrollments] = useState(0)

  const reload = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [nextYears, nextClasses, nextCatechists, pending] = await Promise.all([
        adminApi.listAcademicYears(),
        adminApi.listClasses(),
        adminApi.listCatechists(),
        adminApi.listEnrollments('pending', ''),
      ])
      setYears(nextYears)
      setClasses(nextClasses)
      setCatechists(nextCatechists)
      setPendingEnrollments(pending.length)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  return { years, classes, catechists, pendingEnrollments, isLoading, error, reload, setYears, setClasses, setCatechists }
}

export function AdminPage() {
  const { user, logout } = useAuth()
  const data = useAdminData()

  return (
    <div className="min-h-screen bg-background lg:flex">
      <Sidebar
        brand={<div className="px-2"><p className="eyebrow">Coordenação</p><h1 className="text-xl font-semibold text-fg">Administração</h1></div>}
        groups={[
          { label: 'Planejamento', items: [{ label: 'Anos', to: '/admin/anos', icon: <GraduationCap /> }, { label: 'Calendário', to: '/admin/calendario', icon: <CalendarDays /> }] },
          { label: 'Pessoas', items: [{ label: 'Turmas', to: '/admin/turmas', icon: <Layers /> }, { label: 'Alunos', to: '/admin/alunos', icon: <Users /> }, { label: 'Catequistas', to: '/admin/catequistas', icon: <UserCheck /> }] },
          { label: 'Acompanhamento', items: [{ label: 'Inscrições', to: '/admin/inscricoes', icon: <Check />, badge: data.pendingEnrollments }, { label: 'Relatórios', to: '/admin/relatorios', icon: <FileSpreadsheet /> }] },
        ]}
        footer={<div className="grid gap-2 border-t border-border pt-3"><NetworkChip /><p className="truncate px-2 text-sm font-semibold text-fg">{user?.fullName}</p><Button variant="secondary" className="w-full" onClick={() => void logout()}>Sair</Button></div>}
      />
      <div className="min-w-0 flex-1">
      <main className="mx-auto max-w-[var(--container)] px-4 py-6 lg:px-8">
          {data.error ? <Banner tone="error">{data.error}</Banner> : null}
          {data.isLoading ? <Banner>Carregando dados administrativos...</Banner> : null}
          <Routes>
            <Route index element={<Navigate to="anos" replace />} />
            <Route path="anos" element={<AcademicYearsView data={data} />} />
            <Route path="calendario" element={<CalendarView data={data} />} />
            <Route path="turmas" element={<ClassesView data={data} />} />
            <Route path="alunos" element={<StudentsView data={data} />} />
            <Route path="catequistas" element={<CatechistsView data={data} />} />
            <Route path="inscricoes" element={<EnrollmentsView data={data} />} />
            <Route path="relatorios" element={<ReportsView data={data} />} />
          </Routes>
      </main>
      </div>
    </div>
  )
}

export function AcademicYearsView({ data }: { data: ReturnType<typeof useAdminData> }) {
  const [editing, setEditing] = useState<AcademicYear | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [pendingRemoval, setPendingRemoval] = useState<AcademicYear | null>(null)
  const form = useForm<AcademicYearFormValues>({
    resolver: zodResolver(academicYearSchema) as never,
    defaultValues: {
      year: new Date().getFullYear(),
      isActive: false,
      classDays: ['6'],
      enrollmentStartsAt: '',
      enrollmentEndsAt: '',
    },
  })

  useEffect(() => {
    if (!editing) return
    form.reset({
      year: editing.year,
      isActive: editing.isActive,
      classDays: editing.classDays.map(String),
      enrollmentStartsAt: editing.enrollmentStartsAt ?? '',
      enrollmentEndsAt: editing.enrollmentEndsAt ?? '',
    })
  }, [editing, form])

  async function onSubmit(values: AcademicYearFormValues) {
    setMessage(null)
    try {
      const payload = values as unknown as AcademicYearPayload
      if (editing) {
        // `year` é imutável e o backend rejeita campos desconhecidos no PATCH.
        const { year: _year, ...update } = payload
        await adminApi.updateAcademicYear(editing.id, update)
        setEditing(null)
        setMessage('Ano letivo atualizado.')
      } else {
        await adminApi.createAcademicYear(payload)
        setMessage('Ano letivo criado.')
      }
      form.reset({ year: new Date().getFullYear(), isActive: false, classDays: ['6'], enrollmentStartsAt: '', enrollmentEndsAt: '' })
      await data.reload()
    } catch (err) {
      setMessage(errorMessage(err))
    }
  }

  // Exclusão é destrutiva e imediata no servidor: passa pela confirmação
  // (BUG-20260724-remover-ano-sem-confirmacao).
  async function removeYear(year: AcademicYear) {
    setPendingRemoval(null)
    setMessage(null)
    try {
      await adminApi.deleteAcademicYear(year.id)
      await data.reload()
      setMessage(`Ano letivo ${year.year} removido.`)
    } catch (err) {
      setMessage(errorMessage(err))
    }
  }

  return (
    <Section title="Anos letivos">
      {message ? <Banner>{message}</Banner> : null}
      <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
        <Field id="academic-year" label="Ano" error={form.formState.errors.year?.message}>
          <Input id="academic-year" type="number" {...form.register('year')} />
        </Field>
        <Checkbox label="Ano ativo" {...form.register('isActive')} />
        <div className="md:col-span-2">
          <p className="mb-2 text-sm font-medium">Dias de aula</p>
          <div className="grid gap-2 sm:grid-cols-4">
            {weekdays.map(([value, label]) => (
              <Checkbox key={value} label={label} value={value} {...form.register('classDays')} />
            ))}
          </div>
          {form.formState.errors.classDays?.message ? <p role="alert" className="text-xs text-danger-ink">{form.formState.errors.classDays.message}</p> : null}
        </div>
        <Field id="enrollment-starts-at" label="Abertura das inscrições" error={form.formState.errors.enrollmentStartsAt?.message}>
          <Input id="enrollment-starts-at" type="date" {...form.register('enrollmentStartsAt')} />
        </Field>
        <Field id="enrollment-ends-at" label="Encerramento das inscrições" error={form.formState.errors.enrollmentEndsAt?.message}>
          <Input id="enrollment-ends-at" type="date" {...form.register('enrollmentEndsAt')} />
        </Field>
        <div className="flex gap-2 md:col-span-2">
          <Button type="submit">{editing ? 'Salvar ano' : 'Criar ano'}</Button>
          {editing ? (
            <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
          ) : null}
        </div>
      </form>

      <DataTable
        headers={['Ano', 'Dias', 'Inscrições', 'Status', 'Ações']}
        numericColumns={[0]}
        rows={data.years.map((year) => [
          year.year,
          year.classDays.join(', '),
          `${year.enrollmentStartsAt ?? '-'} até ${year.enrollmentEndsAt ?? '-'}`,
          year.isActive ? 'Ativo' : 'Inativo',
          <div className="flex gap-2" key={year.id}>
            <Button type="button" variant="secondary" onClick={() => setEditing(year)}>
              Editar
            </Button>
            <IconButton label={`Remover ano ${year.year}`} onClick={() => setPendingRemoval(year)}>
              <Trash2 />
            </IconButton>
          </div>,
        ])}
      />
      <ConfirmDialog
        open={pendingRemoval !== null}
        onOpenChange={(open) => !open && setPendingRemoval(null)}
        title={`Remover o ano letivo ${pendingRemoval?.year ?? ''}?`}
        description="Isso apaga os dias de aula e a janela de inscrição desse ano. Anos com turmas ou inscrições vinculadas não podem ser removidos."
        confirmLabel="Remover ano"
        onConfirm={() => pendingRemoval && void removeYear(pendingRemoval)}
      />
    </Section>
  )
}

export function CalendarView({ data }: { data: ReturnType<typeof useAdminData> }) {
  const [lockedDates, setLockedDates] = useState<string[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const form = useForm<CalendarFormValues>({
    resolver: zodResolver(calendarSchema) as never,
    defaultValues: { academicYearId: '', datesText: '' },
  })
  const selectedYear = form.watch('academicYearId')

  useEffect(() => {
    if (!selectedYear) return
    adminApi
      .getCalendar(selectedYear)
      .then((calendar) => {
        form.setValue('datesText', calendar.dates.join('\n'))
        setLockedDates(calendar.lockedDates)
      })
      .catch((err) => setMessage(errorMessage(err)))
  }, [form, selectedYear])

  async function onSubmit(values: CalendarFormValues) {
    setMessage(null)
    try {
      const parsed = calendarSchema.parse(values)
      await adminApi.updateCalendar(parsed.academicYearId, splitDates(parsed.datesText))
      setMessage('Calendário atualizado.')
      const next = await adminApi.getCalendar(parsed.academicYearId)
      setLockedDates(next.lockedDates)
    } catch (err) {
      setMessage(errorMessage(err))
    }
  }

  return (
    <Section title="Calendário de aulas">
      {message ? <Banner>{message}</Banner> : null}
      <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
        <Field id="calendar-academic-year" label="Ano letivo" error={form.formState.errors.academicYearId?.message}>
          <Select id="calendar-academic-year" {...form.register('academicYearId')}>
            <option value="">Selecione</option>
            {data.years.map((year) => (
              <option key={year.id} value={year.id}>
                {year.year}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="calendar-dates" label="Datas (uma por linha)" error={form.formState.errors.datesText?.message}>
          <Textarea id="calendar-dates" className="min-h-56 font-mono" {...form.register('datesText')} />
        </Field>
        <Button type="submit">Salvar calendário</Button>
      </form>
      <p className="mt-4 text-sm text-muted-foreground">
        Datas travadas por chamada: {lockedDates.length ? lockedDates.join(', ') : 'nenhuma'}
      </p>
      <CalendarGrid dates={splitDates(form.watch('datesText'))} />
    </Section>
  )
}

function CalendarGrid({ dates, highlights = {} }: { dates: string[]; highlights?: Record<string, string> }) {
  const year = Number(dates[0]?.slice(0, 4) ?? new Date().getFullYear())
  const today = localToday()
  return <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label={`Calendário de ${year}`}>
    {Array.from({ length: 12 }, (_, month) => {
      const first = new Date(year, month, 1)
      const days = new Date(year, month + 1, 0).getDate()
      return <section key={month} className="rounded-[var(--r)] border border-border p-3">
        <h3 className="mb-2 text-sm font-semibold capitalize">{first.toLocaleDateString('pt-BR', { month: 'long' })}</h3>
        <div className="grid grid-cols-7 gap-1 text-center text-xs">{Array.from({ length: first.getDay() }, (_, i) => <span key={`blank-${i}`} />)}{Array.from({ length: days }, (_, i) => {
          const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`
          return <span key={date} data-class-day={dates.includes(date) || undefined} data-highlight={highlights[date] || undefined} className={`num grid size-7 place-items-center rounded-full ${dates.includes(date) ? 'bg-accent-soft text-accent-ink' : ''} ${date === today ? 'ring-2 ring-accent' : ''} ${highlights[date] === 'gold' ? 'bg-gold-soft text-gold-ink' : ''}`}>{i + 1}</span>
        })}</div>
      </section>
    })}
  </div>
}

export function ClassesView({ data }: { data: ReturnType<typeof useAdminData> }) {
  const [editing, setEditing] = useState<ClassItem | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const form = useForm<ClassFormValues>({
    resolver: zodResolver(classSchema) as never,
    defaultValues: { name: '', academicYearId: '', level: '', schedule: '', catechistIds: [], isArchived: false },
  })

  useEffect(() => {
    if (!editing) return
    form.reset({
      id: editing.id,
      name: editing.name,
      academicYearId: editing.academicYearId,
      level: editing.level ?? '',
      schedule: editing.schedule ?? '',
      catechistIds: editing.catechistIds,
      isArchived: editing.isArchived,
    })
  }, [editing, form])

  async function onSubmit(values: ClassFormValues) {
    setMessage(null)
    try {
      const parsed = values as unknown as ClassPayload
      // O backend rejeita campos desconhecidos: o create não aceita `id` nem
      // `isArchived`; o update não aceita `id`.
      const { id: _id, isArchived, ...base } = parsed
      if (editing) {
        await adminApi.updateClass(editing.id, { ...base, isArchived })
        setEditing(null)
        setMessage('Turma atualizada.')
      } else {
        await adminApi.createClass(base)
        setMessage('Turma criada.')
      }
      form.reset({ name: '', academicYearId: '', level: '', schedule: '', catechistIds: [], isArchived: false })
      await data.reload()
    } catch (err) {
      setMessage(errorMessage(err))
    }
  }

  return (
    <Section title="Turmas">
      {message ? <Banner>{message}</Banner> : null}
      <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
        <Field id="class-name" label="Nome" error={form.formState.errors.name?.message}>
          <Input id="class-name" {...form.register('name')} />
        </Field>
        <Field id="class-academic-year" label="Ano letivo" error={form.formState.errors.academicYearId?.message}>
          <Select id="class-academic-year" {...form.register('academicYearId')}>
            <option value="">Selecione</option>
            {data.years.map((year) => (
              <option key={year.id} value={year.id}>
                {year.year}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="class-level" label="Nível">
          <Input id="class-level" {...form.register('level')} />
        </Field>
        <Field id="class-schedule" label="Horário">
          <Input id="class-schedule" {...form.register('schedule')} />
        </Field>
        <div className="md:col-span-2">
          <p className="mb-2 text-sm font-medium">Catequistas</p>
          <div className="grid gap-2 md:grid-cols-3">
            {/* Coordenadores também podem estar numa turma; a conta protegida do
                admin fica de fora. Quem foi promovido continua vinculável — antes
                sumia da lista e o vínculo era perdido ao salvar a turma. */}
            {data.catechists
              .filter((cat) => cat.role !== 'admin')
              .map((cat) => (
                <div key={cat.id} className="flex items-center gap-2">
                  <Checkbox id={`class-catechist-${cat.id}`} label={cat.fullName} value={cat.id} {...form.register('catechistIds')} />
                  {cat.role === 'coordinator' ? (
                    <span className="text-xs text-muted-foreground">(coordenador)</span>
                  ) : null}
                </div>
              ))}
          </div>
        </div>
        <Checkbox label="Arquivada" {...form.register('isArchived')} />
        <div className="flex gap-2 md:col-span-2">
          <Button type="submit">{editing ? 'Salvar turma' : 'Criar turma'}</Button>
          {editing ? (
            <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
          ) : null}
        </div>
      </form>
      <DataTable
        headers={['Turma', 'Ano', 'Catequistas', 'Status', 'Ações']}
        numericColumns={[1]}
        rows={data.classes.map((klass) => [
          klass.name,
          data.years.find((year) => year.id === klass.academicYearId)?.year ?? '-',
          klass.catechistIds
            .map((id) => data.catechists.find((cat) => cat.id === id)?.fullName ?? id)
            .join(', ') || '-',
          klass.isArchived ? 'Arquivada' : 'Ativa',
          <Button key={klass.id} type="button" variant="secondary" onClick={() => setEditing(klass)}>
            Editar
          </Button>,
        ])}
      />
    </Section>
  )
}

export function StudentsView({ data }: { data: ReturnType<typeof useAdminData> }) {
  const [students, setStudents] = useState<Student[]>([])
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<Student | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema) as never,
    defaultValues: studentDefaults(),
  })

  const search = useCallback(async () => {
    try {
      setStudents(await adminApi.searchStudents(query))
    } catch (err) {
      setMessage(errorMessage(err))
    }
  }, [query])

  useEffect(() => {
    void search()
  }, [search])

  useEffect(() => {
    if (!editing) return
    form.reset({
      id: editing.id,
      classId: editing.classId,
      fullName: editing.fullName,
      birthDate: editing.birthDate ?? '',
      city: editing.city ?? '',
      firstCommunion: editing.firstCommunion,
      confirmation: editing.confirmation,
      previousCatechism: editing.previousCatechism ?? '',
      religiousBooks: editing.religiousBooks ?? '',
      guardianFatherName: editing.guardianFatherName ?? '',
      guardianMotherName: editing.guardianMotherName ?? '',
      guardianPhone: editing.guardianPhone ?? '',
      guardianEmail: editing.guardianEmail ?? '',
    })
  }, [editing, form])

  async function onSubmit(values: StudentFormValues) {
    setMessage(null)
    try {
      const parsed = values as unknown as StudentPayload
      if (editing) {
        await adminApi.updateStudent(editing.id, parsed)
        setEditing(null)
        setMessage('Aluno atualizado.')
      } else {
        await adminApi.createStudent(parsed)
        setMessage('Aluno criado.')
      }
      form.reset(studentDefaults())
      await search()
    } catch (err) {
      setMessage(errorMessage(err))
    }
  }

  return (
    <Section title="Alunos">
      {message ? <Banner>{message}</Banner> : null}
      <div className="mb-6 flex gap-2">
        <SearchField
          aria-label="Buscar alunos"
          placeholder="Buscar por nome"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Button type="button" variant="secondary" onClick={() => void search()}>
          <Search />
          Buscar
        </Button>
      </div>
      <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
        <Field id="student-class" label="Turma" error={form.formState.errors.classId?.message}>
          <Select id="student-class" {...form.register('classId')}>
            <option value="">Selecione</option>
            {data.classes.map((klass) => (
              <option key={klass.id} value={klass.id}>
                {klass.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="student-name" label="Nome completo" error={form.formState.errors.fullName?.message}>
          <Input id="student-name" {...form.register('fullName')} />
        </Field>
        <Field id="student-birth-date" label="Nascimento" error={form.formState.errors.birthDate?.message}>
          <Input id="student-birth-date" type="date" {...form.register('birthDate')} />
        </Field>
        <Field id="student-city" label="Cidade">
          <Input id="student-city" {...form.register('city')} />
        </Field>
        <Field id="student-phone" label="Telefone" error={form.formState.errors.guardianPhone?.message}>
          <Input id="student-phone" placeholder="(11) 99999-9999" {...form.register('guardianPhone')} />
        </Field>
        <Field id="student-email" label="E-mail" error={form.formState.errors.guardianEmail?.message}>
          <Input id="student-email" type="email" {...form.register('guardianEmail')} />
        </Field>
        <Field id="student-father" label="Pai">
          <Input id="student-father" {...form.register('guardianFatherName')} />
        </Field>
        <Field id="student-mother" label="Mãe">
          <Input id="student-mother" {...form.register('guardianMotherName')} />
        </Field>
        <Field id="student-previous-catechism" label="Catecismo anterior">
          <Input id="student-previous-catechism" {...form.register('previousCatechism')} />
        </Field>
        <Field id="student-religious-books" label="Livros religiosos">
          <Input id="student-religious-books" {...form.register('religiousBooks')} />
        </Field>
        <Checkbox label="Primeira comunhão" {...form.register('firstCommunion')} />
        <Checkbox label="Crisma" {...form.register('confirmation')} />
        <div className="flex gap-2 md:col-span-2">
          <Button type="submit">{editing ? 'Salvar aluno' : 'Criar aluno'}</Button>
          {editing ? (
            <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
          ) : null}
        </div>
      </form>
      <DataTable
        headers={['Nome', 'Turma', 'Responsável', 'Contato', 'Ações']}
        numericColumns={[]}
        rows={students.map((student) => [
          student.fullName,
          student.className ?? data.classes.find((klass) => klass.id === student.classId)?.name ?? '-',
          [student.guardianFatherName, student.guardianMotherName].filter(Boolean).join(' / ') || '-',
          [student.guardianPhone, student.guardianEmail].filter(Boolean).join(' / ') || '-',
          <Button key={student.id} type="button" variant="secondary" onClick={() => setEditing(student)}>
            Editar
          </Button>,
        ])}
      />
    </Section>
  )
}

const roleLabels: Record<Catechist['role'], string> = {
  admin: 'Administrador',
  coordinator: 'Coordenador',
  catechist: 'Catequista',
}

export function CatechistsView({ data }: { data: ReturnType<typeof useAdminData> }) {
  const [message, setMessage] = useState<string | null>(null)
  const [created, setCreated] = useState<CreatedCatechist | null>(null)
  const [pendingRemoval, setPendingRemoval] = useState<Catechist | null>(null)
  const form = useForm<CatechistFormValues>({
    resolver: zodResolver(catechistSchema) as never,
    defaultValues: { email: '', fullName: '' },
  })

  async function onSubmit(values: CatechistFormValues) {
    setMessage(null)
    setCreated(null)
    try {
      const next = await adminApi.createCatechist(catechistSchema.parse(values))
      setCreated(next)
      form.reset({ email: '', fullName: '' })
      await data.reload()
    } catch (err) {
      setMessage(errorMessage(err))
    }
  }

  async function update(id: string, payload: { role?: string; isActive?: boolean }) {
    setMessage(null)
    try {
      await adminApi.updateCatechist(id, payload)
      await data.reload()
      if (payload.role) {
        setMessage(`Papel atualizado para ${roleLabels[payload.role as Catechist['role']] ?? payload.role}.`)
      }
    } catch (err) {
      setMessage(errorMessage(err))
    }
  }

  // Remoção é destrutiva: só acontece depois da confirmação explícita
  // (BUG-20260724-remover-ano-sem-confirmacao).
  async function remove(person: Catechist) {
    setPendingRemoval(null)
    setMessage(null)
    try {
      await adminApi.deleteCatechist(person.id)
      await data.reload()
      setMessage(`${person.fullName} foi removido.`)
    } catch (err) {
      setMessage(errorMessage(err))
    }
  }

  return (
    <Section title="Catequistas e coordenadores">
      {message ? <Banner>{message}</Banner> : null}
      {created ? (
        <Banner>
          Senha inicial de {created.fullName}: <strong>{created.password}</strong> — anote agora, ela não será exibida de novo.
        </Banner>
      ) : null}
      <form className="grid gap-4 md:grid-cols-3" onSubmit={form.handleSubmit(onSubmit)}>
        <Field id="catechist-name" label="Nome" error={form.formState.errors.fullName?.message}>
          <Input id="catechist-name" {...form.register('fullName')} />
        </Field>
        <Field id="catechist-email" label="E-mail" error={form.formState.errors.email?.message}>
          <Input id="catechist-email" type="email" {...form.register('email')} />
        </Field>
        <div className="flex items-end">
          <Button type="submit">Criar catequista</Button>
        </div>
      </form>
      <DataTable
        headers={['Nome', 'E-mail', 'Papel', 'Status', 'Ações']}
        numericColumns={[]}
        rows={data.catechists.map((cat) => [
          cat.fullName,
          cat.email,
          // O admin é protegido no servidor: mostra o papel, não oferece troca
          // (BUG-20260724-promovida-some-da-lista).
          cat.role === 'admin' ? (
            <span key={`${cat.id}-role`}>{roleLabels.admin}</span>
          ) : (
            <Select
              key={`${cat.id}-role`}
              className="max-w-44"
              aria-label={`Papel de ${cat.fullName}`}
              value={cat.role}
              onChange={(event) => void update(cat.id, { role: event.target.value })}
            >
              <option value="catechist">{roleLabels.catechist}</option>
              <option value="coordinator">{roleLabels.coordinator}</option>
            </Select>
          ),
          cat.isActive ? 'Ativo' : 'Inativo',
          cat.role === 'admin' ? (
            <span key={cat.id} className="text-sm text-muted-foreground">
              Conta protegida
            </span>
          ) : (
            <div className="flex gap-2" key={cat.id}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => void update(cat.id, { isActive: !cat.isActive })}
              >
                {cat.isActive ? 'Desativar' : 'Ativar'}
              </Button>
              <IconButton label={`Remover ${cat.fullName}`} onClick={() => setPendingRemoval(cat)}>
                <Trash2 />
              </IconButton>
            </div>
          ),
        ])}
      />
      <ConfirmDialog
        open={pendingRemoval !== null}
        onOpenChange={(open) => !open && setPendingRemoval(null)}
        title={`Remover ${pendingRemoval?.fullName ?? ''}?`}
        description="A pessoa perde o acesso ao sistema. Quem já registrou chamadas não pode ser removido — nesse caso, use Desativar."
        confirmLabel="Remover"
        onConfirm={() => pendingRemoval && void remove(pendingRemoval)}
      />
    </Section>
  )
}

export function EnrollmentsView({ data }: { data: ReturnType<typeof useAdminData> }) {
  const [status, setStatus] = useState<EnrollmentStatus>('pending')
  const [query, setQuery] = useState('')
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [selected, setSelected] = useState<Enrollment | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [renewalTarget, setRenewalTarget] = useState<Student | null>(null)
  const [pendingApproval, setPendingApproval] = useState<ApproveEnrollmentPayload | null>(null)
  const approveForm = useForm<ApproveEnrollmentFormValues>({
    resolver: zodResolver(approveEnrollmentSchema) as never,
    defaultValues: { classId: '', existingStudentId: '' },
  })

  const load = useCallback(async () => {
    try {
      const next = await adminApi.listEnrollments(status, query)
      setEnrollments(next)
      setSelected((current) => next.find((item) => item.id === current?.id) ?? null)
    } catch (err) {
      setMessage(errorMessage(err))
    }
  }, [query, status])

  useEffect(() => {
    void load()
  }, [load])

  function approve(values: ApproveEnrollmentFormValues) {
    if (!selected) return
    const parsed = values as unknown as ApproveEnrollmentPayload
    // Renovação SUBSTITUI o cadastro escolhido: a consequência precisa ser dita
    // antes de gravar (BUG-20260727-renovacao-sobrescreve-sem-aviso).
    if (parsed.existingStudentId) {
      setPendingApproval(parsed)
      return
    }
    void confirmApprove(parsed)
  }

  async function confirmApprove(parsed: ApproveEnrollmentPayload) {
    if (!selected) return
    setPendingApproval(null)
    setMessage(null)
    try {
      await adminApi.approveEnrollment(selected.id, parsed)
      setMessage(
        parsed.existingStudentId
          ? `Inscrição aprovada como renovação — o cadastro passou a ser ${selected.fullName}.`
          : 'Inscrição aprovada.',
      )
      setRenewalTarget(null)
      approveForm.reset({ classId: '', existingStudentId: '' })
      await load()
    } catch (err) {
      setMessage(errorMessage(err))
    }
  }

  async function reject(reason: string) {
    if (!selected) return
    setMessage(null)
    try {
      await adminApi.rejectEnrollment(selected.id, reason.trim() || null)
      setMessage('Inscrição rejeitada.')
      await load()
    } catch (err) {
      setMessage(errorMessage(err))
    }
  }

  return (
    <Section title="Revisão de inscrições">
      {message ? <Banner>{message}</Banner> : null}
      <div className="mb-4 grid gap-3 md:grid-cols-[180px_1fr_auto]">
        <Select aria-label="Status das inscrições" value={status} onChange={(event) => setStatus(event.target.value as EnrollmentStatus)}>
          <option value="pending">Pendentes</option>
          <option value="approved">Aprovadas</option>
          <option value="rejected">Rejeitadas</option>
        </Select>
        <SearchField
          aria-label="Buscar inscrições"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nome"
        />
        <Button type="button" variant="secondary" onClick={() => void load()}>
          <Search />
          Buscar
        </Button>
      </div>
      <div>
        <DataTable
          headers={['Nome', 'Status', 'Renovação', 'Contato']}
          numericColumns={[]}
          rows={enrollments.map((enrollment) => [
            <Button
              key={enrollment.id}
              type="button"
              variant="ghost"
              className="justify-start px-0 text-left font-medium underline-offset-2 hover:underline"
              onClick={() => setSelected(enrollment)}
            >
              {enrollment.fullName}
            </Button>,
            <EnrollmentStatusChip key={`${enrollment.id}-status`} status={enrollment.status} />,
            enrollment.isRenewal ? <Chip key={`${enrollment.id}-renewal`} tone="gold">Renovação</Chip> : '—',
            [enrollment.guardianPhone, enrollment.guardianEmail].filter(Boolean).join(' / ') || '-',
          ])}
        />
        <Drawer open={selected !== null} onOpenChange={(open) => !open && setSelected(null)} title={selected?.fullName ?? 'Revisão da inscrição'} description="Confira os dados e decida a partir desta fila." footer={null}>
          {selected ? (
            <>
              <h3 className="text-lg font-semibold">{selected.fullName}</h3>
              <dl className="mt-3 grid gap-2 text-sm">
                <Info label="Nascimento" value={selected.birthDate ?? '-'} />
                <Info label="Cidade" value={selected.city ?? '-'} />
                <Info label="Catecismo anterior" value={selected.previousCatechism ?? '-'} />
                <Info label="Responsáveis" value={[selected.guardianFatherName, selected.guardianMotherName].filter(Boolean).join(' / ') || '-'} />
              </dl>
              {selected.status === 'pending' ? (
                <div className="mt-5 grid gap-5">
                  <form className="grid gap-3" onSubmit={approveForm.handleSubmit(approve)}>
                    <Field id="approval-class" label="Turma" error={approveForm.formState.errors.classId?.message}>
                      <Select id="approval-class" {...approveForm.register('classId')}>
                        <option value="">Selecione</option>
                        {data.classes.map((klass) => (
                          <option key={klass.id} value={klass.id}>
                            {klass.name}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <StudentPicker
                      value={approveForm.watch('existingStudentId') ?? ''}
                      onChange={(student) => {
                        setRenewalTarget(student)
                        approveForm.setValue('existingStudentId', student?.id ?? '')
                      }}
                    />
                    <Button type="submit">
                      <Check />
                      Aprovar
                    </Button>
                  </form>
                  <RejectBox onReject={reject} />
                </div>
              ) : (
                // Inscrição processada abre em leitura: o motivo da rejeição
                // precisa ser consultável depois (BUG-20260725-motivo-rejeicao-invisivel).
                <dl className="mt-5 grid gap-2 text-sm" data-testid="enrollment-readonly">
                  <Info
                    label="Situação"
                    value={selected.status === 'approved' ? 'Aprovada' : 'Rejeitada'}
                  />
                  <Info label="Revisada em" value={formatReviewedAt(selected.reviewedAt)} />
                  {selected.status === 'approved' ? (
                    <Info
                      label="Turma"
                      value={
                        data.classes.find((klass) => klass.id === selected.approvedClassId)?.name ??
                        'Turma removida'
                      }
                    />
                  ) : (
                    <Info label="Motivo da rejeição" value={selected.rejectionReason ?? 'Não informado'} />
                  )}
                </dl>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Selecione uma inscrição.</p>
          )}
        </Drawer>
        <ConfirmDialog
          open={pendingApproval !== null}
          onOpenChange={(open) => !open && setPendingApproval(null)}
          title="Substituir o cadastro deste aluno?"
          description={
            <>
              O cadastro de <strong>{renewalTarget?.fullName ?? 'aluno selecionado'}</strong>
              {renewalTarget?.className ? ` (${renewalTarget.className})` : ''} será substituído pelos
              dados desta inscrição (<strong>{selected?.fullName}</strong>)
              {(() => {
                const klass = data.classes.find((item) => item.id === pendingApproval?.classId)
                return klass ? <> e movido para <strong>{klass.name}</strong></> : null
              })()}
              . As presenças já registradas continuam nesse cadastro. Se não for a mesma criança,
              cancele e aprove sem vincular.
            </>
          }
          confirmLabel="Substituir e aprovar"
          onConfirm={() => pendingApproval && void confirmApprove(pendingApproval)}
        />
      </div>
    </Section>
  )
}

function formatReviewedAt(value: string | null) {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('pt-BR')
}

function EnrollmentStatusChip({ status }: { status: EnrollmentStatus }) {
  const labels: Record<EnrollmentStatus, { label: string; tone: 'warn' | 'ok' | 'danger' }> = {
    pending: { label: 'Pendente', tone: 'warn' },
    approved: { label: 'Aprovada', tone: 'ok' },
    rejected: { label: 'Rejeitada', tone: 'danger' },
  }
  const { label, tone } = labels[status]
  return <Chip tone={tone}>{label}</Chip>
}

// Renovação: o coordenador conhece o NOME do aluno, nunca o uuid interno
// (BUG-20260725-renovacao-exige-uuid).
function StudentPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (student: Student | null) => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Student[]>([])
  const [selected, setSelected] = useState<Student | null>(null)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!value) setSelected(null)
  }, [value])

  async function search() {
    if (!query.trim()) return
    setSearching(true)
    setError(null)
    try {
      setResults(await adminApi.searchStudents(query.trim()))
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSearching(false)
    }
  }

  function pick(student: Student) {
    setSelected(student)
    onChange(student)
    setResults([])
    setQuery('')
  }

  if (selected) {
    return (
      <div className="grid gap-2" data-testid="student-picker">
        <p className="text-sm font-medium">Renovação de aluno já cadastrado</p>
        <div className="flex items-center justify-between gap-3 rounded-[var(--r)] border border-border bg-surface-2 p-3 text-sm">
          <span>
            <strong>{selected.fullName}</strong>
            {selected.className ? <span className="text-muted-foreground"> · {selected.className}</span> : null}
          </span>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setSelected(null)
              onChange(null)
            }}
          >
            Trocar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-2" data-testid="student-picker">
      <label className="text-sm font-medium" htmlFor="student-search">
        Aluno já cadastrado (opcional — para renovação)
      </label>
      <div className="flex gap-2">
        <Input
          id="student-search"
          value={query}
          placeholder="Buscar pelo nome"
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              void search()
            }
          }}
        />
        <Button type="button" variant="secondary" disabled={!query.trim() || searching} disabledReason={searching ? 'Buscando…' : 'Digite um nome'} onClick={() => void search()}>
          <Search />
          Buscar
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {results.length > 0 ? (
        <ul className="grid gap-1">
          {results.map((student) => (
            <li key={student.id}>
              <Button
                type="button"
                variant="secondary"
                className="w-full justify-start text-left"
                onClick={() => pick(student)}
              >
                {student.fullName}
                {student.className ? <span className="text-muted-foreground"> · {student.className}</span> : null}
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
      {!searching && results.length === 0 && query.trim() === '' ? (
        <p className="text-xs text-muted-foreground">
          Deixe em branco para criar um cadastro novo.
        </p>
      ) : null}
    </div>
  )
}

function RejectBox({ onReject }: { onReject: (reason: string) => Promise<void> }) {
  const [reason, setReason] = useState('')
  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium" htmlFor="rejectionReason">
        Motivo da rejeição
      </label>
      <Textarea
        id="rejectionReason"
        className="min-h-24"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
      />
      <Button type="button" variant="danger" disabled={!reason.trim()} disabledReason="Informe o motivo" onClick={() => void onReject(reason)}>
        <X />
        Rejeitar
      </Button>
    </div>
  )
}

export function ReportsView({ data }: { data: ReturnType<typeof useAdminData> }) {
  const [report, setReport] = useState<AttendanceReport | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema) as never,
    defaultValues: { classId: '', from: '', to: '' },
  })

  async function preview(values: ReportFormValues) {
    setMessage(null)
    try {
      const parsed = reportSchema.parse(values)
      setReport(await adminApi.getAttendanceReport(parsed.classId, parsed.from, parsed.to))
    } catch (err) {
      setMessage(errorMessage(err))
    }
  }

  async function download(format: 'pdf' | 'xlsx') {
    const parsed = reportSchema.safeParse(form.getValues())
    if (!parsed.success) {
      await form.trigger()
      return
    }
    setMessage(null)
    try {
      const file = await adminApi.downloadAttendanceReport(parsed.data.classId, parsed.data.from, parsed.data.to, format)
      const url = URL.createObjectURL(file.blob)
      const link = document.createElement('a')
      link.href = url
      link.download = file.filename
      link.click()
      URL.revokeObjectURL(url)
      setMessage(`Relatório ${format.toUpperCase()} gerado.`)
    } catch (err) {
      setMessage(errorMessage(err))
    }
  }

  return (
    <Section title="Relatórios de presença">
      {message ? <Banner>{message}</Banner> : null}
      <form className="grid gap-4 md:grid-cols-[1fr_180px_180px_auto]" onSubmit={form.handleSubmit(preview)}>
        <Field id="report-class" label="Turma" error={form.formState.errors.classId?.message}>
          <Select id="report-class" {...form.register('classId')}>
            <option value="">Selecione</option>
            {data.classes.map((klass) => (
              <option key={klass.id} value={klass.id}>
                {klass.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="report-from" label="De" error={form.formState.errors.from?.message}>
          <Input id="report-from" type="date" {...form.register('from')} />
        </Field>
        <Field id="report-to" label="Até" error={form.formState.errors.to?.message}>
          <Input id="report-to" type="date" {...form.register('to')} />
        </Field>
        <div className="flex items-end">
          <Button type="submit">Pré-visualizar</Button>
        </div>
      </form>
      <div className="mt-4 flex gap-2">
        <Button type="button" variant="secondary" onClick={() => void download('pdf')}>
          <Download />
          PDF
        </Button>
        <Button type="button" variant="secondary" onClick={() => void download('xlsx')}>
          <Download />
          XLSX
        </Button>
      </div>
      {report ? (
        <div className="mt-6 grid gap-6">
          <h3 className="mb-2 font-semibold">{report.className}</h3>
          {(() => {
            const records = report.records ?? []
            const sessions = report.sessions ?? []
            const presentsByStudent = (id: string) =>
              records.filter((record) => record.student_id === id && record.present).length
            const total = records.length
            const present = records.filter((record) => record.present).length
            const percentage = total ? Math.round((present / total) * 100) : 0
            const bars = report.students.map((student) => ({ label: student.full_name.split(' ')[0], value: presentsByStudent(student.id) }))
            return <><div className="grid gap-3 sm:grid-cols-3"><StatCard value={report.students.length} label="Catequizandos" /><StatCard value={present} label="Presenças" /><StatCard value={percentage} unit="%" label="Frequência" /></div><Meter percent={percentage} label="Frequência da turma" /><BarChart data={bars} label={`Presenças por catequizando: ${bars.map((bar) => `${bar.label} ${bar.value}`).join(', ')}`} /><DataTable
            headers={['Aluno', 'Presenças']}
            numericColumns={[1]}
            rows={report.students.map((student) => [
              student.full_name,
              `${presentsByStudent(student.id)}/${sessions.length}`,
            ])}
          /></>
          })()}
        </div>
      ) : null}
    </Section>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const id = `admin-${title.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`
  return (
    <section data-od-id={id} className="rounded-[var(--r-lg)] border border-border bg-surface p-5 shadow-1">
      <h2 data-od-id={`${id}-heading`} className="mb-5 text-xl font-semibold">{title}</h2>
      {children}
    </section>
  )
}

function Banner({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'error' }) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={[
        'mb-4 rounded-md border px-3 py-2 text-sm',
        tone === 'error'
          ? 'border-destructive/30 bg-destructive/10 text-destructive'
          : 'border-border bg-muted text-foreground',
      ].join(' ')}
    >
      {children}
    </div>
  )
}

function DataTable({ headers, numericColumns = [], rows }: { headers: string[]; numericColumns?: readonly number[]; rows: ReactNode[][] }) {
  return (
    <TableWrap className="mt-6">
      <Table numericColumns={numericColumns}>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row, index) => (
              <tr key={index} className="border-t border-border">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="align-top">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td className="py-5" colSpan={headers.length}>
                <EmptyState title="Ainda não há registros" description="Use o formulário acima para criar o primeiro registro desta lista." />
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </TableWrap>
  )
}

function IconButton({
  label,
  children,
  onClick,
}: {
  label: string
  children: ReactNode
  onClick: () => void
}) {
  return (
    <Button type="button" aria-label={label} title={label} variant="danger" size="icon" onClick={onClick}>
      {children}
    </Button>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-medium">{label}</dt>
      <dd className="text-muted-foreground">{value}</dd>
    </div>
  )
}

function studentDefaults(): StudentFormValues {
  return {
    classId: '',
    fullName: '',
    birthDate: '',
    city: '',
    firstCommunion: false,
    confirmation: false,
    previousCatechism: '',
    religiousBooks: '',
    guardianFatherName: '',
    guardianMotherName: '',
    guardianPhone: '',
    guardianEmail: '',
  }
}

function errorMessage(error: unknown) {
  if (error instanceof ApiError || error instanceof Error) return error.message
  return 'erro ao comunicar com o servidor'
}
