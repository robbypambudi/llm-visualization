# LLM Visualization

Visualisasi interaktif cara kerja LLM (decoder-only, gaya GPT), bab demi bab.
Dibangun dengan Vite + React + TypeScript; rumus ditampilkan dengan KaTeX.

```bash
npm install
npm run dev     # server pengembangan
npm test        # uji matematika, BPE, dan model embedding mini (vitest)
npm run build   # typecheck + build produksi
```

## Struktur

```
src/
  chapters.ts                 daftar bab di sidebar (status ready / planned)
  lib/positional.ts           matematika PE sinusoidal, RoPE, decay bound (+ tes)
  lib/bpe.ts                  BPE mini untuk demo (+ tes)
  lib/embedding.ts            model tebak-kata-berikutnya mini untuk demo embedding (+ tes)
  lib/tokenizer.ts            memuat tokenizer GPT-2 / GPT-4o (gpt-tokenizer) secara lazy
  lib/color.ts, lib/theme.ts  skala warna diverging (OKLab) & tema terang/gelap
  components/                 Sidebar, Heatmap (canvas), LineChart (SVG), kontrol, Tex
  pages/tokenization/         bab 1, satu file per bagian halaman
  pages/token-embedding/      bab 2
  pages/positional-encoding/  bab 3
```

Menambah bab baru: ubah `status` di `src/chapters.ts` menjadi `'ready'`, buat
folder di `src/pages/`, lalu daftarkan halamannya di `src/App.tsx`.

Catatan deploy (Cloudflare Pages memakai npm 10): saat menambah dependensi, pakai
`npx npm@10.9.2 install <paket>` atau cek dengan `npx npm@10.9.2 ci --dry-run`
sebelum push, agar `package-lock.json` tetap bisa dipakai `npm ci`.

## Referensi

- Sennrich dkk. (2016), *Neural Machine Translation of Rare Words with Subword Units*
- Radford dkk. (2019), *Language Models are Unsupervised Multitask Learners* (GPT-2)
- Petrov dkk. (2023), *Language Model Tokenizers Introduce Unfairness Between Languages*
- Mikolov dkk. (2013), *Efficient Estimation of Word Representations in Vector Space*
- Press & Wolf (2017), *Using the Output Embedding to Improve Language Models*
- Vaswani dkk. (2017), *Attention Is All You Need* — §3.4, §3.5
- Su dkk. (2021), *RoFormer: Enhanced Transformer with Rotary Position Embedding*
- Press dkk. (2021), *Train Short, Test Long: Attention with Linear Biases*
- Haviv dkk. (2022), *Transformer Language Models without Positional Encodings Still Learn Positional Information*
