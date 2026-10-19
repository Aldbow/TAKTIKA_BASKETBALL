/**
 * Kurikulum TAKTIKA — PRD §4 (Level 1), §5 (Level 2), §6 (Level 3).
 *
 * Struktur ini adalah sumber kebenaran Peta Jalur Belajar (F-05):
 *   Level 1 Fondasi  — 9 modul, 48 pelajaran
 *   Level 2 Konsep   — 9 modul, 46 pelajaran
 *   Level 3 Taktik   — 6 kategori Perpustakaan Taktik
 *
 * Judul modul, visualisasi kunci, dan jumlah pelajaran diambil langsung dari
 * tabel PRD. Pelajaran yang isinya sudah ditulis punya `status: 'ready'`;
 * sisanya `status: 'soon'` dan tampil sebagai simpul terkunci yang jelas
 * statusnya di peta — bukan tautan mati.
 */

export type LessonStatus = 'ready' | 'soon'

export interface LessonNode {
  id: string
  title: string
  /** Satu kalimat: apa yang dipelajari di sini */
  blurb: string
  /** Perkiraan menit (PRD §4: pelajaran pendek 3-5 menit) */
  minutes: number
  status: LessonStatus
  /** Istilah glosarium yang diperkenalkan pelajaran ini */
  terms?: string[]
}

export interface ModuleNode {
  /** Kode modul PRD, mis. "1.2" */
  code: string
  id: string
  title: string
  /** Kolom "Visualisasi kunci" di tabel PRD */
  keyVisual: string
  lessons: LessonNode[]
  /** Modul prasyarat (kode) */
  requires: string[]
}

export interface LevelNode {
  level: 1 | 2 | 3
  title: string
  subtitle: string
  /** Kalimat pembuka level, dipakai di Peta Jalur Belajar */
  intro: string
  modules: ModuleNode[]
}

/* ========================================================================== */
/* LEVEL 1 — FONDASI DASAR (PRD §4)                                           */
/* ========================================================================== */

