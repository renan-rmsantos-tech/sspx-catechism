import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { readdir } from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// This list shrinks as the waves migrate legacy screens. It is intentionally
// explicit so a new literal cannot hide behind an entire directory exemption.
export const COLOR_LITERAL_ALLOWLIST = new Set<string>()
const COLOR_LITERAL = /#[0-9a-fA-F]{3,8}\b|\b(?:rgb|hsl|oklch)\s*\(/g

export async function findLiteralColors(root: string, allowlist = COLOR_LITERAL_ALLOWLIST): Promise<string[]> {
  const violations: string[] = []
  async function visit(directory: string): Promise<void> {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name)
      if (entry.isDirectory()) await visit(file)
      else if (/\.(ts|tsx)$/.test(entry.name)) {
        const relative = path.relative(root, file)
        if (allowlist.has(relative)) continue
        const source = await (await import('node:fs/promises')).readFile(file, 'utf8')
        if (COLOR_LITERAL.test(source)) violations.push(relative)
        COLOR_LITERAL.lastIndex = 0
      }
    }
  }
  await visit(root)
  return violations
}

describe('color literal guard', () => {
  it('allows only documented legacy sources', async () => {
    await expect(findLiteralColors(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'))).resolves.toEqual([])
  })
  it('detects a planted literal outside the allowlist', async () => {
    const fixture = await mkdtemp(path.join(os.tmpdir(), 'color-guard-'))
    try {
      await writeFile(path.join(fixture, 'bad.tsx'), `export const color = '${['#', 'ff00aa'].join('')}'`)
      await expect(findLiteralColors(fixture, new Set())).resolves.toEqual(['bad.tsx'])
    } finally { await rm(fixture, { recursive: true, force: true }) }
  })
})
