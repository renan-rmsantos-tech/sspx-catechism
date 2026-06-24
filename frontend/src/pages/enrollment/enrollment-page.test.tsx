import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { EnrollmentPage } from '@/pages/enrollment/enrollment-page'

function jsonResponse(body: unknown, status = 201) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

describe('EnrollmentPage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('validates the public form before submitting', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    render(<EnrollmentPage />)

    fireEvent.change(screen.getByLabelText('Nome completo'), { target: { value: 'A' } })
    fireEvent.change(screen.getByLabelText('Telefone de contato'), {
      target: { value: '(11) 99999-9999' },
    })
    fireEvent.change(screen.getByLabelText('Email de contato'), {
      target: { value: 'familia@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /enviar inscrição/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Nome completo deve ter pelo menos 3 caracteres',
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('submits a valid enrollment without auth', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 'enrollment-1' }))
    vi.stubGlobal('fetch', fetchMock)
    render(<EnrollmentPage />)

    fireEvent.change(screen.getByLabelText('Nome completo'), {
      target: { value: 'Ana Clara Souza' },
    })
    fireEvent.change(screen.getByLabelText('Data de nascimento'), {
      target: { value: '2016-05-14' },
    })
    fireEvent.change(screen.getByLabelText('Cidade'), { target: { value: 'São Paulo' } })
    fireEvent.change(screen.getByLabelText('Telefone de contato'), {
      target: { value: '(11) 99999-9999' },
    })
    fireEvent.change(screen.getByLabelText('Email de contato'), {
      target: { value: 'familia@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /enviar inscrição/i }))

    await screen.findByRole('heading', { name: 'Inscrição enviada com sucesso' })
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/enrollments',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
      }),
    )
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
      fullName: 'Ana Clara Souza',
      birthDate: '2016-05-14',
      city: 'São Paulo',
      guardianPhone: '(11) 99999-9999',
      guardianEmail: 'familia@example.com',
      firstCommunion: false,
      confirmation: false,
      isRenewal: false,
    })
  })
})
