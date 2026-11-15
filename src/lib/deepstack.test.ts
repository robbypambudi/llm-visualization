import { describe, expect, it } from 'vitest'
import { simulateStack } from './deepstack'

// The residual-norm chapter describes these outcomes in prose, so they are pinned here.
const base = { d: 64, depth: 48, seed: 3 }
const gains = Array.from({ length: 26 }, (_, i) => 0.5 + i * 0.1)

describe('simulateStack', () => {
  it('starts from the input itself', () => {
    const r = simulateStack({ ...base, gain: 1, residual: true, scale: 0.5 })
    expect(r.cos[0]).toBeCloseTo(1, 12)
    expect(r.gradLog[48]).toBe(0)
  })

  it('plain stack: one layer already rewrites the vector', () => {
    for (const gain of gains) {
      expect(simulateStack({ ...base, gain, residual: false, scale: 1 }).cos[1]).toBeLessThan(0.3)
    }
  })

  it('plain stack: small gain makes the signal and the gradient vanish, large gain makes the gradient explode', () => {
    const small = simulateStack({ ...base, gain: 0.5, residual: false, scale: 1 })
    expect(small.norm[48]).toBeLessThan(0.01)
    expect(small.gradLog[0]).toBeLessThan(-14)
    expect(simulateStack({ ...base, gain: 3, residual: false, scale: 1 }).gradLog[0]).toBeGreaterThan(5)
  })

  it('residual stack keeps the gradient within a tame range', () => {
    for (const gain of gains) {
      const half = simulateStack({ ...base, gain, residual: true, scale: 0.5 }).gradLog[0]
      expect(half).toBeGreaterThan(0)
      expect(half).toBeLessThan(Math.log10(50))
      const small = simulateStack({ ...base, gain, residual: true, scale: 0.2 }).gradLog[0]
      expect(small).toBeGreaterThan(0)
      expect(small).toBeLessThan(Math.log10(3))
    }
  })

  it('residual stack keeps more of the input, but its length keeps growing', () => {
    const plain = simulateStack({ ...base, gain: 1, residual: false, scale: 0.5 })
    const res = simulateStack({ ...base, gain: 1, residual: true, scale: 0.5 })
    expect(res.cos[48]).toBeGreaterThan(plain.cos[48] + 0.2)
    expect(res.cos[12]).toBeGreaterThan(0.5)
    expect(res.norm[48]).toBeGreaterThan(3 * res.norm[0])
  })
})
