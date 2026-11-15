import { useState } from 'react'
import { Segmented } from '../../components/Controls'
import { Deep, Takeaway } from '../../components/Prose'
import { Tex } from '../../components/Tex'

const D_MODEL = 768
const SEQ = 1024
const H_CHOICES = [1, 2, 4, 6, 8, 12, 16]

const fmtInt = (v: number) => v.toLocaleString('id-ID')

export function SplitSection() {
  const [h, setH] = useState(12)
  const dHead = D_MODEL / h
  const params = 4 * D_MODEL * D_MODEL
  const scoreMults = SEQ * SEQ * dHead * h

  return (
    <section className="section" id="split">
      <h2>
        <span className="section-num">2</span>Membelah vektor menjadi beberapa kepala
      </h2>
      <div className="prose">
        <p>
          Kalau setiap kepala memakai vektor sepanjang aslinya, delapan kepala berarti delapan kali lipat biaya. Paper
          Transformer memakai cara yang lebih hemat: <strong>panjang vektor dibagi rata</strong> ke semua kepala.
          GPT-2 small punya vektor 768 angka dan 12 kepala, jadi setiap kepala bekerja dengan 64 angka. Paper aslinya
          memakai 512 angka dan 8 kepala, juga 64 angka per kepala.
        </p>
        <p>Urutan kerjanya:</p>
        <ol>
          <li>Vektor setiap token diubah menjadi kueri, kunci, dan nilai, masing-masing 768 angka.</li>
          <li>Ketiganya dipotong menjadi beberapa bagian, satu bagian untuk setiap kepala.</li>
          <li>Setiap kepala menjalankan attention sendiri, dengan bagiannya sendiri.</li>
          <li>Hasil semua kepala disambung kembali menjadi 768 angka.</li>
          <li>
            Satu perkalian matriks terakhir (<Tex>{`W^O`}</Tex>) mencampur hasil semua kepala sebelum dikirim kembali ke
            jalur residual.
          </li>
        </ol>
        <p>Pilih jumlah kepala dan lihat apa yang berubah.</p>
      </div>
      <div className="card">
        <div className="segmented-wrap">
          <Segmented
            ariaLabel="Jumlah kepala"
            value={h}
            options={H_CHOICES.map((v) => ({ value: v, label: `${v} kepala` }))}
            onChange={setH}
          />
        </div>
        <div className="row-label" style={{ marginTop: 14 }}>
          Vektor 768 angka, dibagi ke {h} kepala
        </div>
        <div className="strip" style={{ height: 34 }} role="img" aria-label={`768 angka dibagi menjadi ${h} bagian`}>
          {Array.from({ length: h }, (_, i) => (
            <span
              key={i}
              title={`kepala ${i + 1}: angka ke-${i * dHead} sampai ${(i + 1) * dHead - 1}`}
              style={{
                background: `color-mix(in srgb, var(--accent) ${i % 2 ? 30 : 60}%, var(--surface-2))`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                color: 'var(--text-primary)',
                overflow: 'hidden',
              }}
            >
              {h <= 8 ? `kepala ${i + 1}` : i + 1}
            </span>
          ))}
        </div>
        <div className="stat-row" style={{ marginTop: 14 }}>
          <div className="stat">
            <span className="stat-label">angka per kepala</span>
            <span className="stat-value">{dHead}</span>
          </div>
          <div className="stat">
            <span className="stat-label">pola perhatian per lapisan</span>
            <span className="stat-value">{h}</span>
          </div>
          <div className="stat">
            <span className="stat-label">bobot W_Q, W_K, W_V, W_O</span>
            <span className="stat-value">{fmtInt(params)}</span>
          </div>
          <div className="stat">
            <span className="stat-label">perkalian untuk skor, {SEQ} token</span>
            <span className="stat-value">{fmtInt(scoreMults)}</span>
          </div>
        </div>
        <p className="card-sub" style={{ marginTop: 12, marginBottom: 0 }}>
          Perhatikan dua angka terakhir: tidak berubah, berapa pun jumlah kepalanya. Kepala lebih banyak berarti lebih
          banyak sudut pandang, tetapi setiap kepala bekerja dengan vektor yang lebih pendek. Bobot dihitung tanpa bias.
        </p>
      </div>
      <div className="prose" style={{ marginTop: 16 }}>
        <p>
          Inilah kenapa paper Transformer menyebut biaya total multi-head kira-kira sama dengan satu kepala yang memakai
          vektor penuh. Jumlah “kerja”-nya tetap, hanya dibagi ke beberapa pekerja. Yang dikorbankan: setiap kepala
          melihat dunia lewat jendela yang lebih sempit (64 angka, bukan 768). Ternyata itu sepadan, karena satu kepala
          memang tidak perlu tahu segalanya.
        </p>
        <p>
          Lalu kenapa perlu <Tex>{`W^O`}</Tex> di akhir? Hasil setiap kepala masih berada di “laci”-nya sendiri.{' '}
          <Tex>{`W^O`}</Tex> memberi kesempatan untuk menggabungkan temuan semua kepala, misalnya “si pengejar” dari
          kepala A dan “yang dikejar” dari kepala B, menjadi satu catatan yang ditulis ke jalur residual.
        </p>
      </div>
      <Deep title="Untuk yang penasaran: rumus multi-head">
        <Tex block>{`\\text{head}_i = \\text{Attention}(X W_i^Q,\\; X W_i^K,\\; X W_i^V)`}</Tex>
        <Tex block>{`\\text{MultiHead}(X) = \\text{Concat}(\\text{head}_1, \\dots, \\text{head}_h)\\, W^O`}</Tex>
        <p>
          Setiap <Tex>{`W_i^Q, W_i^K, W_i^V`}</Tex> berukuran <Tex>{`d_{model} \\times d_{model}/h`}</Tex>, dan{' '}
          <Tex>{`W^O`}</Tex> berukuran <Tex>{`d_{model} \\times d_{model}`}</Tex>. Jadi jumlah bobotnya{' '}
          <Tex>{`4 d_{model}^2`}</Tex>, tidak bergantung pada <Tex>{`h`}</Tex>.
        </p>
        <p>
          Kode asli GPT-2 tidak membuat matriks terpisah untuk setiap kepala. Ia memakai satu perkalian besar (
          <code>c_attn</code>) yang menghasilkan kueri, kunci, dan nilai sekaligus (3 × 768 angka), lalu memotongnya
          per kepala dengan fungsi <code>split_heads</code>. Hasilnya sama, hanya lebih cepat dijalankan.
        </p>
      </Deep>
      <Takeaway>
        Multi-head tidak menambah biaya. Vektor yang sama dibagi menjadi beberapa bagian, dan setiap bagian punya
        attention-nya sendiri.
      </Takeaway>
    </section>
  )
}
