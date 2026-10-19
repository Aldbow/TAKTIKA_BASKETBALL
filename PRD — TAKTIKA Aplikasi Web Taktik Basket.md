# PRD — TAKTIKA: Aplikasi Web Taktik Basket

Oct 19, 2026 · @Aldiva Wibowo

## 1. Ringkasan & Visi Produk

TAKTIKA adalah aplikasi web yang mengajarkan basket dari aturan paling dasar hingga taktik level profesional. Semua materi divisualkan di lapangan holografis interaktif, dan setiap taktik bisa dilihat dari sudut pandang (POV) masing-masing posisi.

| Item | Keterangan |
| --- | --- |
| Nama kerja | TAKTIKA (dapat diganti saat branding) |
| Jenis produk | Aplikasi web responsif + PWA (desktop, tablet, mobile) |
| Versi dokumen | 1.0 — draf awal untuk review |
| Bahasa konten | Bahasa Indonesia (utama); Inggris di fase 2 |
| Acuan aturan | FIBA (utama), dengan catatan perbedaan NBA |
| Inti pengalaman | Lapangan taktik animasi 2D/3D + mode POV per posisi |

### Pernyataan visi

Membuat siapa pun bisa *melihat* basket seperti pelatih melihatnya, lalu *merasakan* taktik dari mata setiap pemain di lapangan.

### Elevator pitch

Untuk pemain, pelatih, dan penggemar yang ingin memahami basket lebih dalam, TAKTIKA adalah laboratorium taktik interaktif. Berbeda dari video atau papan taktik statis, setiap taktik bisa diputar, diperlambat, dijeda di momen keputusan, dan dilihat dari POV 5 posisi menyerang maupun 5 posisi bertahan.

### Empat pilar produk

1. **Belajar bertahap** — tiga level kurikulum: Fondasi, Konsep, dan Taktik, masing-masing terkunci progresif tapi bisa dilompati lewat tes penempatan.
2. **Visual yang menjelaskan** — setiap animasi punya tujuan mengajar; tidak ada efek yang hanya hiasan.
3. **POV setiap posisi** — setiap taktik punya lensa per posisi: jalur gerak, tugas, isyarat yang dibaca, dan pilihan keputusan.
4. **Belajar lewat aksi** — kuis "Baca & Bereaksi" menjeda permainan dan meminta pengguna memilih umpan atau gerakan yang benar.

### Prinsip pengalaman

- **Satu layar, satu ide** — setiap fase taktik hanya menonjolkan satu konsep utama.
- **Tidak ada teleportasi** — semua perpindahan pemain dan bola bergerak kontinu, sehingga pengguna selalu tahu dari mana dan ke mana.
- **Jeda di momen keputusan** — waktu melambat otomatis saat ada "read" penting.
- **Istilah asli, penjelasan lokal** — istilah seperti *pick and roll* tetap dipakai, dengan penjelasan Bahasa Indonesia yang ringkas.
- **Futuristik tapi terbaca** — estetika neon dan holografis tidak boleh mengalahkan kejelasan posisi, arah, dan urutan.

## 2. Latar Belakang, Masalah & Tujuan

Masalah utamanya: taktik basket diajarkan lewat diagram statis atau video, padahal yang perlu dipahami adalah *urutan, waktu, dan alasan* setiap gerakan. TAKTIKA menjawabnya dengan animasi yang bisa dikendalikan dan dilihat dari sisi setiap pemain.

### Masalah yang diselesaikan

| # | Masalah | Dampak bagi pengguna | Jawaban TAKTIKA |
| --- | --- | --- | --- |
| M1 | Materi taktik berbahasa Indonesia minim dan tersebar | Pemula bingung harus mulai dari mana | Kurikulum terstruktur 3 level dalam satu aplikasi |
| M2 | Diagram taktik statis penuh panah bertumpuk | Urutan dan timing gerakan tidak terlihat | Animasi per fase dengan timeline yang bisa digeser |
| M3 | Video pertandingan selalu mengikuti bola | Peran pemain tanpa bola tidak terlihat | Mode fokus dan POV per posisi |
| M4 | Pemain hafal set, tapi tidak tahu apa yang harus dibaca | Eksekusi kaku, mudah dibaca lawan | Kartu isyarat dan pohon keputusan di momen "read" |
| M5 | Pelatih sekolah dan klub sulit menjelaskan taktik secara visual | Waktu latihan habis untuk menjelaskan di papan | Mode Presentasi Pelatih dan Playbook Builder |

### Konteks peluang

Basket punya basis kuat di Indonesia lewat kompetisi pelajar seperti DBL dan liga profesional IBL. Indonesia juga menjadi salah satu tuan rumah FIBA World Cup 2023, yang menaikkan minat pada basket. Belum ada produk berbahasa Indonesia yang menggabungkan kurikulum lengkap dengan visualisasi taktik interaktif.

### Tujuan produk (target awal yang diusulkan)

| ID | Tujuan | Indikator | Target awal |
| --- | --- | --- | --- |
| G1 | Pengguna baru langsung merasakan nilai | Menyelesaikan 1 pelajaran di sesi pertama | ≥ 60% pengguna baru |
| G2 | Pemahaman taktik benar-benar meningkat | Kenaikan skor kuis Baca & Bereaksi dari percobaan 1 ke 3 | ≥ 25 poin persentase |
| G3 | POV menjadi fitur pembeda | Sesi taktik yang membuka mode POV | ≥ 40% sesi |
| G4 | Animasi terasa mulus | Frame rate di perangkat menengah | Stabil 60 fps (minimum 45 fps) |
| G5 | Pengguna kembali belajar | Retensi hari ke-7 | ≥ 25% |

### Non-tujuan (versi 1)

- Bukan aplikasi skor langsung, statistik pertandingan, atau berita basket.
- Bukan platform analisis video; unggah video pertandingan tidak ada di v1.
- Bukan program latihan fisik atau kebugaran.
- Tidak memakai nama, logo, atau rekaman tim dan pemain nyata; tokoh sejarah hanya disebut sebagai asal-usul taktik.
- Tidak ada fitur sosial atau komunitas di v1 (masuk fase 3).
- Tidak menggantikan pelatih, tetapi menjadi alat bantu belajar dan mengajar.

## 3. Target Pengguna & Persona

Pengguna utama adalah pemain pelajar dan pelatih tingkat sekolah atau klub; penggemar baru dan pemain rekreasi adalah segmen sekunder. Onboarding menanyakan peran pengguna agar jalur belajar dan tampilan awal menyesuaikan.

| Persona | Profil | Tujuan | Frustrasi saat ini | Fitur terpenting | Titik mulai |
| --- | --- | --- | --- | --- | --- |
| **P1 — Raka, pemain sekolah** | 16 tahun, guard tim sekolah, ikut kompetisi pelajar; HP Android kelas menengah | Paham set yang diajarkan pelatih dan tugas posisinya | Hafal gerakan tapi bingung saat bek lawan berganti cara bertahan | Mode POV, kuis Baca & Bereaksi, cabang "bagaimana jika" | Level 2 (via tes penempatan) |
| **P2 — Coach Dimas, pelatih klub** | 32 tahun, melatih ekskul SMA dan klub U-16; laptop dan tablet | Menjelaskan taktik lebih cepat dan membuat playbook tim | Menggambar ulang di papan tulis, pemain tetap tidak paham timing | Mode Presentasi, Playbook Builder, tautan bagikan | Perpustakaan Taktik |
| **P3 — Sinta, penggemar baru** | 24 tahun, mulai menonton liga lokal dan NBA; HP | Mengerti aturan dan alasan peluit wasit | Istilah asing, aturan terasa acak | Level 1, glosarium animasi, kartu aturan singkat | Level 1 dari awal |
| **P4 — Bayu, pemain rekreasi** | 29 tahun, main 5v5 dan 3x3 tiap akhir pekan | Meningkatkan IQ basket dan main lebih efektif dengan tim acak | Tim selalu "main sendiri-sendiri" tanpa struktur | Aksi dua pemain (PnR, give-and-go), motion offense sederhana | Level 2 |

### Kebutuhan inti (jobs to be done)

- "Saat pelatih memberi set baru, saya ingin melihat tugas posisi saya langkah demi langkah, agar saya tidak salah posisi di latihan."
- "Saat menjelaskan taktik, saya ingin animasi yang bisa saya jeda dan putar ulang, agar pemain paham timing tanpa saya menggambar berulang kali."
- "Saat menonton pertandingan, saya ingin tahu arti istilah dan aturan, agar saya bisa mengikuti jalannya permainan."
- "Saat lawan mengganti cara bertahan, saya ingin tahu pilihan saya, agar saya tidak panik dan membuang bola."

### Asumsi perangkat

- Mayoritas pengguna P1, P3, P4 memakai HP Android kelas menengah, sehingga mode 2D harus menjadi pengalaman utama yang sempurna.
- Mode 3D adalah peningkatan untuk perangkat yang mampu, dengan degradasi otomatis.
- P2 sering memakai laptop yang tersambung ke proyektor atau TV, sehingga mode layar penuh dan kontras tinggi wajib.

## 4. Kurikulum Level 1 — Fondasi Dasar

Level 1 memuat semua pengetahuan dasar basket dalam 9 modul dan sekitar 48 pelajaran pendek (3–5 menit). Setiap pelajaran = animasi utama + teks ringkas + 1–3 soal cek pemahaman, dan setiap modul ditutup kuis 5 soal.

### Daftar modul Level 1

| Modul | Isi pelajaran | Visualisasi kunci | Jml pelajaran |
| --- | --- | --- | --- |
| 1.1 Mengenal Basket | Tujuan permainan, 5 lawan 5, poin 1/2/3, durasi FIBA 4×10 menit (NBA 4×12), perpanjangan 5 menit, alur satu penguasaan bola | Animasi "siklus possession": inbound → bawa bola → serang → tembak → rebound → transisi | 4 |
| 1.2 Lapangan & Zona | Ukuran FIBA 28 × 15 m, garis 3 poin 6,75 m (sudut 6,60 m), lebar paint 4,90 m, tinggi ring 3,05 m, area tanpa charge radius 1,25 m | Lapangan "boot-up" (garis menyala satu per satu), zona menyala saat disentuh, overlay FIBA vs NBA | 6 |
| 1.3 Nama Area Lapangan | Paint, low block, mid-post, elbow, high post, top of key, slot, wing, corner, short corner, baseline, strong side vs weak side | Peta zona interaktif; label melayang mengikuti kursor | 4 |
| 1.4 Aturan Waktu | Shot clock 24 detik (reset 14 detik), 8 detik ke frontcourt, 3 detik di paint, 5 detik dijaga ketat, 5 detik inbound | Cincin hitung mundur holografis di atas pemain | 5 |
| 1.5 Pelanggaran (violation) | Traveling, double dribble, carrying, backcourt, keluar lapangan, goaltending, basket interference, menendang bola | "Replay wasit": adegan dijeda, momen pelanggaran disorot merah | 7 |
| 1.6 Foul | Blocking vs charging, holding, pushing, tangan ilegal, shooting foul dan lemparan bebas, offensive foul, technical, unsportsmanlike, disqualifying; penalti foul tim mulai foul ke-5 per kuarter; pemain keluar setelah 5 foul (NBA 6) | Slider pembanding blocking vs charging; zona kaki bek disorot | 7 |
| 1.7 Posisi Pemain | Posisi 1–5, peran klasik dan modern (lihat tabel di bawah) | Kartu posisi 3D berputar + heatmap area dominan | 6 |
| 1.8 Skill Dasar | Footwork, dribble, passing, shooting, layup, rebounding, bertahan individu (rincian di bawah) | Gerak lambat dengan overlay kerangka tubuh dan titik kontak | 7 |
| 1.9 Isyarat Wasit & Istilah | Isyarat tangan wasit utama dan 40 istilah dasar | Ikon isyarat beranimasi; kartu glosarium dengan mini-animasi | 2 |

