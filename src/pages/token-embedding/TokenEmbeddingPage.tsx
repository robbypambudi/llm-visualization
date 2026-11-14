import { chapterNumber } from '../../chapters'
import { Deep, Takeaway } from '../../components/Prose'
import { Tex } from '../../components/Tex'
import type { ChartTheme } from '../../lib/theme'
import { IdSection } from './IdSection'
import { LookupSection } from './LookupSection'
import { SimilaritySection } from './SimilaritySection'
import { SizeSection } from './SizeSection'
import { TrainingSection } from './TrainingSection'

export function TokenEmbeddingPage({ theme }: { theme: ChartTheme }) {
  return (
    <article className="page">
      <header className="page-header">
        <div className="eyebrow">BAB {String(chapterNumber('token-embedding')).padStart(2, '0')} · INPUT</div>
        <h1>Token Embedding</h1>
        <p className="lede">
          Setelah tokenisasi, kalimat menjadi deretan ID. Bab ini membahas langkah berikutnya: mengubah setiap ID menjadi
          vektor, yaitu deretan angka yang bisa membawa makna. Kita akan melihat kenapa ID saja tidak cukup, bagaimana
          tabel embedding bekerja, dan bagaimana makna muncul dari angka acak.
        </p>
        <div className="pipeline" aria-label="Alur: teks, token, ID token, vektor">
          <a className="pipeline-step" href="#/tokenization">
            teks → token → ID (bab 1)
          </a>
          <span aria-hidden>→</span>
          <span className="pipeline-step pipeline-active">vektor embedding</span>
          <span aria-hidden>→</span>
          <a className="pipeline-step" href="#/positional-encoding">
            + posisi (bab 3)
          </a>
        </div>
        <div className="callout">
          <div className="card-title" style={{ marginBottom: 8 }}>
            Kosakata singkat
          </div>
          <dl className="glossary">
            <dt>Vektor</dt>
            <dd>Deretan angka, misalnya [0.2, −1.3, 0.7].</dd>
            <dt>Embedding</dt>
            <dd>Vektor yang mewakili sebuah token. Token yang mirip idealnya punya embedding yang mirip.</dd>
            <dt>Tabel embedding</dt>
            <dd>Tabel berisi satu embedding untuk setiap token di kamus. Barisnya sebanyak ukuran kamus.</dd>
            <dt>Pelatihan</dt>
            <dd>Proses menggeser angka-angka di dalam model sedikit demi sedikit agar tebakannya makin tepat.</dd>
          </dl>
        </div>
      </header>

      <IdSection theme={theme} />
      <LookupSection theme={theme} />
      <TrainingSection theme={theme} />
      <SimilaritySection theme={theme} />
      <SizeSection />

      <section className="section" id="tying">
        <h2>
          <span className="section-num">6</span>Satu tabel untuk membaca dan menulis
        </h2>
        <div className="prose">
          <p>
            Di akhir model, LLM harus memilih token berikutnya. Caranya: hasil akhir model dibandingkan dengan embedding{' '}
            <strong>setiap</strong> token di kamus, dan token yang paling cocok mendapat skor tertinggi. Bandingkan dengan
            apa? Banyak model memakai tabel embedding yang sama dengan di awal.
          </p>
          <p>
            GPT-2 melakukannya: kode aslinya menghitung skor akhir dengan mengalikan hasil model dengan tabel embedding
            input (<code>wte</code>). Paper Transformer juga berbagi tabel yang sama (Vaswani dkk., 2017, §3.4). Press dan
            Wolf (2017) menunjukkan cara ini menurunkan <em>perplexity</em> (ukuran seberapa “bingung” model) dan
            menghemat banyak bobot.
          </p>
          <p>
            Filosofinya sederhana: kamus yang dipakai untuk <strong>membaca</strong> sebuah kata juga dipakai untuk{' '}
            <strong>menulisnya</strong>. Tetapi ini pilihan, bukan keharusan. LLaMA 3, misalnya, memakai tabel output
            yang terpisah.
          </p>
        </div>
        <Deep title="Untuk yang penasaran: rumusnya">
          <p>
            Misalkan <Tex>{`h`}</Tex> adalah vektor hasil lapisan terakhir untuk satu posisi. Dengan tabel bersama, skor
            (logit) untuk semua token dihitung sebagai
          </p>
          <Tex block>{`\\text{logits} = h \\, E^\\top \\quad\\in \\mathbb{R}^{V}`}</Tex>
          <p>
            Skor untuk token ke-<Tex>{`j`}</Tex> adalah dot product <Tex>{`h \\cdot E[j]`}</Tex>, yaitu seberapa searah{' '}
            <Tex>{`h`}</Tex> dengan embedding token itu. Bab Unembedding &amp; Logits akan membahasnya lebih jauh.
          </p>
        </Deep>
        <Takeaway>Tabel embedding sering dipakai dua kali: untuk mengubah ID menjadi vektor, dan untuk memilih kata berikutnya.</Takeaway>
      </section>

      <section className="section" id="next">
        <h2>
          <span className="section-num">7</span>Setelah embedding: masih ada yang kurang
        </h2>
        <div className="prose">
          <p>
            Ada satu masalah. Kata “kucing” selalu mengambil baris yang sama, di posisi mana pun ia berada. Jadi “anjing
            menggigit kucing” dan “kucing menggigit anjing” menghasilkan kumpulan vektor yang sama, hanya urutannya
            berbeda, dan attention tidak bisa melihat urutan.
          </p>
          <p>
            Karena itu, sebelum masuk ke blok Transformer, setiap embedding ditambah dengan tanda posisi. Paper Transformer
            juga mengalikan embedding dengan <Tex>{`\\sqrt{d_{model}}`}</Tex> sebelum penjumlahan itu, sedangkan GPT-2
            langsung menjumlahkan embedding token dengan embedding posisi tanpa perkalian. Detailnya ada di bab{' '}
            <a href="#/positional-encoding">Positional Encoding</a>.
          </p>
        </div>
        <Tex block>{`x_{pos} = E[\\text{token}_{pos}] + P[pos]`}</Tex>
        <Takeaway>Embedding menjawab “kata apa ini?”. Positional encoding menjawab “di mana letaknya?”.</Takeaway>
      </section>

      <section className="section" id="closing">
        <h2>
          <span className="section-num">8</span>Benang merah
        </h2>
        <div className="prose">
          <p>
            ID token hanyalah label. Embedding mengubah label itu menjadi sesuatu yang bisa dihitung dan dibandingkan.
            Yang menarik, tidak ada yang menulis makna ke dalam tabel itu. Tabelnya mulai dari angka acak, lalu makna
            terbentuk sendiri karena model terus dipaksa menebak kata berikutnya.
          </p>
          <p>
            Ini adalah gagasan lama dari ilmu bahasa yang akhirnya bisa dihitung: <strong>kata dikenal dari
            konteksnya</strong>. Kata yang muncul di lingkungan yang mirip akhirnya punya vektor yang mirip.
          </p>
        </div>
        <Takeaway>Makna dalam LLM bukan diberikan, tetapi dipelajari dari cara kata-kata dipakai bersama.</Takeaway>
      </section>

      <section className="section" id="refs">
        <h2>
          <span className="section-num">9</span>Referensi
        </h2>
        <ul className="refs">
          <li>Firth, J. R. (1957). A Synopsis of Linguistic Theory 1930–1955 — sumber kutipan “company it keeps”.</li>
          <li>
            Mikolov dkk. (2013). <a href="https://arxiv.org/abs/1301.3781">Efficient Estimation of Word Representations in Vector Space</a>{' '}
            — word2vec, contoh king − man + woman.
          </li>
          <li>
            Press &amp; Wolf (2017). <a href="https://arxiv.org/abs/1608.05859">Using the Output Embedding to Improve Language Models</a>{' '}
            — berbagi tabel input dan output.
          </li>
          <li>
            Vaswani dkk. (2017). <a href="https://arxiv.org/abs/1706.03762">Attention Is All You Need</a> — §3.4 (berbagi
            bobot, perkalian √d<sub>model</sub>).
          </li>
          <li>
            OpenAI. <a href="https://github.com/openai/gpt-2/blob/master/src/model.py">gpt-2/src/model.py</a> — wte
            (inisialisasi simpangan baku 0.02), penjumlahan wte + wpe, logits = h · wteᵀ.
          </li>
          <li>
            Konfigurasi model di Hugging Face:{' '}
            <a href="https://huggingface.co/openai-community/gpt2/blob/main/config.json">GPT-2</a>,{' '}
            <a href="https://huggingface.co/google-bert/bert-base-uncased/blob/main/config.json">BERT-base</a>,{' '}
            <a href="https://huggingface.co/NousResearch/Meta-Llama-3-8B/blob/main/config.json">LLaMA 3 8B</a> (kamus,
            panjang vektor, tie_word_embeddings).
          </li>
        </ul>
      </section>
    </article>
  )
}
