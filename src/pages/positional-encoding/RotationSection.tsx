import { useState } from 'react'
import { Slider } from '../../components/Controls'
import { Deep, Takeaway } from '../../components/Prose'
import { Tex } from '../../components/Tex'
import { frequency, shiftMatrix } from '../../lib/positional'
import type { ChartTheme } from '../../lib/theme'
import { fmt, type PeParams } from './state'

interface Props {
  params: PeParams
  theme: ChartTheme
}

const SIZE = 240
const R = 90
const C = SIZE / 2

/** Point on the circle for angle a, with x = sin a (dim 2i) and y = cos a (dim 2i+1). */
const pt = (a: number) => ({ x: C + R * Math.sin(a), y: C - R * Math.cos(a) })

export function RotationSection({ params, theme }: Props) {
  const { d, base, pos } = params
  const [rawPair, setPair] = useState(2)
  const [k, setK] = useState(5)
  const pair = Math.min(rawPair, d / 2 - 1)

  const w = frequency(pair, d, base)
  const a = pos * w
  const b = k * w
  const [m00, m01, m10, m11] = shiftMatrix(k, pair, d, base)
  const src = [Math.sin(a), Math.cos(a)]
  const mapped = [m00 * src[0] + m01 * src[1], m10 * src[0] + m11 * src[1]]
  const direct = [Math.sin(a + b), Math.cos(a + b)]

  const A = pt(a)
  const B = pt(a + b)
  // Draw the arc the short way only when it is less than a full turn; otherwise just mark the endpoints.
  const sweep = ((b % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
  const arc = `M${A.x},${A.y} A${R},${R} 0 ${sweep > Math.PI ? 1 : 0} 1 ${B.x},${B.y}`

  return (
    <section className="section" id="rotation">
      <h2>
        <span className="section-num">8</span>Maju beberapa langkah = memutar jarum
      </h2>
      <div className="prose">
        <p>
          Kembali ke analogi jam. Kalau kamu maju <em>k</em> langkah, setiap jarum berputar sejauh sudut tertentu. Besar
          sudutnya hanya bergantung pada <em>k</em>, tidak peduli kamu mulai dari posisi berapa. Maju 5 langkah dari
          posisi 10 sama saja dengan maju 5 langkah dari posisi 80: jarumnya diputar sejauh sudut yang sama.
        </p>
        <p>
          Artinya, ada <strong>satu aturan geser</strong> yang berlaku di mana saja. Inilah alasan utama yang ditulis
          paper saat memilih sin dan cos. Penulisnya berharap aturan ini memudahkan model belajar posisi relatif, misalnya
          “perhatikan kata yang dua langkah sebelum aku”. Paper menyebutnya hipotesis, bukan sesuatu yang sudah dibuktikan.
        </p>
        <p>
          Di bawah ini, titik biru adalah jarum di posisi awal dan titik oranye adalah jarum setelah maju <em>k</em>{' '}
          langkah. Coba ubah <strong>posisi terpilih</strong> di panel atas: titiknya pindah, tetapi aturan gesernya (
          <Tex>{`M_k`}</Tex>) tidak berubah.
        </p>
      </div>
      <Deep title="Untuk yang penasaran: aturan gesernya dalam bentuk matriks">
        <p>
          Untuk setiap pasangan, aturan geser itu adalah matriks rotasi 2×2 <Tex>{`M_k`}</Tex>. Matriks ini hanya
          bergantung pada <Tex>{`k`}</Tex>, bukan pada <Tex>{`pos`}</Tex>. Dalam bahasa matematika,{' '}
          <Tex>{`PE_{pos+k}`}</Tex> adalah <strong>fungsi linear</strong> dari <Tex>{`PE_{pos}`}</Tex>:
        </p>
      <Tex block>{`\\begin{pmatrix} \\sin((pos+k)\\omega_i) \\\\ \\cos((pos+k)\\omega_i) \\end{pmatrix} = \\underbrace{\\begin{pmatrix} \\cos k\\omega_i & \\sin k\\omega_i \\\\ -\\sin k\\omega_i & \\cos k\\omega_i \\end{pmatrix}}_{M_k} \\begin{pmatrix} \\sin(pos\\,\\omega_i) \\\\ \\cos(pos\\,\\omega_i) \\end{pmatrix}`}</Tex>
        <p>
          Ide “posisi sebagai putaran” ini kemudian dipakai secara langsung oleh RoPE (bagian 10).
        </p>
      </Deep>
      <div className="card">
        <div className="controls" style={{ marginBottom: 12 }}>
          <Slider label="pasangan i" value={pair} min={0} max={d / 2 - 1} onChange={setPair} />
          <Slider label="offset k" value={k} min={0} max={50} onChange={setK} />
        </div>
        <div className="grid-2" style={{ alignItems: 'center' }}>
          <svg
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            style={{ width: '100%', maxWidth: 300, justifySelf: 'center' }}
            role="img"
            aria-label={`Rotasi pasangan ${pair} dari posisi ${pos} ke ${pos + k}`}
          >
            <line x1={C - R - 12} x2={C + R + 12} y1={C} y2={C} stroke="var(--grid)" />
            <line y1={C - R - 12} y2={C + R + 12} x1={C} x2={C} stroke="var(--grid)" />
            <text x={C + R + 4} y={C - 6} className="axis-label">
              sin
            </text>
            <text x={C + 6} y={C - R - 4} className="axis-label">
              cos
            </text>
            <circle cx={C} cy={C} r={R} fill="none" stroke="var(--axis)" />
            {k > 0 && b < 2 * Math.PI && (
              <path d={arc} fill="none" stroke="var(--text-muted)" strokeDasharray="3 3" />
            )}
            <line x1={C} y1={C} x2={A.x} y2={A.y} stroke={theme.series[0]} strokeWidth={2} />
            <line x1={C} y1={C} x2={B.x} y2={B.y} stroke={theme.series[1]} strokeWidth={2} />
            <circle cx={A.x} cy={A.y} r={5} fill={theme.series[0]} stroke="var(--surface-1)" strokeWidth={2} />
            <circle cx={B.x} cy={B.y} r={5} fill={theme.series[1]} stroke="var(--surface-1)" strokeWidth={2} />
            <text x={A.x + 8} y={A.y - 6} className="axis-label" style={{ fill: 'var(--text-primary)' }}>
              pos {pos}
            </text>
            <text x={B.x + 8} y={B.y + 14} className="axis-label" style={{ fill: 'var(--text-primary)' }}>
              pos {pos + k}
            </text>
          </svg>
          <div>
            <Tex block>{`\\omega_{${pair}} = ${fmt(w, 5)},\\quad k\\,\\omega_{${pair}} = ${fmt(b, 4)}\\text{ rad}`}</Tex>
            <Tex block>{`M_{${k}} = \\begin{pmatrix} ${fmt(m00)} & ${fmt(m01)} \\\\ ${fmt(m10)} & ${fmt(m11)} \\end{pmatrix}`}</Tex>
            <table className="table">
              <thead>
                <tr>
                  <th></th>
                  <th>sin</th>
                  <th>cos</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    PE<sub>{pos}</sub> (pasangan {pair})
                  </td>
                  <td className="mono">{fmt(src[0])}</td>
                  <td className="mono">{fmt(src[1])}</td>
                </tr>
                <tr>
                  <td>
                    M<sub>{k}</sub> · PE<sub>{pos}</sub>
                  </td>
                  <td className="mono">{fmt(mapped[0])}</td>
                  <td className="mono">{fmt(mapped[1])}</td>
                </tr>
                <tr>
                  <td>
                    PE<sub>{pos + k}</sub> langsung
                  </td>
                  <td className="mono">{fmt(direct[0])}</td>
                  <td className="mono">{fmt(direct[1])}</td>
                </tr>
              </tbody>
            </table>
            <p className="card-sub" style={{ marginTop: 8 }}>
              Ubah posisi (kontrol di atas halaman): M<sub>{k}</sub> tidak berubah, tetapi tetap memetakan PE
              <sub>pos</sub> ke PE<sub>pos+{k}</sub>.
            </p>
          </div>
        </div>
      </div>
      <Takeaway>Maju k langkah selalu berarti memutar jarum sejauh sudut yang sama, dari posisi mana pun.</Takeaway>
    </section>
  )
}
