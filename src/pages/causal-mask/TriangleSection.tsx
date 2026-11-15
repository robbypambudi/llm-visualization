import { useMemo, useState } from 'react'
import { Slider } from '../../components/Controls'
import { Heatmap } from '../../components/Heatmap'
import { Takeaway } from '../../components/Prose'
import { allowedPairs } from '../../lib/causal'
import type { ChartTheme } from '../../lib/theme'

const ALLOWED = -0.75

export function TriangleSection({ theme }: { theme: ChartTheme }) {
  const [n, setN] = useState(8)
  const data = useMemo(() => {
    const out = new Float64Array(n * n)
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) out[i * n + j] = j <= i ? ALLOWED : NaN
    return out
  }, [n])
  const pairs = allowedPairs(n)
  const [sr, sg, sb] = theme.surface2Rgb

  return (
    <section className="section" id="triangle">
      <h2>
        <span className="section-num">4</span>Bentuk segitiga
      </h2>
      <div className="prose">
        <p>
          Kalau semua pasangan yang boleh dilihat digambar, bentuknya selalu sama: sebuah <strong>segitiga</strong>.
          Baris ke-<em>t</em> menunjukkan apa yang boleh dibaca token ke-<em>t</em>: semua token sebelumnya, ditambah
          dirinya sendiri.
        </p>
      </div>
      <div className="card">
        <div className="controls">
          <Slider label="panjang kalimat (n token)" value={n} min={2} max={32} onChange={setN} />
        </div>
        <div className="legend" style={{ margin: '12px 0 8px' }}>
          <span className="legend-item">
            <span className="swatch" style={{ background: theme.diverging.css(ALLOWED) }} />
            boleh dilihat
          </span>
          <span className="legend-item">
            <span className="swatch" style={{ background: `rgb(${sr}, ${sg}, ${sb})`, outline: '1px solid var(--border)' }} />
            tertutup masker
          </span>
        </div>
        <div style={{ maxWidth: 420 }}>
          <Heatmap
            data={data}
            rows={n}
            cols={n}
            vmax={1}
            scale={theme.diverging}
            height={Math.min(360, Math.max(160, n * 18))}
            xLabel="token yang dilihat →"
            yLabel="token yang bertanya"
            nanRgb={theme.surface2Rgb}
            ariaLabel="Pola masker causal berbentuk segitiga"
            tooltip={(r, c) => (
              <>
                <div className="tt-row">
                  <span className="muted">token {r} melihat token {c}</span>
                  <strong>{c <= r ? 'boleh' : 'tidak boleh'}</strong>
                </div>
                <div className="tt-row">
                  <span className="muted">alasan</span>
                  <span>{c < r ? 'masa lalu' : c === r ? 'dirinya sendiri' : 'masa depan'}</span>
                </div>
              </>
            )}
          />
        </div>
        <div className="stat-row">
          <div className="stat">
            <span className="stat-label">pasangan yang boleh</span>
            <span className="stat-value">{pairs}</span>
          </div>
          <div className="stat">
            <span className="stat-label">semua pasangan (n × n)</span>
            <span className="stat-value">{n * n}</span>
          </div>
          <div className="stat">
            <span className="stat-label">porsi yang boleh</span>
            <span className="stat-value">{((pairs / (n * n)) * 100).toFixed(1)}%</span>
          </div>
        </div>
      </div>
      <div className="prose" style={{ marginTop: 16 }}>
        <p>Beberapa hal menarik dari segitiga ini:</p>
        <ul>
          <li>
            <strong>Token pertama hanya melihat dirinya sendiri.</strong> Seluruh anggaran perhatiannya (100%) jatuh ke
            dirinya, jadi hasil attention-nya sama dengan nilai (value) miliknya sendiri. Ia belum punya konteks apa pun.
          </li>
          <li>
            <strong>Token terakhir melihat semuanya.</strong> Makin ke belakang, makin banyak konteks yang tersedia.
            Masuk akal: kalimat memang makin jelas maknanya saat makin panjang.
          </li>
          <li>
            <strong>Diagonal selalu terbuka.</strong> Setiap token boleh melihat dirinya sendiri, jadi tidak ada baris yang
            kosong.
          </li>
          <li>
            <strong>Jumlah pasangannya n(n+1)/2</strong>, sedikit di atas separuh dari n × n. Untuk 1024 token (panjang
            konteks GPT-2), itu 524.800 dari 1.048.576 pasangan.
          </li>
        </ul>
      </div>
      <Takeaway>
        Masker causal berbentuk segitiga: token ke-t membaca masa lalunya dan dirinya sendiri, tidak pernah masa depannya.
      </Takeaway>
    </section>
  )
}
