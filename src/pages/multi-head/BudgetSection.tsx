import { useState } from 'react'
import { Segmented } from '../../components/Controls'
import { Deep, Takeaway } from '../../components/Prose'
import { Tex } from '../../components/Tex'
import { matmul, softmax } from '../../lib/transformer'
import type { ChartTheme } from '../../lib/theme'
import { fmt } from '../positional-encoding/state'

const SENTENCES = [
  ['kucing', 'mengejar', 'tikus', '.'],
  ['tikus', 'mengejar', 'kucing', '.'],
]
const FEATURES = ['ciri kucing', 'ciri tikus', 'ciri mengejar']
// Value vectors are hand-made so each number is readable: one "feature" per word.
const VALUE: Record<string, number[]> = {
  kucing: [1, 0, 0],
  tikus: [0, 1, 0],
  mengejar: [0, 0, 1],
  '.': [0, 0, 0],
}
const ANIMALS = new Set(['kucing', 'tikus'])
const STRONG = 4

type Mode = 'split' | 'focus' | 'two'

interface Head {
  name: string
  /** Hand-designed scores of the last token ".", which may look at every token (all are before it). */
  scores: (words: string[]) => number[]
}

const HEAD_ANIMAL: Head = { name: 'kepala: cari hewan', scores: (w) => w.map((x) => (ANIMALS.has(x) ? 3 : 0)) }
const HEAD_FIRST: Head = { name: 'kepala A: kata pertama', scores: (w) => w.map((_, i) => (i === 0 ? STRONG : 0)) }
const HEAD_PREV: Head = {
  name: 'kepala B: kata sebelum aku',
  scores: (w) => w.map((_, i) => (i === w.length - 2 ? STRONG : 0)),
}

const HEADS: Record<Mode, Head[]> = { split: [HEAD_ANIMAL], focus: [HEAD_FIRST], two: [HEAD_FIRST, HEAD_PREV] }

const VERDICT: Record<Mode, string> = {
  split:
    'Satu kepala membagi perhatiannya hampir rata ke “kucing” dan “tikus”. Keduanya dijumlahkan menjadi satu vektor, sehingga hasil kedua kalimat sama persis. Model tidak bisa tahu siapa mengejar siapa.',
  focus:
    'Satu kepala yang memusatkan perhatian ke kata pertama tahu siapa yang mengejar. Tetapi seluruh “jatahnya” habis untuk satu kata, jadi informasi tentang yang dikejar tidak ikut terbawa.',
  two: 'Dua kepala bekerja sendiri-sendiri. Kepala A mengambil si pengejar, kepala B mengambil yang dikejar, lalu hasilnya disusun berdampingan. Kedua peran tetap terpisah, dan hasil kedua kalimat berbeda.',
}

function runHeads(words: string[], heads: Head[]) {
  const V = words.map((w) => VALUE[w])
  return heads.map((h) => {
    const weights = softmax(h.scores(words))
    return { name: h.name, weights, out: matmul([weights], V)[0] }
  })
}

function VecCells({ values, labels, theme }: { values: number[]; labels: string[]; theme: ChartTheme }) {
  return (
    <>
      {values.map((v, i) => (
        <span
          key={i}
          className="vec-cell"
          style={{ background: theme.diverging.css(v) }}
          title={`${labels[i % labels.length]}: ${fmt(v, 2)}`}
        >
          {fmt(v, 2)}
        </span>
      ))}
    </>
  )
}

