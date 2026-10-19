"""
Generator konten taktik — alat penulis konten, bukan bagian aplikasi.

Enam taktik MVP sisanya ditulis di sini dalam bentuk Python yang padat, lalu
diterbitkan menjadi content/tactics/*.json. Alasannya praktis: anatomi halaman
taktik PRD §6 punya sepuluh bagian wajib yang strukturnya identik untuk setiap
taktik, jadi pembantu di bawah mencegah bagian yang terlupa.

Jalankan:  python scripts/gen-tactics.py
Lalu:      node scripts/format-tactics.mjs
Verifikasi: npx vitest run content
"""

import json
import pathlib

OUT = pathlib.Path("content/tactics")


# --------------------------------------------------------------------------- #
# Pembantu                                                                    #
# --------------------------------------------------------------------------- #

def txt(s, en=None):
    d = {"id": s}
    if en:
        d["en"] = en
    return d


def player(pid, team, start, role=None, guards=None, ball=False):
    p = {"id": pid, "team": team, "start": {"x": start[0], "y": start[1], "facing": start[2]}}
    if role:
        p["role"] = role
    if guards:
        p["guards"] = guards
    if ball:
        p["hasBall"] = True
    # Urutan field dirapikan agar JSON mudah dibaca.
    order = ["id", "team", "role", "guards", "start", "hasBall"]
    return {k: p[k] for k in order if k in p}


def phase(pid, title, t0, t1, narration, focus=None):
    d = {"id": pid, "title": txt(title), "tStart": t0, "tEnd": t1, "narration": txt(narration)}
    if focus:
        d["focus"] = focus
    return d


def mv(eid, t, dur, kind, actor, path=None, speed=None, target=None, label=None,
       made=None, wrong=None):
    e = {"id": eid, "t": t, "dur": dur, "type": kind, "actor": actor}
    if target:
        e["target"] = target
    if path:
        e["path"] = [[round(x, 3), round(y, 3)] for x, y in path]
    if speed:
        e["speed"] = speed
    if label:
        e["label"] = label
    if made is not None:
        e["made"] = made
    if wrong:
        e["wrong"] = True
    return e


def lens(pid, mission, steps, cues, decisions, mistakes, calls):
    """steps: [(phaseId, text)] · decisions: [(ifCue, thenDo, branchId|None)]"""
    return {
        "playerId": pid,
        "mission": txt(mission),
        "steps": [{"phaseId": p, "text": txt(s)} for p, s in steps],
        "cues": [txt(c) for c in cues],
        "decisions": [
            {"ifCue": txt(a), "thenDo": txt(b), **({"branchId": c} if c else {})}
            for a, b, c in decisions
        ],
        "mistakes": [txt(m) for m in mistakes],
        "calls": calls,
    }


def option(oid, label, branch, correct, when, explain, target=None):
    o = {
        "id": oid,
        "label": txt(label),
        "correct": correct,
        "explain": txt(explain),
    }
    if branch:
        o["branchId"] = branch
    if when:
        o["correctWhen"] = when
    if target:
        o["targetPlayer"] = target
    return o


def branch(bid, group, label, from_t, events, replaces=None, counter=None,
           outcome=None, trigger=None):
    b = {"id": bid, "group": group, "label": txt(label), "fromT": from_t,
         "replaces": replaces or [], "events": events}
    if trigger:
        b["trigger"] = trigger
    if counter:
        b["counter"] = txt(counter)
    if outcome:
        b["outcome"] = outcome
    return b


def mistake(mid, title, why, bid=None):
    d = {"id": mid, "title": txt(title), "why": txt(why)}
    if bid:
        d["branchId"] = bid
    return d


def counter(cid, defense, response, bid=None):
    d = {"id": cid, "defense": txt(defense), "response": txt(response)}
    if bid:
        d["branchId"] = bid
    return d


def scenario(sid, prompt, pause_at, decision_id, setup=None, answer="tap-player"):
    return {
        "id": sid,
        "prompt": txt(prompt),
        "pauseAt": pause_at,
        "setupBranches": setup or [],
        "answerType": answer,
        "decisionId": decision_id,
    }


def tactic(**kw):
    """Susun dokumen taktik lengkap dengan urutan field yang konsisten."""
    base = {
        "id": kw["id"],
        "slug": kw["slug"],
        "title": txt(kw["title"], kw.get("title_en")),
        "category": kw["category"],
        "level": kw["level"],
        "court": kw.get("court", "half"),
        "duration": kw["duration"],
        "release": "mvp",
        "status": "published",
        "version": 1,
        "summary": txt(kw["summary"]),
        "whenToUse": txt(kw["whenToUse"]),
        "players": kw["players"],
        "phases": kw["phases"],
        "events": kw["events"],
        "decisions": kw.get("decisions", []),
        "branches": kw.get("branches", []),
        "povLenses": kw["povLenses"],
        "mistakes": kw.get("mistakes", []),
        "counters": kw.get("counters", []),
        "scenarios": kw.get("scenarios", []),
        "related": kw.get("related", {"prerequisites": [], "nextUp": []}),
        "terms": kw.get("terms", []),
    }
    if kw.get("origin"):
        base["origin"] = txt(kw["origin"])
    return base


