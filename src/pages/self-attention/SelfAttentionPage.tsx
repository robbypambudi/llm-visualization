import { chapterNumber } from '../../chapters'
import { BlockMap } from '../../components/BlockMap'
import { Takeaway } from '../../components/Prose'
import type { ChartTheme } from '../../lib/theme'
import { ContextSection } from './ContextSection'
import { DesignSection } from './DesignSection'
import { FormulaSection } from './FormulaSection'
import { ScaleSection } from './ScaleSection'
import { StepSection } from './StepSection'

export function SelfAttentionPage({ theme }: { theme: ChartTheme }) {
  return (
    <article className="page">
      <header className="page-header">
        <div className="eyebrow">BAB {String(chapterNumber('self-attention')).padStart(2, '0')} · TRANSFORMER BLOCK</div>
        <h1>Self-Attention (Q, K, V)</h1>
        <div className="header-split">
          <div>
            <p className="lede">
              Setelah embedding dan posisi, setiap token punya satu vektor. Tetapi vektor itu belum tahu apa-apa tentang
              kata lain di kalimat. Bab ini membahas mekanisme yang membuat kata-kata bisa saling “melihat”:
              self-attention, bagian paling terkenal dari Transformer.
            </p>
            <p className="lede" style={{ marginTop: 12 }}>
              Satu blok Transformer berisi dua bagian utama: attention dan feed-forward, masing-masing dibungkus jalur
              residual dan normalisasi. Blok ini diulang berkali-kali. Bab ini dan dua bab sesudahnya membahas kotak
              attention.
            </p>
          </div>
          <BlockMap highlight={['attn']} caption="Satu blok gaya GPT-2. Klik kotaknya untuk membuka babnya." />
        </div>
        <div className="callout">
          <div className="card-title" style={{ marginBottom: 8 }}>
            Kosakata singkat
          </div>
          <dl className="glossary">
            <dt>Query (kueri)</dt>
            <dd>Vektor yang mewakili “aku sedang mencari apa?”.</dd>
            <dt>Key (kunci)</dt>
            <dd>Vektor yang mewakili “aku bisa menawarkan apa?”.</dd>
            <dt>Value (nilai)</dt>
            <dd>Informasi yang diserahkan sebuah kata ketika ia dipilih.</dd>
            <dt>Skor</dt>
            <dd>Angka kecocokan antara satu query dan satu key, dihitung dengan dot product.</dd>
            <dt>Softmax</dt>
            <dd>Cara mengubah deretan skor menjadi bobot positif yang jumlahnya 1.</dd>
            <dt>Bobot perhatian</dt>
            <dd>Seberapa besar sebuah kata mengambil informasi dari kata lain, misalnya 70%.</dd>
          </dl>
        </div>
      </header>

      <ContextSection />
      <DesignSection theme={theme} />
      <StepSection theme={theme} />
      <ScaleSection theme={theme} />
      <FormulaSection />

      <section className="section" id="closing">
        <h2>
          <span className="section-num">6</span>Benang merah
        </h2>
        <div className="prose">
          <p>
            Sebuah kata tidak punya arti yang lengkap kalau berdiri sendiri. Self-attention memberi setiap kata cara untuk
            bertanya ke kata-kata lain, memilih yang relevan, dan mengambil informasinya. Pilihan itu tidak ditulis oleh
            manusia. Model mempelajarinya sendiri lewat tabel <em>W_Q</em>, <em>W_K</em>, dan <em>W_V</em>.
          </p>
          <p>
            Ada dua hal yang belum dibahas. Pertama, model penulis teks seperti GPT tidak boleh mengintip kata yang belum
            ditulis. Itu dibahas di bab <a href="#/causal-mask">Causal Masking</a>. Kedua, satu kata sering butuh beberapa
            jenis informasi sekaligus. Itu dibahas di bab <a href="#/multi-head">Multi-Head Attention</a>.
          </p>
        </div>
        <Takeaway>Self-attention adalah cara kata-kata “berdiskusi”: setiap kata memperbarui dirinya dengan mendengarkan kata lain.</Takeaway>
      </section>

      <section className="section" id="refs">
        <h2>
          <span className="section-num">7</span>Referensi
        </h2>
        <ul className="refs">
          <li>
            Vaswani dkk. (2017). <a href="https://arxiv.org/abs/1706.03762">Attention Is All You Need</a> — rumus (1),
            §3.2.1 (pembagian √d<sub>k</sub> dan catatan kaki 4 tentang varians), perbandingan dengan additive attention.
          </li>
          <li>
            OpenAI. <a href="https://github.com/openai/gpt-2/blob/master/src/model.py">gpt-2/src/model.py</a> —
            hiperparameter GPT-2 small (n_ctx 1024, n_embd 768, n_head 12, n_layer 12), lapisan <code>c_attn</code> untuk
            q, k, v, dan pembagian dengan √d<sub>k</sub> di <code>multihead_attn</code>.
          </li>
        </ul>
      </section>
    </article>
  )
}