const LEVEL_1: LevelNode = {
  level: 1,
  title: 'Fondasi Dasar',
  subtitle: '9 modul · 48 pelajaran',
  intro:
    'Semua pengetahuan dasar basket: tujuan permainan, lapangan, aturan waktu, pelanggaran, foul, posisi, dan skill dasar. Acuan aturan FIBA, dengan catatan perbedaan NBA.',
  modules: [
    {
      code: '1.1',
      id: 'm-1-1',
      title: 'Mengenal Basket',
      keyVisual:
        'Animasi siklus possession: inbound → bawa bola → serang → tembak → rebound → transisi',
      requires: [],
      lessons: [
        {
          id: 'l-1-1-1',
          title: 'Tujuan permainan dan 5 lawan 5',
          blurb: 'Dua tim lima pemain, satu ring, dan satu tujuan: memasukkan bola lebih banyak.',
          minutes: 4,
          status: 'ready',
        },
        {
          id: 'l-1-1-2',
          title: 'Poin 1, 2, dan 3',
          blurb: 'Nilai tembakan ditentukan oleh posisi kaki saat melepas bola, bukan tempat bola masuk.',
          minutes: 4,
          status: 'ready',
        },
        {
          id: 'l-1-1-3',
          title: 'Durasi pertandingan FIBA 4 x 10 menit',
          blurb: 'Empat kuarter 10 menit (NBA 12 menit) dan perpanjangan 5 menit bila imbang.',
          minutes: 3,
          status: 'ready',
        },
        {
          id: 'l-1-1-4',
          title: 'Alur satu penguasaan bola',
          blurb: 'Satu possession dari inbound sampai rebound, langkah demi langkah.',
          minutes: 5,
          status: 'ready',
          terms: ['transisi'],
        },
      ],
    },
    {
      code: '1.2',
      id: 'm-1-2',
      title: 'Lapangan & Zona',
      keyVisual:
        'Lapangan boot-up (garis menyala satu per satu), zona menyala saat disentuh, overlay FIBA vs NBA',
      requires: ['1.1'],
      lessons: [
        {
          id: 'l-1-2-1',
          title: 'Ukuran lapangan FIBA 28 x 15 meter',
          blurb: 'Panjang, lebar, dan mengapa ukuran itu menentukan cara bermain.',
          minutes: 4,
          status: 'ready',
        },
        {
          id: 'l-1-2-2',
          title: 'Garis 3 poin: 6,75 m dan 6,60 m di sudut',
          blurb: 'Busur 6,75 m dari ring, tetapi hanya 6,60 m di sudut — tembakan 3 terdekat di lapangan.',
          minutes: 4,
          status: 'ready',
          terms: ['corner'],
        },
        {
          id: 'l-1-2-3',
          title: 'Paint: lebar 4,90 meter',
          blurb: 'Area persegi di depan ring tempat aturan 3 detik berlaku.',
          minutes: 3,
          status: 'ready',
          terms: ['paint'],
        },
        {
          id: 'l-1-2-4',
          title: 'Tinggi ring 3,05 meter',
          blurb: 'Tinggi ring sama di semua level, dari kompetisi pelajar sampai profesional.',
          minutes: 3,
          status: 'soon',
        },
        {
          id: 'l-1-2-5',
          title: 'Area tanpa charge, radius 1,25 meter',
          blurb: 'Setengah lingkaran di bawah ring tempat bek tidak bisa mengambil charge.',
          minutes: 4,
          status: 'soon',
        },
        {
          id: 'l-1-2-6',
          title: 'Perbandingan FIBA dan NBA',
          blurb: 'Overlay dua lapangan: beda garis 3 poin, panjang lapangan, dan durasi kuarter.',
          minutes: 4,
          status: 'ready',
        },
      ],
    },
    {
      code: '1.3',
      id: 'm-1-3',
      title: 'Nama Area Lapangan',
      keyVisual: 'Peta zona interaktif; label melayang mengikuti kursor',
      requires: ['1.2'],
      lessons: [
        {
          id: 'l-1-3-1',
          title: 'Peta zona lengkap',
          blurb: 'Paint, low block, mid-post, elbow, high post, top of key, slot, wing, corner, short corner.',
          minutes: 5,
          status: 'ready',
          terms: ['paint', 'low-block', 'elbow', 'high-post', 'top-of-key', 'slot', 'wing', 'corner'],
        },
        {
          id: 'l-1-3-2',
          title: 'Baseline dan sideline',
          blurb: 'Garis batas lapangan dan kenapa baseline jadi jalur cut favorit.',
          minutes: 3,
          status: 'ready',
          terms: ['baseline'],
        },
        {
          id: 'l-1-3-3',
          title: 'Strong side dan weak side',
          blurb: 'Sisi bola dan sisi bantuan — dasar semua prinsip bertahan.',
          minutes: 4,
          status: 'ready',
          terms: ['strong-side', 'help-side'],
        },
        {
          id: 'l-1-3-4',
          title: 'Kuis zona: tunjuk area yang disebut',
          blurb: 'Latihan cepat menunjuk zona yang benar di lapangan.',
          minutes: 3,
          status: 'soon',
        },
      ],
    },
    {
      code: '1.4',
      id: 'm-1-4',
      title: 'Aturan Waktu',
      keyVisual: 'Cincin hitung mundur holografis di atas pemain',
      requires: ['1.2'],
      lessons: [
        {
          id: 'l-1-4-1',
          title: 'Shot clock 24 detik',
          blurb: 'Serangan harus melepas tembakan dalam 24 detik sejak menguasai bola.',
          minutes: 4,
          status: 'ready',
        },
        {
          id: 'l-1-4-2',
          title: 'Reset 14 detik',
          blurb: 'Setelah rebound menyerang atau foul tertentu, shot clock hanya direset ke 14 detik.',
          minutes: 4,
          status: 'ready',
        },
        {
          id: 'l-1-4-3',
          title: '8 detik ke frontcourt',
          blurb: 'Bola harus melewati garis tengah dalam 8 detik.',
          minutes: 3,
          status: 'ready',
        },
        {
          id: 'l-1-4-4',
          title: '3 detik di paint',
          blurb: 'Penyerang tidak boleh berdiri lebih dari 3 detik di paint.',
          minutes: 4,
          status: 'ready',
          terms: ['paint'],
        },
        {
          id: 'l-1-4-5',
          title: '5 detik dijaga ketat dan 5 detik inbound',
          blurb: 'Dua aturan 5 detik yang sering terlupakan pemain pemula.',
          minutes: 4,
          status: 'soon',
        },
      ],
    },
    {
      code: '1.5',
      id: 'm-1-5',
      title: 'Pelanggaran (violation)',
      keyVisual: 'Replay wasit: adegan dijeda, momen pelanggaran disorot merah',
      requires: ['1.4'],
      lessons: [
        {
          id: 'l-1-5-1',
          title: 'Traveling',
          blurb: 'Batas langkah setelah berhenti dribble, beserta gather step yang legal.',
          minutes: 5,
          status: 'ready',
        },
        {
          id: 'l-1-5-2',
          title: 'Double dribble',
          blurb: 'Mendribble lagi setelah bola dipegang dua tangan.',
          minutes: 3,
          status: 'ready',
        },
        {
          id: 'l-1-5-3',
          title: 'Carrying',
          blurb: 'Tangan terlalu jauh di bawah bola saat dribble.',
          minutes: 3,
          status: 'soon',
        },
        {
          id: 'l-1-5-4',
          title: 'Backcourt violation',
          blurb: 'Bola kembali ke backcourt setelah sudah melewati garis tengah.',
          minutes: 4,
          status: 'soon',
        },
        {
          id: 'l-1-5-5',
          title: 'Keluar lapangan',
          blurb: 'Yang menentukan bukan bola, tetapi kaki pemain yang menyentuhnya.',
          minutes: 3,
          status: 'soon',
        },
        {
          id: 'l-1-5-6',
          title: 'Goaltending dan basket interference',
          blurb: 'Menyentuh bola saat sedang turun ke ring, dan menyentuh ring saat bola di atasnya.',
          minutes: 4,
          status: 'soon',
        },
        {
          id: 'l-1-5-7',
          title: 'Menendang bola',
          blurb: 'Menyentuh bola dengan kaki secara sengaja.',
          minutes: 3,
          status: 'soon',
        },
      ],
    },
    {
      code: '1.6',
      id: 'm-1-6',
      title: 'Foul',
      keyVisual: 'Slider pembanding blocking vs charging; zona kaki bek disorot',
      requires: ['1.5'],
      lessons: [
        {
          id: 'l-1-6-1',
          title: 'Blocking vs charging',
          blurb: 'Siapa yang salah ditentukan oleh posisi bertahan yang sah dan area tanpa charge.',
          minutes: 5,
          status: 'ready',
        },
        {
          id: 'l-1-6-2',
          title: 'Holding dan pushing',
          blurb: 'Kontak tangan dan badan yang membatasi gerak lawan.',
          minutes: 3,
          status: 'ready',
        },
        {
          id: 'l-1-6-3',
          title: 'Tangan ilegal',
          blurb: 'Hand-check dan memukul tangan penembak.',
          minutes: 3,
          status: 'soon',
        },
        {
          id: 'l-1-6-4',
          title: 'Shooting foul dan lemparan bebas',
          blurb: 'Berapa lemparan bebas yang didapat dan kapan.',
          minutes: 4,
          status: 'soon',
        },
        {
          id: 'l-1-6-5',
          title: 'Offensive foul',
          blurb: 'Moving screen, charge, dan mendorong bek untuk membuat ruang.',
          minutes: 4,
          status: 'ready',
          terms: ['ball-screen'],
        },
        {
          id: 'l-1-6-6',
          title: 'Technical, unsportsmanlike, dan disqualifying',
          blurb: 'Tiga tingkat foul di luar kontak permainan biasa.',
          minutes: 4,
          status: 'soon',
        },
        {
          id: 'l-1-6-7',
          title: 'Penalti foul tim dan batas 5 foul',
          blurb: 'Mulai foul tim ke-5 per kuarter lawan dapat lemparan bebas; pemain keluar setelah 5 foul (NBA 6).',
          minutes: 4,
          status: 'soon',
        },
      ],
    },
    {
      code: '1.7',
      id: 'm-1-7',
      title: 'Posisi Pemain',
      keyVisual: 'Kartu posisi 3D berputar + heatmap area dominan',
      requires: ['1.3'],
      lessons: [
        {
          id: 'l-1-7-1',
          title: 'Posisi 1-5 dan peran klasiknya',
          blurb: 'PG, SG, SF, PF, C: tugas utama, skill kunci, dan area dominan masing-masing.',
          minutes: 5,
          status: 'ready',
        },
        {
          id: 'l-1-7-2',
          title: 'Point Guard: pengatur serangan',
          blurb: 'Memulai set, membaca pertahanan, dan menjaga tempo.',
          minutes: 4,
          status: 'ready',
        },
        {
          id: 'l-1-7-3',
          title: 'Shooting Guard dan Small Forward',
          blurb: 'Bergerak tanpa bola, keluar dari screen, dan menyerang closeout.',
          minutes: 4,
          status: 'soon',
        },
        {
          id: 'l-1-7-4',
          title: 'Power Forward dan Center',
          blurb: 'Screen, roll, rebound, dan melindungi ring.',
          minutes: 4,
          status: 'soon',
        },
        {
          id: 'l-1-7-5',
          title: 'Varian modern: stretch 4, rim runner, playmaking 5',
          blurb: 'Bagaimana peran posisi berubah di basket modern.',
          minutes: 4,
          status: 'soon',
          terms: ['rim-runner'],
        },
        {
          id: 'l-1-7-6',
          title: 'Positionless: satu pemain banyak peran',
          blurb: 'Combo guard, point forward, dan wing stopper.',
          minutes: 4,
          status: 'soon',
        },
      ],
    },
    {
      code: '1.8',
      id: 'm-1-8',
      title: 'Skill Dasar',
      keyVisual: 'Gerak lambat dengan overlay kerangka tubuh dan titik kontak',
      requires: ['1.5'],
      lessons: [
        {
          id: 'l-1-8-1',
          title: 'Footwork: triple threat, jab step, pivot',
          blurb: 'Posisi siap menembak, mengumpan, atau dribble — dan cara berputar tanpa traveling.',
          minutes: 5,
          status: 'ready',
          terms: ['triple-threat'],
        },
        {
          id: 'l-1-8-2',
          title: 'Dribble: kontrol sampai spin',
          blurb: 'Crossover, between the legs, behind the back, hesitation, in-and-out, spin.',
          minutes: 5,
          status: 'soon',
        },
        {
          id: 'l-1-8-3',
          title: 'Passing: tujuh jenis umpan',
          blurb: 'Chest, bounce, overhead, baseball, skip, entry ke post, dan wrap-around.',
          minutes: 5,
          status: 'ready',
          terms: ['skip-pass', 'post-up'],
        },
        {
          id: 'l-1-8-4',
          title: 'Shooting: form BEEF',
          blurb: 'Balance, Eyes, Elbow, Follow-through — empat titik periksa tembakan.',
          minutes: 5,
          status: 'soon',
        },
        {
          id: 'l-1-8-5',
          title: 'Finishing: layup, euro step, floater',
          blurb: 'Menyelesaikan di dekat ring dari berbagai sudut.',
          minutes: 5,
          status: 'soon',
        },
        {
          id: 'l-1-8-6',
          title: 'Rebounding: box out dan membaca pantulan',
          blurb: 'Menghalangi lawan dengan badan dan memprediksi arah bola.',
          minutes: 4,
          status: 'soon',
          terms: ['box-out'],
        },
        {
          id: 'l-1-8-7',
          title: 'Bertahan individu: stance, slide, closeout',
          blurb: 'Posisi badan, geser kaki, dan menghadang tembakan tanpa foul.',
          minutes: 5,
          status: 'ready',
          terms: ['closeout'],
        },
      ],
    },
    {
      code: '1.9',
      id: 'm-1-9',
      title: 'Isyarat Wasit & Istilah',
      keyVisual: 'Ikon isyarat beranimasi; kartu glosarium dengan mini-animasi',
      requires: ['1.6'],
      lessons: [
        {
          id: 'l-1-9-1',
          title: 'Isyarat tangan wasit utama',
          blurb: 'Mengenali panggilan wasit tanpa menunggu pengumuman.',
          minutes: 5,
          status: 'soon',
        },
        {
          id: 'l-1-9-2',
          title: '40 istilah dasar',
          blurb: 'Kosakata minimum untuk mengikuti pertandingan dan arahan pelatih.',
          minutes: 5,
          status: 'ready',
        },
      ],
    },
  ],
}

