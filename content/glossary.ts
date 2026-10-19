/**
 * Glosarium — F-08 dan Lampiran PRD §19.
 *
 * PRD §19: "Daftar ini adalah inti glosarium (41 istilah) yang menjadi dasar
 * 120 istilah di MVP." Ke-41 istilah itu ditulis lengkap di sini.
 *
 * F-08: "tiap istilah dengan mini-animasi 3-6 detik". Mini-animasi BUKAN video:
 * ia adalah potongan waktu dari taktik yang sudah ada, diputar oleh Tactic
 * Engine yang sama. Konsekuensinya satu istilah tidak pernah bisa menunjukkan
 * gerakan yang berbeda dari taktik aslinya.
 */

/** Potongan taktik yang diputar sebagai mini-animasi istilah. */
export interface TermClip {
  /** id taktik di content/tactics/ */
  tacticId: string
  /** Detik mulai */
  from: number
  /** Detik selesai (3-6 detik setelah `from`) */
  to: number
  /** POV yang disorot, bila istilah ini paling jelas dari satu posisi */
  pov?: string
  /** Cabang yang diaktifkan — dipakai istilah coverage */
  branches?: string[]
  /** Lapisan yang dinyalakan untuk menjelaskan istilah ini */
  layers?: ('spacing' | 'passLanes' | 'visionCones' | 'trails')[]
}

export interface GlossaryTerm {
  /** Slug yang dipakai sebagai anchor dan referensi dari taktik */
  id: string
  /** Istilah asli — PRD prinsip: "Istilah asli, penjelasan lokal" */
  term: string
  /** Padanan Bahasa Indonesia bila ada */
  padanan?: string
  /** Arti singkat satu kalimat (kolom "Arti singkat" PRD §19) */
  short: string
  /** Penjelasan lengkap: kapan dipakai dan mengapa penting */
  long: string
  /** Level tempat istilah pertama kali diajarkan (PRD §19 kolom Level) */
  level: 1 | 2 | 3
  /** Istilah terkait */
  related: string[]
  clip?: TermClip
}

