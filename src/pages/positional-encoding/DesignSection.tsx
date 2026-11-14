import { useState } from 'react'
import { Slider } from '../../components/Controls'
import { ColorBar, Heatmap } from '../../components/Heatmap'
import { Takeaway } from '../../components/Prose'
import { peDotClosedForm, peMatrix } from '../../lib/positional'
import type { ChartTheme } from '../../lib/theme'
import { fmt } from './state'

const ROWS = 64
const BITS = 8
const SIN_D = 16

/** Bit b of each position, as −1 (bit 0) / +1 (bit 1) so it shares the PE colour scale. Fastest bit on the left. */
function binaryMatrix(): Float64Array {
  const out = new Float64Array(ROWS * BITS)
  for (let p = 0; p < ROWS; p++) for (let b = 0; b < BITS; b++) out[p * BITS + b] = (p >> b) & 1 ? 1 : -1
  return out
}

const BINARY = binaryMatrix()
const SINUS = peMatrix(ROWS, SIN_D, 10000, 'interleaved')

const toBits = (p: number) => p.toString(2).padStart(BITS, '0')

function popcount(x: number): number {
  let n = 0
  for (; x; x >>= 1) n += x & 1
  return n
}

type Mark = 'yes' | 'no' | 'partial'

function Verdict({ mark, note }: { mark: Mark; note: string }) {
  const symbol = mark === 'yes' ? '✓' : mark === 'no' ? '✗' : '△'
  return (
    <td className="verdict">
      <span className={`verdict-${mark}`} aria-hidden>
        {symbol}
      </span>
      {note}
    </td>
  )
}

const REQUIREMENTS = ['Unik', 'Kecil', 'Konsisten', 'Halus', 'Bisa diperpanjang']

const ATTEMPTS: { name: string; marks: [Mark, string][] }[] = [
  {
    name: '1 · Nomor urut',
    marks: [
      ['yes', 'ya'],
      ['no', 'membesar terus'],
      ['yes', 'langkah = 1'],
      ['yes', 'ya'],
      ['yes', 'ya'],
    ],
  },
  {
    name: '2 · Dibagi panjang',
    marks: [
      ['partial', 'hanya dalam 1 kalimat'],
      ['yes', '0 sampai 1'],
      ['no', 'langkah berubah'],
      ['yes', 'ya'],
      ['no', 'panjang harus diketahui'],
    ],
  },
  {
    name: '3 · Biner',
    marks: [
      ['yes', 'ya'],
      ['yes', '0 atau 1'],
      ['yes', 'ya'],
      ['no', 'melompat'],
      ['partial', 'terbatas jumlah bit'],
    ],
  },
  {
    name: '4 · Gelombang sin/cos',
    marks: [
      ['yes', 'ya'],
      ['yes', '−1 sampai 1'],
      ['yes', 'ya'],
      ['yes', 'ya'],
      ['yes', 'ya'],
    ],
  },
]

