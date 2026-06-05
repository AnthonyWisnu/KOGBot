# AGENT.md - KOGBot WhatsApp Bot

## 1. Project Overview

KOGBot adalah project bot WhatsApp berbasis Node.js untuk grup pribadi kecil. Nama bot runtime saat ini adalah MinjiBot. Bot ini dipakai untuk hiburan grup, terutama game chat, sistem poin per grup, limit downloader, downloader video publik, welcome message otomatis, dan pesan perpisahan member keluar.

Bot ini menggunakan nomor WhatsApp second khusus bot, bukan nomor pribadi. Bot hanya boleh aktif di grup yang sudah diizinkan oleh owner.

---

## 2. Main Goal

Bangun WhatsApp bot yang stabil, modular, dan mudah dikembangkan dengan fitur utama:

- Menu bot
- Kuis MTK pilihan ganda hitung cepat sederhana
- Family 100
- Tebak Kata Acak
- Tebak Emoji
- Tebak Angka
- Tic Tac Toe
- Sistem poin per grup
- Sistem limit downloader
- Owner unlimited poin dan limit
- Profile user
- Daily reward
- Quote random dan quote berdasarkan kategori
- Transfer limit antar user
- Download TikTok publik tanpa watermark
- Download Instagram Reels publik
- Download satu Instagram Story berdasarkan URL spesifik
- Welcome member baru
- Pesan perpisahan member keluar
- Whitelist grup
- Role owner dan admin grup
- Reply-based surrender untuk game aktif
- Reset poin manual owner dengan konfirmasi
- Owner tools untuk memberi poin, memberi limit, dan reset limit user
- Moderasi grup: kick, promote, demote, delete message, tagall, dan anti link grup WhatsApp

Fitur yang tidak dibuat di versi awal:

- Hidden tag all
- AI chat
- Tebak gambar
- Tebak lagu
- Dashboard web
- Reset poin otomatis mingguan

---

## 3. Tech Stack

- Node.js
- TypeScript
- Baileys untuk WhatsApp Web connection
- SQLite untuk database lokal
- Prisma ORM
- PM2 untuk menjalankan bot di VPS
- dotenv untuk environment variable
- pino untuk logging
- yt-dlp dan ffmpeg untuk downloader TikTok dan Instagram Reels
- zod untuk validasi input bila diperlukan

Jangan gunakan Supabase pada versi awal. Untuk satu grup kecil, SQLite lebih ringan dan cukup.

---

## 4. Aturan Kode yang Wajib Diikuti

### Gaya dan Konvensi

- JANGAN gunakan emoji di kode apapun, termasuk komentar, string, dan `console.log` atau `logger.*`.
  Pesan ke WhatsApp boleh menggunakan emoji karena itu adalah output ke user, bukan bagian dari kode.
- JANGAN gunakan emdash (`--`) di komentar atau string. Gunakan koma atau titik dua.
- Semua teks pesan bot dalam Bahasa Indonesia.
- Gunakan TypeScript strict mode. Tidak boleh ada `any` kecuali benar-benar tidak bisa dihindari,
  dan wajib diberi komentar alasannya.
- JANGAN hardcode data penting seperti nomor owner, session path, atau API key. Selalu gunakan `.env`.

### Struktur dan Tanggung Jawab File

- **Single Responsibility Principle (SRP):** satu file, satu tanggung jawab.
- **Batas baris per jenis file:**
  - Command handler (`commands/`): 80-150 baris, hanya routing dan validasi input
  - Service (`services/`): 150-250 baris, hanya logika bisnis
  - Orchestrator (`messageHandler.ts`, `index.ts`): 250-350 baris
  - Utility/helper (`utils/`): bebas, fokus pada fungsi murni tanpa side effect
  - Type definition (`types/`): bebas
- Jika sebuah file melewati batas baris dan memiliki lebih dari satu tanggung jawab,
  pecah menjadi file terpisah. Jangan menambah logika baru ke file yang sudah melewati
  batas kecuali sedang refactor file tersebut.
- Refactor file besar harus menjaga perilaku tetap sama. Setelah refactor jalankan
  `npm run lint` dan `npm run build`.

### Pemisahan Folder

- `commands/` untuk handler command per domain, satu file per domain
- `services/` untuk logika bisnis, satu file per domain
- `utils/` untuk helper murni yang bisa dipakai lintas domain
- `types/` untuk semua definisi TypeScript
- `config/` untuk konfigurasi dan pembacaan env

### Error Handling dan Async

- Setiap fungsi async wajib ada `try/catch`.
- Error yang terjadi di dalam handler command tidak boleh membuat bot crash.
  Tangkap error, log via `logger`, dan kirim pesan error yang ramah ke grup.
- Gunakan `logger` dari pino untuk semua logging, bukan `console.log`.

### Pengecualian Batas Baris

File berikut dikecualikan dari batas baris:

