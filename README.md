# LLM Visualization

Visualisasi interaktif cara kerja LLM (decoder-only, gaya GPT), bab demi bab.
Dibangun dengan Vite + React + TypeScript; rumus ditampilkan dengan KaTeX.

```bash
npm install
npm run dev     # server pengembangan
npm test        # uji matematika (vitest)
npm run build   # typecheck + build produksi
```

## Struktur

```
src/
  chapters.ts                 daftar bab di sidebar (status ready / planned)
  lib/positional.ts           matematika PE sinusoidal, RoPE, decay bound (+ tes)
  lib/color.ts, lib/theme.ts  skala warna diverging (OKLab) & tema terang/gelap
  components/                 Sidebar, Heatmap (canvas), LineChart (SVG), kontrol, Tex
  pages/positional-encoding/  satu file per bagian halaman
```

Menambah bab baru: ubah `status` di `src/chapters.ts` menjadi `'ready'`, buat
folder di `src/pages/`, lalu daftarkan halamannya di `src/App.tsx`.

## Referensi

- Vaswani dkk. (2017), *Attention Is All You Need* — §3.4, §3.5
- Su dkk. (2021), *RoFormer: Enhanced Transformer with Rotary Position Embedding*
- Press dkk. (2021), *Train Short, Test Long: Attention with Linear Biases*
- Haviv dkk. (2022), *Transformer Language Models without Positional Encodings Still Learn Positional Information*
