'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { isCoordinatorOrAdmin } from '@/lib/auth/helpers'

export type ActionState = { error: string } | null

async function getCoordinatorClient() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!isCoordinatorOrAdmin(profile?.role)) return null
  return { supabase, userId: user.id }
}

export async function approveEnrollment(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const client = await getCoordinatorClient()
  if (!client) return { error: 'Acesso negado' }
  const { supabase, userId } = client

  const enrollmentId = formData.get('enrollment_id') as string
  const classId = formData.get('class_id') as string
  const existingStudentId =
    (formData.get('existing_student_id') as string) || null

  if (!enrollmentId || !classId) {
    return { error: 'Inscrição e turma são obrigatórios.' }
  }

  const { data: enrollment, error: fetchError } = await supabase
    .from('enrollments')
    .select('*')
    .eq('id', enrollmentId)
    .single()

  if (fetchError || !enrollment) {
    return { error: 'Inscrição não encontrada.' }
  }

  if (enrollment.status !== 'pending') {
    return { error: 'Esta inscrição já foi processada.' }
  }

  let studentId: string

  if (existingStudentId) {
    const { error: updateError } = await supabase
      .from('students')
      .update({
        class_id: classId,
        full_name: enrollment.full_name,
        birth_date: enrollment.birth_date,
        city: enrollment.city,
        first_communion: enrollment.first_communion,
        confirmation: enrollment.confirmation,
        previous_catechism: enrollment.previous_catechism,
        religious_books: enrollment.religious_books,
        guardian_father_name: enrollment.guardian_father_name,
        guardian_mother_name: enrollment.guardian_mother_name,
        guardian_phone: enrollment.guardian_phone,
        guardian_email: enrollment.guardian_email,
      })
      .eq('id', existingStudentId)

    if (updateError) {
      return { error: 'Erro ao atualizar aluno existente.' }
    }
    studentId = existingStudentId
  } else {
    const { data: newStudent, error: insertError } = await supabase
      .from('students')
      .insert({
        class_id: classId,
        full_name: enrollment.full_name,
        birth_date: enrollment.birth_date,
        city: enrollment.city,
        first_communion: enrollment.first_communion,
        confirmation: enrollment.confirmation,
        previous_catechism: enrollment.previous_catechism,
        religious_books: enrollment.religious_books,
        guardian_father_name: enrollment.guardian_father_name,
        guardian_mother_name: enrollment.guardian_mother_name,
        guardian_phone: enrollment.guardian_phone,
        guardian_email: enrollment.guardian_email,
      })
      .select('id')
      .single()

    if (insertError || !newStudent) {
      return { error: 'Erro ao criar aluno.' }
    }
    studentId = newStudent.id
  }

  const { error: approveError } = await supabase
    .from('enrollments')
    .update({
      status: 'approved',
      approved_student_id: studentId,
      approved_class_id: classId,
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', enrollmentId)

  if (approveError) {
    return { error: 'Erro ao aprovar inscrição.' }
  }

  revalidatePath('/admin/inscricoes')
  return null
}

export async function rejectEnrollment(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const client = await getCoordinatorClient()
  if (!client) return { error: 'Acesso negado' }
  const { supabase, userId } = client

  const enrollmentId = formData.get('enrollment_id') as string
  const rejectionReason =
    (formData.get('rejection_reason') as string)?.trim() || null

  if (!enrollmentId) {
    return { error: 'ID da inscrição é obrigatório.' }
  }

  const { data: enrollment, error: fetchError } = await supabase
    .from('enrollments')
    .select('status')
    .eq('id', enrollmentId)
    .single()

  if (fetchError || !enrollment) {
    return { error: 'Inscrição não encontrada.' }
  }

  if (enrollment.status !== 'pending') {
    return { error: 'Esta inscrição já foi processada.' }
  }

  const { error: rejectError } = await supabase
    .from('enrollments')
    .update({
      status: 'rejected',
      rejection_reason: rejectionReason,
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', enrollmentId)

  if (rejectError) {
    return { error: 'Erro ao rejeitar inscrição.' }
  }

  revalidatePath('/admin/inscricoes')
  return null
}
