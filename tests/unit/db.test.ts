import { describe, it, expect } from 'vitest'

describe('Convex Schema', () => {
  it('exports schema definition', async () => {
    const mod = await import('../../convex/schema')
    expect(mod.default).toBeDefined()
  })

  it('schema has projects table', async () => {
    const mod = await import('../../convex/schema')
    expect(mod.default.tables).toBeDefined()
  })
})
