/**
 * Kunci jawaban kuis Baca & Bereaksi — F-18.
 *
 * PRD §13 entitas Quiz / Scenario: "id, taktik, titik jeda, jenis jawaban,
 * KUNCI, PENJELASAN". Titik jeda dan jenis jawaban ada di JSON taktik
 * (`scenarios`); kunci dan penjelasan per skenario ada di sini.
 *
 * Mengapa terpisah: opsi `correct` pada Decision di JSON taktik berarti "benar
 * dalam kondisi DEFAULT". Skenario yang memasang cabang lain lebih dulu
 * (`setupBranches`, mis. coverage switch) mengubah situasi, sehingga jawaban
 * benarnya bisa berbeda. Kunci per skenario membuat itu eksplisit.
 *
 * Skenario yang tidak tercantum memakai opsi `correct: true` milik keputusannya.
 * `prompt` di sini menimpa prompt di JSON bila pertanyaan aslinya menanyakan
 * akibat ("apa yang terjadi?") padahal pilihan jawabannya adalah aksi.
 *
 * Kunci ini perlu ditinjau pelatih bersertifikat sebelum terbit (PRD §18 R3).
 */

export interface ScenarioKey {
  /** id opsi pada Decision yang benar untuk skenario ini */
  answer: string
  /** Penjelasan isyarat yang terlewat; menimpa `explain` opsi */
  explain?: string
  /** Pertanyaan pengganti */
  prompt?: string
}

/** tacticId -> scenarioId -> kunci */
export const SCENARIO_KEYS: Record<string, Record<string, ScenarioKey>> = {
  'def-zone-2-3': {
    s2: {
      answer: 'o-up-and-behind',
      prompt: 'X5 tergoda tetap di low post saat bola masuk ke high post. Pergeseran mana yang seharusnya terjadi?',
      explain:
        'Bila X5 tetap di low post, penyerang di high post bebas menembak dari jarak menengah atau mengumpan ke baseline. X5 harus naik menekan, dan X1 turun menutup ring di belakangnya.',
    },
    s3: {
      answer: 'o-up-and-behind',
      prompt: 'X5 dan X1 sama-sama naik ke bola. Pergeseran mana yang seharusnya terjadi?',
      explain:
        'Dua bek yang naik bersamaan meninggalkan ring kosong untuk cut baseline. Hanya X5 yang naik menekan; X1 menutup belakang.',
    },
  },

  'off-5-out-motion': {
    s2: {
      answer: 'o-wing',
      explain:
        'Dengan spot top kosong, X5 bebas turun membantu di jalur backdoor sehingga bounce pass ke 1 mudah dipotong. Umpan aman ke wing, lalu isi ulang spot yang kosong.',
    },
    s3: {
      answer: 'o-wing',
      explain:
        'Tanpa keunggulan dan dengan shot clock yang masih panjang, umpan aman ke wing menjaga possession dan memulai aksi berikutnya. Memaksakan umpan ke jalur tertutup hanya memberi bola ke lawan.',
    },
  },

  'off-spread-pnr': {
    s2: {
      answer: 'o-lob',
      explain:
        'At-level menekan tembakan luar, tetapi membuka jalur roll ke ring. Roll keras dan umpan lob ke 5 adalah hukumannya.',
    },
    s3: {
      answer: 'o-lob',
      prompt: 'Dua bek mengepung kamu setelah screen. Ke mana bola harus pergi lebih dulu?',
      explain:
        'Blitz meninggalkan 4 lawan 3 di belakang. Lepaskan bola ke 5 di short roll sebelum jebakan menutup; 5 lalu mengumpan ke penembak yang paling jauh dari rotasi.',
    },
    s4: {
      answer: 'o-lob',
      explain:
        'Switch tidak memberi celah, tetapi menciptakan mismatch: bek kecil sekarang menjaga 5. Umpan ke 5 yang seal bek kecil di paint.',
    },
  },

  'press-break': {
    s2: {
      answer: 'o-right',
      prompt: 'Bek terakhir sudah bergerak ke jalur kiri. Ke mana bola seharusnya pergi?',
      explain:
        'Umpan ke jalur yang sedang dituju bek terakhir akan di-contest atau dicuri. Bola harus pergi ke jalur yang ia tinggalkan: 4 di kanan.',
    },
    s3: {
      answer: 'o-dribble',
      prompt: 'Pemain tengah menjauh dan tidak tersedia. Apa pilihan pembawa bola?',
      explain:
        'Tanpa pemain tengah, pembawa bola tidak punya umpan pengaman dan mudah terjebak di sideline. Satu-satunya jalan keluar adalah dribble menjauhi jebakan — pelajarannya: pemain tengah wajib selalu tersedia.',
    },
  },

  'set-horns': {
    s2: {
      answer: 'o-lob',
      explain:
        'Switch di Horns langsung menciptakan mismatch ukuran: bek kecil menjaga 5 di paint yang kosong. Umpan ke 5.',
    },
    s3: {
      answer: 'o-corner',
      prompt: 'Kedua big masuk paint bersamaan sehingga paint sesak. Ke mana bola sebaiknya pergi?',
      explain:
        'Saat kedua big masuk paint, tidak ada yang pop ke top dan bek tidak perlu memilih. Opsi yang tersisa adalah kick ke penembak di sudut. Aturan Horns: satu big roll, satu pop.',
    },
  },

  'set-spain-pnr': {
    s2: {
      answer: 'o-corner',
      explain:
        'Bila X4 meninggalkan sudut untuk tag roller, sudut sisi lemah menjadi tembakan 3 poin terdekat (6,60 m) di seluruh lapangan. Kick ke 4.',
    },
    s3: {
      answer: 'o-pop',
      prompt: 'X5 dan X2 memanggil switch lebih awal, jadi 2 tidak perlu memasang screen. Ke mana bola harus pergi?',
      explain:
        'Bila X2 dan X5 switch lebih awal, 2 slip langsung ke ring sebelum pertukaran selesai. Umpan ke 2.',
    },
  },

  'special-blob-box': {
    s2: {
      answer: 'o-top',
      prompt: 'Screen 4 tidak menyentuh bek, jadi bek tetap menempel 3. Pilihan terbaik?',
      explain:
        'Tanpa kontak screen, bek tidak tertinggal satu langkah pun dan tembakan akan di-contest. Kembalikan bola ke 2 di top dan atur ulang.',
    },
    s3: {
      answer: 'o-top',
      prompt: 'Pengumpan menunggu terlalu lama dan hitungan 5 detik hampir habis. Pilihan teraman?',
      explain:
        'Inbound wajib lepas dalam 5 detik. Saat waktu hampir habis, umpan ke pemain aman di top lebih baik daripada kehilangan bola karena pelanggaran 5 detik.',
    },
  },

  'zone-vs-2-3': {
    s2: {
      answer: 'o-drive',
      explain:
        'Closeout yang tiba dengan badan tinggi tidak bisa bergerak ke samping. Pump fake, lalu drive baseline melewatinya.',
    },
    s3: {
      answer: 'o-swing',
      prompt: '4 berdiri di depan center zona, bukan di celah, jadi zona tidak runtuh. Pilihan terbaik?',
      explain:
        'Tanpa pemain di celah, tidak ada dua bek yang tertarik ke satu penyerang. Gerakkan bola ke sisi lain (swing) untuk memaksa zona bergeser.',
    },
  },
}
