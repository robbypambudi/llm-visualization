import { useState } from 'react'
import { Segmented } from '../../components/Controls'
import { Deep, Takeaway } from '../../components/Prose'
import { Tex } from '../../components/Tex'

// LLaMA 3 8B, from its Hugging Face config.json.
const LAYERS = 32
const Q_HEADS = 32
const HEAD_DIM = 128
const CONTEXT = 8192
const BYTES = 2 // bfloat16

type Variant = 'mha' | 'gqa' | 'mqa'
const KV_HEADS: Record<Variant, number> = { mha: 32, gqa: 8, mqa: 1 }
const LABEL: Record<Variant, string> = {
  mha: 'Multi-head biasa',
  gqa: 'GQA (dipakai LLaMA 3 8B)',
  mqa: 'MQA',
}

function fmtBytes(b: number): string {
  if (b >= 2 ** 30) return `${(b / 2 ** 30).toLocaleString('id-ID', { maximumFractionDigits: 2 })} GiB`
  if (b >= 2 ** 20) return `${(b / 2 ** 20).toLocaleString('id-ID', { maximumFractionDigits: 1 })} MiB`
  return `${(b / 2 ** 10).toLocaleString('id-ID', { maximumFractionDigits: 1 })} KiB`
}

export function GqaSection() {
  const [variant, setVariant] = useState<Variant>('gqa')
  const kv = KV_HEADS[variant]
  const perGroup = Q_HEADS / kv
  const perToken = 2 * LAYERS * kv * HEAD_DIM * BYTES

  return (
    <section className="section" id="gqa">
      <h2>
        <span className="section-num">4</span>Hemat memori: berbagi kunci dan nilai
      </h2>
      <div className="prose">
        <p>
          Saat menulis jawaban, model menghasilkan satu token setiap langkah. Supaya tidak menghitung ulang, kunci dan
          nilai dari semua token sebelumnya disimpan di memori (dibahas di bab <a href="#/kv-cache">KV Cache</a>).
          Dengan multi-head biasa, <strong>setiap kepala menyimpan kunci dan nilainya sendiri</strong>. Untuk teks
          panjang, simpanan ini menjadi sangat besar, dan membacanya di setiap langkah membuat generasi lambat.
        </p>
        <p>
          Shazeer (2019) mengusulkan ide yang berani: semua kepala tetap punya kueri masing-masing, tetapi{' '}
          <strong>berbagi satu set kunci dan nilai</strong>. Namanya multi-query attention (MQA). Memorinya jauh lebih
          kecil, dengan sedikit penurunan kualitas. Ainslie dkk. (2023) lalu mengambil jalan tengah, grouped-query
          attention (GQA): kepala dikelompokkan, dan setiap kelompok berbagi satu set kunci dan nilai. Menurut paper itu,
          kualitas GQA mendekati multi-head biasa dengan kecepatan yang mendekati MQA.
        </p>
        <p>
          Filosofinya: kueri adalah <em>pertanyaan</em>, sedangkan kunci dan nilai adalah <em>katalog dan isi
          perpustakaan</em>. Setiap kepala tetap boleh bertanya dengan caranya sendiri, tetapi beberapa kepala bisa
          berbagi satu katalog.
        </p>
      </div>
      <div className="card">
        <div className="segmented-wrap">
          <Segmented
            ariaLabel="Jenis attention"
            value={variant}
            options={(['mha', 'gqa', 'mqa'] as Variant[]).map((v) => ({ value: v, label: LABEL[v] }))}
            onChange={setVariant}
          />
        </div>
        <div className="row-label" style={{ marginTop: 14 }}>
          {Q_HEADS} kepala kueri (Q) dan {kv} set kunci-nilai (KV): setiap KV dipakai {perGroup} kepala
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }} role="img" aria-label={`${kv} kelompok, masing-masing ${perGroup} kepala kueri`}>
          {Array.from({ length: kv }, (_, g) => (
            <div
              key={g}
              title={`KV ${g + 1} dipakai kepala ${g * perGroup + 1}–${(g + 1) * perGroup}`}
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 3,
                padding: 4,
                border: '1px solid var(--border)',
                borderRadius: 6,
                maxWidth: '100%',
              }}
            >
              <span
                className="mono"
                style={{
                  fontSize: 10.5,
                  padding: '2px 5px',
                  borderRadius: 4,
                  background: 'var(--accent)',
                  color: 'var(--surface-1)',
                }}
              >
                KV
              </span>
              {Array.from({ length: perGroup }, (_, q) => (
                <span
                  key={q}
                  aria-hidden
                  style={{
                    width: 12,
                    height: 18,
                    borderRadius: 3,
                    background: 'color-mix(in srgb, var(--accent) 25%, var(--surface-2))',
                  }}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="stat-row" style={{ marginTop: 14 }}>
          <div className="stat">
            <span className="stat-label">simpanan K &amp; V per token</span>
            <span className="stat-value">{fmtBytes(perToken)}</span>
          </div>
          <div className="stat">
            <span className="stat-label">untuk {CONTEXT.toLocaleString('id-ID')} token</span>
            <span className="stat-value">{fmtBytes(perToken * CONTEXT)}</span>
          </div>
          <div className="stat">
            <span className="stat-label">dibanding multi-head biasa</span>
            <span className="stat-value">{kv === Q_HEADS ? '1×' : `${Q_HEADS / kv}× lebih kecil`}</span>
          </div>
        </div>
        <p className="card-sub" style={{ marginTop: 12, marginBottom: 0 }}>
          Kotak kecil = kepala kueri, kotak “KV” = satu set kunci dan nilai yang dipakai bersama. Angka memori adalah
          hitungan kita sendiri dari konfigurasi LLaMA 3 8B ({LAYERS} lapisan, {Q_HEADS} kepala, {HEAD_DIM} angka per
          kepala, 2 byte per angka), untuk satu teks dan tanpa trik penghematan lain. LLaMA 3 8B aslinya memakai 8 set
          KV.
        </p>
      </div>
      <Deep title="Untuk yang penasaran: rumus hitungannya">
        <Tex block>{`\\text{memori per token} = 2 \\times n_{\\text{lapisan}} \\times n_{\\text{KV}} \\times d_{\\text{kepala}} \\times 2\\ \\text{byte}`}</Tex>
        <p>
          Angka 2 di depan karena ada dua hal yang disimpan: kunci dan nilai. Untuk LLaMA 3 8B dengan 8 set KV:{' '}
          <Tex>{`2 \\times 32 \\times 8 \\times 128 \\times 2 = 131\\,072`}</Tex> byte, yaitu 128 KiB untuk setiap token.
          Jumlah kepala kueri tidak muncul di rumus, karena kueri tidak perlu disimpan: kueri hanya dipakai sekali oleh
          token yang sedang dibuat.
        </p>
      </Deep>
      <Takeaway>
        Kueri boleh banyak, tetapi kunci dan nilai bisa dipakai bersama. Itulah cara model modern menghemat memori saat
        menulis teks panjang.
      </Takeaway>
    </section>
  )
}