/* ========================================================================== */
/* LEVEL 2 — KONSEP MENENGAH (PRD §5)                                         */
/* ========================================================================== */

const LEVEL_2: LevelNode = {
  level: 2,
  title: 'Konsep Menengah',
  subtitle: '9 modul · 46 pelajaran',
  intro:
    'Jembatan dari skill individu ke taktik tim. Fokusnya bukan apa yang dilakukan, tetapi MENGAPA sebuah gerakan berhasil. Setiap konsep diajarkan dengan pola Isyarat → Respon.',
  modules: [
    {
      code: '2.1',
      id: 'm-2-1',
      title: 'Spacing & Bentuk Lantai',
      keyVisual:
        'Garis jarak antarpemain berubah merah bila terlalu dekat; area lantai terbuka diarsir bercahaya',
      requires: ['1.3'],
      lessons: [
        {
          id: 'l-2-1-1',
          title: 'Mengapa spacing menentukan segalanya',
          blurb: 'Jarak ideal 4,5-5,5 m membuat satu bek tidak bisa menjaga dua penyerang.',
          minutes: 5,
          status: 'ready',
          terms: ['spacing'],
        },
        {
          id: 'l-2-1-2',
          title: 'Bentuk lantai: 5-out, 4-out 1-in, 3-out 2-in',
          blurb: 'Tiga formasi dasar dan konsekuensinya bagi ruang drive.',
          minutes: 5,
          status: 'ready',
        },
        {
          id: 'l-2-1-3',
          title: 'Ball side dan help side',
          blurb: 'Bagaimana pertahanan membagi lapangan, dan cara serangan memanfaatkannya.',
          minutes: 4,
          status: 'ready',
          terms: ['strong-side', 'help-side'],
        },
        {
          id: 'l-2-1-4',
          title: 'Mengisi spot kosong',
          blurb: 'Setiap kali satu pemain pergi, satu pemain lain harus mengisi.',
          minutes: 4,
          status: 'soon',
        },
      ],
    },
    {
      code: '2.2',
      id: 'm-2-2',
      title: 'Gerakan Tanpa Bola & Cut',
      keyVisual: 'Jejak gerak dengan afterimage; label jenis cut muncul di jalur',
      requires: ['2.1'],
      lessons: [
        {
          id: 'l-2-2-1',
          title: 'V-cut dan L-cut',
          blurb: 'Dua cara membuka ruang untuk menerima bola di perimeter.',
          minutes: 4,
          status: 'ready',
        },
        {
          id: 'l-2-2-2',
          title: 'Backdoor cut',
          blurb: 'Menghukum bek yang terlalu menolak umpan dengan cut ke ring di belakangnya.',
          minutes: 4,
          status: 'ready',
          terms: ['backdoor-cut'],
        },
        {
          id: 'l-2-2-3',
          title: 'Basket cut dan face cut',
          blurb: 'Cut ke ring setelah mengumpan — aksi paling sederhana yang paling sering dilupakan.',
          minutes: 4,
          status: 'soon',
        },
        {
          id: 'l-2-2-4',
          title: 'Flash cut dan shallow cut',
          blurb: 'Mengisi celah dan menukar posisi tanpa merusak spacing.',
          minutes: 4,
          status: 'soon',
        },
        {
          id: 'l-2-2-5',
          title: 'Membaca screen: curl, fade, flare',
          blurb: 'Tiga jalur keluar dari screen, dipilih berdasarkan posisi bek.',
          minutes: 5,
          status: 'soon',
          terms: ['flare-screen'],
        },
      ],
    },
    {
      code: '2.3',
      id: 'm-2-3',
      title: 'Screen',
      keyVisual: 'Notasi T-bar menyala, riak benturan saat kontak screen',
      requires: ['2.2'],
      lessons: [
        {
          id: 'l-2-3-1',
          title: 'Syarat screen legal',
          blurb: 'Berdiri diam, kaki selebar bahu, dan beri ruang satu langkah normal.',
          minutes: 4,
          status: 'ready',
          terms: ['ball-screen'],
        },
        {
          id: 'l-2-3-2',
          title: 'On-ball screen',
          blurb: 'Screen untuk pembawa bola: sudut, timing, dan arah.',
          minutes: 5,
          status: 'ready',
          terms: ['ball-screen'],
        },
        {
          id: 'l-2-3-3',
          title: 'Off-ball: down, back, flare, cross',
          blurb: 'Empat screen tanpa bola yang membebaskan penembak.',
          minutes: 5,
          status: 'ready',
          terms: ['flare-screen', 'pin-down'],
        },
        {
          id: 'l-2-3-4',
          title: 'UCLA, pin-down, staggered, elevator',
          blurb: 'Screen bernama yang muncul berulang di set play profesional.',
          minutes: 5,
          status: 'soon',
          terms: ['pin-down', 'stagger'],
        },
        {
          id: 'l-2-3-5',
          title: 'Slip dan ghost screen',
          blurb: 'Tidak memasang screen sama sekali — dan justru itu yang membuatnya berhasil.',
          minutes: 4,
          status: 'ready',
          terms: ['slip'],
        },
        {
          id: 'l-2-3-6',
          title: 'Membaca screen: curl, fade, straight, reject',
          blurb: 'Empat keputusan pembawa bola dan penembak setelah screen terpasang.',
          minutes: 5,
          status: 'soon',
        },
      ],
    },
    {
      code: '2.4',
      id: 'm-2-4',
      title: 'Aksi Dua Pemain',
      keyVisual: 'Dua pemain aktif menyala, tiga lainnya diredupkan',
      requires: ['2.3'],
      lessons: [
        {
          id: 'l-2-4-1',
          title: 'Pick-and-roll',
          blurb: 'Aksi dua pemain paling penting di basket modern, langkah demi langkah.',
          minutes: 5,
          status: 'ready',
          terms: ['pick-and-roll', 'ball-screen'],
        },
        {
          id: 'l-2-4-2',
          title: 'Pick-and-pop',
          blurb: 'Screener keluar ke perimeter, bukan ke ring — menghukum coverage drop.',
          minutes: 4,
          status: 'ready',
          terms: ['pick-and-pop'],
        },
        {
          id: 'l-2-4-3',
          title: 'Give-and-go',
          blurb: 'Umpan lalu cut: aksi paling tua dan masih paling sulit dijaga.',
          minutes: 4,
          status: 'ready',
        },
        {
          id: 'l-2-4-4',
          title: 'Dribble handoff (DHO)',
          blurb: 'Menyerahkan bola sambil berpapasan — screen dan umpan sekaligus.',
          minutes: 4,
          status: 'soon',
          terms: ['dribble-handoff'],
        },
        {
          id: 'l-2-4-5',
          title: 'Short roll, slip, re-screen, snake dribble',
          blurb: 'Empat counter saat coverage lawan menutup opsi utama.',
          minutes: 5,
          status: 'soon',
          terms: ['short-roll', 'slip'],
        },
      ],
    },
    {
      code: '2.5',
      id: 'm-2-5',
      title: 'Aksi Tiga Pemain',
      keyVisual: 'Lapisan perhatian bek: garis pandang bek terlihat',
      requires: ['2.4'],
      lessons: [
        {
          id: 'l-2-5-1',
          title: 'Screen the screener',
          blurb: 'Memasang screen untuk pemain yang baru memasang screen.',
          minutes: 5,
          status: 'ready',
        },
        {
          id: 'l-2-5-2',
          title: 'Pass and screen away',
          blurb: 'Mengumpan ke satu sisi lalu memasang screen di sisi lain.',
          minutes: 4,
          status: 'soon',
        },
        {
          id: 'l-2-5-3',
          title: 'Iverson cut',
          blurb: 'Guard memotong horizontal melewati dua screen di high post.',
          minutes: 4,
          status: 'soon',
        },
        {
          id: 'l-2-5-4',
          title: 'Aksi sisi lemah untuk mengalihkan help',
          blurb: 'Memaksa bek help memilih antara dua ancaman sekaligus.',
          minutes: 5,
          status: 'soon',
          terms: ['help-side'],
        },
      ],
    },
    {
      code: '2.6',
      id: 'm-2-6',
      title: 'Prinsip Bertahan Man-to-Man',
      keyVisual: 'Kerucut pandang bek dan segitiga ball-you-man bergerak mengikuti bola',
      requires: ['1.8'],
      lessons: [
        {
          id: 'l-2-6-1',
          title: 'Tekanan pada bola',
          blurb: 'Jarak, tangan aktif, dan arah yang ingin dipaksakan.',
          minutes: 4,
          status: 'ready',
        },
        {
          id: 'l-2-6-2',
          title: 'Deny satu umpan, help dua umpan',
          blurb: 'Seberapa jauh bek boleh meninggalkan lawannya, dihitung dari jarak umpan.',
          minutes: 5,
          status: 'ready',
        },
        {
          id: 'l-2-6-3',
          title: 'Segitiga ball-you-man',
          blurb: 'Posisi yang membuat bek bisa melihat bola dan lawannya sekaligus.',
          minutes: 5,
          status: 'ready',
        },
        {
          id: 'l-2-6-4',
          title: 'Help and recover',
          blurb: 'Membantu sesaat lalu kembali ke lawan sendiri sebelum umpan datang.',
          minutes: 4,
          status: 'soon',
        },
        {
          id: 'l-2-6-5',
          title: 'Rotasi tag dan X-out',
          blurb: 'Siapa menutup siapa saat satu bek sudah pergi membantu.',
          minutes: 5,
          status: 'soon',
          terms: ['tag', 'x-out'],
        },
        {
          id: 'l-2-6-6',
          title: 'Closeout, box out, dan komunikasi',
          blurb: 'Tiga hal terakhir yang menutup satu possession bertahan.',
          minutes: 5,
          status: 'soon',
          terms: ['closeout', 'box-out'],
        },
      ],
    },
    {
      code: '2.7',
      id: 'm-2-7',
      title: 'Coverage Pick-and-Roll',
      keyVisual: 'PnR yang sama diputar ulang dengan pemilih coverage',
      requires: ['2.4', '2.6'],
      lessons: [
        {
          id: 'l-2-7-1',
          title: 'Enam coverage dalam satu layar',
          blurb: 'Drop, hedge, blitz, switch, ice, at-level — ganti coverage dan lihat animasi berubah.',
          minutes: 5,
          status: 'ready',
          terms: ['drop', 'hedge', 'blitz', 'switch', 'ice'],
        },
        {
          id: 'l-2-7-2',
          title: 'Drop: melindungi ring',
          blurb: 'Bek big mundur ke paint; bayarannya adalah tembakan pull-up.',
          minutes: 4,
          status: 'ready',
          terms: ['drop'],
        },
        {
          id: 'l-2-7-3',
          title: 'Hedge / show',
          blurb: 'Keluar sesaat menghadang handler, lalu kembali ke roller.',
          minutes: 4,
          status: 'ready',
          terms: ['hedge'],
        },
        {
          id: 'l-2-7-4',
          title: 'Blitz / trap',
          blurb: 'Memaksa bola lepas, dengan risiko 4 lawan 3 di belakang.',
          minutes: 4,
          status: 'ready',
          terms: ['blitz', 'short-roll'],
        },
        {
          id: 'l-2-7-5',
          title: 'Switch dan mismatch',
          blurb: 'Tidak memberi celah, tetapi menciptakan pasangan jaga yang timpang.',
          minutes: 4,
          status: 'ready',
          terms: ['switch', 'mismatch'],
        },
        {
          id: 'l-2-7-6',
          title: 'Ice / blue di sisi lapangan',
          blurb: 'Menjauhkan bola dari tengah dengan memaksanya ke baseline.',
          minutes: 4,
          status: 'soon',
          terms: ['ice'],
        },
        {
          id: 'l-2-7-7',
          title: 'Go over vs go under',
          blurb: 'Keputusan bek handler yang menentukan apakah penembak dapat ruang.',
          minutes: 4,
          status: 'soon',
        },
      ],
    },
    {
      code: '2.8',
      id: 'm-2-8',
      title: 'Transisi',
      keyVisual: 'Kamera bergerak sepanjang lapangan penuh; jalur lari bercahaya',
      requires: ['2.1'],
      lessons: [
        {
          id: 'l-2-8-1',
          title: 'Tiga jalur fast break',
          blurb: 'Dua sayap lebar, satu pembawa bola di tengah.',
          minutes: 4,
          status: 'ready',
          terms: ['transisi'],
        },
        {
          id: 'l-2-8-2',
          title: 'Rim runner dan trailer',
          blurb: 'Dua peran big saat transisi: satu lari ke ring, satu mengisi di belakang.',
          minutes: 4,
          status: 'soon',
          terms: ['rim-runner'],
        },
        {
          id: 'l-2-8-3',
          title: 'Early offense dan drag screen',
          blurb: 'Menyerang sebelum pertahanan selesai menyusun diri.',
          minutes: 4,
          status: 'soon',
        },
        {
          id: 'l-2-8-4',
          title: 'Transisi bertahan',
          blurb: 'Lari balik, lindungi ring, hentikan bola, cari lawan — dalam urutan itu.',
          minutes: 5,
          status: 'ready',
        },
      ],
    },
    {
      code: '2.9',
      id: 'm-2-9',
      title: 'Membaca Pertahanan',
      keyVisual: 'Bullet time: waktu melambat, 2-3 opsi umpan muncul sebagai berkas cahaya',
      requires: ['2.7'],
      lessons: [
        {
          id: 'l-2-9-1',
          title: 'Membaca help',
          blurb: 'Bek mana yang bergerak, dan penembak mana yang ditinggalkannya.',
          minutes: 5,
          status: 'ready',
          terms: ['help-side'],
        },
        {
          id: 'l-2-9-2',
          title: 'Drive and kick',
          blurb: 'Menyerang ring untuk menarik help, lalu mengumpan keluar.',
          minutes: 4,
          status: 'ready',
          terms: ['kick-out'],
        },
        {
          id: 'l-2-9-3',
          title: 'Extra pass',
          blurb: 'Satu umpan tambahan yang mengubah tembakan bagus menjadi tembakan terbuka.',
          minutes: 4,
          status: 'soon',
        },
        {
          id: 'l-2-9-4',
          title: 'Menyerang closeout',
          blurb: 'Tembak, drive, atau umpan — dipilih dari kecepatan dan sudut closeout bek.',
          minutes: 4,
          status: 'soon',
          terms: ['closeout'],
        },
        {
          id: 'l-2-9-5',
          title: 'Aturan keputusan 0,5 detik',
          blurb: 'Memegang bola lebih dari setengah detik memberi pertahanan waktu untuk pulih.',
          minutes: 4,
          status: 'ready',
        },
      ],
    },
  ],
}

