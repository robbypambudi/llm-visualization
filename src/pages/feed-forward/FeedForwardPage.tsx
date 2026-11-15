import { chapterNumber } from '../../chapters'
import { BlockMap } from '../../components/BlockMap'
import { Takeaway } from '../../components/Prose'
import { Tex } from '../../components/Tex'
import type { ChartTheme } from '../../lib/theme'
import { ActivationSection } from './ActivationSection'
import { NonlinearSection } from './NonlinearSection'
import { RoleSection } from './RoleSection'
import { WidthSection } from './WidthSection'

export function FeedForwardPage({ theme }: { theme: ChartTheme }) {
  return (
    <article className="page">
      <header className="page-header">
        <div className="eyebrow">BAB {String(chapterNumber('feed-forward')).padStart(2, '0')} · TRANSFORMER BLOCK</div>
        <h1>Feed-Forward (MLP)</h1>
        <div className="header-split">
          <div>
            <p className="lede">
              Attention mengumpulkan informasi dari token-token lain. Tetapi informasi yang terkumpul masih perlu diolah.
              Bagian kedua setiap blok, yaitu feed-forward network atau MLP, melakukan pengolahan itu, satu token demi satu
              token. Bab ini membahas kenapa MLP butuh fungsi aktivasi, kenapa bentuknya melebar lalu menyempit, dan
              kenapa di sinilah sebagian besar bobot model berada.
            </p>
          </div>
          <BlockMap highlight={['mlp']} caption="Bab ini: kotak Feed-Forward (MLP), bagian kedua setiap blok." />
        </div>
        <div className="callout">
          <div className="card-title" style={{ marginBottom: 8 }}>
            Kosakata singkat
          </div>
          <dl className="glossary">
            <dt>Linear</dt>
            <dd>Hanya perkalian dan penjumlahan. Grafiknya selalu garis lurus.</dd>
            <dt>Fungsi aktivasi</dt>
            <dd>Fungsi tidak lurus yang disisipkan di antara dua lapisan, misalnya ReLU atau GELU.</dd>
            <dt>Neuron</dt>
            <dd>Satu angka di lapisan tengah MLP. Bisa dibayangkan sebagai satu pendeteksi pola.</dd>
            <dt>Bobot</dt>
            <dd>Angka-angka di dalam matriks yang dipelajari selama pelatihan.</dd>
          </dl>
        </div>
      </header>

      <RoleSection />
      <NonlinearSection theme={theme} />
      <ActivationSection theme={theme} />
      <WidthSection theme={theme} />

      <section className="section" id="closing">
        <h2>
          <span className="section-num">5</span>Benang merah: satu blok Transformer utuh
        </h2>
        <div className="prose">
          <p>Dengan bab ini, semua bagian satu blok Transformer sudah kita bahas:</p>
          <ul>
            <li>
              <a href="#/self-attention">Self-attention</a>: setiap token bertanya ke token lain dan mengambil informasi
              yang relevan.
            </li>
            <li>
              <a href="#/causal-mask">Causal masking</a>: token hanya boleh melihat token sebelumnya, supaya model tidak
              mencontek kata berikutnya.
            </li>
            <li>
              <a href="#/multi-head">Multi-head attention</a>: beberapa “pertanyaan” diajukan sekaligus, masing-masing oleh
              kepala yang berbeda.
            </li>
            <li>
              <a href="#/residual-norm">Residual &amp; LayerNorm</a>: setiap bagian hanya menambahkan catatan ke jalur
              residual, dan angkanya dijaga tetap wajar.
            </li>
            <li>Feed-forward (bab ini): setiap token mengolah informasi yang baru ia kumpulkan.</li>
          </ul>
          <p>Di GPT-2, satu blok ditulis dalam dua baris:</p>
        </div>
        <Tex block>{`\\begin{aligned} x &\\leftarrow x + \\text{Attention}(\\text{LN}_1(x)) \\\\ x &\\leftarrow x + \\text{MLP}(\\text{LN}_2(x)) \\end{aligned}`}</Tex>
        <div className="prose">
          <p>
            Blok yang sama bentuknya ditumpuk berkali-kali, masing-masing dengan bobotnya sendiri: 12 kali di GPT-2 small
            dan 32 kali di LLaMA 3 8B. Setiap putaran berisi dua langkah yang sama: berdiskusi, lalu berpikir. Sedikit demi
            sedikit, vektor setiap token berubah dari “kata apa ini” menjadi “apa arti kata ini di kalimat ini, dan apa yang
            kemungkinan datang berikutnya”.
          </p>
          <p>
            Setelah blok terakhir, vektor di posisi paling akhir diubah menjadi skor untuk setiap token di kamus. Itu
            dibahas di bab berikutnya, <a href="#/logits">Unembedding &amp; Logits</a>.
          </p>
        </div>
        <Takeaway>Satu blok Transformer = berdiskusi (attention) lalu berpikir (MLP), masing-masing menambahkan catatan ke jalur residual. Ulangi puluhan kali.</Takeaway>
      </section>

      <section className="section" id="refs">
        <h2>
          <span className="section-num">6</span>Referensi
        </h2>
        <ul className="refs">
          <li>
            Vaswani dkk. (2017). <a href="https://arxiv.org/abs/1706.03762">Attention Is All You Need</a> — §3.3 (FFN
            dengan ReLU, d<sub>model</sub> = 512, d<sub>ff</sub> = 2048).
          </li>
          <li>
            OpenAI. <a href="https://github.com/openai/gpt-2/blob/master/src/model.py">gpt-2/src/model.py</a> — fungsi{' '}
            <code>gelu</code> (pendekatan tanh), <code>mlp</code> dengan lebar 4 × n_embd, dan susunan <code>block</code>.
          </li>
          <li>
            Hendrycks &amp; Gimpel (2016). <a href="https://arxiv.org/abs/1606.08415">Gaussian Error Linear Units (GELUs)</a>.
          </li>
          <li>
            Shazeer (2020). <a href="https://arxiv.org/abs/2002.05202">GLU Variants Improve Transformer</a> — GLU dan SwiGLU.
          </li>
          <li>
            Touvron dkk. (2023). <a href="https://arxiv.org/abs/2302.13971">LLaMA: Open and Efficient Foundation Language Models</a>{' '}
            — §2.2 (SwiGLU, lebar 2/3 · 4d).
          </li>
          <li>
            <a href="https://huggingface.co/NousResearch/Meta-Llama-3-8B/blob/main/config.json">Konfigurasi LLaMA 3 8B</a> —
            hidden_size 4096, intermediate_size 14336, hidden_act silu, 32 lapisan, 8 kepala kunci–nilai.
          </li>
          <li>
            Geva dkk. (2021). <a href="https://arxiv.org/abs/2012.14913">Transformer Feed-Forward Layers Are Key-Value Memories</a>.
          </li>
        </ul>
      </section>
    </article>
  )
}
