import { useMemo, useState } from 'react'
import { Field, Segmented } from '../../components/Controls'
import { Deep, Takeaway } from '../../components/Prose'
import { Tex } from '../../components/Tex'
import { attention } from '../../lib/transformer'
import type { ChartTheme } from '../../lib/theme'
import { fmt } from '../positional-encoding/state'
import { BASE, makeToy, TOKENS } from './toy'

const SWAP_AT = 5
const SWAPS = ['lelah', 'lapar', 'senang']
const VMAX = 2

export function ExamplesSection({ theme }: { theme: ChartTheme }) {
  const [word, setWord] = useState('lapar')
  const [causal, setCausal] = useState(true)

  const rows = useMemo(() => {
    const tokens = TOKENS.map((w, i) => (i === SWAP_AT ? word : w))
    const swapped = makeToy(tokens)
    const before = attention(BASE.Q, BASE.K, BASE.V, { causal }).out
    const after = attention(swapped.Q, swapped.K, swapped.V, { causal }).out
    return tokens.map((w, t) => ({
      word: w,
      out: after[t],
      change: Math.max(...after[t].map((v, j) => Math.abs(v - before[t][j]))),
    }))
  }, [word, causal])

  return (
    <section className="section" id="examples">
      <h2>
        <span className="section-num">2</span>Satu kalimat, banyak soal latihan
      </h2>
      <div className="prose">
        <p>
          Masker punya bonus besar. Karena setiap posisi hanya melihat ke belakang, satu kalimat berisi {TOKENS.length}{' '}
          token langsung menjadi {TOKENS.length - 1} soal latihan, dan semuanya dikerjakan dalam <strong>satu kali
          jalan</strong>:
        </p>
      </div>
      <div className="table-scroll">
        <table className="table table-text">
          <thead>
            <tr>
              <th>Soal</th>
              <th>Yang dilihat model</th>
              <th>Jawaban yang harus ditebak</th>
            </tr>
          </thead>
          <tbody>
            {TOKENS.slice(0, -1).map((_, t) => (
              <tr key={t}>
                <td className="mono">{t + 1}</td>
                <td>{TOKENS.slice(0, t + 1).join(' ')}</td>
                <td>
                  <strong>{TOKENS[t + 1]}</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="prose" style={{ marginTop: 16 }}>
        <p>
          Cara lambatnya adalah menjalankan model {TOKENS.length - 1} kali, sekali untuk setiap awalan kalimat. Dengan
          masker, cukup sekali. Hasilnya pun sama persis, karena posisi mana pun memang tidak pernah melihat token yang
          datang sesudahnya. Teks sepanjang 1024 token (panjang konteks GPT-2) memberi 1023 soal sekaligus.
        </p>
        <p>
          Mari kita buktikan. Di bawah ini kata ke-{SWAP_AT} (“lelah”) bisa diganti. Tabel menunjukkan seberapa besar
          hasil attention di setiap posisi ikut berubah.
        </p>
      </div>
      <div className="card">
        <div className="controls">
          <Field label="ganti “lelah” dengan">
            <div className="segmented-wrap">
              <Segmented ariaLabel="Kata pengganti" value={word} options={SWAPS.map((w) => ({ value: w, label: w }))} onChange={setWord} />
            </div>
          </Field>
          <Field label="masker">
            <div className="segmented-wrap">
              <Segmented
                ariaLabel="Masker causal"
                value={causal ? 'on' : 'off'}
                options={[
                  { value: 'on', label: 'dengan masker' },
                  { value: 'off', label: 'tanpa masker' },
                ]}
                onChange={(v) => setCausal(v === 'on')}
              />
            </div>
          </Field>
        </div>
        <div className="table-scroll" style={{ marginTop: 12 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Posisi</th>
                <th>Token</th>
                <th>Hasil attention ({BASE.V[0].length} angka)</th>
                <th>Perubahan terbesar</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, t) => (
                <tr key={t}>
                  <td className="mono">{t}</td>
                  <td>{r.word}</td>
                  <td>
                    <span className="chip-row" style={{ flexWrap: 'nowrap' }}>
                      {r.out.map((v, j) => (
                        <span key={j} className="vec-cell" style={{ background: theme.diverging.css(v / VMAX) }}>
                          {fmt(v, 2)}
                        </span>
                      ))}
                    </span>
                  </td>
                  <td className="mono">{r.change < 1e-12 ? '0 (tetap)' : fmt(r.change, 3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="card-sub" style={{ marginTop: 12, marginBottom: 0 }}>
          {word === 'lelah'
            ? 'Pilih kata pengganti lain untuk melihat perubahannya.'
            : causal
              ? `Dengan masker, posisi 0 sampai ${SWAP_AT - 1} sama sekali tidak berubah. Mereka memang tidak bisa melihat kata ke-${SWAP_AT}. Hanya posisi ${SWAP_AT} dan sesudahnya yang berubah.`
              : 'Tanpa masker, semua posisi ikut berubah. Artinya setiap posisi “mengintip” kata yang belum boleh ia ketahui.'}{' '}
          Angka-angkanya berasal dari vektor acak kecil, hanya untuk ilustrasi.
        </p>
      </div>
      <Deep title="Untuk yang penasaran: kenapa hasilnya sama dengan menjalankan per awalan">
        <p>
          Hasil attention di posisi <Tex>{`t`}</Tex> adalah jumlah berbobot dari nilai-nilai yang boleh dilihatnya:
        </p>
        <Tex block>{`\\text{out}_t = \\sum_{j \\le t} w_{t j} \\, v_j, \\qquad w_{t j} = \\frac{e^{s_{t j}}}{\\sum_{k \\le t} e^{s_{t k}}}`}</Tex>
        <p>
          Tidak ada satu pun suku dengan <Tex>{`j > t`}</Tex>. Jadi token sesudah posisi <Tex>{`t`}</Tex> boleh diganti
          apa saja, dan <Tex>{`\\text{out}_t`}</Tex> tetap sama. Itu sebabnya satu kali jalan dengan masker memberi hasil
          yang sama dengan menjalankan model terpisah untuk setiap awalan. Sifat ini juga berlaku di lapisan-lapisan
          berikutnya, karena masukan mereka sendiri juga tidak bergantung pada masa depan.
        </p>
      </Deep>
      <Takeaway>
        Berkat masker, satu kalimat dengan n token menjadi n − 1 soal latihan yang dikerjakan sekaligus, tanpa ada yang
        bisa menyontek.
      </Takeaway>
    </section>
  )
}
