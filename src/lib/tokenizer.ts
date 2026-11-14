import { useEffect, useState } from 'react'

/** The two real OpenAI encodings shown in the app (via the gpt-tokenizer package). */
export type EncodingName = 'r50k_base' | 'o200k_base'

export interface Tokenizer {
  name: EncodingName
  encode: (text: string) => number[]
  decode: (ids: Iterable<number>) => string
  vocabularySize: number
}

export const ENCODING_LABEL: Record<EncodingName, string> = {
  r50k_base: 'GPT-2',
  o200k_base: 'GPT-4o',
}

const cache = new Map<EncodingName, Promise<Tokenizer>>()

/** Loads an encoding on demand; the rank tables are large (≈0.6 MB and ≈2.4 MB), so they get their own chunks. */
export function loadTokenizer(name: EncodingName): Promise<Tokenizer> {
  let p = cache.get(name)
  if (!p) {
    const mod = name === 'r50k_base' ? import('gpt-tokenizer/encoding/r50k_base') : import('gpt-tokenizer/encoding/o200k_base')
    p = mod.then((m) => ({
      name,
      // Special tokens such as <|endoftext|> are encoded as themselves instead of throwing.
      encode: (text: string) => m.encode(text, { allowedSpecial: m.ALL_SPECIAL_TOKENS }),
      decode: m.decode,
      vocabularySize: m.vocabularySize,
    }))
    cache.set(name, p)
  }
  return p
}

/** Returns the tokenizer once loaded, or null while it is still downloading. */
export function useTokenizer(name: EncodingName): Tokenizer | null {
  const [tok, setTok] = useState<Tokenizer | null>(null)
  useEffect(() => {
    let alive = true
    loadTokenizer(name).then((t) => {
      if (alive) setTok(t)
    })
    return () => {
      alive = false
    }
  }, [name])
  return tok?.name === name ? tok : null
}

/** Makes whitespace visible inside a token: space → ·, newline → ↵, tab → →. */
export function visibleToken(text: string): string {
  return text.replace(/ /g, '·').replace(/\n/g, '↵').replace(/\t/g, '→')
}

/** A single token that is only part of a multi-byte character decodes to U+FFFD. */
export const isPartialByte = (text: string) => text.includes('�')