export const GLOSSARY: GlossaryTerm[] = [
  {
    id: 'backdoor-cut',
    term: 'Backdoor cut',
    padanan: 'cut pintu belakang',
    short: 'Cut ke ring di belakang bek yang terlalu menolak umpan.',
    long: 'Saat bek berdiri di jalur umpan untuk menolak bola (deny), punggungnya menghadap ring. Backdoor cut menghukum posisi itu: penyerang berbalik dan memotong ke ring di belakang bek, lalu menerima bounce pass rendah. Semakin agresif deny lawan, semakin sering backdoor tersedia.',
    level: 2,
    related: ['deny', 'help-side', 'spacing'],
    clip: { tacticId: 'off-5-out-motion', from: 4.4, to: 7.0, pov: 'O1' },
  },
  {
    id: 'back-screen',
    term: 'Back screen',
    padanan: 'screen dari belakang',
    short: 'Screen yang dipasang di belakang bek, di sisi yang tidak ia lihat.',
    long: 'Screener datang dari sisi buta bek dan menahannya saat bek sedang memperhatikan bola. Karena bek tidak melihat kontak datang, back screen jauh lebih sulit dihindari daripada screen biasa — tetapi screener wajib memberi ruang satu langkah normal, atau peluit akan berbunyi.',
    level: 2,
    related: ['ball-screen', 'pick-and-roll', 'slip', 'switch'],
    clip: { tacticId: 'set-spain-pnr', from: 3.0, to: 6.0, pov: 'O2' },
  },
  {
    id: 'ball-screen',
    term: 'Ball screen',
    padanan: 'screen untuk pembawa bola',
    short: 'Screen yang dipasang untuk pemain yang sedang membawa bola.',
    long: 'Screener berdiri diam di jalur bek pembawa bola, memaksa bek memilih: lewat atas, lewat bawah, atau menyerahkan tugas ke rekannya. Dari satu ball screen muncul pick-and-roll, pick-and-pop, dan seluruh keluarga coverage pertahanan.',
    level: 2,
    related: ['pick-and-roll', 'pick-and-pop', 'drop', 'switch'],
    clip: { tacticId: 'off-spread-pnr', from: 1.4, to: 3.2 },
  },
  {
    id: 'baseline',
    term: 'Baseline',
    padanan: 'garis akhir',
    short: 'Garis batas lapangan di belakang ring.',
    long: 'Baseline membatasi lapangan di belakang kedua ring. Ia menjadi jalur cut favorit karena bek sering kehilangan pandangan ke penyerang yang bergerak di belakang punggungnya, dan menjadi batas alami yang dipakai pertahanan untuk menjebak pembawa bola.',
    level: 1,
    related: ['corner', 'short-corner', 'blob'],
    clip: { tacticId: 'special-blob-box', from: 1.0, to: 4.0 },
  },
  {
    id: 'blitz',
    term: 'Blitz',
    padanan: 'jebakan ganda',
    short: 'Dua bek mengepung pembawa bola segera setelah screen.',
    long: 'Juga disebut trap. Bek pembawa bola dan bek screener sama-sama menyerang pembawa bola untuk memaksa bola lepas. Harganya mahal: di belakang jebakan tertinggal 4 lawan 3, jadi serangan yang tenang justru mendapat tembakan terbuka.',
    level: 2,
    related: ['short-roll', 'hedge', 'drop', 'pick-and-roll'],
    clip: {
      tacticId: 'off-spread-pnr',
      from: 1.8,
      to: 5.6,
      branches: ['b-cov-blitz'],
    },
  },
  {
    id: 'blob',
    term: 'BLOB',
    padanan: 'inbound dari baseline',
    short: 'Baseline out of bounds — bola dimasukkan dari garis akhir.',
    long: 'Situasi khusus dengan batas lima detik. Karena pengumpan berdiri di luar lapangan dan empat rekannya bisa saling memasang screen di ruang sempit, BLOB adalah salah satu peluang tembakan terbuka paling bisa diandalkan dalam satu pertandingan.',
    level: 3,
    related: ['slob', 'baseline', 'ball-screen'],
    clip: { tacticId: 'special-blob-box', from: 0.0, to: 4.6 },
  },
  {
    id: 'box-out',
    term: 'Box out',
    padanan: 'mengunci badan',
    short: 'Menghalangi lawan dengan badan untuk merebut rebound.',
    long: 'Pemain memutar badan sehingga punggungnya menghadap lawan, lalu melebarkan kaki dan menahan posisi. Rebound hampir selalu dimenangkan oleh posisi, bukan oleh lompatan tertinggi — dan pertahanan zona paling sering kehilangan rebound karena tidak ada lawan jaga tetap untuk di-box out.',
    level: 1,
    related: ['rim-runner', 'closeout'],
    clip: { tacticId: 'def-zone-2-3', from: 4.4, to: 6.0, pov: 'X5' },
  },
  {
    id: 'closeout',
    term: 'Closeout',
    padanan: 'lari menghadang',
    short: 'Bek berlari ke penembak lalu memendekkan langkah untuk menghadang tembakan.',
    long: 'Closeout yang baik tiba dengan langkah pendek dan badan tinggi, satu tangan ke atas, agar bisa langsung bergeser bila penyerang memilih drive. Closeout yang terlalu cepat memberi drive; yang terlalu lambat memberi tembakan. Jarak closeout inilah yang membuat tembakan sudut begitu bernilai.',
    level: 1,
    related: ['corner', 'kick-out', 'skip-pass'],
    clip: { tacticId: 'zone-vs-2-3', from: 4.0, to: 6.8, pov: 'O5' },
  },
  {
    id: 'corner',
    term: 'Corner',
    padanan: 'sudut lapangan',
    short: 'Sudut lapangan, pertemuan baseline dan sideline.',
    long: 'Di lapangan FIBA, garis 3 poin di sudut hanya 6,60 m dari ring — lebih dekat daripada busur 6,75 m di tempat lain. Itu membuat sudut jadi tembakan 3 poin terdekat di seluruh lapangan, dan membuat setiap bek yang meninggalkan sudut untuk membantu membayar mahal.',
    level: 1,
    related: ['short-corner', 'baseline', 'kick-out', 'spacing'],
    clip: { tacticId: 'off-spread-pnr', from: 3.4, to: 6.2, pov: 'O4' },
  },
  {
    id: 'dribble-handoff',
    term: 'Dribble handoff (DHO)',
    padanan: 'serah bola sambil dribble',
    short: 'Menyerahkan bola langsung ke rekan sambil berpapasan.',
    long: 'Pembawa bola mendribble ke arah rekan dan menyerahkan bola dari tangan ke tangan. Karena badannya sekaligus menjadi screen, DHO adalah screen dan umpan dalam satu gerakan — dan sangat sulit di-switch karena pertukaran harus terjadi tepat saat bola berpindah.',
    level: 2,
    related: ['ball-screen', 'pick-and-roll', 'slip'],
  },
  {
    id: 'drop',
    term: 'Drop',
    padanan: 'mundur ke paint',
    short: 'Coverage pick-and-roll: bek big mundur ke paint.',
    long: 'Bek screener mundur setinggi garis lemparan bebas untuk melindungi ring, sementara bek pembawa bola mengejar lewat atas screen. Drop adalah coverage paling aman terhadap layup, tetapi sengaja memberikan tembakan pull-up jarak menengah dan pick-and-pop.',
    level: 2,
    related: ['hedge', 'blitz', 'switch', 'ice', 'pick-and-pop'],
    clip: { tacticId: 'off-spread-pnr', from: 1.6, to: 4.4 },
  },
  {
    id: 'elbow',
    term: 'Elbow',
    padanan: 'sudut garis lemparan bebas',
    short: 'Sudut pertemuan garis lemparan bebas dan sisi paint.',
    long: 'Dua elbow adalah titik awal formasi Horns dan tempat berdiri favorit big yang bisa mengumpan. Dari elbow, seorang pemain melihat ring, kedua sudut, dan kedua wing sekaligus.',
    level: 1,
    related: ['high-post', 'horns', 'paint'],
    clip: { tacticId: 'set-horns', from: 0.0, to: 3.0 },
  },
  {
    id: 'flare-screen',
    term: 'Flare screen',
    padanan: 'screen menjauhi bola',
    short: 'Screen yang membuat pemain bergerak MENJAUHI bola.',
    long: 'Berbeda dari screen biasa yang membawa pemain ke arah bola, flare screen melepaskan penembak ke sisi berlawanan. Ia menghukum bek yang terlalu memperhatikan bola, dan biasanya diselesaikan dengan skip pass melewati pertahanan.',
    level: 2,
    related: ['pin-down', 'stagger', 'skip-pass'],
  },
  {
    id: 'hedge',
    term: 'Hedge / Show',
    padanan: 'keluar sesaat',
    short: 'Bek big keluar sesaat menghadang pembawa bola, lalu kembali ke screener.',
    long: 'Tujuannya memperlambat pembawa bola agar bek pembawa bola punya waktu pulih. Harganya: selama bek big berada di luar, screener terbuka sesaat — dan umpan cepat ke short roll menghukum tepat di celah itu.',
    level: 2,
    related: ['drop', 'blitz', 'short-roll', 'slip'],
    clip: {
      tacticId: 'off-spread-pnr',
      from: 1.8,
      to: 5.4,
      branches: ['b-cov-hedge'],
    },
  },
  {
    id: 'help-side',
    term: 'Help side',
    padanan: 'sisi bantuan',
    short: 'Sisi lapangan tanpa bola; juga disebut weak side.',
    long: 'Bek di help side berdiri lebih jauh dari lawannya agar bisa membantu ke arah bola. Di sinilah seluruh ketegangan bertahan berada: setiap langkah membantu adalah satu langkah meninggalkan penembak, dan serangan yang baik selalu menghukum langkah itu.',
    level: 1,
    related: ['strong-side', 'tag', 'x-out', 'skip-pass'],
    clip: { tacticId: 'off-spread-pnr', from: 2.6, to: 6.2, layers: ['passLanes'] },
  },
  {
    id: 'high-post',
    term: 'High post',
    padanan: 'pos atas',
    short: 'Area sekitar garis lemparan bebas.',
    long: 'Dari high post, seorang pemain melihat seluruh pertahanan sekaligus — itulah sebabnya zona paling takut membiarkan bola masuk ke sini. Dalam serangan melawan zona, flash ke high post adalah umpan yang meruntuhkan bentuk pertahanan.',
    level: 1,
    related: ['elbow', 'post-up', 'skip-pass'],
    clip: { tacticId: 'zone-vs-2-3', from: 1.6, to: 4.6, pov: 'O4' },
  },
  {
    id: 'horns',
    term: 'Horns',
    padanan: 'formasi tanduk',
    short: 'Formasi dengan dua big di kedua elbow dan dua pemain di sudut.',
    long: 'Satu formasi yang menghasilkan banyak aksi: PG bisa memilih sisi mana pun untuk pick-and-roll, dan big yang tidak dipakai menjadi ancaman kedua yang bergerak ke arah berlawanan. Pertahanan harus menunggu sampai PG memilih.',
    level: 3,
    related: ['elbow', 'pick-and-roll', 'pick-and-pop'],
    clip: { tacticId: 'set-horns', from: 0.0, to: 4.2 },
  },
  {
    id: 'ice',
    term: 'Ice / Blue',
    padanan: 'tolak screen',
    short: 'Coverage PnR di sisi lapangan: pembawa bola dipaksa ke baseline.',
    long: 'Bek pembawa bola melompat ke sisi atas screen untuk menutup akses, sementara bek big turun di sisi baseline. Bola jadi jauh dari tengah lapangan, tempat paling banyak pilihan. Jawabannya adalah re-screen ke arah sebaliknya, atau big pop ke elbow.',
    level: 2,
    related: ['drop', 'hedge', 'ball-screen'],
    clip: {
      tacticId: 'off-spread-pnr',
      from: 1.4,
      to: 5.4,
      branches: ['b-cov-ice'],
    },
  },
  {
    id: 'isolation',
    term: 'Isolation (iso)',
    padanan: 'satu lawan satu',
    short: 'Satu lawan satu dengan rekan lain menjauh memberi ruang.',
    long: 'Empat penyerang memberi jarak maksimal agar tidak ada bek yang cukup dekat untuk membantu. Iso bekerja bila penyerangnya benar-benar bisa mengalahkan bek sendiri; bila tidak, ia hanya membuang possession tanpa gerakan.',
    level: 2,
    related: ['spacing', 'mismatch', 'post-up'],
  },
  {
    id: 'kick-out',
    term: 'Kick-out',
    padanan: 'umpan keluar',
    short: 'Umpan keluar ke penembak setelah drive ke dalam.',
    long: 'Drive menarik bek help; kick-out menghukum perpindahan itu. Kuncinya adalah mengumpan sebelum bek help sempat kembali — dan karena itu aturan keputusan 0,5 detik berlaku untuk penerimanya juga.',
    level: 2,
    related: ['closeout', 'skip-pass', 'help-side', 'corner'],
    clip: { tacticId: 'off-spread-pnr', from: 3.8, to: 6.2 },
  },
  {
    id: 'low-block',
    term: 'Low block',
    padanan: 'blok bawah',
    short: 'Area di samping paint, dekat ring.',
    long: 'Kotak kecil di sisi paint dekat garis akhir. Tempat klasik untuk post up dan titik awal banyak screen di baseline. Dalam pertahanan zona, dua forward memulai dari sini.',
    level: 1,
    related: ['post-up', 'paint', 'short-corner'],
    clip: { tacticId: 'def-zone-2-3', from: 0.0, to: 3.0 },
  },
  {
    id: 'mismatch',
    term: 'Mismatch',
    padanan: 'pasangan jaga timpang',
    short: 'Pasangan jaga yang timpang dalam ukuran atau kecepatan.',
    long: 'Hasil paling sering dari switch: big menjaga guard cepat, atau guard menjaga big besar. Serangan menghukumnya lewat post up untuk mismatch ukuran, atau iso untuk mismatch kecepatan — dan harus melakukannya cepat sebelum pertahanan bisa menukar kembali.',
    level: 2,
    related: ['switch', 'post-up', 'isolation'],
    clip: {
      tacticId: 'off-spread-pnr',
      from: 2.6,
      to: 6.0,
      branches: ['b-cov-switch'],
    },
  },
  {
    id: 'paint',
    term: 'Paint / Key',
    padanan: 'area terlarang',
    short: 'Area persegi di depan ring; lebar 4,90 m pada aturan FIBA.',
    long: 'Penyerang tidak boleh berada di paint lebih dari tiga detik berturut-turut. Hampir semua taktik modern dibangun untuk mengosongkan paint bagi drive, atau mengisinya dengan satu ancaman post.',
    level: 1,
    related: ['low-block', 'high-post', 'elbow'],
    clip: { tacticId: 'off-5-out-motion', from: 0.0, to: 3.0, layers: ['spacing'] },
  },
  {
    id: 'pick-and-pop',
    term: 'Pick-and-pop',
    padanan: 'screen lalu keluar menembak',
    short: 'Setelah screen, screener keluar ke luar untuk menembak.',
    long: 'Kebalikan dari roll. Bila bek big memakai coverage drop, ia mundur ke paint dan meninggalkan screener terbuka di perimeter. Pick-and-pop adalah hukuman langsung untuk drop yang terlalu dalam.',
    level: 2,
    related: ['pick-and-roll', 'drop', 'ball-screen'],
    clip: { tacticId: 'set-horns', from: 2.6, to: 6.4, pov: 'O4' },
  },
  {
    id: 'pick-and-roll',
    term: 'Pick-and-roll',
    padanan: 'screen lalu masuk ke ring',
    short: 'Setelah screen, screener bergerak ke ring.',
    long: 'Aksi dua pemain paling penting di basket modern. Ia memaksa dua bek membuat keputusan bersamaan, dan setiap keputusan itu meninggalkan sesuatu yang terbuka. Seluruh keluarga coverage pertahanan — drop, hedge, blitz, switch, ice, at-level — ada hanya untuk menjawab aksi ini.',
    level: 2,
    related: ['ball-screen', 'pick-and-pop', 'short-roll', 'drop', 'switch'],
    clip: { tacticId: 'off-spread-pnr', from: 1.4, to: 4.4 },
  },
  {
    id: 'pin-down',
    term: 'Pin-down',
    padanan: 'screen ke arah baseline',
    short: 'Screen ke arah baseline untuk pemain yang naik ke perimeter.',
    long: 'Screener menghadap baseline dan menahan bek penembak di bawah, sehingga penembak bisa naik bebas ke wing atau top. Pin-down adalah bahan dasar set play seperti Zipper dan Chicago.',
    level: 2,
    related: ['flare-screen', 'stagger', 'dribble-handoff'],
  },
  {
    id: 'post-up',
    term: 'Post up',
    padanan: 'bertumpu di post',
    short: 'Membelakangi ring di area post untuk menerima bola.',
    long: 'Penyerang menahan posisi dengan badan dan meminta bola di dekat ring. Nilainya naik tajam ketika ada mismatch ukuran, dan turun ketika paint penuh — karena itu post up modern hampir selalu dipasangkan dengan spacing lebar.',
    level: 1,
    related: ['low-block', 'high-post', 'mismatch', 'isolation'],
    clip: {
      tacticId: 'off-spread-pnr',
      from: 3.0,
      to: 6.0,
      branches: ['b-cov-switch'],
      pov: 'O5',
    },
  },
  {
    id: 'rim-runner',
    term: 'Rim runner',
    padanan: 'pelari ring',
    short: 'Big yang berlari langsung ke ring saat roll atau transisi.',
    long: 'Peran big modern yang nilainya datang dari kecepatan, bukan dari post play. Rim runner memaksa pertahanan transisi memilih antara menghentikan bola dan melindungi ring.',
    level: 2,
    related: ['pick-and-roll', 'transisi', 'box-out'],
    clip: { tacticId: 'press-break', from: 2.6, to: 7.4, pov: 'O4' },
  },
  {
    id: 'short-roll',
    term: 'Short roll',
    padanan: 'roll pendek',
    short: 'Roll yang berhenti di tengah area, lalu menjadi pengumpan.',
    long: 'Jawaban utama terhadap blitz. Screener tidak melanjutkan ke ring, tetapi berhenti di sekitar garis lemparan bebas untuk menerima umpan keluar dari jebakan. Dari sana ia punya keunggulan 4 lawan 3 dan tugasnya berubah menjadi pengumpan.',
    level: 2,
    related: ['blitz', 'hedge', 'pick-and-roll', 'slip'],
    clip: {
      tacticId: 'off-spread-pnr',
      from: 2.4,
      to: 6.2,
      branches: ['b-cov-blitz'],
      pov: 'O5',
    },
  },
  {
    id: 'skip-pass',
    term: 'Skip pass',
    padanan: 'umpan lompat',
    short: 'Umpan melewati sisi bola langsung ke sisi seberang.',
    long: 'Satu umpan yang melewati satu atau dua penerima. Nilainya terletak pada kecepatan: pertahanan bergeser lebih cepat daripada bola yang diputar satu-satu, tetapi tidak lebih cepat daripada satu umpan panjang yang melewati seluruh pergeseran.',
    level: 1,
    related: ['help-side', 'corner', 'closeout', 'flare-screen'],
    clip: { tacticId: 'zone-vs-2-3', from: 3.6, to: 6.8 },
  },
  {
    id: 'slip',
    term: 'Slip',
    padanan: 'lolos sebelum kontak',
    short: 'Screener lari ke ring sebelum kontak screen terjadi.',
    long: 'Ketika pertahanan bersiap switch atau hedge, screener justru tidak memasang screen sama sekali — ia langsung memotong ke ring sebelum pertukaran selesai. Slip menghukum pertahanan yang bereaksi terhadap screen yang belum terjadi.',
    level: 2,
    related: ['ball-screen', 'switch', 'hedge', 'short-roll'],
    clip: {
      tacticId: 'set-spain-pnr',
      from: 2.8,
      to: 6.0,
      branches: ['b-cov-switch'],
      pov: 'O2',
    },
  },
  {
    id: 'slot',
    term: 'Slot',
    padanan: 'celah atas',
    short: 'Area di antara top of key dan wing.',
    long: 'Titik awal yang nyaman untuk memulai pick-and-roll karena memberi sudut ke ring maupun ke kedua sudut. Dalam bentuk 5-out, dua slot biasanya terisi.',
    level: 1,
    related: ['top-of-key', 'wing', 'spacing'],
    clip: { tacticId: 'off-5-out-motion', from: 0.0, to: 3.2, layers: ['spacing'] },
  },
  {
    id: 'spacing',
    term: 'Spacing',
    padanan: 'jarak dan sebaran',
    short: 'Jarak dan sebaran pemain menyerang di lapangan.',
    long: 'Konsep paling menentukan di serangan modern. Jarak ideal antarpemain sekitar 4,5-5,5 m: cukup jauh sehingga satu bek tidak bisa menjaga dua penyerang, cukup dekat sehingga umpan masih aman. Setiap langkah yang merusak spacing memberi pertahanan satu bek gratis.',
    level: 2,
    related: ['help-side', 'corner', 'isolation', 'slot'],
    clip: { tacticId: 'off-spread-pnr', from: 0.0, to: 3.4, layers: ['spacing'] },
  },
  {
    id: 'stagger',
    term: 'Stagger',
    padanan: 'dua screen berurutan',
    short: 'Dua screen berurutan untuk satu pemain.',
    long: 'Dua screener berdiri berjarak beberapa langkah sehingga penembak melewati keduanya satu per satu. Pertahanan harus menyelesaikan dua keputusan dalam satu detik, dan kesalahan pada salah satunya sudah cukup.',
    level: 3,
    related: ['pin-down', 'flare-screen'],
  },
  {
    id: 'strong-side',
    term: 'Strong side',
    padanan: 'sisi bola',
    short: 'Sisi lapangan tempat bola berada; juga disebut ball side.',
    long: 'Pertahanan membagi lapangan dengan garis imajiner memanjang. Di strong side, bek menempel lawannya; di help side, bek berdiri lebih jauh untuk membantu. Hampir semua prinsip bertahan man-to-man diturunkan dari pembagian ini.',
    level: 1,
    related: ['help-side', 'spacing', 'tag'],
    clip: { tacticId: 'def-zone-2-3', from: 1.4, to: 4.4 },
  },
  {
    id: 'switch',
    term: 'Switch',
    padanan: 'tukar lawan jaga',
    short: 'Dua bek bertukar lawan jaga.',
    long: 'Coverage paling sederhana terhadap screen: tidak ada celah yang diberikan sama sekali. Harganya adalah mismatch — dan pertahanan yang switch harus siap menjaga post up maupun iso tepat setelahnya.',
    level: 2,
    related: ['mismatch', 'slip', 'drop', 'pick-and-roll'],
    clip: {
      tacticId: 'off-spread-pnr',
      from: 1.6,
      to: 6.0,
      branches: ['b-cov-switch'],
    },
  },
  {
    id: 'tag',
    term: 'Tag',
    padanan: 'tahan sesaat',
    short: 'Bek sisi lemah menahan roller sesaat.',
    long: 'Bek help melangkah ke jalur roll untuk memperlambatnya, lalu kembali ke lawannya. Tag yang terlalu lama meninggalkan penembak sudut terbuka; tag yang terlalu singkat tidak menghentikan roller. Seluruh nilai sudut dalam serangan modern berasal dari dilema ini.',
    level: 2,
    related: ['help-side', 'x-out', 'corner', 'closeout'],
    clip: { tacticId: 'off-spread-pnr', from: 2.8, to: 6.2, pov: 'O4' },
  },
  {
    id: 'top-of-key',
    term: 'Top of key',
    padanan: 'puncak busur',
    short: 'Area di atas busur lemparan bebas.',
    long: 'Titik awal paling umum untuk memulai set. Dari top of key, pembawa bola melihat kedua sisi lapangan dengan sudut yang sama, sehingga pertahanan tidak bisa menebak arah.',
    level: 1,
    related: ['slot', 'wing', 'horns'],
    clip: { tacticId: 'set-horns', from: 0.0, to: 2.6 },
  },
  {
    id: 'transisi',
    term: 'Transition',
    padanan: 'transisi',
    short: 'Perpindahan dari bertahan ke menyerang, atau sebaliknya.',
    long: 'Beberapa detik paling efisien dalam satu pertandingan, karena pertahanan belum tersusun. Serangan transisi menang lewat lebar jalur lari; pertahanan transisi menang lewat urutan: lari balik, lindungi ring, hentikan bola, baru cari lawan.',
    level: 2,
    related: ['rim-runner', 'spacing'],
    clip: { tacticId: 'press-break', from: 2.6, to: 7.4 },
  },
  {
    id: 'triple-threat',
    term: 'Triple threat',
    padanan: 'posisi tiga ancaman',
    short: 'Posisi siap menembak, mengumpan, atau dribble sekaligus.',
    long: 'Kaki selebar bahu, lutut ditekuk, bola di dekat pinggul sisi dominan. Dari posisi ini ketiga pilihan sama-sama cepat, sehingga bek tidak bisa menebak. Melepas posisi ini — misalnya mengangkat bola di atas kepala — langsung menghapus satu atau dua ancaman.',
    level: 1,
    related: ['isolation', 'post-up'],
  },
  {
    id: 'wing',
    term: 'Wing',
    padanan: 'sayap',
    short: 'Area samping lapangan di garis 3 poin, sejajar garis lemparan bebas.',
    long: 'Titik penerima paling umum dalam serangan setengah lapangan. Dari wing, seorang pemain punya sudut ke ring, ke sudut di bawahnya, dan ke top — karena itu hampir setiap serangan dimulai dengan umpan ke wing.',
    level: 1,
    related: ['slot', 'corner', 'top-of-key'],
    clip: { tacticId: 'off-5-out-motion', from: 0.0, to: 3.2 },
  },
  {
    id: 'x-out',
    term: 'X-out',
    padanan: 'rotasi bersilang',
    short: 'Rotasi bertahan bersilang setelah ada bek yang membantu.',
    long: 'Ketika bek sudut pergi menahan roller, bek sudut yang lain harus menutup penembak di sudut pertama — jalur dua bek itu bersilang seperti huruf X. Rotasi ini adalah ujian terakhir pertahanan help: satu kesalahan komunikasi langsung menjadi tembakan terbuka.',
    level: 2,
    related: ['tag', 'help-side', 'closeout', 'corner'],
    clip: { tacticId: 'off-spread-pnr', from: 2.8, to: 6.2, layers: ['passLanes'] },
  },
  /* --- Istilah pelengkap yang dirujuk taktik & kurikulum ------------------ */
  {
    id: 'deny',
    term: 'Deny',
    padanan: 'tolak umpan',
    short: 'Bek berdiri di jalur umpan untuk menolak bola sampai ke lawannya.',
    long: 'Satu tangan dan satu kaki di jalur umpan, badan menghadap bola. Deny mematikan umpan langsung, tetapi membuat bek kehilangan pandangan ke ring di belakangnya — dan di situlah backdoor cut hidup.',
    level: 2,
    related: ['backdoor-cut', 'help-side', 'strong-side'],
    clip: { tacticId: 'off-5-out-motion', from: 3.4, to: 6.0 },
  },
  {
    id: 'short-corner',
    term: 'Short corner',
    padanan: 'sudut pendek',
    short: 'Area di dalam garis 3 poin dekat baseline, di luar paint.',
    long: 'Titik lemah klasik pertahanan zona: terlalu jauh untuk center, terlalu dalam untuk forward. Pemain di short corner memaksa salah satu dari keduanya meninggalkan areanya.',
    level: 2,
    related: ['corner', 'baseline', 'low-block', 'high-post'],
    clip: { tacticId: 'zone-vs-2-3', from: 1.6, to: 5.0 },
  },
  {
    id: 'slob',
    term: 'SLOB',
    padanan: 'inbound dari sideline',
    short: 'Sideline out of bounds — bola dimasukkan dari garis samping.',
    long: 'Berbeda dari BLOB, pengumpan SLOB berdiri di samping lapangan sehingga sudut umpannya lebih sempit dan pertahanan punya lebih banyak ruang untuk menolak. Set SLOB biasanya memakai screen di sisi berlawanan untuk membuka jalur umpan.',
    level: 3,
    related: ['blob', 'baseline', 'ball-screen'],
  },
]

/* -------------------------------------------------------------------------- */
/* Pembantu                                                                   */
/* -------------------------------------------------------------------------- */

export function findTerm(id: string): GlossaryTerm | undefined {
  return GLOSSARY.find((t) => t.id === id)
}

/** Istilah diurutkan A-Z menurut ejaan aslinya (PRD §11 S-09: "Daftar A-Z"). */
export function glossaryAZ(): GlossaryTerm[] {
  return [...GLOSSARY].sort((a, b) => a.term.localeCompare(b.term, 'id'))
}

/** Kelompokkan menurut huruf pertama, untuk indeks A-Z. */
export function glossaryByLetter(): { letter: string; terms: GlossaryTerm[] }[] {
  const map = new Map<string, GlossaryTerm[]>()
  for (const t of glossaryAZ()) {
    const letter = t.term[0]?.toUpperCase() ?? '#'
    const list = map.get(letter)
    if (list) list.push(t)
    else map.set(letter, [t])
  }
  return [...map.entries()].map(([letter, terms]) => ({ letter, terms }))
}

export function termsForLevel(level: 1 | 2 | 3): GlossaryTerm[] {
  return GLOSSARY.filter((t) => t.level === level)
}