### Kartu posisi (materi modul 1.7)

| No | Posisi | Peran utama | Skill kunci | Area dominan | Varian modern |
| --- | --- | --- | --- | --- | --- |
| 1 | Point Guard (PG) | Pengatur serangan, memulai set, membaca pertahanan | Dribble, umpan, visi, komunikasi | Top of key, slot | Combo guard, scoring PG |
| 2 | Shooting Guard (SG) | Pencetak angka dari luar, bergerak tanpa bola | Catch-and-shoot, keluar dari screen, cut | Wing, corner | 3-and-D wing |
| 3 | Small Forward (SF) | Serba bisa, penghubung guard dan big | Slashing, tembakan, bertahan multi-posisi | Wing, corner, mid-post | Point forward, wing stopper |
| 4 | Power Forward (PF) | Kontak dekat ring, screen, rebound | Screen, pick-and-pop, rebound | Elbow, block, corner | Stretch 4, small-ball 4 |
| 5 | Center (C) | Pelindung ring dan pemasang screen utama | Screen, roll, blok, post play | Paint, low/high post | Rim runner, playmaking 5, stretch 5 |

### Rincian modul 1.8 Skill Dasar

- **Footwork:** triple threat, jab step, pivot depan/belakang, jump stop, stride stop.
- **Dribble:** kontrol, dribble cepat, crossover, between the legs, behind the back, hesitation, in-and-out, spin.
- **Passing:** chest pass, bounce pass, overhead, baseball pass, skip pass, entry pass ke post, wrap-around.
- **Shooting:** form BEEF (Balance, Eyes, Elbow, Follow-through), layup kanan/kiri, reverse layup, euro step, floater, pull-up, catch-and-shoot, rutinitas lemparan bebas, hook shot.
- **Rebounding:** box out, posisi rebound menyerang, membaca arah pantulan.
- **Bertahan individu:** stance, slide, closeout, contest tanpa foul, deny, posisi help.

### Aturan konten Level 1

- Semua angka aturan mengacu pada FIBA Official Basketball Rules edisi terbaru; perbedaan NBA ditampilkan sebagai catatan bertanda "NBA".
- Setiap aturan punya minimal satu animasi "benar vs salah" berdampingan.
- Istilah Inggris ditulis miring saat pertama muncul, diikuti padanan Indonesia bila ada.

## 5. Kurikulum Level 2 — Konsep Menengah

Level 2 menjembatani skill individu ke taktik tim: 9 modul, sekitar 46 pelajaran, berfokus pada *mengapa* sebuah gerakan berhasil. Setiap konsep diajarkan dengan pola **Isyarat → Respon**: apa yang dilihat pemain, lalu apa yang dilakukannya.

### Daftar modul Level 2

| Modul | Isi pelajaran | Visualisasi kunci | Jml pelajaran |
| --- | --- | --- | --- |
| 2.1 Spacing & Bentuk Lantai | 5-out, 4-out 1-in, 3-out 2-in; jarak ideal antarpemain sekitar 4,5–5,5 m; ball side vs help side; mengisi spot kosong | Garis jarak antarpemain berubah merah bila terlalu dekat; area lantai terbuka diarsir bercahaya | 4 |
| 2.2 Gerakan Tanpa Bola & Cut | V-cut, L-cut, backdoor, basket cut, face cut, flash cut, shallow cut, curl, fade, flare | Jejak gerak dengan *afterimage*; label jenis cut muncul di jalur | 5 |
| 2.3 Screen | On-ball screen; off-ball: down, back, flare, cross, UCLA, pin-down, staggered, elevator; slip dan ghost screen; syarat screen legal; membaca screen (curl, fade, straight, reject) | Notasi T-bar menyala, riak "benturan" saat kontak screen | 6 |
| 2.4 Aksi Dua Pemain | Pick-and-roll, pick-and-pop, give-and-go, dribble handoff (DHO), short roll, slip, re-screen, snake dribble | Dua pemain aktif menyala, tiga lainnya diredupkan | 5 |
| 2.5 Aksi Tiga Pemain | Screen the screener, pass and screen away, Iverson cut, aksi sisi lemah untuk mengalihkan help | Lapisan "perhatian bek": garis pandang bek terlihat | 4 |
| 2.6 Prinsip Bertahan Man-to-Man | Tekanan pada bola, deny satu umpan, help dua umpan, segitiga ball-you-man, help and recover, rotasi tag dan X-out, closeout, box out, komunikasi | Kerucut pandang bek dan segitiga ball-you-man bergerak mengikuti bola | 6 |
| 2.7 Coverage Pick-and-Roll | Drop, hedge/show, blitz/trap, switch, ice/blue, at-level, weak; go over vs go under (rincian di bawah) | PnR yang sama diputar ulang dengan pemilih coverage | 7 |
| 2.8 Transisi | Tiga jalur fast break, rim runner, trailer, early offense dan drag screen; transisi bertahan: lari balik, lindungi ring, hentikan bola, cari lawan | Kamera bergerak sepanjang lapangan penuh; jalur lari bercahaya | 4 |
| 2.9 Membaca Pertahanan | Membaca help, drive and kick, extra pass, menyerang closeout, skip pass, aturan keputusan 0,5 detik | *Bullet time*: waktu melambat, 2–3 opsi umpan muncul sebagai berkas cahaya | 5 |

### Rincian modul 2.7 — Coverage pick-and-roll

| Coverage | Yang dilakukan bek big | Yang dilakukan bek handler | Tujuan | Kelemahan | Counter serangan |
| --- | --- | --- | --- | --- | --- |
| Drop | Mundur ke paint, setinggi area lemparan bebas | Mengejar lewat atas screen | Melindungi ring | Tembakan pull-up jarak menengah | Pull-up, pick-and-pop, snake dribble |
| Hedge / Show | Keluar sesaat ke jalur handler, lalu kembali ke roller | Mengejar lewat atas | Memperlambat handler | Roller terbuka sesaat, butuh rotasi | Slip, umpan cepat ke short roll |
| Blitz / Trap | Mengepung handler bersama rekannya | Mengepung handler | Memaksa bola lepas | 4 lawan 3 di belakang | Umpan ke short roll, lalu menyerang 4v3 |
| Switch | Bertukar menjaga handler | Bertukar menjaga screener | Tidak memberi celah | Mismatch ukuran atau kecepatan | Post up mismatch, slip sebelum switch |
| Ice / Blue | Turun di sisi baseline | Melompat ke sisi atas, menutup akses ke screen | Menjauhkan bola dari tengah | Ruang di sisi baseline | Re-screen ke arah sebaliknya, pop ke elbow |
| At-level | Naik setinggi screen | Mengejar lewat atas | Menekan tembakan di luar | Roll ke ring dan lob | Roll keras, lob, umpan ke sudut |

### Standar pelajaran Level 2

- Setiap konsep punya minimal satu animasi "benar vs salah" (misalnya spacing rapat vs spacing baik).
- Setiap aksi menampilkan kartu **Isyarat → Respon** di momen jeda.
- Modul 2.7 wajib memakai pemilih coverage interaktif: pengguna mengganti coverage, animasi bertahan dan counter serangan berubah dengan transisi mulus tanpa memulai ulang.

## 6. Kurikulum Level 3 — Taktik Lanjutan & Playbook

Level 3 adalah Perpustakaan Taktik: 24 taktik di MVP, bertambah menjadi 45+ di fase 2, dibagi ke 6 kategori. Tingkat kesulitan ditulis 1 (mudah) sampai 5 (sangat kompleks).

### Anatomi halaman taktik (wajib untuk setiap taktik)

1. **Ringkasan** — satu kalimat ide inti + kapan dipakai.
2. **Formasi awal** — posisi 1–5 menyerang dan bek di lapangan.
3. **Fase** — biasanya 3–6 fase; tiap fase punya durasi, aksi, dan narasi singkat.
4. **Opsi & cabang** — pohon "jika bek melakukan X, maka Y".
5. **Counter bertahan** — cara lawan menghentikan taktik ini dan respon serangan.
6. **Kesalahan umum** — 3–5 kesalahan eksekusi, masing-masing dengan animasi salah.
7. **POV posisi** — lensa untuk setiap posisi (lihat bagian 7).
8. **Kuis Baca & Bereaksi** — minimal 3 skenario.
9. **Taktik terkait** — prasyarat dan lanjutan.
10. **Asal-usul** (opsional) — satu atau dua kalimat sejarah.

### A. Sistem menyerang

| Taktik | Ide inti | Tingkat | Rilis |
| --- | --- | --- | --- |
| 5-Out Motion | Lima pemain di luar garis 3 poin; prinsip umpan, cut, isi ulang spot | 2 | MVP |
| 4-Out 1-In Motion | Satu big di post, empat pemain luar bergerak dengan screen dan cut | 2 | MVP |
| Spread Pick-and-Roll | PnR tengah dengan tiga penembak menyebar di luar | 2 | MVP |
| Flex | Flex screen di baseline diikuti down screen, berulang terus-menerus | 3 | MVP |
| Dribble Drive Motion | Penetrasi berulang; pemain lain pindah spot sesuai arah drive (dipopulerkan Vance Walberg) | 3 | F2 |
| Shuffle | Shuffle cut dari wing lewat screen di high post, pola kontinu | 3 | F2 |
| Princeton | High post sebagai pengumpan, backdoor cut, chin series (dikenal lewat Pete Carril) | 4 | F2 |
| Triangle | Segitiga di sisi kuat, dua pemain di sisi lemah, banyak opsi baca (dikembangkan Tex Winter) | 5 | F2 |

### B. Set play setengah lapangan

| Taktik | Ide inti | Tingkat | Rilis |
| --- | --- | --- | --- |
| Horns (dasar) | Dua big di elbow, dua wing di sudut; PG memilih sisi pick-and-roll | 2 | MVP |
| Horns Flare | Umpan ke big di elbow, flare screen untuk shooter di sisi berlawanan | 3 | MVP |
| Pistol / 21 | Early offense: umpan ke wing, lalu DHO atau PnR di sisi lapangan | 2 | MVP |
| Zipper | Shooter naik dari block ke top lewat screen vertikal, lalu PnR | 2 | MVP |
| Iverson Cut | Guard memotong horizontal melewati dua screen di high post | 2 | MVP |
| Chicago | Pin-down langsung disambung dribble handoff | 3 | MVP |
| Floppy | Shooter mulai di bawah ring, keluar lewat sisi single atau double screen | 3 | MVP |
| Hammer | Drive baseline + screen sisi lemah untuk shooter di sudut | 3 | MVP |
| Spain Pick-and-Roll | PnR tengah + back screen dari pemain ketiga ke bek roller | 4 | MVP (contoh POV unggulan) |
| Elevator | Shooter lewat celah dua screener yang menutup seperti pintu lift | 3 | F2 |
| Stagger | Dua screen berurutan untuk shooter | 3 | F2 |
| Ram | Screen untuk calon screener sebelum PnR | 3 | F2 |
| Delay | Big di top sebagai pengumpan; backdoor dan DHO | 3 | F2 |
| Post Entry 4-Out | Umpan ke post, cut dan atur ulang spacing | 2 | F2 |

