import { useState } from 'react'
import { Takeaway } from '../../components/Prose'
import { TokenChips } from '../../components/TokenChips'
import { useTokenizer } from '../../lib/tokenizer'

const EOT_ID = 50256

export function VariantsSection() {
  const gpt2 = useTokenizer('r50k_base')
  const gpt4o = useTokenizer('o200k_base')
  const [text, setText] = useState('Selesai.<|endoftext|>Cerita baru dimulai.')

  return (
    <section className="section" id="variants">
      <h2>
        <span className="section-num">7</span>Token spesial dan tokenizer lain
      </h2>
      <div className="attempt" style={{ marginTop: 0 }}>
        <h3>Token spesial</h3>
        <div className="prose">
          <p>
            Selain potongan teks, kamus juga berisi beberapa <strong>token spesial</strong> yang tidak pernah muncul dari
            teks biasa. GPT-2 punya satu: <code>&lt;|endoftext|&gt;</code> dengan ID {EOT_ID}, penanda bahwa sebuah teks
            sudah selesai. Saat pelatihan, banyak dokumen biasanya disambung menjadi satu aliran panjang, dan token ini
            dipakai sebagai pembatasnya. Model chat modern memakai lebih banyak token spesial, misalnya untuk menandai mana pesan pengguna
            dan mana jawaban model.
          </p>
        </div>
        <div className="card">
          <input className="text-input" value={text} onChange={(e) => setText(e.target.value)} aria-label="Teks dengan token spesial" />
          <div style={{ marginTop: 12 }}>
            {gpt2 ? (
              <TokenChips ids={gpt2.encode(text)} tok={gpt2} showIds highlight={(id) => id === EOT_ID} />
            ) : (
              <span className="muted-text">Memuat tokenizer…</span>
            )}
          </div>
          <p className="card-sub" style={{ marginTop: 12, marginBottom: 0 }}>
            Tokenizer GPT-2. Kotak bergaris putus-putus adalah token spesial: satu token utuh, bukan potongan huruf “&lt;”,
            “|”, dan seterusnya.
          </p>
        </div>
      </div>

      <div className="attempt">
        <h3>Tokenizer lain</h3>
        <div className="prose">
          <p>
            BPE bukan satu-satunya cara. Ide dasarnya sama, yaitu membangun kamus subword dari data, tetapi cara memilih
            potongannya berbeda.
          </p>
        </div>
        <div className="table-scroll">
          <table className="table table-text">
            <thead>
              <tr>
                <th>Algoritma</th>
                <th>Contoh model</th>
                <th>Ukuran kamus</th>
                <th>Ciri khas</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>BPE level byte</td>
                <td>GPT-2</td>
                <td className="mono">50257</td>
                <td>Mulai dari 256 byte. Spasi menempel di depan kata.</td>
              </tr>
              <tr>
                <td>BPE level byte</td>
                <td>GPT-4o</td>
                <td className="mono">{gpt4o ? gpt4o.vocabularySize : '≈ 200 ribu'}</td>
                <td>Kamus jauh lebih besar. Angka dipecah per 3 digit.</td>
              </tr>
              <tr>
                <td>BPE level byte</td>
                <td>LLaMA 3</td>
                <td className="mono">128256</td>
                <td>Meta menyebut kamus 128K ini menghasilkan hingga 15% lebih sedikit token dibanding LLaMA 2.</td>
              </tr>
              <tr>
                <td>BPE (SentencePiece)</td>
                <td>LLaMA 2</td>
                <td className="mono">32000</td>
                <td>Spasi diganti simbol “▁” dan ikut menjadi bagian token.</td>
              </tr>
              <tr>
                <td>WordPiece</td>
                <td>BERT</td>
                <td className="mono">30522</td>
                <td>Memilih gabungan yang paling “informatif”. Potongan lanjutan diberi awalan “##”.</td>
              </tr>
              <tr>
                <td>Unigram (SentencePiece)</td>
                <td>T5</td>
                <td className="mono">—</td>
                <td>Kebalikan BPE: mulai dari kamus besar, lalu buang potongan yang paling tidak berguna.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="card-sub" style={{ marginTop: 8 }}>
          Ukuran kamus GPT-4o dibaca langsung dari tokenizer yang dimuat di halaman ini. LLaMA, BERT: dari konfigurasi model
          di Hugging Face.
        </p>
      </div>
      <Takeaway>
        Semua tokenizer modern menjawab pertanyaan yang sama: potongan apa yang paling berguna untuk dijadikan token?
        Jawabannya selalu dipelajari dari data.
      </Takeaway>
    </section>
  )
}