def write(doc):
    path = OUT / f"{doc['id']}.json"
    path.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"tulis {path.name}")


# =========================================================================== #
# 3. 5-Out Motion — A. Sistem menyerang                                       #
# =========================================================================== #

five_out = tactic(
    id="off-5-out-motion",
    slug="5-out-motion",
    title="5-Out Motion",
    title_en="5-Out Motion",
    category="offense",
    level=2,
    duration=7.0,
    summary="Lima pemain di luar garis 3 poin menjalankan satu prinsip berulang: umpan, cut, lalu isi ulang spot yang ditinggalkan.",
    whenToUse="Serangan dasar untuk tim tanpa big dominan, atau saat ingin memaksa setiap bek menjaga satu lawan satu tanpa bantuan.",
    origin="Bentuk lima pemain di luar garis menjadi populer bersamaan dengan naiknya volume tembakan 3 poin, karena paint yang kosong membuat setiap cut jadi ancaman.",
    players=[
        player("O1", "offense", (0.0, 8.4, 0), "PG", ball=True),
        player("O2", "offense", (5.4, 4.8, 0), "SG"),
        player("O3", "offense", (6.6, 0.6, 0), "SF"),
        player("O4", "offense", (-6.6, 0.6, 0), "PF"),
        player("O5", "offense", (-5.4, 4.8, 0), "C"),
        player("X1", "defense", (0.0, 7.2, 180), guards="O1"),
        player("X2", "defense", (4.6, 4.2, 180), guards="O2"),
        player("X3", "defense", (5.8, 1.4, 180), guards="O3"),
        player("X4", "defense", (-5.8, 1.4, 180), guards="O4"),
        player("X5", "defense", (-4.6, 4.2, 180), guards="O5"),
    ],
    phases=[
        phase("p1", "Umpan & cut", 0.0, 1.8,
              "1 mengumpan ke wing lalu LANGSUNG cut ke ring. Umpan tanpa cut membuat serangan berhenti.",
              ["O1", "O2"]),
        phase("p2", "Isi ulang spot", 1.8, 3.2,
              "5 naik mengisi top yang ditinggalkan 1, dan 1 melanjutkan ke sudut kiri. Setiap spot yang kosong harus terisi.",
              ["O5", "O1", "O4"]),
        phase("p3", "Baca deny", 3.2, 4.6,
              "2 mengumpan ke top lalu cut. 1 mencoba naik dari sudut, tetapi X1 menolak umpan satu langkah di depannya.",
              ["O1", "X1"]),
        phase("p4", "Backdoor", 4.6, 5.8,
              "Karena X1 terlalu menolak umpan, 1 memotong ke ring di belakangnya. Waktu melambat untuk membaca.",
              ["O1", "O5"]),
        phase("p5", "Hasil", 5.8, 7.0,
              "Bounce pass ke backdoor cut menghasilkan layup tanpa bek di jalur.",
              ["O1"]),
    ],
    events=[
        mv("e-pass-wing", 0.3, 0.4, "pass", "O1", target="O2", label="Umpan ke wing"),
        mv("e-o1-cut", 0.8, 1.2, "cut", "O1",
           [(0.0, 8.4), (0.9, 5.8), (0.6, 3.0)], "sprint", label="Basket cut"),
        mv("e-x1-chase", 0.9, 1.2, "rotate", "X1",
           [(0.0, 7.2), (1.4, 5.2), (1.3, 2.9)], "sprint"),
        mv("e-o5-lift", 1.0, 1.5, "move", "O5",
           [(-5.4, 4.8), (-3.4, 6.8), (-0.7, 8.2)], "jog", label="Isi top"),
        mv("e-x5-lift", 1.2, 1.5, "rotate", "X5",
           [(-4.6, 4.2), (-2.8, 6.0), (-0.6, 7.1)], "sprint"),
        mv("e-o1-fill", 2.1, 1.5, "move", "O1",
           [(0.6, 3.0), (-2.6, 1.4), (-5.0, 0.9), (-6.4, 0.8)], "sprint",
           label="Isi sudut kiri"),
        mv("e-x1-follow", 2.3, 1.5, "rotate", "X1",
           [(1.3, 2.9), (-1.6, 2.0), (-4.2, 1.5), (-5.6, 1.4)], "sprint"),
        mv("e-o4-lift", 2.3, 1.3, "move", "O4",
           [(-6.6, 0.6), (-6.3, 2.6), (-5.6, 4.6)], "jog", label="Isi wing kiri"),
        mv("e-x4-lift", 2.5, 1.3, "rotate", "X4",
           [(-5.8, 1.4), (-5.4, 3.0), (-4.8, 4.4)], "slide"),

        mv("e-pass-top", 3.4, 0.45, "pass", "O2", target="O5", label="Umpan ke top"),
        mv("e-o2-cut", 3.9, 1.1, "cut", "O2",
           [(5.4, 4.8), (3.6, 3.2), (2.0, 2.0)], "sprint", label="Basket cut"),
        mv("e-x2-chase", 4.0, 1.1, "rotate", "X2",
           [(4.6, 4.2), (3.0, 2.6), (1.5, 1.6)], "sprint"),
        mv("e-o1-lift-try", 3.6, 0.8, "move", "O1",
           [(-6.4, 0.8), (-6.3, 2.0)], "jog", label="Coba naik"),
        mv("e-x1-deny", 3.7, 0.9, "rotate", "X1",
           [(-5.6, 1.4), (-5.8, 2.4), (-5.9, 3.2)], "slide", label="Deny satu langkah"),

        mv("e-o1-backdoor", 4.6, 1.1, "cut", "O1",
           [(-6.3, 2.0), (-5.0, 1.3), (-3.0, 1.0), (-1.2, 1.1)], "sprint",
           label="Backdoor cut"),
        mv("e-x1-overplay", 4.5, 0.9, "rotate", "X1",
           [(-5.9, 3.2), (-6.1, 4.2), (-6.2, 5.0)], "slide",
           label="X1 terlalu naik"),

        mv("e-bounce", 5.4, 0.4, "pass", "O5", target="O1", label="Bounce pass"),
        mv("e-layup", 6.0, 0.95, "shot", "O1", target="rim", made=True, label="Layup"),
    ],
    decisions=[{
        "id": "d1", "t": 5.1, "owner": "O5",
        "cue": txt("Seberapa jauh X1 menolak umpan? Bek yang berdiri di jalur umpan selalu membuka jalur ke ring di belakangnya."),
        "options": [
            option("o-backdoor", "Bounce pass backdoor ke 1", "b-out-backdoor", True,
                   "X1 menolak umpan satu langkah di depan",
                   "X1 berdiri di jalur umpan, jadi punggungnya menghadap ring. Bounce pass rendah ke belakangnya menghasilkan layup tanpa bek.",
                   "O1"),
            option("o-wing", "Umpan ke 4 di wing kiri", "b-out-wing", False, None,
                   "Aman, tetapi tidak menghukum apa pun. Deny X1 justru hadiah yang harus langsung diambil.",
                   "O4"),
            option("o-drive", "Drive sendiri ke paint", "b-out-drive", False,
                   "Tidak ada help di paint",
                   "Paint memang kosong, tetapi X5 masih menempel. Backdoor memberi layup tanpa kontak — jelas lebih baik."),
            option("o-corner", "Umpan ke 3 di sudut kanan", None, False, None,
                   "Umpan melintasi lapangan di depan empat bek. Ini jenis umpan yang paling sering dipotong.",
                   "O3"),
        ],
    }],
    branches=[
        branch("b-out-backdoor", "outcome", "Bounce pass backdoor", 5.2,
               [mv("bob-pass", 5.4, 0.4, "pass", "O5", target="O1", label="Bounce pass"),
                mv("bob-shot", 6.0, 0.95, "shot", "O1", target="rim", made=True, label="Layup")],
               outcome="score",
               counter="Lawan harus memilih: menolak umpan dan memberi backdoor, atau membiarkan umpan dan memberi tembakan."),
        branch("b-out-wing", "outcome", "Umpan aman ke wing", 5.2,
               [mv("bow-pass", 5.4, 0.5, "pass", "O5", target="O4", label="Umpan pengaman"),
                mv("bow-reset", 6.1, 0.8, "dribble", "O4",
                   [(-5.6, 4.6), (-5.0, 5.8), (-4.2, 6.6)], "jog", label="Serangan di-reset")],
               replaces=["e-bounce", "e-layup"], outcome="reset"),
        branch("b-out-drive", "outcome", "Drive sendiri", 5.2,
               [mv("bod-drive", 5.3, 1.1, "dribble", "O5",
                   [(-0.7, 8.2), (-0.9, 6.0), (-1.0, 4.0)], "sprint", label="Drive ke paint"),
                mv("bod-shot", 6.4, 0.6, "shot", "O5", target="rim", made=False,
                   label="Tembakan di-contest")],
               replaces=["e-bounce", "e-layup"], outcome="contested"),
        branch("b-mistake-no-replace", "mistake", "Salah: spot tidak diisi", 1.8,
               [mv("bmn-o5-stay", 1.8, 1.4, "move", "O5",
                   [(-5.4, 4.8), (-5.5, 4.6), (-5.6, 4.4)], "walk", wrong=True,
                   label="5 tidak mengisi top"),
                mv("bmn-x5-help", 2.6, 1.2, "rotate", "X5",
                   [(-4.6, 4.2), (-3.6, 3.2), (-2.6, 2.4)], "slide",
                   label="X5 bebas membantu di paint")],
               replaces=["e-o5-lift", "e-x5-lift", "e-o4-lift", "e-x4-lift",
                         "e-o1-fill", "e-x1-follow", "e-o1-lift-try", "e-x1-deny",
                         "e-o1-backdoor", "e-x1-overplay", "e-pass-top", "e-o2-cut",
                         "e-x2-chase", "e-bounce", "e-layup"],
               outcome="reset"),
        branch("b-mistake-cut-no-purpose", "mistake", "Salah: cut tanpa membaca bek", 0.8,
               [mv("bmc-o1-slow", 0.8, 1.6, "cut", "O1",
                   [(0.0, 8.4), (0.4, 6.4), (0.6, 4.4)], "jog", wrong=True,
                   label="Cut lambat, bek tinggal mengikuti")],
               replaces=["e-o1-cut", "e-o1-fill", "e-x1-follow", "e-o1-lift-try",
                         "e-o1-backdoor", "e-x1-overplay", "e-bounce", "e-layup"],
               outcome="reset"),
    ],
    povLenses=[
        lens("O1", "Umpan, lalu cut keras ke ring — dan baca bek yang menolak umpanmu.",
             [("p1", "Umpan ke wing, lalu langsung cut. Jangan berdiri melihat hasil umpanmu."),
              ("p2", "Lanjutkan ke sudut kiri untuk mengisi spot yang kosong."),
              ("p3", "Coba naik dari sudut. Rasakan apakah bek berdiri di jalur umpan."),
              ("p4", "Bila bek menolak umpan, potong ke ring di belakangnya."),
              ("p5", "Tangan siap rendah — bounce pass akan datang di bawah tangan bek.")],
             ["Apakah X1 berdiri di jalur umpan atau di antara kamu dan ring?",
              "Apakah paint kosong? 5-out membuat backdoor hampir selalu tersedia."],
             [("X1 menolak umpan satu langkah", "Backdoor cut ke ring", "b-out-backdoor"),
              ("X1 mundur ke dalam", "Naik terima umpan dan tembak", None)],
             ["Mengumpan lalu berdiri diam — ini yang membuat motion berhenti.",
              "Cut dengan kecepatan jogging; bek tinggal mengikuti.",
              "Tidak mengisi spot yang kosong, sehingga spacing rusak."],
             ["Cut!", "Fill!", "Back!"]),
        lens("O2", "Terima umpan di wing, baca bek, lalu teruskan bola dan cut.",
             [("p1", "V-cut singkat untuk membuka ruang, lalu terima umpan dengan kaki siap."),
              ("p2", "Lihat bola dan lihat cutter — jangan sampai menabrak jalur 1."),
              ("p3", "Umpan ke top, lalu langsung cut ke ring."),
              ("p4", "Isi sudut kanan setelah cut selesai."),
              ("p5", "Siap rebound menyerang bila tembakan gagal.")],
             ["Apakah X2 melihat bola dan melupakan kamu?",
              "Apakah ada spot yang kosong setelah cut 1?"],
             [("X2 melihat bola", "Cut di belakangnya", None),
              ("X2 menempel rapat", "Umpan ke top lalu screen away", None)],
             ["Menahan bola lebih dari 0,5 detik dan membiarkan help pulih.",
              "Cut ke spot yang sudah ditempati rekan.",
              "Menerima umpan dengan kaki belum siap."],
             ["Ball!", "Cut!"]),
        lens("O3", "Jaga sudut kanan, lalu naik mengisi wing saat spot di atasmu kosong.",
             [("p1", "Tetap di sudut. Ancaman tembakanmu menahan X3 di luar."),
              ("p2", "Perhatikan siapa yang pergi — kamu mungkin perlu mengisi."),
              ("p3", "Naik ke wing kanan setelah 2 cut."),
              ("p4", "Kaki siap: umpan bisa datang dari top kapan saja."),
              ("p5", "Siap kick-out bila drive terjadi.")],
             ["Apakah wing di atasmu kosong?", "Apakah X3 masuk membantu ke paint?"],
             [("Wing kosong", "Naik mengisi wing", None),
              ("X3 masuk membantu", "Tetap di sudut, siap tangkap-tembak", None)],
             ["Naik terlalu cepat sehingga dua pemain berada di satu spot.",
              "Berdiri di dalam garis 3 poin.",
              "Tidak melihat bola saat mengisi spot."],
             ["Corner!", "Fill!"]),
        lens("O4", "Jaga sudut kiri, lalu naik ke wing saat 1 mengisi sudutmu.",
             [("p1", "Tetap di sudut kiri, di luar garis."),
              ("p2", "1 datang ke sudutmu — naik ke wing kiri, jangan menunggu."),
              ("p3", "Kaki siap di wing; kamu sekarang ventil pengaman."),
              ("p4", "Perhatikan apakah X4 ikut naik atau tetap membantu."),
              ("p5", "Siap jadi opsi umpan bila backdoor tertutup.")],
             ["Apakah 1 sedang menuju sudutmu?", "Apakah X4 ikut naik bersamamu?"],
             [("1 mengisi sudut", "Naik ke wing kiri", None),
              ("Semua opsi tertutup", "Jadi ventil pengaman", "b-out-wing")],
             ["Tetap di sudut saat rekan datang — dua pemain di satu spot.",
              "Naik dengan punggung ke bola sehingga tidak bisa menerima umpan.",
              "Terlambat naik sehingga spacing rapat untuk beberapa detik."],
             ["Fill!", "Here!"]),
        lens("O5", "Isi top sebagai pengatur kedua, lalu kirim bola ke backdoor.",
             [("p1", "Tunggu di wing kiri. Jangan ikut masuk ke jalur cut 1."),
              ("p2", "Naik mengisi top segera setelah 1 pergi."),
              ("p3", "Terima umpan di top dengan kaki menghadap ring."),
              ("p4", "Lihat X1. Deny satu langkah berarti backdoor terbuka."),
              ("p5", "Bounce pass rendah ke belakang bek, bukan lob di atas tangannya.")],
             ["Posisi X1 relatif 1: di jalur umpan atau di jalur ring?",
              "Apakah paint benar-benar kosong untuk layup?"],
             [("X1 deny", "Bounce pass backdoor", "b-out-backdoor"),
              ("Semua di-deny", "Umpan ke wing dan reset", "b-out-wing")],
             ["Mengumpan setinggi dada ke backdoor — mudah dipotong.",
              "Menahan bola sampai cut selesai dan peluang hilang.",
              "Drive sendiri padahal ada layup tanpa kontak untuk rekan."],
             ["Top!", "Back!", "Here!"]),
    ],
    mistakes=[
        mistake("m1", "Spot kosong tidak diisi",
                "Satu spot kosong di perimeter berarti satu bek bebas membantu. Prinsip 5-out hanya bekerja bila lima spot selalu terisi.",
                "b-mistake-no-replace"),
        mistake("m2", "Umpan lalu berdiri diam",
                "Mengumpan tanpa cut membuat pertahanan punya waktu menyusun ulang. Dalam motion, umpan dan cut adalah satu gerakan."),
        mistake("m3", "Cut tanpa membaca bek",
                "Cut dengan kecepatan jogging hanya memindahkan bek. Cut harus keras dan dipilih dari posisi bek, bukan dari hafalan.",
                "b-mistake-cut-no-purpose"),
        mistake("m4", "Dua pemain mengisi satu spot",
                "Spacing rapat membuat satu bek menjaga dua orang, dan jalur umpan jadi mudah dipotong."),
    ],
    counters=[
        counter("c1", "Bek menolak setiap umpan satu langkah di depan penerima (deny).",
                "Backdoor cut. Deny yang agresif selalu meninggalkan jalur ke ring di belakang bek.",
                "b-out-backdoor"),
        counter("c2", "Bek big mundur jauh ke paint untuk melindungi ring.",
                "Tembakan dari perimeter terbuka; serang closeout-nya setelah itu."),
        counter("c3", "Pertahanan switch setiap cut dan screen.",
                "Cari mismatch lalu serang satu lawan satu; paint kosong karena 5-out."),
    ],
    scenarios=[
        scenario("s1", "X1 menolak umpan satu langkah di depan 1. Apa yang harus dilakukan 5 di top?", 5.1, "d1"),
        scenario("s2", "Spot top dibiarkan kosong sehingga X5 bebas membantu. Opsi mana yang masih tersisa?", 5.1, "d1", ["b-mistake-no-replace"]),
        scenario("s3", "Semua jalur umpan tertutup dan shot clock masih panjang. Pilihan paling aman?", 5.1, "d1", ["b-out-wing"]),
    ],
    related={"prerequisites": [], "nextUp": ["off-spread-pnr", "set-horns"]},
    terms=["spacing", "backdoor-cut", "help-side", "strong-side", "kick-out", "corner", "wing", "top-of-key"],
)

