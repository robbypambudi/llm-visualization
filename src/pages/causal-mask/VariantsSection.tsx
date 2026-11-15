import { Takeaway } from '../../components/Prose'

export function VariantsSection() {
  return (
    <section className="section" id="variants">
      <h2>
        <span className="section-num">5</span>Tidak semua model memakai masker ini
      </h2>
      <div className="prose">
        <p>
          Masker causal adalah pilihan desain, bukan bagian wajib dari attention. Pilihannya bergantung pada apa yang ingin
          dilakukan model: <strong>membaca</strong> atau <strong>menulis</strong>.
        </p>
      </div>
      <div className="table-scroll">
        <table className="table table-text">
          <thead>
            <tr>
              <th></th>
              <th>GPT (decoder)</th>
              <th>BERT (encoder)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Masker causal</td>
              <td>Ya. Hanya melihat ke kiri.</td>
              <td>Tidak. Melihat ke kiri dan ke kanan.</td>
            </tr>
            <tr>
              <td>Latihan</td>
              <td>Menebak token berikutnya: “kucing itu tidur karena dia …”</td>
              <td>Mengisi token yang ditutup: “kucing itu [MASK] karena dia lelah .”</td>
            </tr>
            <tr>
              <td>Cocok untuk</td>
              <td>Menulis teks baru, satu token demi satu token.</td>
              <td>Memahami teks yang sudah lengkap, misalnya mengelompokkan atau mencari jawaban di dalamnya.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="prose" style={{ marginTop: 16 }}>
        <p>
          BERT (Devlin dkk., 2018) sengaja tidak memakai masker causal. Ia membaca setiap kata dengan melihat konteks di kiri{' '}
          <em>dan</em> kanannya sekaligus. Supaya tetap ada yang bisa ditebak, beberapa token di kalimat diganti dengan
          token khusus <code>[MASK]</code>, lalu model harus menebak isinya. Perhatikan, kata “mask” di sini artinya lain:
          menutup <em>kata</em> di masukan, bukan menutup <em>arah pandang</em> attention.
        </p>
        <p>
          Filosofinya mirip perbedaan antara membaca dan menulis. Saat membaca, kita boleh melirik ke depan untuk memahami
          sebuah kata. Saat menulis, kata berikutnya belum ada, jadi kita hanya bisa bersandar pada yang sudah ditulis.
          LLM seperti GPT dipakai untuk menulis, maka ia dilatih dalam keadaan yang sama: <strong>masa depan selalu
          tertutup</strong>. Latihan dan pemakaian jadi serupa, seperti berlatih di lapangan yang sama dengan lapangan
          pertandingan.
        </p>
        <p>
          Ada satu keuntungan lagi. Karena token lama tidak pernah melihat token baru, hasil hitungan untuk token lama
          tidak berubah ketika token baru ditambahkan. Hasil itu bisa disimpan dan dipakai ulang. Kode GPT-2 memang
          menyimpan kunci dan nilai dari token-token sebelumnya (variabel <code>past</code>). Inilah ide di balik{' '}
          <a href="#/kv-cache">KV Cache</a>, yang akan dibahas di bab tersendiri.
        </p>
      </div>
      <Takeaway>
        Model penulis (GPT) memakai masker causal karena saat menulis masa depan memang belum ada. Model pembaca (BERT)
        boleh melihat ke dua arah.
      </Takeaway>
    </section>
  )
}