### C. Menyerang pertahanan zona

| Taktik | Ide inti | Tingkat | Rilis |
| --- | --- | --- | --- |
| Prinsip celah | Berdiri di celah antarbek zona untuk menarik dua bek | 2 | MVP |
| Overload | Tiga pemain di satu sisi untuk membebani zona | 2 | MVP |
| Melawan zona 2-3 | Flash ke high post, short corner, skip pass sudut ke sudut | 3 | MVP |
| Melawan zona 3-2 / 1-2-2 | Formasi satu guard di atas, serang baseline dan tengah | 3 | F2 |
| Melawan zona 1-3-1 | Gunakan sudut dan pemain lari di baseline | 4 | F2 |

### D. Sistem bertahan

| Taktik | Ide inti | Tingkat | Rilis |
| --- | --- | --- | --- |
| Man-to-Man Pack Line | Bek help tetap di dalam garis imajiner sekitar 4,9 m dari ring (dipopulerkan Dick Bennett) | 3 | MVP |
| Zona 2-3 | Dua bek atas, tiga bek bawah; lindungi paint dan rebound | 2 | MVP |
| Man-to-Man No-Middle | Paksa bola ke sideline dan baseline, help menunggu di baseline | 3 | F2 |
| Pressure / Denial | Tolak setiap umpan satu langkah dari bola | 3 | F2 |
| Zona 3-2 dan 1-2-2 | Tekan penembak luar, lebih lemah di baseline | 3 | F2 |
| Zona 1-3-1 | Jebakan di wing dan sudut | 4 | F2 |
| Matchup Zone | Zona yang berubah menjadi penjagaan orang sesuai formasi lawan | 5 | F2 |
| Box-and-One / Triangle-and-Two | Zona untuk sebagian bek, sisanya menjaga bintang lawan | 3 | F2 |

### E. Press dan melawan press

| Taktik | Ide inti | Tingkat | Rilis |
| --- | --- | --- | --- |
| Press 2-2-1 | Press lapangan penuh, menjebak setelah lewat garis tengah | 3 | MVP |
| Press Break | Pola melawan press: pemain tengah, umpan balik, serang 3v2 | 2 | MVP |
| Man Press Lapangan Penuh | Setiap bek menekan lawan sejak inbound | 3 | F2 |
| Press 1-2-1-1 (Diamond) | Jebakan langsung di area inbound | 4 | F2 |
| Trap 1-3-1 Setengah Lapangan | Jebakan di sudut setengah lapangan | 4 | F2 |

### F. Situasi khusus

| Taktik | Ide inti | Tingkat | Rilis |
| --- | --- | --- | --- |
| BLOB Box | Inbound baseline, empat pemain membentuk kotak dengan screen | 2 | MVP |
| BLOB Stack | Inbound baseline, empat pemain berbaris lalu menyebar | 2 | MVP |
| 2-for-1 Akhir Kuarter | Tembak cepat agar mendapat dua possession di sisa waktu | 2 | MVP |
| Posisi Lemparan Bebas | Posisi rebound dan transisi saat lemparan bebas | 1 | MVP |
| SLOB | Inbound dari sideline | 3 | F2 |
| ATO Sederhana | Set setelah timeout untuk tembakan cepat | 3 | F2 |
| Unggul 3 Poin di Detik Akhir | Pilihan foul atau bertahan biasa, beserta risikonya | 3 | F2 |
| Jump Ball | Formasi saat lompat bola | 1 | F2 |

## 7. Mode POV Setiap Posisi

Mode POV adalah fitur pembeda utama: pengguna memilih satu posisi, lalu seluruh taktik diputar ulang dari sudut pandang pemain itu. Setiap taktik punya 5 lensa menyerang, dan taktik bertahan punya 5 lensa bertahan (X1–X5).

### Cara kerja

1. Pengguna mengetuk lencana posisi (1–5 atau X1–X5) di panel kanan atau langsung di pemain di lapangan.
2. Kamera meluncur mulus (900 ms) ke mode yang dipilih; pemain terpilih menyala penuh, pemain lain meredup ke 35% opasitas.
3. Jalur pemain terpilih digambar sebagai **garis prediksi** 0,6 detik di depan gerakannya, sehingga pengguna tahu ke mana harus bergerak.
4. Di setiap momen keputusan, waktu melambat ke 0,3× dan **kartu isyarat** muncul di dekat pemain.
5. Panel POV menampilkan tugas, langkah per fase, isyarat, keputusan, dan kesalahan umum untuk posisi itu.

### Komponen lensa POV

| Komponen | Deskripsi | Prioritas |
| --- | --- | --- |
| Mode fokus | Posisi terpilih menyala, sisanya redup; jalur pemain lain tetap tampak tipis | P0 |
| Garis prediksi | Jalur ke depan digambar sebelum pemain bergerak | P0 |
| Panel tugas | Tugas utama (1 kalimat) + checklist langkah per fase yang tercentang otomatis saat fase berjalan | P0 |
| Kartu isyarat | "Lihat ini": apa yang harus dibaca, misalnya posisi bek big | P0 |
| Pohon keputusan | Jika-maka per isyarat; tiap cabang bisa diputar sebagai animasi alternatif | P0 |
| Kamera Taktis | Tampilan atas, bisa dimiringkan sampai 35° | P0 |
| Kamera Chase | Kamera di belakang bahu pemain, mengikuti arah geraknya | P1 |
| Kamera Mata Pemain | Sudut pandang orang pertama setinggi mata (sekitar 1,8 m), dengan HUD minimalis | P1 |
| Panggilan suara | Kata yang harus diteriakkan pemain ("Screen kiri!", "Switch!") muncul sebagai teks melayang | P1 |
| Radar mini | Peta kecil di sudut layar saat kamera Chase atau Mata Pemain aktif | P1 |
| Bandingkan dua posisi | Layar terbagi, dua POV diputar sinkron | P2 |

### Contoh lengkap: Spain Pick-and-Roll (menyerang)

**Ide inti:** PG dan center menjalankan pick-and-roll di tengah, lalu pemain ketiga memasang back screen pada bek center agar roller terbuka. Bek mana pun yang membantu akan meninggalkan seorang penembak bebas.

**Formasi awal:** 1 membawa bola di top; 5 naik dari paint untuk screen; 2 berdiri di sekitar garis lemparan bebas, tersembunyi di belakang X5; 3 di sudut kanan (sisi bola); 4 di sudut kiri (sisi lemah).

&#91;embedded content: Spain PnR · formasi awal dan 4 aksi berurutan\]

Bek mana pun yang membantu menghentikan roll 5 akan meninggalkan penembak bebas: 2 di top atau 4 di sudut.

| Fase | Waktu | Aksi |
| --- | --- | --- |
| 1. Setup | 0,0–2,0 dtk | 1 dribble pancingan menjauhi screen; 5 sprint ke top untuk screen; 2 bersembunyi di belakang X5 |
| 2. Screen | 2,0–3,0 dtk | 1 memakai screen 5 ke kanan, bahu rapat dengan pinggul screener |
| 3. Roll + back screen | 3,0–4,0 dtk | 5 roll ke ring; tepat bersamaan, 2 memasang back screen pada X5 |
| 4. Pop | 4,0–4,8 dtk | 2 pop ke garis 3 poin di top-kiri, kaki siap tembak |
| 5. Keputusan | 4,8–6,0 dtk | 1 membaca bek dan memilih: umpan ke 5, umpan ke 2, kick ke sudut, atau tembak sendiri (waktu melambat 0,3×) |

#### POV per posisi menyerang

| Posisi | Tugas utama | Langkah kunci | Isyarat yang dibaca | Keputusan | Kesalahan umum |
| --- | --- | --- | --- | --- | --- |
| **1 — PG (handler)** | Mengatur timing dan menjaga dribble tetap hidup | Dribble pancingan, tunggu screen terpasang, pakai screen rapat, belok ke tengah | Posisi X5, apakah X2 membantu, apakah bek sudut menempel roller | X5 terhambat → umpan lob/bounce ke 5 · X2 membantu → umpan ke 2 · X4 menempel roller → kick ke 4 · X1 dan X5 jauh → pull-up | Menyerang terlalu cepat sebelum back screen terpasang; lob saat X5 sudah pulih |
| **5 — C (screener/roller)** | Screen keras, lalu roll ke ring | Sprint ke screen, berdiri diam (screen legal), pivot lalu roll, tangan siap jadi target | Arah dribble 1 dan posisi X5 setelah back screen | Bek switch → seal bek kecil di paint · Blitz → short roll dan jadi pengumpan 4v3 | Moving screen; roll sebelum handler melewati screen |
| **2 — SG (Spain screener)** | Back screen pada X5, lalu pop sebagai penembak | Sembunyi di belakang X5, screen tepat saat 5 roll, beri ruang satu langkah normal, pop ke 3 poin | Apakah X2 mengikuti atau membantu ke roller | X2 membantu → pop dan tangkap-tembak · X2 dan X5 switch → slip ke ring | Screen terlalu awal; back screen tanpa ruang langkah (foul) |
| **3 — SF (sudut sisi bola)** | Menjaga lebar lapangan sebagai ancaman tembakan | Tetap di sudut, kaki siap, tangan target | Apakah X3 turun membantu ke handler atau roller | X3 membantu → tetap di sudut, siap kick-out · X3 tetap → lift ke wing untuk umpan pengaman | Mendekat ke bola dan merusak spacing |
| **4 — PF (sudut sisi lemah)** | Penembak sisi lemah dan pemberi hukuman bagi tag | Tetap di sudut, siap skip pass, cut baseline bila bek berpaling | Apakah X4 menempel roller (tag) | X4 tag → tangkap-tembak dari sudut · X4 melihat bola → cut baseline | Berdiri di jalur umpan; terlambat siap tembak |

#### POV bertahan melawan Spain

| Bek | Tugas | Isyarat | Respon yang benar |
| --- | --- | --- | --- |
| X1 | Kejar handler lewat atas screen | Arah screen 5 | Tetap di pinggul handler, tekan dari belakang |
| X5 | Lindungi ring dari roller | Suara "Back screen!" dari X2 | Bertahan di jalur roll; bila terhambat, minta switch |
| X2 | Peringatkan back screen dan putuskan switch | 2 bergerak ke belakang X5 | Teriak lebih awal, switch dengan X5, lalu kembali ke penembak |
| X3 / X4 | Bantu ke roller tanpa meninggalkan sudut terlalu lama | Roller lolos dari X5 | Tag singkat (stunt), lalu closeout ke sudut |

### Contoh bertahan: Zona 2-3 (lensa X1–X5)