# =========================================================================== #
# 4. Horns (dasar) — B. Set play                                              #
# =========================================================================== #

horns = tactic(
    id="set-horns",
    slug="horns",
    title="Horns",
    title_en="Horns",
    category="set-play",
    level=2,
    duration=6.4,
    summary="Dua big berdiri di kedua elbow dan dua wing di sudut; PG memilih sisi mana yang akan dipakai untuk pick-and-roll.",
    whenToUse="Set pembuka yang fleksibel: satu formasi menghasilkan banyak aksi, dan pertahanan harus menunggu sampai PG memilih sisi.",
    origin="Nama Horns berasal dari bentuk formasinya di papan taktik — dua big di elbow terlihat seperti sepasang tanduk.",
    players=[
        player("O1", "offense", (0.0, 8.6, 0), "PG", ball=True),
        player("O2", "offense", (6.6, 0.6, 0), "SG"),
        player("O3", "offense", (-6.6, 0.6, 0), "SF"),
        player("O4", "offense", (-2.45, 4.3, 90), "PF"),
        player("O5", "offense", (2.45, 4.3, 270), "C"),
        player("X1", "defense", (0.0, 7.4, 180), guards="O1"),
        player("X2", "defense", (5.8, 1.4, 180), guards="O2"),
        player("X3", "defense", (-5.8, 1.4, 180), guards="O3"),
        player("X4", "defense", (-2.2, 3.3, 180), guards="O4"),
        player("X5", "defense", (2.2, 3.3, 180), guards="O5"),
    ],
    phases=[
        phase("p1", "Formasi Horns", 0.0, 1.4,
              "Dua big di elbow, dua penembak di sudut, paint kosong. Pertahanan belum tahu sisi mana yang akan dipakai.",
              ["O1", "O4", "O5"]),
        phase("p2", "Pilih sisi", 1.4, 2.6,
              "1 memilih sisi kanan. 5 naik memasang screen; 4 tetap di elbow sebagai ancaman kedua.",
              ["O1", "O5"]),
        phase("p3", "Roll + pop", 2.6, 4.0,
              "5 roll ke ring, dan tepat bersamaan 4 pop ke top. Dua ancaman dari dua arah berlawanan.",
              ["O5", "O4"]),
        phase("p4", "Keputusan", 4.0, 5.2,
              "Waktu melambat. 1 membaca: lob ke roller, umpan ke big yang pop, kick ke sudut, atau pull-up.",
              ["O1"]),
        phase("p5", "Hasil", 5.2, 6.4,
              "X4 ikut turun menahan roller, jadi 4 bebas menembak dari top.",
              ["O4"]),
    ],
    events=[
        mv("e-o1-setup", 0.0, 1.4, "dribble", "O1",
           [(0.0, 8.6), (-0.9, 8.8), (0.2, 8.9)], "jog", label="Baca pertahanan"),
        mv("e-x1-mirror", 0.1, 1.3, "rotate", "X1",
           [(0.0, 7.4), (-0.8, 7.6), (0.1, 7.7)], "slide"),
        mv("e-o5-up", 1.1, 1.0, "move", "O5",
           [(2.45, 4.3), (1.8, 6.4), (1.2, 8.2)], "jog", label="Naik ke screen"),
        mv("e-x5-follow", 1.2, 1.0, "rotate", "X5",
           [(2.2, 3.3), (1.9, 5.5), (1.6, 7.3)], "sprint"),

        mv("e-o5-screen", 2.0, 0.6, "screen", "O5", [(1.2, 8.2), (1.1, 8.15)],
           target="X1", label="Ball screen"),
        mv("e-o1-use", 2.0, 1.0, "dribble", "O1",
           [(0.2, 8.9), (1.7, 8.5), (2.9, 7.7), (3.7, 6.7)], "jog", label="Pakai screen"),
        mv("e-x1-chase", 2.05, 1.0, "rotate", "X1",
           [(0.1, 7.7), (1.5, 8.9), (3.0, 8.3), (3.8, 7.4)], "sprint",
           label="Kejar lewat atas"),
        mv("e-x5-drop", 2.3, 1.2, "rotate", "X5",
           [(1.6, 7.3), (1.9, 6.0), (2.1, 4.7)], "slide", label="Drop"),

        mv("e-o5-roll", 2.9, 1.2, "cut", "O5",
           [(1.1, 8.15), (0.8, 6.0), (0.5, 3.6), (0.4, 1.6)], "sprint", label="Roll ke ring"),
        mv("e-o4-pop", 3.0, 1.1, "move", "O4",
           [(-2.45, 4.3), (-1.7, 6.4), (-1.0, 8.1)], "jog", label="Pop ke top"),
        mv("e-x4-tag", 3.3, 1.0, "rotate", "X4",
           [(-2.2, 3.3), (-1.4, 3.0), (-0.6, 2.8)], "sprint", label="Tag roller"),

        mv("e-pass-o4", 4.4, 0.55, "pass", "O1", target="O4", label="Umpan ke top"),
        mv("e-o4-shot", 5.2, 1.1, "shot", "O4", target="rim", made=True, label="Trailer 3"),
    ],
    decisions=[{
        "id": "d1", "t": 4.2, "owner": "O1",
        "cue": txt("Dua big menyerang dua arah berlawanan. Bek mana yang meninggalkan posisinya?"),
        "options": [
            option("o-pop", "Umpan ke 4 yang pop ke top", "b-out-pop", True,
                   "X4 turun menahan roller",
                   "X4 memilih menahan roller, jadi 4 bebas di top. Inilah inti Horns: satu bek tidak bisa menjaga dua big yang bergerak berlawanan arah.",
                   "O4"),
            option("o-lob", "Lob ke 5 yang roll", "b-out-lob", False,
                   "X5 terlambat dan X4 tidak tag",
                   "X5 sudah drop ke jalur roll dan X4 juga ikut tag. Dua bek di satu jalur — lob akan di-contest.",
                   "O5"),
            option("o-corner", "Kick ke 2 di sudut kanan", None, False, None,
                   "X2 masih menempel 2 dan tidak ikut membantu. Umpan ini tidak menghukum apa pun.",
                   "O2"),
            option("o-pullup", "Pull-up dari wing", "b-out-pullup", False,
                   "X5 drop sangat dalam",
                   "Tembakan 2 poin jarak menengah sambil ada penembak 3 poin bebas di top adalah pilihan paling tidak efisien."),
        ],
    }],
    branches=[
        branch("b-out-pop", "outcome", "Umpan ke big yang pop", 4.3,
               [mv("bop-pass", 4.4, 0.55, "pass", "O1", target="O4", label="Umpan ke top"),
                mv("bop-shot", 5.2, 1.1, "shot", "O4", target="rim", made=True, label="Trailer 3")],
               outcome="score",
               counter="Pertahanan harus memilih antara roller dan big yang pop — Horns memaksa pilihan itu setiap possession."),
        branch("b-out-lob", "outcome", "Lob ke roller", 4.3,
               [mv("bol-pass", 4.4, 0.5, "pass", "O1", target="O5", label="Lob"),
                mv("bol-shot", 5.1, 1.0, "shot", "O5", target="rim", made=False,
                   label="Di-contest dua bek")],
               replaces=["e-pass-o4", "e-o4-shot"], outcome="contested"),
        branch("b-out-pullup", "outcome", "Pull-up dari wing", 4.3,
               [mv("bou-shot", 4.4, 1.1, "shot", "O1", target="rim", made=False,
                   label="Pull-up 2 poin")],
               replaces=["e-pass-o4", "e-o4-shot"], outcome="contested"),
        branch("b-cov-switch", "coverage", "Switch", 2.3,
               [mv("bcs-x5-switch", 2.3, 1.0, "rotate", "X5",
                   [(1.6, 7.3), (2.8, 7.5), (3.9, 7.5)], "slide", label="X5 ambil handler"),
                mv("bcs-x1-screener", 2.3, 1.1, "rotate", "X1",
                   [(0.1, 7.7), (0.7, 8.8), (1.4, 9.5)], "sprint", label="X1 ambil screener"),
                mv("bcs-o5-seal", 3.0, 1.4, "cut", "O5",
                   [(1.1, 8.15), (1.0, 6.0), (0.9, 3.6), (0.8, 1.6)], "jog",
                   label="Seal bek kecil"),
                mv("bcs-pass", 4.4, 0.5, "pass", "O1", target="O5", label="Entry ke mismatch"),
                mv("bcs-shot", 5.1, 1.0, "shot", "O5", target="rim", made=True,
                   label="Finish atas bek kecil")],
               replaces=["e-x5-drop", "e-x1-chase", "e-o5-roll", "e-x4-tag",
                         "e-pass-o4", "e-o4-shot"],
               trigger={"coverage": "switch"}, outcome="good-look",
               counter="Switch di Horns langsung menciptakan mismatch ukuran di paint yang kosong."),
        branch("b-mistake-both-roll", "mistake", "Salah: kedua big masuk paint", 2.9,
               [mv("bmb-o4-dive", 2.9, 1.3, "cut", "O4",
                   [(-2.45, 4.3), (-1.6, 3.0), (-0.9, 1.8)], "jog", wrong=True,
                   label="4 ikut masuk paint"),
                mv("bmb-x4-stay", 3.2, 1.0, "rotate", "X4",
                   [(-2.2, 3.3), (-1.8, 2.4), (-1.6, 1.6)], "slide",
                   label="Satu bek menjaga dua big")],
               replaces=["e-o4-pop", "e-x4-tag", "e-pass-o4", "e-o4-shot"],
               outcome="turnover"),
    ],
    povLenses=[
        lens("O1", "Pilih sisi, pakai screen, lalu hukum bek yang meninggalkan big kedua.",
             [("p1", "Dribble pelan di top. Jangan memilih sisi terlalu cepat — biarkan pertahanan menunggu."),
              ("p2", "Pilih sisi kanan dan lewat rapat ke pinggul 5."),
              ("p3", "Serang dua langkah ke dalam agar X4 terpaksa memutuskan."),
              ("p4", "Lihat X4: ikut turun ke roller, atau tetap di 4?"),
              ("p5", "Umpan ke tangan 4 — ia harus bisa langsung tembak.")],
             ["Apa yang dilakukan X5 setelah screen?",
              "Apakah X4 turun menahan roller dan meninggalkan 4?"],
             [("X4 tag roller", "Umpan ke 4 di top", "b-out-pop"),
              ("X5 terlambat dan X4 tetap", "Lob ke roller", "b-out-lob"),
              ("Switch", "Entry pass ke mismatch di paint", "b-cov-switch")],
             ["Memilih sisi terlalu cepat sehingga pertahanan siap lebih dulu.",
              "Menyerang sebelum screen terpasang.",
              "Mengambil pull-up padahal ada penembak bebas."],
             ["Horns!", "Kanan!", "Pop!"]),
        lens("O5", "Pasang screen legal di sisi yang dipilih, lalu roll keras ke ring.",
             [("p1", "Tunggu di elbow kanan. Posisi kamu sendiri sudah menahan X5 di dalam."),
              ("p2", "Naik ke titik screen dengan sudut yang membuka arah drive 1."),
              ("p3", "Roll keras ke ring. Tangan siap jadi target."),
              ("p4", "Bila di-switch, seal bek kecil dengan badan."),
              ("p5", "Rebound menyerang bila bola tidak datang.")],
             ["Posisi X5 setelah screen: drop, hedge, atau switch?",
              "Apakah bek sisi lemah turun menahan jalur roll?"],
             [("Drop", "Roll keras; paksa X5 memilih antara kamu dan handler", None),
              ("Switch", "Seal bek kecil di paint", "b-cov-switch")],
             ["Moving screen saat kontak.",
              "Roll sebelum handler melewati screen.",
              "Berdiri di paint lebih dari 3 detik sebelum naik ke screen."],
             ["Screen!", "Roll!"]),
        lens("O4", "Tetap di elbow sebagai ancaman kedua, lalu pop ke top saat 5 roll.",
             [("p1", "Berdiri di elbow kiri. Keberadaanmu di sini menahan X4 jauh dari paint."),
              ("p2", "Jangan bergerak saat 1 memilih sisi — nilai kamu adalah ancaman yang menunggu."),
              ("p3", "Tepat saat 5 mulai roll, pop ke top dengan kaki siap tembak."),
              ("p4", "Perhatikan X4: bila ia turun ke roller, kamu resmi bebas."),
              ("p5", "Tangkap-tembak tanpa langkah tambahan.")],
             ["Apakah X4 turun menahan roller?",
              "Apakah 1 sudah punya sudut umpan ke top?"],
             [("X4 tag roller", "Pop dan tangkap-tembak dari top", "b-out-pop"),
              ("X4 tetap menempel", "Tetap di elbow sebagai ventil, lalu DHO", None)],
             ["Ikut masuk paint bersama 5 — satu bek jadi bisa menjaga dua big.",
              "Pop terlambat sehingga sudut umpan sudah tertutup.",
              "Pop sambil melayang, bukan dengan kaki siap."],
             ["Pop!", "Top!"]),
        lens("O2", "Jaga sudut kanan sisi bola agar X2 tidak bisa membantu dengan murah.",
             [("p1", "Tetap di sudut kanan, kaki di luar garis."),
              ("p2", "1 datang ke sisimu — jangan bergerak masuk."),
              ("p3", "Perhatikan apakah X2 melihat ke dalam."),
              ("p4", "Bila X2 membantu, siapkan kaki untuk tangkap-tembak."),
              ("p5", "Siap kick-out bila drive terjadi.")],
             ["Apakah kepala X2 berpaling ke bola?"],
             [("X2 membantu ke dalam", "Tetap di sudut, siap tangkap-tembak", None),
              ("X2 berpaling", "Cut baseline ke ring", None)],
             ["Melayang ke short corner dan menutup ruang roll.",
              "Berdiri di dalam garis 3 poin."],
             ["Corner!"]),
        lens("O3", "Jaga sudut kiri sisi lemah sebagai hukuman bagi setiap rotasi.",
             [("p1", "Tetap di sudut kiri, di luar garis."),
              ("p2", "Lihat bola dengan kepala, bukan dengan kaki."),
              ("p3", "Perhatikan X3: apakah ia melangkah menahan roller?"),
              ("p4", "Bila X3 rotasi, kamu jadi opsi skip pass."),
              ("p5", "Siap rebound sisi lemah.")],
             ["Apakah X3 ikut rotasi ke dalam?"],
             [("X3 rotasi", "Siap menerima skip pass", None),
              ("X3 tetap", "Tetap lebar; ancamanmu menahan satu bek", None)],
             ["Melayang ke dalam sehingga X3 bisa menjaga dua orang.",
              "Tidak siap kaki saat skip pass datang."],
             ["Weak!"]),
    ],
    mistakes=[
        mistake("m1", "Kedua big masuk ke paint",
                "Horns bekerja karena dua big bergerak ke arah BERLAWANAN. Bila keduanya masuk paint, satu bek cukup untuk menjaga keduanya dan paint jadi penuh.",
                "b-mistake-both-roll"),
        mistake("m2", "PG memilih sisi terlalu cepat",
                "Nilai Horns ada pada ketidakpastian. Memilih sisi sejak awal memberi pertahanan waktu untuk bersiap."),
        mistake("m3", "Big yang pop berhenti di dalam garis 3 poin",
                "Pop ke dalam garis mengubah tembakan 3 poin terbuka menjadi tembakan 2 poin jarak menengah."),
        mistake("m4", "Screen dipasang tanpa sudut",
                "Screen harus menghadap arah yang ingin dituju handler. Screen tanpa sudut hanya memperlambat kedua pemain."),
    ],
    counters=[
        counter("c1", "Switch pada ball screen.",
                "Mismatch langsung muncul di paint yang kosong — seal dan entry pass.",
                "b-cov-switch"),
        counter("c2", "Kedua bek big tetap di dalam dan tidak mengikuti pop.",
                "Big yang pop bebas menembak 3 poin dari top setiap possession.",
                "b-out-pop"),
        counter("c3", "Blitz pada handler segera setelah screen.",
                "Umpan ke big yang pop; ia jadi pengumpan dengan keunggulan jumlah di belakang trap."),
    ],
    scenarios=[
        scenario("s1", "X4 turun menahan roller. Ke mana bola harus pergi?", 4.2, "d1"),
        scenario("s2", "X5 dan X1 melakukan switch. Siapa yang punya keunggulan sekarang?", 4.0, "d1", ["b-cov-switch"]),
        scenario("s3", "Kedua big masuk paint bersamaan. Apa akibatnya?", 4.2, "d1", ["b-mistake-both-roll"]),
    ],
    related={"prerequisites": ["off-spread-pnr"], "nextUp": ["set-spain-pnr"]},
    terms=["horns", "elbow", "pick-and-roll", "pick-and-pop", "switch", "mismatch",
           "tag", "kick-out", "corner", "top-of-key"],
)

write(five_out)
write(horns)
print("selesai")
