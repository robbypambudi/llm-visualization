import { useMemo } from 'react'
import { ColorBar, Heatmap } from '../../components/Heatmap'
import { LineChart } from '../../components/LineChart'
import { Deep, Takeaway } from '../../components/Prose'
import { Tex } from '../../components/Tex'
import { dot, peDotClosedForm, peMatrix } from '../../lib/positional'
import type { ChartTheme } from '../../lib/theme'
import { fmt, type PeParams } from './state'

interface Props {
  params: PeParams
  setPos: (pos: number) => void
  theme: ChartTheme
}

export function SimilaritySection({ params, setPos, theme }: Props) {
  const { d, seqLen, base, layout, pos } = params
  const half = d / 2

  // Cosine similarity matrix. Every PE vector has ‖PE‖² = d/2, so cos-sim = dot / (d/2).
  const sim = useMemo(() => {
    const pe = peMatrix(seqLen, d, base, layout)
    const out = new Float64Array(seqLen * seqLen)
    for (let p = 0; p < seqLen; p++) {
      const a = pe.subarray(p * d, p * d + d)
      for (let q = p; q < seqLen; q++) {
        const v = dot(a, pe.subarray(q * d, q * d + d)) / half
        out[p * seqLen + q] = v
        out[q * seqLen + p] = v
      }
    }
    return out
  }, [seqLen, d, base, layout, half])

  const maxK = seqLen - 1
  let minSim = 0
  for (let k = 0; k <= maxK; k++) minSim = Math.min(minSim, sim[k])
  const yMin = Math.floor((minSim - 0.05) * 10) / 10

  return (
    <section className="section" id="similarity">
      <h2>
        <span className="section-num">7</span>Kemiripan dua posisi hanya ditentukan oleh jaraknya
      </h2>
      <div className="prose">
        <p>
          Seberapa mirip tanda posisi 10 dengan posisi 11? Dengan posisi 50? Ternyata kemiripannya{' '}
          <strong>hanya ditentukan oleh jaraknya</strong>. Pasangan posisi (10, 13) sama miripnya dengan (70, 73), karena
          jaraknya sama-sama 3.
        </p>
        <p>
          Kenapa ini bagus? Konsep seperti “tiga kata sebelumnya” jadi berlaku sama di awal maupun di akhir kalimat.
          Makin jauh jaraknya, makin tidak mirip. Namun turunnya tidak mulus, ada sedikit naik-turun (riak).
        </p>
        <p>
          Gambar kiri: warna setiap sel adalah kemiripan posisi p dan q (1 = sama persis). Perhatikan garis-garis miringnya.
          Di sepanjang setiap garis miring, warnanya sama, karena jaraknya sama. Gambar kanan: kemiripan terhadap jarak.
        </p>
      </div>
      <div className="grid-2">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div className="card-title">Kemiripan setiap pasangan posisi</div>
            <ColorBar scale={theme.diverging} min="−1" max="+1" />
          </div>
          <div className="card-sub">Cosine similarity, dari −1 sampai 1. Klik sel untuk memilih posisi p.</div>
          <Heatmap
            data={sim}
            rows={seqLen}
            cols={seqLen}
            vmax={1}
            scale={theme.diverging}
            height={320}
            xLabel="posisi q →"
            yLabel="← posisi p"
            selectedRow={pos}
            onCellClick={(row) => setPos(row)}
            ariaLabel="Heatmap cosine similarity antar vektor positional encoding"
            tooltip={(p, q) => (
              <>
                <div className="tt-row">
                  <span className="muted">p, q (jarak)</span>
                  <span className="mono">
                    {p}, {q} ({q - p})
                  </span>
                </div>
                <div className="tt-row">
                  <span className="muted">cos-sim</span>
                  <strong className="mono">{fmt(sim[p * seqLen + q])}</strong>
                </div>
              </>
            )}
          />
        </div>
        <div className="card">
          <div className="card-title">Kemiripan terhadap jarak k</div>
          <div className="card-sub">Kurvanya sama dari posisi awal mana pun. Arahkan kursor untuk mencocokkan dengan posisi terpilih.</div>
          <LineChart
            series={[
              {
                name: 'cos-sim',
                color: theme.series[0],
                fn: (k) => peDotClosedForm(k, d, base) / half,
              },
            ]}
            xDomain={[0, maxK]}
            yDomain={[Math.min(-0.1, yMin), 1.05]}
            yTicks={[0, 0.5, 1]}
            height={300}
            xLabel="jarak k = |p − q|"
            ariaLabel="Cosine similarity positional encoding sebagai fungsi jarak"
            tooltipExtra={(k) =>
              pos + k < seqLen ? (
                <div className="tt-row">
                  <span className="muted">
                    langsung: PE({pos})·PE({pos + k})/(d/2)
                  </span>
                  <span className="mono">{fmt(sim[pos * seqLen + pos + k])}</span>
                </div>
              ) : null
            }
          />
        </div>
      </div>
      <Deep title="Untuk yang penasaran: kenapa hanya jarak yang berpengaruh">
        <p>
          Kemiripan diukur dengan <em>cosine similarity</em>: perkalian titik dua vektor dibagi panjang keduanya. Karena{' '}
          <Tex>{`\\sin a \\sin b + \\cos a \\cos b = \\cos(a-b)`}</Tex>, setiap pasangan sin/cos menyumbang nilai
          yang hanya bergantung pada selisih posisi:
        </p>
        <Tex block>{`PE_{p}\\cdot PE_{q} \\;=\\; \\sum_{i=0}^{d/2-1} \\cos\\big((p-q)\\,\\omega_i\\big), \\qquad \\lVert PE_p \\rVert^2 = \\tfrac{d}{2}`}</Tex>
        <p>
          Matriks yang nilainya sama di sepanjang setiap diagonal disebut matriks Toeplitz. Satu catatan penting: ini
          kemiripan tanda posisi saja. Di dalam model, tanda posisi dijumlahkan ke embedding lalu dikalikan dengan matriks{' '}
          <Tex>{`W_Q, W_K`}</Tex>, jadi skor attention yang sebenarnya tidak sesederhana ini.
        </p>
      </Deep>
      <Takeaway>Yang dikenali dari tanda posisi bukan hanya “di mana”, tetapi juga “seberapa jauh”.</Takeaway>
    </section>
  )
}