| Bek | Area utama | Bola di top | Bola di wing | Bola di sudut | Bola di high post |
| --- | --- | --- | --- | --- | --- |
| X1 (guard kiri) | Top kiri dan wing kiri | Tekan bola bersama X2 | Wing kiri: tekan bola; wing kanan: turun ke elbow | Tutup jalur umpan balik ke wing | Turun menekan dari belakang bila dekat |
| X2 (guard kanan) | Top kanan dan wing kanan | Tekan bola bersama X1 | Cermin X1 | Cermin X1 | Cermin X1 |
| X3 (forward kiri) | Sudut dan block kiri | Siaga di block | Wing kanan: jaga block sisi lemah | Sudut kiri: keluar menekan | Tutup baseline di belakang |
| X4 (forward kanan) | Sudut dan block kanan | Siaga di block | Cermin X3 | Cermin X3 | Cermin X3 |
| X5 (center) | Paint dan high post | Lindungi paint | Geser ke sisi bola | Turun ke low post sisi bola | Naik menekan, guard menutup belakang |

## 8. Fitur & Kebutuhan Fungsional

Total ada 31 fitur; 17 di antaranya P0 dan wajib ada di MVP. Prioritas: **P0** = MVP, **P1** = Fase 2, **P2** = Fase 3 atau sesudahnya.

### Daftar fitur

| ID | Fitur | Deskripsi | Prioritas |
| --- | --- | --- | --- |
| F-01 | Onboarding | 4 langkah: peran (pemain/pelatih/penggemar), posisi favorit, pengalaman, tujuan; membentuk jalur belajar awal | P0 |
| F-02 | Tes penempatan | 10 soal adaptif untuk melompati Level 1 atau 2 | P1 |
| F-03 | Mode tamu | Progres tersimpan lokal; ajakan daftar setelah 3 pelajaran | P0 |
| F-04 | Akun & sinkron | Masuk dengan email atau Google; progres sinkron lintas perangkat | P0 |
| F-05 | Peta Jalur Belajar | Grafik simpul 3 level dengan status terkunci, terbuka, sedang, selesai | P0 |
| F-06 | Pemutar Pelajaran | Langkah berurutan: animasi, teks ringkas, soal cek pemahaman | P0 |
| F-07 | Kuis modul & lencana | Kuis 5 soal per modul; lencana saat lulus ≥ 80% | P0 |
| F-08 | Glosarium interaktif | 120+ istilah di MVP, tiap istilah dengan mini-animasi 3–6 detik | P0 |
| F-09 | Pencarian global | Cari taktik, istilah, pelajaran; filter kategori, tingkat, posisi | P0 |
| F-10 | Lapangan Taktik 2D | Kontrol putar, jeda, maju/mundur per fase, geser timeline, kecepatan 0,25×–2×, ulang fase | P0 |
| F-11 | Lapisan visual | Nyala/mati: jalur gerak, jalur umpan, screen, bek, jejak, zona spacing, label, kerucut pandang bek | P0 |
| F-12 | Mode 3D | Lapangan holografis 3D, kamera orbit, morph mulus 2D ↔ 3D | P1 |
| F-13 | Mode POV | Fokus posisi, garis prediksi, panel tugas, kartu isyarat, pohon keputusan (kamera Chase dan Mata Pemain = P1) | P0 |
| F-14 | Cabang "Bagaimana jika" | Ganti respon bek atau coverage; animasi bercabang mulus dari frame saat ini | P0 |
| F-15 | Narasi suara | Narasi per fase (rekaman atau text-to-speech) | P2 |
| F-16 | Deep link | Tautan ke taktik pada fase dan POV tertentu | P1 |
| F-17 | Ekspor video | Ekspor GIF/MP4 dari animasi taktik | P2 |
| F-18 | Baca & Bereaksi | Permainan dijeda di momen keputusan; pengguna ketuk target umpan atau seret pemain ke spot | P0 |
| F-19 | Tantangan Posisi | "Kamu adalah nomor 2": pengguna menggerakkan pemain sepanjang taktik, dinilai jalur dan timing | P1 |
| F-20 | Susun Fase | Mengurutkan kembali fase taktik yang diacak | P1 |
| F-21 | Mode Presentasi Pelatih | Layar penuh, kontrol keyboard, laser pointer, coretan tangan | P1 |
| F-22 | Playbook Builder | Buat taktik sendiri: tempatkan pemain, gambar jalur, keyframe per fase, pratinjau otomatis | P2 |
| F-23 | Playbook tim | Kumpulan taktik tim, dibagikan ke pemain dengan tautan baca-saja | P2 |
| F-24 | Koleksi & favorit | Simpan taktik dan pelajaran ke koleksi pribadi | P0 |
| F-25 | XP & lencana | XP per aktivitas, lencana per level dan per posisi (misalnya "Master POV Center") | P0 |
| F-26 | Dashboard penguasaan | Grafik radar penguasaan per kategori dan per posisi | P1 |
| F-27 | Studio Konten (internal) | Editor keyframe taktik, validasi skema, pratinjau, riwayat versi | P0 |
| F-28 | Bahasa Inggris | Seluruh antarmuka dan konten dalam Bahasa Inggris | P1 |
| F-29 | PWA & offline | Pasang ke layar utama; unduh taktik untuk dilihat offline | P1 |
| F-30 | Pengaturan aksesibilitas | Kurangi gerak, kontras tinggi, kualitas grafis (Otomatis/Tinggi/Hemat), suara | P0 |
| F-31 | Tanya Pelatih AI | Tanya jawab taktik yang dijawab dari konten TAKTIKA | P2 |

### Kriteria penerimaan fitur inti

**F-10 Lapangan Taktik 2D**

- Diberikan taktik terbuka, ketika pengguna menggeser timeline, maka semua pemain dan bola berada di posisi yang tepat untuk waktu itu tanpa lompatan, dengan latensi di bawah 16 ms per frame.
- Ketika kecepatan diubah ke 0,25×, maka seluruh animasi termasuk efek ikut melambat secara konsisten.
- Ketika pengguna menekan "fase berikutnya", maka animasi berjalan sampai akhir fase lalu berhenti otomatis.

**F-13 Mode POV**

- Diberikan taktik sedang diputar, ketika pengguna memilih posisi 2, maka kamera berpindah dalam 900 ms tanpa memulai ulang taktik.
- Pemain terpilih tampil 100% opasitas, pemain lain 35%, dan garis prediksi muncul 0,6 detik di depan gerakan.
- Ketika waktu mencapai momen keputusan, maka kecepatan turun ke 0,3× dan kartu isyarat tampil dalam 200 ms.

**F-14 Cabang "Bagaimana jika"**

- Diberikan PnR sedang diputar, ketika pengguna mengganti coverage dari Drop ke Switch, maka pemain bergerak dari posisi saat ini ke jalur cabang baru dalam transisi 400–600 ms, tanpa kembali ke awal.
- Label coverage aktif dan counter serangan yang disarankan langsung diperbarui di panel.

**F-18 Baca & Bereaksi**

- Diberikan skenario kuis, ketika animasi mencapai titik jeda, maka lapangan membeku dan target yang bisa diketuk berkedip halus.
- Ketika pengguna menjawab, maka umpan balik visual (benar/salah) tampil dalam 300 ms, lalu animasi melanjutkan opsi yang dipilih pengguna dan memperlihatkan hasilnya.
- Skor dicatat ke progres, dan jawaban salah selalu disertai penjelasan isyarat yang terlewat.

**F-27 Studio Konten**

- Penulis konten dapat membuat taktik baru lengkap dengan 5 lensa POV tanpa menulis kode.
- Sistem menolak penyimpanan bila ada pemain yang berpindah tanpa jalur, fase tanpa durasi, atau POV tanpa tugas utama.

**F-30 Pengaturan aksesibilitas**

- Ketika sistem operasi meminta gerak dikurangi, maka transisi kamera menjadi crossfade, bullet time dimatikan, dan efek partikel dinonaktifkan secara otomatis.

## 9. Sistem Visual Futuristik

Arah desainnya adalah **"Arena Holografis"**: lapangan gelap seperti arena malam, garis lapangan menyala seperti tabung cahaya, panel kaca melayang, dan elemen HUD ala grafis siaran olahraga. Aturan utamanya: kejelasan posisi dan arah selalu menang atas efek.

### Kata kunci gaya

- **Gelap & dalam** — latar hitam kebiruan dengan kabut tipis untuk kedalaman.
- **Cahaya sebagai informasi** — sesuatu yang menyala berarti penting; sesuatu yang redup berarti konteks.
- **HUD presisi** — sudut panel terpotong miring, angka monospace, garis tipis, tanda ukur kecil.
- **Kaca & kedalaman** — panel kaca buram (blur 20 px) melayang di atas lapangan.
- **Gerak sinematik** — kamera dan transisi bergerak seperti siaran olahraga modern, bukan seperti slide presentasi.

### Palet warna (token)

| Token | Nilai | Dipakai untuk |
| --- | --- | --- |
| `bg.void` | #05070D | Latar terdalam, area di luar lapangan |
| `bg.surface` | #0B1020 | Lantai lapangan, latar halaman |
| `bg.glass` | rgba(18, 26, 48, 0.60) + blur 20 px | Panel, kartu, modal |
| `line.court` | #3AF2FF, opasitas 70%, glow 8 px | Garis lapangan |
| `text.primary` | #E8F1FF | Teks utama |
| `text.secondary` | #8A9BB8 | Teks pendukung |
| `team.offense` | #00E5FF (cyan) | Pemain menyerang, dribble |
| `team.defense` | #FF3D7F (coral) | Pemain bertahan, rotasi bertahan |
| `ball` | #D4FF3A (volt) | Bola, tembakan, target utama |
| `action.screen` | #FFB020 (amber) | Screen |
| `action.cut` | #A66BFF (violet) | Cut dan gerak tanpa bola |
| `state.success` | #2BFFA3 | Jawaban benar, fase selesai |
| `state.error` | #FF4D5E | Jawaban salah, pelanggaran |
| `focus.selected` | Inti putih + halo cyan | Pemain yang dipilih di mode POV |

Semua pasangan teks-latar wajib lolos kontras WCAG AA (4,5:1 untuk teks, 3:1 untuk elemen grafis). Warna tidak pernah menjadi satu-satunya pembeda: tim dibedakan juga oleh bentuk, aksi dibedakan juga oleh gaya garis.

### Tipografi

| Peran | Font | Catatan |
| --- | --- | --- |
| Display & judul | Space Grotesk | Bold 600–700, tracking -1% |
| Teks isi | Plus Jakarta Sans | Regular 400 dan Medium 500; dirancang oleh studio Indonesia |
| Angka HUD | JetBrains Mono | Timer, shot clock, koordinat, skor |

Skala ukuran: 12 / 14 / 16 / 20 / 24 / 32 / 48 / 64 px. Isi teks minimal 16 px di mobile.

### Lapangan

- **2D (utama):** tampilan atas setengah lapangan; lapangan penuh untuk transisi dan press. Di mobile portrait, ring berada di atas sehingga setengah lapangan mengisi layar vertikal.
- **Lantai:** gradien navy dengan pola grid halus berlapis 4% opasitas; paint diwarnai cyan 6%.
- **Garis:** 2 px dengan glow 8 px; garis 3 poin dan lingkaran digambar ulang saat lapangan muncul (efek boot-up).
- **3D (fase 2):** lantai reflektif, ring dan papan pantul berbahan kaca dengan tepi bercahaya, kabut tipis, cahaya tepi dari atas; sudut kamera bawaan 35°.
- **Label zona:** muncul saat disentuh atau saat narasi menyebut zona itu.

