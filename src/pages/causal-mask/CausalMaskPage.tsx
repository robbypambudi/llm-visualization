import { chapterNumber } from '../../chapters'
import { BlockMap } from '../../components/BlockMap'
import { Takeaway } from '../../components/Prose'
import type { ChartTheme } from '../../lib/theme'
import { ExamplesSection } from './ExamplesSection'
import { HowToMaskSection } from './HowToMaskSection'
import { LeakSection } from './LeakSection'
import { TriangleSection } from './TriangleSection'
import { VariantsSection } from './VariantsSection'

export function CausalMaskPage({ theme }: { theme: ChartTheme }) {
  return (
    <article className="page">
      <header className="page-header">
        <div className="eyebrow">BAB {String(chapterNumber('causal-mask')).padStart(2, '0')} · TRANSFORMER BLOCK</div>
        <h1>Causal Masking</h1>
        <div className="header-split">
          <div>
            <p className="lede">
              Di bab Self-Attention, setiap token boleh melihat semua token lain. Untuk model yang menulis teks, itu
              masalah: token bisa mengintip kata yang seharusnya ia tebak. Bab ini membahas penutup sederhana yang
              mencegahnya, kenapa penutup itu justru membuat latihan jauh lebih efisien, dan cara memasangnya dengan
              benar.
            </p>
            <div className="pipeline" aria-label="Posisi bab ini di dalam attention">
              <a className="pipeline-step" href="#/self-attention">
                skor kueri · kunci
              </a>
              <span aria-hidden>→</span>
              <span className="pipeline-step pipeline-active">tutup masa depan</span>
              <span aria-hidden>→</span>
              <span className="pipeline-step">softmax → bobot</span>
            </div>
          </div>
          <BlockMap highlight={['attn']} caption="Masker dipasang di dalam kotak Self-Attention, tepat sebelum softmax." />
        </div>
        <div className="callout">
          <div className="card-title" style={{ marginBottom: 8 }}>
            Kosakata singkat
          </div>
          <dl className="glossary">
            <dt>Skor</dt>
            <dd>Angka hasil membandingkan kueri sebuah token dengan kunci token lain. Makin besar, makin cocok.</dd>
            <dt>Softmax</dt>
            <dd>Rumus yang mengubah deretan skor menjadi bobot positif yang jumlahnya 1.</dd>
            <dt>Bobot perhatian</dt>
            <dd>Seberapa besar sebuah token memperhatikan token lain. Seperti anggaran 100% yang dibagi-bagi.</dd>
            <dt>Masker causal</dt>
            <dd>Aturan bahwa setiap token hanya boleh melihat dirinya sendiri dan token sebelumnya.</dd>
          </dl>
        </div>
      </header>

      <LeakSection />
      <ExamplesSection theme={theme} />
      <HowToMaskSection theme={theme} />
      <TriangleSection theme={theme} />
      <VariantsSection />

      <section className="section" id="closing">
        <h2>
          <span className="section-num">6</span>Benang merah
        </h2>
        <div className="prose">
          <p>
            Masker causal hanyalah satu aturan kecil: <strong>jangan lihat ke depan</strong>. Tetapi aturan kecil ini
            punya tiga akibat besar. Model tidak bisa menyontek saat latihan. Satu kalimat berubah menjadi banyak soal
            latihan yang dikerjakan sekaligus. Dan hasil hitungan untuk token lama bisa disimpan saat menulis.
          </p>
          <p>
            Semua itu bersumber dari satu gagasan: latih model dalam keadaan yang sama dengan saat ia dipakai. Saat menulis,
            masa depan belum ada. Maka saat latihan, masa depan ditutup.
          </p>
          <p>
            Sejauh ini kita membayangkan satu attention saja. Model sungguhan menjalankan beberapa attention sekaligus,
            masing-masing dengan maskernya sendiri. Itu topik bab <a href="#/multi-head">Multi-Head Attention</a>.
          </p>
        </div>
        <Takeaway>Masker causal membuat cara model belajar sama dengan cara model menulis: selalu dari kiri ke kanan.</Takeaway>
      </section>

      <section className="section" id="refs">
        <h2>
          <span className="section-num">7</span>Referensi
        </h2>
        <ul className="refs">
          <li>
            Vaswani dkk. (2017). <a href="https://arxiv.org/abs/1706.03762">Attention Is All You Need</a> — §3.1 (decoder
            dicegah memperhatikan posisi sesudahnya), §3.2.3 (masker dengan −∞ di masukan softmax).
          </li>
          <li>
            OpenAI. <a href="https://github.com/openai/gpt-2/blob/master/src/model.py">gpt-2/src/model.py</a> —{' '}
            <code>attention_mask</code>, <code>mask_attn_weights</code> (<code>w*b - 1e10*(1-b)</code>), penyimpanan{' '}
            <code>past</code>, panjang konteks 1024.
          </li>
          <li>
            Devlin dkk. (2018).{' '}
            <a href="https://arxiv.org/abs/1810.04805">BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding</a>{' '}
            — konteks kiri dan kanan sekaligus.
          </li>
          <li>
            Hugging Face. <a href="https://huggingface.co/docs/transformers/model_doc/bert">Dokumentasi BERT</a> — latihan
            menebak token yang ditutup (<code>[MASK]</code>).
          </li>
        </ul>
      </section>
    </article>
  )
}
