/**
 * Generates supabase/migrations/20260406180500_seed_blog_posts_malay.sql
 * Run: node scripts/generate-blog-ms-seed.mjs
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const out = join(__dirname, "..", "supabase", "migrations", "20260406180500_seed_blog_posts_malay.sql");

const htmlTpl = (a, b, c, d, e, f) => `<p>${a}</p>
<p>Tujuan panduan ini mudah: bantu anda buat keputusan penjagaan diri yang lebih baik dan masih realistik selepas meninggalkan kedai gunting. Gaya atau rutin hanya benar-benar baik apabila ia tahan dalam kehidupan sebenar, mudah dijaga, dan terus menyokong keyakinan anda selepas hari pertama.</p>
<h2>Mengapa pendekatan ini berkesan</h2>
<p>${b}</p>
<p>Di Malaysia, perkara praktikal sering menentukan hasil: kelembapan, minyak kulit kepala, pakaian pejabat, topi keledar, peraturan sekolah, majlis perkahwinan, musim perayaan, jadual gym, dan masa yang anda benar-benar ada setiap pagi. Pilihan penjagaan terkuat dibina mengikut realiti ini.</p>
<h2>Apa yang perlu ditanya kepada barber anda</h2>
<p>${c}</p>
<p>Terangkan rutin anda dengan jujur. Nyatakan sama ada anda biasanya biarkan rambut kering secara semula jadi atau gunakan pengering, sama ada anda memakai topi keledar, sama ada tempat kerja anda konservatif, berapa kerap anda mencuci rambut, dan berapa usaha yang sanggup anda luahkan untuk menata setiap hari. Butiran ini sering lebih berguna daripada sekadar nama gaya rambut yang sedang tren.</p>
<h2>Cara mengekalkan penampilan</h2>
<p>${d}</p>
<ul>
  <li>Gunakan produk styling secukupnya untuk kawalan dan tekstur.</li>
  <li>Perhatikan teknik pengeringan kerana bentuk rambut sering ditetapkan sebelum produk styling digunakan.</li>
  <li>Bina rutin yang boleh diulang walaupun pada hari bekerja yang tergesa-gesa, bukan hanya pada hujung minggu yang ideal.</li>
  <li>Nilai potongan selepas dua minggu supaya anda faham bahagian mana tumbuh dahulu.</li>
</ul>
<h2>Kesilapan biasa yang perlu dielakkan</h2>
<p>${e}</p>
<p>Isu lain yang kerap berlaku ialah menyalin foto rujukan tanpa menyesuaikannya. Gaya rambut yang sama boleh kelihatan sangat berbeza pada garis rambut, kepadatan, corak keriting, dan bentuk muka yang berbeza. Barber yang baik menyesuaikan idea itu, bukan mengejar klon sempurna.</p>
<h2>Bila untuk menempah lawatan seterusnya</h2>
<p>${f}</p>
<p>Jika anda guna BarberPro untuk menempah temujanji, simpan nota selepas setiap lawatan: panjang guard yang anda suka, tahap tekstur yang anda mahukan, atau berapa lama sebelum potongan mula terasa sukar. Nota itu menjadikan setiap temujanji akan datang lebih tepat.</p>
<h2>Rumusan akhir</h2>
<p>Hasil penjagaan terbaik jarang yang paling dramatik. Ia yang paling sesuai dengan wajah, tabiat, persekitaran, dan keyakinan anda. Apabila keempat-empat perkara ini selari, gaya rambut menjadi lebih mudah dijaga dan lebih mudah dipercayai.</p>
<p>Gunakan artikel ini sebagai titik permulaan, kemudian perhalusi butiran bersama barber anda dari masa ke masa. Gaya paling boleh diharap ialah yang masih berfungsi apabila kehidupan sibuk, cuaca mencabar, dan anda masih mahu kelihatan kemas dengan usaha yang minimum.</p>`;

const posts = [
  {
    slug: "best-haircuts-malaysia-hot-humid-weather",
    title_ms: "Potongan Rambut Terbaik untuk Cuaca Panas dan Lembap di Malaysia",
    excerpt_ms:
      "Panduan praktikal untuk gaya rambut yang kekal kemas dalam peluh, panas, topi keledar, dan kelembapan di seluruh Malaysia.",
    intro:
      "Di Malaysia, potongan rambut mesti tahan lebih daripada sekadar semakan di cermin kedai gunting. Ia perlu kekal berbentuk melalui pagi yang lembap, perjalanan motorsikal, waktu solat, penyaman udara pejabat, dan seharian di luar tanpa menjadi berat atau kehilangan bentuk.",
    why_it_works:
      "Potongan sesuai cuaca panas mengurangkan berat di bahagian yang berpeluh paling cepat, mengekalkan tekstur di atas untuk gerakan, dan tumbuh dengan cara yang masih kelihatan disengajakan selepas dua atau tiga minggu.",
    ask_barber:
      "Minta pengurangan berat yang bersih di bahagian sisi, tekstur lembut di atas, dan kemasan yang sepadan dengan masa menata sebenar anda. Jika anda hanya luangkan tiga minit setiap pagi, beritahu semasa perundingan.",
    maintenance:
      "Gunakan produk matte ringan, keringkan akar dengan betul sebelum memakai apa-apa, dan elakkan terlalu banyak produk berasaskan minyak pada petang hari. Kebanyakan lelaki memerlukan kurang produk daripada yang mereka sangka.",
    mistakes:
      "Kesilapan terbesar ialah memilih gaya kerana ia kelihatan dramatik pada hari pertama tanpa menguji bagaimana ia bertahan selepas topi keledar, tidur sekejap, atau ulang-alik berpeluh. Kesilapan lain ialah mengekalkan terlalu panjang di kawasan yang sudah kembang akibat kelembapan.",
    rebook:
      "Jika anda mahu bentuk kekal tajam, tempah semula setiap 3 hingga 4 minggu. Jika anda suka kemasan lebih lembut dan semula jadi, biasanya 4 hingga 5 minggu sudah mencukupi.",
  },
  {
    slug: "modern-mid-fade-guide-malaysian-men",
    title_ms: "Panduan Mid Fade Moden untuk Lelaki Malaysia",
    excerpt_ms:
      "Semua yang anda perlu tahu tentang memilih, menjaga, dan menyesuaikan mid fade di Malaysia.",
    intro:
      "Mid fade kekal antara potongan paling serba boleh kerana ia duduk di antara kontras berani dan kemasan harian yang selesa. Ia boleh kelihatan kemas di pejabat, segar pada hujung minggu, dan cukup bersih untuk majlis keluarga penting.",
    why_it_works:
      "Mid fade berfungsi apabila peralihan duduk pada tempat yang betul untuk bentuk kepala dan kepadatan rambut anda. Ia memberi struktur tanpa menjadikan potongan terlalu agresif atau sukar dijaga.",
    ask_barber:
      "Beritahu barber sama ada anda mahukan mid fade konservatif, kesan skin fade, atau kemasan shadow yang lebih lembut. Sebut juga sama ada anda biasanya menata bahagian atas ke hadapan, ke atas, atau ke sisi.",
    maintenance:
      "Rutin penjagaan harus fokus mengekalkan keseimbangan bahagian atas sambil membiarkan sisi tumbuh dengan kemas. Krim atau tanah liat matte biasanya memberi kawalan semula jadi lebih baik daripada pomade berkilat untuk potongan ini.",
    mistakes:
      "Ramai lelaki meminta mid fade hanya dengan nama dan terlupa menerangkan hasil akhir. Itulah cara anda mendapat potongan yang betul secara teknikal tetapi salah untuk suasana kerja, garis rambut, atau tabiat menata anda.",
    rebook:
      "Untuk definisi fade yang jelas, tempah setiap 2.5 hingga 3.5 minggu. Untuk versi lebih lembut yang masih kemas, biasanya setiap 4 minggu sudah mencukupi.",
  },
  {
    slug: "pomade-vs-clay-vs-paste-which-product-fits-your-hair",
    title_ms: "Pomade vs Tanah Liat vs Pes: Produk Mana Sesuai untuk Rambut Anda?",
    excerpt_ms:
      "Perbezaan jelas antara tiga produk styling paling biasa dan bila setiap satu masuk akal.",
    intro:
      "Potongan hebat masih boleh kelihatan biasa jika produk salah digunakan. Itulah sebab memilih antara pomade, tanah liat, dan pes sama pentingnya seperti memilih potongan itu sendiri.",
    why_it_works:
      "Setiap produk mengubah kilauan, pegangan, pemisahan, berat, dan cara rambut bertindak balas terhadap haba serta kelembapan. Pilihan terbaik bergantung pada ketebalan rambut, kemasan, dan kerap anda menyentuh rambut sepanjang hari.",
    ask_barber:
      "Minta cadangan produk berdasarkan hasil, bukan tren. Tunjukkan sama ada anda mahukan kemasan matte berstruktur, bentuk klasik kemas, atau gerakan fleksibel yang boleh diatur semula pada siang hari.",
    maintenance:
      "Mulakan dengan jumlah sebesar kacang pea, panaskan dengan betul di tapak tangan, dan sapu dari belakang ke hadapan. Bina perlahan-lahan daripada membebankan garis rambut depan serta-merta.",
    mistakes:
      "Kesilapan biasa ialah membeli pomade berkilat kuat untuk gaya yang sebenarnya memerlukan kekeringan dan isipadu, atau membeli tanah liat untuk rambut yang sudah kasar dan sukar untuk menyebarkan produk dengan sekata.",
    rebook:
      "Anda biasanya tidak memerlukan potongan baharu hanya kerana produk terasa salah, tetapi jika rambut tetap lemah walaupun produk betul, potongan pembentuk semula setiap 4 minggu akan membantu.",
  },
  {
    slug: "how-often-should-men-cut-their-hair",
    title_ms: "Berapa Kerap Lelaki Perlu Gunting Rambut? Jadual Realistik",
    excerpt_ms:
      "Jawapan bergantung pada gaya anda, corak pertumbuhan, bajet, dan tahap ketajaman yang ingin dikekalkan.",
    intro:
      "Ramai lelaki mencari jadual potongan sempurna seolah satu peraturan untuk semua. Pada hakikatnya, masa yang tepat bergantung pada seberapa tepat potongan anda, seberapa cepat rambut tumbuh, dan seberapa kemas anda perlu kelihatan dari minggu ke minggu.",
    why_it_works:
      "Fade pendek kehilangan struktur lebih cepat daripada potongan bertekstur panjang, manakala fringe dan side part menjadi liar apabila satu kawasan melampaui panjang tertentu. Jadual anda harus menyokong gaya hidup, bukan menghukumnya.",
    ask_barber:
      "Tanya bahagian potongan mana yang rosak dahulu. Bagi sesetengah orang ia adalah leher, bagi yang lain fringe, kawasan pelipis, atau lebihan di sekitar mahkota.",
    maintenance:
      "Perhatikan tingkah laku rambut pada minggu kedua, ketiga, dan keempat selepas potongan. Setelah anda tahu bila bentuk berhenti membantu, anda boleh menempah sebelum titik kefrustasian itu.",
    mistakes:
      "Kesilapan biasa ialah menunggu sehingga potongan kelihatan hilang sepenuhnya, kemudian mengharapkan satu temujanji membetulkan bulan pertumbuhan tidak sekata. Kesilapan lain ialah menempah terlalu awal tanpa belajar menata antara lawatan.",
    rebook:
      "Skin fade sering memerlukan 2 hingga 3 minggu, taper klasik 3 hingga 4 minggu, dan potongan bertekstur panjang 4 hingga 6 minggu. Gunakan julat ini sebagai permulaan, kemudian sesuaikan dengan barber anda.",
  },
  {
    slug: "beard-grooming-hot-humid-climate",
    title_ms: "Penjagaan Janggut dalam Iklim Panas dan Lembap",
    excerpt_ms:
      "Cara menjaga janggut bersih, lembut, dan kemas apabila peluh, panas, dan minyak bekerja menentang anda.",
    intro:
      "Menjaga janggut di iklim tropika sangat berbeza daripada persekitaran sejuk dan kering. Peluh, kelembapan terperangkap, makanan, dan kerap mencuci boleh menukar janggut baik menjadi gatal dan tidak kemas dengan cepat.",
    why_it_works:
      "Rutin janggut terbaik melindungi kulit di bawah janggut, mengekalkan garis tepi konsisten, dan mengelakkan terlebih kondisi. Anda mahukan kelembutan dan definisi, bukan berat dan melekit.",
    ask_barber:
      "Tanya di mana janggut harus paling penuh, di mana perlu dibersihkan, dan seberapa tinggi garis pipi sesuai dengan bentuk muka anda. Garis tepi yang lebih baik biasanya meningkatkan keseluruhan janggut dengan serta-merta.",
    maintenance:
      "Cuci janggut dengan lembut, keringkan sepenuhnya, gunakan minyak janggut ringan hanya di mana perlu, dan sikat ke bentuk daripada membanjiri dengan produk. Trim kawasan misai kerap kerana di situlah janggut kelihatan tidak kemas dahulu.",
    mistakes:
      "Kesilapan terbesar ialah menggunakan terlalu banyak minyak atau balsam pada cuaca lembap, menyebabkan janggut berpisah, menarik habuk, dan terasa berminyak. Kesilapan lain ialah mengabaikan kulit di bawah sehingga kerengsaan ketara.",
    rebook:
      "Kemasan garis atau kemas setiap 2 hingga 3 minggu membantu kebanyakan janggut kelihatan disengajakan. Pembentukan semula penuh biasanya baik setiap 3 hingga 5 minggu.",
  },
  {
    slug: "low-taper-haircuts-professional-office",
    title_ms: "Potongan Low Taper yang Masih Profesional di Pejabat",
    excerpt_ms:
      "Pilihan low taper bijak untuk lelaki yang mahukan potongan kemas tanpa kelihatan terlalu keras atau mencolok di tempat kerja.",
    intro:
      "Low taper ialah salah satu cara paling selamat untuk kelihatan kemas tanpa kelihatan berlebihan. Ia membersihkan perimeter potongan sambil mengekalkan siluet secara keseluruhan tenang, seimbang, dan mesra pejabat.",
    why_it_works:
      "Gaya ini terutamanya sesuai untuk lelaki yang menghadiri mesyuarat, menemui pelanggan, atau memerlukan fleksibiliti antara kemasan hari bekerja dan santai hujung minggu. Ia memberi struktur tanpa mencipta garis kontras yang keras.",
    ask_barber:
      "Minta taper kekal rendah di sekitar sideburn dan leher, dan terangkan sama ada anda mahukan side part, crop bertekstur, atau comb-over lembut di atas. Pilihan atas mempengaruhi seberapa konservatif atau moden hasil akhirnya.",
    maintenance:
      "Kekalkan kemasan kemas dengan krim ringan, pengeringan sekejap, dan arah sikat yang konsisten. Matlamatnya bukan rambut kaku; ia kawalan gerakan yang masih kelihatan semula jadi.",
    mistakes:
      "Kesilapan utama ialah meminta low taper tetapi memadankannya dengan bahagian atas terlalu panjang atau terputus yang bertentangan dengan niat profesional potongan tersebut.",
    rebook:
      "Kebanyakan low taper mesra pejabat kelihatan terbaik apabila disegarkan setiap 3 hingga 4 minggu, terutamanya jika anda bergantung pada sideburn kemas dan leher yang rapi.",
  },
  {
    slug: "best-student-haircuts-malaysia",
    title_ms: "Potongan Rambut Pelajar Terbaik di Malaysia: Bergaya, Berpatutan, Mudah",
    excerpt_ms:
      "Idea potongan praktikal untuk pelajar yang mahu kelihatan segar tanpa penjagaan mahal setiap dua minggu.",
    intro:
      "Pelajar biasanya memerlukan potongan yang kelihatan baik merentasi kuliah, kerja sambilan, sukan, acara sosial, dan pagi yang tergesa-gesa. Ini bermakna potongan mesti berpatutan untuk dijaga dan mudah diset semula tanpa terlalu banyak produk.",
    why_it_works:
      "Potongan pelajar terkuat biasanya yang tumbuh dengan anggun. Ia masih kelihatan baik selepas fade sedikit lembut atau fringe bertambah panjang.",
    ask_barber:
      "Minta versi gaya yang masih kelihatan kemas pada penanda minggu keempat. Jika bajet ketat, katakan dengan jelas supaya potongan direka mengikut jarak lawatan yang realistik.",
    maintenance:
      "Pilih produk mudah dan tabiat menata ringan. Lilin ringan, pengeringan tuala yang betul, dan memahami bahagian semula jadi biasanya lebih berguna daripada membeli lima produk yang tidak digunakan secara konsisten.",
    mistakes:
      "Kesilapan terbesar ialah memilih potongan penjagaan tinggi dari media sosial tanpa mempertimbangkan jadual kelas, rutin asrama, topi keledar, dan had bajet.",
    rebook:
      "Potongan pelajar yang baik biasanya bertahan 4 hingga 5 minggu. Jika anda mahukan fade sangat tajam, simpan untuk masa anda boleh menjaganya dengan kerap.",
  },
  {
    slug: "grooms-haircut-timeline-before-wedding-day",
    title_ms: "Garis Masa Potongan Pengantin Lelaki Sebelum Hari Perkahwinan",
    excerpt_ms:
      "Garis masa penjagaan praktikal untuk pengantin lelaki yang mahu kelihatan kemas secara langsung dan dalam foto.",
    intro:
      "Potongan rambut perkahwinan tidak harus dianggap seperti trim bulanan rawak. Ia adalah potongan hari foto, potongan keyakinan, dan potongan acara panjang yang mesti kelihatan baik dari akad hingga foto keluarga terakhir.",
    why_it_works:
      "Hasil terbaik datang daripada perancangan berperingkat: uji, perhalusi, kemudian kunci masa akhir. Ini mengurangkan panik akhir minit dan mengelakkan keputusan mengejut apabila emosi sudah tinggi.",
    ask_barber:
      "Minta potongan percubaan beberapa minggu sebelum acara dan bincang sama ada anda mahukan kelihatan formal, lembut, atau moden. Jika anda memakai pakaian tradisional, sebut semasa perundingan kerana nisbah penting.",
    maintenance:
      "Lindungi kulit kepala beberapa hari sebelum perkahwinan, jangan bereksperimen dengan produk baharu pada saat akhir, dan kekalkan menata ringan supaya masih terkawal selepas berpeluh, memeluk sanak-saudara, dan berpindah antara tempat.",
    mistakes:
      "Kesilapan biasa ialah memotong terlalu segar, menyebabkan skin fade kelihatan mentah dalam foto dekat. Kesilapan lain ialah menunggu terlalu lama dan mengharapkan menata menyelamatkan tepi yang sudah panjang.",
    rebook:
      "Kebanyakan pengantin lelaki berjaya dengan potongan terperinci akhir 2 hingga 4 hari sebelum acara selepas temujanji percubaan 2 hingga 4 minggu lebih awal.",
  },
  {
    slug: "how-to-talk-to-your-barber",
    title_ms: "Cara Berbual dengan Barber Supaya Anda Benar-benar Dapat Potongan yang Diingini",
    excerpt_ms:
      "Tabiat perundingan yang lebih baik membantu barber memahami bentuk, tekstur, penjagaan, dan hasil yang anda benar-benar mahukan.",
    intro:
      "Banyak kekecewaan potongan bermula sebelum gunting pertama menyentuh rambut. Masalahnya tidak selalu kemahiran teknikal; sering kali ia komunikasi kabur yang meninggalkan terlalu banyak tafsiran.",
    why_it_works:
      "Perundingan kukuh membantu barber memahami bentuk sasaran, tahap kontras yang anda suka, masa menata yang boleh anda komit, dan bahagian potongan semasa yang paling anda tidak suka.",
    ask_barber:
      "Daripada hanya berkata pendek di sisi, terangkan seberapa pendek, di mana peralihan harus duduk, dan sama ada anda mahukan hasil lembut atau dramatik. Foto rujukan lebih membantu apabila anda terangkan apa yang anda suka padanya.",
    maintenance:
      "Bincang tabiat sebenar anda: sama ada anda memakai topi keledar, menata setiap hari, pejabat konservatif, dan sama ada rambut mengembang dalam kelembapan. Butiran ini lebih penting daripada jargon nama potongan.",
    mistakes:
      "Kesilapan terbesar ialah berdiam apabila sesuatu tidak jelas, kemudian menilai hasil kemudian. Kesilapan lain ialah menggunakan satu istilah potongan seolah setiap barber mentakrifkannya sama.",
    rebook:
      "Anda tidak semestinya perlu menempah berbeza untuk panduan ini, tetapi simpan nota selepas setiap lawatan. Selepas dua atau tiga lawatan, nota itu menjadi peta jalan terbaik anda ke potongan yang lebih konsisten.",
  },
  {
    slug: "five-signs-its-time-to-change-your-hairstyle",
    title_ms: "5 Tanda Sudah Tiba Masa Menukar Gaya Rambut Anda",
    excerpt_ms:
      "Apabila potongan biasa berhenti menyokong bentuk muka, jadual, atau keyakinan anda, mungkin sudah tiba masa untuk beralih.",
    intro:
      "Ramai lelaki mengekalkan potongan sama selama bertahun-tahun kerana ia terasa selamat, biasa, dan mudah diterangkan. Tetapi potongan yang pernah sesuai boleh perlahan-lahan berhenti sepadan dengan bentuk muka, garis rambut, peringkat kerjaya, atau gaya hidup anda.",
    why_it_works:
      "Menukar gaya rambut tidak bermakna mengikut tren semata-mata. Ia bermakna menyedari apabila potongan semasa tidak lagi menyokong versi diri yang ingin anda tunjukkan.",
    ask_barber:
      "Tanya perubahan kecil mana yang memberi kesan terbesar: kurang lebar di sisi, lebih tekstur di atas, kedudukan fringe lebih baik, taper lebih lembut, atau leher lebih kemas. Transformasi terbaik sering evolusi, bukan dramatik.",
    maintenance:
      "Apabila mencuba gaya baharu, permudahkan rutin selama dua minggu pertama dan pelajari tingkah laku semula jadi potongan baharu sebelum menambah produk berat atau teknik rumit.",
    mistakes:
      "Kesilapan biasa ialah menukar semua sekali gus: panjang, ketinggian fade, fringe, dan produk. Apabila itu berlaku, anda tidak dapat mengetahui keputusan mana yang memperbaiki dan mana yang menyukarkan pengurusan.",
    rebook:
      "Anggap potongan baharu pertama sebagai ujian, kemudian perhalusi dalam 3 hingga 4 minggu setelah anda faham cara ia tumbuh dan ditata dalam kehidupan sebenar.",
  },
  {
    slug: "best-haircuts-for-men-with-thick-hair",
    title_ms: "Potongan Terbaik untuk Lelaki Berambut Tebal",
    excerpt_ms:
      "Cara mengurangkan lebihan, membentuk pertumbuhan berat dengan betul, dan memilih potongan yang kekal seimbang tanpa mengembang.",
    intro:
      "Rambut tebal sering digambarkan sebagai berkat, tetapi sesiapa yang pernah berjuang dengan kekembangan, haba terperangkap, atau isipadu degil tahu ia memerlukan strategi. Tanpa potongan betul, rambut tebal cepat kelihatan lebih lebar, lebih berat, dan lebih sukar daripada sepatutnya.",
    why_it_works:
      "Potongan untuk rambut tebal fokus pada kawalan bentuk, pengurangan berat dalaman, dan nisbah. Ia mengekalkan cukup kepadatan untuk badan tanpa membiarkan potongan mengembang seperti topi keledar.",
    ask_barber:
      "Minta penjelasan di mana berat dikeluarkan dan berapa tekstur realistik untuk kepadatan anda. Rambut tebal sering memerlukan kedua-dua guntingan struktur dan menata yang lebih bijak, bukan sekadar sisi lebih pendek.",
    maintenance:
      "Keringkan mengikut arah yang dimahukan, gunakan produk tekstur ringan, dan elakkan terlebih kondisi pada akar. Rambut tebal kelihatan terbaik apabila dibimbing, bukan ditekan.",
    mistakes:
      "Kesilapan terbesar ialah meminta menipiskan semuanya tanpa rancangan. Penipisan rawak boleh mencipta keriting, gerakan janggal, dan pertumbuhan tidak sekata, terutamanya di sekitar mahkota dan hadapan.",
    rebook:
      "Jika bentuk hilang cepat kerana pertumbuhan pantas dan berlebihan, tempah semula setiap 3 hingga 4 minggu. Untuk gaya tebal lebih panjang, 4 hingga 6 minggu adalah permulaan kukuh.",
  },
  {
    slug: "practical-curly-hair-routine-for-men-in-malaysia",
    title_ms: "Rutin Rambut Keriting Praktikal untuk Lelaki di Malaysia",
    excerpt_ms:
      "Rambut keriting memerlukan kelembapan, bentuk, dan keputusan guntingan yang lebih bijak, terutamanya dalam cuaca lembap.",
    intro:
      "Rambut keriting boleh kelihatan luar biasa apabila dipotong dan dijaga dengan niat, tetapi ia sering dianiaya oleh rutin direka untuk rambut lurus. Dalam kelembapan, keriting boleh menjadi kusut, lembap, kering, atau tidak jelas bergantung pada produk dan teknik.",
    why_it_works:
      "Matlamatnya bukan melawan corak keriting. Matlamatnya ialah menyokongnya supaya rambut kelihatan sihat, terkawal, dan ekspresif tanpa menjadi keras atau membengkak.",
    ask_barber:
      "Tanya bagaimana corak keriting bertindak apabila kering, di mana berat harus kekal, dan sama ada potongan harus dibentuk untuk isipadu, gerakan ke hadapan, atau siluet lebih padat.",
    maintenance:
      "Rambut keriting biasanya mendapat manfaat daripada pembersihan lembut, kelembapan mencukupi, produk tinggalkan tanpa rasa berminyak, dan kaedah pengeringan yang tidak mengganggu pembentukan keriting terlalu agresif.",
    mistakes:
      "Kesilapan paling biasa ialah menyikat keriting kering kemudian menyalahkan potongan. Satu lagi ialah menimbun produk berat dalam cuaca lembap dan kehilangan bentuk serta lenturan.",
    rebook:
      "Gaya keriting sering boleh pergi 5 hingga 7 minggu antara potongan utama, tetapi kawalan fringe atau kemas tepi mungkin masih membantu lebih awal bergantung pada bentuk.",
  },
  {
    slug: "best-hairstyles-for-a-receding-hairline",
    title_ms: "Gaya Rambut Terbaik untuk Garis Rambut Mundur",
    excerpt_ms:
      "Panduan realistik untuk potongan yang bekerja dengan garis rambut yang berubah, bukan melawannya.",
    intro:
      "Garis rambut mundur mengubah cara potongan membingkai muka, tetapi ia tidak bermakna pilihan anda hilang. Malah, potongan yang betul boleh mengurangkan ketidakseimbangan visual, meningkatkan keyakinan, dan memudahkan menata harian.",
    why_it_works:
      "Gaya terkuat untuk garis rambut mundur biasanya bekerja dengan tekstur, arah terkawal, dan nisbah jujur. Ia mengelakkan memaksa isipadu di tempat salah atau mendedahkan sudut lemah tanpa perlu.",
    ask_barber:
      "Minta barber mengkaji pelipis, kepadatan hadapan, dan mahkota bersama. Potongan yang membantu hadapan tetapi mengabaikan siluet keseluruhan masih boleh terasa janggal.",
    maintenance:
      "Gunakan produk styling matte, bekerja dengan arah semula jadi, dan elakkan kemasan berkilat kaku yang mendedahkan pemisahan. Tekstur lembut hampir sentiasa lebih memaafkan daripada kilat paksa di sini.",
    mistakes:
      "Kesilapan terbesar ialah meniru garis rambut muda padat dengan comb-over agresif atau pengeringan tidak realistik. Itu biasanya menjadikan penipisan lebih ketara, bukan kurang.",
    rebook:
      "Bergantung pada potongan, kebanyakan lelaki berjaya dengan temujanji 3 hingga 5 minggu supaya bentuk hadapan kekal disengajakan dan tidak rawak.",
  },
  {
    slug: "scalp-care-for-men-who-sweat-easily",
    title_ms: "Penjagaan Kulit Kepala untuk Lelaki yang Mudah Berkeringat",
    excerpt_ms:
      "Rutin kulit kepala lebih sihat untuk akar berminyak, peluh selepas gym, kelembapan tropika, dan penumpukan produk.",
    intro:
      "Banyak masalah rambut sebenarnya bermula di kulit kepala. Lebihan minyak, peluh terperangkap, kekeliruan kelemumur, penumpukan produk, dan rutin mencuci yang tidak konsisten semua boleh menjadikan potongan baik lebih sukar diurus.",
    why_it_works:
      "Penjagaan kulit kepala penting kerana akar sihat mencipta tekstur lebih baik, styling lebih bersih, dan kurang kerengsaan. Jika kulit kepala tidak selesa, rambut jarang kelihatan terbaik untuk lama.",
    ask_barber:
      "Tanya apa yang mereka perhatikan dahulu: kepingan, penumpukan minyak, folikel tersumbat, kemerahan, atau sensitiviti. Menyelesaikan masalah yang betul lebih penting daripada membeli syampu rawatan rawak.",
    maintenance:
      "Cuci mengikut tahap peluh, bukan mitos lama. Sesetengah lelaki memerlukan pembersihan lebih kerap daripada yang diberitahu, terutamanya jika menunggang basikal, bekerja luar, kerap bersenam, atau menggunakan beberapa produk styling setiap hari.",
    mistakes:
      "Kesilapan paling biasa ialah sama ada kurang mencuci kerana takut atau terlalu menggosok dengan syampu keras. Kedua-duanya boleh memburukkan masalah dan menjadikan kulit kepala tidak stabil.",
    rebook:
      "Jadual potongan anda bergantung pada gaya anda, tetapi tetapan semula kulit kepala berterusan. Semak rutin anda setiap beberapa minggu dan perhatikan sama ada minyak, gatal, atau kepingan bertambah baik dengan tabiat lebih konsisten.",
  },
  {
    slug: "hari-raya-haircut-prep-guide",
    title_ms: "Persediaan Potongan Rambut Hari Raya: Bila Menempah dan Apa Diminta",
    excerpt_ms:
      "Cara mengatur masa potongan sebelum Raya supaya anda kelihatan tajam secara langsung, dalam foto, dan di rumah terbuka.",
    intro:
      "Raya ialah antara tempoh potongan rambut paling sibuk setahun, yang bermakna masa hampir sama pentingnya dengan potongan itu sendiri. Anda mahu kelihatan segar dalam foto keluarga, tetapi juga mahu potongan terasa mantap dan semula jadi menjelang perhimpunan pertama.",
    why_it_works:
      "Potongan Raya terbaik bersih, menyanjung, dan praktikal untuk bertahan hari panjang mengembara, bersalaman, makan, dan berpindah antara rumah tanpa penyelarasan berterusan.",
    ask_barber:
      "Minta gaya yang sepadan dengan pakaian, jangkaan keluarga, dan tahap keselesaan anda. Jika anda memakai baju Melayu, songkok, atau kelihatan lebih formal, beritahu barber lebih awal.",
    maintenance:
      "Kekalkan produk ringan, bawa sikat kecil jika perlu, dan jangan uji gaya baharu sepenuhnya sehari sebelum Raya melainkan anda sudah membuat percubaan lebih awal.",
    mistakes:
      "Kesilapan biasa ialah menunggu hingga kesesakan akhir, kemudian menerima slot yang tinggal dan memotong terlalu dekat dengan acara. Kesilapan lain ialah meminta fade terlalu mentah yang kelihatan keras dalam fotografi siang.",
    rebook:
      "Sasarkan potongan akhir kira-kira 2 hingga 4 hari sebelum Raya, dengan potongan percubaan 2 hingga 3 minggu lebih awal jika anda merancang perubahan ketara.",
  },
  {
    slug: "korean-hairstyles-for-malaysian-men",
    title_ms: "Gaya Rambut Korea untuk Lelaki Malaysia: Apa yang Benar-benar Sesuai",
    excerpt_ms:
      "Cara menyesuaikan potongan inspirasi Korea untuk bentuk muka, tekstur rambut, dan cuaca lembap Malaysia.",
    intro:
      "Trend gaya rambut Korea popular kerana ia kelihatan kemas, muda, dan ekspresif tanpa sentiasa bergantung pada sisi sangat pendek. Tetapi apa yang berfungsi dalam foto studio atau cuaca sejuk memerlukan penyesuaian sebelum ia berfungsi dalam kelembapan Malaysia.",
    why_it_works:
      "Gaya yang terjemah paling baik ialah yang diselaraskan untuk kepadatan, gelombang semula jadi, bentuk dahi, dan iklim. Anda mahukan mood tren, bukan salinan yang runtuh menjelang makan tengah hari.",
    ask_barber:
      "Tanya elemen mana yang realistik untuk rambut anda: fringe lebih lembut, pergerakan berlapis, pengaruh down-perm, atau perimeter lebih kemas yang memudahkan kawalan tempatan.",
    maintenance:
      "Kebanyakan potongan inspirasi Korea memerlukan teknik pengeringan lebih baik daripada jangkaan. Pengeringan berarah, krim styling ringan, dan kawalan fringe sering lebih penting daripada produk pegangan kuat.",
    mistakes:
      "Kesilapan terbesar ialah menyalin panjang dan kelembutan tepat dari rujukan tanpa mengambil kira kelembapan tempatan dan corak pertumbuhan anda sendiri. Itu biasanya membawa kepada rata atau kusut.",
    rebook:
      "Gaya ini sering kelihatan terbaik dengan penjagaan 4 minggu, terutamanya jika fringe dan bentuk sisi penting untuk siluet keseluruhan.",
  },
  {
    slug: "parents-guide-to-better-kids-haircuts",
    title_ms: "Panduan Ibu Bapa untuk Potongan Rambut Kanak-kanak yang Lebih Baik",
    excerpt_ms:
      "Cara ibu bapa memilih potongan kanak-kanak yang mudah diurus, kelihatan kemas, selesa, dan praktikal untuk sekolah.",
    intro:
      "Potongan kanak-kanak harus lebih daripada sekadar pendekkan sahaja. Ia perlu sepadan dengan tekstur rambut anak, tahap keselesaan, rutin sekolah, dan berapa penjagaan yang ibu bapa boleh lakukan secara realistik sebelum tergesa-gesa keluar.",
    why_it_works:
      "Potongan kanak-kanak terbaik selesa, mudah dicuci, dan memaafkan apabila anak tidur, berpeluh, atau berlari sepanjang hari. Ia juga harus tumbuh tanpa kelihatan huru-hara terlalu cepat.",
    ask_barber:
      "Ibu bapa harus memberitahu sama ada anak tidak suka clipper, benci fringe di mata, kerap bersukan, atau mempunyai peraturan penampilan sekolah yang mesti dipatuhi.",
    maintenance:
      "Kekalkan styling minimum, utamakan keselesaan, dan pilih potongan yang tidak memerlukan kesempurnaan harian. Untuk kebanyakan kanak-kanak, bentuk kemas dan rutin mudah lebih penting daripada ikut tren.",
    mistakes:
      "Kesilapan terbesar ialah memilih potongan dewasa yang memerlukan disiplin harian daripada kanak-kanak yang hanya mahu bersiap cepat dan meneruskan hari.",
    rebook:
      "Kebanyakan kanak-kanak berjaya dengan potongan setiap 4 hingga 6 minggu, bergantung pada standard sekolah dan seberapa cepat fringe atau sisi tumbuh.",
  },
  {
    slug: "barbershop-etiquette-and-booking-tips",
    title_ms: "Etika Kedai Gunting dan Tips Tempahan yang Perlu Diketahui Pelanggan",
    excerpt_ms:
      "Tabiat mudah yang menjadikan temujanji lebih lancar untuk anda, barber anda, dan mereka yang menunggu selepas anda.",
    intro:
      "Pengalaman kedai gunting yang lebih baik bukan hanya tentang potongan. Ia juga bergantung pada cara pelanggan menempah, berkomunikasi, tiba, dan mengurus jangkaan. Etika baik menjadikan temujanji lebih lancar dan biasanya membawa hasil lebih baik.",
    why_it_works:
      "Apabila pelanggan jelas, tepat pada masa, dan menghormati masa, barber boleh memberi tumpuan sepenuhnya pada perkhidmatan daripada bergegas mengatasi gangguan yang boleh dielakkan.",
    ask_barber:
      "Tempah slot masa yang betul, tiba dengan masa untuk menenang diri, dan beritahu barber awal jika anda perlu pergi pada masa tertentu. Itu membantu mereka memutuskan sama ada perkhidmatan diminta realistik untuk sesi tersebut.",
    maintenance:
      "Jika anda menggunakan platform tempahan, kemas kini nota, simpan foto rujukan, dan batalkan awal jika rancangan berubah. Tabiat kecil ini membina hubungan lebih baik dari masa ke masa.",
    mistakes:
      "Kesilapan biasa termasuk lewat dengan rujukan rumit, menukar rancangan potongan di tengah-tengah, atau menganggap barber boleh melakukan transformasi penuh dalam slot asas pendek.",
    rebook:
      "Rentak tempahan anda bergantung pada gaya anda, tetapi etika harus konsisten setiap lawatan. Ia menjimatkan masa, mengurangkan tekanan, dan membina kepercayaan.",
  },
  {
    slug: "how-to-build-a-signature-hairstyle",
    title_ms: "Cara Membina Gaya Rambut Tanda Tangan Daripada Mengikut Setiap Tren",
    excerpt_ms:
      "Cara lebih bijak membina penampilan peribadi yang kekal dikenali, menyanjung, dan mudah dijaga.",
    intro:
      "Gaya rambut tanda tangan bukan tentang tidak pernah menukar rambut. Ia tentang mengetahui siluet, tekstur, dan tahap penjagaan yang membuatkan anda paling kelihatan seperti diri sendiri, kemudian memperhalusi sekitar identiti itu.",
    why_it_works:
      "Tren boleh memberi inspirasi, tetapi gaya peribadi bertahan lebih lama apabila dibina pada bentuk muka, tingkah laku rambut, pakaian, konteks kerja, dan keyakinan. Itulah yang menjadikan potongan terasa tulen daripada dipinjam.",
    ask_barber:
      "Tanya ciri mana yang sesuai untuk anda secara konsisten merentasi versi potongan berbeza. Ia mungkin bahagian hadapan ke sisi, taper rendah, ketinggian bertekstur, atau garis luar padat di sekitar pelipis.",
    maintenance:
      "Dokumenkan potongan terbaik anda, nota produk yang berfungsi, dan perhatikan versi mana menjadi lebih mudah dengan pengulangan. Gaya tanda tangan biasanya ditemui melalui penghalusan, bukan satu perubahan mengejut.",
    mistakes:
      "Kesilapan terbesar ialah melompat dari tren ke tren tanpa belajar apa yang sebenarnya sesuai dengan ciri anda. Itu mencipta ketidakkonsistenan dan menjadikan setiap potongan terasa bermula dari sifar.",
    rebook:
      "Setelah anda menemui bentuk teras, kekalkan ia setiap 3 hingga 5 minggu dan eksperimen hanya satu pemboleh ubah pada satu masa supaya penambahbaikan kekal disengajakan.",
  },
  {
    slug: "beard-trim-or-clean-shave-how-to-decide",
    title_ms: "Trim Janggut atau Cukur Licin? Cara Memilih Yang Paling Sesuai",
    excerpt_ms:
      "Kerangka praktikal untuk memilih antara janggut kemas, misai halus, atau cukuran licin sepenuhnya.",
    intro:
      "Keputusan antara mengekalkan janggut dan cukur licin bukan hanya estetik. Ia mempengaruhi bentuk muka, rutin penjagaan, imej kerja, keselesaan kulit, dan seberapa formal atau santai anda kelihatan.",
    why_it_works:
      "Sesetengah lelaki kelihatan lebih kuat dengan struktur ringan di rahang, manakala yang lain kelihatan lebih segar dan tajam dengan cukuran licin. Pilihan terbaik bergantung pada corak pertumbuhan, kepatchy, sensitiviti kulit, dan peranan penjagaan dalam imej harian anda.",
    ask_barber:
      "Tanya sama ada kepadatan janggut menyokong panjang yang anda mahukan, di mana pertumbuhan terkuat, dan sama ada janggut kotak pendek, misai reka bentuk, atau cukuran licin memberi keseimbangan terbaik untuk ciri anda.",
    maintenance:
      "Jika anda mengekalkan rambut muka, komit kepada penyelenggaraan tepi dan disiplin leher. Jika anda cukur licin, laburkan dalam penyediaan, teknik, dan penjagaan selepas yang lebih baik supaya kulit kekal tenang dan licin.",
    mistakes:
      "Kesilapan terbesar ialah memilih panjang janggut yang corak pertumbuhan tidak sokong, atau mencukur setiap hari dengan penyediaan lemah kemudian menganggap kerengsaan tidak boleh dielakkan.",
    rebook:
      "Janggut pendek sering memerlukan kemasan setiap 1 hingga 2 minggu. Rutin cukur licin memerlukan penjagaan peribadi lebih kerap, tetapi ramai lelaki masih mendapat manfaat daripada pembentukan barber berkala di sekitar misai dan sideburn.",
  },
];

let sql = `-- Seed Malay (BM) blog copy for existing English posts (idempotent updates by slug)\n\n`;

for (const p of posts) {
  const content = htmlTpl(
    p.intro,
    p.why_it_works,
    p.ask_barber,
    p.maintenance,
    p.mistakes,
    p.rebook
  );
  const esc = (s) => s.replace(/'/g, "''");
  sql += `update public.blog_posts set\n`;
  sql += `  title_ms = '${esc(p.title_ms)}',\n`;
  sql += `  excerpt_ms = '${esc(p.excerpt_ms)}',\n`;
  sql += `  content_ms = $malay$${content}$malay$\n`;
  sql += `where slug = '${p.slug}';\n\n`;
}

writeFileSync(out, sql, "utf8");
console.log("Wrote", out);
