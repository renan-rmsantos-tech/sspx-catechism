'use client'

import { useActionState } from 'react'
import type { ActionState } from '@/app/admin/alunos/actions'

interface ClassOption {
  id: string
  name: string
}

interface StudentFormDefaultValues {
  class_id?: string
  full_name?: string
  birth_date?: string | null
  city?: string | null
  first_communion?: boolean
  confirmation?: boolean
  previous_catechism?: string | null
  religious_books?: string | null
  guardian_father_name?: string | null
  guardian_mother_name?: string | null
  guardian_phone?: string | null
  guardian_email?: string | null
}

interface StudentFormProps {
  classes: ClassOption[]
  defaultValues?: StudentFormDefaultValues
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>
  submitLabel?: string
}

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

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-xs font-medium mb-1.5"
      style={{ color: 'var(--text-secondary)' }}
    >
      {children}
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
  defaultValue,
  placeholder,
  type = 'text',
}: {
  id: string
  name: string
  defaultValue?: string | null
  placeholder?: string
  type?: string
}) {
  return (
    <input
      id={id}
      name={name}
      type={type}
      defaultValue={defaultValue ?? ''}
      placeholder={placeholder}
      style={inputStyle}
    />
  )
}

function Textarea({
  id,
  name,
  defaultValue,
  placeholder,
}: {
  id: string
  name: string
  defaultValue?: string | null
  placeholder?: string
}) {
  return (
    <textarea
      id={id}
      name={name}
      defaultValue={defaultValue ?? ''}
      placeholder={placeholder}
      rows={3}
      style={{ ...inputStyle, resize: 'vertical' }}
    />
  )
}

function BooleanToggle({
  name,
  defaultValue = false,
}: {
  name: string
  defaultValue?: boolean
}) {
  return (
    <div className="flex gap-2">
      <ToggleButton name={name} value="true" label="Sim" defaultChecked={defaultValue === true} />
      <ToggleButton name={name} value="false" label="Não" defaultChecked={defaultValue === false} />
    </div>
  )
}

function ToggleButton({
  name,
  value,
  label,
  defaultChecked,
}: {
  name: string
  value: string
  label: string
  defaultChecked: boolean
}) {
  return (
    <label
      className="flex-1 text-center py-2.5 rounded-lg text-sm font-medium cursor-pointer"
      style={{
        border: '1.5px solid var(--border)',
        backgroundColor: defaultChecked ? 'var(--accent-light)' : 'var(--surface)',
        color: defaultChecked ? 'var(--accent)' : 'var(--text-secondary)',
      }}
    >
      <input
        type="radio"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="sr-only"
      />
      {label}
    </label>
  )
}

export default function StudentForm({
  classes,
  defaultValues = {},
  action,
  submitLabel = 'Salvar Aluno',
}: StudentFormProps) {
  const [state, formAction, isPending] = useActionState(action, null)

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

      {/* Seção: Turma */}
      <div
        className="rounded-2xl p-6"
        style={{ backgroundColor: 'var(--surface)', border: '1.5px solid var(--border)' }}
      >
        <SectionHeader title="Turma" />
        <div>
          <FieldLabel htmlFor="class_id">Turma</FieldLabel>
          <select
            id="class_id"
            name="class_id"
            defaultValue={defaultValues.class_id ?? ''}
            required
            style={{ ...inputStyle, appearance: 'none' }}
          >
            <option value="" disabled>
              Selecione a turma...
            </option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Seção: Dados Pessoais */}
      <div
        className="rounded-2xl p-6"
        style={{ backgroundColor: 'var(--surface)', border: '1.5px solid var(--border)' }}
      >
        <SectionHeader title="Dados Pessoais" />
        <div className="flex flex-col gap-4">
          <div>
            <FieldLabel htmlFor="full_name">Nome Completo</FieldLabel>
            <TextInput
              id="full_name"
              name="full_name"
              defaultValue={defaultValues.full_name}
              placeholder="Ex: Ana Clara Souza"
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <FieldLabel htmlFor="birth_date">Data de Nascimento</FieldLabel>
              <TextInput
                id="birth_date"
                name="birth_date"
                type="date"
                defaultValue={defaultValues.birth_date ?? ''}
              />
            </div>
            <div className="flex-1">
              <FieldLabel htmlFor="city">Cidade</FieldLabel>
              <TextInput
                id="city"
                name="city"
                defaultValue={defaultValues.city}
                placeholder="Ex: São Paulo"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Seção: Dados Pastorais */}
      <div
        className="rounded-2xl p-6"
        style={{ backgroundColor: 'var(--surface)', border: '1.5px solid var(--border)' }}
      >
        <SectionHeader title="Dados Pastorais" />
        <div className="flex flex-col gap-5">
          <div className="flex gap-6">
            <div className="flex-1">
              <FieldLabel htmlFor="first_communion">Já fez a Primeira Comunhão?</FieldLabel>
              <BooleanToggle
                name="first_communion"
                defaultValue={defaultValues.first_communion ?? false}
              />
            </div>
            <div className="flex-1">
              <FieldLabel htmlFor="confirmation">Já recebeu o Crisma?</FieldLabel>
              <BooleanToggle
                name="confirmation"
                defaultValue={defaultValues.confirmation ?? false}
              />
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <FieldLabel htmlFor="previous_catechism">Já fez algum catecismo? Qual?</FieldLabel>
              <Textarea
                id="previous_catechism"
                name="previous_catechism"
                defaultValue={defaultValues.previous_catechism}
                placeholder="Descreva brevemente..."
              />
            </div>
            <div className="flex-1">
              <FieldLabel htmlFor="religious_books">Já leu algum livro de religião? Qual?</FieldLabel>
              <Textarea
                id="religious_books"
                name="religious_books"
                defaultValue={defaultValues.religious_books}
                placeholder="Descreva brevemente..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Seção: Responsáveis */}
      <div
        className="rounded-2xl p-6"
        style={{ backgroundColor: 'var(--surface)', border: '1.5px solid var(--border)' }}
      >
        <SectionHeader title="Responsáveis" />
        <div className="flex gap-4">
          <div className="flex-1">
            <FieldLabel htmlFor="guardian_father_name">Nome do Pai</FieldLabel>
            <TextInput
              id="guardian_father_name"
              name="guardian_father_name"
              defaultValue={defaultValues.guardian_father_name}
              placeholder="Nome completo"
            />
          </div>
          <div className="flex-1">
            <FieldLabel htmlFor="guardian_mother_name">Nome da Mãe / Responsável</FieldLabel>
            <TextInput
              id="guardian_mother_name"
              name="guardian_mother_name"
              defaultValue={defaultValues.guardian_mother_name}
              placeholder="Nome completo"
            />
          </div>
          <div className="flex-1">
            <FieldLabel htmlFor="guardian_phone">Telefone de Contato</FieldLabel>
            <TextInput
              id="guardian_phone"
              name="guardian_phone"
              defaultValue={defaultValues.guardian_phone}
              placeholder="(11) 99999-9999"
            />
          </div>
        </div>
        <div>
          <FieldLabel htmlFor="guardian_email">E-mail do Responsável</FieldLabel>
          <TextInput
            id="guardian_email"
            name="guardian_email"
            type="email"
            defaultValue={defaultValues.guardian_email}
            placeholder="email@exemplo.com"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pb-8">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          {isPending ? 'Salvando...' : submitLabel}
        </button>
      </div>
    </form>
  )
}
