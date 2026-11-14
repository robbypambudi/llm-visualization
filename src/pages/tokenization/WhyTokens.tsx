import { useState } from 'react'
import { Takeaway } from '../../components/Prose'

const encoder = new TextEncoder()

export function WhyTokens() {
  const [text, setText] = useState('Halo, dunia! 🙂')
  const chars = Array.from(text)
  const byteCount = encoder.encode(text).length

  return (
    <section className="section" id="why">
      <h2>
        <span className="section-num">1</span>Kenapa teks harus dipotong?
      </h2>
      <div className="prose">
        <p>
          Model bahasa hanya bisa menghitung angka. Ia tidak bisa membaca huruf seperti kita. Jadi sebelum masuk ke model,
          teks harus diubah dulu menjadi deretan angka.
        </p>
        <p>
          Sebenarnya komputer memang sudah menyimpan teks sebagai angka. Setiap karakter disimpan sebagai satu sampai empat{' '}
          <strong>byte</strong> (angka 0 sampai 255), mengikuti aturan bernama UTF-8. Ketik sesuatu di bawah ini dan lihat
          angkanya.
        </p>
      </div>
      <div className="card">
        <input className="text-input" value={text} onChange={(e) => setText(e.target.value)} aria-label="Teks" />
        <div className="chip-row" style={{ marginTop: 14 }}>
          {chars.map((c, i) => (
            <div key={i} className="byte-group">
              <span className="byte-char">{c === ' ' ? '·' : c}</span>
              <span className="byte-values">{Array.from(encoder.encode(c)).join(' ')}</span>
            </div>
          ))}
        </div>
        <div className="stat-row">
          <div className="stat">
            <span className="stat-label">karakter</span>
            <span className="stat-value">{chars.length}</span>
          </div>
          <div className="stat">
            <span className="stat-label">byte</span>
            <span className="stat-value">{byteCount}</span>
          </div>
        </div>
        <p className="card-sub" style={{ marginTop: 12, marginBottom: 0 }}>
          Huruf biasa cukup 1 byte. Huruf beraksen seperti é butuh 2 byte, dan kebanyakan emoji butuh 4. Titik tengah (·)
          menandai spasi.
        </p>
      </div>
      <div className="prose" style={{ marginTop: 16 }}>
        <p>
          Lalu kenapa tidak langsung memasukkan byte-byte ini ke model? Bisa saja, tetapi urutannya jadi sangat panjang,
          dan satu byte hampir tidak punya arti. Jadi pertanyaan yang sebenarnya adalah:{' '}
          <strong>teks sebaiknya dipotong per apa?</strong> Setiap potongan disebut <strong>token</strong>, dan setiap
          token diberi nomor yang disebut <strong>ID token</strong>.
        </p>
      </div>
      <Takeaway>
        Model tidak pernah melihat huruf. Yang ia terima hanyalah deretan nomor, satu nomor untuk setiap token.
      </Takeaway>
    </section>
  )
}
