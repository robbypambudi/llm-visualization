import { useState } from 'react'
import { Segmented } from '../../components/Controls'
import { ColorBar, Heatmap } from '../../components/Heatmap'
import { Deep, Takeaway } from '../../components/Prose'
import { Tex } from '../../components/Tex'
import { maskScores, renormalizeRows, rowSums, zeroFutureAfterSoftmax } from '../../lib/causal'
import { softmax, type Mat } from '../../lib/transformer'
import type { ChartTheme } from '../../lib/theme'
import { fmt } from '../positional-encoding/state'
import { BASE_SCORES, TOKENS } from './toy'

type Method = 'zero' | 'renorm' | 'neginf'

const N = TOKENS.length
const flat = (m: Mat) => Float64Array.from(m.flat())
const SCORE_MAX = Math.ceil(Math.max(...BASE_SCORES.flat().map(Math.abs)))

const ZERO = zeroFutureAfterSoftmax(BASE_SCORES)
const RENORM = renormalizeRows(ZERO)
const MASKED = maskScores(BASE_SCORES)
const NEGINF = MASKED.map((row) => softmax(row))
const MAX_DIFF = Math.max(...RENORM.flatMap((row, i) => row.map((w, j) => Math.abs(w - NEGINF[i][j]))))

const METHODS: Record<Method, { label: string; input: Mat; weights: Mat; note: string }> = {
  zero: {
    label: '1 · nolkan setelah softmax',
    input: BASE_SCORES,
    weights: ZERO,
    note: 'Softmax dihitung untuk semua token, lalu bobot masa depan dihapus. Masa depan memang tertutup, tetapi jumlah tiap baris tidak lagi 1.',
  },
  renorm: {
    label: '2 · nolkan, lalu bagi ulang',
    input: BASE_SCORES,
    weights: RENORM,
    note: 'Setelah dinolkan, tiap baris dibagi dengan jumlahnya yang baru. Hasilnya benar, tetapi butuh satu langkah tambahan.',
  },
  neginf: {
    label: '3 · −∞ sebelum softmax',
    input: MASKED,
    weights: NEGINF,
    note: 'Skor masa depan diganti −∞ sebelum softmax. Karena e^(−∞) = 0, bobotnya otomatis 0 dan tiap baris otomatis berjumlah 1.',
  },
}

type Mark = 'yes' | 'no' | 'partial'

function Verdict({ mark, note }: { mark: Mark; note: string }) {
  const symbol = mark === 'yes' ? '✓' : mark === 'no' ? '✗' : '△'
  return (
    <td className="verdict">
      <span className={`verdict-${mark}`} aria-hidden>
        {symbol}
      </span>
      {note}
    </td>
  )
}

const VERDICTS: { name: string; marks: [Mark, string][] }[] = [
  {
    name: '1 · Nolkan setelah softmax',
    marks: [
      ['yes', 'ya'],
      ['no', 'kurang dari 1'],
      ['yes', 'tidak ada'],
    ],
  },
  {
    name: '2 · Nolkan, lalu bagi ulang',
    marks: [
      ['yes', 'ya'],
      ['yes', 'ya'],
      ['partial', 'perlu membagi ulang'],
    ],
  },
  {
    name: '3 · −∞ sebelum softmax',
    marks: [
      ['yes', 'ya'],
      ['yes', 'ya'],
      ['yes', 'tidak ada'],
    ],
  },
]

function cellTooltip(m: Mat, r: number, c: number, label: string) {
  const v = m[r][c]
  return (
    <>
      <div className="tt-row">
        <span className="muted">kueri → kunci</span>
        <span className="mono">
          {TOKENS[r]} → {TOKENS[c]}
        </span>
      </div>
      <div className="tt-row">
        <span className="muted">{label}</span>
        <strong className="mono">{Number.isFinite(v) ? fmt(v, 3) : '−∞'}</strong>
      </div>
    </>
  )
}

