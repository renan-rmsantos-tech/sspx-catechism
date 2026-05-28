'use client'

import { useActionState, useState } from 'react'
import { submitEnrollment, type EnrollmentActionState } from './actions'

function SectionHeader({ title }: { title: string }) {
  return (
    <p
      className="text-xs font-semibold uppercase tracking-widest mb-4"
      style={{ color: 'var(--accent)', letterSpacing: '0.08em' }}
    >
      {title}
    </p>
  )
}

function FieldLabel({
  htmlFor,
  children,
  required,
}: {
  htmlFor: string
  children: React.ReactNode
  required?: boolean
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-xs font-medium mb-1.5"
      style={{ color: 'var(--text-secondary)' }}
    >
      {children}
      {required && <span style={{ color: 'var(--error)' }}> *</span>}
    </label>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1.5px solid var(--border)',
  backgroundColor: 'var(--surface)',
  color: 'var(--text-primary)',
  fontSize: '14px',
  outline: 'none',
}

function TextInput({
  id,
  name,
  placeholder,
  type = 'text',
  required,
  defaultValue,
}: {
  id: string
  name: string
  placeholder?: string
  type?: string
  required?: boolean
  defaultValue?: string
}) {
  return (
    <input
      id={id}
      name={name}
      type={type}
      placeholder={placeholder}
      required={required}
      defaultValue={defaultValue}
      style={inputStyle}
    />
  )
}

function Textarea({
  id,
  name,
  placeholder,
  defaultValue,
}: {
  id: string
  name: string
  placeholder?: string
  defaultValue?: string
}) {
  return (
    <textarea
      id={id}
      name={name}
      placeholder={placeholder}
      defaultValue={defaultValue}
      rows={3}
      style={{ ...inputStyle, resize: 'vertical' }}
    />
  )
}

function BooleanToggle({
  name,
  defaultValue = false,
  onChange,
}: {
  name: string
  defaultValue?: boolean
  onChange?: (value: boolean) => void
}) {
  const [selected, setSelected] = useState(defaultValue)

  function handleChange(val: boolean) {
    setSelected(val)
    onChange?.(val)
  }

  return (
    <div className="flex gap-2">
      <ToggleButton
        name={name}
        value="true"
        label="Sim"
        checked={selected === true}
        onChange={() => handleChange(true)}
      />
      <ToggleButton
        name={name}
        value="false"
        label="Não"
        checked={selected === false}
        onChange={() => handleChange(false)}
      />
    </div>
  )
}

function ToggleButton({
  name,
  value,
  label,
  checked,
  onChange,
}: {
  name: string
  value: string
  label: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <label
      className="flex-1 text-center py-2.5 rounded-lg text-sm font-medium cursor-pointer"
      style={{
        border: '1.5px solid var(--border)',
        backgroundColor: checked ? 'var(--accent-light)' : 'var(--surface)',
        color: checked ? 'var(--accent)' : 'var(--text-secondary)',
      }}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        className="sr-only"
        onChange={onChange}
      />
      {label}
    </label>
  )
}

function SuccessMessage() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
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
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h2
        className="text-xl font-bold"
        style={{ color: 'var(--text-primary)' }}
      >
        Inscrição enviada com sucesso!
      </h2>
      <p
        className="text-sm max-w-md"
        style={{ color: 'var(--text-secondary)' }}
      >
        O coordenador da catequese receberá sua inscrição e entrará em contato
        pelo telefone ou email informado.
      </p>
    </div>
  )
}

