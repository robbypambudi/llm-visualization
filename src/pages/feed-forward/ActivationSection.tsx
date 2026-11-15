import { Legend, LineChart } from '../../components/LineChart'
import { Deep, Takeaway } from '../../components/Prose'
import { Tex } from '../../components/Tex'
import type { ChartTheme } from '../../lib/theme'
import { gelu, relu, silu } from '../../lib/transformer'
import { fmt } from '../positional-encoding/state'

const MODELS = [
  { name: 'Transformer asli (2017)', act: 'ReLU', d: 512, hidden: 2048, note: 'Vaswani dkk., §3.3' },
  { name: 'GPT-2 small', act: 'GELU', d: 768, hidden: 3072, note: 'kode model.py' },
  { name: 'LLaMA 3 8B', act: 'SwiGLU', d: 4096, hidden: 14336, note: 'config.json' },
]

export function ActivationSection({ theme }: { theme: ChartTheme }) {
  const series = [
    { name: 'ReLU', color: theme.series[0], fn: relu },
    { name: 'GELU', color: theme.series[1], fn: gelu },
    { name: 'SiLU (Swish)', color: theme.series[2], fn: silu },
  ]
  return (
    <section className="section" id="activation">
      <h2>
        <span className="section-num">3</span>Fungsi aktivasi: ReLU, GELU, SwiGLU
      </h2>
      <div className="prose">
        <p>
          Semua fungsi aktivasi pada dasarnya adalah <strong>gerbang</strong>: ia memutuskan seberapa banyak sinyal boleh
          lewat. Bedanya ada di cara gerbang itu membuka.
        </p>
        <ul>
          <li>
            <strong>ReLU</strong> dipakai di paper Transformer asli. Aturannya paling sederhana: angka negatif menjadi 0,
            angka positif lewat apa adanya. Gerbangnya hanya punya dua keadaan, tertutup atau terbuka.
          </li>
          <li>
            <strong>GELU</strong> dipakai GPT-2. Gerbangnya membuka perlahan. Hendrycks dan Gimpel (2016) merumuskannya
            sebagai “masukan dikali peluang”: makin besar masukannya, makin besar bagian yang diloloskan. Angka sedikit
            negatif masih bisa lewat sedikit.
          </li>
          <li>
            <strong>SiLU</strong> (disebut juga Swish) bentuknya mirip GELU. Ia menjadi bagian dari SwiGLU, yang dibahas
            di bawah.
          </li>
        </ul>
        <p>Arahkan kursor ke grafik untuk membandingkan nilainya. Perhatikan apa yang terjadi di x = −1.</p>
      </div>
      <div className="card">
        <Legend items={series} />
        <LineChart
          series={series}
          xDomain={[-4, 4]}
          yDomain={[-1, 4]}
          yTicks={[-1, 0, 1, 2, 3, 4]}
          height={240}
          xLabel="masukan x"
          formatY={(v) => fmt(v, 3)}
          ariaLabel="Grafik ReLU, GELU, dan SiLU"
        />
        <p className="card-sub" style={{ marginTop: 12, marginBottom: 0 }}>
          Untuk masukan besar, ketiganya hampir sama. Perbedaannya ada di sekitar nol: ReLU menekuk tajam, GELU dan SiLU
          melengkung halus dan sedikit turun di bawah nol.
        </p>
      </div>

      <div className="attempt">
        <h3>SwiGLU: gerbang yang ikut dipelajari</h3>
        <div className="prose">
          <p>
            Shazeer (2020) mencoba keluarga aktivasi bernama <strong>GLU</strong> (<em>gated linear unit</em>). Idenya:
            buat dua salinan vektor dengan dua matriks berbeda. Salinan pertama dilewatkan ke fungsi gerbang, lalu
            dikalikan dengan salinan kedua, angka demi angka. Jadi satu cabang memutuskan seberapa banyak isi cabang lain
            yang boleh lewat. Beberapa varian GLU memberi hasil lebih baik daripada ReLU atau GELU. Varian yang memakai
            SiLU sebagai gerbang disebut <strong>SwiGLU</strong>, dan LLaMA memakainya.
          </p>
          <p>
            Bedanya dengan ReLU dan GELU: di sana gerbangnya ditentukan oleh nilai sinyal itu sendiri. Di SwiGLU, gerbang
            punya bobotnya sendiri, jadi model bisa belajar <em>kapan</em> harus membuka, terpisah dari <em>apa</em> yang
            dialirkan.
          </p>
          <p>
            Ada harga yang harus dibayar: SwiGLU butuh tiga matriks, bukan dua. Agar jumlah bobotnya tetap sama, LLaMA
            mengecilkan lapisan tengah menjadi <Tex>{`\\tfrac{2}{3} \\cdot 4d`}</Tex>, bukan <Tex>{`4d`}</Tex>.
          </p>
        </div>
      </div>
      <div className="table-scroll">
        <table className="table table-text">
          <thead>
            <tr>
              <th>Model</th>
              <th>Aktivasi</th>
              <th>Lebar vektor (d)</th>
              <th>Lebar lapisan tengah</th>
              <th>Sumber</th>
            </tr>
          </thead>
          <tbody>
            {MODELS.map((m) => (
              <tr key={m.name}>
                <td>{m.name}</td>
                <td>{m.act}</td>
                <td className="mono">{m.d}</td>
                <td className="mono">
                  {m.hidden} (×{(m.hidden / m.d).toFixed(1)})
                </td>
                <td>{m.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Deep title="Untuk yang penasaran: rumus-rumusnya">
        <Tex block>{`\\text{ReLU}(x) = \\max(0, x) \\qquad \\text{GELU}(x) = x\\,\\Phi(x) \\qquad \\text{SiLU}(x) = x\\,\\sigma(x)`}</Tex>
        <p>
          <Tex>{`\\Phi`}</Tex> adalah fungsi distribusi kumulatif normal baku, dan <Tex>{`\\sigma`}</Tex> adalah fungsi
          sigmoid. GPT-2 menghitung GELU dengan pendekatan tanh:
        </p>
        <Tex block>{`\\text{GELU}(x) \\approx 0.5\\,x\\left(1 + \\tanh\\!\\left[\\sqrt{2/\\pi}\\,(x + 0.044715\\,x^3)\\right]\\right)`}</Tex>
        <p>MLP asli dengan ReLU dan MLP versi SwiGLU:</p>
        <Tex block>{`\\text{FFN}(x) = \\max(0,\\, xW_1 + b_1)\\,W_2 + b_2`}</Tex>
        <Tex block>{`\\text{FFN}_{\\text{SwiGLU}}(x) = \\big(\\text{SiLU}(xW) \\odot xV\\big)\\,W_2`}</Tex>
        <p>
          <Tex>{`\\odot`}</Tex> berarti perkalian angka demi angka. Hitungan bobotnya: dua matriks berukuran{' '}
          <Tex>{`d \\times 4d`}</Tex> berisi <Tex>{`8d^2`}</Tex> angka. Tiga matriks berukuran{' '}
          <Tex>{`d \\times \\tfrac{2}{3}4d`}</Tex> juga berisi <Tex>{`3 \\cdot \\tfrac{8}{3}d^2 = 8d^2`}</Tex> angka.
        </p>
        <p>
          Konfigurasi LLaMA 3 8B mencantumkan lebar tengah 14336 dan aktivasi <code>silu</code>. Angka itu tidak persis
          sama dengan <Tex>{`\\tfrac{2}{3} \\cdot 4 \\cdot 4096 \\approx 10923`}</Tex>; konfigurasinya tidak menjelaskan
          dari mana angka itu diturunkan, jadi kita cukup mencatatnya apa adanya.
        </p>
      </Deep>
      <Takeaway>Aktivasi adalah gerbang. ReLU membuka atau menutup, GELU membuka perlahan, dan SwiGLU punya gerbang yang ikut dipelajari.</Takeaway>
    </section>
  )
}
