import { useState } from 'react'
import { Segmented } from '../../components/Controls'
import { ColorBar, Heatmap } from '../../components/Heatmap'
import { Takeaway } from '../../components/Prose'
import { softmax } from '../../lib/transformer'
import type { ChartTheme } from '../../lib/theme'
import { fmt } from '../positional-encoding/state'

const TOKENS = ['Pak', 'Budi', 'membeli', 'kopi', '.', 'Pak', 'Budi', 'membeli']
const N = TOKENS.length
const STRONG = 5

type Pattern = 'prev' | 'induction' | 'uniform'

/** Which earlier token each row "wants" to look at, per illustrative head. null = no preference (uniform). */
const TARGET: Record<Pattern, (i: number) => number | null> = {
  prev: (i) => Math.max(0, i - 1),
  induction: (i) => {
    // Find an earlier copy of the current token; look at the token right after it.
    for (let j = i - 1; j >= 0; j--) if (TOKENS[j] === TOKENS[i] && j + 1 < i) return j + 1
    return 0
  },
  uniform: () => null,
}

const DESCRIPTION: Record<Pattern, string> = {
  prev: 'Setiap token melihat token tepat sebelumnya. Pola sederhana ini berguna, misalnya untuk tahu kata apa yang baru saja lewat.',
  induction:
    'Token mencari kemunculan dirinya sendiri di belakang, lalu melihat token yang datang sesudahnya. “membeli” yang kedua melihat ke “kopi”, sehingga model terdorong menebak “kopi” lagi. Token yang belum pernah muncul sebelumnya, dalam ilustrasi ini, melihat token pertama.',
  uniform: 'Pembanding: perhatian dibagi rata ke semua token yang boleh dilihat. Tidak ada yang diutamakan.',
}

/** Causal weights from hand-designed scores: masked cells are NaN so the heatmap greys them out. */
function weightsFor(p: Pattern): Float64Array {
  const out = new Float64Array(N * N).fill(NaN)
  for (let i = 0; i < N; i++) {
    const t = TARGET[p](i)
    const w = softmax(Array.from({ length: i + 1 }, (_, j) => (t === j ? STRONG : 0)))
    w.forEach((v, j) => (out[i * N + j] = v))
  }
  return out
}

export function PatternsSection({ theme }: { theme: ChartTheme }) {
  const [pattern, setPattern] = useState<Pattern>('induction')
  const [row, setRow] = useState(7)
  const W = weightsFor(pattern)
  const rowW = Array.from({ length: row + 1 }, (_, j) => W[row * N + j])
  const top = rowW.indexOf(Math.max(...rowW))

  return (
    <section className="section" id="patterns">
      <h2>
        <span className="section-num">3</span>Apa yang dipelajari kepala-kepala itu?
      </h2>
      <div className="prose">
        <p>
          Tidak ada yang memberi tahu kepala mana harus mencari apa. Setiap kepala mulai dari angka acak, lalu
          “spesialisasinya” terbentuk sendiri selama pelatihan. Peneliti kemudian membongkar model yang sudah jadi dan
          menemukan beberapa pola yang sering muncul.
        </p>
        <p>
          Salah satu yang paling terkenal adalah <strong>induction head</strong> (Olsson dkk., 2022). Kepala ini mencari
          kemunculan sebelumnya dari token yang sedang dibaca, lalu memperhatikan token yang datang sesudahnya. Kalau
          dulu “Pak Budi” diikuti “membeli kopi”, saat “Pak Budi membeli” muncul lagi, kepala ini menunjuk ke “kopi”.
          Para penelitinya mengaitkan kepala jenis ini dengan kemampuan model belajar dari contoh di dalam prompt.
        </p>
      </div>
      <div className="card">
        <div className="segmented-wrap">
          <Segmented
            ariaLabel="Pola kepala"
            value={pattern}
            options={[
              { value: 'prev', label: 'kata sebelumnya' },
              { value: 'induction', label: 'induction head' },
              { value: 'uniform', label: 'rata (pembanding)' },
            ]}
            onChange={setPattern}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
          <div className="card-title">Bobot perhatian: baris = token yang bertanya</div>
          <ColorBar scale={theme.diverging} min="0" max="1" positiveOnly />
        </div>
        <Heatmap
          data={W}
          rows={N}
          cols={N}
          vmax={1}
          scale={theme.diverging}
          height={N * 30}
          xLabel="token yang dilihat (posisi) →"
          yLabel="token yang bertanya"
          rowLabels={TOKENS.map((t, i) => `${i} · ${t}`)}
          selectedRow={row}
          onCellClick={(r) => setRow(r)}
          nanRgb={theme.surface2Rgb}
          ariaLabel="Heatmap pola perhatian satu kepala"
          tooltip={(r, c) => (
            <>
              <div className="tt-row">
                <span className="muted">bertanya → dilihat</span>
                <span className="mono">
                  “{TOKENS[r]}” ({r}) → “{TOKENS[c]}” ({c})
                </span>
              </div>
              <div className="tt-row">
                <span className="muted">bobot</span>
                <strong className="mono">{c > r ? 'tertutup (masa depan)' : fmt(W[r * N + c], 3)}</strong>
              </div>
            </>
          )}
        />
        <div className="row-label">
          Baris {row} (“{TOKENS[row]}”) paling banyak melihat:
        </div>
        <div className="tok-chips">
          {TOKENS.map((t, i) => (
            <span
              key={i}
              className={`tok${i === top && pattern !== 'uniform' ? ' tok-special' : ''}`}
              style={i > row ? { opacity: 0.35 } : undefined}
            >
              <span className="tok-text">{t}</span>
              <span className="tok-id">{i <= row ? fmt(W[row * N + i], 2) : '—'}</span>
            </span>
          ))}
        </div>
        <p className="card-sub" style={{ marginTop: 12, marginBottom: 0 }}>
          {DESCRIPTION[pattern]} Klik sebuah baris untuk memilihnya. Kotak abu-abu adalah token masa depan yang
          ditutup oleh causal mask. Ini ilustrasi dengan skor buatan tangan, bukan bobot dari model sungguhan.
        </p>
      </div>
      <div className="prose" style={{ marginTop: 16 }}>
        <p>
          Jangan bayangkan setiap kepala selalu punya tugas yang rapi. Banyak kepala sulit ditafsirkan, dan tidak semua
          kepala sama pentingnya. Michel dkk. (2019) menemukan bahwa banyak kepala bisa dibuang setelah pelatihan tanpa
          menurunkan kinerja secara berarti, bahkan beberapa lapisan cukup dengan satu kepala saja.
        </p>
        <p>
          Filosofinya: multi-head memberi model <em>ruang</em> untuk berspesialisasi, bukan memaksanya. Model sendiri
          yang menentukan seberapa banyak ruang itu terpakai.
        </p>
      </div>
      <Takeaway>
        Setiap kepala belajar polanya sendiri dari data. Sebagian mudah dikenali, seperti “lihat kata sebelumnya” atau
        induction head, sebagian lagi masih misteri.
      </Takeaway>
    </section>
  )
}
