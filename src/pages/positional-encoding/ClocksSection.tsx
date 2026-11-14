import { useEffect, useState } from 'react'
import { Slider } from '../../components/Controls'
import { frequency, wavelength } from '../../lib/positional'
import { fmtNum, type PeParams } from './state'

interface Props {
  params: PeParams
  setPos: (pos: number) => void
}

const MAX_CLOCKS = 32

/** Pair indices to draw: all of them when few, otherwise evenly spaced incl. first and last. */
function pickPairs(half: number): number[] {
  if (half <= MAX_CLOCKS) return Array.from({ length: half }, (_, i) => i)
  return Array.from({ length: MAX_CLOCKS }, (_, k) => Math.round((k * (half - 1)) / (MAX_CLOCKS - 1)))
}

function Clock({ angle, label, sub }: { angle: number; label: string; sub: string }) {
  const r = 26
  const c = 32
  // 12 o'clock = angle 0, clockwise. Horizontal component = sin, vertical (up) = cos.
  const x = c + r * Math.sin(angle)
  const y = c - r * Math.cos(angle)
  return (
    <figure style={{ margin: 0, textAlign: 'center' }}>
      <svg width={64} height={64} viewBox="0 0 64 64" aria-hidden>
        <circle cx={c} cy={c} r={r} fill="var(--surface-2)" stroke="var(--axis)" />
        <line x1={c} y1={c - r} x2={c} y2={c - r + 4} stroke="var(--text-muted)" />
        <line x1={c} y1={c} x2={x} y2={y} stroke="var(--accent)" strokeWidth={2.5} strokeLinecap="round" />
        <circle cx={c} cy={c} r={2.5} fill="var(--text-primary)" />
      </svg>
      <figcaption style={{ fontSize: 11, lineHeight: 1.3 }}>
        <div className="mono">i={label}</div>
        <div style={{ color: 'var(--text-muted)' }}>{sub}</div>
      </figcaption>
    </figure>
  )
}

export function ClocksSection({ params, setPos }: Props) {
  const { d, seqLen, base, pos } = params
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    if (!playing) return
    const id = window.setInterval(() => setPos((pos + 1) % seqLen), 220)
    return () => window.clearInterval(id)
  }, [playing, pos, seqLen, setPos])

  const pairs = pickPairs(d / 2)

  return (
    <section className="section" id="clocks">
      <h2>
        <span className="section-num">5</span>Analogi jam: setiap pasangan dimensi berputar
      </h2>
      <div className="prose">
        <p>
          Pasangan <code>(sin, cos)</code> pada frekuensi yang sama adalah titik di lingkaran satuan. Saat posisi naik satu,
          jarum pasangan <em>i</em> berputar sebesar ω<sub>i</sub> radian. Jarum di kiri berputar cepat, jarum di kanan
          sangat lambat — mirip digit pada penghitung biner, tetapi kontinu. Kombinasi semua sudut ini memberi setiap
          posisi “sidik jari” yang berbeda.
        </p>
      </div>
      <div className="card">
        <div className="controls" style={{ marginBottom: 16 }}>
          <Slider label="posisi" value={pos} min={0} max={seqLen - 1} onChange={setPos} />
          <button type="button" className="btn" onClick={() => setPlaying((p) => !p)} style={{ flex: 'none' }}>
            {playing ? '❚❚ Jeda' : '▶ Putar'}
          </button>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))',
            gap: '12px 8px',
          }}
        >
          {pairs.map((i) => (
            <Clock
              key={i}
              angle={pos * frequency(i, d, base)}
              label={String(i)}
              sub={`λ ${fmtNum(wavelength(i, d, base))}`}
            />
          ))}
        </div>
        <p className="card-sub" style={{ marginTop: 12, marginBottom: 0 }}>
          Komponen horizontal jarum = sin(pos·ω<sub>i</sub>) (dimensi 2i), komponen vertikal = cos(pos·ω<sub>i</sub>)
          (dimensi 2i+1).
          {d / 2 > MAX_CLOCKS && ` Ditampilkan ${MAX_CLOCKS} dari ${d / 2} pasangan, diambil merata.`}
        </p>
      </div>
    </section>
  )
}
