// O "hoje" do produto é o dia LOCAL do aparelho. `toISOString()` devolve o dia
// UTC, que no fuso -03 vira o dia seguinte a partir das 21h — uma chamada
// registrada à noite cairia na data errada.
export function localToday(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

export function greetingForHour(hour: number): 'Bom dia' | 'Boa tarde' | 'Boa noite' {
  if (hour < 12) return 'Bom dia'
  if (hour < 19) return 'Boa tarde'
  return 'Boa noite'
}
