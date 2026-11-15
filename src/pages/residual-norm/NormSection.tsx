import { useState } from 'react'
import { Field, Segmented, Slider } from '../../components/Controls'
import { Deep, Takeaway } from '../../components/Prose'
import { Tex } from '../../components/Tex'
import type { ChartTheme } from '../../lib/theme'
import { layerNorm, mean, rms, rmsNorm, variance } from '../../lib/transformer'
import { fmt } from '../positional-encoding/state'
import { Bars } from './Bars'

/** One token's vector (8 features), made up for the demo. */
const BASE = [1.2, -0.4, 2.5, 0.3, -1.1, 0.8, 1.9, -0.2]
const IN_MAX = 12
const OUT_MAX = 3

type Mode = 'layer' | 'rms'

export function NormSection({ theme }: { theme: ChartTheme }) {
  const [shift, setShift] = useState(0)
  const [scale, setScale] = useState(1)
  const [mode, setMode] = useState<Mode>('layer')

  const input = BASE.map((v) => v * scale + shift)
  const output = mode === 'layer' ? layerNorm(input) : rmsNorm(input)
  const reference = mode === 'layer' ? layerNorm(BASE) : rmsNorm(BASE)
  const maxChange = Math.max(...output.map((v, i) => Math.abs(v - reference[i])))
  const unchanged = maxChange < 0.01

  const std = (x: number[]) => Math.sqrt(variance(x))

  return (
    <section className="section" id="layernorm">
      <h2>
        <span className="section-num">3</span>Menjaga angka tetap wajar: LayerNorm
      </h2>
      <div className="prose">
        <p>
          Bagian sebelumnya meninggalkan satu masalah: di jalur residual, angka-angka bisa makin besar atau bergeser
          jauh dari nol. Padahal banyak bagian model peka terhadap besar angka. Softmax di attention, misalnya, menjadi
          terlalu “yakin” kalau skornya besar (lihat pembahasan pembagian dengan √d di bab{' '}
          <a href="#/self-attention">Self-Attention</a>).
        </p>
        <p>
          Solusinya mirip cara guru membandingkan nilai ujian. Kalau ujiannya sulit, semua nilai rendah. Yang penting
          bukan angka mentahnya, tetapi <strong>siapa di atas rata-rata dan siapa di bawah</strong>. Atau seperti tombol
          volume otomatis: lagu yang direkam pelan maupun keras diputar pada volume yang nyaman, dan melodinya tetap sama.
        </p>
        <p>
          <strong>LayerNorm</strong> (Ba dkk., 2016) melakukan hal itu untuk setiap token: ambil semua angka di vektor
          token itu, kurangi dengan rata-ratanya, lalu bagi dengan simpangan bakunya. Hasilnya selalu berpusat di nol dan
          punya sebaran 1. Pola naik-turunnya tetap, tetapi “volume” dan “geseran”-nya dibuang.
        </p>
        <p>
          Coba geser dan perbesar vektor di bawah. Perhatikan bahwa hasil LayerNorm tidak berubah sedikit pun.
        </p>
      </div>
      <div className="card">
        <div className="controls">
          <Slider label="geser (+c)" value={shift} min={-4} max={4} step={0.5} onChange={setShift} format={(v) => (v > 0 ? `+${v}` : String(v))} />
          <Slider label="perbesar (×k)" value={scale} min={0.25} max={3} step={0.25} onChange={setScale} format={(v) => `×${v}`} />
          <Field label="jenis normalisasi">
            <Segmented
              ariaLabel="jenis normalisasi"
              value={mode}
              options={[
                { value: 'layer', label: 'LayerNorm' },
                { value: 'rms', label: 'RMSNorm' },
              ]}
              onChange={setMode}
            />
          </Field>
        </div>
        <div className="grid-2" style={{ marginTop: 16 }}>
          <div>
            <div className="card-title">Masuk: vektor satu token (8 angka)</div>
            <Bars
              values={input}
              vmax={IN_MAX}
              color={theme.series[1]}
              ariaLabel="Angka-angka vektor sebelum normalisasi"
              tooltip={(i) => (
                <div className="tt-row">
                  <span className="muted">angka ke-{i + 1}</span>
                  <strong className="mono">{fmt(input[i], 2)}</strong>
                </div>
              )}
            />
            <div className="stat-row" style={{ marginTop: 4 }}>
              <div className="stat">
                <span className="stat-label">rata-rata</span>
                <span className="stat-value">{fmt(mean(input), 2)}</span>
              </div>
              <div className="stat">
                <span className="stat-label">{mode === 'layer' ? 'simpangan baku' : 'RMS'}</span>
                <span className="stat-value">{fmt(mode === 'layer' ? std(input) : rms(input), 2)}</span>
              </div>
            </div>
          </div>
          <div>
            <div className="card-title">Keluar: setelah {mode === 'layer' ? 'LayerNorm' : 'RMSNorm'}</div>
            <Bars
              values={output}
              vmax={OUT_MAX}
              color={theme.series[0]}
              ariaLabel="Angka-angka vektor setelah normalisasi"
              tooltip={(i) => (
                <>
                  <div className="tt-row">
                    <span className="muted">angka ke-{i + 1}</span>
                    <strong className="mono">{fmt(output[i], 3)}</strong>
                  </div>
                  <div className="tt-row">
                    <span className="muted">sebelumnya</span>
                    <span className="mono">{fmt(input[i], 2)}</span>
                  </div>
                </>
              )}
            />
            <div className="stat-row" style={{ marginTop: 4 }}>
              <div className="stat">
                <span className="stat-label">rata-rata</span>
                <span className="stat-value">{fmt(mean(output), 2)}</span>
              </div>
              <div className="stat">
                <span className="stat-label">{mode === 'layer' ? 'simpangan baku' : 'RMS'}</span>
                <span className="stat-value">{fmt(mode === 'layer' ? std(output) : rms(output), 2)}</span>
              </div>
            </div>
          </div>
        </div>
        <p className="card-sub" style={{ marginTop: 12, marginBottom: 0 }}>
          {unchanged
            ? 'Hasilnya sama dengan vektor asli (tanpa geser dan tanpa perbesar).'
            : `Hasilnya berbeda dari vektor asli: selisih terbesar ${fmt(maxChange, 2)}.`}{' '}
          Skala sumbu kiri dan kanan berbeda: masukan ±{IN_MAX}, keluaran ±{OUT_MAX}.
        </p>
      </div>
      <div className="prose" style={{ marginTop: 16 }}>
        <p>
          Ada dua hal penting lainnya. Pertama, LayerNorm dihitung <strong>per token</strong>, hanya dari angka milik token
          itu sendiri. Ia tidak bergantung pada token lain atau kalimat lain, sehingga bekerja sama persis saat
          pelatihan maupun saat dipakai.
        </p>
        <p>
          Kedua, setelah dinormalkan, setiap angka diberi dua kenop yang ikut dipelajari: <strong>γ</strong> (pengali)
          dan <strong>β</strong> (penggeser). Kenapa? Supaya normalisasi tidak memaksa. Kalau model memang butuh angka
          tertentu lebih besar atau bergeser, ia bisa mengaturnya sendiri. Di GPT-2, γ dimulai dari 1 dan β dari 0,
          jadi di awal pelatihan LayerNorm hanya menormalkan.
        </p>
        <p>
          Sekarang pilih <strong>RMSNorm</strong> lalu geser vektornya. Hasilnya berubah. RMSNorm (Zhang &amp; Sennrich,
          2019) adalah versi yang lebih sederhana: ia <em>tidak</em> mengurangi rata-rata, hanya membagi dengan akar
          rata-rata kuadrat (RMS), dan hanya punya γ. Jadi ia tetap kebal terhadap perbesaran, tetapi tidak terhadap
          pergeseran. Menurut paper-nya, hasilnya setara dengan LayerNorm, tetapi waktu komputasinya turun 7% sampai 64%
          di berbagai model. LLaMA memakai RMSNorm.
        </p>
      </div>
      <Deep title="Untuk yang penasaran: rumus LayerNorm dan RMSNorm">
        <p>
          Untuk vektor <Tex>{`x`}</Tex> berisi <Tex>{`d`}</Tex> angka, dengan rata-rata <Tex>{`\\mu`}</Tex> dan variansi{' '}
          <Tex>{`\\sigma^2`}</Tex>:
        </p>
        <Tex block>{`\\mathrm{LayerNorm}(x)_i = \\gamma_i \\, \\frac{x_i - \\mu}{\\sqrt{\\sigma^2 + \\varepsilon}} + \\beta_i, \\qquad \\mu = \\frac{1}{d}\\sum_j x_j, \\quad \\sigma^2 = \\frac{1}{d}\\sum_j (x_j - \\mu)^2`}</Tex>
        <Tex block>{`\\mathrm{RMSNorm}(x)_i = \\gamma_i \\, \\frac{x_i}{\\sqrt{\\frac{1}{d}\\sum_j x_j^2 + \\varepsilon}}`}</Tex>
        <p>
          <Tex>{`\\varepsilon`}</Tex> adalah angka kecil supaya tidak membagi dengan nol. GPT-2 memakai{' '}
          <Tex>{`\\varepsilon = 10^{-5}`}</Tex>, dan konfigurasi LLaMA 3 8B juga mencantumkan{' '}
          <code>rms_norm_eps</code> sebesar <Tex>{`10^{-5}`}</Tex>.
        </p>
        <p>
          Kenapa hasil LayerNorm tidak berubah? Kalau setiap angka dikali <Tex>{`k > 0`}</Tex> lalu ditambah{' '}
          <Tex>{`c`}</Tex>, rata-ratanya menjadi <Tex>{`k\\mu + c`}</Tex> dan simpangan bakunya <Tex>{`k\\sigma`}</Tex>.
          Pengurangan menghapus <Tex>{`c`}</Tex>, pembagian menghapus <Tex>{`k`}</Tex> (selama{' '}
          <Tex>{`\\varepsilon`}</Tex> jauh lebih kecil dari variansinya).
        </p>
      </Deep>
      <Takeaway>
        LayerNorm membuang “volume” dan “geseran” sebuah vektor, tetapi menyimpan polanya. Dengan begitu, lapisan
        berikutnya selalu menerima angka dalam skala yang nyaman.
      </Takeaway>
    </section>
  )
}
