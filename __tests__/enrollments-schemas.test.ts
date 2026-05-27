import { describe, it, expect } from 'vitest'
import { enrollmentSchema } from '../lib/enrollments/schemas'
import { extractEnrollmentBody } from '../lib/enrollments/helpers'

const validData = {
  full_name: 'Ana Clara Souza',
  birth_date: '2015-06-20',
  city: 'São Paulo',
  first_communion: false,
  confirmation: false,
  previous_catechism: null,
  religious_books: null,
  guardian_father_name: 'João Souza',
  guardian_mother_name: 'Maria Souza',
  guardian_phone: '(11) 99999-9999',
  guardian_email: 'maria@example.com',
  is_renewal: false,
  previous_name: null,
}

// ============================================================
// Unit Tests — enrollmentSchema
// ============================================================

describe('enrollmentSchema — full_name validation', () => {
  it('accepts valid full data', () => {
    const result = enrollmentSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('rejects full_name with less than 3 characters', () => {
    const result = enrollmentSchema.safeParse({ ...validData, full_name: 'Ab' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const err = result.error.issues.find((i) => i.path[0] === 'full_name')
      expect(err).toBeDefined()
    }
  })

  it('rejects missing full_name', () => {
    const { full_name: _, ...noName } = validData
    const result = enrollmentSchema.safeParse(noName)
    expect(result.success).toBe(false)
  })
})

describe('enrollmentSchema — birth_date validation', () => {
  it('rejects invalid date format', () => {
    const result = enrollmentSchema.safeParse({
      ...validData,
      birth_date: '20/06/2015',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const err = result.error.issues.find((i) => i.path[0] === 'birth_date')
      expect(err).toBeDefined()
    }
  })

  it('accepts valid ISO date', () => {
    const result = enrollmentSchema.safeParse({
      ...validData,
      birth_date: '2015-06-20',
    })
    expect(result.success).toBe(true)
  })

  it('accepts null birth_date', () => {
    const result = enrollmentSchema.safeParse({
      ...validData,
      birth_date: null,
    })
    expect(result.success).toBe(true)
  })

  it('accepts undefined birth_date', () => {
    const { birth_date: _, ...noBirth } = validData
    const result = enrollmentSchema.safeParse(noBirth)
    expect(result.success).toBe(true)
  })
})

describe('enrollmentSchema — guardian_phone validation', () => {
  it('rejects invalid phone format', () => {
    const result = enrollmentSchema.safeParse({
      ...validData,
      guardian_phone: '11999999999',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const err = result.error.issues.find(
        (i) => i.path[0] === 'guardian_phone'
      )
      expect(err).toBeDefined()
    }
  })

  it('accepts phone with 8-digit number', () => {
    const result = enrollmentSchema.safeParse({
      ...validData,
      guardian_phone: '(11) 9999-9999',
    })
    expect(result.success).toBe(true)
  })

  it('accepts phone with 9-digit number', () => {
    const result = enrollmentSchema.safeParse({
      ...validData,
      guardian_phone: '(11) 99999-9999',
    })
    expect(result.success).toBe(true)
  })
})

describe('enrollmentSchema — guardian_email validation', () => {
  it('rejects invalid email', () => {
    const result = enrollmentSchema.safeParse({
      ...validData,
      guardian_email: 'not-an-email',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const err = result.error.issues.find(
        (i) => i.path[0] === 'guardian_email'
      )
      expect(err).toBeDefined()
    }
  })

  it('rejects missing email', () => {
    const { guardian_email: _, ...noEmail } = validData
    const result = enrollmentSchema.safeParse(noEmail)
    expect(result.success).toBe(false)
  })
})

describe('enrollmentSchema — optional fields', () => {
  it('accepts minimal required data only', () => {
    const result = enrollmentSchema.safeParse({
      full_name: 'Ana Clara Souza',
      guardian_phone: '(11) 99999-9999',
      guardian_email: 'maria@example.com',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.first_communion).toBe(false)
      expect(result.data.confirmation).toBe(false)
      expect(result.data.is_renewal).toBe(false)
    }
  })

  it('is_renewal=false does not require previous_name', () => {
    const result = enrollmentSchema.safeParse({
      ...validData,
      is_renewal: false,
      previous_name: null,
    })
    expect(result.success).toBe(true)
  })

  it('accepts renewal with previous_name', () => {
    const result = enrollmentSchema.safeParse({
      ...validData,
      is_renewal: true,
      previous_name: 'Ana C. Souza',
    })
    expect(result.success).toBe(true)
  })
})

// ============================================================
// Unit Tests — extractEnrollmentBody
// ============================================================

function makeFormData(entries: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [key, value] of Object.entries(entries)) {
    fd.set(key, value)
  }
  return fd
}

describe('extractEnrollmentBody', () => {
  it('converts FormData with all fields correctly', () => {
    const fd = makeFormData({
      full_name: 'Ana Clara Souza',
      birth_date: '2015-06-20',
      city: 'São Paulo',
      first_communion: 'true',
      confirmation: 'false',
      previous_catechism: 'Sim, 2 anos',
      religious_books: 'Bíblia infantil',
      guardian_father_name: 'João Souza',
      guardian_mother_name: 'Maria Souza',
      guardian_phone: '(11) 99999-9999',
      guardian_email: 'maria@example.com',
      is_renewal: 'true',
      previous_name: 'Ana C. Souza',
    })

    const body = extractEnrollmentBody(fd)

    expect(body.full_name).toBe('Ana Clara Souza')
    expect(body.birth_date).toBe('2015-06-20')
    expect(body.city).toBe('São Paulo')
    expect(body.first_communion).toBe(true)
    expect(body.confirmation).toBe(false)
    expect(body.previous_catechism).toBe('Sim, 2 anos')
    expect(body.religious_books).toBe('Bíblia infantil')
    expect(body.guardian_father_name).toBe('João Souza')
    expect(body.guardian_mother_name).toBe('Maria Souza')
    expect(body.guardian_phone).toBe('(11) 99999-9999')
    expect(body.guardian_email).toBe('maria@example.com')
    expect(body.is_renewal).toBe(true)
    expect(body.previous_name).toBe('Ana C. Souza')
  })

  it('converts boolean strings correctly', () => {
    const fd = makeFormData({
      full_name: 'Test',
      guardian_phone: '(11) 99999-9999',
      guardian_email: 'test@test.com',
      first_communion: 'false',
      confirmation: 'true',
      is_renewal: 'false',
    })

    const body = extractEnrollmentBody(fd)
    expect(body.first_communion).toBe(false)
    expect(body.confirmation).toBe(true)
    expect(body.is_renewal).toBe(false)
  })

  it('treats missing optional fields as null', () => {
    const fd = makeFormData({
      full_name: 'Test',
      guardian_phone: '(11) 99999-9999',
      guardian_email: 'test@test.com',
    })

    const body = extractEnrollmentBody(fd)
    expect(body.birth_date).toBeNull()
    expect(body.city).toBeNull()
    expect(body.previous_catechism).toBeNull()
    expect(body.religious_books).toBeNull()
    expect(body.guardian_father_name).toBeNull()
    expect(body.guardian_mother_name).toBeNull()
    expect(body.previous_name).toBeNull()
    expect(body.first_communion).toBe(false)
    expect(body.confirmation).toBe(false)
    expect(body.is_renewal).toBe(false)
  })

  it('trims whitespace from string fields', () => {
    const fd = makeFormData({
      full_name: '  Ana Clara  ',
      birth_date: '  2015-06-20  ',
      city: '  São Paulo  ',
      guardian_phone: '  (11) 99999-9999  ',
      guardian_email: '  maria@example.com  ',
    })

    const body = extractEnrollmentBody(fd)
    expect(body.birth_date).toBe('2015-06-20')
    expect(body.city).toBe('São Paulo')
    expect(body.guardian_phone).toBe('(11) 99999-9999')
    expect(body.guardian_email).toBe('maria@example.com')
  })
})
