import { useCallback, useState } from 'react'
import { Field, Segmented, Slider } from '../../components/Controls'
import { Tex } from '../../components/Tex'
import { chapterNumber } from '../../chapters'
import type { ChartTheme } from '../../lib/theme'
import { AddEmbeddingSection } from './AddEmbeddingSection'
import { ClocksSection } from './ClocksSection'
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
          Attention tidak tahu urutan kata. Positional encoding memberi setiap posisi sebuah vektor unik agar model bisa
          membedakan “token ke-1” dari “token ke-10”. Bab ini membedah versi sinusoidal dari paper{' '}
          <em>Attention Is All You Need</em>, lalu membandingkannya dengan learned embedding, RoPE, dan ALiBi.
        </p>
      </header>

      <WhyPosition theme={theme} />

      <section className="section" id="formula">
        <h2>
          <span className="section-num">2</span>Rumus sinusoidal
        </h2>
        <div className="prose">
          <p>
            Untuk posisi <Tex>{`pos`}</Tex> dan indeks pasangan <Tex>{`i \\in \\{0, \\dots, d/2-1\\}`}</Tex>, dimensi
            genap memakai sinus dan dimensi ganjil memakai kosinus dengan frekuensi yang sama (Vaswani dkk., 2017, §3.5):
          </p>
        </div>
        <Tex block>{`PE_{(pos,\\,2i)} = \\sin\\!\\left(\\frac{pos}{10000^{2i/d_{model}}}\\right), \\qquad PE_{(pos,\\,2i+1)} = \\cos\\!\\left(\\frac{pos}{10000^{2i/d_{model}}}\\right)`}</Tex>
        <div className="prose">
          <p>
            Ditulis dengan frekuensi sudut <Tex>{`\\omega_i = 10000^{-2i/d_{model}}`}</Tex>, nilainya adalah{' '}
            <Tex>{`\\sin(pos\\,\\omega_i)`}</Tex> dan <Tex>{`\\cos(pos\\,\\omega_i)`}</Tex>. Di model dasar paper,{' '}
            <Tex>{`d_{model} = 512`}</Tex>. Tidak ada parameter yang dilatih — semuanya dihitung dari rumus.
          </p>
        </div>
      </section>

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
        Kontrol ini berlaku untuk bagian 3–8. Paper memakai base 10000 dan layout <em>interleaved</em> (sin di dimensi
        genap, cos di ganjil). Implementasi tensor2tensor menaruh semua sin lalu semua cos (<em>concat</em>) — frekuensinya
        sama, hanya urutan kanalnya yang berbeda.
      </p>

      <MatrixSection params={params} setPos={setPos} theme={theme} />
      <WavesSection params={params} theme={theme} />
      <ClocksSection params={params} setPos={setPos} />
      <SimilaritySection params={params} setPos={setPos} theme={theme} />
      <RotationSection params={params} theme={theme} />
      <AddEmbeddingSection params={params} theme={theme} />
      <VariantsSection params={params} theme={theme} />

      <section className="section" id="refs">
        <h2>
          <span className="section-num">10</span>Referensi
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
            Hugging Face Transformers — dokumentasi <a href="https://huggingface.co/docs/transformers/model_doc/gpt2">GPT-2</a>{' '}
            dan <a href="https://huggingface.co/docs/transformers/model_doc/bert">BERT</a> (ukuran position embedding).
          </li>
        </ul>
      </section>
    </article>
  )
}