- `prisma/schema.prisma`
- `prisma/seed.ts` (data seed banyak)
- File generated Prisma
- `package-lock.json` / `yarn.lock`
- File dokumentasi dan konfigurasi yang wajar panjang (`AGENT.md`, `ecosystem.config.cjs`, `.env.example`)

---

## 5. Project Rules for Codex

1. Jangan membuat fitur di luar scope tanpa diminta.
2. Jangan hardcode data penting.
3. Gunakan struktur folder modular.
4. Setiap command dipisah berdasarkan domain.
5. Semua error ditangani dengan pesan ramah, tidak boleh crash.
6. Jangan membuat command spam.
7. Jangan membuat fitur hidden tag all.
8. Jangan membuat downloader untuk private content.
9. Jangan membuat bypass login Instagram.
10. Bot memproses TikTok publik, Instagram Reels, dan satu Instagram Story berdasarkan URL spesifik yang dapat diakses akun cookie secara sah.
11. Bot harus punya whitelist grup.
12. Bot harus tetap aman jika dimasukkan ke grup yang belum disetujui.
13. Bot harus menyimpan poin per grup.
14. Bot tidak boleh reset poin otomatis mingguan.
15. Reset poin hanya boleh manual oleh owner dengan konfirmasi.
16. Downloader harus memakai limit per user per grup.
17. Limit berkurang hanya jika download berhasil dikirim.
18. Owner selalu tampil 999 poin dan 999 limit tanpa menyimpan angka 999 permanen di database.
19. Bot harus punya profile user, daily reward, dan transfer limit.
20. Bot harus bisa dijalankan di VPS Ubuntu menggunakan PM2.
21. Jangan membuat hidden tag.
22. Anti link hanya mendeteksi link undangan grup WhatsApp, bukan semua domain.
23. Jangan membuat sistem warning, `.warnlist`, atau `.clearwarn`.
24. Cookie Instagram tidak boleh disimpan di git atau ditulis ke log.

---

## 6. Bot Identity

Nama project: **KOGBot**

Nama bot runtime: **MinjiBot**

Prefix command:

```
.
```

Daftar command:

```
.menu
.kuis mtk
.family100
.tebakkata
.tebakemoji
.tebakangka
.tictactoe @user
.nyerah kuis
.nyerah family100
.nyerah tebakkata
.nyerah tebakemoji
.nyerah tebakangka
.nyerah tictactoe
.rank
.poin
.profile
.profile @user
.limit
.belilimit <jumlah>
.transferlimit @user <jumlah>
.daily
.tt <link>
.ig <link>
.igstory <link>
.s
.gambar
.welcome on
.welcome off
.setwelcome <pesan>
.approvegroup
.removegroup
.listgroup
.resetpoin
.confirmresetpoin
.givepoin @user <jumlah>
.givelimit @user <jumlah>
.resetlimit @user
.kick @user
.promote @user
.demote @user
.del
.tagall <pesan>
.antilink on
.antilink off
.ownermenu
```

---

## 7. Role and Permission

### Owner Bot

Nomor owner disimpan di file `.env` sebagai `OWNER_NUMBER`.

Owner dapat:

- Approve group
- Remove group dari whitelist
- Melihat daftar group approved
- Reset poin grup secara manual dengan konfirmasi
- Melihat profile user
- Transfer limit tanpa mengurangi limit owner
- Memberi poin ke user dengan `.givepoin`
- Memberi limit ke user dengan `.givelimit`
- Reset limit user ke 1 dengan `.resetlimit`
- Reset semua data jika diperlukan
- Mengatur konfigurasi utama bot
- Menggunakan semua command admin

### Admin Grup

Admin grup dapat:

- Menyalakan atau mematikan welcome
- Mengubah pesan welcome
- Kick member biasa
- Promote member biasa menjadi admin
- Menghapus pesan member atau admin lain dengan reply `.del`
- Mengirim pengumuman grup dengan `.tagall <pesan>`
- Menyalakan atau mematikan anti link undangan grup WhatsApp
- Memulai dan menghentikan game
- Menggunakan downloader
- Melihat rank dan poin

### Member Grup

Member grup dapat:

- Menggunakan menu
- Bermain kuis MTK
- Bermain Family 100
- Bermain Tebak Kata Acak
- Bermain Tebak Emoji
- Bermain Tebak Angka
- Bermain Tic Tac Toe
- Menjawab game
- Menyerah dari game
- Melihat poin dan ranking
- Melihat profile sendiri atau member lain
- Melihat limit download
- Membeli limit download dengan poin
- Transfer limit ke member lain
- Claim daily reward 1 kali per 24 jam
- Menggunakan downloader TikTok dan Instagram Reels publik

---

## 8. Group Whitelist

Bot boleh masuk beberapa grup, tetapi hanya aktif di grup yang sudah di-approve oleh owner.

Aturan:

1. Jika bot masuk ke grup baru yang belum approved, bot mengirim pesan singkat bahwa grup belum diizinkan.
2. Bot tidak menjalankan fitur utama di grup yang belum approved.
3. Owner mengetik `.approvegroup` di grup tersebut untuk mengaktifkan bot.
4. Owner mengetik `.removegroup` untuk menonaktifkan grup.
5. Bot menyimpan group JID dan nama grup di database.