### Token pemain dan bola

| Elemen | 2D | 3D (fase 2) |
| --- | --- | --- |
| Pemain menyerang | Lingkaran terisi gradien cyan, diameter 28 px (desktop), angka 1–5 di tengah, panah kecil arah gerak | Figur hologram low-poly semi-transparan dengan angka melayang |
| Pemain bertahan | Segi enam bergaris coral, label X1–X5 | Figur hologram coral dengan efek scanline |
| Bola | Bola volt 10 px dengan glow; saat dipegang, mengorbit token pembawa | Bola volt dengan jejak cahaya |
| Pemain terpilih (POV) | Inti putih, halo cyan berdenyut 1,6 detik | Sorot cahaya vertikal tipis dari atas |
| Pemain redup | Opasitas 35%, tanpa glow | Opasitas 30%, tanpa bayangan |

Urutan fase 3D: kapsul sederhana dengan angka lebih dulu, lalu figur beranimasi (lari, dribble, screen, cut, tembak) setelah performa terbukti stabil.

### Notasi aksi

Notasi mengikuti konvensi diagram pelatih yang sudah umum, supaya ilmu dari TAKTIKA bisa langsung dipakai di papan tulis.

| Aksi | Gaya garis | Warna | Perilaku animasi |
| --- | --- | --- | --- |
| Cut / gerak tanpa bola | Garis solid berpanah | Violet | Garis menggambar dirinya di depan pemain |
| Dribble | Garis bergelombang berpanah | Cyan | Gelombang beriak mengikuti ritme dribble |
| Umpan | Garis putus-putus berpanah | Putih ke cyan | Bola melesat dengan jejak partikel |
| Screen | Garis berujung batang T | Amber | Batang T berdenyut dan beriak saat kontak |
| Dribble handoff | Dua garis bertemu dengan simbol tukar | Cyan + amber | Kilatan kecil saat bola berpindah tangan |
| Tembakan | Busur menuju ring | Volt | Busur parabola dengan cincin target di ring |
| Rotasi bertahan | Garis solid tipis | Coral | Sapuan cepat dengan ujung memudar |

### Komponen antarmuka

- **Panel kaca:** blur 20 px, garis tepi 1 px putih 8%, satu sudut terpotong miring 12 px.
- **Tombol:** bentuk pil dengan garis tepi gradien; glow menguat saat hover dan bergerak sedikit mengikuti kursor (efek magnet).
- **Timeline:** trek tersegmen per fase dengan warna kategori; momen keputusan ditandai berlian volt.
- **Lencana posisi:** segi enam dengan angka; lencana aktif berdenyut halus.
- **Kartu isyarat:** callout kaca dengan garis penunjuk ke pemain yang terkait.
- **Ikon:** garis 1,5 px, sudut membulat, satu set konsisten.

### Tema tambahan

**Tema Papan Tulis** (P1): latar terang dan garis gelap untuk proyektor di ruangan terang dan untuk cetak. Semua token punya pasangan nilai di tema ini.

## 10. Spesifikasi Animasi & Motion

Semua animasi taktik digerakkan oleh satu jam induk (master timeline), sehingga putar, jeda, geser mundur, dan ganti kecepatan selalu sinkron dan deterministik. Ada 21 animasi baku (A-01 sampai A-21) dan 5 mode kamera.

### Lima prinsip gerak

1. **Bermakna** — setiap gerak menjawab "siapa, ke mana, kapan, mengapa"; efek tanpa makna dihapus.
2. **Kontinu** — tidak ada objek yang muncul atau pindah tiba-tiba; semua berpindah lewat jalur yang terlihat.
3. **Hierarki waktu** — aksi utama tampil paling jelas; efek pendukung lebih pendek dan lebih redup.
4. **Fisika yang dipercaya** — percepatan, perlambatan, dan busur bola terasa nyata, walau sedikit dilebih-lebihkan agar terbaca.
5. **Bisa dikendalikan** — semua yang bergerak bisa dijeda, diperlambat, dan diputar mundur.

### Token durasi & easing

| Token | Durasi | Easing | Dipakai untuk |
| --- | --- | --- | --- |
| `motion.instant` | 100 ms | linear | Perubahan warna status |
| `motion.fast` | 160 ms | spring (kekakuan 300, redaman 30) | Hover, tekan tombol, toggle |
| `motion.base` | 240 ms | cubic-bezier(0.16, 1, 0.3, 1) | Panel muncul, kartu isyarat |
| `motion.slow` | 400 ms | cubic-bezier(0.16, 1, 0.3, 1) | Perubahan tata letak, cabang "bagaimana jika" |
| `motion.scene` | 600–700 ms | cubic-bezier(0.65, 0, 0.35, 1) | Transisi halaman, morph kartu ke lapangan |
| `motion.camera` | 900 ms | cubic-bezier(0.65, 0, 0.35, 1) | Perpindahan kamera dan POV |
| `motion.cinematic` | 1.200–1.600 ms | Bertahap (stagger) | Boot-up lapangan, intro taktik |

### Gerak pemain dan bola

- **Jalur:** spline Catmull-Rom sentripetal dengan parameter panjang busur, sehingga kecepatan merata dan tikungan halus.
- **Profil kecepatan (perkiraan dunia nyata):** jalan sekitar 1,5 m/s, jogging 3–4 m/s, sprint 6–7 m/s, slide bertahan 2,5–3,5 m/s.
- **Tikungan tajam:** V-cut dan L-cut punya jeda tanam kaki 80 ms di titik belok, lalu akselerasi keluar.
- **Umpan:** selalu tampil minimal 250 ms di layar agar mata bisa mengikuti, walau di dunia nyata lebih cepat.
- **Tembakan:** busur parabola dengan waktu terbang sekitar 1 detik.
- **Dribble:** bola memantul di sisi tangan dominan, frekuensi sekitar 2 pantulan per detik saat berjalan dan lebih cepat saat sprint.

### Katalog animasi

| ID | Animasi | Pemicu | Deskripsi gerak | Durasi |
| --- | --- | --- | --- | --- |
| A-01 | Boot-up lapangan | Tactic Viewer pertama kali dibuka | Grid muncul pelan; garis lapangan menggambar diri dari lingkaran tengah ke luar; paint terisi; pemain muncul dari kolom cahaya berurutan 1→5 dengan jeda 80 ms | 1,6 dtk (400 ms pada kunjungan ulang) |
| A-02 | Morph kartu ke lapangan | Kartu taktik diklik di perpustakaan | Thumbnail kartu membesar dan berubah menjadi lapangan penuh (shared element) | 600 ms |
| A-03 | Garis prediksi | Mode POV aktif | Jalur menggambar diri 0,6 dtk di depan pemain, ekornya memudar | Mengikuti timeline |
| A-04 | Jejak gerak | Lapisan "jejak" aktif | Bayangan jalur 1,2 dtk terakhir memudar di belakang pemain | Mengikuti timeline |
| A-05 | Umpan | Event umpan | Bola melesat sepanjang garis putus-putus; cincin tangkap mengembang di penerima; garis hilang 200 ms setelah ditangkap | Min. 250 ms |
| A-06 | Kontak screen | Screener menyentuh bek | Dua cincin riak amber; label HUD "SCREEN" 800 ms; getar kamera mikro 2 px (opsional) | 300 ms |
| A-07 | Cut | Event cut | Tiga *afterimage* memudar; backdoor cut diberi kilatan tajam di titik tanam kaki | Mengikuti timeline |
| A-08 | Tembakan | Event tembakan | Busur volt digambar, bola mengikuti; masuk = ledakan partikel di ring; gagal = bola memantul | Sekitar 1 dtk |
| A-09 | Momen keputusan | Penanda keputusan di timeline | Kecepatan turun 1,0× ke 0,3× dalam 250 ms; vinyet 20%; bek tak relevan diredupkan; kartu isyarat muncul dari skala 0,96 dan buram ke tajam; opsi umpan tampil sebagai berkas cahaya | 250 ms masuk |
| A-10 | Pergantian fase | Batas fase | Label fase meluncur dari kiri dengan efek ketik HUD; segmen timeline menyala | 300 ms |
| A-11 | Fokus POV | Posisi dipilih | Opasitas pemain lain turun ke 35%; kamera dolly ke mode terpilih | 300 ms + 900 ms |
| A-12 | Morph 2D ↔ 3D | Toggle 3D | Lapangan 2D miring perlahan hingga 55°, token tumbuh menjadi figur 3D, cahaya dan kabut masuk | 1.000 ms |
| A-13 | Cabang "bagaimana jika" | Coverage diganti | Frame membeku 150 ms; jalur lama memudar jadi bayangan 20%; jalur baru menggambar diri; pemain berbaur ke jalur baru | 150 + 500 ms |
| A-14 | Spacing | Lapisan spacing aktif | Area lantai terbuka diarsir dan berdenyut; garis jarak hijau ≥ 4,5 m, kuning 3–4,5 m, merah < 3 m | Mengikuti timeline |
| A-15 | Pandangan bek | Lapisan kerucut pandang aktif | Kerucut coral transparan 120° berputar mengikuti arah kepala bek | Mengikuti timeline |
| A-16 | Jalur umpan | Lapisan jalur umpan aktif | Berkas cahaya dari pembawa bola ke calon penerima; lebar berkas = tingkat keamanan; berkas merah bila terhalang bek | Mengikuti timeline |
| A-17 | Umpan balik kuis | Jawaban dikirim | Benar: denyut hijau + partikel kecil; salah: getar horizontal 2× 6 px + garis menuju jawaban benar | 300 ms |
| A-18 | XP & lencana | Hadiah didapat | Angka XP terbang melengkung ke ikon profil; lencana berputar 360° sekali | 600–900 ms |
| A-19 | Hover & tekan | Interaksi tombol | Glow menguat; efek magnet maksimal 6 px | 160 ms |
| A-20 | Memuat | Data belum siap | Skeleton dengan kilau scanline bergerak; untuk 3D, garis lapangan dirakit perlahan | Selama memuat |
| A-21 | Hero halaman awal | Gulir landing page | Lapangan 3D berputar dan miring mengikuti posisi gulir; satu taktik diputar otomatis | Terikat gulir |

### Mode kamera

| Mode | Posisi | Sudut pandang (FOV) | Perilaku |
| --- | --- | --- | --- |
| Taktis | Tepat di atas lapangan, miring 0–35° | 40° | Default; orbit terbatas ±30° |
| Siaran | Sisi lapangan setinggi tribun | 45° | Mengikuti bola dengan jeda 200 ms |
| Chase | 3 m di belakang dan 2 m di atas pemain | 60° | Mengikuti arah gerak dengan redaman |
| Mata Pemain | Setinggi mata, sekitar 1,8 m | 75° | Tanpa goyangan kepala; rotasi diperhalus |
| Sinematik | Lintasan melingkar | 45° | Intro taktik 4 detik, bisa dilewati |

Aturan kamera: tidak ada rotasi miring (roll), kecepatan sudut maksimal 90° per detik, dan setiap perpindahan memakai `motion.camera`. Aturan ini mencegah pusing di mode Chase dan Mata Pemain.

