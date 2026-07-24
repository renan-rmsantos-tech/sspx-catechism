import { z } from 'zod'

export const passwordSchema = z
  .string()
  .min(6, 'A senha deve ter ao menos 6 caracteres.')
  .regex(/[a-zA-Z]/, 'A senha precisa ter uma letra.')
  .regex(/[0-9]/, 'A senha precisa ter um número.')

export function passwordRules(password: string, confirmation: string) {
  return [
    { label: 'Pelo menos 6 caracteres', complete: password.length >= 6 },
    { label: 'Uma letra e um número', complete: /[a-zA-Z]/.test(password) && /[0-9]/.test(password) },
    { label: 'As duas senhas coincidem', complete: password.length > 0 && password === confirmation },
  ]
}
