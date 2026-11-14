import { useState } from 'react'
import { Segmented } from '../../components/Controls'
import { Takeaway } from '../../components/Prose'
import { TokenChips } from '../../components/TokenChips'
import { ENCODING_LABEL, useTokenizer, type EncodingName } from '../../lib/tokenizer'

const EXAMPLES = [
  'Saya sedang belajar cara kerja model bahasa.',
  'I am learning how language models work.',
  'Selamat pagi! Apa kabar? 🙂',
  'def add(a, b):\n    return a + b',
]

export function RealTokenizerSection() {
  const [enc, setEnc] = useState<EncodingName>('r50k_base')
  const [text, setText] = useState(EXAMPLES[0])
  const [showIds, setShowIds] = useState(true)
  const tok = useTokenizer(enc)
  const ids = tok ? tok.encode(text) : []
  const chars = Array.from(text).length

  return (
    <section className="section" id="real">
      <h2>
        <span className="section-num">4</span>Mencoba tokenizer GPT yang asli
      </h2>
      <div className="prose">
        <p>
          Sekarang kita pakai tokenizer yang benar-benar dipakai model GPT. Kamu bisa memilih <strong>GPT-2</strong>{' '}
          (2019, kamus 50257 token) atau <strong>GPT-4o</strong> (2024, kamus sekitar 200 ribu token). Keduanya memakai
          BPE dengan byte sebagai bahan dasar, persis seperti di bagian 3, hanya jauh lebih besar.
        </p>
        <p>
          Setiap kotak berwarna adalah satu token. Angka kecil di bawahnya adalah ID token, yaitu nomor yang benar-benar
          diterima model.
        </p>
      </div>
      <div className="card">
        <div className="controls" style={{ marginBottom: 12 }}>
          <Segmented
            ariaLabel="Tokenizer"
            value={enc}
            options={(['r50k_base', 'o200k_base'] as const).map((v) => ({ value: v, label: ENCODING_LABEL[v] }))}
            onChange={setEnc}
          />
          <Segmented
            ariaLabel="Tampilkan ID"
            value={showIds ? 'id' : 'text'}
            options={[
              { value: 'id', label: 'dengan ID' },
              { value: 'text', label: 'teks saja' },
            ]}
            onChange={(v) => setShowIds(v === 'id')}
          />
        </div>
        <textarea className="text-area" value={text} onChange={(e) => setText(e.target.value)} aria-label="Teks untuk ditokenisasi" />
        <div className="chip-row" style={{ margin: '8px 0 14px' }}>
          <span className="muted-text" style={{ alignSelf: 'center' }}>
            contoh:
          </span>
          {EXAMPLES.map((ex) => (
            <button key={ex} type="button" className="btn btn-sm" onClick={() => setText(ex)}>
              {ex.split('\n')[0].slice(0, 24)}
              {ex.length > 24 ? '…' : ''}
            </button>
          ))}
        </div>
        {tok ? <TokenChips ids={ids} tok={tok} showIds={showIds} /> : <span className="muted-text">Memuat tokenizer…</span>}
        <div className="stat-row">
          <div className="stat">
            <span className="stat-label">karakter</span>
            <span className="stat-value">{chars}</span>
          </div>
          <div className="stat">
            <span className="stat-label">token</span>
            <span className="stat-value">{tok ? ids.length : '—'}</span>
          </div>
          <div className="stat">
            <span className="stat-label">rata-rata karakter per token</span>
            <span className="stat-value">{tok && ids.length ? (chars / ids.length).toFixed(2) : '—'}</span>
          </div>
          <div className="stat">
            <span className="stat-label">ukuran kamus</span>
            <span className="stat-value">{tok ? tok.vocabularySize : '—'}</span>
          </div>
        </div>
        <p className="card-sub" style={{ marginTop: 12, marginBottom: 0 }}>
          · = spasi, ↵ = baris baru. Kotak bertuliskan ‹byte› adalah sepotong byte dari satu karakter yang dipecah ke
          beberapa token, biasanya emoji atau aksara yang jarang muncul di data latih.
        </p>
      </div>
      <div className="prose" style={{ marginTop: 16 }}>
        <p>Beberapa hal yang bisa kamu perhatikan:</p>
        <ul>
          <li>Spasi biasanya menempel di depan kata, bukan berdiri sendiri.</li>
          <li>Kata bahasa Inggris yang umum sering utuh menjadi satu token, sedangkan kata bahasa Indonesia lebih sering dipecah.</li>
          <li>GPT-4o umumnya butuh lebih sedikit token untuk teks yang sama, karena kamusnya jauh lebih besar.</li>
        </ul>
      </div>
      <Takeaway>
        Kalimat yang kamu ketik di ChatGPT diubah dulu menjadi deretan ID seperti ini. Model tidak pernah melihat
        teksnya, hanya angka-angka itu.
      </Takeaway>
    </section>
  )
}