/* ========================================================================== */
/* LEVEL 3 — TAKTIK LANJUTAN & PLAYBOOK (PRD §6)                              */
/* ========================================================================== */

/**
 * Level 3 bukan daftar pelajaran, tetapi Perpustakaan Taktik. Enam simpulnya
 * sejalan dengan enam kategori PRD §6; masing-masing membuka filter kategori
 * di Perpustakaan Taktik.
 */
export interface TacticCategoryNode {
  code: string
  id: string
  /** Sesuai TacticCategory di skema engine */
  category: 'offense' | 'set-play' | 'vs-zone' | 'defense' | 'press' | 'special'
  title: string
  blurb: string
  requires: string[]
}

export const LEVEL_3_CATEGORIES: TacticCategoryNode[] = [
  {
    code: '3.A',
    id: 'm-3-a',
    category: 'offense',
    title: 'Sistem menyerang',
    blurb: 'Motion offense yang berjalan terus: 5-out, 4-out 1-in, spread pick-and-roll, flex.',
    requires: ['2.4'],
  },
  {
    code: '3.B',
    id: 'm-3-b',
    category: 'set-play',
    title: 'Set play setengah lapangan',
    blurb: 'Rangkaian aksi terencana: Horns, Pistol, Zipper, Chicago, Spain pick-and-roll.',
    requires: ['2.4', '2.5'],
  },
  {
    code: '3.C',
    id: 'm-3-c',
    category: 'vs-zone',
    title: 'Menyerang pertahanan zona',
    blurb: 'Prinsip celah, overload, dan cara membongkar zona 2-3, 3-2, dan 1-3-1.',
    requires: ['2.1'],
  },
  {
    code: '3.D',
    id: 'm-3-d',
    category: 'defense',
    title: 'Sistem bertahan',
    blurb: 'Pack line, zona 2-3, no-middle, matchup zone — lengkap dengan lensa POV X1-X5.',
    requires: ['2.6'],
  },
  {
    code: '3.E',
    id: 'm-3-e',
    category: 'press',
    title: 'Press dan melawan press',
    blurb: 'Press 2-2-1, diamond 1-2-1-1, dan pola press break yang menghukum jebakan.',
    requires: ['2.8'],
  },
  {
    code: '3.F',
    id: 'm-3-f',
    category: 'special',
    title: 'Situasi khusus',
    blurb: 'BLOB, SLOB, 2-for-1, ATO, dan pilihan di detik terakhir.',
    requires: ['2.9'],
  },
]

