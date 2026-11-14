import { useMemo, useState } from 'react'
import { Segmented, Slider } from '../../components/Controls'
import { ColorBar, Heatmap } from '../../components/Heatmap'
import { Legend, LineChart } from '../../components/LineChart'
import { Tex } from '../../components/Tex'
import {
  applyRope,
  dot,
  frequency,
  randomNormalVector,
  ropeDecayBound,
  ropePairIndices,
  ropeScore,
  type RopePairing,
} from '../../lib/positional'
import type { ChartTheme } from '../../lib/theme'
import { fmt, type PeParams } from './state'

type Variant = 'learned' | 'rope' | 'alibi'

interface Props {
  params: PeParams
  theme: ChartTheme
}

export function VariantsSection({ params, theme }: Props) {
  const [variant, setVariant] = useState<Variant>('rope')
  return (
    <section className="section" id="variants">
      <h2>
        <span className="section-num">9</span>Varian yang dipakai LLM modern
      </h2>
      <div className="prose">
        <p>
          Sinusoidal hanyalah salah satu cara. Model-model setelahnya memakai pendekatan berbeda: posisi yang dipelajari
          (GPT-2, BERT), rotasi pada query/key (RoPE — dipakai LLaMA), atau bias langsung pada skor attention (ALiBi).
        </p>
      </div>
      <Segmented
        ariaLabel="Pilih varian"
        value={variant}
        options={[
          { value: 'learned', label: 'Learned absolute' },
          { value: 'rope', label: 'RoPE' },
          { value: 'alibi', label: 'ALiBi' },
        ]}
        onChange={setVariant}
      />
      {variant === 'learned' && <Learned />}
      {variant === 'rope' && <Rope params={params} theme={theme} />}
      {variant === 'alibi' && <Alibi params={params} theme={theme} />}
    </section>
  )
}

/* ------------------------------------------------------------------ */

