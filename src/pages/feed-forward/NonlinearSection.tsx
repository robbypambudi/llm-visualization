import { useMemo, useState } from 'react'
import { Segmented, Slider } from '../../components/Controls'
import { Legend, LineChart } from '../../components/LineChart'
import { Deep, Takeaway } from '../../components/Prose'
import { Tex } from '../../components/Tex'
import { fitCurve, type Activation } from '../../lib/mlp'
import type { ChartTheme } from '../../lib/theme'
import { matmul, relu } from '../../lib/transformer'
import { fmt } from '../positional-encoding/state'

// Toy two-layer network: 2 inputs → 3 hidden → 1 output.
const W1 = [
  [1, 2],
  [0, 1],
  [-1, 1],
]
const W2 = [[1, -1, 2]]
const COMBINED = matmul(W2, W1)[0] // [−1, 3]

const LO = -6
const HI = 6
const target = (x: number) => Math.sin(0.9 * x) + 0.1 * x

const ACT_OPTIONS: { value: Activation; label: string }[] = [
  { value: 'relu', label: 'ReLU' },
  { value: 'gelu', label: 'GELU' },
  { value: 'linear', label: 'tanpa aktivasi' },
]

function CollapseDemo() {
  const [x1, setX1] = useState(2)
  const [x2, setX2] = useState(-1)
  const h = W1.map(([a, b]) => a * x1 + b * x2)
  const hRelu = h.map(relu)
  const out = (v: number[]) => v.reduce((s, x, i) => s + x * W2[0][i], 0)
  const yLin = out(h)
  const yRelu = out(hRelu)
  const yOne = COMBINED[0] * x1 + COMBINED[1] * x2

  return (
    <div className="card">
      <div className="controls">
        <Slider label="masukan x₁" value={x1} min={-3} max={3} step={0.5} onChange={setX1} />
        <Slider label="masukan x₂" value={x2} min={-3} max={3} step={0.5} onChange={setX2} />
      </div>
      <div className="table-scroll" style={{ marginTop: 12 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Jalur</th>
              <th>Lapisan tengah</th>
              <th>Hasil</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Dua lapisan, tanpa aktivasi</td>
              <td className="mono">[{h.map((v) => fmt(v, 1)).join(', ')}]</td>
              <td className="mono">{fmt(yLin, 1)}</td>
            </tr>
            <tr>
              <td>Satu matriks gabungan [−1, 3]</td>
              <td className="mono">—</td>
              <td className="mono">{fmt(yOne, 1)}</td>
            </tr>
            <tr>
              <td>Dua lapisan, dengan ReLU</td>
              <td className="mono">[{hRelu.map((v) => fmt(v, 1)).join(', ')}]</td>
              <td className="mono">{fmt(yRelu, 1)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="card-sub" style={{ marginTop: 12, marginBottom: 0 }}>
        Geser kedua masukan. Baris pertama dan kedua <strong>selalu</strong> sama. Baris ketiga berbeda setiap kali ada
        angka negatif di lapisan tengah, karena ReLU mengubahnya menjadi 0.
      </p>
    </div>
  )
}

export function NonlinearSection({ theme }: { theme: ChartTheme }) {
  const [n, setN] = useState(4)
  const [act, setAct] = useState<Activation>('relu')
  const fit = useMemo(() => fitCurve(target, n, act, LO, HI), [n, act])

  return (
    <section className="section" id="nonlinear">
      <h2>
        <span className="section-num">2</span>Kenapa harus ada fungsi non-linear?
      </h2>
      <div className="prose">
        <p>
          MLP di dalam Transformer terdiri dari dua lapisan: vektor dikalikan dengan matriks pertama, lalu dengan matriks
          kedua. Di antara keduanya ada sebuah <strong>fungsi aktivasi</strong>. Kenapa tidak dua perkalian matriks saja?
        </p>
      </div>

      <div className="attempt">
        <div className="attempt-label">Percobaan 1</div>
        <h3>Dua lapisan biasa, tanpa aktivasi</h3>
        <div className="prose">
          <p>
            Ambil jaringan kecil: 2 angka masuk, 3 angka di tengah, 1 angka keluar. Matriks pertama dan kedua bisa digabung
            lebih dulu menjadi satu matriks, yaitu <span className="mono">[−1, 3]</span>. Hasilnya ternyata selalu sama
            dengan dua lapisan tadi. Jadi lapisan kedua <strong>tidak menambah kemampuan apa pun</strong>. Seratus lapisan
            linear pun tetap setara dengan satu lapisan.
          </p>
        </div>
        <CollapseDemo />
      </div>

      <div className="attempt">
        <div className="attempt-label">Percobaan 2</div>
        <h3>Sisipkan aktivasi, lalu tambah neuron</h3>
        <div className="prose">
          <p>
            Sekarang uji kemampuannya. Tugasnya: meniru kurva bergelombang di bawah. Setiap <strong>neuron</strong> di
            lapisan tengah menyumbang satu “tekukan” di titik tertentu. Pilih jumlah neuron dan jenis aktivasinya.
          </p>
        </div>
        <div className="card">
          <div className="controls">
            <Slider label="jumlah neuron" value={n} min={0} max={16} onChange={setN} />
            <div className="segmented-wrap">
              <Segmented ariaLabel="fungsi aktivasi" value={act} options={ACT_OPTIONS} onChange={setAct} />
            </div>
            <div className="stat">
              <span className="stat-label">rata-rata meleset (RMSE)</span>
              <span className="stat-value">{fmt(fit.rmse, 3)}</span>
            </div>
          </div>
          <Legend
            items={[
              { name: 'kurva target', color: theme.series[1], dashed: true },
              { name: 'tiruan MLP', color: theme.series[0] },
            ]}
          />
          <LineChart
            series={[
              { name: 'kurva target', color: theme.series[1], fn: target, dashed: true },
              { name: 'tiruan MLP', color: theme.series[0], fn: fit.predict },
            ]}
            xDomain={[LO, HI]}
            yDomain={[-1.8, 1.8]}
            yTicks={[-1, 0, 1]}
            height={240}
            xLabel="masukan x"
            xMarks={act === 'linear' ? undefined : fit.knots.map((c, i) => ({ x: c, label: String(i + 1) }))}
            formatY={(v) => fmt(v, 2)}
            ariaLabel="Kurva target dan tiruan MLP"
          />
          <p className="card-sub" style={{ marginTop: 12, marginBottom: 0 }}>
            Garis putus-putus vertikal bernomor = letak tekukan tiap neuron. Ini ilustrasi: letak tekukan dibuat rata dan
            hanya bobot keluarnya yang dihitung (dengan metode kuadrat terkecil). MLP sungguhan mempelajari semua bobotnya
            lewat pelatihan.
          </p>
        </div>
        <div className="prose" style={{ marginTop: 16 }}>
          <p>Yang bisa dilihat dari percobaan ini:</p>
          <ul>
            <li>
              <strong>Tanpa aktivasi</strong>, hasilnya selalu garis lurus, berapa pun jumlah neuronnya. Ini sama dengan
              Percobaan 1.
            </li>
            <li>
              <strong>Dengan ReLU</strong>, tiruannya berupa garis patah-patah. Dengan 16 neuron, kurvanya sudah hampir
              menempel. Polanya tidak selalu rapi: dengan 3 neuron hasilnya justru sedikit lebih buruk daripada 2, karena
              letak tekukannya ikut bergeser. Tetapi secara umum, makin banyak tekukan, makin pas.
            </li>
            <li>
              <strong>Dengan GELU</strong>, tekukannya melengkung halus, jadi tiruannya pun lebih mulus.
            </li>
          </ul>
          <p>
            Filosofinya: aktivasi membuat setiap neuron bisa “memilih”, misalnya aktif hanya saat masukannya melewati
            batas tertentu. Satu neuron hanyalah satu tekukan sederhana. Tetapi banyak tekukan yang dijumlahkan bisa
            membentuk pola yang rumit, seperti lipatan-lipatan kertas yang membentuk origami.
          </p>
        </div>
      </div>
      <Deep title="Untuk yang penasaran: kenapa dua lapisan linear bisa digabung">
        <p>Tanpa aktivasi, dua lapisan hanyalah dua perkalian matriks berturut-turut:</p>
        <Tex block>{`y = W_2\\,(W_1 x) = (W_2 W_1)\\,x = W x`}</Tex>
        <p>Di contoh di atas:</p>
        <Tex block>{`W_2 W_1 = \\begin{bmatrix}1 & -1 & 2\\end{bmatrix}\\begin{bmatrix}1 & 2\\\\ 0 & 1\\\\ -1 & 1\\end{bmatrix} = \\begin{bmatrix}-1 & 3\\end{bmatrix}`}</Tex>
        <p>
          Dengan aktivasi <Tex>{`f`}</Tex> di tengah, <Tex>{`y = W_2\\, f(W_1 x)`}</Tex> tidak bisa lagi diringkas
          menjadi satu matriks. Tiruan kurva di atas berbentuk{' '}
          <Tex>{`\\hat y(x) = b + \\sum_{i=1}^{N} w_i\\, f(x - c_i)`}</Tex>, dengan <Tex>{`c_i`}</Tex> letak tekukan neuron
          ke-<Tex>{`i`}</Tex>.
        </p>
      </Deep>
      <Takeaway>Tanpa fungsi aktivasi, MLP setinggi apa pun hanyalah satu perkalian matriks. Aktivasi memberinya tekukan, dan tekukan memberinya kemampuan.</Takeaway>
    </section>
  )
}
