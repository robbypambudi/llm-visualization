import { Deep, Takeaway } from '../../components/Prose'
import { Tex } from '../../components/Tex'

export function FormulaSection() {
  return (
    <section className="section" id="formula">
      <h2>
        <span className="section-num">3</span>Membaca rumus sinusoidal
      </h2>
      <div className="prose">
        <p>
          Inilah rumus dari paper <em>Attention Is All You Need</em> (Vaswani dkk., 2017, §3.5). Kelihatannya rumit, tetapi
          isinya hanya gelombang dari bagian 2 yang ditulis dengan rapi.
        </p>
      </div>
      <Tex block>{`PE_{(pos,\\,2i)} = \\sin\\!\\left(\\frac{pos}{10000^{2i/d_{model}}}\\right), \\qquad PE_{(pos,\\,2i+1)} = \\cos\\!\\left(\\frac{pos}{10000^{2i/d_{model}}}\\right)`}</Tex>

      <div className="card">
        <div className="card-title">Baca satu per satu</div>
        <dl className="glossary">
          <dt>
            <Tex>{`pos`}</Tex>
          </dt>
          <dd>Nomor urut token: 0, 1, 2, …</dd>
          <dt>
            <Tex>{`d_{model}`}</Tex>
          </dt>
          <dd>Panjang vektor tanda posisi, sama dengan panjang vektor kata. Di paper nilainya 512.</dd>
          <dt>
            <Tex>{`i`}</Tex>
          </dt>
          <dd>
            Nomor pasangan. Angka-angka dalam vektor dikelompokkan berdua: satu sin, satu cos. Jadi ada{' '}
            <Tex>{`d_{model}/2`}</Tex> pasangan, dari <Tex>{`i = 0`}</Tex> sampai <Tex>{`i = d_{model}/2 - 1`}</Tex>.
          </dd>
          <dt>
            <Tex>{`2i,\\; 2i+1`}</Tex>
          </dt>
          <dd>Letak angkanya: sin di urutan genap, cos di urutan ganjil tepat sesudahnya.</dd>
          <dt>
            <Tex>{`10000^{2i/d_{model}}`}</Tex>
          </dt>
          <dd>
            Pembagi yang makin besar untuk pasangan yang makin belakang. Makin besar pembaginya, makin lambat gelombangnya.
            Pasangan pertama (<Tex>{`i = 0`}</Tex>) pembaginya 1, jadi paling cepat.
          </dd>
          <dt>sin, cos</dt>
          <dd>Membuat hasilnya selalu di antara −1 dan 1, dan berubah dengan halus.</dd>
        </dl>
      </div>
      <div className="prose">
        <p>
          Tidak ada yang perlu dilatih di sini. Begitu tahu <Tex>{`pos`}</Tex> dan <Tex>{`d_{model}`}</Tex>, tanda posisinya
          langsung bisa dihitung.
        </p>
      </div>

      <div className="attempt">
        <h3>Kenapa gelombang yang berulang tidak bikin bingung?</h3>
        <div className="prose">
          <p>
            Satu gelombang memang berulang. Jika hanya ada satu, posisi yang berbeda bisa saja mendapat tanda yang sama.
            Tetapi di sini ada banyak gelombang dengan kecepatan berbeda, dan yang dilihat adalah kombinasinya.
          </p>
          <p>
            Bayangkan jam dinding. Jarum detik kembali ke angka 12 setiap menit, jadi jarum detik saja tidak cukup untuk
            mengetahui waktu. Begitu jarum menit dan jarum jam ikut dilihat, waktunya jadi jelas. Tanda posisi bekerja
            dengan cara yang sama. Bagian 6 memperlihatkan jam-jam ini bergerak.
          </p>
        </div>
      </div>

      <div className="attempt">
        <h3>Kenapa harus berpasangan sin dan cos?</h3>
        <div className="prose">
          <p>
            Bayangkan ujung jarum jam, tetapi kamu hanya boleh melihat seberapa jauh ujungnya ke kanan atau ke kiri. Jarum
            yang menunjuk angka 1 dan angka 5 sama-sama berada di sisi kanan dengan jarak yang sama. Hanya dari angka itu,
            kamu tidak tahu jarumnya di atas atau di bawah. Itulah sinus saja.
          </p>
          <p>
            Kosinus memberi informasi yang hilang: seberapa jauh ujung jarum ke atas atau ke bawah. Dengan keduanya, letak
            jarum jadi pasti.
          </p>
          <p>
            Ada alasan yang lebih penting, dan inilah yang ditulis paper. Dengan pasangan sin dan cos,{' '}
            <strong>maju k langkah sama dengan memutar jarum sejauh sudut tertentu</strong>. Besar putarannya hanya
            bergantung pada k, tidak pada posisi awal. Jadi ada satu aturan geser yang berlaku di mana saja. Penulis paper{' '}
            <em>berharap</em> (mereka menyebutnya hipotesis) aturan ini memudahkan model belajar melihat posisi relatif,
            misalnya “kata yang dua langkah sebelum aku”. Bagian 8 membahasnya dengan gambar.
          </p>
        </div>
        <Deep title="Untuk yang penasaran: kenapa sinus saja tidak cukup untuk aturan geser">
          <p>
            Dari rumus penjumlahan sudut, <Tex>{`\\sin(a + b) = \\sin a \\cos b + \\cos a \\sin b`}</Tex>. Untuk menghitung
            nilai sinus setelah digeser, kita butuh <Tex>{`\\cos a`}</Tex>, bukan hanya <Tex>{`\\sin a`}</Tex>.
          </p>
          <p>
            Contohnya: <Tex>{`\\sin(0) = \\sin(\\pi) = 0`}</Tex>, tetapi setelah digeser sejauh <Tex>{`b`}</Tex>, hasilnya{' '}
            <Tex>{`\\sin b`}</Tex> dan <Tex>{`-\\sin b`}</Tex>. Nilai awal sama, hasil berbeda. Jadi tidak ada aturan geser
            yang hanya memakai sinus. Dengan sin dan cos, aturan gesernya adalah perkalian dengan matriks rotasi 2×2.
          </p>
        </Deep>
      </div>

      <div className="attempt">
        <h3>Kenapa angka 10000?</h3>
        <div className="prose">
          <p>
            Paper tidak menjelaskan alasan angka ini. Yang ditulis hanyalah akibatnya: panjang gelombang tercepat sekitar
            6 posisi (<Tex>{`2\\pi`}</Tex>), dan yang paling lambat mendekati 63 ribu posisi (<Tex>{`10000 \\cdot 2\\pi`}</Tex>
            ).
          </p>
          <p>
            Intuisinya, jarum paling lambat butuh puluhan ribu langkah untuk sekali putar. Itu jauh lebih panjang dari
            kalimat pada umumnya, sehingga kombinasi jarum tidak sempat berulang. Coba ganti <strong>base</strong> di panel
            kontrol (setelah bagian ini) menjadi 100. Jarum paling lambat jadi berputar penuh dalam kurang dari 630 langkah.
          </p>
        </div>
      </div>

      <div className="attempt">
        <h3>Kenapa kecepatannya dibagi berlipat, bukan dikurangi rata?</h3>
        <div className="prose">
          <p>
            Setiap pasangan berikutnya lebih lambat dengan <strong>faktor yang sama</strong>. Di paper (
            <Tex>{`d_{model} = 512`}</Tex>), setiap pasangan sekitar 1.037 kali lebih lambat dari pasangan sebelumnya.
            Polanya mirip angka biasa: digit satuan, puluhan, ratusan, dan seterusnya masing-masing 10 kali lebih lambat.
          </p>
          <p>
            Ini intuisi kita, bukan alasan yang tertulis di paper. Dengan pola berlipat, sedikit pasangan sudah cukup untuk
            membedakan posisi yang dekat (lewat jarum cepat) maupun yang sangat jauh (lewat jarum lambat).
          </p>
        </div>
      </div>

      <div className="attempt">
        <h3>Kenapa tidak dilatih saja?</h3>
        <div className="prose">
          <p>
            Penulis paper sebenarnya sudah mencoba versi yang dilatih. Hasilnya hampir sama persis (skor BLEU 25.7 vs 25.8,
            Tabel 3 baris E). Mereka tetap memilih rumus karena rumus <em>mungkin</em> bisa dipakai untuk kalimat yang lebih
            panjang dari saat pelatihan. Tabel yang dilatih tidak punya baris untuk posisi yang belum pernah ada.
          </p>
          <p>
            Di sini ada pilihan yang menarik. Rumus artinya kita yang memberi tahu model cara mengukur posisi. Versi yang
            dilatih artinya kita membiarkan model menemukannya sendiri dari data. Kedua cara masih dipakai sampai sekarang,
            dan bagian 10 membandingkannya.
          </p>
        </div>
      </div>

      <Takeaway>
        Setiap pasangan sin/cos adalah sebuah jarum jam. Pasangan pertama berputar paling cepat, berikutnya makin lambat.
        Letak semua jarum bersama-sama menjadi tanda posisi.
      </Takeaway>
    </section>
  )
}
