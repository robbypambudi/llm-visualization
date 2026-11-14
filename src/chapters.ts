export type ChapterStatus = 'ready' | 'planned'

export interface Chapter {
  id: string
  title: string
  summary: string
  status: ChapterStatus
}

export interface ChapterGroup {
  label: string
  chapters: Chapter[]
}

/** Urutan bab mengikuti alur data di dalam LLM decoder-only (gaya GPT). */
export const CHAPTER_GROUPS: ChapterGroup[] = [
  {
    label: 'Input',
    chapters: [
      {
        id: 'tokenization',
        title: 'Tokenization',
        summary: 'Teks dipecah menjadi token (mis. BPE) lalu dipetakan ke ID.',
        status: 'ready',
      },
      {
        id: 'token-embedding',
        title: 'Token Embedding',
        summary: 'Setiap ID token mengambil satu baris dari matriks embedding.',
        status: 'ready',
      },
      {
        id: 'positional-encoding',
        title: 'Positional Encoding',
        summary: 'Menyuntikkan informasi urutan: sinusoidal, learned, RoPE, ALiBi.',
        status: 'ready',
      },
    ],
  },
  {
    label: 'Transformer Block',
    chapters: [
      {
        id: 'self-attention',
        title: 'Self-Attention (Q, K, V)',
        summary: 'Scaled dot-product attention: softmax(QKᵀ/√d_k)·V.',
        status: 'planned',
      },
      {
        id: 'causal-mask',
        title: 'Causal Masking',
        summary: 'Token hanya boleh melihat token sebelumnya.',
        status: 'planned',
      },
      {
        id: 'multi-head',
        title: 'Multi-Head Attention',
        summary: 'Beberapa head paralel, lalu digabung dan diproyeksikan.',
        status: 'planned',
      },
      {
        id: 'residual-norm',
        title: 'Residual & LayerNorm',
        summary: 'Jalur residual dan normalisasi (Pre-LN, RMSNorm).',
        status: 'planned',
      },
      {
        id: 'feed-forward',
        title: 'Feed-Forward (MLP)',
        summary: 'MLP per-posisi: ekspansi, aktivasi (GELU/SwiGLU), proyeksi balik.',
        status: 'planned',
      },
    ],
  },
  {
    label: 'Output',
    chapters: [
      {
        id: 'logits',
        title: 'Unembedding & Logits',
        summary: 'Hidden state terakhir diproyeksikan ke ukuran vocabulary.',
        status: 'planned',
      },
      {
        id: 'sampling',
        title: 'Softmax & Sampling',
        summary: 'Temperature, top-k, top-p untuk memilih token berikutnya.',
        status: 'planned',
      },
    ],
  },
  {
    label: 'Inferensi',
    chapters: [
      {
        id: 'kv-cache',
        title: 'KV Cache',
        summary: 'Menyimpan K dan V agar generasi token tidak menghitung ulang.',
        status: 'planned',
      },
    ],
  },
]

export const ALL_CHAPTERS: Chapter[] = CHAPTER_GROUPS.flatMap((g) => g.chapters)

export const DEFAULT_CHAPTER_ID = 'tokenization'

export function chapterNumber(id: string): number {
  return ALL_CHAPTERS.findIndex((c) => c.id === id) + 1
}