function Learned() {
  return (
    <div className="card">
      <div className="card-title">Learned absolute position embedding</div>
      <div className="prose">
        <p>
          Alih-alih rumus, model menyimpan matriks <Tex>{`P \\in \\mathbb{R}^{L_{max} \\times d}`}</Tex> yang dilatih
          bersama bobot lainnya, lalu <Tex>{`x_{pos} = E[\\text{token}_{pos}] + P[pos]`}</Tex>. Konsekuensinya, model
          tidak punya vektor untuk posisi <Tex>{`\\ge L_{max}`}</Tex>.
        </p>
        <p>
          Paper Transformer sudah mencobanya (Tabel 3, baris E) dan mendapatkan hasil yang hampir sama dengan sinusoidal
          (BLEU dev 25,7 vs 25,8). Mereka memilih sinusoidal karena <em>mungkin</em> memungkinkan ekstrapolasi ke urutan
          yang lebih panjang daripada saat pelatihan.
        </p>
      </div>
      <div className="table-scroll">
        <table className="table">
          <thead>
            <tr>
              <th>Model</th>
              <th>Nama parameter (Hugging Face)</th>
              <th>Ukuran</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>GPT-2 small</td>
              <td className="mono">wpe, n_positions = 1024</td>
              <td className="mono">1024 × 768</td>
            </tr>
            <tr>
              <td>BERT-base</td>
              <td className="mono">max_position_embeddings = 512</td>
              <td className="mono">512 × 768</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */

const ROPE_GRID = 48

function Rope({ params, theme }: Props) {
  const { d, base, seqLen } = params
  const [m, setM] = useState(12)
  const [n, setN] = useState(4)
  const [rawPair, setPair] = useState(0)
  const [pairing, setPairing] = useState<RopePairing>('interleaved')
  const pair = Math.min(rawPair, d / 2 - 1)
  const maxPos = seqLen - 1
  const mm = Math.min(m, maxPos)
  const nn = Math.min(n, maxPos)

  // Fixed demo query/key vectors (as if already projected by W_Q, W_K).
  const q = useMemo(() => randomNormalVector(d, 101), [d])
  const k = useMemo(() => randomNormalVector(d, 202), [d])

  const score = ropeScore(q, k, mm, nn, base, pairing)
  const shift = 10
  const shifted = ropeScore(q, k, mm + shift, nn + shift, base, pairing)

  const grid = useMemo(() => {
    const out = new Float64Array(ROPE_GRID * ROPE_GRID)
    const rq = Array.from({ length: ROPE_GRID }, (_, p) => applyRope(q, p, base, pairing))
    const rk = Array.from({ length: ROPE_GRID }, (_, p) => applyRope(k, p, base, pairing))
    for (let a = 0; a < ROPE_GRID; a++) for (let b = 0; b < ROPE_GRID; b++) out[a * ROPE_GRID + b] = dot(rq[a], rk[b])
    return out
  }, [q, k, base, pairing])
  const gridMax = useMemo(() => grid.reduce((acc, v) => Math.max(acc, Math.abs(v)), 1e-9), [grid])

  // 2D view of one rotated pair.
  const [ia, ib] = ropePairIndices(pair, d, pairing)
  const qm = applyRope(q, mm, base, pairing)
  const kn = applyRope(k, nn, base, pairing)
  const vecs = [
    { name: `q (pos ${mm})`, x: qm[ia], y: qm[ib], color: theme.series[0] },
    { name: `k (pos ${nn})`, x: kn[ia], y: kn[ib], color: theme.series[1] },
  ]
  const raw = [
    { x: q[ia], y: q[ib] },
    { x: k[ia], y: k[ib] },
  ]
  const lim = Math.max(1, ...vecs.map((v) => Math.hypot(v.x, v.y))) * 1.15
  const S = 220
  const sx = (x: number) => S / 2 + (x / lim) * (S / 2)
  const sy = (y: number) => S / 2 - (y / lim) * (S / 2)

  return (
    <>
      <div className="card">
        <div className="card-title">RoPE — Rotary Position Embedding (Su dkk., RoFormer)</div>
        <div className="prose">
          <p>
            RoPE tidak menambahkan apa pun ke embedding. Di setiap lapisan attention, vektor <strong>query dan key</strong>{' '}
            (setelah proyeksi <Tex>{`W_Q, W_K`}</Tex>; value tidak diubah) diputar per pasangan dimensi dengan sudut yang
            sebanding dengan posisinya. Frekuensinya sama dengan sinusoidal: <Tex>{`\\theta_i = 10000^{-2i/d}`}</Tex>.
          </p>
        </div>
        <Tex block>{`R_{\\Theta,m}\\,x = \\begin{pmatrix}x_1\\\\x_2\\\\x_3\\\\x_4\\\\\\vdots\\end{pmatrix}\\otimes\\begin{pmatrix}\\cos m\\theta_1\\\\\\cos m\\theta_1\\\\\\cos m\\theta_2\\\\\\cos m\\theta_2\\\\\\vdots\\end{pmatrix} + \\begin{pmatrix}-x_2\\\\x_1\\\\-x_4\\\\x_3\\\\\\vdots\\end{pmatrix}\\otimes\\begin{pmatrix}\\sin m\\theta_1\\\\\\sin m\\theta_1\\\\\\sin m\\theta_2\\\\\\sin m\\theta_2\\\\\\vdots\\end{pmatrix}`}</Tex>
        <div className="prose">
          <p>
            Karena rotasi mempertahankan sudut relatif, <Tex>{`(R_{m} q)^\\top (R_{n} k) = q^\\top R_{n-m}\\, k`}</Tex>:
            skor attention hanya bergantung pada jarak <Tex>{`m-n`}</Tex>, bukan posisi absolutnya. (Persamaan di atas
            memakai indeks 1 seperti di paper; aplikasi ini memakai indeks 0.)
          </p>
        </div>
      </div>

      <div className="card">
        <div className="controls" style={{ marginBottom: 16 }}>
          <Slider label="posisi query m" value={mm} min={0} max={maxPos} onChange={setM} />
          <Slider label="posisi key n" value={nn} min={0} max={maxPos} onChange={setN} />
          <Slider label="pasangan i" value={pair} min={0} max={d / 2 - 1} onChange={setPair} />
          <div className="control" style={{ flex: 'none' }}>
            <span className="control-label">pemasangan dimensi</span>
            <Segmented
              ariaLabel="Konvensi pasangan"
              value={pairing}
              options={[
                { value: 'interleaved', label: 'interleaved' },
                { value: 'half', label: 'rotate_half' },
              ]}
              onChange={setPairing}
            />
          </div>
        </div>
        <div className="grid-2" style={{ alignItems: 'center' }}>
          <div style={{ justifySelf: 'center', width: '100%', maxWidth: 300 }}>
            <Legend items={vecs.map((v) => ({ name: v.name, color: v.color }))} />
            <svg viewBox={`0 0 ${S} ${S}`} style={{ width: '100%' }} role="img" aria-label="Pasangan dimensi q dan k setelah dirotasi">
              <line x1={0} x2={S} y1={S / 2} y2={S / 2} stroke="var(--grid)" />
              <line y1={0} y2={S} x1={S / 2} x2={S / 2} stroke="var(--grid)" />
              <text x={S - 4} y={S / 2 - 6} textAnchor="end" className="axis-label">
                x[{ia}]
              </text>
              <text x={S / 2 + 6} y={12} className="axis-label">
                x[{ib}]
              </text>
              {raw.map((r, j) => (
                <line
                  key={`raw${j}`}
                  x1={S / 2}
                  y1={S / 2}
                  x2={sx(r.x)}
                  y2={sy(r.y)}
                  stroke={vecs[j].color}
                  strokeOpacity={0.35}
                  strokeDasharray="4 3"
                  strokeWidth={2}
                />
              ))}
              {vecs.map((v) => (
                <g key={v.name}>
                  <line x1={S / 2} y1={S / 2} x2={sx(v.x)} y2={sy(v.y)} stroke={v.color} strokeWidth={2.5} />
                  <circle cx={sx(v.x)} cy={sy(v.y)} r={5} fill={v.color} stroke="var(--surface-1)" strokeWidth={2} />
                </g>
              ))}
            </svg>
            <div className="card-sub">
              Garis putus-putus: sebelum rotasi. q diputar {fmt(mm * frequency(pair, d, base), 3)} rad, k diputar{' '}
              {fmt(nn * frequency(pair, d, base), 3)} rad.
            </div>
          </div>
          <div>
            <div className="stat-row">
              <div className="stat">
                <span className="stat-label">
                  skor q<sub>{mm}</sub>·k<sub>{nn}</sub>
                </span>
                <span className="stat-value">{fmt(score, 4)}</span>
              </div>
              <div className="stat">
                <span className="stat-label">
                  q<sub>{mm + shift}</sub>·k<sub>{nn + shift}</sub> (keduanya digeser +{shift})
                </span>
                <span className="stat-value">{fmt(shifted, 4)}</span>
              </div>
              <div className="stat">
                <span className="stat-label">jarak m − n</span>
                <span className="stat-value">{mm - nn}</span>
              </div>
            </div>
            <p className="card-sub" style={{ marginTop: 12 }}>
              Kedua skor sama karena hanya jarak yang berpengaruh. Konvensi <code>interleaved</code> mengikuti paper
              (pasangan x₀,x₁ / x₂,x₃ …); <code>rotate_half</code> dipakai implementasi gaya GPT-NeoX dan LLaMA di
              Hugging Face (pasangan x<sub>i</sub>, x<sub>i+d/2</sub>). Keduanya sama-sama rotasi, hanya pasangan dimensinya
              berbeda.
            </p>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div className="card-title">Skor (R_m q)·(R_n k) untuk semua m, n</div>
            <ColorBar scale={theme.diverging} min="−max" max="+max" />
          </div>
          <div className="card-sub">Setiap diagonal bernilai konstan: skor hanya fungsi dari m − n.</div>
          <Heatmap
            data={grid}
            rows={ROPE_GRID}
            cols={ROPE_GRID}
            vmax={gridMax}
            scale={theme.diverging}
            height={300}
            xLabel="posisi key n →"
            yLabel="← posisi query m"
            ariaLabel="Heatmap skor RoPE untuk semua pasangan posisi"
            tooltip={(a, b) => (
              <>
                <div className="tt-row">
                  <span className="muted">m, n (m − n)</span>
                  <span className="mono">
                    {a}, {b} ({a - b})
                  </span>
                </div>
                <div className="tt-row">
                  <span className="muted">skor</span>
                  <strong className="mono">{fmt(grid[a * ROPE_GRID + b], 3)}</strong>
                </div>
              </>
            )}
          />
        </div>
        <div className="card">
          <div className="card-title">Long-term decay (RoFormer §3.4.3)</div>
          <div className="card-sub">
            Batas atas skor sebanding dengan <Tex>{`\\tfrac{1}{d/2}\\sum_{j=1}^{d/2}|S_j|`}</Tex>,{' '}
            <Tex>{`S_j=\\sum_{i=0}^{j-1} e^{\\mathrm{i}(m-n)\\theta_i}`}</Tex>, yang cenderung turun saat jarak bertambah.
          </div>
          <LineChart
            series={[{ name: 'batas relatif', color: theme.series[0], fn: (r) => ropeDecayBound(r, d, base) }]}
            xDomain={[0, 256]}
            yDomain={[0, (d / 2 + 1) / 2 + 1]}
            height={280}
            xLabel="jarak relatif m − n"
            formatY={(v) => v.toFixed(2)}
            ariaLabel="Long-term decay bound RoPE terhadap jarak relatif"
          />
        </div>
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ */

const ALIBI_LEN = 24

function alibiSlopes(nHeads: number): number[] {
  // Press et al.: geometric sequence starting at 2^(-8/n) with that same ratio.
  const start = Math.pow(2, -8 / nHeads)
  return Array.from({ length: nHeads }, (_, h) => Math.pow(start, h + 1))
}

function Alibi({ theme }: Props) {
  const [nHeads, setNHeads] = useState(8)
  const [rawHead, setHead] = useState(0)
  const head = Math.min(rawHead, nHeads - 1)
  const slopes = alibiSlopes(nHeads)
  const slope = slopes[head]

  const bias = useMemo(() => {
    const out = new Float64Array(ALIBI_LEN * ALIBI_LEN)
    for (let i = 0; i < ALIBI_LEN; i++)
      for (let j = 0; j < ALIBI_LEN; j++) out[i * ALIBI_LEN + j] = j <= i ? -slope * (i - j) : Number.NaN
    return out
  }, [slope])
  const vmax = slope * (ALIBI_LEN - 1)

  return (
    <>
      <div className="card">
        <div className="card-title">ALiBi — Attention with Linear Biases (Press dkk., 2021)</div>
        <div className="prose">
          <p>
            ALiBi tidak menambahkan positional embedding sama sekali. Ia menambahkan bias tetap (tidak dilatih) ke skor
            attention sebelum softmax, sebanding dengan jarak antara query <em>i</em> dan key <em>j</em>:
          </p>
        </div>
        <Tex block>{`\\text{softmax}\\big(q_i K^\\top + m \\cdot [-(i-1), \\dots, -2, -1, 0]\\big)`}</Tex>
        <div className="prose">
          <p>
            Setiap head memakai kemiringan <Tex>{`m`}</Tex> berbeda: untuk <Tex>{`n`}</Tex> head, deret geometri yang
            dimulai dari <Tex>{`2^{-8/n}`}</Tex> dengan rasio yang sama. Untuk 8 head: <Tex>{`\\tfrac12, \\tfrac14, \\dots, \\tfrac1{256}`}</Tex>.
            Head dengan kemiringan besar fokus ke token dekat; kemiringan kecil bisa melihat lebih jauh.
          </p>
        </div>
      </div>
      <div className="card">
        <div className="controls" style={{ marginBottom: 16 }}>
          <div className="control" style={{ flex: 'none' }}>
            <span className="control-label">jumlah head</span>
            <Segmented
              ariaLabel="Jumlah head"
              value={nHeads}
              options={[
                { value: 8, label: '8' },
                { value: 16, label: '16' },
              ]}
              onChange={setNHeads}
            />
          </div>
          <Slider label="head" value={head} min={0} max={nHeads - 1} onChange={setHead} format={(h) => `${h + 1}`} />
          <div className="stat">
            <span className="stat-label">kemiringan m</span>
            <span className="stat-value">
              2<sup>{fmt(Math.log2(slope), 2).replace(/\.00$/, '')}</sup> = {fmt(slope, 5)}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div className="card-sub">Bias untuk head {head + 1} (causal: segitiga atas di-mask).</div>
          <ColorBar scale={theme.diverging} min={`−${fmt(vmax, 2)}`} max="0" negativeOnly />
        </div>
        <Heatmap
          data={bias}
          rows={ALIBI_LEN}
          cols={ALIBI_LEN}
          vmax={vmax}
          scale={theme.diverging}
          nanRgb={theme.surface2Rgb}
          height={300}
          xLabel="posisi key j →"
          yLabel="← posisi query i"
          ariaLabel={`Heatmap bias ALiBi untuk head ${head + 1}`}
          tooltip={(i, j) => (
            <>
              <div className="tt-row">
                <span className="muted">i, j</span>
                <span className="mono">
                  {i}, {j}
                </span>
              </div>
              <div className="tt-row">
                <span className="muted">bias</span>
                <strong className="mono">{j <= i ? `−${fmt(slope, 4)}·${i - j} = ${fmt(-slope * (i - j), 3)}` : 'masked'}</strong>
              </div>
            </>
          )}
        />
      </div>
    </>
  )
}
