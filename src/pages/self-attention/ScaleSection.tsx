import { useMemo, useState } from 'react'
import { Field, Segmented } from '../../components/Controls'
import { Legend } from '../../components/LineChart'
import { Deep, Takeaway } from '../../components/Prose'
import { Tex } from '../../components/Tex'
import { dotVec, randomMatrix, softmax } from '../../lib/transformer'
import type { ChartTheme } from '../../lib/theme'
import { fmt } from '../positional-encoding/state'

const D_OPTIONS = [4, 16, 64, 256, 1024]
const KEYS = 8

function sampleScores(d: number, seed: number) {
  // Illustration: random query and keys with independent N(0, 1) entries, the setting of Vaswani et al.'s footnote 4.
  const [q, ...keys] = randomMatrix(KEYS + 1, d, seed * 7919 + d)
  return keys.map((k) => dotVec(q, k))
}

function std(xs: number[]) {
  const m = xs.reduce((a, b) => a + b, 0) / xs.length
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / xs.length)
}

export function ScaleSection({ theme }: { theme: ChartTheme }) {
  const [d, setD] = useState(256)
  const [seed, setSeed] = useState(1)
  const raw = useMemo(() => sampleScores(d, seed), [d, seed])
  const plain = softmax(raw)
  const scaled = softmax(raw.map((s) => s / Math.sqrt(d)))
  const colors = [theme.series[1], theme.series[0]]

  return (
    <section className="section" id="scale">
      <h2>
        <span className="section-num">4</span>Kenapa skornya dibagi √d<sub>k</sub>?
      </h2>
      <div className="prose">
        <p>
          Di langkah 3 tadi, skor dibagi akar dari panjang key (<Tex>{`d_k`}</Tex>). Kenapa? Dot product adalah
          penjumlahan dari <Tex>{`d_k`}</Tex> perkalian. Makin panjang vektornya, makin banyak yang dijumlahkan, sehingga
          skornya makin besar dan makin tersebar. Untuk vektor acak, sebarannya tumbuh sebesar{' '}
          <Tex>{`\\sqrt{d_k}`}</Tex>.
        </p>
        <p>
          Skor yang terlalu besar membuat softmax menjadi “galak”: hampir seluruh bobot jatuh ke satu kata, sisanya nyaris
          nol. Ganti panjang vektor di bawah dan bandingkan.
        </p>
      </div>
      <div className="card">
        <div className="controls" style={{ alignItems: 'flex-end' }}>
          <Field label="panjang query/key (d_k)">
            <div className="segmented-wrap">
              <Segmented
                ariaLabel="panjang vektor"
                value={d}
                options={D_OPTIONS.map((v) => ({ value: v, label: String(v) }))}
                onChange={setD}
              />
            </div>
          </Field>
          <button type="button" className="btn" style={{ flex: 'none' }} onClick={() => setSeed((s) => s + 1)}>
            ↺ Acak ulang
          </button>
        </div>
        <div className="stat-row">
          <div className="stat">
            <span className="stat-label">sebaran skor (simpangan baku)</span>
            <span className="stat-value">
              {fmt(std(raw), 1)} <span className="muted-text">(√{d} = {fmt(Math.sqrt(d), 1)})</span>
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">bobot terbesar tanpa pembagian</span>
            <span className="stat-value">{fmt(Math.max(...plain) * 100, 1)}%</span>
          </div>
          <div className="stat">
            <span className="stat-label">bobot terbesar dengan ÷ √d_k</span>
            <span className="stat-value">{fmt(Math.max(...scaled) * 100, 1)}%</span>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <Legend
            items={[
              { name: 'tanpa pembagian', color: colors[0] },
              { name: 'dengan ÷ √d_k', color: colors[1] },
            ]}
          />
        </div>
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Key</th>
                <th>Skor q·k</th>
                <th>Bobot tanpa pembagian</th>
                <th>Bobot dengan ÷ √d_k</th>
              </tr>
            </thead>
            <tbody>
              {raw.map((s, j) => (
                <tr key={j}>
                  <td className="mono">{j + 1}</td>
                  <td className="mono">{fmt(s, 1)}</td>
                  {[plain[j], scaled[j]].map((w, c) => (
                    <td key={c}>
                      <span className="w-cell">
                        <span className="w-value">{fmt(w * 100, 1)}%</span>
                        <span className="w-track" aria-hidden>
                          <span className="w-fill" style={{ width: `${w * 100}%`, background: colors[c] }} />
                        </span>
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="card-sub" style={{ marginTop: 10, marginBottom: 0 }}>
          Query dan 8 key diisi angka acak (rata-rata 0, sebaran 1), dihitung langsung di halaman ini.
        </p>
      </div>
      <div className="prose" style={{ marginTop: 16 }}>
        <p>
          Kenapa softmax yang “galak” itu buruk? Model belajar dengan menggeser bobotnya sedikit demi sedikit. Kalau satu
          kata sudah mendapat hampir 100%, geseran kecil pada skor hampir tidak mengubah apa pun. Sinyal belajarnya nyaris
          hilang, dan attention menjadi kaku sejak awal. Paper Transformer menduga alasan yang sama: tanpa pembagian,
          softmax masuk ke daerah yang gradiennya sangat kecil (Vaswani dkk., 2017, §3.2.1).
        </p>
        <p>
          Filosofinya: pembagian ini menjaga <strong>“suhu” attention tetap sama</strong>, berapa pun panjang vektornya.
          Model kecil dan model besar sama-sama mulai dari perhatian yang lembut, lalu belajar sendiri kapan harus fokus.
        </p>
      </div>
      <Deep title="Untuk yang penasaran: kenapa tepat √d_k?">
        <p>
          Misalkan setiap angka di <Tex>{`q`}</Tex> dan <Tex>{`k`}</Tex> saling bebas dengan rata-rata 0 dan varians 1.
          Maka setiap perkalian <Tex>{`q_i k_i`}</Tex> juga punya varians 1, dan jumlah <Tex>{`d_k`}</Tex> perkalian
          punya varians <Tex>{`d_k`}</Tex> (catatan kaki 4 di paper Transformer):
        </p>
        <Tex block>{`\\operatorname{Var}(q\\cdot k) = \\sum_{i=1}^{d_k} \\operatorname{Var}(q_i k_i) = d_k \\quad\\Rightarrow\\quad \\operatorname{Var}\\!\\left(\\frac{q\\cdot k}{\\sqrt{d_k}}\\right) = 1`}</Tex>
        <p>
          Membagi dengan <Tex>{`\\sqrt{d_k}`}</Tex> mengembalikan variansnya ke 1. Turunan softmax adalah{' '}
          <Tex>{`\\partial p_i / \\partial z_j = p_i(\\delta_{ij} - p_j)`}</Tex>. Kalau satu <Tex>{`p_i`}</Tex> hampir 1 dan
          sisanya hampir 0, semua suku ini mendekati nol: itulah gradien yang “menghilang”.
        </p>
      </Deep>
      <Takeaway>Pembagian dengan √d_k menjaga skor tetap di ukuran yang wajar, supaya softmax tidak langsung kaku.</Takeaway>
    </section>
  )
}
