import { useState } from 'react'
import { Slider } from '../../components/Controls'
import { Legend, LineChart, type LineSeries } from '../../components/LineChart'
import { peValue, wavelength } from '../../lib/positional'
import type { ChartTheme } from '../../lib/theme'
import { describeDim, fmtNum, type PeParams } from './state'

interface Props {
  params: PeParams
  theme: ChartTheme
}

export function WavesSection({ params, theme }: Props) {
  const { d, seqLen, base, layout, pos } = params
  const [rawDims, setRawDims] = useState([0, 8, 20])
  const dims = rawDims.map((x) => Math.min(x, d - 1))

  const series: LineSeries[] = dims.map((dim, k) => {
    const { pair, isSin } = describeDim(dim, d, layout)
    return {
      name: `dim ${dim} · ${isSin ? 'sin' : 'cos'} · λ≈${fmtNum(wavelength(pair, d, base))}`,
      color: theme.series[k],
      fn: (x: number) => peValue(x, dim, d, base, layout),
    }
  })

  return (
    <section className="section" id="waves">
      <h2>
        <span className="section-num">4</span>Setiap dimensi adalah sebuah gelombang
      </h2>
      <div className="prose">
        <p>
          Ambil satu kolom dari matriks di atas, lalu plot terhadap posisi: hasilnya sinus atau kosinus dengan panjang
          gelombang <strong>λ<sub>i</sub> = 2π · base<sup>2i/d</sup></strong>. Dengan base 10000 seperti di paper, panjang
          gelombang ini membentuk deret geometri dari 2π sampai 10000·2π. Token hanya berada di posisi bilangan bulat (titik), garis
          kontinu hanya membantu mata.
        </p>
      </div>
      <div className="card">
        <div className="controls" style={{ marginBottom: 16 }}>
          {dims.map((dim, k) => (
            <Slider
              key={k}
              label={
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span className="legend-line" style={{ background: theme.series[k] }} />
                  dimensi {['A', 'B', 'C'][k]}
                </span>
              }
              value={dim}
              min={0}
              max={d - 1}
              onChange={(v) => setRawDims((prev) => prev.map((p, j) => (j === k ? v : p)))}
            />
          ))}
        </div>
        <Legend items={series} />
        <LineChart
          series={series}
          xDomain={[0, Math.min(seqLen - 1, 63)]}
          yDomain={[-1.1, 1.1]}
          yTicks={[-1, -0.5, 0, 0.5, 1]}
          xLabel="posisi"
          integerMarkers
          xMarks={pos <= 63 ? [{ x: pos, label: `pos ${pos}` }] : undefined}
          ariaLabel="Nilai positional encoding untuk tiga dimensi terpilih sebagai fungsi posisi"
        />
        <p className="card-sub" style={{ marginTop: 8, marginBottom: 0 }}>
          Sumbu x dibatasi 64 posisi pertama agar titik per token tetap terbaca.
        </p>
      </div>
    </section>
  )
}
