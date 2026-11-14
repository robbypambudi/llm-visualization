import { useState } from 'react'
import { Field, Segmented, Slider } from '../../components/Controls'
import { Takeaway } from '../../components/Prose'
import { fmtCount } from './format'

const MODELS = [
  { name: 'BERT-base', vocab: 30522, d: 768, total: 110e6 },
  { name: 'GPT-2 small', vocab: 50257, d: 768, total: 124e6 },
  { name: 'LLaMA 2 7B', vocab: 32000, d: 4096, total: 6.74e9 },
  { name: 'LLaMA 3 8B', vocab: 128256, d: 4096, total: 8.03e9 },
]

const D_CHOICES = [256, 768, 1024, 4096, 8192]

export function SizeSection() {
  const [vocab, setVocab] = useState(50000)
  const [d, setD] = useState(768)
  const params = vocab * d

  return (
    <section className="section" id="size">
      <h2>
        <span className="section-num">5</span>Seberapa besar tabelnya?
      </h2>
      <div className="prose">
        <p>
          Ukuran tabel embedding = ukuran kamus × panjang vektor. Di model kecil, tabel ini bisa memakan bagian yang besar
          dari seluruh model.
        </p>
      </div>
      <div className="table-scroll">
        <table className="table">
          <thead>
            <tr>
              <th>Model</th>
              <th>Ukuran kamus</th>
              <th>Panjang vektor</th>
              <th>Isi tabel embedding</th>
              <th>Total model (kira-kira)</th>
              <th>Porsi tabel</th>
            </tr>
          </thead>
          <tbody>
            {MODELS.map((m) => {
              const p = m.vocab * m.d
              const share = p / m.total
              return (
                <tr key={m.name}>
                  <td>{m.name}</td>
                  <td className="mono">{m.vocab}</td>
                  <td className="mono">{m.d}</td>
                  <td className="mono">{fmtCount(p)}</td>
                  <td className="mono">{fmtCount(m.total)}</td>
                  <td>
                    <span className="bar-cell">
                      <span className="mono">{(share * 100).toFixed(1)}%</span>
                      <span className="bar" style={{ width: `${share * 160}px` }} aria-hidden />
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="card-sub" style={{ marginTop: 8 }}>
        Ukuran kamus dan panjang vektor diambil dari konfigurasi model di Hugging Face. Hanya tabel input yang dihitung.
      </p>
      <div className="prose" style={{ marginTop: 16 }}>
        <p>
          Di sini tarik-menarik dari bab Tokenization muncul lagi. Kamus yang lebih besar membuat teks lebih sedikit
          tokennya, tetapi tabelnya ikut membesar. LLaMA 3 memperbesar kamus sekitar empat kali lipat dari LLaMA 2, dan
          tabel embedding-nya membengkak dari sekitar 131 juta menjadi 525 juta angka. Coba sendiri di bawah.
        </p>
      </div>
      <div className="card">
        <div className="controls">
          <Slider label="ukuran kamus" value={vocab} min={1000} max={256000} step={1000} onChange={setVocab} />
          <Field label="panjang vektor (d)">
            <Segmented ariaLabel="panjang vektor" value={d} options={D_CHOICES.map((v) => ({ value: v, label: String(v) }))} onChange={setD} />
          </Field>
        </div>
        <div className="stat-row">
          <div className="stat">
            <span className="stat-label">isi tabel</span>
            <span className="stat-value">{fmtCount(params)} angka</span>
          </div>
          <div className="stat">
            <span className="stat-label">memori (2 byte per angka)</span>
            <span className="stat-value">{((params * 2) / 1e6).toFixed(0)} MB</span>
          </div>
        </div>
        <p className="card-sub" style={{ marginTop: 12, marginBottom: 0 }}>
          2 byte per angka adalah format 16-bit yang umum dipakai saat menjalankan model.
        </p>
      </div>
      <Takeaway>Setiap token tambahan di kamus berarti satu baris tambahan di tabel. Kamus besar tidak gratis.</Takeaway>
    </section>
  )
}
