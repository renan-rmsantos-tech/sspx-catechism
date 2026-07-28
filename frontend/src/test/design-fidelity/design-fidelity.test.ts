import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { classesIn, legacyOnlyClasses } from './legacy-classes'
import { context, literalColors, RULES } from './rules'
import { compareViolations, scan, sourceFiles } from './scanner'
import type { Rule, RuleContext, Violation } from './types'

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url))
const SRC_ROOT = path.resolve(TEST_DIR, '../..')
const REFERENCE_CSS = path.resolve(SRC_ROOT, '../../design/assets/catequese-ds.css')
const PROJECT_CSS = path.resolve(SRC_ROOT, 'styles.css')

async function ruleContext(): Promise<RuleContext> {
  const [referenceCss, projectCss] = await Promise.all([readFile(REFERENCE_CSS, 'utf8'), readFile(PROJECT_CSS, 'utf8')])
  return context(legacyOnlyClasses(referenceCss, projectCss), classesIn(projectCss))
}

export function format(rule: Rule, found: Violation[]): string {
  const rows = [...found].sort(compareViolations).map(({ file, line, excerpt }) => `  ${file}:${line}  ${excerpt}`)
  return `${rule.name}: ${rule.reason}\n${rows.join('\n')}`
}

export function enforce(rule: Rule, found: Violation[]): void {
  if (rule.enforcement === 'block' && found.length > 0) throw new Error(format(rule, found))
}

async function plant(rule: Rule): Promise<string> {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'design-fidelity-'))
  await writeFile(path.join(directory, rule.fixture.filename), rule.fixture.source)
  return directory
}

describe('design fidelity gate', () => {
  describe.each(RULES)('$name', (rule) => {
    it('inspects the repository', async () => {
      const found = await scan(SRC_ROOT, rule, await ruleContext())
      if (rule.enforcement === 'report' && found.length > 0) console.info(format(rule, found))
      expect(() => enforce(rule, found)).not.toThrow()
    })

    it('detects its planted violation', async () => {
      const directory = await plant(rule)
      try {
        expect(await scan(directory, rule, await ruleContext())).not.toEqual([])
      } finally {
        await rm(directory, { recursive: true, force: true })
      }
    })
  })

  it('extracts nested reference selectors and excludes translated selectors', () => {
    const result = legacyOnlyClasses('.input {} .table .num-col {} .num {}', '.num {}')
    expect(result).toEqual(new Set(['input', 'table', 'num-col']))
  })

  it('includes nested num-col and excludes project classes', async () => {
    const [referenceCss, projectCss] = await Promise.all([readFile(REFERENCE_CSS, 'utf8'), readFile(PROJECT_CSS, 'utf8')])
    const result = legacyOnlyClasses(referenceCss, projectCss)
    expect(result).toContain('num-col')
    for (const className of ['num', 'eyebrow', 'display', 'wordmark', 'text-muted']) expect(result).not.toContain(className)
  })

  it('recurses through source trees and ignores non-source files', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'design-scan-'))
    try {
      await writeFile(path.join(directory, 'root.ts'), 'export {}')
      await writeFile(path.join(directory, 'ignored.css'), '')
      await (await import('node:fs/promises')).mkdir(path.join(directory, 'nested'))
      await writeFile(path.join(directory, 'nested', 'child.tsx'), 'export {}')
      expect((await sourceFiles(directory)).map(({ file }) => file)).toEqual(['nested/child.tsx', 'root.ts'])
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it('reports violations without blocking until enforcement changes', async () => {
    const rule = RULES.find(({ name }) => name === 'foco-apagado')!
    const directory = await plant(rule)
    try {
      const found = await scan(directory, rule, await ruleContext())
      expect(() => enforce(rule, found)).not.toThrow()
      expect(() => enforce({ ...rule, enforcement: 'block' }, found)).toThrow('foco-apagado')
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it('resets the global color matcher between files', () => {
    const literal = ['#', 'ff00aa'].join('')
    expect(literalColors('first.tsx', `export const first = '${literal}'`)).toHaveLength(1)
    expect(literalColors('second.tsx', `export const second = '${literal}'`)).toHaveLength(1)
  })

})
