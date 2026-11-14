import { describe, expect, it } from 'vitest'
import { SENTENCES } from '../pages/token-embedding/corpus'
import { buildBigrams, cloneModel, distance, initModel, predict, row, trainStep } from './embedding'

const data = buildBigrams(SENTENCES)
const id = (w: string) => data.vocab.indexOf(w)

function numericGrad(model: ReturnType<typeof initModel>, i: number) {
  const eps = 1e-6
  const a = cloneModel(model)
  const b = cloneModel(model)
  a.E[i] += eps
  b.E[i] -= eps
  return (trainStep(a, data, 0) - trainStep(b, data, 0)) / (2 * eps)
}

describe('toy next-word model', () => {
  it('builds bigrams from the corpus', () => {
    expect(data.vocab).toContain('.')
    expect(data.contextIds).not.toContain(id('.'))
  })

  it('probabilities sum to 1', () => {
    const m = initModel(data.vocab.length, 2, 1)
    const p = predict(m, id('kucing'))
    expect(p.reduce((s, x) => s + x, 0)).toBeCloseTo(1, 12)
  })

  it('analytic embedding gradient matches finite differences', () => {
    const m = initModel(data.vocab.length, 2, 3)
    const i = id('ayah') * 2 + 1
    const lr = 1
    const after = cloneModel(m)
    trainStep(after, data, lr)
    const analytic = (m.E[i] - after.E[i]) / lr
    expect(analytic).toBeCloseTo(numericGrad(m, i), 5)
  })

  it('training lowers the loss and groups words by what follows them', () => {
    const m = initModel(data.vocab.length, 2, 7)
    const first = trainStep(m, data, 1)
    let last = first
    for (let s = 0; s < 3000; s++) last = trainStep(m, data, 1)
    expect(last).toBeLessThan(first * 0.6)
    const d = (a: string, b: string) => distance(row(m, id(a)), row(m, id(b)))
    // Same group closer than different groups.
    expect(d('kucing', 'anjing')).toBeLessThan(d('kucing', 'ibu'))
    expect(d('ibu', 'ayah')).toBeLessThan(d('ibu', 'makan'))
    expect(d('ikan', 'susu')).toBeLessThan(d('ikan', 'kucing'))
  })
})
