import { useMemo, useState } from 'react'
import { Slider } from '../../components/Controls'
import { Deep, Takeaway } from '../../components/Prose'
import { PieceChips } from '../../components/TokenChips'
import { applyBpe, trainBpe } from '../../lib/bpe'

const DEFAULT_CORPUS =
  'makan makanan dimakan memakan makan minum minuman diminum meminum minum main mainan bermain dimainkan main makanan minuman mainan'
const MAX_MERGES = 40

export function BpeSection() {
  const [corpus, setCorpus] = useState(DEFAULT_CORPUS)
  const [rawK, setK] = useState(10)
  const [probe, setProbe] = useState('makanannya')

  const full = useMemo(() => trainBpe(corpus, MAX_MERGES), [corpus])
  const available = full.merges.length
  const k = Math.min(rawK, available)
  const now = useMemo(() => trainBpe(corpus, k), [corpus, k])
  const start = useMemo(() => trainBpe(corpus, 0), [corpus])
  const last = now.merges[now.merges.length - 1]
  const words = [...now.words].sort((a, b) => b.count - a.count)

  return (
    <section className="section" id="bpe">
      <h2>
        <span className="section-num">3</span>Mencari potongan sendiri: Byte Pair Encoding
      </h2>
      <div className="prose">
        <p>
          Bagaimana memilih potongan subword? Kita tidak menulis daftarnya dengan tangan. Kita biarkan data yang
          menentukan. Algoritma yang paling populer bernama <strong>BPE</strong> (<em>Byte Pair Encoding</em>), dan
          aturannya sederhana:
        </p>
        <ol>
          <li>Mulai dari huruf-huruf satuan.</li>
          <li>Cari pasangan bersebelahan yang paling sering muncul di seluruh teks.</li>
          <li>Gabungkan pasangan itu menjadi satu simbol baru, lalu masukkan ke kamus.</li>
          <li>Ulangi sampai kamus cukup besar.</li>
        </ol>
        <p>
          Awalnya BPE adalah algoritma untuk memampatkan data (Gage, 1994). Sennrich dkk. (2016) lalu memakainya untuk
          terjemahan mesin. Idenya mirip kebiasaan kita saat mengetik pesan: kata yang sering ditulis, seperti “yang”,
          akhirnya punya singkatan sendiri, “yg”. Yang sering muncul pantas mendapat simbol sendiri.
        </p>
        <p>
          Geser slider di bawah untuk menjalankan BPE langkah demi langkah. Korpusnya boleh kamu ganti.
        </p>
      </div>
      <div className="card">
        <textarea
          className="text-area"
          value={corpus}
          onChange={(e) => setCorpus(e.target.value)}
          aria-label="Korpus latihan BPE"
        />
        <div style={{ marginTop: 12 }}>
          <Slider label="jumlah penggabungan (merge)" value={k} min={0} max={Math.max(available, 1)} onChange={setK} />
        </div>
        <div className="stat-row">
          <div className="stat">
            <span className="stat-label">ukuran kamus</span>
            <span className="stat-value">{now.vocab.length}</span>
          </div>
          <div className="stat">
            <span className="stat-label">token untuk seluruh korpus</span>
            <span className="stat-value">
              {now.tokenCount}
              <span className="muted-text"> (awal {start.tokenCount})</span>
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">langkah terakhir</span>
            <span className="stat-value" style={{ fontSize: 16 }}>
              {last ? `${last.left} + ${last.right} → ${last.merged} (${last.count}×)` : '—'}
            </span>
          </div>
        </div>
        <p className="card-sub" style={{ marginTop: 8 }}>
          Makin banyak penggabungan, kamus makin besar dan teks makin sedikit tokennya. Itulah tarik-menarik dari bagian 2.
          {available < MAX_MERGES && ` BPE berhenti setelah ${available} langkah karena tidak ada lagi pasangan yang muncul lebih dari sekali.`}
        </p>

        <div className="row-label">Urutan penggabungan yang dipelajari</div>
        <div className="chip-row">
          {now.merges.length ? (
            now.merges.map((m, i) => (
              <span key={i} className="merge-chip">
                <span className="muted-text">{i + 1}.</span> {m.left}+{m.right}
              </span>
            ))
          ) : (
            <span className="muted-text">Belum ada. Geser slider ke kanan.</span>
          )}
        </div>

        <div className="row-label">Setiap kata di korpus sekarang dipotong menjadi</div>
        <div className="bpe-words">
          {words.map((w) => (
            <div key={w.word} className="bpe-word">
              <PieceChips pieces={w.pieces} />
              <span className="muted-text">×{w.count}</span>
            </div>
          ))}
        </div>

        <div className="row-label">Coba kata yang tidak ada di korpus</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            className="text-input"
            style={{ maxWidth: 220 }}
            value={probe}
            onChange={(e) => setProbe(e.target.value.replace(/\s+/g, ''))}
            aria-label="Kata baru"
          />
          <PieceChips pieces={applyBpe(probe, now.merges)} />
        </div>
        <p className="card-sub" style={{ marginTop: 8, marginBottom: 0 }}>
          Kata baru dipotong dengan memutar ulang daftar penggabungan di atas, sesuai urutannya.
        </p>
      </div>
      <div className="prose" style={{ marginTop: 16 }}>
        <p>
          Dengan korpus bawaan, BPE menemukan sendiri potongan seperti “makan”, “minum”, “di”, dan akhiran “an”, tanpa
          diajari tata bahasa. Tetapi potongannya tidak selalu sesuai imbuhan. Pada 10 penggabungan, “minuman” dipotong
          menjadi “minu”, “ma”, “n”, bukan “minum” + “an”. BPE hanya menghitung seberapa sering, bukan apa artinya.
        </p>
      </div>
      <Deep title="Untuk yang penasaran: BPE di tokenizer sungguhan">
        <p>
          Tokenizer GPT-2 tidak mulai dari huruf, tetapi dari <strong>256 nilai byte</strong>. Karena semua teks, termasuk
          emoji dan aksara non-Latin, pasti tersusun dari byte, tidak ada lagi token <code>[UNK]</code>. Kamus GPT-2
          berisi 50257 token: 256 byte dasar, 50000 hasil penggabungan, dan 1 token spesial.
        </p>
        <p>
          Sebelum BPE berjalan, teks juga dipotong kasar dulu dengan aturan (regex) agar penggabungan tidak melintasi
          batas kata, angka, dan tanda baca. Spasi ditempelkan di depan kata, sehingga “ kucing” (dengan spasi) dan
          “kucing” (tanpa spasi) adalah token yang berbeda.
        </p>
      </Deep>
      <Takeaway>
        BPE membangun kamus dari bawah: gabungkan pasangan yang paling sering muncul, lalu ulangi. Potongan yang sering
        dipakai akhirnya menjadi token sendiri.
      </Takeaway>
    </section>
  )
}
