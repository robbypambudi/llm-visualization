import { Takeaway } from '../../components/Prose'

const MODELS = [
  { name: 'GPT-2 small', layers: 12, d: 768, source: 'model.py (default_hparams)' },
  { name: 'GPT-2 terbesar (1.5 miliar parameter)', layers: 48, d: 1600, source: 'paper GPT-2, Tabel 2' },
  { name: 'LLaMA 3 8B', layers: 32, d: 4096, source: 'config.json di Hugging Face' },
]

export function DepthSection() {
  return (
    <section className="section" id="depth">
      <h2>
        <span className="section-num">1</span>Masalah tumpukan yang dalam
      </h2>
      <div className="prose">
        <p>
          Sebuah LLM tidak hanya punya satu blok Transformer. Blok yang sama bentuknya ditumpuk berkali-kali, dan setiap
          blok mengolah hasil dari blok sebelumnya.
        </p>
      </div>
      <div className="table-scroll">
        <table className="table">
          <thead>
            <tr>
              <th>Model</th>
              <th>Jumlah blok</th>
              <th>Panjang vektor</th>
              <th>Sumber</th>
            </tr>
          </thead>
          <tbody>
            {MODELS.map((m) => (
              <tr key={m.name}>
                <td>{m.name}</td>
                <td className="mono">{m.layers}</td>
                <td className="mono">{m.d}</td>
                <td>{m.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="prose" style={{ marginTop: 16 }}>
        <p>
          Menumpuk banyak lapisan ternyata tidak mudah. Bayangkan permainan <strong>pesan berantai</strong>: orang pertama
          membisikkan kalimat ke orang kedua, orang kedua ke orang ketiga, dan seterusnya. Setiap orang mengucapkan ulang
          pesan dengan caranya sendiri. Setelah puluhan orang, pesan aslinya sering sudah tidak dikenali.
        </p>
        <p>Tumpukan lapisan menghadapi dua masalah yang mirip:</p>
        <ul>
          <li>
            <strong>Maju:</strong> kalau setiap lapisan menulis ulang vektornya, informasi dari input awal makin kabur di
            lapisan-lapisan atas.
          </li>
          <li>
            <strong>Mundur:</strong> saat belajar, model mengirim <em>sinyal belajar</em> (gradien) dari jawaban akhir
            kembali ke setiap lapisan. Sinyal ini juga harus melewati semua lapisan, dan di tiap lapisan ia bisa melemah
            atau malah membesar. Lapisan paling awal bisa menerima sinyal yang nyaris nol, atau sinyal yang terlalu besar.
          </li>
        </ul>
        <p>
          Bab ini membahas dua alat sederhana yang membuat tumpukan dalam bisa dilatih: <strong>jalur residual</strong>{' '}
          dan <strong>normalisasi</strong>.
        </p>
      </div>
      <Takeaway>
        Makin banyak lapisan, makin jauh perjalanan informasi ke atas dan sinyal belajar ke bawah. Keduanya mudah rusak di
        jalan.
      </Takeaway>
    </section>
  )
}
