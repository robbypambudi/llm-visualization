/**
 * Toy character-level BPE trainer (Sennrich et al., 2016), for teaching only.
 * Words are split on whitespace and merges never cross word boundaries.
 * Real tokenizers (GPT-2 etc.) work on bytes and use a pre-tokenizer regex;
 * the merge loop itself is the same idea.
 */

export interface BpeMerge {
  left: string
  right: string
  merged: string
  /** How many times the pair occurred in the corpus when it was merged. */
  count: number
}

export interface WordSegmentation {
  word: string
  count: number
  pieces: string[]
}

export interface BpeResult {
  merges: BpeMerge[]
  words: WordSegmentation[]
  /** Base characters followed by merged symbols, in the order they were added. */
  vocab: string[]
  /** Total number of tokens needed for the whole corpus. */
  tokenCount: number
}

export function wordCounts(text: string): Map<string, number> {
  const counts = new Map<string, number>()
  for (const w of text.split(/\s+/)) if (w) counts.set(w, (counts.get(w) ?? 0) + 1)
  return counts
}

const SEP = '\u0000'

/**
 * Runs up to `maxMerges` merges. Each step merges the most frequent adjacent pair;
 * ties go to the pair seen first while scanning the corpus, so results are stable.
 * Stops early once no pair occurs at least twice.
 */
export function trainBpe(text: string, maxMerges: number): BpeResult {
  const words = [...wordCounts(text)].map(([word, count]) => ({ word, count, pieces: Array.from(word) }))
  const vocab = [...new Set(words.flatMap((w) => w.pieces))].sort()
  const merges: BpeMerge[] = []

  for (let step = 0; step < maxMerges; step++) {
    const pairCounts = new Map<string, number>()
    for (const w of words) {
      for (let i = 0; i < w.pieces.length - 1; i++) {
        const key = w.pieces[i] + SEP + w.pieces[i + 1]
        pairCounts.set(key, (pairCounts.get(key) ?? 0) + w.count)
      }
    }
    let bestKey = ''
    let bestCount = 1
    for (const [key, c] of pairCounts) {
      if (c > bestCount) {
        bestKey = key
        bestCount = c
      }
    }
    if (!bestKey) break
    const [left, right] = bestKey.split(SEP)
    const merged = left + right
    for (const w of words) w.pieces = mergePair(w.pieces, left, right)
    merges.push({ left, right, merged, count: bestCount })
    vocab.push(merged)
  }

  const tokenCount = words.reduce((acc, w) => acc + w.pieces.length * w.count, 0)
  return { merges, words, vocab, tokenCount }
}

function mergePair(pieces: string[], left: string, right: string): string[] {
  const out: string[] = []
  for (let i = 0; i < pieces.length; i++) {
    if (i < pieces.length - 1 && pieces[i] === left && pieces[i + 1] === right) {
      out.push(left + right)
      i++
    } else {
      out.push(pieces[i])
    }
  }
  return out
}

/** Tokenizes a new word by replaying the learned merges in order, as BPE does at inference time. */
export function applyBpe(word: string, merges: BpeMerge[]): string[] {
  let pieces = Array.from(word)
  for (const m of merges) pieces = mergePair(pieces, m.left, m.right)
  return pieces
}
