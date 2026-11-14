import { useMemo } from 'react'
import { ColorBar, Heatmap } from '../../components/Heatmap'
import { Takeaway } from '../../components/Prose'
import { Tex } from '../../components/Tex'
import { frequency, peMatrix, wavelength } from '../../lib/positional'
import type { ChartTheme } from '../../lib/theme'
import { describeDim, fmt, fmtNum, type PeParams } from './state'

interface Props {
  params: PeParams
  setPos: (pos: number) => void
  theme: ChartTheme
}

export function MatrixSection({ params, setPos, theme }: Props) {
  const { d, seqLen, base, layout, pos } = params
  const data = useMemo(() => peMatrix(seqLen, d, base, layout), [seqLen, d, base, layout])

  return (
    <section className="section" id="matrix">
      <h2>
        <span className="section-num">4</span>Semua tanda posisi dalam satu gambar
      </h2>
      <div className="prose">
        <p>
          Sekarang kita hitung tanda posisi dengan rumus tadi, lalu susun semuanya menjadi satu tabel warna. Setiap{' '}
          <strong>baris</strong> adalah tanda untuk satu posisi. Setiap <strong>kolom</strong> adalah satu angka di dalam
          tanda itu. Merah berarti positif, biru negatif.
        </p>
        <p>
          Kolom di kiri warnanya cepat berganti, sedangkan kolom di kanan hampir tidak berubah. Ini pola yang sama dengan
          biner di bagian 2, hanya lebih halus. Arahkan kursor ke sel untuk melihat nilainya, lalu klik untuk memilih posisi.
        </p>
      </div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          <div>
            <div className="card-title">
              PE ∈ ℝ<sup>{seqLen}×{d}</sup>
            </div>
            <div className="card-sub" style={{ margin: 0 }}>
              Baris terpilih: posisi {pos} · layout {layout === 'interleaved' ? 'interleaved (paper)' : 'concatenated'}
            </div>
          </div>
          <ColorBar scale={theme.diverging} min="−1" max="+1" />
        </div>
        <Heatmap
          data={data}
          rows={seqLen}
          cols={d}
          vmax={1}
          scale={theme.diverging}
          height={Math.min(460, Math.max(240, seqLen * 3))}
          xLabel="dimensi (kolom) →"
          yLabel={`← posisi 0 … ${seqLen - 1}`}
          selectedRow={pos}
          onCellClick={(row) => setPos(row)}
          ariaLabel={`Heatmap positional encoding ${seqLen} posisi kali ${d} dimensi`}
          tooltip={(row, col) => {
            const { pair, isSin } = describeDim(col, d, layout)
            const w = frequency(pair, d, base)
            return (
              <>
                <div className="tt-row">
                  <span className="muted">posisi, dimensi</span>
                  <span className="mono">
                    {row}, {col}
                  </span>
                </div>
                <div className="tt-row">
                  <span className="muted">fungsi</span>
                  <span className="mono">
                    {isSin ? 'sin' : 'cos'}(pos·ω<sub>{pair}</sub>)
                  </span>
                </div>
                <div className="tt-row">
                  <span className="muted">
                    ω<sub>{pair}</sub>
                  </span>
                  <span className="mono">{fmtNum(w)}</span>
                </div>
                <div className="tt-row">
                  <span className="muted">panjang gelombang</span>
                  <span className="mono">{fmtNum(wavelength(pair, d, base))}</span>
                </div>
                <div className="tt-row">
                  <span className="muted">nilai</span>
                  <strong className="mono">{fmt(data[row * d + col])}</strong>
                </div>
              </>
            )
          }}
        />
      </div>
      <PositionVector params={params} data={data} />
      <Takeaway>Tidak ada dua baris yang sama, jadi setiap posisi punya tanda yang unik.</Takeaway>
    </section>
  )
}

function PositionVector({ params, data }: { params: PeParams; data: Float64Array }) {
  const { d, base, layout, pos } = params
  const shown = Math.min(d, 8)
  return (
    <div className="card">
      <div className="card-title">Isi tanda posisi {pos} (beberapa angka pertama)</div>
      <div className="card-sub">
        ω (omega) adalah kecepatan putar pasangan itu. Sudut = posisi × ω. Pasangan pertama punya{' '}
        <Tex>{`\\omega_0 = 1`}</Tex>, jadi sudutnya sama dengan posisinya: <Tex>{`${pos}`}</Tex> radian.
      </div>
      <div className="table-scroll">
        <table className="table">
          <thead>
            <tr>
              <th>dimensi</th>
              <th>pasangan i</th>
              <th>fungsi</th>
              <th>ω_i</th>
              <th>sudut pos·ω_i (rad)</th>
              <th>nilai</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: shown }, (_, dim) => {
              const { pair, isSin } = describeDim(dim, d, layout)
              const w = frequency(pair, d, base)
              return (
                <tr key={dim}>
                  <td className="mono">{dim}</td>
                  <td className="mono">{pair}</td>
                  <td className="mono">{isSin ? 'sin' : 'cos'}</td>
                  <td className="mono">{fmtNum(w)}</td>
                  <td className="mono">{fmtNum(pos * w)}</td>
                  <td className="mono">{fmt(data[pos * d + dim])}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
