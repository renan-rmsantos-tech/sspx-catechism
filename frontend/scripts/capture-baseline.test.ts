import { describe, expect, it } from 'vitest'
import { apiResponse, routes } from './capture-baseline'

describe('capture baseline routes', () => {
  it('registers the seven admin surfaces with a coordination session', () => {
    const adminRoutes = routes.filter((route) => route.path.startsWith('/admin/'))
    expect(adminRoutes.map((route) => route.path)).toEqual([
      '/admin/anos', '/admin/calendario', '/admin/turmas', '/admin/alunos',
      '/admin/catequistas', '/admin/inscricoes', '/admin/relatorios',
    ])
    expect(adminRoutes.every((route) => route.authenticatedUser?.role === 'coordinator')).toBe(true)
  })

  it('provides content fixtures for every admin module request', () => {
    expect(apiResponse('/api/academic-years')).not.toBeNull()
    expect(apiResponse('/api/class-dates?academicYearId=baseline-year')).not.toBeNull()
    expect(apiResponse('/api/classes')).not.toBeNull()
    expect(apiResponse('/api/students?q=ana')).not.toBeNull()
    expect(apiResponse('/api/catechists')).not.toBeNull()
    expect(apiResponse('/api/enrollments?status=pending&q=')).not.toBeNull()
    expect(apiResponse('/api/reports/attendance?classId=baseline-class&from=2026-01-01&to=2026-01-31&format=json')).not.toBeNull()
  })
})