export function BudgetSection({ theme }: { theme: ChartTheme }) {
  const [mode, setMode] = useState<Mode>('split')
  const results = SENTENCES.map((w) => runHeads(w, HEADS[mode]))
  const outputs = results.map((heads) => heads.flatMap((h) => h.out))
  const diff = Math.max(...outputs[0].map((v, i) => Math.abs(v - outputs[1][i])))
  const same = diff < 1e-9

  return (
    <section className="section" id="budget">
      <h2>
        <span className="section-num">1</span>Satu kata, banyak pertanyaan
      </h2>
      <div className="prose">
        <p>
          Di bab Self-Attention, setiap token mengajukan satu kueri, lalu membagi perhatiannya ke token lain. Bobot
          perhatiannya dihitung dengan softmax, jadi jumlahnya selalu 1. Anggap saja setiap token punya{' '}
          <strong>jatah perhatian 100%</strong> yang harus dibagi.
        </p>
        <p>
          Masalahnya, sebuah token sering butuh beberapa informasi sekaligus. Ambil kalimat “kucing mengejar tikus .”.
          Untuk memahami kalimat ini, model perlu tahu dua hal: <em>siapa yang mengejar</em> dan{' '}
          <em>siapa yang dikejar</em>. Mari kita lihat apa yang terjadi di token terakhir (“.”), yang boleh melihat
          semua token sebelumnya.
        </p>
      </div>

      <div className="card">
        <div className="segmented-wrap">
          <Segmented
            ariaLabel="Jumlah kepala"
            value={mode}
            options={[
              { value: 'split', label: 'Percobaan 1 · satu kepala, dibagi' },
              { value: 'focus', label: 'Percobaan 2 · satu kepala, fokus' },
              { value: 'two', label: 'Percobaan 3 · dua kepala' },
            ]}
            onChange={setMode}
          />
        </div>
        <div className="grid-2" style={{ marginTop: 16 }}>
          {SENTENCES.map((words, s) => (
            <div key={s}>
              <div className="card-title">Kalimat {s === 0 ? 'A' : 'B'}</div>
              <div className="tok-chips" style={{ margin: '6px 0 10px' }}>
                {words.map((w, i) => (
                  <span key={i} className="tok">
                    <span className="tok-text">{w}</span>
                  </span>
                ))}
              </div>
              {results[s].map((h) => (
                <div key={h.name} style={{ marginBottom: 12 }}>
                  <div className="row-label">Bobot perhatian “.” · {h.name}</div>
                  <div className="table-scroll">
                    <table className="table table-text">
                      <tbody>
                        {words.map((w, i) => (
                          <tr key={i}>
                            <td style={{ width: 90 }}>{w}</td>
                            <td>
                              <span className="w-cell">
                                <span className="w-value">{fmt(h.weights[i], 2)}</span>
                                <span className="w-track" aria-hidden>
                                  <span className="w-fill" style={{ width: `${h.weights[i] * 100}%` }} />
                                </span>
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
              <div className="row-label">
                Hasil untuk “.” {HEADS[mode].length > 1 ? '(kepala A | kepala B, disusun berdampingan)' : ''}
              </div>
              <div className="chip-row">
                <VecCells values={outputs[s]} labels={FEATURES} theme={theme} />
              </div>
            </div>
          ))}
        </div>
        <div className="callout" style={{ marginTop: 16, marginBottom: 0 }}>
          <strong>{same ? 'Hasil kedua kalimat: SAMA.' : 'Hasil kedua kalimat: BERBEDA.'}</strong> {VERDICT[mode]}
        </div>
        <p className="card-sub" style={{ marginTop: 12, marginBottom: 0 }}>
          Ilustrasi buatan tangan. Skor dirancang sendiri (4 untuk kata yang dicari, 0 untuk yang lain), lalu diubah
          dengan softmax yang sungguhan. Vektor nilainya dibuat sederhana: angka pertama = ciri kucing, kedua = ciri
          tikus, ketiga = ciri mengejar. Arahkan kursor ke kotak angka untuk melihat namanya.
        </p>
      </div>

      <div className="prose" style={{ marginTop: 16 }}>
        <p>
          Inilah alasan yang ditulis paper Transformer (Vaswani dkk., 2017, §3.2.2): dengan satu kepala saja,{' '}
          <em>perata-rataan</em> menghalangi model untuk memperhatikan beberapa hal yang berbeda sekaligus. Solusinya
          bukan membuat satu kepala yang lebih pintar, tetapi <strong>memakai beberapa kepala</strong>. Setiap kepala
          punya kueri, kunci, dan nilainya sendiri, jadi setiap kepala bebas mencari hal yang berbeda.
        </p>
        <p>
          Filosofinya mirip rapat redaksi koran. Satu wartawan tidak bisa sekaligus meliput siapa pelakunya, di mana
          kejadiannya, dan apa sebabnya. Lebih baik beberapa wartawan berangkat dengan pertanyaannya masing-masing,
          lalu laporannya digabung.
        </p>
      </div>
      <Deep title="Untuk yang penasaran: kenapa hasil Percobaan 1 sama persis?">
        <p>Keluaran attention adalah jumlah nilai yang dibobot. Untuk token “.” di kalimat A dan B:</p>
        <Tex block>{`0.48\\,v_{\\text{kucing}} + 0.48\\,v_{\\text{tikus}} + 0.02\\,v_{\\text{mengejar}} + 0.02\\,v_{\\text{.}}`}</Tex>
        <p>
          Penjumlahan tidak peduli urutan, jadi kedua kalimat memberi hasil yang sama. Dengan dua kepala, hasilnya
          disambung (<em>concatenate</em>), bukan dijumlahkan: “slot” kepala A selalu berisi hasil kepala A, dan slot
          kepala B selalu berisi hasil kepala B. Perannya tidak tercampur.
        </p>
      </Deep>
      <Takeaway>
        Satu kepala hanya punya satu jatah perhatian. Beberapa kepala bisa mencari beberapa hal sekaligus tanpa
        mencampuradukkan hasilnya.
      </Takeaway>
    </section>
  )
}
