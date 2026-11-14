import { chapterNumber } from '../../chapters'
import { Takeaway } from '../../components/Prose'
import { BpeSection } from './BpeSection'
import { LanguageSection } from './LanguageSection'
import { QuirksSection } from './QuirksSection'
import { RealTokenizerSection } from './RealTokenizerSection'
import { SchemesSection } from './SchemesSection'
import { VariantsSection } from './VariantsSection'
import { WhyTokens } from './WhyTokens'

export function TokenizationPage() {
  return (
    <article className="page">
      <header className="page-header">
        <div className="eyebrow">BAB {String(chapterNumber('tokenization')).padStart(2, '0')} · INPUT</div>
        <h1>Tokenization</h1>
        <p className="lede">
          Langkah pertama sebuah LLM: memotong teks menjadi potongan-potongan kecil bernama token, lalu memberi setiap
          potongan sebuah nomor. Bab ini membahas kenapa teks perlu dipotong, kenapa potongannya bukan huruf atau kata, dan
          bagaimana kamus token dibangun dari data.
        </p>
        <div className="pipeline" aria-label="Alur: teks, token, ID token, vektor">
          <span className="pipeline-step pipeline-active">teks</span>
          <span aria-hidden>→</span>
          <span className="pipeline-step pipeline-active">token</span>
          <span aria-hidden>→</span>
          <span className="pipeline-step pipeline-active">ID token</span>
          <span aria-hidden>→</span>
          <a className="pipeline-step" href="#/token-embedding">
            vektor (bab 2)
          </a>
        </div>
        <div className="callout">
          <div className="card-title" style={{ marginBottom: 8 }}>
            Kosakata singkat
          </div>
          <dl className="glossary">
            <dt>Token</dt>
            <dd>Satu potongan teks. Bisa berupa satu kata utuh, sebagian kata, satu tanda baca, atau bahkan sepotong byte.</dd>
            <dt>Kamus</dt>
            <dd>Daftar semua token yang dikenal model. Dalam istilah teknis disebut <em>vocabulary</em>.</dd>
            <dt>ID token</dt>
            <dd>Nomor urut sebuah token di dalam kamus. Inilah yang sebenarnya diterima model.</dd>
            <dt>Tokenizer</dt>
            <dd>Program yang memotong teks menjadi token dan mengubahnya menjadi ID, atau sebaliknya.</dd>
          </dl>
        </div>
      </header>

      <WhyTokens />
      <SchemesSection />
      <BpeSection />
      <RealTokenizerSection />
      <LanguageSection />
      <QuirksSection />
      <VariantsSection />

      <section className="section" id="closing">
        <h2>
          <span className="section-num">8</span>Benang merah
        </h2>
        <div className="prose">
          <p>
            Tokenisasi adalah sebuah <strong>kompromi</strong>. Potongan yang terlalu kecil membuat urutan panjang dan
            mahal. Potongan yang terlalu besar membuat kamus meledak dan kata baru tidak dikenali. Subword yang dipelajari
            dengan BPE berada di tengah-tengah.
          </p>
          <p>
            Keputusan ini diambil <strong>sekali, sebelum model mulai belajar</strong>, lalu dibekukan. Setelah itu model
            hanya bisa melihat bahasa lewat potongan-potongan tersebut. Karena itu tokenizer ikut menentukan banyak hal:
            biaya, panjang konteks, keadilan antarbahasa, sampai kemampuan mengeja dan berhitung.
          </p>
          <p>
            Sampai di sini, kalimat sudah berubah menjadi deretan ID. Tetapi ID hanyalah nomor urut di kamus. Nomor 1000
            tidak “lebih mirip” dengan 1001 daripada dengan 5. Bab berikutnya, <a href="#/token-embedding">Token Embedding</a>,
            membahas bagaimana setiap ID diubah menjadi vektor yang punya makna.
          </p>
        </div>
        <Takeaway>Tokenizer menentukan cara model melihat bahasa, bahkan sebelum model belajar apa pun.</Takeaway>
      </section>

      <section className="section" id="refs">
        <h2>
          <span className="section-num">9</span>Referensi
        </h2>
        <ul className="refs">
          <li>
            Sennrich, Haddow &amp; Birch (2016).{' '}
            <a href="https://arxiv.org/abs/1508.07909">Neural Machine Translation of Rare Words with Subword Units</a> — BPE
            untuk subword.
          </li>
          <li>Gage (1994). A New Algorithm for Data Compression. C Users Journal — asal-usul BPE sebagai algoritma kompresi.</li>
          <li>
            Radford dkk. (2019).{' '}
            <a href="https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf">
              Language Models are Unsupervised Multitask Learners
            </a>{' '}
            — GPT-2, BPE level byte (§2.2).
          </li>
          <li>
            Petrov dkk. (2023).{' '}
            <a href="https://arxiv.org/abs/2305.15425">Language Model Tokenizers Introduce Unfairness Between Languages</a>.
            NeurIPS 2023.
          </li>
          <li>
            Kudo &amp; Richardson (2018). <a href="https://arxiv.org/abs/1808.06226">SentencePiece</a>; Kudo (2018).{' '}
            <a href="https://arxiv.org/abs/1804.10959">Subword Regularization</a> (Unigram).
          </li>
          <li>
            Hugging Face —{' '}
            <a href="https://huggingface.co/docs/transformers/tokenizer_summary">Tokenization algorithms</a> (BPE, byte-level
            BPE, WordPiece, Unigram).
          </li>
          <li>
            Meta (2024). <a href="https://ai.meta.com/blog/meta-llama-3/">Introducing Meta Llama 3</a> — kamus 128K.
          </li>
          <li>
            Pustaka <a href="https://github.com/niieani/gpt-tokenizer">gpt-tokenizer</a> (v4.1.0) — tokenizer r50k_base
            (GPT-2) dan o200k_base (GPT-4o) yang dijalankan di halaman ini.
          </li>
        </ul>
      </section>
    </article>
  )
}