const LEVEL_3: LevelNode = {
  level: 3,
  title: 'Taktik Lanjutan',
  subtitle: '6 kategori · Perpustakaan Taktik',
  intro:
    'Perpustakaan Taktik: setiap taktik punya formasi awal, fase, pohon cabang, counter bertahan, kesalahan umum, lima lensa POV, dan kuis Baca & Bereaksi.',
  modules: LEVEL_3_CATEGORIES.map((c) => ({
    code: c.code,
    id: c.id,
    title: c.title,
    keyVisual: c.blurb,
    requires: c.requires,
    lessons: [],
  })),
}

/* ========================================================================== */
/* Ekspor & pembantu                                                          */
/* ========================================================================== */

export const CURRICULUM: LevelNode[] = [LEVEL_1, LEVEL_2, LEVEL_3]

export const ALL_MODULES: ModuleNode[] = CURRICULUM.flatMap((l) => l.modules)

export const ALL_LESSONS: (LessonNode & { moduleCode: string; level: 1 | 2 | 3 })[] =
  CURRICULUM.flatMap((level) =>
    level.modules.flatMap((m) =>
      m.lessons.map((l) => ({ ...l, moduleCode: m.code, level: level.level })),
    ),
  )

export function findModule(code: string): ModuleNode | undefined {
  return ALL_MODULES.find((m) => m.code === code)
}

