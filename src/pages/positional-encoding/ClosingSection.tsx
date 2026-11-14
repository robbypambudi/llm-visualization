import { Takeaway } from '../../components/Prose'

const ROWS = [
  {
    name: 'Sinusoidal',
    example: 'Transformer asli (2017)',
    question: 'Kamu di posisi berapa?',
    how: 'Tanda dari rumus, dijumlahkan ke embedding.',
  },
  {
    name: 'Learned',
    example: 'GPT-2, BERT',
    question: 'Kamu di posisi berapa?',
    how: 'Tanda dari tabel yang dipelajari. Jumlah posisinya terbatas.',
  },
  {
    name: 'RoPE',
    example: 'LLaMA',
    question: 'Seberapa jauh kita?',
    how: 'Memutar query dan key. Skor hanya bergantung pada jarak.',
  },
  {
    name: 'ALiBi',
    example: 'BLOOM',
    question: 'Seberapa jauh kita?',
    how: 'Mengurangi skor sesuai jarak. Tidak ada tanda posisi sama sekali.',
  },
]

export function ClosingSection() {
  return (
    <section className="section" id="closing">
      <h2>
        <span className="section-num">11</span>Benang merah
      </h2>
      <div className="prose">
        <p>
          Kalau diurutkan, ada pola yang menarik. Cara-cara awal menjawab pertanyaan “kamu di posisi berapa?”. Cara-cara yang
          lebih baru menjawab “seberapa jauh kita?”.
        </p>
      </div>
      <div className="table-scroll">
        <table className="table table-text">
          <thead>
            <tr>
              <th>Cara</th>
              <th>Contoh model</th>
              <th>Pertanyaan yang dijawab</th>
              <th>Caranya</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.name}>
                <td>{r.name}</td>
                <td>{r.example}</td>
                <td>{r.question}</td>
                <td>{r.how}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="prose" style={{ marginTop: 16 }}>
        <p>
          Benihnya sudah ada di paper sinusoidal. Alasan utama memilih sin dan cos adalah harapan bahwa model bisa membaca{' '}
          <strong>posisi relatif</strong> (bagian 8). RoPE membuat ide itu menjadi aturan langsung di dalam attention.
          ALiBi bahkan membuang tanda posisi dan hanya menyisakan jarak.
        </p>
        <p>
          Intuisinya mudah dirasakan, meski ini tafsiran kita sendiri: saat membaca, yang penting biasanya bukan “kata ini
          ada di urutan ke-37”, melainkan “kata ini tepat setelah kata itu”. Kalimat yang sama tetap bermakna sama, entah
          ditulis di awal atau di tengah halaman.
        </p>
      </div>
      <Takeaway>
        Semua cara ini menjawab kebutuhan yang sama: memberi tahu attention soal urutan. Bedanya ada pada apa yang
        diukur, yaitu posisi atau jarak, dan dari mana aturannya datang, yaitu rumus atau hasil belajar.
      </Takeaway>
    </section>
  )
}
