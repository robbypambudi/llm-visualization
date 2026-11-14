import { useEffect, useState } from 'react'
import { Legend, LineChart } from '../../components/LineChart'
import { Deep, Takeaway } from '../../components/Prose'
import { buildBigrams, cloneModel, initModel, row, trainStep, type ToyModel } from '../../lib/embedding'
import type { ChartTheme } from '../../lib/theme'
import { fmt } from '../positional-encoding/state'
import { GROUP_LABEL, GROUP_ORDER, SENTENCES, WORD_GROUP } from './corpus'

const DATA = buildBigrams(SENTENCES)
const D = 2
const LR = 1
const MAX_STEPS = 1200
const STEPS_PER_FRAME = 3

interface Run {
  seed: number
  model: ToyModel
  step: number
  losses: number[]
}

const freshRun = (seed: number): Run => ({ seed, model: initModel(DATA.vocab.length, D, seed), step: 0, losses: [] })

function advance(run: Run, n: number): Run {
  const model = cloneModel(run.model)
  const losses = run.losses.slice()
  let step = run.step
  for (let k = 0; k < n && step < MAX_STEPS; k++, step++) losses.push(trainStep(model, DATA, LR))
  return { ...run, model, step, losses }
}

const SIZE = 340
const PAD = 28
const LABEL_MERGE_PX = 14
const CHAR_PX = 7

/** Points closer than a few pixels share one label, so piled-up words stay readable ("ikan +7"). */
function clusterLabels(pts: { word: string; x: number; y: number }[]) {
  const clusters: { words: string[]; x: number; y: number }[] = []
  for (const p of pts) {
    const near = clusters.find((c) => Math.hypot(c.x - p.x, c.y - p.y) < LABEL_MERGE_PX)
    if (near) near.words.push(p.word)
    else clusters.push({ words: [p.word], x: p.x, y: p.y })
  }
  const labeled = clusters.map((c) => ({
    ...c,
    text: c.words.length <= 2 ? c.words.join(', ') : `${c.words[0]} +${c.words.length - 1}`,
  }))
  // Put a label on the left when its right-hand side would run over another point.
  return labeled.map((c) => {
    const width = c.text.length * CHAR_PX + 8
    const blocked = labeled.some((o) => o !== c && o.x > c.x && o.x < c.x + width + 10 && Math.abs(o.y - c.y) < 14)
    return { ...c, left: blocked }
  })
}

function Scatter({ model, theme }: { model: ToyModel; theme: ChartTheme }) {
  const pts = DATA.contextIds.map((i) => {
    const v = row(model, i)
    return { word: DATA.vocab[i], x: v[0], y: v[1], group: WORD_GROUP[DATA.vocab[i]] }
  })
  const extent = Math.max(1.5, Math.ceil(Math.max(...pts.flatMap((p) => [Math.abs(p.x), Math.abs(p.y)])) * 2) / 2)
  const sx = (x: number) => PAD + ((x + extent) / (2 * extent)) * (SIZE - 2 * PAD)
  const sy = (y: number) => SIZE - PAD - ((y + extent) / (2 * extent)) * (SIZE - 2 * PAD)
  const color = (g: string) => theme.series[GROUP_ORDER.indexOf(g as (typeof GROUP_ORDER)[number])]
  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ width: '100%', maxWidth: 440 }} role="img" aria-label="Posisi embedding 2 dimensi setiap kata">
      <line x1={PAD} x2={SIZE - PAD} y1={SIZE / 2} y2={SIZE / 2} stroke="var(--grid)" />
      <line y1={PAD} y2={SIZE - PAD} x1={SIZE / 2} x2={SIZE / 2} stroke="var(--grid)" />
      <text x={SIZE - 4} y={SIZE - 6} textAnchor="end" className="axis-label">
        angka ke-1 →
      </text>
      <text x={4} y={12} className="axis-label">
        ↑ angka ke-2
      </text>
      {pts.map((p) => (
        <circle key={p.word} cx={sx(p.x)} cy={sy(p.y)} r={5} fill={color(p.group)} stroke="var(--surface-1)" strokeWidth={2}>
          <title>
            {p.word} ({fmt(p.x, 2)}, {fmt(p.y, 2)})
          </title>
        </circle>
      ))}
      {clusterLabels(pts.map((p) => ({ word: p.word, x: sx(p.x), y: sy(p.y) }))).map((c) => (
        <text
          key={c.text}
          x={c.left ? c.x - 8 : c.x + 8}
          y={c.y + 4}
          textAnchor={c.left ? 'end' : 'start'}
          className="axis-label"
          style={{ fill: 'var(--text-primary)' }}
        >
          {c.text}
          <title>{c.words.join(', ')}</title>
        </text>
      ))}
    </svg>
  )
}

