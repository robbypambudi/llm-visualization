import { useMemo, useState } from 'react'
import { Field, Segmented, Slider } from '../../components/Controls'
import { Legend, LineChart } from '../../components/LineChart'
import { Deep, Takeaway } from '../../components/Prose'
import { Tex } from '../../components/Tex'
import { simulateStack } from '../../lib/deepstack'
import type { ChartTheme } from '../../lib/theme'
import { fmt } from '../positional-encoding/state'

const D = 64
const SEED = 3
const MAX_DEPTH = 48
const SCALES = [1, 0.5, 0.2]

/** Linear interpolation between integer layers, so the chart draws straight segments. */
const lerp = (a: number[]) => (x: number) => {
  const i = Math.floor(x)
  if (i >= a.length - 1) return a[a.length - 1]
  const t = x - i
  return t === 0 ? a[i] : a[i] * (1 - t) + a[i + 1] * t
}

/** log10 ratio → "×12", "×0.03", "1/2.600.000×" — readable for beginners. */
function fmtRatio(v: number): string {
  if (!Number.isFinite(v)) return '≈ 0'
  if (v >= 3) return `${Math.round(10 ** v).toLocaleString('id-ID')}×`
  if (v <= -3) return `1/${Math.round(10 ** -v).toLocaleString('id-ID')}×`
  return `${(10 ** v).toPrecision(2)}×`
}

