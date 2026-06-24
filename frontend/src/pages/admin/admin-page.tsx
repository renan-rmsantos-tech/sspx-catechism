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
import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { Button } from '@/components/ui/button'
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

function fieldError(message?: string) {
  return message ? <p className="text-xs text-destructive">{message}</p> : null
}

function useAdminData() {
  const [years, setYears] = useState<AcademicYear[]>([])
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [catechists, setCatechists] = useState<Catechist[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [nextYears, nextClasses, nextCatechists] = await Promise.all([
        adminApi.listAcademicYears(),
        adminApi.listClasses(),
        adminApi.listCatechists(),
      ])
      setYears(nextYears)
      setClasses(nextClasses)
      setCatechists(nextCatechists)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  return { years, classes, catechists, isLoading, error, reload, setYears, setClasses, setCatechists }
}

export function AdminPage() {
  const { user, logout } = useAuth()
  const data = useAdminData()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Coordenação</p>
            <h1 className="text-2xl font-semibold text-foreground">Administração</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{user?.fullName}</span>
            <Button variant="outline" onClick={() => void logout()}>
              Sair
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[220px_1fr]">
        <nav className="flex gap-2 overflow-auto lg:flex-col">
          <AdminLink to="anos" icon={<GraduationCap />}>
            Anos
          </AdminLink>
          <AdminLink to="calendario" icon={<CalendarDays />}>
            Calendário
          </AdminLink>
          <AdminLink to="turmas" icon={<Layers />}>
            Turmas
          </AdminLink>
          <AdminLink to="alunos" icon={<Users />}>
            Alunos
          </AdminLink>
          <AdminLink to="catequistas" icon={<UserCheck />}>
            Catequistas
          </AdminLink>
          <AdminLink to="inscricoes" icon={<Check />}>
            Inscrições
          </AdminLink>
          <AdminLink to="relatorios" icon={<FileSpreadsheet />}>
            Relatórios
          </AdminLink>
        </nav>

        <main>
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

function AdminLink({ to, icon, children }: { to: string; icon: ReactNode; children: string }) {
  return (
    <NavLink
      to={`/admin/${to}`}
      className={({ isActive }) =>
        [
          'flex h-10 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors',
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'border border-border bg-card text-foreground hover:bg-muted',
        ].join(' ')
      }
    >
      <span className="[&_svg]:size-4">{icon}</span>
      {children}
    </NavLink>
  )
}

function AcademicYearsView({ data }: { data: ReturnType<typeof useAdminData> }) {
  const [editing, setEditing] = useState<AcademicYear | null>(null)
  const [message, setMessage] = useState<string | null>(null)
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
        await adminApi.updateAcademicYear(editing.id, payload)
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

  async function removeYear(id: string) {
    setMessage(null)
    try {
      await adminApi.deleteAcademicYear(id)
      await data.reload()
      setMessage('Ano letivo removido.')
    } catch (err) {
      setMessage(errorMessage(err))
    }
  }

  return (
    <Section title="Anos letivos">
      {message ? <Banner>{message}</Banner> : null}
      <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
        <Field label="Ano" error={form.formState.errors.year?.message}>
          <input className="input" type="number" {...form.register('year')} />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...form.register('isActive')} />
          Ano ativo
        </label>
        <div className="md:col-span-2">
          <p className="mb-2 text-sm font-medium">Dias de aula</p>
          <div className="grid gap-2 sm:grid-cols-4">
            {weekdays.map(([value, label]) => (
              <label key={value} className="flex items-center gap-2 text-sm">
                <input type="checkbox" value={value} {...form.register('classDays')} />
                {label}
              </label>
            ))}
          </div>
          {fieldError(form.formState.errors.classDays?.message)}
        </div>
        <Field label="Abertura das inscrições" error={form.formState.errors.enrollmentStartsAt?.message}>
          <input className="input" type="date" {...form.register('enrollmentStartsAt')} />
        </Field>
        <Field label="Encerramento das inscrições" error={form.formState.errors.enrollmentEndsAt?.message}>
          <input className="input" type="date" {...form.register('enrollmentEndsAt')} />
        </Field>
        <div className="flex gap-2 md:col-span-2">
          <Button type="submit">{editing ? 'Salvar ano' : 'Criar ano'}</Button>
          {editing ? (
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
          ) : null}
        </div>
      </form>

      <DataTable
        headers={['Ano', 'Dias', 'Inscrições', 'Status', 'Ações']}
        rows={data.years.map((year) => [
          year.year,
          year.classDays.join(', '),
          `${year.enrollmentStartsAt ?? '-'} até ${year.enrollmentEndsAt ?? '-'}`,
          year.isActive ? 'Ativo' : 'Inativo',
          <div className="flex gap-2" key={year.id}>
            <Button type="button" variant="outline" onClick={() => setEditing(year)}>
              Editar
            </Button>
            <IconButton label="Remover ano" onClick={() => void removeYear(year.id)}>
              <Trash2 />
            </IconButton>
          </div>,
        ])}
      />
    </Section>
  )
}

function CalendarView({ data }: { data: ReturnType<typeof useAdminData> }) {
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
        <Field label="Ano letivo" error={form.formState.errors.academicYearId?.message}>
          <select className="input" {...form.register('academicYearId')}>
            <option value="">Selecione</option>
            {data.years.map((year) => (
              <option key={year.id} value={year.id}>
                {year.year}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Datas (uma por linha)" error={form.formState.errors.datesText?.message}>
          <textarea className="input min-h-56 font-mono" {...form.register('datesText')} />
        </Field>
        <Button type="submit">Salvar calendário</Button>
      </form>
      <p className="mt-4 text-sm text-muted-foreground">
        Datas travadas por chamada: {lockedDates.length ? lockedDates.join(', ') : 'nenhuma'}
      </p>
    </Section>
  )
}

function ClassesView({ data }: { data: ReturnType<typeof useAdminData> }) {
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
      if (editing) {
        await adminApi.updateClass(editing.id, parsed)
        setEditing(null)
        setMessage('Turma atualizada.')
      } else {
        await adminApi.createClass(parsed)
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
        <Field label="Nome" error={form.formState.errors.name?.message}>
          <input className="input" {...form.register('name')} />
        </Field>
        <Field label="Ano letivo" error={form.formState.errors.academicYearId?.message}>
          <select className="input" {...form.register('academicYearId')}>
            <option value="">Selecione</option>
            {data.years.map((year) => (
              <option key={year.id} value={year.id}>
                {year.year}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Nível">
          <input className="input" {...form.register('level')} />
        </Field>
        <Field label="Horário">
          <input className="input" {...form.register('schedule')} />
        </Field>
        <div className="md:col-span-2">
          <p className="mb-2 text-sm font-medium">Catequistas</p>
          <div className="grid gap-2 md:grid-cols-3">
            {data.catechists.map((cat) => (
              <label key={cat.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" value={cat.id} {...form.register('catechistIds')} />
                {cat.fullName}
              </label>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...form.register('isArchived')} />
          Arquivada
        </label>
        <div className="flex gap-2 md:col-span-2">
          <Button type="submit">{editing ? 'Salvar turma' : 'Criar turma'}</Button>
          {editing ? (
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
          ) : null}
        </div>
      </form>
      <DataTable
        headers={['Turma', 'Ano', 'Catequistas', 'Status', 'Ações']}
        rows={data.classes.map((klass) => [
          klass.name,
          data.years.find((year) => year.id === klass.academicYearId)?.year ?? '-',
          klass.catechistIds
            .map((id) => data.catechists.find((cat) => cat.id === id)?.fullName ?? id)
            .join(', ') || '-',
          klass.isArchived ? 'Arquivada' : 'Ativa',
          <Button key={klass.id} type="button" variant="outline" onClick={() => setEditing(klass)}>
            Editar
          </Button>,
        ])}
      />
    </Section>
  )
}

function StudentsView({ data }: { data: ReturnType<typeof useAdminData> }) {
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
        <input
          className="input"
          aria-label="Buscar alunos"
          placeholder="Buscar por nome"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Button type="button" variant="outline" onClick={() => void search()}>
          <Search />
          Buscar
        </Button>
      </div>
      <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
        <Field label="Turma" error={form.formState.errors.classId?.message}>
          <select className="input" {...form.register('classId')}>
            <option value="">Selecione</option>
            {data.classes.map((klass) => (
              <option key={klass.id} value={klass.id}>
                {klass.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Nome completo" error={form.formState.errors.fullName?.message}>
          <input className="input" {...form.register('fullName')} />
        </Field>
        <Field label="Nascimento" error={form.formState.errors.birthDate?.message}>
          <input className="input" type="date" {...form.register('birthDate')} />
        </Field>
        <Field label="Cidade">
          <input className="input" {...form.register('city')} />
        </Field>
        <Field label="Telefone" error={form.formState.errors.guardianPhone?.message}>
          <input className="input" placeholder="(11) 99999-9999" {...form.register('guardianPhone')} />
        </Field>
        <Field label="E-mail" error={form.formState.errors.guardianEmail?.message}>
          <input className="input" type="email" {...form.register('guardianEmail')} />
        </Field>
        <Field label="Pai">
          <input className="input" {...form.register('guardianFatherName')} />
        </Field>
        <Field label="Mãe">
          <input className="input" {...form.register('guardianMotherName')} />
        </Field>
        <Field label="Catecismo anterior">
          <input className="input" {...form.register('previousCatechism')} />
        </Field>
        <Field label="Livros religiosos">
          <input className="input" {...form.register('religiousBooks')} />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...form.register('firstCommunion')} />
          Primeira comunhão
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...form.register('confirmation')} />
          Crisma
        </label>
        <div className="flex gap-2 md:col-span-2">
          <Button type="submit">{editing ? 'Salvar aluno' : 'Criar aluno'}</Button>
          {editing ? (
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
          ) : null}
        </div>
      </form>
      <DataTable
        headers={['Nome', 'Turma', 'Responsável', 'Contato', 'Ações']}
        rows={students.map((student) => [
          student.fullName,
          student.className ?? data.classes.find((klass) => klass.id === student.classId)?.name ?? '-',
          [student.guardianFatherName, student.guardianMotherName].filter(Boolean).join(' / ') || '-',
          [student.guardianPhone, student.guardianEmail].filter(Boolean).join(' / ') || '-',
          <Button key={student.id} type="button" variant="outline" onClick={() => setEditing(student)}>
            Editar
          </Button>,
        ])}
      />
    </Section>
  )
}

function CatechistsView({ data }: { data: ReturnType<typeof useAdminData> }) {
  const [message, setMessage] = useState<string | null>(null)
  const [created, setCreated] = useState<CreatedCatechist | null>(null)
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
    try {
      await adminApi.updateCatechist(id, payload)
      await data.reload()
    } catch (err) {
      setMessage(errorMessage(err))
    }
  }

  async function remove(id: string) {
    try {
      await adminApi.deleteCatechist(id)
      await data.reload()
    } catch (err) {
      setMessage(errorMessage(err))
    }
  }

  return (
    <Section title="Catequistas">
      {message ? <Banner>{message}</Banner> : null}
      {created ? (
        <Banner>
          Senha inicial de {created.fullName}: <strong>{created.password}</strong>
        </Banner>
      ) : null}
      <form className="grid gap-4 md:grid-cols-3" onSubmit={form.handleSubmit(onSubmit)}>
        <Field label="Nome" error={form.formState.errors.fullName?.message}>
          <input className="input" {...form.register('fullName')} />
        </Field>
        <Field label="E-mail" error={form.formState.errors.email?.message}>
          <input className="input" type="email" {...form.register('email')} />
        </Field>
        <div className="flex items-end">
          <Button type="submit">Criar catequista</Button>
        </div>
      </form>
      <DataTable
        headers={['Nome', 'E-mail', 'Papel', 'Status', 'Ações']}
        rows={data.catechists.map((cat) => [
          cat.fullName,
          cat.email,
          <select
            key={`${cat.id}-role`}
            className="input max-w-44"
            value={cat.role}
            onChange={(event) => void update(cat.id, { role: event.target.value })}
          >
            <option value="catechist">Catequista</option>
            <option value="coordinator">Coordenador</option>
          </select>,
          cat.isActive ? 'Ativo' : 'Inativo',
          <div className="flex gap-2" key={cat.id}>
            <Button
              type="button"
              variant="outline"
              onClick={() => void update(cat.id, { isActive: !cat.isActive })}
            >
              {cat.isActive ? 'Desativar' : 'Ativar'}
            </Button>
            <IconButton label="Remover catequista" onClick={() => void remove(cat.id)}>
              <Trash2 />
            </IconButton>
          </div>,
        ])}
      />
    </Section>
  )
}

function EnrollmentsView({ data }: { data: ReturnType<typeof useAdminData> }) {
  const [status, setStatus] = useState<EnrollmentStatus>('pending')
  const [query, setQuery] = useState('')
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [selected, setSelected] = useState<Enrollment | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const approveForm = useForm<ApproveEnrollmentFormValues>({
    resolver: zodResolver(approveEnrollmentSchema) as never,
    defaultValues: { classId: '', existingStudentId: '' },
  })

  const load = useCallback(async () => {
    try {
      const next = await adminApi.listEnrollments(status, query)
      setEnrollments(next)
      setSelected((current) => next.find((item) => item.id === current?.id) ?? next[0] ?? null)
    } catch (err) {
      setMessage(errorMessage(err))
    }
  }, [query, status])

  useEffect(() => {
    void load()
  }, [load])

  async function approve(values: ApproveEnrollmentFormValues) {
    if (!selected) return
    setMessage(null)
    try {
      const parsed = values as unknown as ApproveEnrollmentPayload
      await adminApi.approveEnrollment(selected.id, parsed)
      setMessage('Inscrição aprovada.')
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
        <select className="input" value={status} onChange={(event) => setStatus(event.target.value as EnrollmentStatus)}>
          <option value="pending">Pendentes</option>
          <option value="approved">Aprovadas</option>
          <option value="rejected">Rejeitadas</option>
        </select>
        <input
          className="input"
          aria-label="Buscar inscrições"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nome"
        />
        <Button type="button" variant="outline" onClick={() => void load()}>
          <Search />
          Buscar
        </Button>
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <DataTable
          headers={['Nome', 'Status', 'Renovação', 'Contato']}
          rows={enrollments.map((enrollment) => [
            <button
              key={enrollment.id}
              type="button"
              className="text-left font-medium underline-offset-2 hover:underline"
              onClick={() => setSelected(enrollment)}
            >
              {enrollment.fullName}
            </button>,
            enrollment.status,
            enrollment.isRenewal ? 'Sim' : 'Não',
            [enrollment.guardianPhone, enrollment.guardianEmail].filter(Boolean).join(' / ') || '-',
          ])}
        />
        <aside className="rounded-lg border border-border bg-card p-4">
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
                    <Field label="Turma" error={approveForm.formState.errors.classId?.message}>
                      <select className="input" {...approveForm.register('classId')}>
                        <option value="">Selecione</option>
                        {data.classes.map((klass) => (
                          <option key={klass.id} value={klass.id}>
                            {klass.name}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Aluno existente (opcional)">
                      <input className="input" {...approveForm.register('existingStudentId')} />
                    </Field>
                    <Button type="submit">
                      <Check />
                      Aprovar
                    </Button>
                  </form>
                  <RejectBox onReject={reject} />
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">
                  Revisada em {selected.reviewedAt ?? '-'}
                  {selected.rejectionReason ? `: ${selected.rejectionReason}` : ''}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Selecione uma inscrição.</p>
          )}
        </aside>
      </div>
    </Section>
  )
}

function RejectBox({ onReject }: { onReject: (reason: string) => Promise<void> }) {
  const [reason, setReason] = useState('')
  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium" htmlFor="rejectionReason">
        Motivo da rejeição
      </label>
      <textarea
        id="rejectionReason"
        className="input min-h-24"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
      />
      <Button type="button" variant="destructive" onClick={() => void onReject(reason)}>
        <X />
        Rejeitar
      </Button>
    </div>
  )
}

function ReportsView({ data }: { data: ReturnType<typeof useAdminData> }) {
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
        <Field label="Turma" error={form.formState.errors.classId?.message}>
          <select className="input" {...form.register('classId')}>
            <option value="">Selecione</option>
            {data.classes.map((klass) => (
              <option key={klass.id} value={klass.id}>
                {klass.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="De" error={form.formState.errors.from?.message}>
          <input className="input" type="date" {...form.register('from')} />
        </Field>
        <Field label="Até" error={form.formState.errors.to?.message}>
          <input className="input" type="date" {...form.register('to')} />
        </Field>
        <div className="flex items-end">
          <Button type="submit">Pré-visualizar</Button>
        </div>
      </form>
      <div className="mt-4 flex gap-2">
        <Button type="button" variant="outline" onClick={() => void download('pdf')}>
          <Download />
          PDF
        </Button>
        <Button type="button" variant="outline" onClick={() => void download('xlsx')}>
          <Download />
          XLSX
        </Button>
      </div>
      {report ? (
        <div className="mt-6 overflow-auto">
          <h3 className="mb-2 font-semibold">{report.className}</h3>
          <DataTable
            headers={['Aluno', 'Registros']}
            rows={report.students.map((student) => [
              student.full_name,
              `${student.records.filter((record) => record.present).length}/${student.records.length}`,
            ])}
          />
        </div>
      ) : null}
    </Section>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className="grid gap-1 text-sm font-medium">
      {label}
      {children}
      {fieldError(error)}
    </label>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <h2 className="mb-5 text-xl font-semibold">{title}</h2>
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

function DataTable({ headers, rows }: { headers: string[]; rows: ReactNode[][] }) {
  return (
    <div className="mt-6 overflow-auto rounded-md border border-border">
      <table className="min-w-full border-collapse text-sm">
        <thead className="bg-muted text-left">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-3 py-2 font-semibold">
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
                  <td key={cellIndex} className="px-3 py-2 align-top">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td className="px-3 py-5 text-center text-muted-foreground" colSpan={headers.length}>
                Nenhum registro encontrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
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
    <Button type="button" aria-label={label} title={label} variant="destructive" size="icon" onClick={onClick}>
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