### Orkestrasi

- Semua animasi taktik (pemain, bola, garis, label fase) adalah fungsi murni dari waktu `t`; geser mundur memutar semuanya mundur dengan tepat.
- Efek dekoratif (partikel, riak) boleh acak, tetapi diatur ulang setiap kali timeline digeser.
- Animasi antarmuka (panel, tombol) berjalan di luar timeline taktik dan tidak ikut melambat saat bullet time.

### Suara (opsional, mati secara bawaan)

Detak UI halus, decit sepatu saat cut, suara swish saat tembakan masuk, dan nada naik saat jawaban benar. Volume diatur per kategori: UI, lapangan, dan narasi.

### Tingkat kualitas & kurangi gerak

| Fitur | Tinggi | Standar | Hemat | Kurangi Gerak |
| --- | --- | --- | --- | --- |
| Mode 3D | Ya | Ya, tanpa refleksi | Tidak (2D saja) | Ya, kamera statis |
| Glow & blur | Penuh | Penuh | Glow saja | Penuh |
| Partikel | Ya | Dikurangi | Tidak | Tidak |
| Bullet time | Ya | Ya | Ya | Diganti jeda langsung |
| Transisi kamera | Dolly | Dolly | Potong cepat | Crossfade 200 ms |
| Boot-up lapangan | Penuh | Penuh | Versi 400 ms | Fade 200 ms |

Tingkat kualitas dipilih otomatis dari hasil uji frame rate 2 detik pertama, dan bisa diubah manual di pengaturan.

## 11. Arsitektur Informasi & Layar Utama

Aplikasi punya lima area utama: Beranda, Belajar, Taktik, Latihan, dan Profil. Area Pelatih muncul di menu bila pengguna memilih peran pelatih. Tactic Viewer adalah layar terpenting dan dipakai ulang oleh pelajaran, kuis, dan mode presentasi.

&#91;embedded content: Sitemap · 5 area utama + area Pelatih\]

Pelajaran, kuis, dan Mode Presentasi semuanya membuka Tactic Viewer yang sama, sehingga pengalaman animasi konsisten di seluruh aplikasi.

### Navigasi

- **Desktop:** rel navigasi kiri berisi ikon dan label, bisa diciutkan.
- **Mobile:** bilah tab bawah dengan 5 tab (Beranda, Belajar, Taktik, Latihan, Profil).
- **Glosarium:** dibuka lewat pencarian global atau dengan mengetuk istilah bergaris bawah di mana saja.

### Daftar layar

| ID | Layar | Tujuan | Elemen utama | Animasi khas |
| --- | --- | --- | --- | --- |
| S-01 | Landing page | Mengubah pengunjung menjadi pengguna | Hero lapangan 3D, demo POV mini, tombol "Mulai Belajar Gratis" | A-21 hero terikat gulir |
| S-02 | Onboarding | Mengenal pengguna dalam 4 langkah | Kartu pilihan peran, posisi, pengalaman, tujuan | Kartu terpilih menyala, langkah meluncur |
| S-03 | Dashboard | Titik lanjut belajar | Lanjutkan pelajaran, jalur ringkas, taktik pilihan hari ini, streak, rekomendasi per posisi | Angka XP menghitung naik |
| S-04 | Peta Jalur Belajar | Melihat seluruh kurikulum | Grafik simpul 3 level, garis penghubung | Jalur menyala saat simpul selesai |
| S-05 | Pemutar Pelajaran | Belajar satu konsep | Animasi (atas di mobile, kiri di desktop), teks ringkas, indikator langkah, soal cek | A-10 antar langkah |
| S-06 | Perpustakaan Taktik | Menemukan taktik | Grid kartu, filter kategori/tingkat/posisi, pencarian | Thumbnail animasi berputar saat hover; A-02 saat dibuka |
| S-07 | Tactic Viewer | Memahami taktik secara utuh | Lihat diagram tata letak di bawah | A-01, A-03 sampai A-16 |
| S-08 | Baca & Bereaksi | Menguji keputusan | Lapangan, penghitung waktu, skor, target yang bisa diketuk | A-09, A-17 |
| S-09 | Glosarium | Mencari istilah | Daftar A–Z, pencarian, kartu istilah dengan mini-animasi | Kartu membalik ke animasi |
| S-10 | Profil & Progres | Melihat kemajuan | Grafik radar penguasaan, lencana, koleksi, pengaturan | A-18 |
| S-11 | Mode Presentasi | Mengajar di depan tim | Lapangan layar penuh, laser pointer, coretan tangan | Kontrol muncul saat mouse bergerak |
| S-12 | Playbook Builder | Membuat taktik sendiri | Kanvas lapangan, palet aksi, timeline keyframe | Pratinjau animasi langsung |

### Tata letak Tactic Viewer

&#91;embedded content: Tactic Viewer desktop · 5 area: bilah atas, fase, lapangan, POV, timeline\]

Lapangan tidak pernah tertutup panel; semua kendali berada di tepi, dan pemain selain posisi terpilih diredupkan ke 35%.

| Breakpoint | Tata letak |
| --- | --- |
| Desktop ≥ 1280 px | Panel fase kiri 280 px, lapangan di tengah, panel POV kanan 320 px, timeline bawah 88 px |
| Tablet 768–1279 px | Panel fase menjadi laci yang bisa ditarik; panel POV tetap di kanan |
| Mobile portrait < 768 px | Setengah lapangan di atas (sekitar 60% tinggi layar), timeline di bawahnya, lalu lembar bawah bertab: Fase, POV, Bagaimana Jika, Kuis |
| Mobile landscape | Lapangan layar penuh dengan kontrol melayang yang hilang setelah 3 detik |

### Pintasan keyboard (desktop)

| Tombol | Aksi |
| --- | --- |
| Spasi | Putar / jeda |
| ← / → | Fase sebelumnya / berikutnya |
| Shift + ← / → | Geser 1 detik |
| 1–5 | Pilih POV posisi menyerang |
| Shift + 1–5 | Pilih POV bek X1–X5 |
| V | Ganti 2D / 3D |
| L | Buka menu lapisan |
| \[ dan \] | Turunkan / naikkan kecepatan |
| F | Layar penuh |

## 12. Alur Pengguna Utama

Ada lima alur yang harus mulus di MVP. Targetnya: pengguna baru melihat animasi taktik pertama dalam waktu kurang dari 60 detik sejak membuka situs.

### Alur 1 — Pengguna baru sampai pelajaran pertama (target < 3 menit)

1. Membuka landing page; hero lapangan 3D memutar demo Spain PnR singkat.
2. Menekan "Mulai Belajar Gratis" tanpa harus mendaftar.
3. Onboarding 4 langkah: peran → posisi favorit → pengalaman → tujuan (masing-masing satu ketukan).
4. Sistem menyarankan titik mulai (misalnya Level 1 untuk penggemar baru, tes penempatan untuk pemain).
5. Pelajaran pertama berjalan dengan boot-up lapangan (A-01).
6. Soal cek pemahaman, lalu layar hasil dengan XP dan lencana pertama.
7. Setelah pelajaran ke-3, muncul ajakan membuat akun agar progres tidak hilang.

### Alur 2 — Mempelajari taktik dengan POV

1. Membuka Perpustakaan Taktik, memfilter "Set play" dan "Tingkat 3–4".
2. Mengetuk kartu Spain PnR; kartu bermorph menjadi lapangan (A-02).
3. Menonton putaran pertama dengan kamera Taktis dan narasi per fase.
4. Memilih POV posisi 2; kamera dolly, pemain lain meredup, garis prediksi muncul.
5. Di momen keputusan, waktu melambat dan kartu isyarat tampil.
6. Membuka "Bagaimana jika" dan mengganti coverage ke Switch; animasi bercabang dari frame saat ini.
7. Menyimpan taktik ke koleksi, lalu memulai kuis Baca & Bereaksi untuk taktik ini.

### Alur 3 — Kuis Baca & Bereaksi

1. Skenario dimulai; animasi berjalan normal sampai titik keputusan.
2. Lapangan membeku; target yang bisa diketuk berkedip; penghitung waktu 5 detik berjalan (bisa dimatikan).
3. Pengguna mengetuk penerima umpan atau menyeret pemain ke spot.
4. **Jika benar:** denyut hijau, animasi melanjutkan opsi tersebut sampai mencetak angka.
5. **Jika salah:** getar merah, animasi tetap melanjutkan pilihan pengguna dan memperlihatkan akibatnya (misalnya bola dicuri), lalu memutar ulang opsi yang benar dengan isyarat yang terlewat disorot.
6. Setelah 5 skenario, tampil skor, XP, dan rekomendasi pelajaran untuk isyarat yang sering terlewat.

### Alur 4 — Pelatih mempresentasikan taktik (fase 2)

1. Pelatih membuka taktik dari koleksi tim di laptop yang tersambung ke proyektor.
2. Menekan F untuk Mode Presentasi; tema Papan Tulis dipakai bila ruangan terang.
3. Mengontrol fase dengan panah keyboard, menyorot pemain dengan laser pointer, dan mencoret jalur tambahan.
4. Menekan 1–5 untuk menunjukkan tugas tiap posisi kepada pemain yang bersangkutan.
5. Mengirim tautan taktik (deep link ke fase dan POV) ke grup tim setelah sesi.

### Alur 5 — Pengguna kembali

1. Dashboard menampilkan "Lanjutkan" pada titik terakhir dengan pratinjau animasi.
2. Streak dan target harian tampil di atas.
3. Rekomendasi taktik baru berdasarkan posisi favorit dan isyarat yang sering terlewat di kuis.

## 13. Model Data & Skema Konten Taktik

Setiap taktik disimpan sebagai satu dokumen JSON berbasis waktu: daftar pemain, fase, event bergerak, titik keputusan, cabang, dan lensa POV. Renderer 2D dan 3D membaca data yang sama, sehingga perpindahan 2D ↔ 3D tidak mengubah isi taktik.

### Sistem koordinat

- Satuan meter, mengikuti lapangan FIBA 28 × 15 m.
- **Setengah lapangan:** titik asal (0, 0) = proyeksi pusat ring di lantai. Sumbu x = lebar lapangan (positif ke kanan dari sudut pandang penyerang menghadap ring, -7,5 sampai 7,5). Sumbu y = arah ke garis tengah (-1,575 di garis akhir sampai 12,425 di garis tengah).
- **Lapangan penuh:** titik asal di pusat lingkaran tengah; x = panjang (-14 sampai 14), y = lebar (-7,5 sampai 7,5).
- Arah hadap (`facing`) dalam derajat; 0° = menghadap ring serang.

### Entitas inti

