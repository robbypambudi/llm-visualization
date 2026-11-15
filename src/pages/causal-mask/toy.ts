import { hashString, randomNormalVector } from '../../lib/positional'
import { attention, matmul, randomMatrix, type Mat } from '../../lib/transformer'

/** Word-level "tokens" keep the demo readable; a real tokenizer would cut this sentence differently. */
export const TOKENS = ['kucing', 'itu', 'tidur', 'karena', 'dia', 'lelah', '.']

export const D = 4

// Illustration only: one random vector per word and random projection matrices, fixed by seeds.
const WQ = randomMatrix(D, D, 101, 0.45)
const WK = randomMatrix(D, D, 202, 0.45)
const WV = randomMatrix(D, D, 303, 0.45)

const embed = (w: string) => Array.from(randomNormalVector(D, hashString(w)))

export interface Toy {
  tokens: string[]
  Q: Mat
  K: Mat
  V: Mat
}

export function makeToy(tokens: string[]): Toy {
  const X = tokens.map(embed)
  return { tokens, Q: matmul(X, WQ), K: matmul(X, WK), V: matmul(X, WV) }
}

export const BASE = makeToy(TOKENS)
/** Scaled scores QKᵀ/√d for the base sentence, before any mask. */
export const BASE_SCORES = attention(BASE.Q, BASE.K, BASE.V).scores
