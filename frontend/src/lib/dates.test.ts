import { greetingForHour, localToday } from '@/lib/dates'

describe('localToday (BUG-20260724-chamada-data-utc-errada)', () => {
  it('usa o dia local do aparelho, nunca o dia UTC', () => {
    vi.useFakeTimers()
    // 23:30 do dia 24 no fuso -03 = 02:30 UTC do dia 25. Num ambiente UTC os
    // dois coincidem (asserção vacua); em qualquer fuso a oeste, o código
    // antigo (toISOString) devolvia o dia seguinte.
    vi.setSystemTime(new Date('2026-07-24T23:30:00-03:00'))
    const now = new Date()
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    expect(localToday()).toBe(expected)
    if (now.getTimezoneOffset() > 0) {
      expect(localToday()).not.toBe(now.toISOString().slice(0, 10))
    }
    vi.useRealTimers()
  })
})

describe('greetingForHour (BUG-20260724-saudacao-fuso-errado)', () => {
  it('cumprimenta conforme a hora local', () => {
    expect(greetingForHour(8)).toBe('Bom dia')
    expect(greetingForHour(11)).toBe('Bom dia')
    expect(greetingForHour(12)).toBe('Boa tarde')
    expect(greetingForHour(18)).toBe('Boa tarde')
    expect(greetingForHour(19)).toBe('Boa noite')
    expect(greetingForHour(23)).toBe('Boa noite')
  })
})