export function findLesson(
  id: string,
): (LessonNode & { moduleCode: string; level: 1 | 2 | 3 }) | undefined {
  return ALL_LESSONS.find((l) => l.id === id)
}

export function moduleOfLesson(lessonId: string): ModuleNode | undefined {
  return ALL_MODULES.find((m) => m.lessons.some((l) => l.id === lessonId))
}

/** Pelajaran berikutnya di dalam satu modul, lalu lanjut ke modul berikutnya. */
export function nextLesson(lessonId: string): { lessonId: string; moduleCode: string } | null {
  const flat = ALL_LESSONS
  const i = flat.findIndex((l) => l.id === lessonId)
  if (i < 0 || i >= flat.length - 1) return null
  const next = flat[i + 1]!
  return { lessonId: next.id, moduleCode: next.moduleCode }
}

/** Jumlah pelajaran per level — dipakai Peta Jalur Belajar & dashboard. */
export function levelLessonCount(level: 1 | 2 | 3): number {
  return ALL_LESSONS.filter((l) => l.level === level).length
}

/** Jumlah pelajaran yang isinya sudah siap (bukan "segera"). */
export function readyLessonCount(level?: 1 | 2 | 3): number {
  return ALL_LESSONS.filter((l) => l.status === 'ready' && (!level || l.level === level)).length
}
