import { useMemo, useState } from 'react'
import { ColorBar, Heatmap } from '../../components/Heatmap'
import { Tex } from '../../components/Tex'
import { hashString, peMatrix, randomNormalVector } from '../../lib/positional'
import type { ChartTheme } from '../../lib/theme'
import { fmt, type PeParams } from './state'

interface Props {
  params: PeParams
  theme: ChartTheme
}

const VMAX = 2.5

export function AddEmbeddingSection({ params, theme }: Props) {
  const { d, base, layout } = params
  const [text, setText] = useState('the cat sat on the mat')
  const tokens = useMemo(() => text.trim().split(/\s+/).filter(Boolean).slice(0, 16), [text])
  const n = Math.max(1, tokens.length)

  const { emb, pe, sum } = useMemo(() => {
    const emb = new Float64Array(n * d)
    tokens.forEach((t, row) => {
      // Demo weights ~ N(0, 1/d); multiplied by √d below as in §3.4, giving unit scale.
      const v = randomNormalVector(d, hashString(t), 1 / Math.sqrt(d))
      for (let j = 0; j < d; j++) emb[row * d + j] = v[j] * Math.sqrt(d)
    })
    const pe = peMatrix(n, d, base, layout)
    const sum = emb.map((v, i) => v + pe[i])
    return { emb, pe, sum }
  }, [tokens, n, d, base, layout])

  const tooltip = (data: Float64Array, label: string) => (row: number, col: number) => (
    <>
      <div className="tt-row">
        <span className="muted">token, dimensi</span>
        <span className="mono">
          “{tokens[row] ?? '—'}” @{row}, {col}
        </span>
      </div>
      <div className="tt-row">
        <span className="muted">{label}</span>
        <strong className="mono">{fmt(data[row * d + col], 3)}</strong>
      </div>
      <div className="tt-row">
        <span className="muted">= emb + PE</span>
        <span className="mono">
          {fmt(emb[row * d + col], 3)} + {fmt(pe[row * d + col], 3)}
        </span>
      </div>
    </>
  )

  const h = Math.max(60, n * 18)

  return (
    <section className="section" id="add">
      <h2>
        <span className="section-num">8</span>PE dijumlahkan ke embedding token
      </h2>
      <div className="prose">
        <p>
          PE punya dimensi yang sama dengan embedding (<Tex>{`d_{model}`}</Tex>), sehingga keduanya bisa{' '}
          <strong>dijumlahkan</strong>, bukan digabung (concat). Di lapisan embedding, paper juga mengalikan bobot
          embedding dengan <Tex>{`\\sqrt{d_{model}}`}</Tex>:
        </p>
      </div>
      <Tex block>{`x_{pos} = \\sqrt{d_{model}}\\; E[\\text{token}_{pos}] + PE_{pos}`}</Tex>
      <div className="card">
        <input
          className="text-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label="Kalimat"
          style={{ marginBottom: 12 }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div className="card-sub">
            Perhatikan dua token “the”: embedding-nya identik, tetapi setelah ditambah PE vektornya berbeda.
          </div>
          <ColorBar scale={theme.diverging} min={`−${VMAX}`} max={`+${VMAX}`} />
        </div>
        {[
          { data: emb, title: '√d · E[token]', label: 'embedding' },
          { data: pe, title: 'PE', label: 'PE' },
          { data: sum, title: 'x = √d · E + PE (input ke blok Transformer)', label: 'x' },
        ].map((m) => (
          <div key={m.title} style={{ marginTop: 16 }}>
            <div className="card-title">{m.title}</div>
            <Heatmap
              data={m.data}
              rows={n}
              cols={d}
              vmax={VMAX}
              scale={theme.diverging}
              height={h}
              xLabel="dimensi →"
              yLabel="token"
              rowLabels={tokens.map((t, i) => `${t} @${i}`)}
              tooltip={tooltip(m.data, m.label)}
              ariaLabel={`Heatmap ${m.title}`}
            />
          </div>
        ))}
        <p className="card-sub" style={{ marginTop: 12, marginBottom: 0 }}>
          Embedding di sini hanyalah vektor acak deterministik per kata (bukan bobot model asli), diambil dari N(0, 1/d)
          lalu dikali √d agar skalanya sebanding dengan PE.
        </p>
      </div>
    </section>
  )
}