Command owner:

```
.approvegroup
.removegroup
.listgroup
```

---

## 9. Game Rules

Bot memiliki game berikut:

1. Kuis MTK
2. Family 100
3. Tebak Kata Acak
4. Tebak Emoji
5. Tebak Angka
6. Tic Tac Toe

Dalam satu grup:

- Setiap jenis game hanya boleh punya satu sesi aktif.
- Game berbeda boleh aktif bersamaan selama input tidak bertabrakan.
- Jika game yang sama masih aktif, bot harus reply ke pesan game aktif terakhir.
- Pesan game aktif disimpan di `ActiveGame.messageId` atau `ActiveGame.lastPromptMessageId`.
- Siapa saja boleh menyerah dari game umum.
- Command menyerah lama tetap ada dan harus spesifik.
- User juga boleh reply pesan game aktif dengan teks persis `nyerah`.
- Reply `nyerah` hanya valid jika isi pesan setelah normalisasi sama dengan `nyerah`.
- Reply `aku nyerah`, `nyerah dong`, atau `menyerah` harus diabaikan.
- Reply `nyerah` harus dicocokkan ke `messageId` atau `lastPromptMessageId` game aktif.

Command menyerah:

```
.nyerah kuis
.nyerah family100
.nyerah tebakkata
.nyerah tebakemoji
.nyerah tebakangka
.nyerah tictactoe
```

---

## 10. Kuis MTK

Soal kuis diambil secara statis dari seed database. Tidak ada generate soal dinamis.

Kuis MTK harus berupa hitung cepat sederhana saja:

- Penjumlahan
- Pengurangan
- Perkalian
- Pembagian

Jangan ubah Kuis MTK menjadi soal panjang, persen, peluang, luas, aljabar, atau soal cerita rumit.

Model kuis:

- Pilihan ganda
- Satu soal muncul per sesi
- Siapa cepat menjawab benar mendapat poin
- Jawaban bisa berupa huruf opsi (A/B/C/D) atau isi jawaban teks
- Setelah ada jawaban benar, kuis selesai
- Jika user menyerah, kuis dihentikan dan jawaban ditampilkan

Command:

```
.kuis mtk
```

Contoh tampilan:

```
Kuis MTK

Berapakah hasil dari 12 x 8?

A. 84
B. 92
C. 96
D. 108

Jawab dengan A, B, C, atau D.
```

Jika benar:

```
Benar, @user!
Jawaban: C. 96
+10 poin
```

Jika salah:

```
Salah. Coba lagi.
```

Jika menyerah:

```
Game kuis MTK dihentikan.
Jawaban benar: C. 96
```

---

## 11. Family 100

Soal dan jawaban diambil dari seed database, minimal 50 pertanyaan.

Model game:

- Satu orang memulai game
- Semua member bisa menjawab
- Jawaban benar akan dibuka
- Jawaban yang sudah ditemukan tidak bisa mendapat poin dua kali
- Game selesai jika semua jawaban ditemukan atau user mengetik `.nyerah family100`

Command:

```
.family100
```

Contoh tampilan:

```
Family 100

Sebutkan benda yang biasanya ada di dapur!

Jawaban ditemukan:
1. _ _ _ _ _ _
2. _ _ _ _ _ _
3. _ _ _ _ _ _
4. _ _ _ _ _ _
```

Jika benar:

```
Benar, @user!
Jawaban: Kompor
+40 poin
```

Jika semua jawaban ditemukan:

```
Family 100 selesai!

Jawaban:
1. Kompor - 40 poin
2. Piring - 25 poin
3. Sendok - 20 poin
4. Pisau - 15 poin
```

Jika menyerah:

```
Family 100 dihentikan.

Jawaban:
1. Kompor - 40 poin
2. Piring - 25 poin
3. Sendok - 20 poin
4. Pisau - 15 poin
```

---

## 12. Game Baru

### Tebak Kata Acak

Command:

```
.tebakkata
.nyerah tebakkata
```

Aturan:

- Bot memilih kata dari seed/database.
- Bot menampilkan huruf acak dan kategori.
- Semua member grup boleh menjawab langsung di chat.
- Jawaban benar memberi 10 poin.
- Setelah benar, game selesai.
- Jika menyerah, bot menampilkan jawaban benar.

Seed minimal 50 kata dengan kategori seperti buah, hewan, benda, makanan, tempat, profesi, dan kendaraan.

### Tebak Emoji

Command:

```
.tebakemoji
.nyerah tebakemoji
```

Aturan:

- Bot memilih soal emoji dari seed/database.
- Bot menampilkan kombinasi emoji.
- Semua member grup boleh menjawab langsung di chat.
- Jawaban benar memberi 10 poin.
- Setelah benar, game selesai.
- Jika menyerah, bot menampilkan jawaban benar.

Seed minimal 50 soal emoji.

### Tebak Angka

Command:

```
.tebakangka
.nyerah tebakangka
```

Aturan:

- Bot memilih angka random dari 1 sampai 100.
- Semua member grup boleh menebak.
- Bot hanya memproses jawaban angka.
- Jika tebakan terlalu kecil, balas `Terlalu kecil.`
- Jika tebakan terlalu besar, balas `Terlalu besar.`
- Jawaban benar memberi 15 poin.
- Setelah benar, game selesai.
- Jika menyerah, bot menampilkan angka benar.

### Tic Tac Toe

Command:

```
.tictactoe @user
.nyerah tictactoe
```

Aturan:

- Pembuat command menjadi player X.
- User yang di-mention menjadi player O.
- Papan 3x3 memakai input angka 1 sampai 9.
- Player bermain bergantian.
- Bot menolak input dari user yang bukan pemain.
- Bot menolak input jika bukan giliran pemain.
- Bot menolak posisi yang sudah terisi.
- Pemenang mendapat 20 poin.
- Jika seri, kedua pemain mendapat 5 poin.
- Jika salah satu pemain menyerah, lawannya menang.
- Jika orang luar menjalankan `.nyerah tictactoe`, game dihentikan tanpa pemenang.

---

## 13. Point and Limit System

Aturan poin:

```
Kuis MTK benar       : +10 poin
Family 100 benar     : sesuai nilai jawaban di database
Tebak Kata benar     : +10 poin
Tebak Emoji benar    : +10 poin
Tebak Angka benar    : +15 poin
Tic Tac Toe menang   : +20 poin
Tic Tac Toe seri     : +5 poin untuk masing-masing pemain
Salah jawab          : tidak dikurangi
Leaderboard          : .rank (top 10 per grup)
Cek poin pribadi     : .poin
Profile user         : .profile / .profile @user
Daily reward         : .daily
Quote                : .quote / .quote <kategori>
Transfer limit       : .transferlimit @user <jumlah>
Reset poin           : manual owner dengan konfirmasi
```

Command:

```
.poin
.rank
.profile
.daily
.transferlimit @user <jumlah>
.resetpoin
.confirmresetpoin
```

`.resetpoin` hanya boleh digunakan owner di grup dan wajib dikonfirmasi dengan `.confirmresetpoin` dalam 30 detik.

Tidak boleh ada reset poin otomatis mingguan.

Contoh leaderboard:

```
Leaderboard Mingguan

1. @user1 - 180 poin
2. @user2 - 120 poin
3. @user3 - 90 poin
```

Aturan limit downloader:

```
User baru              : 3 limit gratis per grup
Download sukses        : -1 limit
Download gagal         : limit tidak berkurang
Beli limit             : 100 poin = 1 limit
Cek limit              : .limit
Beli limit             : .belilimit <jumlah>
Transfer limit         : .transferlimit @user <jumlah>
Daily reward           : .daily, 1 kali per 24 jam
Owner                  : tampil 999 poin dan 999 limit
```

Command owner:

```
.givepoin @user <jumlah>
.givelimit @user <jumlah>
.resetlimit @user
```

Aturan owner tools:

- `.givepoin` menambah poin target pada grup tempat command dijalankan.
- `.givelimit` menambah limit download target pada grup tempat command dijalankan.
- `.resetlimit` mengembalikan limit target ke default 1.
- Ketiganya hanya boleh dijalankan owner.
- Jika target adalah owner, poin dan limit tetap tampil 999 tanpa menyimpan angka 999 permanen.

---

## 14. Downloader

Downloader menggunakan `yt-dlp` sebagai backend untuk TikTok publik, Instagram Reels, dan satu Instagram Story berdasarkan URL spesifik. Jangan gunakan API random dari GitHub, TikWM, Cobalt, atau scraper metadata HTML sebagai strategi utama.

Command:

```
.tt <link>
.ig <link>
.igstory <link>
```

Batasan:

- TikTok hanya untuk video publik
- Instagram hanya untuk Reels publik
- Instagram Story hanya diproses berdasarkan URL story spesifik
- Instagram Story tidak boleh mengambil seluruh story suatu akun
- Instagram Story memakai cookie akun yang sah melalui `YTDLP_COOKIES_FILE`
- Private content tidak didukung
- Tidak membuat bypass login Instagram
- Tidak perlu pilihan kualitas
- Bot langsung mengirim video jika berhasil
- Maksimal ukuran file 50 MB
- Setiap download sukses memakai 1 limit user
- Jika download gagal, limit tidak boleh berkurang
- Jika limit habis, download ditolak sebelum menjalankan `yt-dlp`
- File sementara dihapus setelah proses selesai
- `yt-dlp` dan `ffmpeg` wajib tersedia di VPS
- Jika Instagram publik tetap gagal karena pembatasan platform, gunakan cookie file hanya untuk akun bot yang sah melalui `YTDLP_COOKIES_FILE`
- Jangan commit atau log isi cookie Instagram

Validasi link:

- Pastikan domain berasal dari TikTok atau Instagram
- Jangan proses link selain dua domain tersebut
- Jangan proses konten private