export function ResidualSection({ theme }: { theme: ChartTheme }) {
  const [gain, setGain] = useState(1)
  const [depth, setDepth] = useState(MAX_DEPTH)
  const [scale, setScale] = useState(0.5)

  const plain = useMemo(() => simulateStack({ d: D, depth, gain, residual: false, scale, seed: SEED }), [depth, gain, scale])
  const res = useMemo(() => simulateStack({ d: D, depth, gain, residual: true, scale, seed: SEED }), [depth, gain, scale])

  const plainColor = theme.series[1]
  const resColor = theme.series[0]
  const legend = [
    { name: 'tumpukan biasa', color: plainColor },
    { name: 'dengan residual', color: resColor },
  ]

  const finite = [...plain.gradLog, ...res.gradLog].filter(Number.isFinite)
  const gLo = Math.min(-2, Math.floor(Math.min(...finite)))
  const gHi = Math.max(2, Math.ceil(Math.max(...finite)))

  return (
    <section className="section" id="residual">
      <h2>
        <span className="section-num">2</span>Jalan pintas: jalur residual
      </h2>
      <div className="prose">
        <p>
          Akar masalahnya: setiap lapisan <em>menulis ulang</em> vektornya. Bagaimana kalau aturannya diubah? Lapisan
          tidak boleh menghapus apa pun. Ia hanya boleh <strong>menambahkan catatan</strong> di atas yang sudah ada.
        </p>
        <p>
          Dalam rumus, lapisan biasa menghitung <Tex>{`x_{baru} = f(x)`}</Tex>. Lapisan dengan jalur residual menghitung{' '}
          <Tex>{`x_{baru} = x + f(x)`}</Tex>. Inputnya dibawa terus lewat “jalan pintas”, dan lapisan cukup mempelajari{' '}
          <em>perubahan</em> yang perlu ditambahkan. Ide ini datang dari ResNet (He dkk., 2015), yang berhasil melatih
          jaringan pengenal gambar sampai 152 lapisan.
        </p>
        <p>
          Bayangkan menyunting dokumen bersama dengan mode saran: teks asli tetap ada, dan setiap orang hanya menambahkan
          catatannya. Atau bayangkan sebuah papan tulis bersama. Para peneliti di Anthropic (Elhage dkk., 2021) menyebut
          jalur ini <strong>residual stream</strong>: attention dan MLP di setiap blok <em>membaca</em> dari jalur itu,
          lalu <em>menulis</em> hasilnya kembali dengan cara menambahkan.
        </p>
        <p>
          Mari kita uji dengan simulasi kecil: tumpukan lapisan acak (masing-masing {D} angka, belum dilatih). Kita
          bandingkan tumpukan biasa dengan tumpukan yang memakai jalur residual. Lapisannya sama persis, bedanya hanya
          “tulis ulang” atau “tambahkan”.
        </p>
      </div>
      <div className="card">
        <div className="controls">
          <Slider label="penguatan bobot (g)" value={gain} min={0.5} max={3} step={0.1} onChange={setGain} format={(v) => v.toFixed(1)} />
          <Slider label="jumlah lapisan" value={depth} min={2} max={MAX_DEPTH} onChange={setDepth} />
          <Field label="ukuran catatan (residual)">
            <Segmented ariaLabel="ukuran catatan" value={scale} options={SCALES.map((s) => ({ value: s, label: String(s) }))} onChange={setScale} />
          </Field>
        </div>
        <div style={{ marginTop: 12 }}>
          <Legend items={legend} />
        </div>
        <div className="grid-2" style={{ marginTop: 8 }}>
          <div>
            <div className="card-title">Sisa input awal di tiap lapisan</div>
            <div className="card-sub">Kemiripan arah (cosine) antara vektor di lapisan itu dan vektor input. 1 = masih sama persis.</div>
            <LineChart
              series={[
                { name: 'tumpukan biasa', color: plainColor, fn: lerp(plain.cos) },
                { name: 'dengan residual', color: resColor, fn: lerp(res.cos) },
              ]}
              xDomain={[0, depth]}
              yDomain={[-0.5, 1]}
              yTicks={[-0.5, 0, 0.5, 1]}
              height={220}
              xLabel="lapisan"
              integerMarkers={depth <= 16}
              formatY={(v) => fmt(v, 2)}
              ariaLabel="Kemiripan vektor tiap lapisan dengan input awal"
            />
          </div>
          <div>
            <div className="card-title">Kekuatan sinyal belajar yang sampai</div>
            <div className="card-sub">
              Skala log: 0 = sama kuat dengan di lapisan teratas, −3 = seribu kali lebih lemah, +3 = seribu kali lebih kuat.
            </div>
            <LineChart
              series={[
                { name: 'tumpukan biasa', color: plainColor, fn: lerp(plain.gradLog) },
                { name: 'dengan residual', color: resColor, fn: lerp(res.gradLog) },
              ]}
              xDomain={[0, depth]}
              yDomain={[gLo, gHi]}
              height={220}
              xLabel="lapisan"
              integerMarkers={depth <= 16}
              formatY={fmtRatio}
              ariaLabel="Kekuatan gradien di tiap lapisan, skala log"
            />
          </div>
        </div>
        <div className="stat-row">
          <div className="stat">
            <span className="stat-label">sinyal di lapisan 0, biasa</span>
            <span className="stat-value">{fmtRatio(plain.gradLog[0])}</span>
          </div>
          <div className="stat">
            <span className="stat-label">sinyal di lapisan 0, residual</span>
            <span className="stat-value">{fmtRatio(res.gradLog[0])}</span>
          </div>
          <div className="stat">
            <span className="stat-label">panjang vektor: awal → akhir (residual)</span>
            <span className="stat-value">
              {fmt(res.norm[0], 1)} → {fmt(res.norm[depth], 1)}
            </span>
          </div>
        </div>
        <p className="card-sub" style={{ marginTop: 12, marginBottom: 0 }}>
          Ilustrasi, bukan LLM sungguhan. Setiap lapisan menghitung tanh(W·x) dengan bobot acak W ~ N(0, g²/{D}). Versi
          residual menambahkan hasil itu (dikali ukuran catatan) ke x. Sinyal belajar dihitung mundur dari lapisan
          teratas dengan aturan rantai.
        </p>
      </div>
      <div className="prose" style={{ marginTop: 16 }}>
        <p>Yang terlihat dari simulasi ini (dengan {MAX_DEPTH} lapisan):</p>
        <ul>
          <li>
            <strong>Tumpukan biasa langsung kehilangan jejak input.</strong> Setelah satu lapisan saja, kemiripannya dengan
            input sudah di bawah 0.3. Versi residual turun pelan-pelan, karena input awal selalu ikut terbawa.
          </li>
          <li>
            <strong>Sinyal belajar di tumpukan biasa sangat rapuh.</strong> Geser penguatan ke 0.5: sinyal yang sampai ke
            lapisan pertama tinggal sekitar sepersejuta miliar (10⁻¹⁵). Geser ke 3: sinyalnya membesar lebih dari 100 ribu
            kali. Keduanya membuat belajar macet atau kacau.
          </li>
          <li>
            <strong>Dengan residual, sinyalnya tetap jinak.</strong> Di seluruh rentang penguatan, sinyal di lapisan
            pertama hanya membesar kurang dari 50 kali (ukuran catatan 0.5), atau kurang dari 3 kali (ukuran catatan 0.2).
          </li>
          <li>
            <strong>Tetapi panjang vektor residual terus bertambah,</strong> karena setiap lapisan menambahkan sesuatu.
            Lapisan berikutnya menerima angka yang makin besar. Bagian 3 membahas cara menjinakkannya.
          </li>
        </ul>
        <p>
          Kenapa catatan yang lebih kecil membuat semuanya lebih tenang? Karena setiap lapisan hanya sedikit mengubah
          jalur utama. GPT-2 memakai gagasan serupa saat inisialisasi: bobot lapisan yang menulis ke jalur residual
          diperkecil dengan faktor <Tex>{`1/\\sqrt{N}`}</Tex>, dengan <Tex>{`N`}</Tex> = jumlah lapisan residual (paper
          GPT-2, §2.3).
        </p>
      </div>
      <Deep title="Untuk yang penasaran: kenapa jalur residual menolong sinyal belajar?">
        <p>
          Sinyal belajar dihitung dengan aturan rantai: turunan seluruh tumpukan adalah hasil kali turunan setiap lapisan.
          Untuk lapisan biasa, faktornya adalah <Tex>{`f'(x)`}</Tex>. Kalau faktor ini sedikit di bawah 1, hasil kali
          puluhan faktor menjadi nyaris nol. Kalau sedikit di atas 1, hasilnya meledak.
        </p>
        <p>Untuk lapisan residual, turunannya menjadi</p>
        <Tex block>{`\\frac{\\partial}{\\partial x}\\big(x + f(x)\\big) = 1 + f'(x)`}</Tex>
        <p>
          Angka <Tex>{`1`}</Tex> itu adalah jalan tol bagi sinyal belajar. Walaupun <Tex>{`f'(x)`}</Tex> kecil, sinyal
          tetap bisa mengalir lurus dari atas ke bawah tanpa dikecilkan. (Untuk vektor, <Tex>{`1`}</Tex> menjadi matriks
          identitas <Tex>{`I`}</Tex>.)
        </p>
      </Deep>
      <Takeaway>
        Jalur residual mengubah “tulis ulang” menjadi “tambahkan catatan”. Input awal tetap terbawa, dan sinyal belajar
        punya jalan tol untuk kembali ke lapisan awal.
      </Takeaway>
    </section>
  )
}
