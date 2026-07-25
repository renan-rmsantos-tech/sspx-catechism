import { ApiError } from '@/lib/api'
import { friendlyLoginError } from '@/components/auth/login-page'

describe('friendlyLoginError (BUG-20260724-limite-login-ingles-sem-guia)', () => {
  it('traduz o 429 do rate limit com orientação em português', () => {
    const err = new ApiError(429, 'Too Many Requests')
    expect(friendlyLoginError(err)).toBe('Muitas tentativas. Aguarde um minuto e tente novamente.')
  })

  it('mantém as mensagens do servidor para os demais erros', () => {
    expect(friendlyLoginError(new ApiError(401, 'credenciais inválidas'))).toBe('credenciais inválidas')
    expect(friendlyLoginError(new Error('x'))).toBe('Não foi possível entrar.')
  })
})
