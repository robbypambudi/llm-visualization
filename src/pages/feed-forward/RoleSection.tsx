import { Takeaway } from '../../components/Prose'

const TOKENS = ['kucing', 'itu', 'sedang', 'tidur']
const COL_X = [54, 136, 218, 300]
const W = 354
const CHIP_W = 70

function Chip({ x, y, label, active }: { x: number; y: number; label: string; active?: boolean }) {
  return (
    <g>
      <rect
        x={x - CHIP_W / 2}
        y={y}
        width={CHIP_W}
        height={24}
        rx={6}
        style={{ fill: active ? 'var(--accent-soft)' : 'var(--surface-2)', stroke: active ? 'var(--accent)' : 'var(--border)' }}
      />
      <text x={x} y={y + 16} textAnchor="middle" style={{ fontSize: 12, fill: 'var(--text-primary)' }}>
        {label}
      </text>
    </g>
  )
}

/** Attention mixes across columns (only leftwards, as in a causal model); the MLP is one identical box per column. */
function RoleDiagram() {
  return (
    <svg viewBox={`0 0 ${W} 250`} style={{ width: '100%', maxWidth: 440 }} role="img" aria-label="Attention menghubungkan token, MLP mengolah tiap token sendiri">
      <text x={W / 2} y={14} textAnchor="middle" className="axis-label">
        Attention: token saling bertukar informasi
      </text>
      {TOKENS.map((t, i) => (
        <Chip key={t} x={COL_X[i]} y={24} label={t} />
      ))}
      {COL_X.flatMap((xi, i) =>
        COL_X.slice(0, i + 1).map((xj, j) => (
          <line key={`${i}-${j}`} x1={xj} y1={50} x2={xi} y2={90} style={{ stroke: 'var(--axis)', strokeWidth: 1.5 }} />
        )),
      )}
      {COL_X.map((x, i) => (
        <circle key={i} cx={x} cy={96} r={6} style={{ fill: 'var(--series-1)' }} />
      ))}
      <text x={W / 2} y={128} textAnchor="middle" className="axis-label">
        MLP: setiap token diolah sendiri-sendiri
      </text>
      {COL_X.map((x, i) => (
        <g key={i}>
          <line x1={x} y1={103} x2={x} y2={140} style={{ stroke: 'var(--axis)', strokeWidth: 1.5 }} />
          <Chip x={x} y={140} label="MLP" active />
          <line x1={x} y1={164} x2={x} y2={190} style={{ stroke: 'var(--axis)', strokeWidth: 1.5 }} />
          <circle cx={x} cy={196} r={6} style={{ fill: 'var(--series-3)' }} />
        </g>
      ))}
      <text x={W / 2} y={228} textAnchor="middle" className="axis-label">
        empat kotak MLP itu memakai bobot yang sama persis
      </text>
    </svg>
  )
}

export function RoleSection() {
  return (
    <section className="section" id="role">
      <h2>
        <span className="section-num">1</span>Attention berbagi, MLP memproses
      </h2>
      <div className="prose">
        <p>
          Di bab-bab sebelumnya, attention membuat setiap token bisa “bertanya” ke token lain dan mengambil informasinya.
          Ibaratnya rapat: semua peserta saling bertukar kabar. Tetapi setelah rapat, setiap orang perlu waktu untuk{' '}
          <strong>mencerna</strong> apa yang baru ia dengar. Itulah tugas <strong>feed-forward network</strong>, yang
          sering disebut MLP (<em>multi-layer perceptron</em>).
        </p>
        <p>Ada dua perbedaan penting antara keduanya:</p>
        <ul>
          <li>
            <strong>Attention bekerja antar token.</strong> Informasi berpindah dari satu posisi ke posisi lain.
          </li>
          <li>
            <strong>MLP bekerja di dalam satu token.</strong> Setiap vektor diolah sendiri, tanpa melihat tetangganya. Dan
            semua posisi memakai MLP yang sama, seperti satu resep yang dipakai untuk setiap piring.
          </li>
        </ul>
      </div>
      <div className="card" style={{ display: 'flex', justifyContent: 'center' }}>
        <RoleDiagram />
      </div>
      <div className="prose" style={{ marginTop: 16 }}>
        <p>
          Kenapa dipisah seperti ini? Karena dua pekerjaan itu memang berbeda. Mengumpulkan informasi butuh melihat ke
          sekeliling. Mengolah informasi yang sudah terkumpul cukup dilakukan di tempat. Dengan memisahkannya, setiap
          bagian bisa fokus pada satu pekerjaan.
        </p>
      </div>
      <Takeaway>Attention adalah waktu berdiskusi. MLP adalah waktu berpikir sendiri, dengan cara berpikir yang sama untuk setiap token.</Takeaway>
    </section>
  )
}
