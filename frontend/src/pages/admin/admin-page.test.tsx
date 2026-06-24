import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { App } from '@/App'

const adminUser = {
  id: 'admin-1',
  email: 'admin@example.com',
  fullName: 'Admin',
  role: 'admin',
  mustChangePassword: false,
}

const year = {
  id: 'year-1',
  year: 2026,
  isActive: true,
  classDays: [6],
  enrollmentStartsAt: '2026-01-01',
  enrollmentEndsAt: '2026-02-01',
}

const klass = {
  id: 'class-1',
  academicYearId: 'year-1',
  name: 'Primeira Comunhão',
  level: null,
  schedule: 'Sábado',
  isArchived: false,
  catechistIds: ['cat-1'],
}

const catechist = {
  id: 'cat-1',
  email: 'cat@example.com',
  fullName: 'Catequista Um',
  role: 'catechist',
  isActive: true,
  mustChangePassword: true,
}

const student = {
  id: 'student-1',
  classId: 'class-1',
  className: 'Primeira Comunhão',
  fullName: 'Ana Clara',
  birthDate: null,
  city: 'São Paulo',
  firstCommunion: false,
  confirmation: false,
  previousCatechism: null,
  religiousBooks: null,
  guardianFatherName: 'João',
  guardianMotherName: 'Maria',
  guardianPhone: '(11) 99999-9999',
  guardianEmail: 'mae@example.com',
  isActive: true,
}

const enrollment = {
  id: 'enrollment-1',
  academicYearId: 'year-1',
  status: 'pending',
  fullName: 'Pedro Santos',
  birthDate: '2018-01-01',
  city: 'São Paulo',
  firstCommunion: false,
  confirmation: false,
  previousCatechism: null,
  religiousBooks: null,
  guardianFatherName: 'Carlos',
  guardianMotherName: 'Paula',
  guardianPhone: '(11) 98888-7777',
  guardianEmail: 'paula@example.com',
  isRenewal: false,
  previousName: null,
  rejectionReason: null,
  approvedClassId: null,
  approvedStudentId: null,
  reviewedBy: null,
  reviewedAt: null,
  createdAt: '2026-01-02T10:00:00Z',
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

function fileResponse() {
  return new Response(new Blob(['file']), {
    status: 200,
    headers: { 'content-disposition': 'attachment; filename="relatorio.pdf"' },
  })
}

function setupFetch() {
  const calls: Array<{ path: string; init?: RequestInit }> = []
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = String(input)
    calls.push({ path, init })
    if (path === '/api/auth/me') return jsonResponse(adminUser)
    if (path === '/api/academic-years' && init?.method === 'POST') {
      return jsonResponse({ ...year, id: 'year-2', year: JSON.parse(String(init.body)).year }, 201)
    }
    if (path === '/api/academic-years/year-1' && init?.method === 'PATCH') {
      return jsonResponse({ ...year, ...JSON.parse(String(init.body)) })
    }
    if (path === '/api/academic-years/year-1' && init?.method === 'DELETE') {
      return jsonResponse({ status: 'ok' })
    }
    if (path === '/api/class-dates?academicYearId=year-1') {
      return jsonResponse({ dates: ['2026-03-07'], lockedDates: [] })
    }
    if (path === '/api/class-dates') return jsonResponse({ count: 2 })
    if (path === '/api/academic-years') return jsonResponse([year])
    if (path === '/api/classes' && init?.method === 'POST') {
      return jsonResponse({ ...klass, ...JSON.parse(String(init.body)), id: 'class-2' }, 201)
    }
    if (path === '/api/classes') return jsonResponse([klass])
    if (path === '/api/catechists' && init?.method === 'POST') {
      return jsonResponse({ id: 'cat-2', ...JSON.parse(String(init.body)), password: 'abc12345' }, 201)
    }
    if (path.startsWith('/api/catechists/cat-1')) return jsonResponse({ ...catechist, isActive: false })
    if (path === '/api/catechists') return jsonResponse([catechist])
    if (path === '/api/students' && init?.method === 'POST') {
      return jsonResponse({ ...student, ...JSON.parse(String(init.body)), id: 'student-2' }, 201)
    }
    if (path.startsWith('/api/students?')) return jsonResponse([student])
    if (path.startsWith('/api/enrollments/enrollment-1/approve')) {
      return jsonResponse({ ...enrollment, status: 'approved', approvedClassId: 'class-1' })
    }
    if (path.startsWith('/api/enrollments/enrollment-1/reject')) {
      return jsonResponse({ ...enrollment, status: 'rejected', rejectionReason: 'Documentos pendentes' })
    }
    if (path.startsWith('/api/enrollments?')) return jsonResponse([enrollment])
    if (path.includes('/api/reports/attendance') && path.includes('format=json')) {
      return jsonResponse({
        className: 'Primeira Comunhão',
        from: '2026-01-01',
        to: '2026-01-31',
        students: [{
          id: 'student-1',
          full_name: 'Ana Clara',
          records: [{ session_id: 's1', student_id: 'student-1', date: '2026-01-07', present: true }],
        }],
      })
    }
    if (path.includes('/api/reports/attendance') && path.includes('format=pdf')) return fileResponse()
    if (path.includes('/api/reports/attendance') && path.includes('format=xlsx')) return fileResponse()
    return jsonResponse({ status: 'ok' })
  })
  vi.stubGlobal('fetch', fetchMock)
  vi.stubGlobal('URL', {
    ...URL,
    createObjectURL: vi.fn(() => 'blob:report'),
    revokeObjectURL: vi.fn(),
  })
  return { fetchMock, calls }
}

