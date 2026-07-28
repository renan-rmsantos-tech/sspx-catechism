import type { Rule, RuleContext, Violation } from './types'
import { violation } from './scanner'

export const COLOR_LITERAL_ALLOWLIST = new Set<string>()
const COLOR_LITERAL = /#[0-9a-fA-F]{3,8}\b|\b(?:rgb|hsl|oklch)\s*\(/g
const OUTLINE_NONE = /\b(?:[\w-]+:)*outline-none\b/g
const RAW_CONTROL = /<(button|input|select|textarea)\b/g
const VARIANT_ALIAS = /\bvariant\s*=\s*(?:\{\s*)?['"](?:outline|destructive)['"]\s*\}?/g
const CLASS_NAME = /\bclassName\s*=\s*(?:\{\s*)?(['"`])([\s\S]*?)\1\s*\}?/g

function matches(source: string, pattern: RegExp, file: string, excerpt: (match: RegExpExecArray) => string): Violation[] {
  const found: Violation[] = []
  pattern.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = pattern.exec(source)) !== null) found.push(violation(file, source, match.index, excerpt(match)))
  pattern.lastIndex = 0
  return found
}

export function literalColors(file: string, source: string): Violation[] {
  if (COLOR_LITERAL_ALLOWLIST.has(file)) return []
  return matches(source, COLOR_LITERAL, file, (match) => match[0])
}

function missingClasses(file: string, source: string, ctx: RuleContext): Violation[] {
  if (file.startsWith('components/ui/')) return []
  const found: Violation[] = []
  CLASS_NAME.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = CLASS_NAME.exec(source)) !== null) {
    for (const className of match[2].split(/\s+/)) {
      if (!ctx.legacyOnly.has(className)) continue
      const offset = match.index + match[0].indexOf(className)
      found.push(violation(file, source, offset, className))
    }
  }
  CLASS_NAME.lastIndex = 0
  return found
}

function rawControls(file: string, source: string): Violation[] {
  if (file.startsWith('components/ui/')) return []
  return matches(source, RAW_CONTROL, file, (match) => `<${match[1]}>`)
}

export const RULES: readonly Rule[] = [
  {
    name: 'cor-literal',
    reason: 'Use a design token instead of a literal color outside the token layer.',
    enforcement: 'block',
    inspect: (file, source) => literalColors(file, source),
    fixture: { filename: 'literal.tsx', source: `export const color = '${['#', 'ff00aa'].join('')}'` },
  },
  {
    name: 'classe-inexistente',
    reason: 'This class exists in the reference design but was not translated into the project.',
    enforcement: 'report',
    inspect: missingClasses,
    fixture: { filename: 'legacy.tsx', source: 'export const field = <input className="input" />' },
  },
  {
    name: 'controle-cru',
    reason: 'Use a component from components/ui so touch target and focus behavior stay consistent.',
    enforcement: 'report',
    inspect: rawControls,
    fixture: { filename: 'raw.tsx', source: 'export const field = <input />' },
  },
  {
    name: 'foco-apagado',
    reason: 'Do not remove the visible keyboard focus indicator.',
    enforcement: 'block',
    inspect: (file, source) => file.startsWith('test/design-fidelity/') ? [] : matches(source, OUTLINE_NONE, file, (match) => match[0]),
    fixture: { filename: 'focus.tsx', source: ['export const field = <input className="', 'focus:', 'outline-', 'none', '" />'].join('') },
  },
  {
    name: 'apelido-de-variante',
    reason: 'Use the design-system variant names instead of inherited aliases.',
    enforcement: 'report',
    inspect: (file, source) => matches(source, VARIANT_ALIAS, file, (match) => match[0]),
    fixture: { filename: 'alias.tsx', source: 'export const action = <Button variant="outline" />' },
  },
]

export function context(legacyOnly: ReadonlySet<string>, defined = new Set<string>()): RuleContext {
  return { legacyOnly, defined }
}