| Entitas | Field utama | Catatan |
| --- | --- | --- |
| Tactic | id, slug, judul {id, en}, kategori, tingkat 1–5, court, durasi, players, phases, events, decisions, branches, povLenses, mistakes, counters, quizIds, related, versi, status | Status: draft, review, terbit |
| Player | id (O1–O5, X1–X5), tim, peran (PG/SG/SF/PF/C), posisi awal {x, y, facing} | X terikat pada O yang dijaga lewat `guards` |
| Phase | id, urutan, judul, tStart, tEnd, narasi, fokus pemain | Fase tidak boleh tumpang tindih |
| Event | id, t, dur, jenis, actor, target, path, profil kecepatan, label | Jenis: move, dribble, pass, screen, cut, handoff, shot, rebound, rotate |
| Decision | id, t, pemilik, isyarat, opsi \[label, benar/salah, branchId, penjelasan\] | Memicu bullet time (A-09) |
| Branch | id, dariT, pemicu (misalnya coverage = switch), event pengganti | Dipakai fitur "Bagaimana jika" |
| POVLens | playerId, tugas, langkah per fase, isyarat, keputusan, kesalahan, panggilan suara | Wajib ada untuk 5 pemain menyerang |
| Level / Module / Lesson | id, urutan, judul, prasyarat, langkah pelajaran, kuis | Lesson boleh menyematkan potongan taktik |
| GlossaryTerm | id, istilah, padanan, definisi, animasi mini, istilah terkait | 120+ di MVP |
| Quiz / Scenario | id, taktik, titik jeda, jenis jawaban (ketuk/seret), kunci, penjelasan |  |
| UserProgress | userId, item, status, skor, XP, waktu | Disimpan lokal untuk tamu |
| Collection / Playbook | id, pemilik, daftar taktik, visibilitas | Playbook buatan pengguna di fase 3 |

### Contoh JSON (potongan Spain PnR)

```json
{
  "id": "set-spain-pnr",
  "title": { "id": "Spain Pick-and-Roll", "en": "Spain Pick-and-Roll" },
  "category": "set-play",
  "level": 4,
  "court": "half",
  "duration": 6.0,
  "players": [
    { "id": "O1", "team": "offense", "role": "PG", "start": { "x": 0.0, "y": 8.2, "facing": 0 } },
    { "id": "O2", "team": "offense", "role": "SG", "start": { "x": 0.0, "y": 4.6, "facing": 180 } },
    { "id": "O5", "team": "offense", "role": "C",  "start": { "x": 0.0, "y": 1.5, "facing": 180 } },
    { "id": "X5", "team": "defense", "guards": "O5", "start": { "x": 0.0, "y": 1.0, "facing": 180 } }
  ],
  "phases": [
    { "id": "p1", "title": "Setup", "tStart": 0.0, "tEnd": 2.0 },
    { "id": "p3", "title": "Roll + back screen", "tStart": 3.0, "tEnd": 4.0 }
  ],
  "events": [
    { "id": "e4", "t": 2.0, "dur": 1.0, "type": "dribble", "actor": "O1",
      "path": [[0.0, 8.2], [1.6, 7.4], [2.6, 6.1]], "speed": "jog" },
    { "id": "e6", "t": 3.0, "dur": 0.6, "type": "screen", "actor": "O2", "target": "X5",
      "path": [[0.0, 4.6], [0.4, 5.8]], "label": "Back screen" }
  ],
  "decisions": [
    { "id": "d1", "t": 4.8, "owner": "O1", "cue": "Posisi X5 dan X2",
      "options": [
        { "label": "Lob ke 5", "correctWhen": "X5 terhambat", "branchId": "b-lob" },
        { "label": "Umpan ke 2", "correctWhen": "X2 membantu", "branchId": "b-pop" }
      ] }
  ],
  "povLenses": [
    { "playerId": "O2", "mission": "Back screen pada X5, lalu pop sebagai penembak",
      "cues": ["Apakah X2 mengikuti atau membantu?"],
      "calls": ["Back!"] }
  ]
}
```

### Aturan validasi (dijalankan Studio Konten)

- Setiap pemain punya posisi terdefinisi di setiap waktu `t`; tidak boleh ada perpindahan tanpa event.
- Pemain tidak boleh saling tembus: jarak minimum 0,5 m antar-token, kecuali saat kontak screen.
- Bola hanya dimiliki satu pemain pada satu waktu, atau sedang di udara karena umpan/tembakan.
- Setiap taktik menyerang wajib punya 5 POVLens yang lengkap dan minimal 1 Decision.
- Kecepatan pemain yang dihitung dari jalur tidak boleh melewati 8 m/s (sanity check sprint).
- Teks Bahasa Indonesia wajib ada; teks Inggris boleh kosong sampai fase 2.

## 14. Arsitektur Teknis & Tech Stack

Jantung aplikasi adalah **Tactic Engine**: paket TypeScript mandiri yang mengubah JSON taktik menjadi "keadaan lapangan" untuk setiap waktu `t`. Renderer 2D, renderer 3D, panel POV, dan kuis semuanya membaca keadaan yang sama dari mesin ini.

&#91;embedded content: Arsitektur · klien dan 4 layanan pendukung\]

Renderer 2D dan 3D tidak menyimpan posisi sendiri; keduanya menggambar dari `getState(t)` milik Tactic Engine, dan taktik terbit dari Studio Konten ke CDN sebagai file statis.

### Komponen Tactic Engine

| Komponen | Tanggung jawab |
| --- | --- |
| Loader & Validator | Memuat JSON taktik dan memvalidasi skema (bagian 13) |
| Interpolator | Menghitung posisi pemain, bola, dan event aktif untuk waktu `t` |
| Master Clock | Putar, jeda, geser, skala waktu, dan rampa bullet time |
| Branch Resolver | Mengganti event saat pengguna memilih cabang "bagaimana jika" |
| Event Bus | Memberi tahu UI saat fase berganti, keputusan tercapai, atau umpan terjadi |
| Snapshot API | `getState(t)` untuk renderer, kuis, ekspor video, dan pengujian |

### Tech stack yang direkomendasikan

| Lapisan | Pilihan | Alasan |
| --- | --- | --- |
| Framework | Next.js (React) + TypeScript | Halaman pelajaran bisa dirender di server untuk SEO; ekosistem besar |
| Styling | Tailwind CSS + CSS variables untuk token desain | Token warna dan gerak konsisten di semua komponen |
| Animasi UI | Motion (sebelumnya Framer Motion) + View Transitions API | Transisi tata letak dan morph kartu ke lapangan |
| Jam induk taktik | GSAP Timeline (atau jam kustom di Tactic Engine) | Geser timeline presisi dan `timeScale` untuk bullet time; periksa lisensi saat implementasi |
| Renderer 2D | PixiJS (WebGL) + lapisan SVG/HTML untuk label | Glow dan partikel tetap 60 fps di HP; label tetap bisa dibaca pembaca layar |
| Renderer 3D | Three.js lewat React Three Fiber + drei + postprocessing (bloom) | Lapangan holografis, shader scanline, kamera POV |
| Aset 3D | glTF/GLB terkompresi Draco | Ukuran unduhan kecil |
| State | Zustand (viewer) + TanStack Query (data server) | Ringan dan cocok untuk state real-time |
| Validasi | Zod | Skema taktik dipakai bersama oleh Studio Konten dan aplikasi |
| Backend | Supabase (Postgres, Auth, Storage) | Auth Google/email, progres pengguna, koleksi |
| Konten pelajaran | Headless CMS (misalnya Payload atau Sanity) | Penulis konten tidak perlu developer |
| Studio Konten taktik | Aplikasi internal di repo yang sama | Editor keyframe memakai Tactic Engine yang sama |
| Hosting | Vercel + CDN untuk JSON taktik dan aset | JSON taktik terbit sebagai file statis yang di-cache |
| PWA & offline | Service worker (Serwist/Workbox) | Unduh taktik untuk ditonton offline |
| i18n | next-intl | Bahasa Indonesia dan Inggris |
| Analitik & flag | PostHog | Event produk, funnel, feature flag untuk uji A/B |
| Pemantauan | Sentry | Error dan performa di perangkat nyata |
| Pengujian | Vitest, Playwright, Lighthouse CI | Uji snapshot keadaan di waktu `t` dan regresi visual per frame |

### Keputusan arsitektur penting

- **Satu sumber kebenaran:** renderer tidak menyimpan posisi sendiri; semua diambil dari `getState(t)`. Inilah yang membuat 2D ↔ 3D dan perpindahan POV mulus.
- **3D dimuat malas:** paket 3D (anggaran maksimal 600 KB terkompresi) hanya diunduh saat pengguna pertama kali menekan tombol 3D.
- **Konten statis:** JSON taktik diterbitkan ke CDN; database hanya untuk data pengguna.
- **Deterministik:** fungsi `getState(t)` murni, sehingga pengujian otomatis bisa membandingkan posisi di waktu mana pun.

## 15. Kebutuhan Non-Fungsional

Target terpenting adalah animasi stabil 60 fps di HP Android kelas menengah, karena di situlah mayoritas pengguna belajar. Semua target di bawah diuji di perangkat acuan, bukan hanya di laptop developer.

| Kategori | Kebutuhan | Target |
| --- | --- | --- |
| Performa | Largest Contentful Paint (4G, perangkat menengah) | < 2,5 detik |
| Performa | Interaction to Next Paint | < 200 ms |
| Performa | Cumulative Layout Shift | < 0,1 |
| Performa | JavaScript awal halaman landing | ≤ 200 KB (gzip) |
| Performa | JavaScript Tactic Viewer 2D | ≤ 350 KB (gzip); 3D dimuat terpisah |
| Performa | Frame rate animasi 2D | 60 fps; minimal 45 fps di perangkat acuan |
| Performa | Memuat taktik | < 300 ms dari cache, < 1 detik dari jaringan |
| Performa | Memori mode 3D | < 300 MB |
| Responsif | Lebar layar yang didukung | 360–2560 px, portrait dan landscape |
| Responsif | Ukuran area sentuh | ≥ 44 × 44 px |
| Kompatibilitas | Browser | Chrome, Edge, Firefox, Safari (desktop dan iOS), dua versi utama terakhir |
| Kompatibilitas | 3D | Butuh WebGL2; tanpa WebGL2 otomatis ke 2D |
| Aksesibilitas | Standar | WCAG 2.2 level AA |
| Aksesibilitas | Alternatif animasi | Narasi teks per fase diumumkan lewat `aria-live` |
| Aksesibilitas | Navigasi | Semua fitur bisa dipakai dengan keyboard saja |
| Aksesibilitas | Gerak | Menghormati `prefers-reduced-motion` dan pengaturan dalam aplikasi |
| Aksesibilitas | Teks | Tetap terbaca saat diperbesar 200% |
| Bahasa | Bawaan | Bahasa Indonesia; format angka Indonesia (koma desimal) |
| Keamanan | Data pengguna | HTTPS, Row Level Security per pengguna di database |
| Privasi | Regulasi | Patuh UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi; data seminimal mungkin |
| Privasi | Pengguna anak | Alur persetujuan orang tua/wali untuk pengguna di bawah umur saat membuat akun |
| Keandalan | Ketersediaan layanan | ≥ 99,5% per bulan |
| Keandalan | Offline | Taktik yang diunduh tetap bisa diputar tanpa internet |
| SEO | Halaman pelajaran dan glosarium | Dirender di server, metadata lengkap, gambar pratinjau otomatis dari taktik |
| Kualitas kode | Tactic Engine | Cakupan unit test ≥ 90% |
| Observabilitas | Pemantauan | Error, performa, dan metrik fps kustom dari perangkat nyata |

## 16. Metrik Keberhasilan & Analitik

North Star Metric: **Taktik Dipahami per Minggu**, yaitu jumlah taktik yang ditonton sampai selesai *dan* kuis Baca & Bereaksi-nya dijawab benar ≥ 70%. Metrik ini mengukur pemahaman, bukan sekadar waktu tonton.