function renderAdmin(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

describe('AdminPage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('validates and submits academic year forms to the admin API', async () => {
    const { calls } = setupFetch()
    renderAdmin('/admin/anos')

    await screen.findByRole('heading', { name: 'Anos letivos' })
    await screen.findByText('2026')
    fireEvent.change(screen.getByLabelText('Ano'), { target: { value: '2027' } })
    fireEvent.click(screen.getByRole('button', { name: 'Criar ano' }))

    await waitFor(() =>
      expect(calls.some((call) => call.path === '/api/academic-years' && call.init?.method === 'POST')).toBe(true),
    )
    const post = calls.find((call) => call.path === '/api/academic-years' && call.init?.method === 'POST')
    expect(JSON.parse(String(post?.init?.body))).toMatchObject({ year: 2027, isActive: false, classDays: [6] })
  })

  it('edits and removes academic years', async () => {
    const { calls } = setupFetch()
    renderAdmin('/admin/anos')

    await screen.findByRole('heading', { name: 'Anos letivos' })
    fireEvent.click(await screen.findByRole('button', { name: 'Editar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Salvar ano' }))
    await waitFor(() => expect(calls.some((call) => call.path === '/api/academic-years/year-1' && call.init?.method === 'PATCH')).toBe(true))

    fireEvent.click(screen.getByRole('button', { name: 'Remover ano' }))
    await waitFor(() => expect(calls.some((call) => call.path === '/api/academic-years/year-1' && call.init?.method === 'DELETE')).toBe(true))
  })

  it('searches students through q and renders the result list', async () => {
    const { calls } = setupFetch()
    renderAdmin('/admin/alunos')

    await screen.findByRole('heading', { name: 'Alunos' })
    fireEvent.change(screen.getByLabelText('Buscar alunos'), { target: { value: 'ana' } })
    fireEvent.click(screen.getByRole('button', { name: /buscar/i }))

    await screen.findByText('Ana Clara')
    expect(calls.some((call) => call.path === '/api/students?q=ana')).toBe(true)
  })

  it('updates calendar dates for the selected academic year', async () => {
    const { calls } = setupFetch()
    renderAdmin('/admin/calendario')

    await screen.findByRole('heading', { name: 'Calendário de aulas' })
    fireEvent.change(screen.getByLabelText('Ano letivo'), { target: { value: 'year-1' } })
    await screen.findByDisplayValue('2026-03-07')
    fireEvent.change(screen.getByLabelText('Datas (uma por linha)'), {
      target: { value: '2026-03-07\n2026-03-14' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar calendário' }))

    await waitFor(() => expect(calls.some((call) => call.path === '/api/class-dates')).toBe(true))
    const put = calls.find((call) => call.path === '/api/class-dates')
    expect(JSON.parse(String(put?.init?.body))).toEqual({
      academicYearId: 'year-1',
      dates: ['2026-03-07', '2026-03-14'],
    })
  })

  it('creates classes with linked catechists', async () => {
    const { calls } = setupFetch()
    renderAdmin('/admin/turmas')

    await screen.findByRole('heading', { name: 'Turmas' })
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Perseverança' } })
    fireEvent.change(screen.getByLabelText('Ano letivo'), { target: { value: 'year-1' } })
    fireEvent.change(screen.getByLabelText('Nível'), { target: { value: 'Nível 2' } })
    fireEvent.click(await screen.findByLabelText('Catequista Um'))
    fireEvent.click(screen.getByRole('button', { name: 'Criar turma' }))

    await waitFor(() => expect(calls.some((call) => call.path === '/api/classes' && call.init?.method === 'POST')).toBe(true))
    const post = calls.find((call) => call.path === '/api/classes' && call.init?.method === 'POST')
    expect(JSON.parse(String(post?.init?.body))).toMatchObject({
      name: 'Perseverança',
      academicYearId: 'year-1',
      level: 'Nível 2',
      catechistIds: ['cat-1'],
    })
  })

  it('creates students with validated contact data', async () => {
    const { calls } = setupFetch()
    renderAdmin('/admin/alunos')

    await screen.findByRole('heading', { name: 'Alunos' })
    fireEvent.change(screen.getByLabelText('Turma'), { target: { value: 'class-1' } })
    fireEvent.change(screen.getByLabelText('Nome completo'), { target: { value: 'Lucas Silva' } })
    fireEvent.change(screen.getByLabelText('Telefone'), { target: { value: '(11) 99999-0000' } })
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'lucas@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Criar aluno' }))

    await waitFor(() => expect(calls.some((call) => call.path === '/api/students' && call.init?.method === 'POST')).toBe(true))
    const post = calls.find((call) => call.path === '/api/students' && call.init?.method === 'POST')
    expect(JSON.parse(String(post?.init?.body))).toMatchObject({
      classId: 'class-1',
      fullName: 'Lucas Silva',
      guardianPhone: '(11) 99999-0000',
      guardianEmail: 'lucas@example.com',
    })
  })

  it('creates and deactivates catechists while showing the generated password once', async () => {
    const { calls } = setupFetch()
    renderAdmin('/admin/catequistas')

    await screen.findByRole('heading', { name: 'Catequistas' })
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Nova Catequista' } })
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'nova@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Criar catequista' }))

    await screen.findByText(/abc12345/)
    fireEvent.click(screen.getByRole('button', { name: 'Desativar' }))

    await waitFor(() => expect(calls.some((call) => call.path === '/api/catechists/cat-1')).toBe(true))
    expect(calls.some((call) => call.path === '/api/catechists' && call.init?.method === 'POST')).toBe(true)
  })

  it('approves and rejects enrollments with the selected class and reason', async () => {
    const { calls } = setupFetch()
    renderAdmin('/admin/inscricoes')

    await screen.findByRole('heading', { name: 'Revisão de inscrições' })
    await screen.findByRole('button', { name: 'Pedro Santos' })
    fireEvent.click(screen.getByRole('button', { name: 'Pedro Santos' }))
    await screen.findByRole('option', { name: 'Primeira Comunhão' })

    const classSelect = screen.getByLabelText('Turma')
    fireEvent.change(classSelect, { target: { value: 'class-1' } })
    fireEvent.click(screen.getByRole('button', { name: /aprovar/i }))

    await waitFor(() =>
      expect(calls.some((call) => call.path === '/api/enrollments/enrollment-1/approve')).toBe(true),
    )

    fireEvent.change(screen.getByLabelText('Motivo da rejeição'), {
      target: { value: 'Documentos pendentes' },
    })
    fireEvent.click(screen.getByRole('button', { name: /rejeitar/i }))

    await waitFor(() =>
      expect(calls.some((call) => call.path === '/api/enrollments/enrollment-1/reject')).toBe(true),
    )
    const reject = calls.find((call) => call.path === '/api/enrollments/enrollment-1/reject')
    expect(JSON.parse(String(reject?.init?.body))).toEqual({ rejectionReason: 'Documentos pendentes' })
  })

  it('previews attendance reports and triggers PDF downloads', async () => {
    const { calls } = setupFetch()
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    renderAdmin('/admin/relatorios')

    await screen.findByRole('heading', { name: 'Relatórios de presença' })
    fireEvent.change(screen.getByLabelText('Turma'), { target: { value: 'class-1' } })
    fireEvent.change(screen.getByLabelText('De'), { target: { value: '2026-01-01' } })
    fireEvent.change(screen.getByLabelText('Até'), { target: { value: '2026-01-31' } })
    fireEvent.click(screen.getByRole('button', { name: 'Pré-visualizar' }))

    await screen.findByText('Ana Clara')
    fireEvent.click(screen.getByRole('button', { name: 'PDF' }))

    await waitFor(() =>
      expect(calls.some((call) => call.path.includes('format=pdf'))).toBe(true),
    )
    fireEvent.click(screen.getByRole('button', { name: 'XLSX' }))
    await waitFor(() =>
      expect(calls.some((call) => call.path.includes('format=xlsx'))).toBe(true),
    )
    expect(clickSpy).toHaveBeenCalled()
  })
})
