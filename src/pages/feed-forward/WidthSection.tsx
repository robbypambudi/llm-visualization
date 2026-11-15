import { useState } from 'react'
import { Segmented } from '../../components/Controls'
import { Deep, Takeaway } from '../../components/Prose'
import { Tex } from '../../components/Tex'
import type { ChartTheme } from '../../lib/theme'
import { fmtCount } from '../token-embedding/format'

interface ModelShape {
  name: string
  d: number
  hidden: number
  /** Weight matrices in the MLP: 2 for ReLU/GELU, 3 for SwiGLU. */
  mlpMats: number
  /** Width of K and V projections (fewer KV heads in grouped-query attention). */
  kvWidth: number
  layers: number
}

const MODELS: ModelShape[] = [
  { name: 'GPT-2 small', d: 768, hidden: 3072, mlpMats: 2, kvWidth: 768, layers: 12 },
  // LLaMA 3 8B: 32 query heads and 8 key-value heads of size 128 → K and V project to 8 × 128 = 1024.
  { name: 'LLaMA 3 8B', d: 4096, hidden: 14336, mlpMats: 3, kvWidth: 1024, layers: 32 },
]

/** Weight counts of one block, matrices only (biases and norm gains are tiny and left out). */
function blockWeights(m: ModelShape) {
  const attn = 2 * m.d * m.d + 2 * m.d * m.kvWidth
  const mlp = m.mlpMats * m.d * m.hidden
  return { attn, mlp, share: mlp / (attn + mlp) }
}

