import { useState } from 'react'
import { Takeaway } from '../../components/Prose'
import { useTokenizer, type Tokenizer } from '../../lib/tokenizer'

interface Pair {
  en: string
  id: string
}

const PAIRS: Pair[] = [
  { en: 'The children are playing football in the park.', id: 'Anak-anak sedang bermain sepak bola di taman.' },
  { en: 'I would like to order a cup of hot coffee, please.', id: 'Saya ingin memesan secangkir kopi panas.' },
  { en: 'Artificial intelligence is changing the way we work.', id: 'Kecerdasan buatan sedang mengubah cara kita bekerja.' },
  {
    en: 'The government announced a new policy to reduce traffic congestion.',
    id: 'Pemerintah mengumumkan kebijakan baru untuk mengurangi kemacetan lalu lintas.',
  },
]

function Bar({ value, max }: { value: number; max: number }) {
  return (
    <span className="bar-cell">
      <span className="mono">{value}</span>
      <span className="bar" style={{ width: `${(value / max) * 64}px` }} aria-hidden />
    </span>
  )
}

const count = (tok: Tokenizer | null, s: string) => (tok ? tok.encode(s).length : 0)

export function LanguageSection() {
  const gpt2 = useTokenizer('r50k_base')
  const gpt4o = useTokenizer('o200k_base')
  const [custom, setCustom] = useState<Pair>({ en: 'Where is the nearest train station?', id: 'Di mana stasiun kereta terdekat?' })
  const rows = [...PAIRS, custom]
  const ready = gpt2 && gpt4o

  const totals = rows.reduce(
    (t, r) => ({
      en2: t.en2 + count(gpt2, r.en),
      id2: t.id2 + count(gpt2, r.id),
      en4: t.en4 + count(gpt4o, r.en),
      id4: t.id4 + count(gpt4o, r.id),
    }),
    { en2: 0, id2: 0, en4: 0, id4: 0 },
  )
  const max = Math.max(1, ...rows.flatMap((r) => [gpt2, gpt4o].flatMap((t) => [count(t, r.en), count(t, r.id)])))
  const ratio = (a: number, b: number) => (b ? (a / b).toFixed(2) : '—')

  return (
    <section className="section" id="language">
      <h2>
        <span className="section-num">5</span>Tidak semua bahasa diperlakukan sama
      </h2>
      <div className="prose">
        <p>
          Kamus BPE dibangun dari teks latihan. Potongan yang sering muncul di teks itu mendapat token sendiri. Kalau teks
          latihannya didominasi bahasa Inggris, kata-kata bahasa Inggris lebih sering utuh, sementara kata dari bahasa
          lain lebih sering dipecah menjadi banyak potongan.
        </p>
        <p>
          Tabel di bawah menghitung token untuk kalimat yang artinya sama dalam bahasa Inggris dan bahasa Indonesia. Baris
          terakhir bisa kamu isi sendiri.
        </p>
      </div>
      <div className="card">
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Kalimat</th>
                <th>GPT-2</th>
                <th>GPT-4o</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const isCustom = i === rows.length - 1
                return [
                  <tr key={`${i}en`} className="row-pair-start">
                    <td>
                      <span className="lang-tag">EN</span>
                      {isCustom ? (
                        <input
                          className="text-input inline-input"
                          value={r.en}
                          onChange={(e) => setCustom({ ...custom, en: e.target.value })}
                          aria-label="Kalimat bahasa Inggris"
                        />
                      ) : (
                        r.en
                      )}
                    </td>
                    <td>{ready && <Bar value={count(gpt2, r.en)} max={max} />}</td>
                    <td>{ready && <Bar value={count(gpt4o, r.en)} max={max} />}</td>
                  </tr>,
                  <tr key={`${i}id`}>
                    <td>
                      <span className="lang-tag">ID</span>
                      {isCustom ? (
                        <input
                          className="text-input inline-input"
                          value={r.id}
                          onChange={(e) => setCustom({ ...custom, id: e.target.value })}
                          aria-label="Kalimat bahasa Indonesia"
                        />
                      ) : (
                        r.id
                      )}
                    </td>
                    <td>{ready && <Bar value={count(gpt2, r.id)} max={max} />}</td>
                    <td>{ready && <Bar value={count(gpt4o, r.id)} max={max} />}</td>
                  </tr>,
                ]
              })}
            </tbody>
          </table>
        </div>
        {ready ? (
          <div className="stat-row">
            <div className="stat">
              <span className="stat-label">GPT-2 · token Indonesia ÷ token Inggris</span>
              <span className="stat-value">{ratio(totals.id2, totals.en2)}×</span>
            </div>
            <div className="stat">
              <span className="stat-label">GPT-4o · token Indonesia ÷ token Inggris</span>
              <span className="stat-value">{ratio(totals.id4, totals.en4)}×</span>
            </div>
          </div>
        ) : (
          <p className="muted-text">Memuat tokenizer…</p>
        )}
        <p className="card-sub" style={{ marginTop: 12, marginBottom: 0 }}>
          Angka di atas 1× berarti versi Indonesia butuh lebih banyak token daripada versi Inggris untuk arti yang sama.
          Rasio dihitung dari total semua baris.
        </p>
      </div>
      <div className="prose" style={{ marginTop: 16 }}>
        <p>Kenapa jumlah token penting? Karena token adalah “satuan” dalam LLM:</p>
        <ul>
          <li>Layanan AI berbayar menghitung biaya per token.</li>
          <li>Makin banyak token, makin lama jawabannya dibuat.</li>
          <li>Batas konteks model dihitung dalam token, jadi teks yang boros token lebih cepat memenuhi batas itu.</li>
        </ul>
        <p>
          Petrov dkk. (2023) membandingkan banyak bahasa dan menemukan bahwa teks yang sama bisa butuh token hingga 15 kali
          lebih banyak, tergantung bahasanya. Selisih ini sudah ada sejak tokenisasi, sebelum model menghitung apa pun.
        </p>
      </div>
      <Takeaway>
        Tokenizer bukan alat yang netral. Ia dibentuk oleh data latihnya, dan pilihan itu ikut menentukan siapa yang
        membayar lebih mahal.
      </Takeaway>
    </section>
  )
}
