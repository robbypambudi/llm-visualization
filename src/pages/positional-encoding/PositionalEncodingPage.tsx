import { useCallback, useState } from 'react'
import { Field, Segmented, Slider } from '../../components/Controls'
import { chapterNumber } from '../../chapters'
import type { ChartTheme } from '../../lib/theme'
import { AddEmbeddingSection } from './AddEmbeddingSection'
import { ClocksSection } from './ClocksSection'
import { ClosingSection } from './ClosingSection'
import { DesignSection } from './DesignSection'
import { FormulaSection } from './FormulaSection'
import { MatrixSection } from './MatrixSection'
import { RotationSection } from './RotationSection'
import { SimilaritySection } from './SimilaritySection'
import { VariantsSection } from './VariantsSection'
import { WavesSection } from './WavesSection'
import { WhyPosition } from './WhyPosition'
import { BASE_OPTIONS, DEFAULT_PARAMS, D_OPTIONS, type PeParams } from './state'

export function PositionalEncodingPage({ theme }: { theme: ChartTheme }) {
  const [params, setParams] = useState<PeParams>(DEFAULT_PARAMS)
  const set = <K extends keyof PeParams>(key: K, value: PeParams[K]) =>
    setParams((p) => {
      const next = { ...p, [key]: value }
      next.pos = Math.min(next.pos, next.seqLen - 1)
      return next
    })
  const setPos = useCallback((pos: number) => setParams((p) => ({ ...p, pos })), [])

  return (
    <article className="page">
      <header className="page-header">
        <div className="eyebrow">BAB {String(chapterNumber('positional-encoding')).padStart(2, '0')} · INPUT</div>
        <h1>Positional Encoding</h1>
        <p className="lede">
          Transformer membaca semua kata sekaligus, jadi ia tidak tahu kata mana yang datang lebih dulu. Positional
          encoding memberi setiap posisi sebuah “tanda” berupa deretan angka, mirip nomor kursi, agar model bisa membedakan
          token ke-1 dari token ke-10. Bab ini membahas apa tanda itu, kenapa bentuknya begitu, dan apa alternatifnya.
        </p>
        <div className="callout">
          <div className="card-title" style={{ marginBottom: 8 }}>
            Kosakata singkat
          </div>
          <dl className="glossary">
            <dt>Token</dt>
            <dd>Potongan teks yang dibaca model. Agar sederhana, di bab ini satu token dianggap satu kata.</dd>
            <dt>Vektor</dt>
            <dd>Deretan angka, misalnya [0.2, −1.3, 0.7]. Model hanya bisa mengolah angka, jadi setiap token diubah jadi vektor.</dd>
            <dt>Dimensi</dt>
            <dd>Satu angka di dalam vektor. Vektor dengan 512 angka disebut punya 512 dimensi.</dd>
            <dt>Embedding</dt>
            <dd>Vektor yang mewakili makna sebuah token. “Kucing” selalu mendapat embedding yang sama di posisi mana pun.</dd>
            <dt>Attention</dt>
            <dd>Bagian Transformer yang menentukan kata mana yang perlu diperhatikan oleh kata lain.</dd>
          </dl>
        </div>
      </header>

      <WhyPosition theme={theme} />
      <DesignSection theme={theme} />
      <FormulaSection />

      <div className="sticky-controls" style={{ marginTop: 32 }}>
        <div className="controls">
          <Field label={<>d<sub>model</sub></>}>
            <Segmented
              ariaLabel="d_model"
              value={params.d}
              options={D_OPTIONS.map((v) => ({ value: v, label: String(v) }))}
              onChange={(v) => set('d', v)}
            />
          </Field>
          <Slider label="panjang urutan" value={params.seqLen} min={8} max={256} step={4} onChange={(v) => set('seqLen', v)} />
          <Slider label="posisi terpilih" value={params.pos} min={0} max={params.seqLen - 1} onChange={setPos} />
          <Field label="base">
            <Segmented
              ariaLabel="base"
              value={params.base}
              options={BASE_OPTIONS.map((v) => ({ value: v, label: String(v) }))}
              onChange={(v) => set('base', v)}
            />
          </Field>
          <Field label="layout kanal">
            <Segmented
              ariaLabel="layout kanal"
              value={params.layout}
              options={[
                { value: 'interleaved', label: 'interleaved' },
                { value: 'concatenated', label: 'concat' },
              ]}
              onChange={(v) => set('layout', v)}
            />
          </Field>
        </div>
      </div>
      <p className="card-sub" style={{ marginTop: 8 }}>
        Panel ini mengatur bagian 4–9. <strong>d<sub>model</sub></strong> = panjang vektor, <strong>panjang urutan</strong>{' '}
        = jumlah token, <strong>base</strong> = angka 10000 di rumus. Paper memakai base 10000 dan layout{' '}
        <em>interleaved</em> (sin dan cos berselang-seling). Kode tensor2tensor dari Google menaruh semua sin dulu, lalu
        semua cos (<em>concat</em>). Isinya sama, hanya urutan kolomnya yang berbeda.
      </p>

      <MatrixSection params={params} setPos={setPos} theme={theme} />
      <WavesSection params={params} theme={theme} />
      <ClocksSection params={params} setPos={setPos} />
      <SimilaritySection params={params} setPos={setPos} theme={theme} />
      <RotationSection params={params} theme={theme} />
      <AddEmbeddingSection params={params} theme={theme} />
      <VariantsSection params={params} theme={theme} />
      <ClosingSection />

      <section className="section" id="refs">
        <h2>
          <span className="section-num">12</span>Referensi
        </h2>
        <ul className="refs">
          <li>
            Vaswani dkk. (2017). <a href="https://arxiv.org/abs/1706.03762">Attention Is All You Need</a> — §3.4
            (√d<sub>model</sub>), §3.5 (positional encoding), Tabel 3 baris (E).
          </li>
          <li>
            Su dkk. (2021). <a href="https://arxiv.org/abs/2104.09864">RoFormer: Enhanced Transformer with Rotary Position Embedding</a>{' '}
            — Eq. 34, §3.4.3.
          </li>
          <li>
            Press, Smith &amp; Lewis (2021).{' '}
            <a href="https://arxiv.org/abs/2108.12409">Train Short, Test Long: Attention with Linear Biases Enables Input Length Extrapolation</a>.
          </li>
          <li>
            Haviv dkk. (2022).{' '}
            <a href="https://arxiv.org/abs/2203.16634">Transformer Language Models without Positional Encodings Still Learn Positional Information</a>.
          </li>
          <li>
            Kazemnejad, A. (2019).{' '}
            <a href="https://kazemnejad.com/blog/transformer_architecture_positional_encoding/">Transformer Architecture: The Positional Encoding</a>{' '}
            — analogi biner dan daftar syarat.
          </li>
          <li>
            Fleetwood, C. (2024).{' '}
            <a href="https://huggingface.co/blog/designing-positional-encoding">You could have designed state of the art positional encoding</a>{' '}
            — alur dari nomor urut ke biner, sinusoidal, lalu RoPE.
          </li>
          <li>
            Hugging Face Transformers — dokumentasi <a href="https://huggingface.co/docs/transformers/model_doc/gpt2">GPT-2</a>{' '}
            dan <a href="https://huggingface.co/docs/transformers/model_doc/bert">BERT</a> (ukuran position embedding).
          </li>
        </ul>
      </section>
    </article>
  )
}
