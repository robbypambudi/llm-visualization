import { chapterNumber } from '../../chapters'
import { BlockMap } from '../../components/BlockMap'
import { Takeaway } from '../../components/Prose'
import type { ChartTheme } from '../../lib/theme'
import { BudgetSection } from './BudgetSection'
import { GqaSection } from './GqaSection'
import { PatternsSection } from './PatternsSection'
import { SplitSection } from './SplitSection'

export function MultiHeadPage({ theme }: { theme: ChartTheme }) {
  return (
    <article className="page">
      <header className="page-header">
        <div className="eyebrow">BAB {String(chapterNumber('multi-head')).padStart(2, '0')} · TRANSFORMER BLOCK</div>
        <h1>Multi-Head Attention</h1>
        <div className="header-split">
          <div>
            <p className="lede">
              Satu attention hanya bisa memperhatikan satu hal pada satu waktu. Bab ini membahas kenapa model memakai
              beberapa attention sekaligus, yang disebut kepala (<em>head</em>), bagaimana vektor dibagi ke
              kepala-kepala itu tanpa menambah biaya, pola apa yang dipelajari setiap kepala, dan bagaimana model modern
              menghemat memori dengan berbagi kunci dan nilai.
            </p>
            <div className="pipeline" aria-label="Alur bab attention">
              <a className="pipeline-step" href="#/self-attention">
                self-attention
              </a>
              <span aria-hidden>→</span>
              <a className="pipeline-step" href="#/causal-mask">
                causal mask
              </a>
              <span aria-hidden>→</span>
              <span className="pipeline-step pipeline-active">multi-head</span>
            </div>
          </div>
          <BlockMap highlight={['attn']} caption="Multi-head terjadi di dalam kotak Self-Attention." />
        </div>
        <div className="callout">
          <div className="card-title" style={{ marginBottom: 8 }}>
            Kosakata singkat
          </div>
          <dl className="glossary">
            <dt>Kepala (head)</dt>
            <dd>Satu attention lengkap dengan kueri, kunci, dan nilainya sendiri.</dd>
            <dt>Kueri, kunci, nilai</dt>
            <dd>Apa yang dicari sebuah token, label yang ditawarkan token lain, dan isi yang diserahkan.</dd>
            <dt>Bobot perhatian</dt>
            <dd>Seberapa besar sebuah token memperhatikan token lain. Jumlahnya selalu 1 (100%).</dd>
            <dt>Concatenate</dt>
            <dd>Menyambung beberapa vektor menjadi satu vektor yang lebih panjang, berdampingan.</dd>
          </dl>
        </div>
      </header>

      <BudgetSection theme={theme} />
      <SplitSection />
      <PatternsSection theme={theme} />
      <GqaSection />

      <section className="section" id="closing">
        <h2>
          <span className="section-num">5</span>Benang merah
        </h2>
        <div className="prose">
          <p>
            Attention memberi setiap token cara untuk mengambil informasi dari token lain. Tetapi satu attention hanya
            punya satu jatah perhatian, dan apa pun yang diambilnya akan dijumlahkan menjadi satu vektor. Multi-head
            memecahkan masalah itu dengan cara yang sederhana: <strong>bagi pekerjaannya</strong>. Beberapa kepala
            bertanya dengan caranya masing-masing, hasilnya disusun berdampingan, lalu dicampur oleh satu matriks
            terakhir.
          </p>
          <p>
            Yang menarik, ini hampir gratis. Vektor yang sama hanya dipotong-potong, jadi jumlah bobot dan perhitungannya
            tetap. Dan karena kunci dan nilai bisa dipakai bersama (GQA, MQA), model modern bisa menulis teks yang sangat
            panjang tanpa kehabisan memori.
          </p>
        </div>
        <Takeaway>Lebih baik beberapa kepala dengan pertanyaan berbeda daripada satu kepala yang harus memperhatikan semuanya.</Takeaway>
      </section>

      <section className="section" id="refs">
        <h2>
          <span className="section-num">6</span>Referensi
        </h2>
        <ul className="refs">
          <li>
            Vaswani dkk. (2017). <a href="https://arxiv.org/abs/1706.03762">Attention Is All You Need</a> — §3.2.2
            (multi-head, h = 8, 64 angka per kepala, biaya setara satu kepala).
          </li>
          <li>
            OpenAI. <a href="https://github.com/openai/gpt-2/blob/master/src/model.py">gpt-2/src/model.py</a> —
            n_head = 12, n_embd = 768, <code>c_attn</code>, <code>split_heads</code>, <code>c_proj</code>.
          </li>
          <li>
            Olsson dkk. (2022).{' '}
            <a href="https://transformer-circuits.pub/2022/in-context-learning-and-induction-heads/index.html">
              In-context Learning and Induction Heads
            </a>
            .
          </li>
          <li>
            Michel, Levy &amp; Neubig (2019). <a href="https://arxiv.org/abs/1905.10650">Are Sixteen Heads Really Better than One?</a>
          </li>
          <li>
            Shazeer (2019). <a href="https://arxiv.org/abs/1911.02150">Fast Transformer Decoding: One Write-Head is All You Need</a>{' '}
            — multi-query attention.
          </li>
          <li>
            Ainslie dkk. (2023). <a href="https://arxiv.org/abs/2305.13245">GQA: Training Generalized Multi-Query Transformer Models from Multi-Head Checkpoints</a>
            .
          </li>
          <li>
            <a href="https://huggingface.co/NousResearch/Meta-Llama-3-8B/blob/main/config.json">Konfigurasi LLaMA 3 8B</a>{' '}
            — 32 lapisan, hidden 4096, 32 kepala, 8 kepala KV, konteks 8192, bfloat16.
          </li>
        </ul>
      </section>
    </article>
  )
}
