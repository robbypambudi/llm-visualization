import { useState } from 'react'
import { Deep, Takeaway } from '../../components/Prose'
import { Tex } from '../../components/Tex'
import { buildBigrams, cosine, initModel, row, trainStep } from '../../lib/embedding'
import type { ChartTheme } from '../../lib/theme'
import { fmt } from '../positional-encoding/state'
import { SENTENCES } from './corpus'

// A fully trained copy of the model from section 3 (same seed and settings), computed once.
const DATA = buildBigrams(SENTENCES)
const TRAINED = (() => {
  const m = initModel(DATA.vocab.length, 2, 42)
  for (let s = 0; s < 1200; s++) trainStep(m, DATA, 1)
  return m
})()
const WORDS = DATA.contextIds.map((i) => DATA.vocab[i])

export function SimilaritySection({ theme }: { theme: ChartTheme }) {
  const [word, setWord] = useState('kucing')
  const i = DATA.vocab.indexOf(word)
  const ranked = DATA.contextIds
    .filter((j) => j !== i)
    .map((j) => ({ word: DATA.vocab[j], sim: cosine(row(TRAINED, i), row(TRAINED, j)) }))
    .sort((a, b) => b.sim - a.sim)

  return (
    <section className="section" id="similarity">
      <h2>
        <span className="section-num">4</span>Mengukur kemiripan dua kata
      </h2>
      <div className="prose">
        <p>
          Kalau setiap kata adalah titik (atau panah dari titik nol), kemiripan bisa diukur dari <strong>arah</strong>{' '}
          panahnya. Dua panah yang menunjuk ke arah yang sama dianggap mirip (nilai mendekati 1). Panah yang tegak lurus
          dianggap tidak berhubungan (sekitar 0). Panah yang berlawanan arah bernilai mendekati −1. Ukuran ini disebut{' '}
          <strong>cosine similarity</strong>.
        </p>
        <p>Pilih sebuah kata untuk melihat kata mana yang paling mirip menurut model dari bagian 3 setelah selesai dilatih.</p>
      </div>
      <div className="card">
        <label className="control control-fit">
          <span className="control-label">
            <span>kata</span>
          </span>
          <select className="select" value={word} onChange={(e) => setWord(e.target.value)}>
            {WORDS.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </label>
        <div className="table-scroll" style={{ marginTop: 12 }}>
          <table className="table table-text">
            <thead>
              <tr>
                <th>Kata</th>
                <th>Kemiripan dengan “{word}”</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((r) => (
                <tr key={r.word}>
                  <td>{r.word}</td>
                  <td>
                    <span className="sim-cell">
                      <span className="mono sim-value">{fmt(r.sim, 2)}</span>
                      <span className="sim-track" aria-hidden>
                        <span
                          className="sim-bar"
                          style={{
                            left: r.sim >= 0 ? '50%' : `${50 + r.sim * 50}%`,
                            width: `${Math.abs(r.sim) * 50}%`,
                            background: theme.diverging.css(r.sim),
                          }}
                        />
                      </span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="card-sub" style={{ marginTop: 8, marginBottom: 0 }}>
          Batang ke kanan = mirip, ke kiri = berlawanan. Karena embedding di sini hanya 2 angka, banyak kata kebetulan
          searah. Di model sungguhan dengan ratusan angka, ruangnya jauh lebih lega.
        </p>
      </div>
      <div className="prose" style={{ marginTop: 16 }}>
        <p>
          Pada embedding yang dilatih dengan data besar, arah di dalam ruang ini kadang ikut membawa makna. Contoh yang
          terkenal datang dari word2vec (Mikolov dkk., 2013): vektor “king” − “man” + “woman” ternyata paling dekat dengan
          vektor “queen”. Perlu diingat, itu embedding dari model word2vec, bukan tabel input sebuah LLM, dan polanya tidak
          selalu serapi contoh tersebut.
        </p>
      </div>
      <Deep title="Untuk yang penasaran: rumus cosine similarity">
        <Tex block>{`\\cos(\\theta) = \\frac{a \\cdot b}{\\lVert a \\rVert \\, \\lVert b \\rVert} = \\frac{\\sum_i a_i b_i}{\\sqrt{\\sum_i a_i^2}\\,\\sqrt{\\sum_i b_i^2}}`}</Tex>
        <p>
          Pembilangnya adalah <em>dot product</em>: kalikan angka-angka yang sejajar lalu jumlahkan. Penyebutnya membagi
          dengan panjang kedua vektor, sehingga yang tersisa hanya arahnya. Dot product yang sama juga menjadi inti dari
          attention di bab-bab berikutnya.
        </p>
      </Deep>
      <Takeaway>Dengan embedding, “mirip” bisa dihitung: cukup bandingkan arah dua vektor.</Takeaway>
    </section>
  )
}
