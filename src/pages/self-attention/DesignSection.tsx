import { Takeaway } from '../../components/Prose'
import { attention, randomMatrix, type Mat } from '../../lib/transformer'
import type { ChartTheme } from '../../lib/theme'
import { fmt } from '../positional-encoding/state'
import { AttnGrid } from './AttnGrid'
import { K, Q, TOKENS } from './toy'

const N = TOKENS.length
// Illustration: random 8-number embeddings standing in for the rows of an untrained table.
const X = randomMatrix(N, 8, 2024)
const UNIFORM: Mat = TOKENS.map(() => TOKENS.map(() => 1 / N))
const SIMILAR = attention(X, X, X)
const LEARNED = attention(Q, K, K)

const selfWeight = (w: Mat) => w.reduce((s, row, i) => s + row[i], 0) / w.length
const DIA = TOKENS.indexOf('dia')
const KUCING = TOKENS.indexOf('kucing')

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

const REQUIREMENTS = ['Konteks khusus tiap kata', 'Memilih yang relevan', 'Boleh satu arah', 'Bisa dipelajari']

const ATTEMPTS: { name: string; marks: [Mark, string][] }[] = [
  {
    name: '1 · Rata-rata semua kata',
    marks: [
      ['no', 'semua sama'],
      ['no', 'semua setara'],
      ['no', 'tidak ada arah'],
      ['no', 'tidak ada yang diatur'],
    ],
  },
  {
    name: '2 · Bobot dari kemiripan',
    marks: [
      ['yes', 'ya'],
      ['no', 'paling mirip = diri sendiri'],
      ['no', 'skor selalu simetris'],
      ['partial', 'hanya lewat embedding'],
    ],
  },
  {
    name: '3 · Query, key, value',
    marks: [
      ['yes', 'ya'],
      ['yes', 'ya'],
      ['yes', 'ya'],
      ['yes', 'W_Q, W_K, W_V'],
    ],
  },
]

