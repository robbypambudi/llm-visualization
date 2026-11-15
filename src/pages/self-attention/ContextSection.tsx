import { Takeaway } from '../../components/Prose'

const PAIRS: { words: string[]; target: number; clue: number; meaning: string }[] = [
  { words: ['Ular', 'itu', 'punya', 'bisa', '.'], target: 3, clue: 0, meaning: 'racun' },
  { words: ['Saya', 'bisa', 'berenang', '.'], target: 1, clue: 2, meaning: 'mampu' },
]

function Sentence({ words, target, clue }: { words: string[]; target: number; clue: number }) {
  return (
    <div className="tok-chips" style={{ gap: 6 }}>
      {words.map((w, i) => (
        <span
          key={i}
          className="ctx-word"
          data-role={i === target ? 'target' : i === clue ? 'clue' : undefined}
        >
          {w}
        </span>
      ))}
    </div>
  )
}

export function ContextSection() {
  return (
    <section className="section" id="context">
      <h2>
        <span className="section-num">1</span>Masalahnya: kata butuh teman
      </h2>
      <div className="prose">
        <p>
          Di bab Token Embedding, setiap token mengambil satu baris dari tabel. Artinya, kata “bisa” selalu mendapat
          vektor yang <strong>sama persis</strong>, di kalimat mana pun. Padahal artinya bisa sangat berbeda:
        </p>
      </div>
      <div className="card">
        {PAIRS.map((p) => (
          <div key={p.meaning} style={{ marginBottom: 14 }}>
            <Sentence words={p.words} target={p.target} clue={p.clue} />
            <div className="card-sub" style={{ marginTop: 6, marginBottom: 0 }}>
              “bisa” di sini berarti <strong>{p.meaning}</strong>. Petunjuknya: “{p.words[p.clue]}”.
            </div>
          </div>
        ))}
        <div className="legend" style={{ marginTop: 4 }}>
          <span className="legend-item">
            <span className="ctx-word" data-role="target">
              kata
            </span>
            kata yang artinya ambigu
          </span>
          <span className="legend-item">
            <span className="ctx-word" data-role="clue">
              kata
            </span>
            kata yang memberi petunjuk
          </span>
        </div>
      </div>
      <div className="prose" style={{ marginTop: 16 }}>
        <p>
          Kita manusia langsung tahu artinya karena kita melihat kata-kata di sekitarnya. Hal yang sama terjadi pada kata
          ganti. Di kalimat “kucing itu tidur karena <em>dia</em> lelah”, kata “dia” tidak punya arti sendiri. Artinya
          baru jelas setelah kita menghubungkannya dengan “kucing”.
        </p>
        <p>
          Jadi setiap vektor kata perlu <strong>diperbarui</strong> dengan informasi dari kata-kata lain di kalimat yang
          sama. Inilah tugas <strong>self-attention</strong>: setiap kata “melihat” kata-kata lain, memilih mana yang
          penting baginya, lalu mengambil informasi dari sana. Disebut <em>self</em> karena kata-kata itu saling melihat
          di dalam kalimatnya sendiri.
        </p>
      </div>
      <Takeaway>
        Embedding memberi arti kata secara umum. Self-attention menyesuaikan arti itu dengan konteks kalimatnya.
      </Takeaway>
    </section>
  )
}
