import { chapterNumber } from '../../chapters'
import { BlockMap } from '../../components/BlockMap'
import { Takeaway } from '../../components/Prose'
import type { ChartTheme } from '../../lib/theme'
import { DepthSection } from './DepthSection'
import { NormSection } from './NormSection'
import { PlacementSection } from './PlacementSection'
import { ResidualSection } from './ResidualSection'

export function ResidualNormPage({ theme }: { theme: ChartTheme }) {
  return (
    <article className="page">
      <header className="page-header">
        <div className="eyebrow">BAB {String(chapterNumber('residual-norm')).padStart(2, '0')} · TRANSFORMER BLOCK</div>
        <h1>Residual &amp; LayerNorm</h1>
        <div className="header-split">
          <div>
            <p className="lede">
              Attention dan MLP adalah bagian blok yang “berpikir”. Bab ini membahas dua bagian yang sering terlewat,
              padahal tanpa keduanya model yang dalam hampir mustahil dilatih: jalur residual, yang membawa informasi
              lurus melewati setiap lapisan, dan normalisasi, yang menjaga angka-angkanya tetap dalam skala wajar.
            </p>
          </div>
          <BlockMap
            highlight={['stream', 'add', 'ln']}
            caption="Satu blok gaya GPT-2. Yang disorot: jalur residual, penjumlahan (+), dan LayerNorm."
          />
        </div>
        <div className="callout">
          <div className="card-title" style={{ marginBottom: 8 }}>
            Kosakata singkat
          </div>
          <dl className="glossary">
            <dt>Lapisan / blok</dt>
            <dd>Satu tahap pengolahan. LLM menumpuk puluhan blok yang bentuknya sama.</dd>
            <dt>Jalur residual</dt>
            <dd>Jalan pintas yang membawa vektor melewati sebuah lapisan, lalu hasil lapisan ditambahkan ke vektor itu.</dd>
            <dt>Gradien</dt>
            <dd>Sinyal belajar: petunjuk ke arah mana setiap bobot harus digeser supaya tebakan model membaik.</dd>
            <dt>Rata-rata dan simpangan baku</dt>
            <dd>Titik tengah sekumpulan angka, dan seberapa jauh angka-angka itu menyebar dari titik tengahnya.</dd>
            <dt>Normalisasi</dt>
            <dd>Mengubah sekumpulan angka ke skala standar, misalnya berpusat di nol dengan sebaran 1.</dd>
          </dl>
        </div>
      </header>

      <DepthSection />
      <ResidualSection theme={theme} />
      <NormSection theme={theme} />
      <PlacementSection />

      <section className="section" id="closing">
        <h2>
          <span className="section-num">5</span>Benang merah
        </h2>
        <div className="prose">
          <p>
            Dua alat di bab ini tidak membuat model lebih pintar secara langsung. Keduanya membuat model yang dalam{' '}
            <strong>bisa dilatih</strong>. Jalur residual memastikan tidak ada lapisan yang menghapus pekerjaan lapisan
            sebelumnya, dan memberi sinyal belajar jalan tol untuk kembali ke lapisan awal. Normalisasi memastikan setiap
            sub-lapisan menerima angka dalam skala yang sama, berapa pun banyaknya catatan yang sudah menumpuk.
          </p>
          <p>
            Hasilnya adalah gambaran yang sederhana: sebuah papan tulis bersama yang mengalir dari blok ke blok. Setiap
            attention dan MLP membaca salinan papan yang sudah dirapikan, lalu menambahkan catatannya sendiri. Bab
            berikutnya membahas salah satu penulis catatan itu: <a href="#/feed-forward">Feed-Forward (MLP)</a>.
          </p>
        </div>
        <Takeaway>Residual menjaga informasi tetap mengalir, normalisasi menjaga angkanya tetap wajar.</Takeaway>
      </section>

      <section className="section" id="refs">
        <h2>
          <span className="section-num">6</span>Referensi
        </h2>
        <ul className="refs">
          <li>
            He dkk. (2015). <a href="https://arxiv.org/abs/1512.03385">Deep Residual Learning for Image Recognition</a> —
            ResNet, jalur residual, 152 lapisan.
          </li>
          <li>
            Ba, Kiros &amp; Hinton (2016). <a href="https://arxiv.org/abs/1607.06450">Layer Normalization</a>.
          </li>
          <li>
            Zhang &amp; Sennrich (2019). <a href="https://arxiv.org/abs/1910.07467">Root Mean Square Layer Normalization</a>{' '}
            — RMSNorm, waktu komputasi turun 7%–64%.
          </li>
          <li>
            Xiong dkk. (2020). <a href="https://arxiv.org/abs/2002.04745">On Layer Normalization in the Transformer Architecture</a>{' '}
            — Post-LN vs Pre-LN, warm-up.
          </li>
          <li>
            Elhage dkk. (2021). <a href="https://transformer-circuits.pub/2021/framework/index.html">A Mathematical Framework for Transformer Circuits</a>{' '}
            — residual stream.
          </li>
          <li>
            Vaswani dkk. (2017). <a href="https://arxiv.org/abs/1706.03762">Attention Is All You Need</a> — §3.1,
            LayerNorm(x + Sublayer(x)).
          </li>
          <li>
            Radford dkk. (2019).{' '}
            <a href="https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf">
              Language Models are Unsupervised Multitask Learners
            </a>{' '}
            — §2.3 (LayerNorm dipindah ke input sub-blok, LayerNorm tambahan, skala 1/√N), Tabel 2.
          </li>
          <li>
            OpenAI. <a href="https://github.com/openai/gpt-2/blob/master/src/model.py">gpt-2/src/model.py</a> — fungsi{' '}
            <code>norm</code> (ε = 10⁻⁵), <code>block</code>, <code>ln_f</code>.
          </li>
          <li>
            Touvron dkk. (2023). <a href="https://arxiv.org/abs/2302.13971">LLaMA: Open and Efficient Foundation Language Models</a>{' '}
            — §2.2, pre-normalization dengan RMSNorm.
          </li>
          <li>
            <a href="https://huggingface.co/NousResearch/Meta-Llama-3-8B/blob/main/config.json">Konfigurasi LLaMA 3 8B</a>{' '}
            — 32 lapisan, panjang vektor 4096, rms_norm_eps.
          </li>
        </ul>
      </section>
    </article>
  )
}