export default function EnrollmentForm() {
  const [state, formAction, isPending] = useActionState<EnrollmentActionState, FormData>(
    submitEnrollment,
    null
  )
  const saved = state && 'values' in state ? state.values : ({} as Record<string, string>)
  const [isRenewal, setIsRenewal] = useState(saved.is_renewal === 'true')

  if (state && 'success' in state) {
    return <SuccessMessage />
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state?.error && (
        <div
          className="rounded-lg px-4 py-3 text-sm font-medium"
          style={{ backgroundColor: '#FEE2E2', color: 'var(--error)' }}
          role="alert"
        >
          {state.error}
        </div>
      )}

      {/* Dados do Catequizando */}
      <div
        className="rounded-2xl p-6"
        style={{
          backgroundColor: 'var(--surface)',
          border: '1.5px solid var(--border)',
        }}
      >
        <SectionHeader title="Dados do Catequizando" />
        <div className="flex flex-col gap-4">
          <div>
            <FieldLabel htmlFor="full_name" required>
              Nome Completo
            </FieldLabel>
            <TextInput
              id="full_name"
              name="full_name"
              placeholder="Ex: Ana Clara Souza"
              required
              defaultValue={saved.full_name}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <FieldLabel htmlFor="birth_date">Data de Nascimento</FieldLabel>
              <TextInput id="birth_date" name="birth_date" type="date" defaultValue={saved.birth_date} />
            </div>
            <div className="flex-1">
              <FieldLabel htmlFor="city">Cidade</FieldLabel>
              <TextInput id="city" name="city" placeholder="Ex: São Paulo" defaultValue={saved.city} />
            </div>
          </div>
        </div>
      </div>

      {/* Dados Pastorais */}
      <div
        className="rounded-2xl p-6"
        style={{
          backgroundColor: 'var(--surface)',
          border: '1.5px solid var(--border)',
        }}
      >
        <SectionHeader title="Dados Pastorais" />
        <div className="flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex-1">
              <FieldLabel htmlFor="first_communion">
                Já fez a Primeira Comunhão?
              </FieldLabel>
              <BooleanToggle name="first_communion" defaultValue={saved.first_communion === 'true'} />
            </div>
            <div className="flex-1">
              <FieldLabel htmlFor="confirmation">
                Já recebeu o Crisma?
              </FieldLabel>
              <BooleanToggle name="confirmation" defaultValue={saved.confirmation === 'true'} />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <FieldLabel htmlFor="previous_catechism">
                Já fez catequese anteriormente? Qual?
              </FieldLabel>
              <Textarea
                id="previous_catechism"
                name="previous_catechism"
                placeholder="Descreva brevemente..."
                defaultValue={saved.previous_catechism}
              />
            </div>
            <div className="flex-1">
              <FieldLabel htmlFor="religious_books">
                Já leu algum livro de religião? Qual?
              </FieldLabel>
              <Textarea
                id="religious_books"
                name="religious_books"
                placeholder="Descreva brevemente..."
                defaultValue={saved.religious_books}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Dados do Responsável */}
      <div
        className="rounded-2xl p-6"
        style={{
          backgroundColor: 'var(--surface)',
          border: '1.5px solid var(--border)',
        }}
      >
        <SectionHeader title="Dados do Responsável" />
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <FieldLabel htmlFor="guardian_father_name">Nome do Pai</FieldLabel>
              <TextInput
                id="guardian_father_name"
                name="guardian_father_name"
                placeholder="Nome completo"
                defaultValue={saved.guardian_father_name}
              />
            </div>
            <div className="flex-1">
              <FieldLabel htmlFor="guardian_mother_name">
                Nome da Mãe / Responsável
              </FieldLabel>
              <TextInput
                id="guardian_mother_name"
                name="guardian_mother_name"
                placeholder="Nome completo"
                defaultValue={saved.guardian_mother_name}
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <FieldLabel htmlFor="guardian_phone" required>
                Telefone de Contato
              </FieldLabel>
              <TextInput
                id="guardian_phone"
                name="guardian_phone"
                placeholder="(11) 99999-9999"
                required
                defaultValue={saved.guardian_phone}
              />
            </div>
            <div className="flex-1">
              <FieldLabel htmlFor="guardian_email" required>
                Email de Contato
              </FieldLabel>
              <TextInput
                id="guardian_email"
                name="guardian_email"
                type="email"
                placeholder="email@exemplo.com"
                required
                defaultValue={saved.guardian_email}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Renovação */}
      <div
        className="rounded-2xl p-6"
        style={{
          backgroundColor: 'var(--surface)',
          border: '1.5px solid var(--border)',
        }}
      >
        <SectionHeader title="Renovação" />
        <div className="flex flex-col gap-4">
          <div>
            <FieldLabel htmlFor="is_renewal">
              Já frequentou a catequese aqui?
            </FieldLabel>
            <BooleanToggle
              name="is_renewal"
              defaultValue={saved.is_renewal === 'true'}
              onChange={setIsRenewal}
            />
          </div>
          {isRenewal && (
            <div>
              <FieldLabel htmlFor="previous_name">
                Nome como estava cadastrado anteriormente
              </FieldLabel>
              <TextInput
                id="previous_name"
                name="previous_name"
                placeholder="Nome usado no cadastro anterior"
                defaultValue={saved.previous_name}
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center pb-8">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg px-8 py-3 text-sm font-semibold text-white disabled:opacity-50 w-full sm:w-auto"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          {isPending ? 'Enviando...' : 'Enviar Inscrição'}
        </button>
      </div>
    </form>
  )
}
