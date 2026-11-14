import { describe, expect, it } from 'vitest'
import { applyBpe, trainBpe, wordCounts } from './bpe'

// The worked example from the Hugging Face tokenizer summary.
const HF_CORPUS = [
  ...Array(10).fill('hug'),
  ...Array(5).fill('pug'),
  ...Array(12).fill('pun'),
  ...Array(4).fill('bun'),
  ...Array(5).fill('hugs'),
].join(' ')

describe('toy BPE', () => {
  it('counts words', () => {
    expect(wordCounts(HF_CORPUS).get('pun')).toBe(12)
  })

  it('reproduces the Hugging Face example merges', () => {
    const { merges, vocab } = trainBpe(HF_CORPUS, 3)
    expect(merges.map((m) => [m.merged, m.count])).toEqual([
      ['ug', 20],
      ['un', 16],
      ['hug', 15],
    ])
    expect(vocab.slice(0, 7)).toEqual(['b', 'g', 'h', 'n', 'p', 's', 'u'])
  })

  it('token count never grows as merges are added', () => {
    let prev = Infinity
    for (let k = 0; k <= 8; k++) {
      const { tokenCount } = trainBpe(HF_CORPUS, k)
      expect(tokenCount).toBeLessThanOrEqual(prev)
      prev = tokenCount
    }
  })

  it('applies merges to an unseen word', () => {
    const { merges } = trainBpe(HF_CORPUS, 3)
    expect(applyBpe('bugs', merges)).toEqual(['b', 'ug', 's'])
    expect(applyBpe('hugging', merges)).toEqual(['hug', 'g', 'i', 'n', 'g'])
  })

  it('stops when no pair repeats', () => {
    expect(trainBpe('abc', 10).merges).toHaveLength(0)
  })
})
