/**
 * Positional encoding math.
 *
 * References
 * - Vaswani et al., "Attention Is All You Need" (2017), §3.5
 *     PE(pos, 2i)   = sin(pos / 10000^(2i/d_model))
 *     PE(pos, 2i+1) = cos(pos / 10000^(2i/d_model))
 * - Su et al., "RoFormer: Enhanced Transformer with Rotary Position Embedding" (2021)
 *     θ_i = 10000^(-2(i-1)/d), i ∈ [1, d/2]   (here 0-indexed: θ_i = base^(-2i/d))
 *     R^d_{Θ,m} x = x ⊗ cos(mθ) + rot(x) ⊗ sin(mθ),  rot(x) = (-x2, x1, -x4, x3, …)
 */

/** Channel layout of the sinusoidal matrix. */
export type PeLayout =
  /** Paper (§3.5): even dims are sin, odd dims are cos for the same frequency. */
  | 'interleaved'
  /** tensor2tensor `get_timing_signal_1d`: all sin first, then all cos. */
  | 'concatenated'

/** Angular frequency of pair i: ω_i = 1 / base^(2i/d). Same as RoPE's θ_i. */
export function frequency(i: number, d: number, base = 10000): number {
  return 1 / Math.pow(base, (2 * i) / d)
}

/** Wavelength of pair i in positions: λ_i = 2π · base^(2i/d). */
export function wavelength(i: number, d: number, base = 10000): number {
  return (2 * Math.PI) / frequency(i, d, base)
}

/** Single value PE(pos, dim). */
export function peValue(
  pos: number,
  dim: number,
  d: number,
  base = 10000,
  layout: PeLayout = 'interleaved',
): number {
  const half = d / 2
  const pair = layout === 'interleaved' ? Math.floor(dim / 2) : dim % half
  const isSin = layout === 'interleaved' ? dim % 2 === 0 : dim < half
  const angle = pos * frequency(pair, d, base)
  return isSin ? Math.sin(angle) : Math.cos(angle)
}

/** Full PE vector for one position (length d). */
export function peVector(
  pos: number,
  d: number,
  base = 10000,
  layout: PeLayout = 'interleaved',
): Float64Array {
  const out = new Float64Array(d)
  for (let dim = 0; dim < d; dim++) out[dim] = peValue(pos, dim, d, base, layout)
  return out
}

/** PE matrix of shape [seqLen, d], row-major. */
export function peMatrix(
  seqLen: number,
  d: number,
  base = 10000,
  layout: PeLayout = 'interleaved',
): Float64Array {
  const out = new Float64Array(seqLen * d)
  for (let pos = 0; pos < seqLen; pos++) {
    for (let dim = 0; dim < d; dim++) {
      out[pos * d + dim] = peValue(pos, dim, d, base, layout)
    }
  }
  return out
}

export function dot(a: ArrayLike<number>, b: ArrayLike<number>): number {
  let s = 0
  for (let i = 0; i < a.length; i++) s += a[i] * b[i]
  return s
}

/**
 * PE(p) · PE(q), closed form.
 * sin(pω)sin(qω) + cos(pω)cos(qω) = cos((p − q)ω), so the dot product is
 * Σ_i cos((p − q) ω_i) — it depends only on the offset p − q.
 */
export function peDotClosedForm(offset: number, d: number, base = 10000): number {
  let s = 0
  for (let i = 0; i < d / 2; i++) s += Math.cos(offset * frequency(i, d, base))
  return s
}

/**
 * The linear map M_k with PE(pos + k) = M_k · PE(pos) restricted to pair i,
 * acting on the column vector [sin(pos ω_i), cos(pos ω_i)]:
 *   sin(a + b) =  cos b · sin a + sin b · cos a
 *   cos(a + b) = −sin b · sin a + cos b · cos a
 * Returned row-major as [m00, m01, m10, m11].
 */
export function shiftMatrix(k: number, i: number, d: number, base = 10000): [number, number, number, number] {
  const b = k * frequency(i, d, base)
  const c = Math.cos(b)
  const s = Math.sin(b)
  return [c, s, -s, c]
}

/* ------------------------------------------------------------------ */
/* RoPE                                                                */
/* ------------------------------------------------------------------ */

/** RoPE pairing convention. */
export type RopePairing =
  /** RoFormer paper / GPT-J: pairs (x0,x1), (x2,x3), … */
  | 'interleaved'
  /** GPT-NeoX / HF Llama `rotate_half`: pairs (x_i, x_{i + d/2}). */
  | 'half'

/** Indices of the two coordinates that form pair i. */
export function ropePairIndices(i: number, d: number, pairing: RopePairing): [number, number] {
  return pairing === 'interleaved' ? [2 * i, 2 * i + 1] : [i, i + d / 2]
}

/** Apply R^d_{Θ,m} to x (RoFormer Eq. 34, generalised to both pairings). */
export function applyRope(
  x: ArrayLike<number>,
  m: number,
  base = 10000,
  pairing: RopePairing = 'interleaved',
): Float64Array {
  const d = x.length
  const out = new Float64Array(d)
  for (let i = 0; i < d / 2; i++) {
    const [a, b] = ropePairIndices(i, d, pairing)
    const angle = m * frequency(i, d, base)
    const c = Math.cos(angle)
    const s = Math.sin(angle)
    out[a] = x[a] * c - x[b] * s
    out[b] = x[a] * s + x[b] * c
  }
  return out
}

/** Attention logit (unscaled) between query at position m and key at position n. */
export function ropeScore(
  q: ArrayLike<number>,
  k: ArrayLike<number>,
  m: number,
  n: number,
  base = 10000,
  pairing: RopePairing = 'interleaved',
): number {
  return dot(applyRope(q, m, base, pairing), applyRope(k, n, base, pairing))
}

/**
 * RoFormer §3.4.3 long-term decay quantity:
 *   (1 / (d/2)) Σ_{j=1}^{d/2} |S_j|,   S_j = Σ_{i=0}^{j−1} e^{i·r·θ_i}
 * where r = m − n is the relative distance.
 */
export function ropeDecayBound(r: number, d: number, base = 10000): number {
  let re = 0
  let im = 0
  let total = 0
  for (let i = 0; i < d / 2; i++) {
    const angle = r * frequency(i, d, base)
    re += Math.cos(angle)
    im += Math.sin(angle)
    total += Math.hypot(re, im)
  }
  return total / (d / 2)
}

/* ------------------------------------------------------------------ */
/* Deterministic pseudo-random vectors for demos                       */
/* ------------------------------------------------------------------ */

/** mulberry32 PRNG — small, deterministic, good enough for demo vectors. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Standard-normal samples via Box–Muller, scaled by `std`. */
export function randomNormalVector(d: number, seed: number, std = 1): Float64Array {
  const rand = mulberry32(seed)
  const out = new Float64Array(d)
  for (let i = 0; i < d; i += 2) {
    const u1 = Math.max(rand(), 1e-12)
    const u2 = rand()
    const r = Math.sqrt(-2 * Math.log(u1))
    out[i] = r * Math.cos(2 * Math.PI * u2) * std
    if (i + 1 < d) out[i + 1] = r * Math.sin(2 * Math.PI * u2) * std
  }
  return out
}

/** Simple string hash (FNV-1a) used to seed a token's demo embedding. */
export function hashString(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}
