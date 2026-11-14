import { useState } from 'react'
import { Segmented } from '../../components/Controls'
import { Takeaway } from '../../components/Prose'
import { TokenChips } from '../../components/TokenChips'
import { ENCODING_LABEL, useTokenizer, visibleToken, type EncodingName, type Tokenizer } from '../../lib/tokenizer'

const CASES = ['hello', ' hello', 'Hello', ' Hello', 'HELLO']
const NUMBERS = ['2026', '1234567', '3.14159', '1000000']
const WORDS = ['strawberry', 'tokenisasi', 'mempertanggungjawabkan']

function Rows({ items, tok }: { items: string[]; tok: Tokenizer | null }) {
  if (!tok) return <span className="muted-text">Memuat tokenizer…</span>
  return (
    <table className="table table-text">
      <tbody>
        {items.map((s) => (
          <tr key={s}>
            <td className="mono" style={{ width: '38%' }}>
              “{visibleToken(s)}”
            </td>
            <td>
              <TokenChips ids={tok.encode(s)} tok={tok} showIds />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function QuirksSection() {
  const [enc, setEnc] = useState<EncodingName>('r50k_base')
  const tok = useTokenizer(enc)
  const gpt2 = useTokenizer('r50k_base')
  const gpt4o = useTokenizer('o200k_base')

  return (
    <section className="section" id="quirks">
      <h2>
        <span className="section-num">6</span>Keanehan yang muncul karena token
      </h2>
      <div className="prose">
        <p>
          Karena model hanya melihat token, beberapa hal yang mudah bagi kita bisa jadi sulit baginya. Berikut tiga
          contoh yang dihitung langsung dengan tokenizer asli.
        </p>
      </div>

      <div className="attempt">
        <h3>Spasi dan huruf besar mengubah token</h3>
        <div className="prose">
          <p>
            Bagi kita, kelima tulisan di bawah ini adalah kata yang sama. Bagi model, ini token-token yang berbeda dengan
            ID yang berbeda. Model harus belajar sendiri dari data bahwa semuanya bermakna sama.
          </p>
        </div>
        <div className="card">
          <Segmented
            ariaLabel="Tokenizer"
            value={enc}
            options={(['r50k_base', 'o200k_base'] as const).map((v) => ({ value: v, label: ENCODING_LABEL[v] }))}
            onChange={setEnc}
          />
          <div style={{ marginTop: 12 }}>
            <Rows items={CASES} tok={tok} />
          </div>
        </div>
      </div>

      <div className="attempt">
        <h3>Angka dipotong dengan cara yang tidak terduga</h3>
        <div className="prose">
          <p>
            GPT-2 memperlakukan deretan angka seperti kata biasa, jadi potongannya mengikuti angka-angka yang sering muncul
            di data latih. Hasilnya tidak beraturan. GPT-4o memakai aturan tambahan: angka dipecah dulu per kelompok paling
            banyak 3 digit, baru kemudian BPE dijalankan.
          </p>
        </div>
        <div className="grid-2">
          <div className="card">
            <div className="card-title">GPT-2</div>
            <Rows items={NUMBERS} tok={gpt2} />
          </div>
          <div className="card">
            <div className="card-title">GPT-4o</div>
            <Rows items={NUMBERS} tok={gpt4o} />
          </div>
        </div>
      </div>

      <div className="attempt">
        <h3>Model tidak melihat huruf di dalam token</h3>
        <div className="prose">
          <p>
            Model menerima “strawberry” sebagai beberapa potongan, bukan sebagai 10 huruf. Untuk menjawab “ada berapa huruf
            r di strawberry?”, model harus sudah tahu huruf-huruf apa saja yang ada di dalam setiap token. Ini salah satu
            alasan yang sering disebut kenapa model bahasa kesulitan dengan tugas mengeja dan menghitung huruf.
          </p>
        </div>
        <div className="grid-2">
          <div className="card">
            <div className="card-title">GPT-2</div>
            <Rows items={WORDS} tok={gpt2} />
          </div>
          <div className="card">
            <div className="card-title">GPT-4o</div>
            <Rows items={WORDS} tok={gpt4o} />
          </div>
        </div>
      </div>
      <Takeaway>
        Token adalah “kacamata” model. Apa pun yang tidak terlihat jelas lewat kacamata itu, seperti huruf di dalam kata
        atau nilai sebuah angka, harus dipelajari dengan susah payah.
      </Takeaway>
    </section>
  )
}
