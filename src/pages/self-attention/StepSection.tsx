import { useState } from 'react'
import { Segmented } from '../../components/Controls'
import { Deep, Takeaway } from '../../components/Prose'
import { Tex } from '../../components/Tex'
import { attention, dotVec } from '../../lib/transformer'
import type { ChartTheme } from '../../lib/theme'
import { fmt } from '../positional-encoding/state'
import { AttnGrid } from './AttnGrid'
import { K, Q, QK_DIMS, QUERY_MEANING, TOKENS, V, V_DIMS } from './toy'

const RESULT = attention(Q, K, V)
const SQRT_DK = Math.sqrt(QK_DIMS.length)
const DIA = TOKENS.indexOf('dia')
const KUCING = TOKENS.indexOf('kucing')

function VecCells({ v, theme, vmax = 2 }: { v: number[]; theme: ChartTheme; vmax?: number }) {
  return (
    <span className="chip-row" style={{ gap: 3, flexWrap: 'nowrap' }}>
      {v.map((x, i) => (
        <span key={i} className="vec-cell" style={{ background: theme.diverging.css(x / vmax), padding: '2px 6px' }}>
          {fmt(x, 1)}
        </span>
      ))}
    </span>
  )
}

export function StepSection({ theme }: { theme: ChartTheme }) {
  const [sel, setSel] = useState(DIA)
  const q = Q[sel]
  const weights = RESULT.weights[sel]
  const out = RESULT.out[sel]

  return (
    <section className="section" id="steps">
      <h2>
        <span className="section-num">3</span>Attention langkah demi langkah
      </h2>
      <div className="prose">
        <p>
          Sekarang kita jalankan percobaan 3 dengan angka yang bisa dibaca. Supaya mudah dipahami, query dan key di sini
          hanya berisi 3 angka dengan arti yang jelas: <strong>makhluk</strong>, <strong>kejadian</strong>, dan{' '}
          <strong>keadaan</strong>. Value berisi 4 ciri yang akan diserahkan. Pilih kata yang sedang “bertanya”:
        </p>
      </div>
      <div className="card">
        <div className="segmented-wrap">
          <Segmented
            ariaLabel="Pilih kata yang bertanya"
            value={sel}
            options={TOKENS.map((t, i) => ({ value: i, label: t }))}
            onChange={setSel}
          />
        </div>
        <div className="row-label" style={{ marginTop: 14 }}>
          Query “{TOKENS[sel]}”: <em>{QUERY_MEANING[sel]}</em>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <VecCells v={q} theme={theme} />
          <span className="muted-text">
            ({QK_DIMS.join(', ')})
          </span>
        </div>

        <div className="table-scroll" style={{ marginTop: 14 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Kata</th>
                <th>① Key</th>
                <th>② Skor q·k</th>
                <th>③ ÷ √3</th>
                <th>④ Bobot (softmax)</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {TOKENS.map((t, j) => {
                const raw = dotVec(q, K[j])
                return (
                  <tr key={t}>
                    <td className="mono">{t}</td>
                    <td>
                      <VecCells v={K[j]} theme={theme} />
                    </td>
                    <td className="mono">{fmt(raw, 2)}</td>
                    <td className="mono">{fmt(raw / SQRT_DK, 2)}</td>
                    <td>
                      <span className="w-cell">
                        <span className="w-value">{fmt(weights[j] * 100, 0)}%</span>
                        <span className="w-track" aria-hidden>
                          <span className="w-fill" style={{ width: `${weights[j] * 100}%` }} />
                        </span>
                      </span>
                    </td>
                    <td>
                      <VecCells v={V[j]} theme={theme} vmax={1} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="row-label" style={{ marginTop: 14 }}>
          ⑤ Hasil untuk “{TOKENS[sel]}” = jumlah (bobot × value)
        </div>
        <div className="chip-row">
          {out.map((x, i) => (
            <span key={i} className="vec-cell" style={{ background: theme.diverging.css(x) }}>
              {V_DIMS[i]} {fmt(x, 2)}
            </span>
          ))}
        </div>
        <p className="card-sub" style={{ marginTop: 12, marginBottom: 0 }}>
          Angka query, key, dan value di sini dirancang dengan tangan sebagai ilustrasi. Di model sungguhan, ketiganya
          dihitung dari embedding dengan tabel bobot yang dipelajari, panjangnya puluhan angka, dan arah-arahnya tidak
          punya nama yang rapi seperti “makhluk”.
        </p>
      </div>
      <div className="prose" style={{ marginTop: 16 }}>
        <p>Lima langkahnya:</p>
        <ol>
          <li>Setiap kata menyiapkan key (apa yang ia tawarkan).</li>
          <li>
            Query kata yang bertanya dibandingkan dengan setiap key lewat dot product. Makin searah, makin besar skornya.
          </li>
          <li>Skor dibagi √3, akar dari panjang query/key. Alasannya dibahas di bagian 4.</li>
          <li>Softmax mengubah skor menjadi bobot yang berjumlah 100%.</li>
          <li>Value setiap kata dikalikan bobotnya, lalu semuanya dijumlahkan.</li>
        </ol>
        <p>
          Pilih “dia”: sekitar {fmt(RESULT.weights[DIA][KUCING] * 100, 0)}% perhatiannya jatuh ke “kucing”, sehingga hasilnya
          kini membawa ciri <strong>hewan</strong> sebesar {fmt(RESULT.out[DIA][0], 2)}. Vektor “dia” sudah “tahu” bahwa
          ia merujuk ke kucing. Semua kata menjalankan langkah yang sama secara bersamaan, jadi hasilnya adalah satu
          tabel bobot:
        </p>
      </div>
      <div className="card">
        <AttnGrid
          weights={RESULT.weights}
          tokens={TOKENS}
          theme={theme}
          selectedRow={sel}
          onSelectRow={setSel}
          ariaLabel="Tabel bobot perhatian untuk semua kata"
        />
        <p className="card-sub" style={{ marginTop: 10, marginBottom: 0 }}>
          Klik sebuah baris untuk memilih katanya. Perhatikan bahwa “kucing” di sini ikut melihat kata yang datang
          sesudahnya (“tidur”, “lelah”). Model seperti GPT melarang hal ini. Aturan itu dibahas di bab{' '}
          <a href="#/causal-mask">Causal Masking</a>.
        </p>
      </div>
      <Deep title="Untuk yang penasaran: dari mana query, key, dan value?">
        <p>
          Jika <Tex>{`x`}</Tex> adalah vektor sebuah kata (embedding + posisi), maka ketiganya dibuat dengan tiga
          perkalian matriks:
        </p>
        <Tex block>{`q = x\\,W_Q, \\qquad k = x\\,W_K, \\qquad v = x\\,W_V`}</Tex>
        <p>
          Tabel <Tex>{`W_Q, W_K, W_V`}</Tex> mula-mula diisi angka acak, lalu disesuaikan selama pelatihan, sama seperti
          tabel embedding. Di kode GPT-2, ketiganya dihitung sekaligus oleh satu lapisan (<code>c_attn</code>) yang
          menghasilkan vektor tiga kali lebih panjang, lalu dipotong menjadi q, k, dan v.
        </p>
      </Deep>
      <Takeaway>
        Attention = bandingkan query dengan semua key, ubah skornya menjadi bobot, lalu ambil campuran value sesuai
        bobot itu.
      </Takeaway>
    </section>
  )
}
