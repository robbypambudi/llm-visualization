import { useMemo, useState } from 'react'
import { Segmented } from '../../components/Controls'
import { ColorBar, Heatmap } from '../../components/Heatmap'
import { Deep, Takeaway } from '../../components/Prose'
import { Tex } from '../../components/Tex'
import { hashString, randomNormalVector } from '../../lib/positional'
import type { ChartTheme } from '../../lib/theme'
import { fmt } from '../positional-encoding/state'

const VOCAB = ['saya', 'kamu', 'kucing', 'anjing', 'makan', 'tidur', 'ikan', '.']
const D = 6
const VMAX = 2

export function LookupSection({ theme }: { theme: ChartTheme }) {
  const [sel, setSel] = useState(2)
  // Demo values only: one deterministic random row per word, like a freshly initialised table.
  const E = useMemo(() => {
    const out = new Float64Array(VOCAB.length * D)
    VOCAB.forEach((w, r) => out.set(randomNormalVector(D, hashString(w)), r * D))
    return out
  }, [])
  const rowVec = E.subarray(sel * D, sel * D + D)

  return (
    <section className="section" id="lookup">
      <h2>
        <span className="section-num">2</span>Tabel embedding: satu baris untuk setiap token
      </h2>
      <div className="prose">
        <p>
          Semua embedding disimpan dalam satu tabel besar. Jumlah barisnya sama dengan ukuran kamus, dan setiap baris berisi
          vektor untuk satu token. Mengambil embedding sebuah token sangat sederhana: <strong>buka baris ke-ID</strong>.
          Mirip membuka kamus di halaman tertentu.
        </p>
        <p>Pilih sebuah kata. Barisnya akan ditandai, dan isinya menjadi vektor yang dikirim ke tahap berikutnya.</p>
      </div>
      <div className="card">
        <div className="segmented-wrap">
          <Segmented
            ariaLabel="Pilih token"
            value={sel}
            options={VOCAB.map((w, i) => ({ value: i, label: w }))}
            onChange={setSel}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
          <div className="card-title">
            Tabel E: {VOCAB.length} token × {D} angka
          </div>
          <ColorBar scale={theme.diverging} min={`−${VMAX}`} max={`+${VMAX}`} />
        </div>
        <Heatmap
          data={E}
          rows={VOCAB.length}
          cols={D}
          vmax={VMAX}
          scale={theme.diverging}
          height={VOCAB.length * 26}
          xLabel="dimensi →"
          yLabel="ID token"
          rowLabels={VOCAB.map((w, i) => `${i} · ${w}`)}
          selectedRow={sel}
          onCellClick={(r) => setSel(r)}
          ariaLabel="Heatmap tabel embedding"
          tooltip={(r, c) => (
            <>
              <div className="tt-row">
                <span className="muted">token, dimensi</span>
                <span className="mono">
                  “{VOCAB[r]}” (ID {r}), {c}
                </span>
              </div>
              <div className="tt-row">
                <span className="muted">nilai</span>
                <strong className="mono">{fmt(E[r * D + c], 3)}</strong>
              </div>
            </>
          )}
        />
        <div className="row-label">
          Embedding untuk “{VOCAB[sel]}” (ID {sel})
        </div>
        <div className="chip-row">
          {Array.from(rowVec, (v, i) => (
            <span key={i} className="vec-cell" style={{ background: theme.diverging.css(v / VMAX) }}>
              {fmt(v, 2)}
            </span>
          ))}
        </div>
        <p className="card-sub" style={{ marginTop: 12, marginBottom: 0 }}>
          Angkanya acak, seperti tabel yang belum dilatih. Di GPT-2, tabel ini berukuran 50257 × 768 dan diisi angka acak
          kecil (simpangan baku 0.02) sebelum pelatihan dimulai.
        </p>
      </div>
      <Deep title="Untuk yang penasaran: membuka baris = mengalikan dengan one-hot">
        <p>
          Mengalikan vektor one-hot dengan tabel <Tex>{`E`}</Tex> menghasilkan tepat satu baris, karena semua baris lain
          dikalikan dengan nol:
        </p>
        <Tex block>{`\\underbrace{[0,\\,0,\\,1,\\,0,\\,\\dots]}_{\\text{one-hot ID } 2} \\; E \\;=\\; E[2]`}</Tex>
        <p>
          Jadi lapisan embedding sebenarnya adalah perkalian matriks biasa, hanya saja dijalankan dengan cara yang jauh
          lebih hemat: langsung mengambil barisnya. Itu juga sebabnya tabel ini bisa dilatih seperti bobot lainnya.
        </p>
      </Deep>
      <Takeaway>Embedding hanyalah sebuah tabel. ID token menunjuk baris mana yang diambil.</Takeaway>
    </section>
  )
}
