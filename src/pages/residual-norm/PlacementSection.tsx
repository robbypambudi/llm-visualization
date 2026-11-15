import { Deep, Takeaway } from '../../components/Prose'
import { Tex } from '../../components/Tex'

const SX = 40
const BX = 92
const BW = 120
const MX = BX + BW / 2

/** Arrowheads in user units, so the thick residual line does not blow its head up. */
function Arrow({ id, streamOn = false }: { id: string; streamOn?: boolean }) {
  return (
    <defs>
      <marker id={id} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" markerUnits="userSpaceOnUse" orient="auto">
        <path d="M0,0 L8,4 L0,8 z" className="bm-arrowhead" />
      </marker>
      <marker id={`${id}-stream`} viewBox="0 0 8 8" refX="4" refY="4" markerWidth="16" markerHeight="16" markerUnits="userSpaceOnUse" orient="auto">
        <path d="M0,0 L8,4 L0,8 z" className={`bm-stream-head${streamOn ? ' bm-on' : ''}`} />
      </marker>
    </defs>
  )
}

/** Post-LN: the LayerNorm sits on the residual path itself, after the addition. */
function PostLnDiagram() {
  const id = 'rn-arrow-post'
  return (
    <svg viewBox="0 0 220 190" style={{ width: '100%', maxWidth: 260 }} role="img" aria-label="Diagram Post-LN">
      <Arrow id={id} />
      <line x1={SX} x2={SX} y1={10} y2={122} className="bm-stream" />
      <line x1={SX} x2={SX} y1={148} y2={172} className="bm-stream" markerEnd={`url(#${id}-stream)`} />
      <g className="bm-wire">
        <path d={`M${SX},26 H${MX} V40`} markerEnd={`url(#${id})`} />
        <path d={`M${MX},72 V92 H${SX + 12}`} markerEnd={`url(#${id})`} />
      </g>
      <g className="bm-box">
        <rect x={BX} y={42} width={BW} height={30} rx={8} />
        <text x={MX} y={61} textAnchor="middle" className="bm-title">
          sub-lapisan
        </text>
      </g>
      <g className="bm-add">
        <circle cx={SX} cy={92} r={11} />
        <text x={SX} y={97} textAnchor="middle">
          +
        </text>
      </g>
      <g className="bm-box bm-on">
        <rect x={SX - 34} y={120} width={68} height={28} rx={8} />
        <text x={SX} y={138} textAnchor="middle" className="bm-title">
          LN
        </text>
      </g>
    </svg>
  )
}

/** Pre-LN: the residual path stays untouched; LayerNorm only normalises the copy that enters the sub-layer. */
function PreLnDiagram() {
  const id = 'rn-arrow-pre'
  return (
    <svg viewBox="0 0 220 190" style={{ width: '100%', maxWidth: 260 }} role="img" aria-label="Diagram Pre-LN">
      <Arrow id={id} streamOn />
      <line x1={SX} x2={SX} y1={10} y2={172} className="bm-stream bm-on" markerEnd={`url(#${id}-stream)`} />
      <g className="bm-wire">
        <path d={`M${SX},22 H${MX} V34`} markerEnd={`url(#${id})`} />
        <path d={`M${MX},62 V74`} markerEnd={`url(#${id})`} />
        <path d={`M${MX},106 V138 H${SX + 12}`} markerEnd={`url(#${id})`} />
      </g>
      <g className="bm-box bm-on">
        <rect x={BX} y={36} width={BW} height={26} rx={8} />
        <text x={MX} y={53} textAnchor="middle" className="bm-title">
          LN
        </text>
      </g>
      <g className="bm-box">
        <rect x={BX} y={76} width={BW} height={30} rx={8} />
        <text x={MX} y={95} textAnchor="middle" className="bm-title">
          sub-lapisan
        </text>
      </g>
      <g className="bm-add">
        <circle cx={SX} cy={138} r={11} />
        <text x={SX} y={143} textAnchor="middle">
          +
        </text>
      </g>
    </svg>
  )
}

const MODELS = [
  { name: 'Transformer asli (2017)', where: 'setelah penjumlahan (Post-LN)', kind: 'LayerNorm' },
  { name: 'GPT-2 (2019)', where: 'sebelum tiap sub-lapisan (Pre-LN), plus satu di akhir', kind: 'LayerNorm' },
  { name: 'LLaMA (2023)', where: 'sebelum tiap sub-lapisan (Pre-LN)', kind: 'RMSNorm' },
]

