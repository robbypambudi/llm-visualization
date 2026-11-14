import { useState } from 'react'
import { Deep, Takeaway } from '../../components/Prose'
import { PieceChips, TokenChips } from '../../components/TokenChips'
import { useTokenizer } from '../../lib/tokenizer'

/** A small hand-made word list for the word-level demo; anything else becomes [UNK]. */
const KAMUS = new Set(
  `kucing anjing burung ikan itu ini sedang tidur makan minum di ke dari atas bawah meja kursi rumah sekolah saya aku kamu
  dia kami kita mereka dan atau yang tidak ada akan sudah belum bisa mau pergi datang buku air nasi besar kecil baik hari
  besok kemarin dengan untuk pada adalah juga sangat lagi orang anak ibu ayah . , ! ?`.split(/\s+/),
)
const UNK = '[UNK]'

const words = (s: string) => (s.match(/\p{L}+|\p{N}+|[^\s\p{L}\p{N}]/gu) ?? []).map((w) => (KAMUS.has(w.toLowerCase()) ? w : UNK))

type Mark = 'yes' | 'no' | 'partial'

const ROWS: { name: string; cells: [Mark, string][] }[] = [
  {
    name: 'Per huruf',
    cells: [
      ['yes', 'kecil'],
      ['no', 'sangat panjang'],
      ['yes', 'selalu bisa'],
      ['no', 'hampir tidak ada'],
    ],
  },
  {
    name: 'Per kata',
    cells: [
      ['no', 'raksasa'],
      ['yes', 'pendek'],
      ['no', 'jadi [UNK]'],
      ['yes', 'jelas'],
    ],
  },
  {
    name: 'Subword',
    cells: [
      ['partial', 'puluhan sampai ratusan ribu'],
      ['partial', 'sedang'],
      ['yes', 'dipecah jadi potongan'],
      ['partial', 'cukup'],
    ],
  },
]

export function SchemesSection() {
  const [text, setText] = useState('Kucing itu sedang tidur di atas keyboard laptopku.')
  const gpt2 = useTokenizer('r50k_base')
  const chars = Array.from(text)
  const ws = words(text)
  const ids = gpt2 ? gpt2.encode(text) : []

  return (
    <section className="section" id="schemes">
      <h2>
        <span className="section-num">2</span>Dipotong per apa? Tiga pilihan
      </h2>
      <div className="prose">
        <p>Ada tiga pilihan yang masuk akal. Coba ketik kalimatmu sendiri dan bandingkan hasilnya.</p>
        <ul>
          <li>
            <strong>Per huruf</strong>: setiap karakter jadi satu token.
          </li>
          <li>
            <strong>Per kata</strong>: setiap kata jadi satu token. Kata yang tidak ada di kamus diganti{' '}
            <code>[UNK]</code> (<em>unknown</em>, tidak dikenal).
          </li>
          <li>
            <strong>Subword</strong> (potongan kata): kata yang sering muncul tetap utuh, kata yang jarang dipecah menjadi
            potongan yang lebih kecil. Di sini dipakai tokenizer asli GPT-2.
          </li>
        </ul>
      </div>
      <div className="card">
        <input className="text-input" value={text} onChange={(e) => setText(e.target.value)} aria-label="Kalimat" />
        <div className="row-label">Per huruf · {chars.length} token</div>
        <PieceChips pieces={chars} />
        <div className="row-label">Per kata (kamus kecil buatan sendiri) · {ws.length} token</div>
        <PieceChips pieces={ws} unknown={(p) => p === UNK} />
        <div className="row-label">Subword (tokenizer GPT-2) · {gpt2 ? `${ids.length} token` : 'memuat…'}</div>
        {gpt2 && <TokenChips ids={ids} tok={gpt2} />}
        <p className="card-sub" style={{ marginTop: 12, marginBottom: 0 }}>
          Kotak bergaris putus-putus adalah <code>[UNK]</code>. Titik tengah (·) adalah spasi. Kamus “per kata” di sini
          sengaja dibuat kecil agar masalahnya terlihat.
        </p>
      </div>

      <div className="prose" style={{ marginTop: 16 }}>
        <p>
          Setiap pilihan adalah <strong>tarik-menarik</strong> antara dua hal: ukuran kamus dan panjang urutan.
        </p>
        <p>
          <strong>Per huruf</strong> punya kamus kecil dan tidak pernah bertemu kata asing. Tetapi urutannya sangat
          panjang, dan model harus belajar sendiri bahwa k-u-c-i-n-g adalah satu benda. Urutan yang panjang juga mahal:
          beban attention naik jauh lebih cepat daripada panjang urutannya.
        </p>
        <p>
          <strong>Per kata</strong> menghasilkan urutan pendek dan setiap token jelas artinya. Masalahnya, kamusnya
          meledak. Dalam bahasa Indonesia, “makan”, “makanan”, “dimakan”, “memakan”, dan “termakan” masing-masing harus
          jadi entri terpisah. Kata baru, nama orang, atau salah ketik langsung jadi <code>[UNK]</code>, dan artinya
          hilang.
        </p>
        <p>
          <strong>Subword</strong> mengambil jalan tengah. Mirip cara kita membaca kata yang belum pernah dilihat: saat
          bertemu “ketidakberesan”, kita mengenali potongan “ke”, “tidak”, “beres”, dan “an”. Hampir semua LLM modern
          memakai cara ini.
        </p>
      </div>
      <div className="table-scroll">
        <table className="table table-text">
          <thead>
            <tr>
              <th>Cara</th>
              <th>Ukuran kamus</th>
              <th>Panjang urutan</th>
              <th>Kata baru</th>
              <th>Arti per token</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.name}>
                <td>{r.name}</td>
                {r.cells.map(([mark, note], j) => (
                  <td key={j} className="verdict">
                    <span className={`verdict-${mark}`} aria-hidden>
                      {mark === 'yes' ? '✓' : mark === 'no' ? '✗' : '△'}
                    </span>
                    {note}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="card-sub" style={{ marginTop: 8 }}>
        ✓ menguntungkan · △ di tengah · ✗ merugikan.
      </p>
      <Deep title="Untuk yang penasaran: kenapa urutan panjang itu mahal">
        <p>
          Pada attention standar, setiap token dibandingkan dengan setiap token lain. Untuk <em>n</em> token ada{' '}
          <em>n × n</em> pasangan. Kalimat yang dua kali lebih panjang butuh sekitar empat kali lebih banyak perbandingan.
          Itulah sebabnya memotong teks menjadi lebih sedikit token sangat berharga.
        </p>
      </Deep>
      <Takeaway>
        Subword adalah kompromi: kamus tidak terlalu besar, urutan tidak terlalu panjang, dan hampir tidak ada kata yang
        tidak dikenal.
      </Takeaway>
    </section>
  )
}
