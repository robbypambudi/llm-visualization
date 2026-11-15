import { useState } from 'react'
import { Field, Segmented, Slider } from '../../components/Controls'
import { Takeaway } from '../../components/Prose'
import { TOKENS } from './toy'

type Mode = 'mask' | 'nomask'

type State = 'current' | 'seen' | 'answer-hidden' | 'answer-leaked' | 'hidden' | 'leaked'

const STATE_LABEL: Record<State, string> = {
  current: 'posisi ini',
  seen: 'boleh dilihat',
  'answer-hidden': 'harus ditebak',
  'answer-leaked': 'jawaban bocor!',
  hidden: 'tertutup',
  leaked: 'ikut terlihat',
}

function chipStyle(s: State): React.CSSProperties {
  switch (s) {
    case 'current':
      return { background: 'var(--accent-soft)', outline: '2px solid var(--accent)', outlineOffset: -2 }
    case 'seen':
      return { background: 'var(--accent-soft)' }
    case 'answer-hidden':
      return { background: 'transparent', outline: '1.5px dashed var(--text-secondary)', outlineOffset: -1.5 }
    case 'answer-leaked':
      return { background: 'color-mix(in srgb, var(--div-pos) 28%, transparent)', outline: '2px solid var(--div-pos)', outlineOffset: -2 }
    case 'leaked':
      return { background: 'color-mix(in srgb, var(--div-pos) 14%, transparent)' }
    case 'hidden':
      return { background: 'transparent', outline: '1px dashed var(--border)', outlineOffset: -1, opacity: 0.55 }
  }
}

export function LeakSection() {
  const [t, setT] = useState(2)
  const [mode, setMode] = useState<Mode>('mask')
  const masked = mode === 'mask'

  const stateOf = (j: number): State => {
    if (j === t) return 'current'
    if (j < t) return 'seen'
    if (j === t + 1) return masked ? 'answer-hidden' : 'answer-leaked'
    return masked ? 'hidden' : 'leaked'
  }

  return (
    <section className="section" id="leak">
      <h2>
        <span className="section-num">1</span>Ujian dengan kunci jawaban di sebelahnya
      </h2>
      <div className="prose">
        <p>
          LLM dilatih dengan satu tugas: <strong>menebak token berikutnya</strong>. Saat latihan, satu kalimat utuh
          dimasukkan sekaligus. Token di posisi 0 harus menebak token di posisi 1, token di posisi 1 harus menebak posisi
          2, dan seterusnya.
        </p>
        <p>
          Di sinilah masalahnya. Self-attention membuat setiap token bisa melihat <em>semua</em> token lain di kalimat,
          termasuk token di sebelah kanannya. Padahal token di sebelah kanan itulah jawabannya. Ini seperti ujian dengan
          kunci jawaban tergeletak di meja.
        </p>
        <p>Geser posisinya, lalu coba matikan masker.</p>
      </div>
      <div className="card">
        <div className="controls">
          <Slider
            label="posisi yang sedang menebak"
            value={t}
            min={0}
            max={TOKENS.length - 2}
            onChange={setT}
            format={(v) => `${v} (“${TOKENS[v]}”)`}
          />
          <Field label="masker">
            <div className="segmented-wrap">
              <Segmented
                ariaLabel="Masker causal"
                value={mode}
                options={[
                  { value: 'mask', label: 'dengan masker' },
                  { value: 'nomask', label: 'tanpa masker' },
                ]}
                onChange={setMode}
              />
            </div>
          </Field>
        </div>
        <div className="tok-chips" style={{ marginTop: 16, fontSize: 14.5 }}>
          {TOKENS.map((w, j) => {
            const s = stateOf(j)
            const showText = !(s === 'answer-hidden' || s === 'hidden')
            return (
              <span key={j} className="tok" style={{ ...chipStyle(s), minWidth: 64 }} title={STATE_LABEL[s]}>
                <span className="tok-text">{showText ? w : '?'}</span>
                <span className="tok-id">
                  {j} · {STATE_LABEL[s]}
                </span>
              </span>
            )
          })}
        </div>
        <div className="stat-row">
          <div className="stat">
            <span className="stat-label">yang boleh dilihat</span>
            <span className="stat-value">
              {masked ? t + 1 : TOKENS.length} dari {TOKENS.length} token
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">yang harus ditebak</span>
            <span className="stat-value">“{TOKENS[t + 1]}”</span>
          </div>
        </div>
        <p className="card-sub" style={{ marginTop: 12, marginBottom: 0 }}>
          {masked
            ? `Dengan masker, posisi ${t} hanya bisa melihat dirinya dan token sebelumnya. Untuk menebak “${TOKENS[t + 1]}”, model harus benar-benar memahami awal kalimat.`
            : `Tanpa masker, jawabannya (“${TOKENS[t + 1]}”) ikut terlihat. Model cukup menyalin token di sebelah kanan, dan nilai latihannya jadi sempurna tanpa belajar apa-apa.`}
        </p>
      </div>
      <div className="prose" style={{ marginTop: 16 }}>
        <p>
          Kenapa menyontek itu buruk? Karena saat model dipakai untuk menulis, token berikutnya <strong>belum ada</strong>.
          Model yang terbiasa menyalin dari kanan akan kebingungan ketika di kanannya kosong. Jadi saat latihan, kita
          harus menutup masa depan, persis seperti keadaan saat menulis sungguhan. Penutup inilah yang disebut{' '}
          <strong>masker causal</strong> (causal mask). Paper Transformer menyebutnya sebagai cara untuk mencegah setiap
          posisi memperhatikan posisi sesudahnya (Vaswani dkk., 2017, §3.1).
        </p>
        <p className="card-sub">
          Kalimat di sini dipotong per kata supaya mudah dibaca. Tokenizer sungguhan akan memotongnya dengan cara lain.
        </p>
      </div>
      <Takeaway>Masker causal menutup token-token sesudahnya, supaya model tidak bisa menyontek jawaban saat latihan.</Takeaway>
    </section>
  )
}
