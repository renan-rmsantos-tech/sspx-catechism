import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { EnrollmentPage } from '@/pages/enrollment/enrollment-page'

function jsonResponse(body: unknown, status = 201) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

function fillStudentStep() {
  fireEvent.change(screen.getByLabelText(/Nome completo/), { target: { value: 'Ana Clara Souza' } })
  fireEvent.change(screen.getByLabelText('Data de nascimento'), { target: { value: '2016-05-14' } })
  fireEvent.change(screen.getByLabelText('Cidade'), { target: { value: 'São Paulo' } })
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
}

function fillGuardianStep() {
  fireEvent.change(screen.getByLabelText('Telefone de contato'), { target: { value: '(11) 99999-9999' } })
  fireEvent.change(screen.getByLabelText('E-mail de contato'), { target: { value: 'familia@example.com' } })
}

function reachReview() {
  fillStudentStep()
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
  fillGuardianStep()
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
}

describe('EnrollmentPage', () => {
  beforeEach(() => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
    // O rascunho é persistido de propósito; cada teste começa do zero.
    sessionStorage.clear()
  })

  afterEach(() => {
    sessionStorage.clear()
  })

  it('blocks an invalid step and shows its error before advancing', () => {
    render(<EnrollmentPage />)
    fireEvent.change(screen.getByLabelText(/Nome completo/), { target: { value: 'A' } })
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Nome completo deve ter pelo menos 3 caracteres')
    expect(screen.getByRole('heading', { name: 'Dados do catequizando' })).toBeInTheDocument()
  })

  it('preserves filled values when returning to a previous step', async () => {
    render(<EnrollmentPage />)
    fillStudentStep()
    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }))

    // Voltar navega pelo histórico (o back do celular precisa fazer o mesmo),
    // então o passo anterior volta de forma assíncrona.
    expect(await screen.findByLabelText(/Nome completo/)).toHaveValue('Ana Clara Souza')
    expect(screen.getByLabelText('Cidade')).toHaveValue('São Paulo')
  })

  it('recupera o rascunho quando a pessoa sai e volta (BUG-20260725-voltar-do-navegador-perde-inscricao)', async () => {
    const first = render(<EnrollmentPage />)
    fillStudentStep()
    fireEvent.change(screen.getByLabelText(/catequese anteriormente/i), {
      target: { value: 'Paróquia São José, 2025' },
    })
    first.unmount()

    render(<EnrollmentPage />)

    // Volta no passo em que parou, com o que já tinha sido digitado.
    expect(await screen.findByTestId('draft-restored')).toBeInTheDocument()
    expect(screen.getByLabelText(/catequese anteriormente/i)).toHaveValue('Paróquia São José, 2025')
    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }))
    expect(await screen.findByLabelText(/Nome completo/)).toHaveValue('Ana Clara Souza')
  })

  it('limpa o rascunho depois do envio', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ id: 'enrollment-1' })))
    render(<EnrollmentPage />)
    reachReview()
    fireEvent.click(screen.getByRole('button', { name: /enviar inscrição/i }))

    await screen.findByRole('heading', { name: 'Inscrição enviada com sucesso' })
    expect(sessionStorage.getItem('inscricao-rascunho')).toBeNull()
  })

  it('updates the form when a choice tile is selected', async () => {
    render(<EnrollmentPage />)
    fillStudentStep()
    const choice = screen.getByRole('radio', { name: 'Sim, já fez' })
    fireEvent.click(choice)

    await waitFor(() => expect(choice).toBeChecked())
    expect(screen.getAllByRole('radio', { name: 'Ainda não' })[0]).not.toBeChecked()
  })

  it('shows an API error and allows the enrollment to be submitted again', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse({ error: 'Falhou' }, 500)).mockResolvedValueOnce(jsonResponse({ id: 'enrollment-1' }))
    vi.stubGlobal('fetch', fetchMock)
    render(<EnrollmentPage />)
    reachReview()
    fireEvent.click(screen.getByRole('button', { name: /enviar inscrição/i }))

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /enviar inscrição/i }))
    expect(await screen.findByRole('heading', { name: 'Inscrição enviada com sucesso' })).toBeInTheDocument()
  })

  it('submits the complete payload with the pre-stepper shape', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 'enrollment-1' }))
    vi.stubGlobal('fetch', fetchMock)
    render(<EnrollmentPage />)
    reachReview()
    fireEvent.click(screen.getByRole('button', { name: /enviar inscrição/i }))

    await screen.findByRole('heading', { name: 'Inscrição enviada com sucesso' })
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    expect(fetchMock).toHaveBeenCalledWith('/api/enrollments', expect.objectContaining({ method: 'POST', credentials: 'include' }))
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      fullName: 'Ana Clara Souza', birthDate: '2016-05-14', city: 'São Paulo', firstCommunion: false,
      confirmation: false, previousCatechism: null, religiousBooks: null, guardianFatherName: null,
      guardianMotherName: null, guardianPhone: '(11) 99999-9999', guardianEmail: 'familia@example.com',
      isRenewal: false, previousName: null,
    })
  })

  it('keeps all four enrollment steps reachable with rail navigation', () => {
    render(<EnrollmentPage />)
    expect(screen.getAllByTestId(/stepper-rail-/)).toHaveLength(4)
    fillStudentStep()
    expect(screen.getByRole('heading', { name: 'Histórico religioso' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(screen.getByRole('heading', { name: 'Dados dos responsáveis' })).toBeInTheDocument()
    fillGuardianStep()
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(screen.getByRole('heading', { name: 'Revise antes de enviar' })).toBeInTheDocument()
  })
})