export function WidthSection({ theme }: { theme: ChartTheme }) {
  const [which, setWhich] = useState(0)
  const m = MODELS[which]
  const rows = [
    { label: `masuk: ${m.d}`, n: m.d },
    { label: `lapisan tengah: ${m.hidden}`, n: m.hidden },
    { label: `keluar: ${m.d}`, n: m.d },
  ]

  return (
    <section className="section" id="width">
      <h2>
        <span className="section-num">4</span>Melebar lalu menyempit
      </h2>
      <div className="prose">
        <p>
          MLP punya bentuk yang khas: vektor <strong>dilebarkan</strong> dulu, lalu <strong>disempitkan</strong> kembali ke
          ukuran semula. Di GPT-2, vektor berisi 768 angka dilebarkan menjadi 3072 angka (empat kali lipat), diberi
          aktivasi, lalu diringkas lagi menjadi 768.
        </p>
      </div>
      <div className="card">
        <div className="segmented-wrap">
          <Segmented ariaLabel="Pilih model" value={which} options={MODELS.map((mm, i) => ({ value: i, label: mm.name }))} onChange={setWhich} />
        </div>
        <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
          {rows.map((r) => (
            <div key={r.label}>
              <div className="row-label" style={{ marginTop: 0 }}>
                {r.label}
              </div>
              <div
                style={{
                  height: 18,
                  width: `${(r.n / m.hidden) * 100}%`,
                  minWidth: 8,
                  borderRadius: 4,
                  background: theme.series[r.n === m.hidden ? 2 : 0],
                }}
                aria-hidden
              />
            </div>
          ))}
        </div>
        <p className="card-sub" style={{ marginTop: 12, marginBottom: 0 }}>
          Panjang batang sebanding dengan jumlah angka. {m.mlpMats === 3 ? 'LLaMA 3 memakai SwiGLU, jadi ada dua cabang selebar 14336 yang dikalikan menjadi satu sebelum diringkas.' : 'Aktivasi GELU dikenakan di lapisan tengah.'}
        </p>
      </div>
      <div className="prose" style={{ marginTop: 16 }}>
        <p>
          Kenapa dilebarkan? Bayangkan setiap angka di lapisan tengah sebagai satu <strong>pendeteksi</strong>. Setiap
          pendeteksi mencari satu pola tertentu di vektor token. Makin lebar lapisan tengahnya, makin banyak pola yang bisa
          dicari sekaligus. Setelah itu, hasil semua pendeteksi diringkas kembali ke ukuran semula supaya bisa ditambahkan
          ke jalur residual.
        </p>
        <p>
          Penelitian Geva dkk. (2021) memberi cara pandang yang menarik: lapisan feed-forward bekerja seperti{' '}
          <strong>memori kunci–nilai</strong>. Matriks pertama berisi “kunci”, yaitu pola yang dicari. Matriks kedua berisi
          “nilai”, yaitu apa yang ditulis kalau pola itu ditemukan. Mereka menemukan bahwa pola-pola ini sering bisa
          dipahami manusia: di lapisan bawah polanya dangkal, sedangkan di lapisan atas lebih bermakna. Hasil akhir MLP
          adalah gabungan dari banyak memori yang aktif sekaligus.
        </p>
        <p>
          Contoh karangan untuk membayangkannya (bukan temuan dari paper): sebuah pendeteksi aktif saat teks membicarakan
          ibu kota negara, lalu nilainya mendorong vektor ke arah nama-nama kota.
        </p>
      </div>

      <div className="prose" style={{ marginTop: 8 }}>
        <p>
          Semua pendeteksi itu butuh bobot, dan jumlahnya besar. Di setiap blok, MLP memegang sebagian besar bobot:
        </p>
      </div>
      <div className="table-scroll">
        <table className="table">
          <thead>
            <tr>
              <th>Model</th>
              <th>Bobot attention per blok</th>
              <th>Bobot MLP per blok</th>
              <th>Porsi MLP</th>
            </tr>
          </thead>
          <tbody>
            {MODELS.map((mm) => {
              const w = blockWeights(mm)
              return (
                <tr key={mm.name}>
                  <td>{mm.name}</td>
                  <td className="mono">{fmtCount(w.attn)}</td>
                  <td className="mono">{fmtCount(w.mlp)}</td>
                  <td>
                    <span className="w-cell">
                      <span className="w-value">{(w.share * 100).toFixed(1)}%</span>
                      <span className="w-track" aria-hidden>
                        <span className="w-fill" style={{ width: `${w.share * 100}%` }} />
                      </span>
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="card-sub" style={{ marginTop: 8 }}>
        Dihitung dari ukuran matriks saja (bias dan LayerNorm diabaikan karena sangat kecil). Sebagai cek: LLaMA 3 8B punya
        32 blok × {fmtCount(blockWeights(MODELS[1]).attn + blockWeights(MODELS[1]).mlp)} ≈{' '}
        {fmtCount(32 * (blockWeights(MODELS[1]).attn + blockWeights(MODELS[1]).mlp))} bobot. Ditambah tabel embedding input
        dan output (masing-masing 128256 × 4096), totalnya mendekati 8 miliar, sesuai nama modelnya.
      </p>
      <Deep title="Untuk yang penasaran: MLP sebagai kumpulan memori">
        <p>
          Tulis matriks pertama sebagai kumpulan kolom <Tex>{`k_i`}</Tex> (kunci) dan matriks kedua sebagai kumpulan baris{' '}
          <Tex>{`v_i`}</Tex> (nilai). Tanpa bias, MLP bisa ditulis ulang sebagai penjumlahan:
        </p>
        <Tex block>{`\\text{MLP}(x) = \\sum_{i=1}^{d_{ff}} f(x \\cdot k_i)\\; v_i`}</Tex>
        <p>
          <Tex>{`x \\cdot k_i`}</Tex> mengukur seberapa cocok token dengan pola ke-<Tex>{`i`}</Tex>. Aktivasi{' '}
          <Tex>{`f`}</Tex> mengubahnya menjadi “seberapa kuat pendeteksi ini menyala”. Lalu setiap nilai{' '}
          <Tex>{`v_i`}</Tex> ditambahkan sebanyak kekuatan nyala itu. Bentuknya mirip attention, tetapi kuncinya tetap
          (bagian dari bobot), bukan berasal dari token lain.
        </p>
        <p>
          Hitungan bobot per blok di tabel: attention punya matriks Q, K, V, dan O. Di GPT-2 keempatnya berukuran{' '}
          <Tex>{`768 \\times 768`}</Tex>. Di LLaMA 3 8B, K dan V lebih kecil (<Tex>{`4096 \\times 1024`}</Tex>) karena
          memakai 8 kepala kunci–nilai untuk 32 kepala query. MLP GPT-2 punya 2 matriks berukuran{' '}
          <Tex>{`768 \\times 3072`}</Tex>; MLP LLaMA 3 punya 3 matriks berukuran <Tex>{`4096 \\times 14336`}</Tex>.
        </p>
      </Deep>
      <Takeaway>MLP melebarkan vektor agar banyak pola bisa dideteksi sekaligus, lalu meringkasnya kembali. Di sinilah sebagian besar bobot model berada.</Takeaway>
    </section>
  )
}
