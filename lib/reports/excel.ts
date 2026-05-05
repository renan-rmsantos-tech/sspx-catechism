import * as XLSX from 'xlsx'
import { calcStudentStats, getCellValue } from './query'
import type { ReportData } from './query'

export function generateExcel(data: ReportData): Buffer {
  const wb = XLSX.utils.book_new()

  const dateHeaders = data.sessions.map((s) => s.date)
  const dataHeader = ['Aluno', ...dateHeaders, 'Presenças', 'Faltas', '%']

  const rows: (string | number)[][] = [
    [data.className],
    [`Período: ${data.from} a ${data.to}`],
    [`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`],
    [],
    dataHeader,
  ]

  for (const student of data.students) {
    const cells = data.sessions.map((s) => getCellValue(student.id, s.id, data.records))
    const stats = calcStudentStats(student.id, data.sessions, data.records)
    rows.push([student.full_name, ...cells, stats.present, stats.absent, stats.pct])
  }

  const ws = XLSX.utils.aoa_to_sheet(rows)
  XLSX.utils.book_append_sheet(wb, ws, 'Presença')

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer
}
