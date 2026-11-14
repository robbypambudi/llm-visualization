import { useState } from 'react'
import { Segmented } from '../../components/Controls'
import { Deep, Takeaway } from '../../components/Prose'
import type { ChartTheme } from '../../lib/theme'
import { hashString, peVector, randomNormalVector } from '../../lib/positional'

const DEMO_D = 16

function tokenize(s: string): string[] {
  return s.trim().split(/\s+/).filter(Boolean).slice(0, 8)
}

function inputVectors(tokens: string[], withPe: boolean): Float64Array[] {
  return tokens.map((t, pos) => {
    const e = randomNormalVector(DEMO_D, hashString(t), 0.6)
    if (!withPe) return e
    const pe = peVector(pos, DEMO_D)
    return e.map((v, i) => v + pe[i])
  })
}

/** Two sentences hold the same multiset of input vectors ⇔ an order-blind model sees the same thing. */
function sameMultiset(a: Float64Array[], b: Float64Array[]): boolean {
  if (a.length !== b.length) return false
  const key = (v: Float64Array) => Array.from(v, (x) => x.toFixed(9)).join(',')
  const ka = a.map(key).sort()
  const kb = b.map(key).sort()
  return ka.every((k, i) => k === kb[i])
}

function Strip({ v, theme }: { v: Float64Array; theme: ChartTheme }) {
  return (
    <div className="strip" aria-hidden>
      {Array.from(v, (x, i) => (
        <span key={i} style={{ background: theme.diverging.css(x / 2) }} />
      ))}
    </div>
  )
}

export function WhyPosition({ theme }: { theme: ChartTheme }) {
  const [a, setA] = useState('anjing menggigit kucing')
  const [b, setB] = useState('kucing menggigit anjing')
  const [withPe, setWithPe] = useState(false)

  const ta = tokenize(a)
  const tb = tokenize(b)
  const va = inputVectors(ta, withPe)
  const vb = inputVectors(tb, withPe)
  const same = sameMultiset(va, vb)

  return (
    <section className="section" id="why">
      <h2>
        <span className="section-num">1</span>Kenapa model butuh informasi posisi?
      </h2>
      <div className="prose">
        <p>
          Bayangkan kata-kata sebuah kalimat dimasukkan ke dalam kantong, lalu urutannya hilang: {'{'}anjing, menggigit,
          kucing{'}'}. Siapa menggigit siapa? Kita tidak bisa tahu.
        </p>
        <p>
          Bagian <strong>attention</strong> di Transformer mengalami hal yang sama. Ia melihat semua kata sekaligus, tetapi
          tidak tahu kata mana yang datang lebih dulu. Bagi attention, “anjing menggigit kucing” dan “kucing menggigit
          anjing” terlihat persis sama, padahal artinya berlawanan.
        </p>
        <p>
          Solusi dari paper Transformer: sebelum masuk ke model, setiap kata diberi <strong>tanda posisi</strong>. Tanda itu
          dijumlahkan ke vektor katanya. Coba tekan tombol di bawah dan lihat bedanya.
        </p>
      </div>

      <div className="card">
        <div className="grid-2" style={{ marginBottom: 16 }}>
          <input className="text-input" value={a} onChange={(e) => setA(e.target.value)} aria-label="Kalimat A" />
          <input className="text-input" value={b} onChange={(e) => setB(e.target.value)} aria-label="Kalimat B" />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 16 }}>
          <Segmented
            ariaLabel="Mode input"
            value={withPe ? 'pe' : 'raw'}
            options={[
              { value: 'raw', label: 'Embedding saja' },
              { value: 'pe', label: 'Embedding + PE' },
            ]}
            onChange={(v) => setWithPe(v === 'pe')}
          />
          <span style={{ fontSize: 14 }}>
            Kumpulan vektor kedua kalimat identik?{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{same ? 'Ya. Model tidak bisa membedakan urutannya.' : 'Tidak. Urutannya kini terbaca.'}</strong>
          </span>
        </div>
        <div className="grid-2">
          {[
            { tokens: ta, vecs: va, label: 'Kalimat A' },
            { tokens: tb, vecs: vb, label: 'Kalimat B' },
          ].map((s) => (
            <div key={s.label}>
              <div className="card-sub">
                {s.label} · vektor yang masuk ke model ({DEMO_D} angka per kata, warna = nilai)
              </div>
              {s.tokens.map((t, i) => (
                <div className="token-row" key={`${t}-${i}`}>
                  <span className="token-chip" title={t}>
                    {i}: {t}
                  </span>
                  <Strip v={s.vecs[i]} theme={theme} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <Deep title="Untuk yang penasaran: istilah teknisnya">
        <p>
          Attention menghitung skor antar token lewat perkalian titik (<em>dot product</em>) <code>q·k</code>. Tanpa
          informasi posisi, operasi ini bersifat <strong>permutation-equivariant</strong>: jika urutan token diacak,
          keluarannya ikut teracak dengan cara yang sama, tetapi isinya tidak berubah.
        </p>
        <p>
          Ada satu catatan. Pada model yang menulis kata demi kata (<em>decoder-only</em>), setiap token hanya boleh melihat
          token sebelumnya. Aturan ini sudah sedikit membocorkan urutan. Haviv dkk. (2022) menunjukkan model seperti ini
          tetap bisa belajar posisi tanpa tanda posisi apa pun (“NoPE”). Meski begitu, kebanyakan LLM tetap memakai tanda
          posisi, misalnya GPT-2 (learned) dan LLaMA (RoPE), yang dibahas di bagian 10.
        </p>
      </Deep>

      <Takeaway>Tanpa tanda posisi, Transformer membaca kalimat seperti setumpuk kata tanpa urutan.</Takeaway>
    </section>
  )
}
