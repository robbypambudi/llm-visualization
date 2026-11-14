import { Takeaway } from '../../components/Prose'
import { useTokenizer, visibleToken } from '../../lib/tokenizer'
import type { ChartTheme } from '../../lib/theme'

const WORDS = [' cat', ' kitten', ' dog', ' car', ' apple', ' banana']
const ONE_HOT_WORDS = ['kucing', 'anak kucing', 'anjing', 'mobil']

type Mark = 'yes' | 'no' | 'partial'

const ROWS: { name: string; cells: [Mark, string][] }[] = [
  {
    name: '1 · ID sebagai angka',
    cells: [
      ['yes', '1 angka'],
      ['no', 'tidak ada'],
      ['no', 'urutan palsu'],
    ],
  },
  {
    name: '2 · One-hot',
    cells: [
      ['no', '50257 angka (GPT-2)'],
      ['no', 'semua sama jauh'],
      ['yes', 'tidak ada'],
    ],
  },
  {
    name: '3 · Vektor padat (embedding)',
    cells: [
      ['yes', '768 angka (GPT-2)'],
      ['yes', 'bisa dipelajari'],
      ['yes', 'tidak ada'],
    ],
  },
]

function OneHot({ index, size, theme }: { index: number; size: number; theme: ChartTheme }) {
  return (
    <div className="strip" aria-hidden>
      {Array.from({ length: size }, (_, i) => (
        <span key={i} style={{ background: i === index ? theme.diverging.css(1) : theme.diverging.css(0) }} />
      ))}
    </div>
  )
}

export function IdSection({ theme }: { theme: ChartTheme }) {
  const gpt2 = useTokenizer('r50k_base')

  return (
    <section className="section" id="ids">
      <h2>
        <span className="section-num">1</span>Kenapa ID saja tidak cukup?
      </h2>
      <div className="prose">
        <p>
          Dari bab Tokenization, setiap token sudah punya nomor ID. Tetapi ID hanyalah nomor urut di kamus, seperti nomor
          antrean di bank. Nomornya memberi tahu <em>siapa</em>, bukan <em>seperti apa</em>. Lihat ID beberapa kata di
          kamus GPT-2:
        </p>
      </div>
      <div className="card">
        {gpt2 ? (
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Token</th>
                  <th>ID di GPT-2</th>
                </tr>
              </thead>
              <tbody>
                {WORDS.map((w) => (
                  <tr key={w}>
                    <td className="mono">“{visibleToken(w)}”</td>
                    <td className="mono">{gpt2.encode(w).join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <span className="muted-text">Memuat tokenizer…</span>
        )}
        <p className="card-sub" style={{ marginTop: 8, marginBottom: 0 }}>
          Dihitung langsung dengan tokenizer GPT-2. Kata bahasa Inggris dipakai karena di GPT-2 masing-masing utuh menjadi
          satu token. · = spasi di depan kata.
        </p>
      </div>
      <div className="prose" style={{ marginTop: 16 }}>
        <p>
          Nomor-nomor itu tidak mengikuti arti. Urutan ID di kamus BPE kurang lebih mengikuti urutan penggabungan saat
          kamus dibangun, bukan kedekatan makna. Jadi kita perlu cara lain untuk mewakili token. Seperti di bab Positional
          Encoding, mari kita rancang dari nol.
        </p>
      </div>

      <div className="attempt">
        <div className="attempt-label">Percobaan 1</div>
        <h3>Masukkan ID sebagai angka</h3>
        <div className="prose">
          <p>
            Cara paling sederhana: berikan ID langsung ke model sebagai satu angka. Masalahnya, angka punya urutan. Model akan
            mengira token bernomor 1000 “lebih dekat” ke 1001 daripada ke 5, dan token 2000 “dua kali lebih besar” dari
            token 1000. Semua hubungan itu palsu.
          </p>
        </div>
      </div>

      <div className="attempt">
        <div className="attempt-label">Percobaan 2</div>
        <h3>One-hot: satu kolom untuk setiap token</h3>
        <div className="prose">
          <p>
            Agar tidak ada urutan palsu, buat vektor sepanjang ukuran kamus. Semua isinya 0, kecuali satu angka 1 di posisi
            ID token itu. Ini disebut <strong>one-hot</strong>.
          </p>
        </div>
        <div className="card">
          {ONE_HOT_WORDS.map((w, i) => (
            <div className="token-row" key={w}>
              <span className="token-chip">{w}</span>
              <OneHot index={i * 3 + 1} size={16} theme={theme} />
            </div>
          ))}
          <p className="card-sub" style={{ marginTop: 12, marginBottom: 0 }}>
            Contoh dengan kamus 16 kata. Merah = 1, abu-abu = 0. Di GPT-2, setiap vektor one-hot berisi 50257 angka.
          </p>
        </div>
        <div className="prose" style={{ marginTop: 16 }}>
          <p>
            Urutan palsunya hilang, tetapi muncul dua masalah. Pertama, vektornya sangat panjang dan hampir semuanya nol.
            Kedua, setiap pasangan kata sama jauhnya. “Kucing” sama tidak miripnya dengan “anak kucing” seperti dengan
            “mobil”. Tidak ada cara untuk mengatakan bahwa dua kata itu mirip.
          </p>
        </div>
      </div>

      <div className="attempt">
        <div className="attempt-label">Percobaan 3</div>
        <h3>Vektor padat yang dipelajari: embedding</h3>
        <div className="prose">
          <p>
            Solusinya: wakili setiap token dengan deretan angka yang pendek, misalnya 768 angka di GPT-2. Semua angkanya
            terisi (padat), dan nilainya <strong>dipelajari</strong> selama pelatihan. Kata yang mirip bisa mendapat vektor
            yang berdekatan. Vektor inilah yang disebut <strong>embedding</strong>.
          </p>
          <p>
            Bayangkan menjelaskan seseorang. Nomor KTP memang unik, tetapi tidak menceritakan apa pun. Lebih berguna kalau
            kita menyebut ciri-cirinya: tinggi badan, umur, hobi. Dua orang dengan ciri mirip akan terlihat mirip. Embedding
            bekerja dengan semangat yang sama. Bedanya, di model sungguhan “ciri-ciri” itu tidak dipilih manusia, dan
            biasanya satu angka tidak bisa diartikan sendiri-sendiri.
          </p>
        </div>
      </div>

      <div className="attempt">
        <div className="attempt-label">Rangkuman</div>
        <div className="table-scroll">
          <table className="table table-text">
            <thead>
              <tr>
                <th>Percobaan</th>
                <th>Ringkas</th>
                <th>Bisa menyatakan kemiripan</th>
                <th>Urutan palsu</th>
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
      </div>
      <Takeaway>
        ID memberi tahu token yang mana. Embedding memberi tahu token itu seperti apa, dalam bentuk deretan angka yang
        bisa dibandingkan.
      </Takeaway>
    </section>
  )
}