export function DesignSection({ theme }: { theme: ChartTheme }) {
  const [len, setLen] = useState(50)
  const [p, setP] = useState(7)

  const changed = popcount(p ^ (p + 1))
  // ‖PE(p+1) − PE(p)‖² = 2·(d/2) − 2·PE(p)·PE(p+1), and the dot product only depends on the offset (here 1).
  const sinStep = Math.sqrt(SIN_D - 2 * peDotClosedForm(1, SIN_D, 10000))

  return (
    <section className="section" id="design">
      <h2>
        <span className="section-num">2</span>Merancang tanda posisi dari nol
      </h2>
      <div className="prose">
        <p>
          Sebelum melihat rumus dari paper, mari kita coba merancangnya sendiri. Tugasnya: beri setiap posisi sebuah{' '}
          <strong>tanda</strong> berupa deretan angka, lalu tambahkan tanda itu ke vektor kata. Dengan begitu, “kucing” di
          posisi 0 dan “kucing” di posisi 2 tidak lagi sama.
        </p>
        <p>Tanda yang bagus sebaiknya memenuhi lima syarat ini:</p>
        <ol>
          <li>
            <strong>Unik</strong> — setiap posisi punya tanda yang berbeda.
          </li>
          <li>
            <strong>Kecil</strong> — angkanya tidak membesar tanpa batas, supaya tidak menenggelamkan makna kata.
          </li>
          <li>
            <strong>Konsisten</strong> — “maju satu langkah” artinya sama, baik di kalimat 5 kata maupun 500 kata.
          </li>
          <li>
            <strong>Halus</strong> — posisi yang bertetangga punya tanda yang mirip.
          </li>
          <li>
            <strong>Bisa diperpanjang</strong> — bisa dihitung untuk posisi berapa pun, tanpa perlu tahu panjang kalimat
            lebih dulu.
          </li>
        </ol>
        <p>
          Daftar syarat ini diringkas dari dua artikel penjelasan (Kazemnejad, 2019; Fleetwood, 2024), bukan dari paper
          aslinya. Paper sendiri hanya menyebut dua alasan, yang kita bahas di bagian 3.
        </p>
      </div>

      <div className="attempt">
        <div className="attempt-label">Percobaan 1</div>
        <h3>Pakai nomor urutnya saja</h3>
        <div className="prose">
          <p>
            Ide paling sederhana: token pertama diberi 0, kedua 1, ketiga 2, dan seterusnya. Masalahnya, angka ini terus
            membesar. Sementara itu, angka di vektor kata biasanya kecil, di sekitar 0. Di posisi 500, tanda posisinya
            bernilai 500 dan makna katanya praktis tenggelam.
          </p>
        </div>
      </div>

      <div className="attempt">
        <div className="attempt-label">Percobaan 2</div>
        <h3>Bagi dengan panjang kalimat</h3>
        <div className="prose">
          <p>
            Supaya tetap kecil, bagi nomor urut dengan panjang kalimat: token pertama 0, token terakhir 1. Sekarang
            angkanya kecil, tetapi muncul masalah baru. Geser slider di bawah dan lihat jarak antar token.
          </p>
        </div>
        <div className="card">
          <Slider label="panjang kalimat (token)" value={len} min={2} max={500} onChange={setLen} />
          <div className="stat-row">
            <div className="stat">
              <span className="stat-label">Percobaan 1 · tanda token terakhir</span>
              <span className="stat-value">{len - 1}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Percobaan 2 · jarak antar token</span>
              <span className="stat-value">{fmt(1 / (len - 1), 4)}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Percobaan 2 · tanda token ke-3 (posisi 2)</span>
              <span className="stat-value">{len > 2 ? fmt(2 / (len - 1), 4) : '—'}</span>
            </div>
          </div>
          <p className="card-sub" style={{ marginTop: 12, marginBottom: 0 }}>
            Di kalimat 5 token, “maju satu langkah” berarti +0.25. Di kalimat 500 token, hanya +0.002. Arti satu langkah jadi
            berubah-ubah. Selain itu, saat model menulis kata demi kata, panjang akhir kalimat belum diketahui.
          </p>
        </div>
      </div>

      <div className="attempt">
        <div className="attempt-label">Percobaan 3 dan 4</div>
        <h3>Tulis posisinya dalam biner, lalu haluskan</h3>
        <div className="prose">
          <p>
            Cara lain: tulis nomor posisi dalam bilangan biner, dan jadikan setiap bit satu angka. Hasilnya selalu 0 atau 1
            (kecil), dan setiap posisi pasti berbeda (unik). Perhatikan polanya: bit terakhir berganti setiap langkah, bit
            sebelumnya setiap 2 langkah, lalu setiap 4, setiap 8, dan seterusnya. Makin ke depan, makin lambat.
          </p>
          <p>
            Kekurangannya, biner <strong>melompat-lompat</strong>. Posisi 7 (<span className="bits">00000111</span>) dan 8 (
            <span className="bits">00001000</span>) bertetangga, tetapi empat bit berubah sekaligus. Bagi model yang belajar
            dengan perubahan kecil sedikit demi sedikit, lompatan seperti ini menyulitkan.
          </p>
          <p>
            Solusinya: ganti setiap bit dengan <strong>gelombang</strong> yang naik-turun dengan halus. Gelombang yang
            berayun cepat menggantikan bit belakang, gelombang yang lambat menggantikan bit depan. Polanya tetap sama, tetapi
            tanpa lompatan. Bandingkan kedua gambar di bawah.
          </p>
        </div>
        <div className="card">
          <Slider label="posisi p (dibandingkan dengan p + 1)" value={p} min={0} max={ROWS - 2} onChange={setP} />
          <div className="grid-2" style={{ marginTop: 16 }}>
            <div>
              <div className="card-title">Biner (8 bit)</div>
              <div className="card-sub">Biru = 0, merah = 1. Bit yang paling cepat berganti diletakkan di kiri.</div>
              <Heatmap
                data={BINARY}
                rows={ROWS}
                cols={BITS}
                vmax={1}
                scale={theme.diverging}
                height={260}
                xLabel="bit (tercepat di kiri) →"
                yLabel="← posisi 0 … 63"
                selectedRow={p}
                onCellClick={(row) => setP(Math.min(row, ROWS - 2))}
                ariaLabel="Heatmap posisi 0 sampai 63 dalam biner"
                tooltip={(row, col) => (
                  <>
                    <div className="tt-row">
                      <span className="muted">posisi</span>
                      <span className="mono">
                        {row} = {toBits(row)}
                      </span>
                    </div>
                    <div className="tt-row">
                      <span className="muted">bit ke-{col}</span>
                      <strong className="mono">{(row >> col) & 1}</strong>
                    </div>
                  </>
                )}
              />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div className="card-title">Gelombang sin/cos (16 angka)</div>
                <ColorBar scale={theme.diverging} min="−1" max="+1" />
              </div>
              <div className="card-sub">Gelombang yang paling cepat berayun ada di kiri.</div>
              <Heatmap
                data={SINUS}
                rows={ROWS}
                cols={SIN_D}
                vmax={1}
                scale={theme.diverging}
                height={260}
                xLabel="dimensi (tercepat di kiri) →"
                yLabel="← posisi 0 … 63"
                selectedRow={p}
                onCellClick={(row) => setP(Math.min(row, ROWS - 2))}
                ariaLabel="Heatmap positional encoding sinusoidal untuk posisi 0 sampai 63"
                tooltip={(row, col) => (
                  <>
                    <div className="tt-row">
                      <span className="muted">posisi, dimensi</span>
                      <span className="mono">
                        {row}, {col}
                      </span>
                    </div>
                    <div className="tt-row">
                      <span className="muted">nilai</span>
                      <strong className="mono">{fmt(SINUS[row * SIN_D + col])}</strong>
                    </div>
                  </>
                )}
              />
            </div>
          </div>
          <div className="stat-row">
            <div className="stat">
              <span className="stat-label">
                Biner · {p} → {p + 1}
              </span>
              <span className="stat-value bits">
                {toBits(p)} → {toBits(p + 1)}
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Biner · bit yang berubah</span>
              <span className="stat-value">
                {changed} dari {BITS}
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Gelombang · jarak ke tetangga</span>
              <span className="stat-value">{fmt(sinStep, 4)}</span>
            </div>
          </div>
          <p className="card-sub" style={{ marginTop: 12, marginBottom: 0 }}>
            Coba p = 7, 15, atau 31. Di biner, jumlah bit yang berubah melonjak. Di gelombang, jarak antara p dan p + 1
            selalu sama untuk p berapa pun. Bagian 7 menunjukkan kenapa.
          </p>
        </div>
      </div>

      <div className="attempt">
        <div className="attempt-label">Rangkuman</div>
        <h3>Siapa yang lolos lima syarat?</h3>
        <div className="table-scroll">
          <table className="table table-text">
            <thead>
              <tr>
                <th>Percobaan</th>
                {REQUIREMENTS.map((r) => (
                  <th key={r}>{r}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ATTEMPTS.map((a) => (
                <tr key={a.name}>
                  <td>{a.name}</td>
                  {a.marks.map(([mark, note], j) => (
                    <Verdict key={j} mark={mark} note={note} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="card-sub" style={{ marginTop: 8 }}>
          ✓ lolos · △ sebagian · ✗ gagal. Biner 8 bit hanya cukup untuk 256 posisi; setelah itu perlu bit tambahan.
        </p>
      </div>

      <Takeaway>
        Rumus sinusoidal bisa dipandang sebagai versi halus dari menghitung dalam biner: banyak “digit” yang berputar
        dengan kecepatan berbeda.
      </Takeaway>
    </section>
  )
}