export function DesignSection({ theme }: { theme: ChartTheme }) {
  return (
    <section className="section" id="design">
      <h2>
        <span className="section-num">2</span>Merancang attention dari nol
      </h2>
      <div className="prose">
        <p>
          Sebelum melihat rumusnya, mari kita coba merancangnya sendiri. Tugasnya: untuk setiap kata, buat vektor baru
          yang berisi campuran informasi dari kata-kata di kalimat. Pertanyaannya, <strong>berapa banyak</strong> diambil
          dari setiap kata? Angka “berapa banyak” ini kita sebut <strong>bobot perhatian</strong>. Bobot untuk satu kata
          selalu berjumlah 1 (100%), seperti membagi perhatian kita.
        </p>
        <p>Rancangan yang bagus sebaiknya memenuhi empat syarat:</p>
        <ol>
          <li>
            <strong>Konteks khusus tiap kata</strong>: “dia” dan “tidur” butuh informasi yang berbeda.
          </li>
          <li>
            <strong>Memilih yang relevan</strong>, bukan sekadar yang mirip. “Dia” perlu “kucing”, padahal dua kata itu
            tidak mirip.
          </li>
          <li>
            <strong>Boleh satu arah</strong>: “dia” butuh “kucing”, tetapi “kucing” belum tentu butuh “dia”.
          </li>
          <li>
            <strong>Bisa dipelajari</strong>: model bisa mengatur sendiri siapa melihat siapa selama pelatihan.
          </li>
        </ol>
      </div>

      <div className="attempt">
        <div className="attempt-label">Percobaan 1</div>
        <h3>Rata-ratakan semua kata</h3>
        <div className="prose">
          <p>
            Cara paling sederhana: setiap kata mengambil rata-rata dari semua kata, masing-masing 1/{N}. Hasilnya, semua
            kata mendapat vektor konteks yang <strong>sama persis</strong>. “Dia” tidak tahu bahwa “kucing” lebih penting
            daripada “karena”.
          </p>
        </div>
        <div className="card">
          <AttnGrid weights={UNIFORM} tokens={TOKENS} theme={theme} ariaLabel="Bobot rata-rata: semua sama" />
          <p className="card-sub" style={{ marginTop: 10, marginBottom: 0 }}>
            Setiap baris adalah satu kata yang sedang “bertanya”. Setiap kolom adalah kata yang dilihat. Semua sel
            bernilai {fmt(1 / N, 2)}.
          </p>
        </div>
      </div>

      <div className="attempt">
        <div className="attempt-label">Percobaan 2</div>
        <h3>Beri bobot berdasarkan kemiripan</h3>
        <div className="prose">
          <p>
            Ide berikutnya: kata yang vektornya mirip diberi bobot lebih besar. Kemiripan diukur dengan{' '}
            <em>dot product</em> seperti di bab Token Embedding, lalu diubah menjadi bobot berjumlah 1 dengan{' '}
            <strong>softmax</strong>. Softmax membuat skor besar menjadi bobot besar, dan skor kecil menjadi bobot kecil.
          </p>
          <p>
            Di bawah ini, setiap kata diberi embedding acak berisi 8 angka. Lihat diagonalnya: setiap kata paling banyak
            melihat <strong>dirinya sendiri</strong> (rata-rata {fmt(selfWeight(SIMILAR.weights) * 100, 0)}% bobot).
            Wajar, karena tidak ada yang lebih mirip dengan sebuah kata selain kata itu sendiri.
          </p>
        </div>
        <div className="card">
          <AttnGrid weights={SIMILAR.weights} tokens={TOKENS} theme={theme} ariaLabel="Bobot dari kemiripan embedding" />
          <p className="card-sub" style={{ marginTop: 10, marginBottom: 0 }}>
            Ada masalah kedua: skor “dia → kucing” selalu sama dengan skor “kucing → dia” (keduanya{' '}
            {fmt(SIMILAR.scores[DIA][KUCING], 2)}), karena dot product tidak peduli urutan. Hubungan satu arah tidak
            bisa dibuat.
          </p>
        </div>
      </div>

      <div className="attempt">
        <div className="attempt-label">Percobaan 3</div>
        <h3>Pisahkan peran: query, key, value</h3>
        <div className="prose">
          <p>
            Kuncinya adalah memberi setiap kata <strong>tiga wajah</strong> yang berbeda, masing-masing dibuat dari
            embedding-nya lewat perkalian dengan tabel bobot yang dipelajari:
          </p>
          <ul>
            <li>
              <strong>Query (kueri)</strong>: “aku sedang mencari apa?” Query “dia” kira-kira berbunyi “cari makhluk
              yang sedang dibicarakan”.
            </li>
            <li>
              <strong>Key (kunci)</strong>: “aku bisa menawarkan apa?” Key “kucing” kira-kira berbunyi “aku makhluk”.
            </li>
            <li>
              <strong>Value (nilai)</strong>: “kalau aku dipilih, ini informasi yang kuserahkan.”
            </li>
          </ul>
          <p>
            Bayangkan mencari video. Kata yang kamu ketik adalah query. Judul dan tag setiap video adalah key. Videonya
            sendiri adalah value. Kamu mencocokkan query dengan key, tetapi yang kamu tonton adalah value-nya.
          </p>
          <p>
            Karena query dan key adalah dua vektor yang berbeda, skor “dia → kucing” (query dia · key kucing) tidak harus
            sama dengan “kucing → dia” (query kucing · key dia). Dan karena ketiganya dibuat dari bobot yang dipelajari,
            model sendiri yang menentukan siapa mencari siapa.
          </p>
        </div>
        <div className="card">
          <AttnGrid weights={LEARNED.weights} tokens={TOKENS} theme={theme} ariaLabel="Bobot dengan query dan key" />
          <p className="card-sub" style={{ marginTop: 10, marginBottom: 0 }}>
            Query dan key di sini dirancang dengan tangan (detailnya di bagian 3). Sekarang “dia” memberi{' '}
            {fmt(LEARNED.weights[DIA][KUCING] * 100, 0)}% perhatiannya ke “kucing”, sedangkan “kucing” hanya memberi{' '}
            {fmt(LEARNED.weights[KUCING][DIA] * 100, 0)}% ke “dia”.
          </p>
        </div>
      </div>

      <div className="table-scroll" style={{ marginTop: 20 }}>
        <table className="table table-text">
          <thead>
            <tr>
              <th>Percobaan</th>
              {REQUIREMENTS.map((r) => (
                <th key={r}>{r}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ATTEMPTS.map((a) => (
              <tr key={a.name}>
                <td>{a.name}</td>
                {a.marks.map(([m, note], i) => (
                  <Verdict key={i} mark={m} note={note} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Takeaway>
        Satu vektor untuk semua peran tidak cukup. Dengan memisahkan “yang dicari” (query), “yang ditawarkan” (key), dan
        “yang diserahkan” (value), setiap kata bisa memilih kata yang relevan baginya.
      </Takeaway>
    </section>
  )
}
