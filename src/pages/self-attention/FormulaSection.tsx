import { useState } from 'react'
import { Slider } from '../../components/Controls'
import { Deep, Takeaway } from '../../components/Prose'
import { Tex } from '../../components/Tex'
import { fmtCount } from '../token-embedding/format'

// GPT-2 small (openai/gpt-2 model.py default_hparams): n_ctx 1024, n_embd 768, n_head 12, n_layer 12.
const GPT2 = { ctx: 1024, d: 768, heads: 12, layers: 12 }

export function FormulaSection() {
  const [n, setN] = useState(1024)
  const perHead = n * n
  const total = perHead * GPT2.heads * GPT2.layers

  return (
    <section className="section" id="formula">
      <h2>
        <span className="section-num">5</span>Rumus lengkapnya
      </h2>
      <div className="prose">
        <p>
          Kalau semua kata dikerjakan sekaligus, langkah-langkah di bagian 3 bisa ditulis dalam satu baris. Query semua
          kata ditumpuk menjadi tabel <Tex>{`Q`}</Tex>, key menjadi <Tex>{`K`}</Tex>, dan value menjadi{' '}
          <Tex>{`V`}</Tex>:
        </p>
      </div>
      <Tex block>{`\\operatorname{Attention}(Q, K, V) = \\operatorname{softmax}\\!\\left(\\frac{Q K^\\top}{\\sqrt{d_k}}\\right) V`}</Tex>
      <div className="prose">
        <ul>
          <li>
            <Tex>{`QK^\\top`}</Tex> menghitung skor setiap pasangan kata sekaligus (tabel <em>n × n</em>, langkah 2).
          </li>
          <li>
            <Tex>{`/\\sqrt{d_k}`}</Tex> adalah langkah 3.
          </li>
          <li>Softmax dijalankan per baris (langkah 4), sehingga setiap baris berjumlah 1.</li>
          <li>
            Perkalian dengan <Tex>{`V`}</Tex> adalah langkah 5: setiap baris hasil adalah campuran value.
          </li>
        </ul>
        <p>
          Ini rumus (1) di paper “Attention Is All You Need” (Vaswani dkk., 2017). Paper itu memilih dot product karena
          jauh lebih cepat dan hemat memori dalam praktik dibanding alternatifnya, sebab bisa dikerjakan dengan perkalian
          matriks.
        </p>
      </div>

      <div className="attempt">
        <h3>Filosofinya: kamus yang “lembut”</h3>
        <div className="prose">
          <p>
            Kamus biasa bekerja dengan pencocokan pasti. Cari kata “kucing”, dan kamu mendapat tepat satu entri. Kalau
            kuncinya tidak cocok persis, kamu tidak dapat apa-apa.
          </p>
          <p>
            Attention adalah kamus yang lembut. Query dibandingkan dengan <strong>semua</strong> key, dan kamu mendapat{' '}
            <strong>campuran</strong> semua value, ditimbang sesuai kecocokannya. Karena tidak ada keputusan
            “ya/tidak” yang patah, setiap bobot bisa digeser sedikit demi sedikit. Itulah yang membuat attention bisa
            dipelajari.
          </p>
        </div>
      </div>

      <div className="attempt">
        <h3>Harganya: setiap kata melihat setiap kata</h3>
        <div className="prose">
          <p>
            Tabel skor berukuran <em>n × n</em>. Kalimat dua kali lebih panjang berarti tabel empat kali lebih besar.
            Geser panjang teks dan lihat berapa skor yang harus dihitung di GPT-2 small (12 lapisan, masing-masing 12
            head; head dibahas di bab <a href="#/multi-head">Multi-Head Attention</a>).
          </p>
        </div>
        <div className="card">
          <Slider label="panjang teks (token)" value={n} min={16} max={GPT2.ctx} step={16} onChange={setN} />
          <div className="stat-row">
            <div className="stat">
              <span className="stat-label">skor per head</span>
              <span className="stat-value">{fmtCount(perHead)}</span>
            </div>
            <div className="stat">
              <span className="stat-label">skor di seluruh model</span>
              <span className="stat-value">{fmtCount(total)}</span>
            </div>
          </div>
          <p className="card-sub" style={{ marginTop: 12, marginBottom: 0 }}>
            GPT-2 bisa membaca paling banyak {GPT2.ctx} token sekaligus. Hitungan: n² × 12 head × 12 lapisan.
          </p>
        </div>
      </div>

      <Deep title="Untuk yang penasaran: ukuran setiap tabel">
        <p>
          Untuk <Tex>{`n`}</Tex> token dengan vektor sepanjang <Tex>{`d_{model}`}</Tex>, dan query/key sepanjang{' '}
          <Tex>{`d_k`}</Tex>:
        </p>
        <Tex block>{`X \\in \\mathbb{R}^{n \\times d_{model}}, \\quad Q = XW_Q,\\; K = XW_K \\in \\mathbb{R}^{n \\times d_k}, \\quad V = XW_V \\in \\mathbb{R}^{n \\times d_v}`}</Tex>
        <Tex block>{`QK^\\top \\in \\mathbb{R}^{n \\times n}, \\qquad \\operatorname{softmax}(\\cdot)\\,V \\in \\mathbb{R}^{n \\times d_v}`}</Tex>
        <p>
          Di GPT-2 small, <Tex>{`d_{model} = 768`}</Tex> dan setiap head memakai <Tex>{`d_k = d_v = 64`}</Tex> (768 dibagi
          12 head).
        </p>
      </Deep>
      <Takeaway>
        Seluruh self-attention adalah satu rumus: softmax(QKᵀ/√d_k)·V. Kekuatannya, setiap kata bisa melihat semua kata.
        Harganya, biayanya tumbuh dengan kuadrat panjang teks.
      </Takeaway>
    </section>
  )
}