Pesan error:

```
Gagal download. Pastikan link publik dan coba lagi.
```

Pesan file terlalu besar:

```
File terlalu besar. Maksimal ukuran video adalah 50 MB.
```

Pesan limit habis:

```
Limit download kamu habis.
Kumpulkan poin dari game, lalu beli limit dengan .belilimit.
```

Pesan `yt-dlp` belum siap:

```
Downloader belum siap. yt-dlp belum terinstall di server.
```

---

## 15. Welcome Message

Command:

```
.welcome on
.welcome off
.setwelcome <pesan>
```

Default welcome message:

```
╔═════════════════════════╗
   *Selamat Datang!* 🎉
╚═════════════════════════╝

Halo {nama}, welcome to *{namaGrup}*! 👋

Senang kamu bergabung di sini.
Jangan lupa kenalan sama yang lain ya 😊
Jangan ragu buat ngobrol dan ikutan game bot!

Ketik *.menu* untuk lihat fitur bot 🤖
_Selamat bergabung, semoga betah!_ 🏠
```

Default goodbye message:

```
╭───────────────────╮
  *See You, {nama}* 👋
╰───────────────────╯

*{nama}* sudah meninggalkan kita di *{namaGrup}*.

Terima kasih sudah meramaikan grup ini!
Semoga sukses selalu di luar sana ya 🙏
_Sampai ketemu lagi di lain waktu._
```

Placeholder yang harus didukung:

```
{nama}      -> mention member
{namaGrup}  -> nama grup
@user       -> alias lama untuk mention member
@group      -> alias lama untuk nama grup
```

---

## 16. Menu Bot

Command:

```
.menu
```

Isi menu member:

```
*MinjiBot Menu*

🎮 *GAME*
*.kuis mtk* - Kuis matematika
*.family100* - Family 100
*.tebakkata* - Tebak kata acak
*.tebakemoji* - Tebak dari emoji
*.tebakangka* - Tebak angka 1-100
*.tictactoe @user* - Duel 1v1

_Nyerah game: *.nyerah [nama game]*_
_Contoh: *.nyerah kuis*_

🏆 *POIN & LIMIT*
*.poin* - Cek poin kamu
*.profile* / *@user* - Profil
*.rank* - Ranking grup
*.limit* - Cek limit download
*.belilimit <jumlah>* - Beli limit
*.transferlimit @user <jumlah>* - Kirim limit

*REWARD*
*.daily* - Klaim hadiah harian

💬 *QUOTE*
*.quote* - Quote random
*.quote <kategori>* - Quote berdasarkan kategori
_Kategori: motivasi, lucu, islami, cinta, galau_

📥 *DOWNLOADER*
*.tt <link>* - Download TikTok
*.ig <link>* - Download Instagram Reels
*.igstory <link>* - Download Instagram Story

🖼 *MEDIA*
*.s* - Reply gambar jadi sticker
*.gambar* - Reply sticker jadi gambar

👋 *ADMIN*
*.welcome on/off* - Atur welcome
*.setwelcome <pesan>* - Ubah welcome

*MODERASI*
*.kick @user* - Keluarkan member
*.promote @user* - Jadikan admin
*.demote @user* - Turunkan admin
*.del* - Hapus pesan reply
*.tagall <pesan>* - Pengumuman grup
*.antilink on/off* - Anti link grup WhatsApp

_Prefix: ._
_Setiap download memakai 1 limit._
```

Menu owner terpisah:

```
.ownermenu
```

Isi owner menu:

```
Owner Menu

.approvegroup   - Izinkan bot aktif di grup ini
.removegroup    - Nonaktifkan bot dari grup ini
.listgroup      - Lihat daftar grup approved
.resetpoin      - Reset poin grup dengan konfirmasi
.givepoin @user jumlah  - Tambah poin user
.givelimit @user jumlah - Tambah limit user
.resetlimit @user       - Reset limit user ke 1
```

---

## 17. Database Design (Prisma + SQLite)

### User

