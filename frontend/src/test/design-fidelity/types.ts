export type Enforcement = 'report' | 'block'

export type Violation = {
  file: string
  line: number
  excerpt: string
}

export type RuleContext = {
  legacyOnly: ReadonlySet<string>
  defined: ReadonlySet<string>
}

export type Rule = {
  name: string
  reason: string
  enforcement: Enforcement
  inspect: (file: string, source: string, ctx: RuleContext) => Violation[]
  fixture: {
    filename: string
    source: string
  }
}

export type SourceFile = {
  file: string
  source: string
}
