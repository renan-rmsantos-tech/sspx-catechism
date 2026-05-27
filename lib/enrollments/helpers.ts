export function extractEnrollmentBody(formData: FormData) {
  const birthDate = (formData.get('birth_date') as string | null)?.trim() || null
  const phone = (formData.get('guardian_phone') as string | null)?.trim() || ''
  const email = (formData.get('guardian_email') as string | null)?.trim() || ''

  return {
    full_name: (formData.get('full_name') as string) || '',
    birth_date: birthDate,
    city: (formData.get('city') as string | null)?.trim() || null,
    first_communion: formData.get('first_communion') === 'true',
    confirmation: formData.get('confirmation') === 'true',
    previous_catechism:
      (formData.get('previous_catechism') as string | null)?.trim() || null,
    religious_books:
      (formData.get('religious_books') as string | null)?.trim() || null,
    guardian_father_name:
      (formData.get('guardian_father_name') as string | null)?.trim() || null,
    guardian_mother_name:
      (formData.get('guardian_mother_name') as string | null)?.trim() || null,
    guardian_phone: phone,
    guardian_email: email,
    is_renewal: formData.get('is_renewal') === 'true',
    previous_name:
      (formData.get('previous_name') as string | null)?.trim() || null,
  }
}