### Metrik pendukung

| Area | Metrik | Definisi | Target awal |
| --- | --- | --- | --- |
| Aktivasi | Pelajaran pertama selesai | % pengguna baru yang menyelesaikan 1 pelajaran di sesi pertama | ≥ 60% |
| Aktivasi | Waktu ke animasi pertama | Detik dari buka situs sampai animasi taktik pertama diputar | < 60 detik |
| Keterlibatan | Pemakaian POV | % sesi Tactic Viewer yang membuka mode POV | ≥ 40% |
| Keterlibatan | Pemakaian "Bagaimana jika" | % sesi Tactic Viewer yang mengganti cabang | ≥ 25% |
| Pembelajaran | Kenaikan skor kuis | Selisih skor percobaan 1 dan 3 pada skenario yang sama | ≥ 25 poin persentase |
| Pembelajaran | Penyelesaian Level 1 | % pengguna yang memulai Level 1 lalu menyelesaikannya dalam 30 hari | ≥ 35% |
| Retensi | Retensi hari ke-7 / ke-30 | % pengguna yang kembali | ≥ 25% / ≥ 12% |
| Konversi | Tamu menjadi akun | % tamu yang mendaftar setelah ajakan | ≥ 30% |
| Kualitas | Frame rate | Median fps di Tactic Viewer pada perangkat nyata | ≥ 55 fps |
| Kepuasan | NPS | Survei dalam aplikasi setelah 7 hari | ≥ 40 |

### Event analitik

| Event | Properti utama | Dipicu saat |
| --- | --- | --- |
| `onboarding_completed` | peran, posisi, pengalaman, tujuan | Onboarding selesai |
| `lesson_started` / `lesson_completed` | lesson\_id, level, durasi | Pelajaran dimulai / selesai |
| `tactic_opened` | tactic\_id, sumber (perpustakaan, pencarian, tautan) | Tactic Viewer dibuka |
| `tactic_played_full` | tactic\_id, kecepatan, mode 2D/3D | Taktik diputar sampai akhir |
| `timeline_scrubbed` | tactic\_id, dari\_t, ke\_t | Timeline digeser |
| `pov_selected` | tactic\_id, player\_id, mode kamera | Posisi POV dipilih |
| `branch_selected` | tactic\_id, decision\_id, cabang | Cabang "bagaimana jika" dipilih |
| `layer_toggled` | nama lapisan, status | Lapisan dinyalakan atau dimatikan |
| `view_mode_changed` | dari, ke | Ganti 2D / 3D |
| `quiz_answered` | scenario\_id, benar, waktu\_ms | Satu jawaban kuis dikirim |
| `quiz_completed` | quiz\_id, skor | Kuis selesai |
| `collection_saved` | item\_id, jenis | Item disimpan ke koleksi |
| `account_created` | jumlah pelajaran sebelum daftar | Akun dibuat |
| `quality_tier_assigned` | tier, fps rata-rata, kelas perangkat | Tingkat kualitas otomatis dipilih |
| `share_link_created` | tactic\_id, fase, pov | Tautan taktik dibuat |

## 17. Roadmap Rilis

Produk dirilis dalam 4 fase selama sekitar 12 bulan, dengan gerbang kelulusan di akhir tiap fase. Durasi bulan bersifat usulan dan perlu disesuaikan dengan ukuran tim.

&#91;embedded content: Roadmap · 4 fase, 3 gerbang kelulusan\]

Fase berikutnya baru dimulai setelah gerbang sebelumnya lolos; gerbang fase 0 memastikan animasi dan POV terbukti sebelum produksi konten besar-besaran.

### Usulan tim inti

- 1 Product Manager
- 1 Product Designer + 1 Motion Designer
- 3 Frontend Engineer (minimal 1 spesialis WebGL/3D)
- 1 Backend Engineer
- 1–2 penulis konten berlatar pelatih basket bersertifikat
- 1 QA (paruh waktu di fase 0)

### Beban produksi konten MVP

24 taktik × 5 lensa POV = 120 lensa POV, ditambah sekitar 94 pelajaran dan 120 istilah glosarium. Studio Konten (F-27) harus siap di awal fase 1 agar produksi konten bisa berjalan paralel dengan pengembangan.

## 18. Risiko, Asumsi & Pertanyaan Terbuka

Risiko terbesar ada dua: performa animasi di HP kelas bawah, dan kecepatan produksi 120 lensa POV untuk MVP. Keduanya diuji dan dimitigasi sejak fase 0.

### Risiko

| ID | Risiko | Dampak | Mitigasi |
| --- | --- | --- | --- |
| R1 | Animasi patah-patah di HP kelas bawah | Tinggi | Tingkat kualitas otomatis, renderer 2D WebGL, uji perangkat acuan sejak fase 0 |
| R2 | Produksi konten lambat (120 lensa POV) | Tinggi | Studio Konten dengan templat POV; draf awal dibantu AI lalu ditinjau pelatih |
| R3 | Akurasi taktik dipertanyakan pelatih | Tinggi | Setiap taktik ditinjau pelatih bersertifikat; tombol "laporkan kesalahan" di setiap halaman |
| R4 | Efek futuristik justru mengaburkan taktik | Sedang | Prinsip "cahaya = informasi", uji pemahaman A/B, mode kontras tinggi |
| R5 | Pusing saat memakai kamera POV 3D | Sedang | Aturan kamera (tanpa roll, FOV 75°, batas kecepatan sudut), opsi kembali ke kamera Taktis |
| R6 | Masalah lisensi font, pustaka, aset 3D, atau nama tim | Sedang | Font berlisensi terbuka, aset buatan sendiri, tanpa logo atau nama tim dan pemain nyata |
| R7 | Pengguna berhenti setelah Level 1 | Sedang | Rekomendasi per posisi, lencana POV, taktik baru secara berkala |
| R8 | Data pengguna di bawah umur | Tinggi | Persetujuan orang tua/wali, data seminimal mungkin, tanpa fitur sosial publik di v1 |

### Asumsi

- Pengguna mengakses lewat browser modern; 3D bersifat opsional.
- MVP gratis; model bisnis diputuskan sebelum fase 2.
- Aturan FIBA menjadi acuan utama konten.
- Tim punya akses ke pelatih basket bersertifikat sebagai peninjau konten.

### Pertanyaan terbuka

- [ ] Model bisnis: gratis sepenuhnya, freemium (taktik lanjutan berbayar), atau lisensi untuk sekolah dan klub?
- [ ] Nama dan identitas merek final pengganti "TAKTIKA"?
- [ ] Apakah basket 3x3 perlu modul tersendiri?
- [ ] Apakah ada konten atau ilustrasi khusus basket putri (misalnya ukuran bola 6)?
- [ ] Apakah perlu kemitraan konten dengan kompetisi pelajar atau klub lokal?
- [ ] Siapa peninjau konten (pelatih berlisensi PERBASI atau FIBA)?
- [ ] Batas usia minimal pengguna dan bentuk alur persetujuan orang tua.
- [ ] Narasi suara memakai rekaman manusia atau text-to-speech?
- [ ] Apakah aplikasi mobile native masuk roadmap setelah fase 3?

## 19. Lampiran: Glosarium & Notasi

Daftar ini adalah inti glosarium (41 istilah) yang menjadi dasar 120 istilah di MVP. Kolom Level menunjukkan di level mana istilah pertama kali diajarkan.

### Kode pemain

- **1–5 atau O1–O5:** pemain menyerang sesuai posisi (PG, SG, SF, PF, C).
- **X1–X5:** bek yang menjaga pemain bernomor sama.
- Notasi garis aksi mengikuti tabel di bagian 9.

### Glosarium inti

| Istilah | Arti singkat | Level |
| --- | --- | --- |
| Backdoor cut | Cut ke ring di belakang bek yang terlalu menolak umpan | 2 |
| Ball screen | Screen untuk pemain yang membawa bola | 2 |
| Baseline | Garis akhir di belakang ring | 1 |
| Blitz | Dua bek mengepung pembawa bola setelah screen | 2 |
| BLOB | Inbound dari baseline (*baseline out of bounds*) | 3 |
| Box out | Menghalangi lawan dengan badan untuk merebut rebound | 1 |
| Closeout | Bek berlari ke penembak lalu memendekkan langkah untuk menghadang tembakan | 1 |
| Corner | Sudut lapangan, pertemuan baseline dan sideline | 1 |
| Dribble handoff (DHO) | Menyerahkan bola langsung sambil berpapasan | 2 |
| Drop | Coverage PnR: bek big mundur ke paint | 2 |
| Elbow | Sudut pertemuan garis lemparan bebas dan sisi paint | 1 |
| Flare screen | Screen yang membuat pemain bergerak menjauhi bola | 2 |
| Hedge / Show | Bek big keluar sesaat menghadang pembawa bola | 2 |
| Help side | Sisi lapangan tanpa bola; juga disebut weak side | 1 |
| High post | Area sekitar garis lemparan bebas | 1 |
| Horns | Formasi dua big di kedua elbow | 3 |
| Ice / Blue | Coverage PnR di sisi lapangan: pembawa bola dipaksa ke baseline | 2 |
| Isolation (iso) | Satu lawan satu dengan rekan lain menjauh memberi ruang | 2 |
| Kick-out | Umpan keluar ke penembak setelah drive | 2 |
| Low block | Area di samping paint, dekat ring | 1 |
| Mismatch | Pasangan jaga yang timpang dalam ukuran atau kecepatan | 2 |
| Paint / Key | Area persegi di depan ring | 1 |
| Pick-and-pop | Setelah screen, screener keluar ke luar untuk menembak | 2 |
| Pick-and-roll | Setelah screen, screener bergerak ke ring | 2 |
| Pin-down | Screen ke arah baseline untuk pemain yang naik ke perimeter | 2 |
| Post up | Membelakangi ring di area post untuk menerima bola | 1 |
| Rim runner | Big yang berlari langsung ke ring saat roll atau transisi | 2 |
| Short roll | Roll yang berhenti di tengah area, lalu menjadi pengumpan | 2 |
| Skip pass | Umpan melewati sisi bola langsung ke sisi seberang | 1 |
| Slip | Screener lari ke ring sebelum kontak screen | 2 |
| Slot | Area di antara top of key dan wing | 1 |
| Spacing | Jarak dan sebaran pemain menyerang di lapangan | 2 |
| Stagger | Dua screen berurutan untuk satu pemain | 3 |
| Strong side | Sisi lapangan tempat bola berada; juga disebut ball side | 1 |
| Switch | Dua bek bertukar lawan jaga | 2 |
| Tag | Bek sisi lemah menahan roller sesaat | 2 |
| Top of key | Area di atas busur lemparan bebas | 1 |
| Transisi | Perpindahan dari bertahan ke menyerang, atau sebaliknya | 2 |
| Triple threat | Posisi siap menembak, mengumpan, atau dribble | 1 |
| Wing | Area samping lapangan di garis 3 poin | 1 |
| X-out | Rotasi bertahan bersilang setelah ada bek yang membantu | 2 |

### Rujukan konten

Angka dan aturan di Level 1 wajib diverifikasi ulang terhadap FIBA Official Basketball Rules edisi terbaru oleh peninjau konten sebelum terbit.
