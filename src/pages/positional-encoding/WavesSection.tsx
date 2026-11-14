import { useState } from 'react'
import { Slider } from '../../components/Controls'
import { Legend, LineChart, type LineSeries } from '../../components/LineChart'
import { Deep, Takeaway } from '../../components/Prose'
import { Tex } from '../../components/Tex'
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
        <span className="section-num">5</span>Setiap kolom adalah sebuah gelombang
      </h2>
      <div className="prose">
        <p>
          Ambil satu kolom dari tabel warna tadi, lalu gambar nilainya dari posisi ke posisi. Hasilnya sebuah gelombang.
          Kolom-kolom awal gelombangnya rapat (cepat berulang), sedangkan kolom-kolom akhir sangat renggang.
        </p>
        <p>
          <strong>λ</strong> (lambda) di legenda adalah panjang gelombang: berapa langkah posisi yang dibutuhkan untuk
          kembali ke titik awal. Token hanya ada di posisi bulat (titik-titik). Garisnya hanya membantu mata.
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
      <Deep title="Untuk yang penasaran: rumus panjang gelombang">
        <p>
          Panjang gelombang pasangan <Tex>{`i`}</Tex> adalah <Tex>{`\\lambda_i = 2\\pi \\cdot \\text{base}^{2i/d}`}</Tex>.
          Setiap pasangan dikali faktor yang sama dari pasangan sebelumnya, sehingga panjang gelombangnya membentuk deret
          geometri. Dengan base 10000, deret itu berjalan dari <Tex>{`2\\pi`}</Tex> mendekati{' '}
          <Tex>{`10000 \\cdot 2\\pi`}</Tex>.
        </p>
      </Deep>
      <Takeaway>Setiap angka dalam tanda posisi berayun dengan kecepatannya sendiri.</Takeaway>
    </section>
  )
}