export function HowToMaskSection({ theme }: { theme: ChartTheme }) {
  const [method, setMethod] = useState<Method>('zero')
  const m = METHODS[method]
  const sums = rowSums(m.weights)
  const labels = TOKENS.map((w, i) => `${i} · ${w}`)

  return (
    <section className="section" id="how">
      <h2>
        <span className="section-num">3</span>Cara memasang masker
      </h2>
      <div className="prose">
        <p>
          Ingat langkah attention: setiap kueri dibandingkan dengan setiap kunci sehingga menghasilkan <strong>skor</strong>,
          lalu softmax mengubah skor menjadi <strong>bobot perhatian</strong> yang jumlahnya 1 untuk setiap baris. Bobot
          ini seperti anggaran perhatian 100% yang dibagi ke token-token lain.
        </p>
        <p>
          Tugas kita: bobot untuk token masa depan harus 0. Ada beberapa cara yang terpikir. Mari dicoba satu per satu
          pada kalimat dari bagian 1. Baris = token yang sedang bertanya (kueri), kolom = token yang dilihat (kunci).
        </p>
      </div>
      <div className="card">
        <div className="segmented-wrap">
          <Segmented
            ariaLabel="Cara memasang masker"
            value={method}
            options={(Object.keys(METHODS) as Method[]).map((k) => ({ value: k, label: METHODS[k].label }))}
            onChange={setMethod}
          />
        </div>
        <div className="grid-2" style={{ marginTop: 16 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div className="card-title">Masuk ke softmax (skor)</div>
              <ColorBar scale={theme.diverging} min={`−${SCORE_MAX}`} max={`+${SCORE_MAX}`} />
            </div>
            <Heatmap
              data={flat(m.input)}
              rows={N}
              cols={N}
              vmax={SCORE_MAX}
              scale={theme.diverging}
              height={N * 30}
              xLabel="kunci (token yang dilihat) →"
              yLabel="kueri"
              rowLabels={labels}
              nanRgb={theme.surface2Rgb}
              ariaLabel="Heatmap skor sebelum softmax"
              tooltip={(r, c) => cellTooltip(m.input, r, c, 'skor')}
            />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div className="card-title">Bobot perhatian</div>
              <ColorBar scale={theme.diverging} min="0" max="1" positiveOnly />
            </div>
            <Heatmap
              data={flat(m.weights)}
              rows={N}
              cols={N}
              vmax={1}
              scale={theme.diverging}
              height={N * 30}
              xLabel="kunci (token yang dilihat) →"
              yLabel="kueri"
              rowLabels={labels}
              nanRgb={theme.surface2Rgb}
              ariaLabel="Heatmap bobot perhatian"
              tooltip={(r, c) => cellTooltip(m.weights, r, c, 'bobot')}
            />
          </div>
        </div>
        <div className="row-label">Jumlah bobot di setiap baris</div>
        <div className="chip-row">
          {sums.map((s, i) => {
            const ok = Math.abs(s - 1) < 1e-9
            return (
              <span key={i} className="vec-cell" style={{ background: 'var(--surface-2)' }} title={`baris ${i} (“${TOKENS[i]}”)`}>
                <span className={ok ? 'verdict-yes' : 'verdict-no'} aria-hidden style={{ width: 'auto', marginRight: 4 }}>
                  {ok ? '✓' : '✗'}
                </span>
                {i}: {fmt(s, 2)}
              </span>
            )
          })}
        </div>
        <p className="card-sub" style={{ marginTop: 12, marginBottom: 0 }}>
          {m.note} Kotak abu-abu polos pada heatmap kiri adalah −∞. Skor dibuat dari vektor acak kecil, hanya untuk
          ilustrasi.
        </p>
      </div>
      <div className="prose" style={{ marginTop: 16 }}>
        <p>
          Kenapa jumlah 1 itu penting? Kalau jumlahnya kurang dari 1, hasil attention ikut mengecil. Pada percobaan 1,
          token pertama hanya menyisakan {Math.round(ZERO[0][0] * 100)}% dari anggaran perhatiannya, sedangkan token terakhir tetap 100%. Besar kecilnya hasil jadi bergantung pada
          posisi token, bukan pada isinya. Itu sinyal palsu yang tidak kita inginkan.
        </p>
        <p>
          Percobaan 2 dan 3 memberi bobot yang sama persis (selisih terbesar di contoh ini:{' '}
          {MAX_DIFF === 0 ? '0' : `${MAX_DIFF.toExponential(0)}, hanya sisa pembulatan komputer`}). Bedanya, percobaan 3 menyelesaikan semuanya di dalam softmax, tanpa langkah
          tambahan. Cara inilah yang dipakai paper Transformer: nilai yang tidak boleh dilihat diganti −∞ sebelum masuk
          softmax (Vaswani dkk., 2017, §3.2.3).
        </p>
      </div>
      <div className="table-scroll">
        <table className="table table-text">
          <thead>
            <tr>
              <th>Cara</th>
              <th>Masa depan tertutup</th>
              <th>Tiap baris berjumlah 1</th>
              <th>Langkah tambahan</th>
            </tr>
          </thead>
          <tbody>
            {VERDICTS.map((v) => (
              <tr key={v.name}>
                <td>{v.name}</td>
                {v.marks.map(([mark, note], i) => (
                  <Verdict key={i} mark={mark} note={note} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Deep title="Untuk yang penasaran: −∞ di dalam softmax, dan apa yang dilakukan GPT-2">
        <p>Untuk kueri di posisi <Tex>{`t`}</Tex>, skor yang sudah dimasker adalah</p>
        <Tex block>{`\\tilde s_{t j} = \\begin{cases} s_{t j} & j \\le t \\\\ -\\infty & j > t \\end{cases} \\qquad w_{t j} = \\frac{e^{\\tilde s_{t j}}}{\\sum_k e^{\\tilde s_{t k}}}`}</Tex>
        <p>
          Karena <Tex>{`e^{-\\infty} = 0`}</Tex>, token masa depan tidak ikut di pembilang maupun penyebut. Hasilnya sama
          dengan percobaan 2: bobot lama dibagi jumlah bobot yang tersisa.
        </p>
        <p>
          Kode asli GPT-2 tidak memakai −∞ sungguhan. Ia memakai angka negatif yang sangat besar:{' '}
          <code>w = w*b - 1e10*(1-b)</code>, dengan <code>b</code> bernilai 1 untuk posisi yang boleh dilihat dan 0
          untuk yang tidak. Hasilnya praktis sama, karena <Tex>{`e^{-10^{10}}`}</Tex> terlalu kecil untuk disimpan
          komputer dan dibulatkan menjadi 0.
        </p>
        <p>
          Satu catatan: kalau <em>semua</em> skor di satu baris bernilai −∞, softmax menjadi 0/0 dan hasilnya tidak
          terdefinisi. Pada masker causal hal ini tidak pernah terjadi, karena setiap token selalu boleh melihat dirinya
          sendiri.
        </p>
      </Deep>
      <Takeaway>Cara terbaik menutup masa depan: ganti skornya dengan −∞ sebelum softmax. Bobotnya jadi 0, dan sisanya tetap berjumlah 1.</Takeaway>
    </section>
  )
}