export function TrainingSection({ theme }: { theme: ChartTheme }) {
  const [run, setRun] = useState(() => freshRun(42))
  const [playing, setPlaying] = useState(false)
  const done = run.step >= MAX_STEPS

  useEffect(() => {
    if (!playing || done) return
    let id = 0
    const tick = () => {
      setRun((r) => advance(r, STEPS_PER_FRAME))
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [playing, done])

  const lastLoss = run.losses[run.losses.length - 1]
  const legend = GROUP_ORDER.map((g, i) => ({ name: GROUP_LABEL[g], color: theme.series[i] }))

  return (
    <section className="section" id="training">
      <h2>
        <span className="section-num">3</span>Dari acak menjadi bermakna
      </h2>
      <div className="prose">
        <p>
          Tabel embedding awalnya diisi angka acak. Lalu dari mana maknanya? Jawabannya datang dari sebuah ide lama dalam
          ilmu bahasa. Ahli bahasa J. R. Firth (1957) menulis, “You shall know a word by the company it keeps”: kita
          mengenal sebuah kata dari teman-temannya, yaitu kata-kata di sekitarnya.
        </p>
        <p>
          Mari kita uji. Di bawah ini ada model yang sangat kecil. Tugasnya hanya satu: <strong>menebak kata berikutnya</strong>{' '}
          dari satu kata. Setiap kata punya embedding berisi 2 angka saja, supaya bisa digambar sebagai titik. Model
          dilatih dengan {SENTENCES.length} kalimat sederhana seperti “kucing makan ikan .” dan “ibu membaca buku .”.
        </p>
        <p>
          Tekan <strong>Latih</strong> dan perhatikan titik-titiknya. Awalnya berserakan secara acak.
        </p>
      </div>
      <div className="card">
        <div className="controls" style={{ marginBottom: 12, alignItems: 'center' }}>
          <button type="button" className="btn" style={{ flex: 'none' }} disabled={done} onClick={() => setPlaying((p) => !p)}>
            {playing && !done ? '❚❚ Jeda' : '▶ Latih'}
          </button>
          <button
            type="button"
            className="btn"
            style={{ flex: 'none' }}
            onClick={() => {
              setPlaying(false)
              setRun(freshRun(run.seed + 1))
            }}
          >
            ↺ Acak ulang
          </button>
          <div className="stat">
            <span className="stat-label">langkah latihan</span>
            <span className="stat-value">
              {run.step} / {MAX_STEPS}
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">loss (makin kecil makin baik)</span>
            <span className="stat-value">{lastLoss === undefined ? '—' : fmt(lastLoss, 3)}</span>
          </div>
        </div>
        <div className="grid-2" style={{ alignItems: 'center' }}>
          <div style={{ justifySelf: 'center', width: '100%', maxWidth: 440 }}>
            <Legend items={legend} />
            <Scatter model={run.model} theme={theme} />
          </div>
          <div>
            <div className="card-title">Loss selama latihan</div>
            <div className="card-sub">
              Loss mengukur seberapa salah tebakan model. Kurva yang turun berarti model makin pandai menebak.
            </div>
            <LineChart
              series={[
                {
                  name: 'loss',
                  color: theme.series[0],
                  fn: (x) => run.losses[Math.min(run.losses.length - 1, Math.max(0, Math.round(x)))] ?? NaN,
                },
              ]}
              xDomain={[0, MAX_STEPS]}
              yDomain={[0, 3.5]}
              yTicks={[0, 1, 2, 3]}
              height={220}
              xLabel="langkah latihan"
              ariaLabel="Loss selama latihan"
            />
          </div>
        </div>
        <p className="card-sub" style={{ marginTop: 12, marginBottom: 0 }}>
          Warna hanya untuk membantu kita membaca. Model tidak pernah diberi tahu kelompok kata mana pun. Label seperti
          “ikan +7” berarti beberapa kata bertumpuk di tempat yang sama; arahkan kursor ke label untuk melihat semuanya.
          Tanda titik (.) tidak digambar karena tidak pernah menjadi kata yang dipakai untuk menebak.
        </p>
      </div>
      <div className="prose" style={{ marginTop: 16 }}>
        <p>Setelah latihan selesai, beberapa pola muncul dengan sendirinya:</p>
        <ul>
          <li>
            <strong>Hewan berkumpul.</strong> “Kucing”, “anjing”, dan “kelinci” selalu diikuti kata yang mirip (makan,
            minum, tidur), jadi model mendorong ketiganya ke tempat yang berdekatan.
          </li>
          <li>
            <strong>Benda berkumpul, dan “tidur” ikut bergabung.</strong> Semua benda selalu diikuti tanda titik. “Tidur”
            juga selalu diikuti titik. Bagi model ini, yang penting hanyalah kata berikutnya, jadi “tidur” dianggap mirip
            “ikan”.
          </li>
          <li>
            <strong>Kata kerja justru berjauhan.</strong> “Makan” diikuti makanan, “minum” diikuti minuman, “membaca”
            diikuti bacaan. Teman-temannya berbeda, jadi letaknya pun berbeda.
          </li>
        </ul>
        <p>
          Itulah inti filosofinya: <strong>makna sebuah kata dibentuk oleh konteks tempat kata itu muncul</strong>.
          Model kecil ini hanya melihat satu kata berikutnya, jadi “makna” yang ia pelajari juga sempit. LLM sungguhan
          melihat ribuan kata di sekitarnya, sehingga maknanya jauh lebih kaya.
        </p>
      </div>
      <Deep title="Untuk yang penasaran: model mini ini dan LLM sungguhan">
        <p>
          Model ini menghitung skor untuk setiap kata di kamus dari embedding kata saat ini, lalu mengubahnya menjadi
          peluang dengan softmax. Loss-nya adalah <em>cross-entropy</em>: makin kecil peluang yang diberikan untuk kata
          yang benar, makin besar loss-nya. Setiap langkah latihan menggeser embedding dan bobot sedikit ke arah yang
          mengurangi loss (<em>gradient descent</em>).
        </p>
        <p>
          LLM melatih tabel embedding dengan cara yang sama, yaitu lewat loss menebak token berikutnya. Bedanya, di antara
          tabel embedding dan tebakan akhir ada puluhan lapisan attention dan MLP, embedding-nya berisi ratusan sampai
          ribuan angka, dan datanya miliaran token.
        </p>
        <p>Kalimat latihan model ini:</p>
        <p className="mono" style={{ fontSize: 12.5, lineHeight: 1.7 }}>
          {SENTENCES.join(' · ')}
        </p>
      </Deep>
      <Takeaway>
        Tidak ada yang menulis makna ke dalam embedding. Makna muncul sendiri karena kata yang dipakai dalam konteks mirip
        didorong ke tempat yang berdekatan.
      </Takeaway>
    </section>
  )
}
