import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { calcStudentStats, getCellValue } from './query'
import type { ReportData } from './query'

export function generatePdf(data: ReportData): Buffer {
  const doc = new jsPDF({ orientation: 'landscape' })

  doc.setFontSize(14)
  doc.text(data.className, 14, 15)
  doc.setFontSize(10)
  doc.text(`Período: ${data.from} a ${data.to}`, 14, 22)
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 28)

  const dateHeaders = data.sessions.map((s) => s.date.slice(5))
  const head = [['Aluno', ...dateHeaders, 'Presenças', 'Faltas', '%']]

  const body = data.students.map((student) => {
    const cells = data.sessions.map((s) => getCellValue(student.id, s.id, data.records))
    const stats = calcStudentStats(student.id, data.sessions, data.records)
    return [
      student.full_name,
      ...cells,
      String(stats.present),
      String(stats.absent),
      stats.pct,
    ]
  })

  autoTable(doc, {
    head,
    body,
    startY: 35,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [180, 83, 9] },
  })

  return Buffer.from(doc.output('arraybuffer'))
}
