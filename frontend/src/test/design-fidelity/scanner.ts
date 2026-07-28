import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import type { Rule, RuleContext, SourceFile, Violation } from './types'

const SOURCE_FILE = /\.(ts|tsx)$/
const TEST_FILE = /\.test\.(ts|tsx)$/

export async function sourceFiles(root: string): Promise<SourceFile[]> {
  const found: SourceFile[] = []

  async function visit(directory: string): Promise<void> {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name)
      if (entry.isDirectory()) await visit(file)
      else if (SOURCE_FILE.test(entry.name) && !TEST_FILE.test(entry.name)) {
        const relative = path.relative(root, file)
        if (!relative.startsWith(`test${path.sep}`)) found.push({ file: relative, source: await readFile(file, 'utf8') })
      }
    }
  }

  await visit(root)
  return found.sort((left, right) => left.file.localeCompare(right.file))
}

export async function scan(root: string, rule: Rule, ctx: RuleContext): Promise<Violation[]> {
  const found = await sourceFiles(root)
  return found.flatMap(({ file, source }) => rule.inspect(file, source, ctx)).sort(compareViolations)
}

export function compareViolations(left: Violation, right: Violation): number {
  return left.file.localeCompare(right.file) || left.line - right.line || left.excerpt.localeCompare(right.excerpt)
}

export function violation(file: string, source: string, offset: number, excerpt: string): Violation {
  return {
    file,
    line: source.slice(0, offset).split('\n').length,
    excerpt: excerpt.trim(),
  }
}