export function PlacementSection() {
  return (
    <section className="section" id="placement">
      <h2>
        <span className="section-num">4</span>Di mana memasang norm? Post-LN dan Pre-LN
      </h2>
      <div className="prose">
        <p>
          Kita sekarang punya dua alat: jalur residual dan LayerNorm. Pertanyaan terakhir terdengar sepele: LayerNorm
          dipasang di mana? Ternyata letaknya sangat berpengaruh.
        </p>
      </div>
      <div className="grid-2">
        <div className="card">
          <div className="card-title">Post-LN (Transformer asli)</div>
          <div className="card-sub">Normalisasi dipasang di jalur utama, setelah hasil sub-lapisan ditambahkan.</div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <PostLnDiagram />
          </div>
          <Tex block>{`x_{baru} = \\mathrm{LN}\\big(x + \\mathrm{Sub}(x)\\big)`}</Tex>
        </div>
        <div className="card">
          <div className="card-title">Pre-LN (GPT-2, LLaMA)</div>
          <div className="card-sub">Normalisasi dipasang di cabang, sebelum masuk sub-lapisan. Jalur utama tetap bersih.</div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <PreLnDiagram />
          </div>
          <Tex block>{`x_{baru} = x + \\mathrm{Sub}\\big(\\mathrm{LN}(x)\\big)`}</Tex>
        </div>
      </div>
      <div className="prose" style={{ marginTop: 16 }}>
        <p>
          Paper Transformer (Vaswani dkk., 2017) memakai Post-LN. GPT-2 memindahkan LayerNorm ke <em>input</em> setiap
          sub-lapisan, dan menambahkan satu LayerNorm lagi setelah blok terakhir (paper GPT-2, §2.3). LLaMA juga
          menormalkan input setiap sub-lapisan, bukan outputnya.
        </p>
        <p>
          Filosofinya: di Pre-LN, <strong>jalan tol tetap bersih</strong>. Jalur residual dari input sampai output tidak
          melewati apa pun selain penjumlahan, jadi “angka 1” dari bagian 2 tetap utuh. Setiap sub-lapisan membaca salinan
          yang sudah dinormalkan, lalu menulis hasilnya kembali. Di Post-LN, semua yang lewat jalan tol harus melewati
          LayerNorm di setiap blok.
        </p>
        <p>
          Xiong dkk. (2020) meneliti perbedaan ini. Pada Post-LN, sinyal belajar di dekat output sangat besar di awal
          pelatihan, sehingga pelatihan butuh <em>warm-up</em>: langkah belajar dimulai sangat kecil lalu dinaikkan
          pelan-pelan. Pre-LN tidak punya masalah itu dan bisa dilatih tanpa warm-up, dengan hasil yang setara dan waktu
          pelatihan yang lebih singkat.
        </p>
        <p>
          Karena jalur residual di Pre-LN tidak pernah dinormalkan, angkanya bisa terus membesar (seperti di simulasi
          bagian 2). LayerNorm terakhir yang ditambahkan GPT-2 membuat hasil dari tumpukan blok kembali ke skala yang
          wajar sebelum dipakai untuk menebak token.
        </p>
      </div>
      <div className="table-scroll">
        <table className="table table-text">
          <thead>
            <tr>
              <th>Model</th>
              <th>Letak normalisasi</th>
              <th>Jenis</th>
            </tr>
          </thead>
          <tbody>
            {MODELS.map((m) => (
              <tr key={m.name}>
                <td>{m.name}</td>
                <td>{m.where}</td>
                <td>{m.kind}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="prose" style={{ marginTop: 16 }}>
        <p>Dengan semua potongan ini, satu blok gaya GPT-2 bisa ditulis dalam dua baris:</p>
      </div>
      <Tex block>{`\\begin{aligned} h &= x + \\mathrm{Attention}\\big(\\mathrm{LN}_1(x)\\big) \\\\ y &= h + \\mathrm{MLP}\\big(\\mathrm{LN}_2(h)\\big) \\end{aligned}`}</Tex>
      <div className="prose">
        <p>
          Persis seperti diagram di atas halaman ini, dan persis seperti fungsi <code>block</code> di kode asli GPT-2.
        </p>
      </div>
      <Deep title="Untuk yang penasaran: kode asli GPT-2">
        <p>Fungsi blok di <code>gpt-2/src/model.py</code> (disingkat):</p>
        <pre className="mono" style={{ fontSize: 12.5, overflowX: 'auto' }}>
          {`a, present = attn(norm(x, 'ln_1'), ...)
x = x + a
m = mlp(norm(x, 'ln_2'), ...)
x = x + m`}
        </pre>
        <p>
          Setelah semua blok, model memanggil <code>norm(h, 'ln_f')</code>: itulah LayerNorm terakhir.
        </p>
      </Deep>
      <Takeaway>
        Model modern memasang normalisasi di cabang (Pre-LN): jalur residual tetap bersih, dan setiap sub-lapisan membaca
        salinan yang sudah dinormalkan.
      </Takeaway>
    </section>
  )
}