```prisma
model User {
  id        String   @id @default(cuid())
  jid       String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Group

```prisma
model Group {
  id             String   @id @default(cuid())
  jid            String   @unique
  name           String?
  isApproved     Boolean  @default(false)
  welcomeEnabled Boolean  @default(false)
  welcomeMessage String?
  antiLinkEnabled Boolean @default(false)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

### WeeklyScore

Nama model boleh tetap `WeeklyScore` untuk kompatibilitas project existing, tetapi poin tidak boleh direset otomatis mingguan.
Reset hanya manual oleh owner.

```prisma
model WeeklyScore {
  id        String   @id @default(cuid())
  userJid   String
  groupJid  String
  score     Int      @default(0)
  weekStart DateTime
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userJid, groupJid, weekStart])
}
```

### ActiveGame

```prisma
model ActiveGame {
  id                  String   @id @default(cuid())
  groupJid            String
  type                GameType
  payload             String
  startedBy           String
  messageId           String?
  lastPromptMessageId String?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@unique([groupJid, type])
}

enum GameType {
  QUIZ_MTK
  FAMILY100
  WORD_SCRAMBLE
  EMOJI_GUESS
  NUMBER_GUESS
  TICTACTOE
}
```

### QuizQuestion

```prisma
model QuizQuestion {
  id            String   @id @default(cuid())
  category      String   @default("MTK")
  level         String
  question      String
  optionA       String
  optionB       String
  optionC       String
  optionD       String
  correctOption String
  explanation   String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

### Family100Question

```prisma
model Family100Question {
  id        String            @id @default(cuid())
  question  String
  answers   Family100Answer[]
  createdAt DateTime          @default(now())
  updatedAt DateTime          @updatedAt
}
```

### Family100Answer

```prisma
model Family100Answer {
  id               String           @id @default(cuid())
  questionId       String
  question         Family100Question @relation(fields: [questionId], references: [id])
  answer           String
  normalizedAnswer String
  points           Int
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt
}
```

### WordScrambleQuestion

```prisma
model WordScrambleQuestion {
  id               String   @id @default(cuid())
  category         String
  answer           String
  normalizedAnswer String
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}
```

### EmojiGuessQuestion

```prisma
model EmojiGuessQuestion {
  id               String   @id @default(cuid())
  emoji            String
  answer           String
  normalizedAnswer String
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}
```

### UserDownloadLimit

```prisma
model UserDownloadLimit {
  id        String   @id @default(cuid())
  userJid   String
  groupJid  String
  limit     Int      @default(1)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userJid, groupJid])
}
```

### UserStats

```prisma
model UserStats {
  id             String    @id @default(cuid())
  userJid        String
  groupJid       String
  gamesWon       Int       @default(0)
  lastDailyClaim DateTime?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  @@unique([userJid, groupJid])
}
```

---

## 18. Seed Data

Buat seed data awal:

- 300 soal MTK hitung cepat sederhana
- 200 pertanyaan Family 100
- 200 data Tebak Kata Acak
- 200 data Tebak Emoji

Soal MTK hanya boleh memakai:

```
Penjumlahan
Pengurangan
Perkalian
Pembagian
```

Format soal MTK harus pendek, misalnya `5 + 3 = ?`.
Family 100, Tebak Kata, dan Tebak Emoji harus berisi data ringan, aman, dan cocok untuk chat grup.

---

## 19. Folder Structure

```
kogbot/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── index.ts
│   ├── config/
│   │   └── env.ts
│   ├── bot/
│   │   ├── connection.ts
│   │   ├── messageHandler.ts
│   │   └── permissions.ts
│   ├── commands/
│   │   ├── index.ts
│   │   ├── menu.command.ts
│   │   ├── quiz.command.ts
│   │   ├── family100.command.ts
│   │   ├── score.command.ts
│   │   ├── downloader.command.ts
│   │   ├── welcome.command.ts
│   │   └── owner.command.ts
│   ├── services/
│   │   ├── quiz.service.ts
│   │   ├── family100.service.ts
│   │   ├── score.service.ts
│   │   ├── downloader.service.ts
│   │   ├── welcome.service.ts
│   │   └── group.service.ts
│   ├── database/
│   │   └── prisma.ts
│   ├── utils/
│   │   ├── normalize.ts
│   │   ├── format.ts
│   │   ├── logger.ts
│   │   └── tempFile.ts
│   └── types/
│       └── index.ts
├── sessions/
│   └── .gitkeep
├── temp/
│   └── .gitkeep
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── ecosystem.config.cjs
└── README.md
```

---

## 20. Environment Variables

File `.env.example`:

```env
BOT_NAME=MinjiBot
BOT_PREFIX=.
OWNER_NUMBER=628xxxxxxxxxx
DATABASE_URL=file:./dev.db
SESSION_DIR=./sessions
TEMP_DIR=./temp
MAX_DOWNLOAD_MB=50
YTDLP_BINARY=yt-dlp
# YTDLP_COOKIES_FILE=./cookies.txt
TIMEZONE=Asia/Jakarta
```

Catatan: Timezone menggunakan `Asia/Jakarta` (WIB, UTC+7). Tidak ada reset poin otomatis mingguan.

Jangan commit file `.env`.

---

## 21. Downloader Strategy

Gunakan `yt-dlp` sebagai backend downloader.

### TikTok

- `.tt <link>` menjalankan `yt-dlp` di background.
- Hanya link TikTok publik yang diproses.

### Instagram Reels

- `.ig <link>` menjalankan `yt-dlp` di background.
- Hanya link Instagram Reels publik yang diproses.

### Instagram Story

- `.igstory <link>` menjalankan `yt-dlp` di background.
- Hanya memproses satu URL story spesifik.
- Gunakan cookie akun Instagram yang sah melalui `YTDLP_COOKIES_FILE`.
- Jangan mengambil seluruh story dari suatu akun.
- Jangan membuat bypass login atau akses ilegal ke konten yang tidak dapat diakses akun cookie.
- Cookie Instagram tidak boleh disimpan di git atau ditulis ke log.

Aturan implementasi:

- Bungkus eksekusi `yt-dlp` dalam try-catch
- Jika `yt-dlp` belum terinstall, kirim pesan error yang jelas
- Jangan simpan video secara permanen
- Cek limit sebelum menjalankan `yt-dlp`
- Kurangi 1 limit hanya setelah video berhasil dikirim
- Hapus file sementara di folder `temp/` setelah dikirim atau gagal
- Gunakan `MAX_DOWNLOAD_MB=50` sebagai batas ukuran
- `ffmpeg` wajib tersedia di VPS untuk merge format video/audio

---

## 22. Reset Poin Manual

Jangan gunakan cron untuk reset poin.

Command owner:

```
.resetpoin
.confirmresetpoin
```

Alur:

1. Owner mengetik `.resetpoin` di grup.
2. Bot meminta konfirmasi.
3. Owner mengetik `.confirmresetpoin` dalam 30 detik.
4. Bot menghapus poin di grup tersebut.

Reset poin hanya berlaku untuk grup tempat command dijalankan.
Non-owner tidak boleh menjalankan reset poin.

---

## 23. Moderasi Grup

Command:

```text
.kick @user
.promote @user
.demote @user
.del
.tagall <pesan>
.antilink on
.antilink off
```

Hierarki role:

```text
Owner Bot
Admin Grup
Member
```

Aturan:

- Owner memiliki hak moderasi tertinggi.
- Admin dapat kick member biasa dan promote member.
- Admin tidak dapat kick owner atau admin lain.
- Hanya owner yang dapat demote admin.
- `.del` wajib memakai reply pesan target.
- Owner dapat menghapus pesan siapa pun.
- Admin dapat menghapus pesan member atau admin lain, tetapi tidak dapat menghapus pesan owner.
- `.tagall` hanya untuk pengumuman grup, bukan hidden tag.
- `.tagall` memiliki cooldown 10 menit per grup.
- Mention `.tagall` maksimal 100 member dan tidak mention bot sendiri.
- `.antilink` hanya mendeteksi link undangan grup WhatsApp.
- Anti link tidak boleh menindak TikTok, Instagram, YouTube, atau website biasa.
- Owner dan admin tidak terkena anti link.
- Member yang melanggar anti link langsung dihapus pesannya dan dikeluarkan tanpa warning.
- Jangan membuat `.warnlist` atau `.clearwarn`.
- Bot wajib menjadi admin grup untuk kick, promote, demote, delete message, dan enforcement anti link.

---

## 24. Error Handling

Setiap error harus ditangani, tidak boleh membuat bot crash.

Pesan error standar:

| Kondisi | Pesan |
|---|---|
| Command tidak dikenal | `Command tidak dikenal. Ketik .menu untuk melihat daftar fitur.` |
| Grup belum approved | `Grup ini belum diizinkan menggunakan MinjiBot. Owner bot perlu menjalankan .approvegroup terlebih dahulu.` |
| Downloader gagal | `Gagal download. Pastikan link publik dan coba lagi.` |
| File terlalu besar | `File terlalu besar. Maksimal ukuran video adalah 50 MB.` |
| Limit habis | `Limit download kamu habis. Kumpulkan poin dari game, lalu beli limit dengan .belilimit.` |
| Kuis MTK masih aktif | `Kuis MTK masih aktif. Reply pesan ini dengan "nyerah" kalau ingin menghentikan game ini.` |
| Family 100 masih aktif | `Family 100 masih aktif. Reply pesan ini dengan "nyerah" kalau ingin menghentikan game ini.` |
| Game baru masih aktif | `<Nama game> masih aktif. Reply pesan ini dengan "nyerah" kalau ingin menghentikan game ini.` |
| Bukan admin | `Hanya admin grup yang bisa menggunakan command ini.` |
| Bukan owner | `Hanya owner bot yang bisa menggunakan command ini.` |

---

## 25. Deployment

Setup di VPS Ubuntu dengan PM2:

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run seed
npm run build
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

Update project di VPS:

```bash
git pull
npm install
npx prisma migrate deploy
npx prisma generate
npm run build
pm2 restart kogbot
```

Scripts di `package.json`:

```json
{
  "scripts": {
    "dev": "tsx src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "seed": "tsx prisma/seed.ts",
    "jid:merge": "tsx prisma/mergeLidUsers.ts",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev"
  }
}
```

File `ecosystem.config.cjs`:

```js
module.exports = {
  apps: [
    {
      name: 'kogbot',
      script: './dist/index.js',
      watch: false,
      restart_delay: 5000,
      max_restarts: 10,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
```

---

## 26. Development Priority

Kerjakan berurutan, jangan loncat tahap:

1. Setup project TypeScript, tsconfig, package.json
2. Setup Baileys connection dan session
3. Setup Prisma dan SQLite, jalankan migrate
4. Setup role owner dan whitelist grup
5. Setup command handler dan router
6. Buat `.menu`
7. Buat sistem poin (WeeklyScore)
8. Buat kuis MTK
9. Buat Family 100
10. Buat welcome message
11. Buat downloader TikTok
12. Buat downloader Instagram Reels
13. Tambahkan game baru: Tebak Kata, Tebak Emoji, Tebak Angka, Tic Tac Toe
14. Tambahkan message id ActiveGame dan reply-based surrender
15. Hapus reset poin otomatis jika ada
16. Tambahkan reset poin manual owner dengan konfirmasi
17. Tambahkan sistem limit downloader
18. Tambahkan logging dan error handling menyeluruh
19. Buat README deployment

Downloader dikerjakan setelah command, database, whitelist, dan game selesai.

---

## 27. Acceptance Criteria

Project dianggap selesai jika:

1. Bot bisa login WhatsApp menggunakan nomor second.
2. Bot bisa membaca pesan grup.
3. Bot hanya aktif di grup approved.
4. Owner bisa approve grup dengan `.approvegroup`.
5. `.menu` menampilkan menu dengan benar.
6. `.kuis mtk` memulai kuis MTK.
7. Jawaban benar kuis mendapat 10 poin.
8. `.family100` memulai game Family 100.
9. Jawaban benar Family 100 mendapat poin sesuai data seed.
10. `.tebakkata` memulai game Tebak Kata.
11. Jawaban benar Tebak Kata mendapat 10 poin.
12. `.tebakemoji` memulai game Tebak Emoji.
13. Jawaban benar Tebak Emoji mendapat 10 poin.
14. `.tebakangka` memulai game Tebak Angka.
15. Jawaban benar Tebak Angka mendapat 15 poin.
16. `.tictactoe @user` memulai duel Tic Tac Toe.
17. Tic Tac Toe mendeteksi menang dan seri.
18. `.nyerah kuis` menghentikan kuis.
19. `.nyerah family100` menghentikan Family 100.
20. `.nyerah tebakkata`, `.nyerah tebakemoji`, `.nyerah tebakangka`, dan `.nyerah tictactoe` berjalan.
21. Reply pesan game aktif dengan `nyerah` menghentikan game yang sesuai.
22. Reply `nyerah` tidak mengganggu game lain yang berbeda jenis.
23. Game berbeda bisa aktif bersamaan dalam satu grup.
24. Dua game dengan jenis yang sama tidak bisa aktif bersamaan.
25. `.poin` menampilkan poin user.
26. `.rank` menampilkan leaderboard top 10 per grup.
27. Tidak ada reset poin otomatis mingguan.
28. `.resetpoin` hanya owner dan membutuhkan `.confirmresetpoin`.
29. `.limit` menampilkan limit download user.
30. `.belilimit <jumlah>` membeli limit dengan konversi 100 poin = 1 limit.
31. User baru mendapat 3 limit gratis per grup.
32. Owner selalu tampil 999 poin dan 999 limit.
33. `.profile` dan `.profile @user` menampilkan profil user.
34. `.transferlimit @user <jumlah>` memindahkan limit antar user.
35. `.daily` hanya bisa diklaim 1 kali per 24 jam.
36. `.givepoin`, `.givelimit`, dan `.resetlimit` hanya owner.
37. `.tt <link>` memproses link TikTok publik via `yt-dlp`.
38. `.ig <link>` memproses link Instagram Reels publik via `yt-dlp`.
39. Downloader mengurangi 1 limit hanya setelah video berhasil dikirim.
40. Download gagal tidak mengurangi limit.
41. File downloader dibatasi maksimal 50 MB.
42. Welcome message berjalan saat member baru masuk.
43. Admin grup bisa mengubah welcome message.
44. Bot bisa dijalankan dengan PM2 di VPS Ubuntu.
45. Error tidak membuat bot crash.
46. Session WhatsApp tersimpan di folder `sessions/`.
47. `.igstory <link>` hanya memproses satu story berdasarkan URL spesifik.
48. `.igstory` memakai cookie akun sah dan tidak mengambil seluruh story akun.
49. `.kick`, `.promote`, dan `.demote` mengikuti hierarki owner, admin, member.
50. `.del` wajib reply pesan target dan mengikuti permission role.
51. `.tagall <pesan>` hanya owner/admin, cooldown 10 menit, dan bukan hidden tag.
52. `.antilink on/off` hanya mendeteksi link undangan grup WhatsApp.
53. Anti link tidak menindak TikTok, Instagram, YouTube, atau website biasa.
54. Tidak ada warning system, `.warnlist`, atau `.clearwarn`.

---

## 28. Important Notes

- Bot ini untuk penggunaan pribadi di grup kecil.
- Gunakan nomor second khusus bot, bukan nomor pribadi.
- Jangan membuat fitur spam.
- Jangan mendukung private content.
- Jangan menambahkan fitur di luar scope tanpa instruksi baru.
- Fokus pada stabilitas, bukan banyak fitur.
- Semua waktu menggunakan WIB (UTC+7, Asia/Jakarta).
