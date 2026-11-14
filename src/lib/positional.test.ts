import { describe, expect, it } from 'vitest'
import {
  applyRope,
  dot,
  frequency,
  peDotClosedForm,
  peMatrix,
  peValue,
  peVector,
  randomNormalVector,
  ropeDecayBound,
  ropeScore,
  shiftMatrix,
  wavelength,
} from './positional'

const D = 64

describe('sinusoidal positional encoding (Vaswani et al. §3.5)', () => {
  it('matches the paper formula for even (sin) and odd (cos) dims', () => {
    for (const pos of [0, 1, 7, 42, 999]) {
      for (let i = 0; i < D / 2; i++) {
        const angle = pos / Math.pow(10000, (2 * i) / D)
        expect(peValue(pos, 2 * i, D)).toBeCloseTo(Math.sin(angle), 12)
        expect(peValue(pos, 2 * i + 1, D)).toBeCloseTo(Math.cos(angle), 12)
      }
    }
  })

  it('position 0 is [0, 1, 0, 1, …]', () => {
    const v = peVector(0, D)
    for (let dim = 0; dim < D; dim++) expect(v[dim]).toBe(dim % 2 === 0 ? 0 : 1)
  })

  it('wavelengths form a geometric progression from 2π towards 10000·2π', () => {
    expect(wavelength(0, D)).toBeCloseTo(2 * Math.PI, 12)
    const ratio = wavelength(1, D) / wavelength(0, D)
    for (let i = 1; i < D / 2; i++) {
      expect(wavelength(i, D) / wavelength(i - 1, D)).toBeCloseTo(ratio, 9)
    }
    // the last pair has exponent 2(d/2 − 1)/d < 1, so it stays below 10000·2π
    expect(wavelength(D / 2 - 1, D)).toBeLessThan(10000 * 2 * Math.PI)
  })

  it('every PE vector has squared norm d/2', () => {
    for (const pos of [0, 3, 100]) expect(dot(peVector(pos, D), peVector(pos, D))).toBeCloseTo(D / 2, 9)
  })

  it('PE(p)·PE(q) depends only on p − q and equals Σ cos((p−q)ω_i)', () => {
    for (const [p, q] of [[5, 2], [105, 102], [50, 80], [10, 40]]) {
      expect(dot(peVector(p, D), peVector(q, D))).toBeCloseTo(peDotClosedForm(p - q, D), 9)
    }
    expect(dot(peVector(5, D), peVector(2, D))).toBeCloseTo(dot(peVector(105, D), peVector(102, D)), 9)
  })

  it('PE(pos + k) is a linear (rotation) function of PE(pos)', () => {
    for (const [pos, k] of [[3, 4], [17, 25], [0, 9]]) {
      const a = peVector(pos, D)
      const b = peVector(pos + k, D)
      for (let i = 0; i < D / 2; i++) {
        const [m00, m01, m10, m11] = shiftMatrix(k, i, D)
        const s = a[2 * i]
        const c = a[2 * i + 1]
        expect(m00 * s + m01 * c).toBeCloseTo(b[2 * i], 9)
        expect(m10 * s + m11 * c).toBeCloseTo(b[2 * i + 1], 9)
      }
    }
  })

  it('concatenated layout is a channel permutation of the interleaved one', () => {
    const inter = peMatrix(20, D, 10000, 'interleaved')
    const concat = peMatrix(20, D, 10000, 'concatenated')
    for (let pos = 0; pos < 20; pos++) {
      for (let i = 0; i < D / 2; i++) {
        expect(concat[pos * D + i]).toBe(inter[pos * D + 2 * i])
        expect(concat[pos * D + D / 2 + i]).toBe(inter[pos * D + 2 * i + 1])
      }
    }
  })
})

describe('RoPE (Su et al.)', () => {
  const q = randomNormalVector(D, 1)
  const k = randomNormalVector(D, 2)

  it('uses θ_i = 10000^(−2i/d)', () => {
    expect(frequency(0, D)).toBe(1)
    expect(frequency(5, D)).toBeCloseTo(Math.pow(10000, -10 / D), 15)
  })

  it('is a rotation: preserves the norm', () => {
    for (const pairing of ['interleaved', 'half'] as const) {
      expect(dot(applyRope(q, 37, 10000, pairing), applyRope(q, 37, 10000, pairing))).toBeCloseTo(dot(q, q), 9)
    }
  })

  it('matches RoFormer Eq. 34 element-wise form', () => {
    const m = 11
    const out = applyRope(q, m)
    for (let i = 0; i < D / 2; i++) {
      const c = Math.cos(m * frequency(i, D))
      const s = Math.sin(m * frequency(i, D))
      expect(out[2 * i]).toBeCloseTo(q[2 * i] * c + -q[2 * i + 1] * s, 12)
      expect(out[2 * i + 1]).toBeCloseTo(q[2 * i + 1] * c + q[2 * i] * s, 12)
    }
  })

  it('q_m·k_n depends only on m − n (both pairings)', () => {
    for (const pairing of ['interleaved', 'half'] as const) {
      const a = ropeScore(q, k, 7, 3, 10000, pairing)
      const b = ropeScore(q, k, 107, 103, 10000, pairing)
      expect(a).toBeCloseTo(b, 9)
    }
  })

  it('m = n gives the plain dot product', () => {
    expect(ropeScore(q, k, 9, 9)).toBeCloseTo(dot(q, k), 9)
  })

  it('decay bound is (d/2 + 1)/2 at r = 0 and smaller far away', () => {
    // at r = 0, |S_j| = j, so the mean is (d/2 + 1)/2
    expect(ropeDecayBound(0, D)).toBeCloseTo((D / 2 + 1) / 2, 12)
    const near = ropeDecayBound(1, D)
    const far = ropeDecayBound(200, D)
    expect(far).toBeLessThan(near)
  })
})
