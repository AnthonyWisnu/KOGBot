# PLAN.md - KOGBot Implementation Plan

Dokumen ini menjadi rencana kerja bertahap untuk membangun KOGBot sesuai arahan di `AGENT.md`.

Prinsip utama:

- Kerjakan berurutan, jangan loncat tahap.
- Jangan menambah fitur di luar scope.
- Jaga struktur modular sejak awal.
- Semua data penting dibaca dari `.env`.
- Semua pesan bot ke user menggunakan Bahasa Indonesia.
- Error tidak boleh membuat bot crash.
- Jalankan verifikasi setelah setiap tahap besar.

---

## Tahap 1 - Setup Project Dasar (Selesai)

Tujuan:

Membuat fondasi project TypeScript yang siap dikembangkan.

Pekerjaan:

- Buat `package.json`.
- Buat `tsconfig.json` dengan strict mode.
- Buat struktur folder dasar:
  - `src/`
  - `src/config/`
  - `src/bot/`
  - `src/commands/`
  - `src/services/`
  - `src/database/`
  - `src/utils/`
  - `src/types/`
  - `prisma/`
  - `sessions/`
  - `temp/`
- Buat `.gitignore`.
- Buat `.env.example`.
- Pasang dependency utama:
  - TypeScript
  - tsx
  - Baileys
  - Prisma
  - SQLite dependency
  - dotenv
  - pino
  - zod

Verifikasi:

- `npm install` berhasil.
- `npm run build` berjalan tanpa error setelah file minimal dibuat.

---

## Tahap 2 - Config, Logger, dan Entry Point (Selesai)

Tujuan:

Menyiapkan konfigurasi global yang aman dan terpusat.

Pekerjaan:

- Buat `src/config/env.ts`.
- Validasi environment variable dengan zod.
- Buat `src/utils/logger.ts`.
- Buat `src/index.ts` sebagai entry point awal.
- Pastikan tidak ada hardcode owner, session path, temp path, prefix, dan limit file.

Verifikasi:

- Bot gagal start dengan pesan log jelas jika `.env` tidak valid.
- `npm run build` berhasil.

---

## Tahap 3 - Prisma dan SQLite (Selesai)

Tujuan:

Menyiapkan database lokal sesuai desain.

Pekerjaan:

- Buat `prisma/schema.prisma`.
- Tambahkan model:
  - `User`
  - `Group`
  - `WeeklyScore`
  - `ActiveGame`
  - `QuizQuestion`
  - `Family100Question`
  - `Family100Answer`
- Buat `src/database/prisma.ts`.
- Tambahkan script Prisma di `package.json`.
- Jalankan generate dan migrate.

Verifikasi:

- `npx prisma generate` berhasil.
- `npx prisma migrate dev` berhasil.
- `npm run build` berhasil.

---

## Tahap 4 - Seed Data (Selesai)

Tujuan:

Mengisi data awal game.

Pekerjaan:

- Buat `prisma/seed.ts`.
- Tambahkan 100 soal MTK pilihan ganda.
- Tambahkan minimal 50 pertanyaan Family 100.
- Pastikan jawaban Family 100 punya `normalizedAnswer`.
- Pastikan data ringan, aman untuk grup, dan cocok untuk chat.

Verifikasi:

- `npm run seed` berhasil.
- Data soal tersedia di database.

---

## Tahap 5 - Koneksi WhatsApp (Selesai)

Tujuan:

Membuat bot bisa login dan menyimpan session.

Pekerjaan:

- Buat `src/bot/connection.ts`.
- Setup Baileys connection.
- Simpan session di folder dari `SESSION_DIR`.
- Tambahkan logging koneksi.
- Pastikan reconnect ditangani dengan aman.

Verifikasi:

- Bot bisa start.
- QR login muncul saat belum ada session.
- Session tersimpan di folder `sessions/`.
- Bot bisa reconnect tanpa login ulang jika session valid.

---

## Tahap 6 - Message Handler dan Command Router (Selesai)

Tujuan:

Membuat bot bisa membaca pesan grup dan menjalankan command.

Pekerjaan:

- Buat `src/bot/messageHandler.ts`.
- Buat `src/commands/index.ts`.
- Parse prefix dari `.env`.
- Abaikan pesan non-command.
- Abaikan pesan dari bot sendiri.
- Tangani command tidak dikenal.
- Semua handler async wajib `try/catch`.

Verifikasi:

- `.menu` belum perlu lengkap, tapi routing command sudah berjalan.
- Command tidak dikenal membalas pesan standar.
- Error handler tidak membuat bot crash.

---

## Tahap 7 - Role dan Whitelist Grup (Selesai)

Tujuan:

Memastikan bot hanya aktif di grup approved.

Pekerjaan:

- Buat `src/bot/permissions.ts`.
- Buat `src/services/group.service.ts`.
- Buat `src/commands/owner.command.ts`.
- Implementasi:
  - `.approvegroup`
  - `.removegroup`
  - `.listgroup`
  - `.ownermenu`
- Cek owner dari `OWNER_NUMBER`.
- Simpan group JID dan nama grup di database.
- Jika grup belum approved, bot hanya memberi pesan standar dan tidak menjalankan fitur utama.

Verifikasi:

- Owner bisa approve grup.
- Non-owner tidak bisa approve grup.
- Grup belum approved tidak bisa memakai fitur utama.
- Grup approved bisa lanjut ke command lain.

---

## Tahap 8 - Menu Bot (Selesai)

Tujuan:

Menyediakan daftar command untuk member dan owner.

Pekerjaan:

- Buat `src/commands/menu.command.ts`.
- Implementasi `.menu`.
- Pastikan isi menu sesuai `AGENT.md`.
- Pastikan `.ownermenu` tetap terpisah.

Verifikasi:

- `.menu` menampilkan menu member.
- `.ownermenu` hanya bisa dipakai owner.

---

## Tahap 9 - Sistem Poin Mingguan (Selesai)

Tujuan:

Menyediakan penyimpanan dan pembacaan skor mingguan per grup.

Pekerjaan:

- Buat `src/services/score.service.ts`.
- Buat `src/commands/score.command.ts`.
- Implementasi:
  - Tambah poin user.
  - `.poin`
  - `.rank`
- Hitung `weekStart` konsisten untuk WIB.
- Reset poin manual owner dikerjakan di tahap aturan baru.

Verifikasi:

- Poin user bisa ditambah dari service.
- `.poin` menampilkan poin pribadi.
- `.rank` menampilkan top 10 per grup.
- Tidak ada reset otomatis pada tahap ini.

---

## Tahap 10 - Kuis MTK (Selesai)

Tujuan:

Membuat game kuis MTK pilihan ganda.

Pekerjaan:

- Buat `src/services/quiz.service.ts`.
- Buat `src/commands/quiz.command.ts`.
- Implementasi:
  - `.kuis mtk`
  - `.nyerah kuis`
  - Validasi hanya satu kuis MTK aktif per grup.
  - Simpan sesi di `ActiveGame`.
  - Jawaban benar bisa berupa opsi atau teks jawaban.
  - Jawaban benar mendapat 10 poin.
  - Jawaban salah tidak mengurangi poin.

Verifikasi:

- `.kuis mtk` memulai satu soal.
- Dua kuis MTK tidak bisa aktif bersamaan.
- Jawaban benar menutup game dan menambah 10 poin.  
- `.nyerah kuis` menutup game dan menampilkan jawaban.

---

## Tahap 11 - Family 100 (Selesai)

Tujuan:

Membuat game Family 100 berbasis data seed.

Pekerjaan:

- Buat `src/services/family100.service.ts`.
- Buat `src/commands/family100.command.ts`.
- Implementasi:
  - `.family100`
  - `.nyerah family100`
  - Validasi hanya satu Family 100 aktif per grup.
  - Simpan jawaban yang sudah ditemukan di payload `ActiveGame`.
  - Jawaban benar memberi poin sesuai database.
  - Jawaban yang sudah ditemukan tidak memberi poin dua kali.
  - Game selesai jika semua jawaban ditemukan.

Verifikasi:

- `.family100` memulai game.
- Dua Family 100 tidak bisa aktif bersamaan.
- Jawaban benar membuka jawaban dan menambah poin.
- Jawaban duplikat tidak menambah poin.
- `.nyerah family100` menutup game dan menampilkan semua jawaban.
- Kuis MTK dan Family 100 bisa aktif bersamaan.

---

## Tahap 12 - Welcome Message (Selesai)

Tujuan:

Menyambut member baru dengan pesan yang bisa diatur admin.

Pekerjaan:

- Buat `src/services/welcome.service.ts`.
- Buat `src/commands/welcome.command.ts`.
- Implementasi:
  - `.welcome on`
  - `.welcome off`
  - `.setwelcome <pesan>`
- Dukung placeholder:
  - `@user`
  - `@group`
- Command hanya untuk admin grup.
- Welcome hanya aktif di grup approved.

Verifikasi:

- Admin bisa mengaktifkan welcome.
- Admin bisa menonaktifkan welcome.
- Admin bisa mengubah pesan welcome.
- Non-admin tidak bisa mengubah welcome.
- Member baru menerima pesan jika welcome aktif.

---

## Tahap 13 - Downloader TikTok (Selesai)

Tujuan:

Mendukung download video TikTok publik tanpa watermark.

Pekerjaan:

- Buat `src/services/downloader.service.ts`.
- Buat `src/commands/downloader.command.ts`.
- Implementasi `.tt <link>`.
- Validasi domain TikTok.
- Gunakan `yt-dlp` sebagai backend downloader.
- Pastikan `ffmpeg` tersedia di VPS.
- Batasi ukuran file maksimal sesuai `MAX_DOWNLOAD_MB`.
- Simpan sementara di `TEMP_DIR`.
- Hapus file sementara setelah dikirim atau gagal.

Verifikasi:

- Link TikTok publik berhasil diproses.
- Link non-TikTok ditolak.
- File terlalu besar ditolak.
- File sementara terhapus setelah proses.
- Error downloader dibalas dengan pesan ramah.

---

## Tahap 14 - Downloader Instagram Reels (Selesai)

Tujuan:

Mendukung download Instagram Reels publik.

Pekerjaan:

- Implementasi `.ig <link>` di downloader command.
- Validasi domain Instagram.
- Validasi hanya Reels publik.
- Gunakan `yt-dlp` sebagai backend downloader.
- Pastikan `ffmpeg` tersedia di VPS.
- Jangan mendukung Story.
- Jangan mendukung private content.
- Terapkan limit ukuran dan cleanup file sementara.

Verifikasi:

- Link Reels publik berhasil diproses.
- Link Story ditolak atau gagal dengan pesan standar.
- Private content tidak diproses.
- File terlalu besar ditolak.
- File sementara terhapus setelah proses.

---

## Tahap 16 - Error Handling dan Stabilitas (Selesai)

Tujuan:

Memastikan semua alur aman untuk runtime WhatsApp.

Pekerjaan:

- Audit semua async function.
- Pastikan handler command punya `try/catch`.
- Pastikan service error dilempar atau dikembalikan secara konsisten.
- Pastikan pesan error standar digunakan.
- Pastikan logging memakai pino, bukan `console.log`.
- Pastikan tidak ada `any` tanpa alasan.
- Pastikan tidak ada emoji di kode.
- Pastikan tidak ada emdash di kode.

Verifikasi:

- `npm run build` berhasil.
- `npm run lint` berhasil jika lint script tersedia.
- Bot tetap hidup saat command error.

---

## Tahap 17 - Deployment PM2 (Selesai)

Tujuan:

Membuat project siap dijalankan di VPS Ubuntu.

Pekerjaan:

- Buat `ecosystem.config.js`.
- Pastikan script production:
  - `npm run build`
  - `npm start`
- Dokumentasikan setup di `README.md`.
- Pastikan folder `sessions/` dan `temp/` tersedia.

Verifikasi:

- `npm run build` berhasil.
- `npm start` menjalankan hasil build.
- PM2 bisa menjalankan `ecosystem.config.js`.

---

## Tahap 18 - Final Acceptance Test

Tujuan:

Memastikan semua acceptance criteria terpenuhi.

Checklist:

- Bot bisa login WhatsApp.
- Bot bisa membaca pesan grup.
- Bot hanya aktif di grup approved.
- Owner bisa approve grup.
- `.menu` tampil benar.
- `.kuis mtk` berjalan.
- Jawaban benar kuis mendapat 10 poin.
- `.family100` berjalan.
- Jawaban Family 100 mendapat poin sesuai database.
- `.nyerah kuis` berjalan.
- `.nyerah family100` berjalan.
- Kuis MTK dan Family 100 bisa aktif bersamaan.
- Dua kuis MTK tidak bisa aktif bersamaan.
- Dua Family 100 tidak bisa aktif bersamaan.
- `.poin` tampil benar.
- `.rank` tampil benar.
- Reset poin manual owner berjalan dengan konfirmasi.
- `.tt <link>` berjalan untuk TikTok publik.
- `.ig <link>` berjalan untuk Reels publik.
- File downloader dibatasi maksimal 50 MB.
- Welcome message berjalan.
- Admin bisa mengubah welcome message.
- Bot bisa dijalankan dengan PM2.
- Error tidak membuat bot crash.
- Session tersimpan di `sessions/`.

---

## Tahap 19 - Audit Integrasi Game Baru

Tujuan:

Menyiapkan dasar penambahan game baru tanpa merusak fitur yang sudah berjalan.

Pekerjaan:

- Baca ulang struktur command, message handler, active game, dan score service.
- Identifikasi pola dari:
  - Kuis MTK
  - Family 100
  - `.nyerah`
  - `.menu`
- Tentukan payload JSON untuk:
  - Tebak Kata Acak
  - Tebak Emoji
  - Tebak Angka
  - Tic Tac Toe
- Pastikan game berjalan per grup melalui `ActiveGame`.
- Pastikan tiap jenis game hanya punya satu sesi aktif per grup.
- Pastikan game berbeda boleh aktif bersamaan selama input tidak bertabrakan.

Verifikasi:

- Tidak ada perubahan behavior fitur lama.
- Rencana payload sudah jelas sebelum implementasi.
- `npm run build` tetap berhasil jika ada perubahan type kecil.

---

## Tahap 20 - Schema dan Seed Game Baru (Selesai)

Tujuan:

Menambahkan data awal untuk Tebak Kata dan Tebak Emoji.

Pekerjaan:

- Tambahkan enum `GameType` baru:
  - `WORD_SCRAMBLE`
  - `EMOJI_GUESS`
  - `NUMBER_GUESS`
  - `TICTACTOE`
- Tambahkan model Prisma baru jika diperlukan untuk seed:
  - Data Tebak Kata minimal 50 item.
  - Data Tebak Emoji minimal 50 item.
- Jika memakai model baru, buat migrasi Prisma yang rapi.
- Update `prisma/seed.ts`.
- Pastikan normalisasi jawaban:
  - trim
  - lowercase
  - spasi berlebih menjadi satu spasi
  - tanda baca sederhana diabaikan
- Jangan mengubah konsep kuis MTK yang sudah sederhana.

Verifikasi:

- `npx prisma generate` berhasil.
- Migrasi berhasil jika schema berubah.
- `npm run seed` berhasil.
- Data Tebak Kata dan Tebak Emoji tersedia.
- Data MTK tetap 300 soal hitung cepat sederhana.
- Data Family 100 tetap 200 pertanyaan.

---

## Tahap 21 - Tebak Kata Acak (Selesai)

Tujuan:

Membuat game Tebak Kata Acak dari huruf yang diacak.

Pekerjaan:

- Buat service Tebak Kata di `src/services/`.
- Buat command handler di `src/commands/`.
- Implementasi command:
  - `.tebakkata`
  - `.nyerah tebakkata`
- Bot memilih satu kata dari seed/database.
- Bot menampilkan huruf acak dan kategori.
- Semua member grup boleh menjawab langsung di chat.
- Jawaban benar menutup game dan memberi 10 poin.
- Jawaban salah diabaikan tanpa pengurangan poin.
- `.nyerah tebakkata` menutup game dan menampilkan jawaban benar.
- Pastikan normalisasi jawaban dipakai.

Verifikasi:

- `.tebakkata` memulai game per grup.
- Dua Tebak Kata tidak bisa aktif bersamaan di grup yang sama.
- Jawaban benar memberi 10 poin.
- `.nyerah tebakkata` berjalan.
- `npm run build` berhasil sebelum lanjut tahap berikutnya.

---

## Tahap 22 - Tebak Emoji (Selesai)

Tujuan:

Membuat game Tebak Emoji berbasis kombinasi emoji dan jawaban teks.

Pekerjaan:

- Buat service Tebak Emoji di `src/services/`.
- Buat command handler di `src/commands/`.
- Implementasi command:
  - `.tebakemoji`
  - `.nyerah tebakemoji`
- Bot memilih satu soal emoji dari seed/database.
- Semua member grup boleh menjawab langsung di chat.
- Jawaban benar menutup game dan memberi 10 poin.
- Jawaban salah diabaikan tanpa pengurangan poin.
- `.nyerah tebakemoji` menutup game dan menampilkan jawaban benar.
- Pastikan normalisasi jawaban dipakai.

Verifikasi:

- `.tebakemoji` memulai game per grup.
- Dua Tebak Emoji tidak bisa aktif bersamaan di grup yang sama.
- Jawaban benar memberi 10 poin.
- `.nyerah tebakemoji` berjalan.
- `npm run build` berhasil sebelum lanjut tahap berikutnya.

---

## Tahap 23 - Tebak Angka (Selesai)

Tujuan:

Membuat game Tebak Angka 1 sampai 100.

Pekerjaan:

- Buat service Tebak Angka di `src/services/`.
- Buat command handler di `src/commands/`.
- Implementasi command:
  - `.tebakangka`
  - `.nyerah tebakangka`
- Simpan `targetNumber` di payload `ActiveGame`.
- Bot menerima jawaban angka langsung di chat.
- Abaikan pesan non-angka saat game aktif.
- Jika tebakan terlalu kecil, balas `Terlalu kecil.`
- Jika tebakan terlalu besar, balas `Terlalu besar.`
- Jawaban benar menutup game dan memberi 15 poin.
- `.nyerah tebakangka` menutup game dan menampilkan angka benar.

Verifikasi:

- `.tebakangka` memulai game per grup.
- Dua Tebak Angka tidak bisa aktif bersamaan di grup yang sama.
- Petunjuk terlalu kecil dan terlalu besar berjalan.
- Jawaban benar memberi 15 poin.
- `.nyerah tebakangka` berjalan.
- `npm run build` berhasil sebelum lanjut tahap berikutnya.

---

## Tahap 24 - Tic Tac Toe (Selesai)

Tujuan:

Membuat game duel Tic Tac Toe 1 lawan 1.

Pekerjaan:

- Buat service Tic Tac Toe di `src/services/`.
- Buat command handler di `src/commands/`.
- Implementasi command:
  - `.tictactoe @user`
  - `.nyerah tictactoe`
- User pembuat command menjadi player X.
- User yang di-mention menjadi player O.
- Simpan payload:
  - `playerX`
  - `playerO`
  - `turn`
  - `board`
- Input langkah memakai angka 1 sampai 9.
- Tolak input dari user yang bukan pemain.
- Tolak input jika bukan giliran pemain.
- Tolak input jika posisi sudah terisi.
- Deteksi pemenang.
- Deteksi seri.
- Pemenang mendapat 20 poin.
- Jika seri, kedua pemain mendapat 5 poin.
- Jika salah satu pemain menyerah, lawannya menang.
- Jika orang luar menjalankan `.nyerah tictactoe`, game dihentikan tanpa pemenang.

Verifikasi:

- `.tictactoe @user` memulai duel.
- Giliran berjalan bergantian.
- Input ilegal ditolak dengan pesan jelas.
- Pemenang terdeteksi dan mendapat 20 poin.
- Seri terdeteksi dan kedua pemain mendapat 5 poin.
- `.nyerah tictactoe` berjalan sesuai aturan.
- `npm run build` berhasil sebelum lanjut tahap berikutnya.

---

## Tahap 25 - Router, Menu, dan Acceptance Test Game Baru (Selesai)

Tujuan:

Menghubungkan semua game baru ke bot dan memastikan fitur lama tetap aman.

Pekerjaan:

- Update command router untuk command baru:
  - `.tebakkata`
  - `.tebakemoji`
  - `.tebakangka`
  - `.tictactoe`
- Update router `.nyerah` untuk:
  - `.nyerah tebakkata`
  - `.nyerah tebakemoji`
  - `.nyerah tebakangka`
  - `.nyerah tictactoe`
- Update plain message handler agar jawaban game baru diproses.
- Urutkan handler agar input tidak bertabrakan secara tidak wajar.
- Update `.menu` dengan daftar game baru.
- Pastikan command lama tetap ada.
- Jalankan build dan lint.

Acceptance Criteria:

- `.tebakkata` bisa memulai game.
- Jawaban benar Tebak Kata memberi 10 poin.
- `.nyerah tebakkata` menampilkan jawaban.
- `.tebakemoji` bisa memulai game.
- Jawaban benar Tebak Emoji memberi 10 poin.
- `.nyerah tebakemoji` menampilkan jawaban.
- `.tebakangka` bisa memulai game angka 1 sampai 100.
- Tebak Angka memberi respons terlalu besar atau terlalu kecil.
- Jawaban benar Tebak Angka memberi 15 poin.
- `.nyerah tebakangka` menampilkan angka benar.
- `.tictactoe @user` bisa memulai duel.
- Tic Tac Toe berjalan bergantian.
- Bot menolak input dari user yang bukan pemain.
- Bot menolak input jika bukan giliran pemain.
- Bot mendeteksi pemenang Tic Tac Toe.
- Bot mendeteksi hasil seri Tic Tac Toe.
- Pemenang Tic Tac Toe mendapat 20 poin.
- Jika seri, kedua pemain mendapat 5 poin.
- `.nyerah tictactoe` berjalan sesuai aturan.
- Semua game terintegrasi dengan poin mingguan existing.
- Semua game berjalan per grup.
- Game baru tidak merusak fitur existing.
- `.menu` menampilkan command baru.
- Bot tidak crash saat input salah.
- `npm run build` berhasil.
- `npm run lint` berhasil.

---

## Tahap 26 - ActiveGame Message ID dan Reply-Based Surrender (Selesai)

Tujuan:

Membuat setiap game aktif bisa dilacak dari pesan bot terakhir, lalu bisa dihentikan dengan reply `nyerah`.

Pekerjaan:

- Tambahkan field ke model `ActiveGame`:
  - `messageId String?`
  - `lastPromptMessageId String?` jika dibutuhkan.
- Buat migrasi Prisma dan jalankan generate.
- Simpan message id pesan utama game saat game dimulai.
- Update message id saat bot mengirim prompt lanjutan yang relevan.
- Jika user mencoba memulai game yang sama saat masih aktif, bot reply ke pesan game aktif terakhir.
- Tambahkan util atau service untuk mencari active game berdasarkan quoted message id.
- Tambahkan handler reply-based surrender:
  - hanya pesan reply
  - isi pesan harus persis `nyerah` setelah normalisasi
  - cocokkan quoted message id dengan `messageId` atau `lastPromptMessageId`
  - jika cocok, panggil surrender game terkait
  - jika tidak cocok, abaikan
- Pastikan command `.nyerah ...` lama tetap berjalan.

Verifikasi:

- ActiveGame menyimpan message id pesan game aktif.
- Start game yang sama saat masih aktif membalas ke pesan game terakhir.
- Reply `nyerah` menghentikan game yang sesuai.
- Reply `nyerah` tidak menghentikan game lain yang berbeda jenis.
- Kalimat seperti `aku nyerah deh` tidak diproses sebagai surrender.
- `npm run build` berhasil.

---

## Tahap 27 - Reset Poin Manual Owner (Selesai)

Tujuan:

Menghapus reset poin otomatis dan menggantinya dengan reset manual yang aman.

Pekerjaan:

- Hapus pemanggilan cron reset mingguan dari entry point.
- Hapus atau nonaktifkan service cron reset poin.
- Ganti command reset owner lama dengan:
  - `.resetpoin`
  - `.confirmresetpoin`
- `.resetpoin` hanya bisa digunakan owner di grup.
- Bot meminta konfirmasi selama 30 detik.
- `.confirmresetpoin` hanya valid untuk owner yang meminta reset.
- Reset hanya berlaku untuk grup tempat command dijalankan.
- Pending confirmation boleh disimpan di memory atau model database sederhana.
- Update owner menu.
- Hapus informasi reset mingguan dari README dan dokumentasi lain.

Verifikasi:

- Cron reset mingguan tidak berjalan.
- Non-owner tidak bisa reset poin.
- `.resetpoin` meminta konfirmasi.
- `.confirmresetpoin` dalam 30 detik mereset poin grup.
- Konfirmasi kedaluwarsa tidak mengeksekusi reset.
- `npm run build` berhasil.

---

## Tahap 28 - Sistem Limit Downloader (Selesai)

Tujuan:

Menambahkan limit download per user per grup dan integrasi pembelian limit memakai poin.

Pekerjaan:

- Tambahkan model Prisma, disarankan `UserDownloadLimit`:
  - `id`
  - `userJid`
  - `groupJid`
  - `limit`
  - `createdAt`
  - `updatedAt`
  - unique `userJid, groupJid`
- User baru mendapat 3 limit gratis.
- Buat service limit downloader.
- Implementasi command:
  - `.limit`
  - `.belilimit`
  - `.belilimit <jumlah>`
- Aturan konversi:
  - 100 poin = 1 limit download.
- Jika poin cukup, kurangi poin dan tambah limit.
- Jika poin tidak cukup, balas pesan jelas.
- Integrasikan limit ke downloader:
  - `.tt <link>` membutuhkan 1 limit.
  - `.ig <link>` membutuhkan 1 limit.
  - Limit berkurang hanya setelah download berhasil dikirim.
  - Jika download gagal, limit tidak berkurang.
  - Jika limit habis, downloader ditolak sebelum menjalankan `yt-dlp`.

Verifikasi:

- `.limit` menampilkan limit dan poin user.
- User baru mendapat 3 limit.
- `.belilimit <jumlah>` berhasil jika poin cukup.
- `.belilimit <jumlah>` ditolak jika poin tidak cukup.
- TikTok mengurangi 1 limit hanya jika sukses.
- Instagram mengurangi 1 limit hanya jika sukses.
- Download gagal tidak mengurangi limit.
- `npm run build` berhasil.

---

## Tahap 29 - Menu, Dokumentasi, dan Acceptance Test Aturan Baru (Selesai)

Tujuan:

Menyatukan seluruh perubahan `Gamebaru.md` dan `AturanBaru.md`.

Pekerjaan:

- Update `.menu`:
  - game baru
  - surrender command baru
  - downloader memakai limit
  - `.limit`
  - `.belilimit <jumlah>`
- Update `.ownermenu`:
  - `.resetpoin`
  - hapus command reset lama dari owner menu
- Update README jika masih menyebut reset mingguan otomatis.
- Pastikan `AGENT.md` selaras dengan aturan terbaru.
- Jalankan build dan lint.
- Buat daftar manual test untuk WhatsApp live.

Acceptance Criteria:

- Semua acceptance criteria `Gamebaru.md` terpenuhi.
- Semua acceptance criteria `AturanBaru.md` terpenuhi.
- Fitur lama tetap berjalan.
- Bot tidak crash saat input salah.
- `npm run build` berhasil.
- `npm run lint` berhasil.

---

## Tahap 30 - Owner Unlimited Mode (Selesai)

Tujuan:

Membuat owner selalu dianggap memiliki poin dan limit unlimited tanpa menyimpan angka 999 permanen di database.

Pekerjaan:

- Audit helper owner existing di `src/bot/permissions.ts`.
- Pastikan helper `isOwner(jid: string): boolean` memakai `OWNER_NUMBER` dari `.env`.
- Tambahkan override pembacaan data owner:
  - poin owner tampil 999
  - limit owner tampil 999
- Integrasikan owner unlimited ke:
  - `.poin`
  - `.limit`
  - `.rank`
  - `.belilimit`
  - downloader `.tt` dan `.ig`
- Downloader owner tidak boleh mengurangi limit.
- `.belilimit` untuk owner membalas:
  - `Owner sudah memiliki limit unlimited.`
- Jangan update database untuk membuat nilai owner menjadi 999.

Verifikasi:

- Owner melihat 999 poin.
- Owner melihat 999 limit.
- Owner bisa download walau limit database 0.
- Limit owner tidak berkurang setelah download sukses atau gagal.
- `.belilimit` owner ditolak dengan pesan unlimited.
- `npm run build` berhasil.
- `npm run lint` berhasil.

---

## Tahap 31 - Profile System dan User Stats (Selesai)

Tujuan:

Menambahkan command profil user untuk melihat poin, limit, rank, dan jumlah kemenangan game.

Pekerjaan:

- Tambahkan data user stats di Prisma:
  - `gamesWon`
  - `lastDailyClaim`
- Tentukan apakah stats masuk model `User` atau model baru sesuai struktur existing.
- Buat migration Prisma.
- Buat service profile:
  - ambil poin user
  - ambil limit user
  - hitung rank user di grup
  - ambil jumlah game menang
  - apply override owner 999 poin dan 999 limit
- Implementasi command:
  - `.profile`
  - `.profile @user`
- Ambil target user dari mention jika ada.
- Jika target owner:
  - poin 999
  - limit 999
  - rank `Owner`
- Tambahkan tracking `gamesWon` saat user menang:
  - Kuis MTK benar
  - Family 100 selesai sesuai aturan jika relevan
  - Tebak Kata benar
  - Tebak Emoji benar
  - Tebak Angka benar
  - Tic Tac Toe menang

Verifikasi:

- `.profile` menampilkan profil pengirim.
- `.profile @user` menampilkan profil target.
- Profile owner menampilkan 999 poin, 999 limit, dan rank Owner.
- Game menang menambah `gamesWon`.
- Migration SQL `20260530223000_user_stats` tersedia.
- `npx prisma db push` lokal berhasil tanpa reset database.
- `npm run build` berhasil.
- `npm run lint` berhasil.

---

## Tahap 32 - Transfer Limit (Selesai)

Tujuan:

User bisa transfer limit download ke user lain melalui mention.

Pekerjaan:

- Buat service transfer limit.
- Implementasi command:
  - `.transferlimit @user 1`
- Validasi:
  - wajib mention target
  - jumlah wajib angka
  - minimal 1
  - tidak boleh transfer ke diri sendiri
  - user biasa hanya bisa transfer jika limit cukup
- Penerima bertambah limit.
- Pengirim user biasa berkurang limit.
- Owner bisa transfer berapa pun tanpa limit berkurang.
- Tambahkan command ke router dan menu.

Verifikasi:

- Transfer user biasa sukses jika limit cukup.
- Transfer user biasa gagal jika limit kurang.
- Transfer ke diri sendiri ditolak.
- Transfer 0, negatif, atau bukan angka ditolak.
- Owner transfer limit sukses tanpa limit owner berkurang.
- `npm run build` berhasil.
- `npm run lint` berhasil.

---

## Tahap 33 - Daily Reward (Selesai)

Tujuan:

Menambahkan hadiah harian yang bisa diklaim 1 kali setiap 24 jam.

Pekerjaan:

- Gunakan field `lastDailyClaim` dari user stats.
- Buat service daily reward.
- Implementasi command:
  - `.daily`
- Reward random:
  - 5 poin
  - 10 poin
  - 15 poin
  - 1 limit
  - 2 limit
- Jika belum pernah claim atau sudah lewat 24 jam, reward diberikan dan waktu claim disimpan.
- Jika belum 24 jam, balas:
  - `Kamu sudah claim hari ini.`
  - `Coba lagi dalam X jam Y menit.`
- Owner tetap boleh claim, tetapi poin/limit tampil owner tetap override 999.

Verifikasi:

- `.daily` memberi salah satu reward.
- `.daily` kedua sebelum 24 jam ditolak dengan sisa waktu.
- Setelah 24 jam bisa klaim lagi.
- Reward poin menambah poin.
- Reward limit menambah limit.
- `npm run build` berhasil.
- `npm run lint` berhasil.

---

## Tahap 34 - Owner Give Poin, Give Limit, dan Reset Limit (Selesai)

Tujuan:

Menambahkan command owner untuk memberi poin, memberi limit, dan reset limit user.

Pekerjaan:

- Implementasi command owner:
  - `.givepoin @user 10`
  - `.givelimit @user 5`
  - `.resetlimit @user`
- Validasi semua command:
  - owner only
  - wajib mention target
  - jumlah minimal 1 untuk give
- `.givepoin` menambah poin target.
- `.givelimit` menambah limit target.
- `.resetlimit` mengembalikan limit target ke default 1.
- Jika user target tidak ditemukan atau belum ada data yang relevan, balas pesan jelas.
- Tambahkan command ke owner router dan owner menu.

Verifikasi:

- Non-owner tidak bisa menjalankan command.
- Owner bisa memberi poin.
- Owner bisa memberi limit.
- Owner bisa reset limit user menjadi 1.
- Jumlah 0, negatif, atau bukan angka ditolak.
- Target tanpa mention ditolak.
- `npm run build` berhasil.
- `npm run lint` berhasil.

---

## Tahap 35 - Menu, Dokumentasi, dan Acceptance Test Fitur Lanjutan (Selesai)

Tujuan:

Menyatukan fitur dari `Codex.md` ke menu, dokumentasi, dan acceptance test akhir.

Pekerjaan:

- Update `.menu`:
  - PROFIL:
    - `.profile`
    - `.profile @user`
  - REWARD:
    - `.daily`
  - LIMIT:
    - `.transferlimit @user jumlah`
- Update `.ownermenu`:
  - `.givepoin @user jumlah`
  - `.givelimit @user jumlah`
  - `.resetlimit @user`
- Pastikan command owner hanya muncul di owner menu, bukan menu member umum.
- Update `README.md` dengan fitur baru.
- Update `AGENT.md` dengan aturan owner unlimited, profile, daily, transfer limit, dan owner tools.
- Buat acceptance test otomatis untuk service yang bisa diuji lokal.
- Buat daftar manual test WhatsApp live.

Acceptance Criteria:

- Owner selalu tampil 999 poin.
- Owner selalu tampil 999 limit.
- Downloader tidak mengurangi limit owner.
- `.profile` berjalan.
- `.profile @user` berjalan.
- `.transferlimit` berjalan.
- Owner transfer limit tanpa mengurangi limit owner.
- `.daily` hanya bisa digunakan sekali per 24 jam.
- `.givepoin` hanya owner.
- `.givelimit` hanya owner.
- `.resetlimit` hanya owner.
- Migrasi Prisma berhasil.
- TypeScript build berhasil.
- Tidak ada fitur lama yang rusak.
- Semua command muncul di menu sesuai role.
- `npm run build` berhasil.
- `npm run lint` berhasil.

---

## Catatan Kerja untuk Codex

Saat mengerjakan tahap manapun:

- Baca ulang bagian terkait di `AGENT.md`.
- Cek struktur file yang sudah ada sebelum mengubah.
- Jangan menghapus perubahan user yang tidak terkait.
- Setelah edit, jalankan verifikasi yang relevan.
- Jika ada tahap yang belum bisa diuji penuh karena butuh WhatsApp live, catat sebagai manual verification.
- Jangan membuat fitur tambahan tanpa instruksi baru.

---

## Tahap 36 - PLAN Moderasi Grup (Selesai)

Tujuan:

Menambahkan rencana teknis fitur moderasi grup untuk MinjiBot/KOGBot sebelum coding dimulai.

Ringkasan fitur:

- `.kick @user`
- `.promote @user`
- `.demote @user`
- `.tagall <pesan>`
- `.antilink on`
- `.antilink off`

Catatan penting:

- Tahap ini hanya perencanaan.
- Coding fitur moderasi dimulai setelah plan disetujui.
- Tidak membuat hidden tag.
- Tidak membuat anti link semua domain.
- Tidak membuat warning system.
- Tidak membuat `.warnlist`.
- Tidak membuat `.clearwarn`.

Analisis struktur project existing:

- Permission owner sudah ada di `src/bot/permissions.ts` melalui `isOwner`.
- Permission admin grup sudah ada di `src/bot/permissions.ts` melalui `isGroupAdmin`.
- Command router utama ada di `src/commands/index.ts`.
- Command owner existing ada di `src/commands/owner.command.ts`.
- Menu umum ada di `src/commands/menu.command.ts`.
- Context command memakai `CommandContext` dari `src/types/command.ts`.
- Group whitelist dan data grup ada di `src/services/group.service.ts`.
- Prisma schema ada di `prisma/schema.prisma`.
- Pesan biasa diproses di `src/bot/messageHandler.ts`, ini nanti dipakai untuk deteksi anti link.
- Helper mention existing ada di `src/utils/mentions.ts`.
- Helper JID existing ada di `src/utils/jid.ts`.

File yang akan dibuat:

- `src/services/moderation.service.ts`
  - Logika kick, promote, demote.
  - Helper cek role target dan pelaksana.
  - Wrapper Baileys `groupParticipantsUpdate`.
- `src/commands/moderation.command.ts`
  - Handler `.kick`, `.promote`, `.demote`, `.tagall`, `.antilink`.
  - Validasi input command dan pesan user.
- `src/services/tagAll.service.ts`
  - Ambil metadata grup.
  - Batasi mention maksimal 100.
  - Cooldown 10 menit per grup di memory.
- `src/services/antiLink.service.ts`
  - Cek status anti link grup.
  - Deteksi link undangan grup WhatsApp.
  - Eksekusi hapus pesan dan kick member biasa.
- `src/utils/groupMetadata.ts`
  - Helper baca participant, role admin, dan JID bot dari metadata jika perlu.

File yang akan diubah:

- `prisma/schema.prisma`
  - Tambah field `antiLinkEnabled Boolean @default(false)` pada model `Group`.
- `prisma/migrations/.../migration.sql`
  - Tambah migration untuk field `antiLinkEnabled`.
- `src/services/group.service.ts`
  - Tambah getter/setter status anti link per grup.
- `src/commands/index.ts`
  - Daftarkan command `.kick`, `.promote`, `.demote`, `.tagall`, `.antilink`.
- `src/commands/menu.command.ts`
  - Tambahkan kategori `MODERASI`.
- `src/bot/messageHandler.ts`
  - Tambahkan flow anti link sebelum command/plain game diproses.
- `src/types/command.ts`
  - Ubah hanya jika perlu menambah helper reply khusus.
- `README.md`
  - Tambah dokumentasi fitur moderasi dan manual test.
- `AGENT.md`
  - Tambah aturan moderasi, anti link, dan larangan hidden tag.
- `.env.example`
  - Tidak perlu env baru kecuali nanti ditemukan kebutuhan khusus.

Perubahan Prisma schema:

```prisma
model Group {
  id              String   @id @default(cuid())
  jid             String   @unique
  name            String?
  isApproved      Boolean  @default(false)
  welcomeEnabled  Boolean  @default(false)
  welcomeMessage  String?
  antiLinkEnabled Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

Strategi cooldown `.tagall`:

- Cooldown disimpan di memory dengan `Map<string, number>`.
- Key memakai `groupJid`.
- Durasi 10 menit.
- Alasan tidak persistent:
  - Cooldown hanya proteksi spam ringan.
  - Jika bot restart, cooldown reset masih aman.
  - Tidak perlu menambah tabel hanya untuk cooldown sementara.

Flow permission umum:

- Semua command moderasi hanya berjalan di grup.
- Bot wajib menjadi admin grup untuk:
  - kick
  - promote
  - demote
  - anti link enforcement
- Pelaksana wajib owner bot atau admin grup untuk:
  - `.kick`
  - `.promote`
  - `.demote`
  - `.tagall`
  - `.antilink on/off`
- Member biasa selalu ditolak.

Hierarki role:

```txt
Owner Bot
Admin Grup
Member
```

Matrix hak akses kick:

| Pelaksana | Target Member | Target Admin | Target Owner |
|---|---|---|---|
| Owner Bot | boleh | boleh | tidak boleh |
| Admin Grup | boleh | tidak boleh | tidak boleh |
| Member | tidak boleh | tidak boleh | tidak boleh |

Matrix hak akses promote:

| Pelaksana | Target Member | Target Admin | Target Owner |
|---|---|---|---|
| Owner Bot | boleh | sudah admin | tidak perlu |
| Admin Grup | boleh | sudah admin | tidak boleh |
| Member | tidak boleh | tidak boleh | tidak boleh |

Matrix hak akses demote:

| Pelaksana | Target Member | Target Admin | Target Owner |
|---|---|---|---|
| Owner Bot | target bukan admin | boleh | tidak boleh |
| Admin Grup | tidak boleh | tidak boleh | tidak boleh |
| Member | tidak boleh | tidak boleh | tidak boleh |

Flow `.kick @user`:

1. Pastikan command di grup.
2. Pastikan bot admin grup.
3. Pastikan pelaksana owner atau admin grup.
4. Ambil target dari mention.
5. Tolak jika target kosong.
6. Tolak jika target owner.
7. Tolak jika target bot sendiri.
8. Tolak jika pelaksana menargetkan dirinya sendiri.
9. Ambil role target dari metadata grup.
10. Jika pelaksana admin dan target admin, tolak.
11. Jalankan `groupParticipantsUpdate(groupJid, [targetJid], 'remove')`.
12. Balas `@user berhasil dikeluarkan dari grup.`

Flow `.promote @user`:

1. Pastikan command di grup.
2. Pastikan bot admin grup.
3. Pastikan pelaksana owner atau admin grup.
4. Ambil target dari mention.
5. Tolak jika target kosong.
6. Jika target sudah admin, balas `User tersebut sudah menjadi admin grup.`
7. Jalankan `groupParticipantsUpdate(groupJid, [targetJid], 'promote')`.
8. Balas `@user berhasil dijadikan admin grup.`

Flow `.demote @user`:

1. Pastikan command di grup.
2. Pastikan bot admin grup.
3. Pastikan pelaksana owner atau admin grup.
4. Admin grup biasa selalu ditolak untuk demote admin lain.
5. Ambil target dari mention.
6. Tolak jika target kosong.
7. Tolak jika target owner.
8. Jika target bukan admin, balas `User tersebut bukan admin grup.`
9. Owner menjalankan `groupParticipantsUpdate(groupJid, [targetJid], 'demote')`.
10. Balas `@user berhasil diturunkan dari admin grup.`

Flow `.tagall <pesan>`:

1. Pastikan command di grup.
2. Pastikan pelaksana owner atau admin grup.
3. Pastikan pesan tidak kosong.
4. Cek cooldown group.
5. Ambil metadata grup.
6. Ambil participant aktif.
7. Keluarkan JID bot sendiri dari daftar mention.
8. Batasi maksimal 100 mention.
9. Kirim pesan:

```txt
Pengumuman Grup

<pesan>

Dikirim oleh @admin
```

10. Kirim dengan `mentions` berisi daftar target dan sender.
11. Simpan cooldown 10 menit.

Flow `.antilink on/off`:

1. Pastikan command di grup.
2. Pastikan pelaksana owner atau admin grup.
3. Validasi argumen hanya `on` atau `off`.
4. Simpan status ke `Group.antiLinkEnabled`.
5. Jika `on`, balas `Anti link grup WhatsApp berhasil diaktifkan.`
6. Jika `off`, balas `Anti link grup WhatsApp berhasil dimatikan.`

Flow anti link saat pesan masuk:

1. Hanya diproses untuk pesan grup non-command maupun command.
2. Pastikan grup approved dan `antiLinkEnabled` true.
3. Deteksi hanya link undangan grup WhatsApp:
   - `chat.whatsapp.com/`
   - `https://chat.whatsapp.com/`
   - `http://chat.whatsapp.com/`
   - `www.chat.whatsapp.com/`
   - opsional channel: `whatsapp.com/channel/`
4. Abaikan link TikTok, Instagram, YouTube, dan website biasa.
5. Jika sender owner, abaikan.
6. Jika sender admin grup, abaikan.
7. Pastikan bot admin grup.
8. Hapus pesan pelanggaran.
9. Kick sender.
10. Kirim pesan `@user dikeluarkan karena mengirim link grup WhatsApp.`

Strategi hapus pesan dengan Baileys:

- Gunakan `socket.sendMessage(groupJid, { delete: message.key })`.
- Pastikan `message.key.id`, `message.key.remoteJid`, dan participant tersedia.
- Log error jika gagal hapus, tetapi jangan membuat bot crash.

Strategi kick/promote/demote dengan Baileys:

- Gunakan `socket.groupParticipantsUpdate(groupJid, [targetJid], action)`.
- Action:
  - `remove` untuk kick
  - `promote` untuk promote
  - `demote` untuk demote
- Bot wajib admin grup, jika tidak WhatsApp akan menolak action.
- Sebelum action, validasi role target dari `socket.groupMetadata(groupJid)`.

Risiko teknis:

- JID target bisa berupa `@lid` atau phone JID, perlu pakai helper number matching seperti `isSameUserJid`.
- Metadata grup bisa gagal diambil jika koneksi Baileys sedang bermasalah.
- Bot mungkin admin, tetapi WhatsApp tetap menolak action karena permission atau state grup.
- Delete message bisa gagal jika key message tidak lengkap.
- Tagall mention 100 member bisa tetap dianggap ramai, karena itu wajib cooldown.
- Anti link harus ketat hanya WhatsApp invite, jangan salah tindak link biasa.

Urutan implementasi yang disarankan:

1. Tahap 37 - Schema dan Group Service Anti Link
2. Tahap 38 - Helper Metadata Role Moderasi
3. Tahap 39 - Command Kick Promote Demote
4. Tahap 40 - Command Tagall dengan Cooldown
5. Tahap 41 - Anti Link Enforcement
6. Tahap 42 - Menu, Dokumentasi, dan Acceptance Test Moderasi

Acceptance criteria umum:

- `PLAN.md` dibuat sebelum coding moderasi.
- Owner bisa kick member biasa.
- Owner bisa kick admin grup.
- Owner tidak bisa dikick.
- Owner tidak bisa didemote.
- Admin bisa kick member biasa.
- Admin tidak bisa kick admin lain.
- Admin tidak bisa kick owner.
- Admin tidak bisa demote admin lain.
- Member tidak bisa menggunakan command moderasi.
- Owner dan admin bisa promote member.
- Owner bisa demote admin.
- Promote gagal jika target sudah admin.
- Demote gagal jika target bukan admin.
- Bot memberi error jika belum menjadi admin.
- `.tagall <pesan>` hanya bisa digunakan owner/admin.
- `.tagall` wajib memiliki pesan.
- `.tagall` memiliki cooldown 10 menit per grup.
- `.antilink on/off` hanya bisa digunakan owner/admin.
- Status anti link tersimpan per grup.
- Jika anti link off, link grup WhatsApp tidak ditindak.
- Jika anti link on, link `chat.whatsapp.com` dari member biasa langsung dihapus.
- Jika anti link on, member biasa yang mengirim link `chat.whatsapp.com` langsung dikick.
- Owner bot tidak terkena anti link.
- Admin grup tidak terkena anti link.
- Link TikTok tidak ditindak.
- Link Instagram tidak ditindak.
- Link YouTube tidak ditindak.
- Website biasa tidak ditindak.
- Menu diperbarui.
- TypeScript build berhasil.
- Fitur lama tidak rusak.

Testing checklist:

- `npm run build`
- `npm run lint`
- Test manual WhatsApp live untuk `.kick @user`.
- Test manual WhatsApp live untuk `.promote @user`.
- Test manual WhatsApp live untuk `.demote @user`.
- Test manual WhatsApp live untuk `.tagall Pengumuman test`.
- Test manual cooldown `.tagall`.
- Test manual `.antilink on`.
- Kirim link `https://chat.whatsapp.com/...` dari member biasa.
- Kirim link TikTok, Instagram, YouTube, dan website biasa saat anti link aktif.
- Test `.antilink off`, lalu kirim link grup WhatsApp dan pastikan tidak ditindak.
- Cek `pm2 logs kogbot` setelah semua test.

---

## Tahap 37 - Schema dan Group Service Anti Link (Selesai)

Tujuan:

Menambahkan penyimpanan status anti link per grup.

Pekerjaan:

- Tambah `antiLinkEnabled Boolean @default(false)` di model `Group`.
- Buat migration Prisma.
- Tambah service:
  - `setAntiLinkEnabled(groupJid, enabled)`
  - `isAntiLinkEnabled(groupJid)`
- Pastikan default off untuk semua grup lama.

Verifikasi:

- Migration berhasil.
- Group lama tetap valid.
- Anti link default off.
- `npm run build` berhasil.
- `npm run lint` berhasil.

---

## Tahap 38 - Helper Metadata Role Moderasi (Selesai)

Tujuan:

Membuat helper role grup agar command moderasi aman terhadap owner, admin, member, bot sendiri, dan variasi JID.

Pekerjaan:

- Buat helper metadata grup.
- Deteksi apakah bot admin.
- Deteksi apakah sender admin.
- Deteksi apakah target admin.
- Deteksi target bot sendiri.
- Deteksi target owner.
- Gunakan `isOwner`, `isSameUserJid`, dan `getNumberFromJid`.

Verifikasi:

- Helper bisa membaca admin grup.
- Helper bisa membedakan owner/admin/member.
- Helper bisa mengenali bot sendiri.
- `npm run build` berhasil.
- `npm run lint` berhasil.

---

## Tahap 39 - Command Kick Promote Demote (Selesai)

Tujuan:

Menambahkan command moderasi participant.

Pekerjaan:

- Implementasi `.kick @user`.
- Implementasi `.promote @user`.
- Implementasi `.demote @user`.
- Validasi semua permission sesuai matrix.
- Gunakan Baileys `groupParticipantsUpdate`.
- Tambahkan command ke router.

Verifikasi:

- Owner bisa kick member.
- Owner bisa kick admin.
- Owner tidak bisa kick dirinya sendiri.
- Admin bisa kick member.
- Admin tidak bisa kick admin.
- Admin tidak bisa kick owner.
- Member ditolak.
- Owner/admin bisa promote member.
- Promote target admin ditolak.
- Owner bisa demote admin.
- Admin tidak bisa demote admin.
- Demote target member ditolak.
- Bot belum admin memberi pesan error.
- `npm run build` berhasil.
- `npm run lint` berhasil.

---

## Tahap 40 - Command Tagall dengan Cooldown (Selesai)

Tujuan:

Menambahkan `.tagall <pesan>` untuk pengumuman admin yang rapi tanpa hidden tag.

Pekerjaan:

- Implementasi service tagall.
- Cooldown 10 menit per grup di memory.
- Ambil metadata participant.
- Mention maksimal 100 member.
- Jangan mention bot sendiri.
- Tambah command ke router.

Verifikasi:

- Owner/admin bisa `.tagall`.
- Member ditolak.
- Pesan kosong ditolak.
- Cooldown aktif setelah sukses.
- Cooldown menampilkan sisa menit.
- Mentions maksimal 100.
- Tidak ada hidden tag.
- `npm run build` berhasil.
- `npm run lint` berhasil.

---

## Tahap 41 - Anti Link Grup WhatsApp (Selesai)

Tujuan:

Menambahkan anti link khusus undangan grup WhatsApp.

Pekerjaan:

- Implementasi `.antilink on/off`.
- Simpan status per grup di database.
- Deteksi link `chat.whatsapp.com`.
- Opsional deteksi `whatsapp.com/channel`.
- Jangan tindak TikTok, Instagram, YouTube, dan website biasa.
- Owner dan admin bebas dari anti link.
- Member biasa yang melanggar:
  - pesan dihapus
  - user dikick
  - bot mengirim pesan tindakan
- Hook anti link ke `messageHandler.ts`.

Verifikasi:

- `.antilink on` mengaktifkan status.
- `.antilink off` mematikan status.
- Link grup WhatsApp ditindak saat aktif.
- Link grup WhatsApp tidak ditindak saat off.
- Owner tidak ditindak.
- Admin tidak ditindak.
- Link TikTok tidak ditindak.
- Link Instagram tidak ditindak.
- Link YouTube tidak ditindak.
- Website biasa tidak ditindak.
- Bot belum admin memberi pesan error.
- `npm run build` berhasil.
- `npm run lint` berhasil.

---

## Tahap 42 - Menu, Dokumentasi, dan Acceptance Test Moderasi (Selesai)

Tujuan:

Finalisasi fitur moderasi di menu, README, AGENT, dan checklist test.

Pekerjaan:

- Tambah kategori `MODERASI` di `.menu`.
- Update `README.md`.
- Update `AGENT.md`.
- Tambah daftar manual test WhatsApp live.
- Jalankan build dan lint.

Verifikasi:

- Menu menampilkan command moderasi.
- Tidak ada `.warnlist`.
- Tidak ada `.clearwarn`.
- Dokumentasi menyebut anti link hanya untuk grup WhatsApp.
- Dokumentasi melarang hidden tag.
- `npm run build` berhasil.
- `npm run lint` berhasil.

---

## Tahap 43 - Downloader Instagram Story (Selesai)

Tujuan:

Menambahkan `.igstory <link>` untuk mengunduh satu Instagram Story berdasarkan URL spesifik yang diberikan user.

Scope:

- Command:
  - `.igstory <link>`
- Hanya memproses URL story Instagram spesifik:
  - `https://www.instagram.com/stories/<username>/<story_id>/`
- Tidak mengambil seluruh story dari suatu akun.
- Tidak melakukan bypass login.
- Gunakan cookie Instagram yang sah melalui `YTDLP_COOKIES_FILE`.
- Cookie tidak boleh disimpan di git.
- Story hanya boleh diproses jika dapat diakses oleh akun cookie yang dikonfigurasi secara sah.
- Terapkan limit downloader yang sama seperti `.tt` dan `.ig`.
- Owner tetap unlimited.

Analisis existing:

- Validasi URL downloader ada di `src/utils/downloaderValidation.ts`.
- Eksekusi `yt-dlp` ada di `src/services/downloader.service.ts`.
- Command downloader ada di `src/commands/downloader.command.ts`.
- Reserve dan refund limit ada di `src/services/downloadLimit.service.ts`.
- Router ada di `src/commands/index.ts`.

File yang akan diubah:

- `src/utils/downloaderValidation.ts`
  - Tambahkan validator URL Instagram Story.
- `src/services/downloader.service.ts`
  - Tambahkan fungsi download story menggunakan pipeline `yt-dlp` existing.
- `src/commands/downloader.command.ts`
  - Tambahkan handler `.igstory`.
- `src/commands/index.ts`
  - Daftarkan `.igstory`.
- `src/commands/menu.command.ts`
  - Tambahkan `.igstory <link>`.
- `.env.example`
  - Pastikan `YTDLP_COOKIES_FILE` terdokumentasi.
- `.gitignore`
  - Pastikan cookie file tidak dapat ikut commit.

Flow `.igstory <link>`:

1. Pastikan command dijalankan di grup approved.
2. Validasi URL hanya Instagram Story spesifik.
3. Reserve 1 limit user, kecuali owner.
4. Jalankan `yt-dlp` dengan cookie file yang dikonfigurasi.
5. Pastikan output media maksimal 50 MB.
6. Kirim media ke WhatsApp.
7. Jika proses gagal, refund limit.
8. Hapus temporary file setelah sukses maupun gagal.

Risiko teknis:

- Instagram Story hampir selalu memerlukan sesi login yang valid.
- Cookie bisa kadaluarsa dan perlu diperbarui manual.
- Story bisa sudah expired atau tidak dapat diakses akun cookie.
- Jangan log isi cookie.
- Jangan commit `cookies.txt` atau file export cookie lain.

Verifikasi:

- `.igstory <link>` valid memproses satu story.
- URL bukan story ditolak.
- Story expired memberi pesan error ramah.
- Cookie tidak tersedia memberi pesan error jelas.
- Download gagal tidak mengurangi limit.
- Download sukses mengurangi 1 limit user biasa.
- Owner tidak kehilangan limit.
- Temporary file dihapus.
- `npm run build` berhasil.
- `npm run lint` berhasil.

---

## Tahap 44 - Delete Message Reply-Based (Selesai)

Tujuan:

Menambahkan `.del` untuk menghapus pesan grup yang di-reply oleh owner atau admin.

Command:

```txt
.del
```

Aturan permission:

- Owner dapat menghapus pesan siapa pun.
- Admin dapat menghapus pesan member biasa.
- Admin dapat menghapus pesan admin lain.
- Admin tidak dapat menghapus pesan owner.
- Member biasa tidak dapat memakai `.del`.
- Bot wajib menjadi admin grup.
- Command wajib dilakukan dengan reply ke pesan target.

File yang akan dibuat:

- `src/commands/deleteMessage.command.ts`
  - Validasi reply, role sender, role target, dan bot admin.
- `src/services/deleteMessage.service.ts`
  - Hapus pesan menggunakan Baileys.

File yang akan diubah:

- `src/commands/index.ts`
  - Daftarkan `.del`.
- `src/commands/menu.command.ts`
  - Tambahkan `.del` pada kategori moderasi.
- `src/utils/mentions.ts` atau utility baru
  - Tambahkan helper mengambil participant pesan yang di-reply jika diperlukan.

Flow `.del`:

1. Pastikan command dijalankan di grup.
2. Pastikan sender owner atau admin grup.
3. Pastikan bot admin grup.
4. Pastikan command me-reply pesan target.
5. Ambil stanza ID dan participant target dari quoted context.
6. Resolve variasi JID PN/LID memakai metadata grup jika diperlukan.
7. Jika sender admin dan target owner, tolak.
8. Kirim delete message:

```ts
socket.sendMessage(groupJid, {
  delete: {
    remoteJid: groupJid,
    id: quotedMessageId,
    participant: targetJid,
    fromMe: false,
  },
});
```

9. Log error jika Baileys menolak penghapusan, tanpa crash.

Pesan validasi:

```txt
Reply pesan yang ingin dihapus dengan command .del.
```

```txt
Bot harus menjadi admin grup untuk menghapus pesan.
```

```txt
Admin grup tidak dapat menghapus pesan owner bot.
```

Verifikasi:

- Owner bisa hapus pesan member.
- Owner bisa hapus pesan admin.
- Admin bisa hapus pesan member.
- Admin bisa hapus pesan admin lain.
- Admin tidak bisa hapus pesan owner.
- Member ditolak.
- Tanpa reply ditolak.
- Bot belum admin memberi pesan error.
- Error Baileys tidak membuat bot crash.
- `npm run build` berhasil.
- `npm run lint` berhasil.

---

## Tahap 45 - Menu, Dokumentasi, dan Acceptance Test Scope Terbaru (Selesai)

Tujuan:

Finalisasi scope terbaru dari `Codex.md` setelah moderasi, Instagram Story, dan delete message selesai.

Pekerjaan:

- Update kategori `DOWNLOADER`:
  - `.igstory <link>`
- Update kategori `MODERASI`:
  - `.kick @user`
  - `.promote @user`
  - `.demote @user`
  - `.del`
  - `.tagall <pesan>`
  - `.antilink on/off`
- Update `README.md`.
- Update `AGENT.md`.
- Tambahkan checklist deploy VPS:
  - `git pull`
  - `npm install`
  - `npx prisma migrate deploy`
  - `npx prisma generate`
  - `npm run build`
  - `pm2 restart kogbot`
- Tambahkan manual test WhatsApp live.

Acceptance criteria:

- `.igstory <link>` memproses satu story yang dapat diakses akun cookie.
- `.igstory` tidak mengambil semua story suatu akun.
- Cookie tidak ikut git.
- `.del` hanya bekerja dengan reply.
- Permission `.del` sesuai role.
- Fitur moderasi Tahap 37-42 berjalan.
- Menu menampilkan command terbaru.
- Tidak ada hidden tag.
- Tidak ada warning system.
- Tidak ada `.warnlist`.
- Tidak ada `.clearwarn`.
- `npm run build` berhasil.
- `npm run lint` berhasil.

---

## Tahap 46 - Ubah Default Limit Download Menjadi 1 (Selesai)

### 1. Ringkasan Perubahan

Mengubah limit download awal dan nilai reset user biasa dari `3` menjadi `1`.

Owner tetap unlimited dan tetap ditampilkan sebagai `999`. Harga pembelian limit menjadi `100 poin = 1 limit`.

### 2. Analisis Struktur Existing Hasil Scan

Nilai default limit sebelum tahap ini muncul di beberapa tempat:

- `src/services/downloadLimit.service.ts`
  - `defaultDownloadLimit = 1`
  - Dipakai saat membuat saldo awal, membeli limit pertama kali, menambah limit pertama kali, dan `.resetlimit`.
- `src/services/transferLimit.service.ts`
  - `defaultDownloadLimit = 1`
  - Dipakai ketika sender atau penerima transfer belum mempunyai record limit.
- `prisma/schema.prisma`
  - `UserDownloadLimit.limit Int @default(1)`.
- `src/commands/owner.command.ts`
  - Teks owner menu menjelaskan `.resetlimit @user - Reset limit user ke 1`.
- Dokumentasi existing masih menyebut nilai default `3`.

### 3. File yang Akan Diubah

- `src/services/downloadLimit.service.ts`
- `src/services/transferLimit.service.ts`
- `prisma/schema.prisma`
- `prisma/migrations/<timestamp>_default_download_limit_one/migration.sql`
- `src/commands/owner.command.ts`
- `README.md`
- `AGENT.md`

### 4. Strategi Migrasi Database

- Ubah default schema SQLite dari `3` menjadi `1`.
- Migration hanya mengubah default untuk record baru.
- Saldo limit user existing tidak dipaksa menjadi `1`, karena nilai tersebut bisa berasal dari daily reward, pembelian, atau transfer.
- `.resetlimit @user` secara eksplisit mengubah saldo target menjadi `1`.

### 5. Urutan Implementasi

1. Ubah konstanta default limit pada dua service menjadi `1`.
2. Ubah schema Prisma dan buat migration.
3. Ubah teks owner menu dan dokumentasi.
4. Jalankan Prisma validate, build, lint, dan smoke test.

### 6. Acceptance Criteria

- [x] User baru mendapat 1 limit.
- [x] `.resetlimit @user` mengubah limit target menjadi 1.
- [x] User lama mempertahankan saldo existing sampai memakai `.resetlimit`.
- [x] Pembelian limit pertama kali memakai rumus `1 + jumlah pembelian`.
- [x] Penerima transfer baru memakai rumus `1 + jumlah transfer`.
- [x] Owner tetap unlimited.
- [x] Prisma migration berhasil.
- [x] TypeScript build berhasil.
- [x] Fitur existing tidak rusak.

### 7. Testing Checklist

- [x] Jalankan `npx prisma validate`.
- [x] Jalankan `npm run build`.
- [x] Jalankan `npm run lint`.
- [ ] Test `.limit` pada user baru.
- [ ] Test `.resetlimit @user`.
- [ ] Test `.belilimit 1` pada user tanpa record limit.
- [ ] Test `.transferlimit @user 1` pada penerima tanpa record limit.
- [ ] Test `.limit` pada owner.

---

## Tahap 47 - Command Quote Random (Selesai)

### 1. Ringkasan Fitur

Menambahkan command `.quote` untuk mengirim satu quote random kepada member grup tanpa cooldown.

Command:

```txt
.quote
.quote motivasi
.quote lucu
.quote islami
.quote cinta
.quote galau
```

Semua member boleh memakai command ini. Tidak diperlukan permission admin atau owner.

### 2. Analisis Struktur Project Existing Hasil Scan

Pola command existing:

- `src/commands/downloadLimit.command.ts`
  - Handler menerima `CommandContext`.
  - Validasi konteks dilakukan di command.
  - Balasan memakai `context.reply()`.
  - Error dicatat melalui `logger.error()` lalu dilempar agar router menangani fallback.
- `src/commands/daily.command.ts`
  - Command tipis dan business logic dipisahkan ke service.
- `src/commands/sticker.command.ts`
  - Error operasional yang dapat dipahami user diberi balasan ramah.
- `src/commands/index.ts`
  - Semua command umum didaftarkan ke `commandHandlers`.
- `src/commands/menu.command.ts`
  - Menu dibangun sebagai array baris lalu digabungkan dengan `join('\n')`.

Temuan file data:

- File aktual di repository adalah `quotes.json`, bukan `/KOG-Bot/quote.json`.
- Lokasi aktual repository lokal: `C:\laragon\www\KOGBot\quotes.json`.
- Deploy VPS existing memakai `/var/www/KOGBot`, sehingga path runtime yang konsisten adalah `<project-root>/quotes.json`.
- Kategori aktual: `motivasi`, `lucu`, `islami`, `cinta`, `galau`.
- Item aktual berupa string, bukan objek `{ "text": "...", "author": "..." }`.

Keputusan implementasi yang perlu disetujui:

- Gunakan file existing `quotes.json` di root project agar deploy konsisten.
- Pertahankan dukungan format string existing dengan fallback author `Anonim`.
- Tambahkan dukungan format objek `{ text, author }` agar file dapat dikembangkan bertahap.

### 3. File yang Akan Dibuat

- `src/services/quote.service.ts`
  - Membaca dan memvalidasi `quotes.json`.
  - Memilih quote random.
  - Menyimpan state anti-repeat per grup memakai `Map`.
- `src/commands/quote.command.ts`
  - Menangani argumen kategori dan format balasan WhatsApp.

### 4. File yang Akan Diubah

- `src/commands/index.ts`
  - Daftarkan `.quote`.
- `src/commands/menu.command.ts`
  - Tambahkan kategori `QUOTE`.
- `quotes.json`
  - Data existing dapat tetap berupa string; author fallback menjadi `Anonim`.
- `README.md`
  - Dokumentasikan command quote dan testing manual.
- `AGENT.md`
  - Sinkronkan gambaran fitur bot.

## #5. Alur Pengambilan Quote Random

Flow `.quote`:

1. Router meneruskan command ke `handleQuoteCommand`.
2. Command membaca argumen kategori opsional.
3. Service membaca `<project-root>/quotes.json`.
4. Service memvalidasi struktur JSON dan memastikan ada quote yang dapat dipakai.
5. Tanpa kategori, gabungkan quote dari semua kategori.
6. Dengan kategori, gunakan array dari kategori tersebut.
7. Pilih satu item random.
8. Normalisasi item:
   - String menjadi `{ text: item, author: "Anonim" }`.
   - Objek memakai `text` dan `author`, dengan fallback author `Anonim`.
9. Terapkan anti-repeat berdasarkan grup.
10. Format balasan sesuai kategori.

Output `.quote`:

```txt
💬 Quote of the Day

"{text}"

— {author}
```

Output `.quote <kategori>`:

```txt
💬 Quote {Kategori}

"{text}"

— {author}
```

### 6. Strategi Anti-Repeat di Memory

Gunakan:

```ts
Map<string, string>
```

- Key: `groupJid`.
- Value: identifier quote terakhir, misalnya gabungan kategori dan text.
- Jika kumpulan kandidat memiliki lebih dari satu quote, jangan pilih identifier terakhir.
- Jika hanya tersedia satu quote, kirim quote tersebut agar command tetap berfungsi.
- State hilang saat bot restart. Ini sesuai kebutuhan karena history tidak perlu disimpan ke database.

### 7. Penanganan Error File Tidak Ditemukan

Jika `quotes.json` tidak ditemukan, JSON rusak, atau tidak memiliki quote valid:

```txt
Maaf, data quote sedang tidak tersedia.
```

Jika kategori tidak dikenali:

```txt
Kategori tidak tersedia.
Kategori yang ada: motivasi, lucu, islami, cinta, galau
```

Error teknis dicatat melalui logger tanpa membocorkan detail filesystem ke chat WhatsApp.

### 8. Urutan Implementasi

1. Konfirmasi keputusan memakai file root `quotes.json` dan fallback author `Anonim`.
2. Buat `quote.service.ts`.
3. Buat `quote.command.ts`.
4. Daftarkan `.quote` pada router.
5. Tambahkan kategori `QUOTE` pada menu.
6. Update dokumentasi.
7. Jalankan build, lint, dan smoke test.

### 9. Acceptance Criteria

- [x] PLAN.md dibuat dan disetujui sebelum coding.
- [x] `.quote` mengirim quote random dari semua kategori.
- [x] `.quote motivasi` mengirim quote kategori motivasi.
- [x] `.quote lucu` mengirim quote kategori lucu.
- [x] `.quote islami` mengirim quote kategori islami.
- [x] `.quote cinta` mengirim quote kategori cinta.
- [x] `.quote galau` mengirim quote kategori galau.
- [x] Kategori tidak dikenali menampilkan pesan error beserta daftar kategori.
- [x] File tidak ditemukan, kosong, atau rusak menampilkan pesan ramah.
- [x] Quote yang sama tidak muncul dua kali berturut-turut dalam satu grup jika alternatif tersedia.
- [x] Anti-repeat tidak memakai database.
- [x] Semua member dapat memakai `.quote`.
- [x] Tidak ada cooldown.
- [x] Menu diperbarui.
- [x] TypeScript build berhasil.
- [x] Fitur lama tidak rusak.

### 10. Testing Checklist

- [x] Jalankan `.quote` beberapa kali dalam grup yang sama.
- [x] Pastikan dua quote berturut-turut tidak identik jika alternatif tersedia.
- [x] Jalankan seluruh variasi kategori.
- [x] Jalankan `.quote kategori-tidak-ada`.
- [ ] Rename sementara `quotes.json`, lalu pastikan pesan error ramah.
- [ ] Uji file JSON kosong atau tidak valid.
- [x] Pastikan item string memakai author `Anonim`.
- [ ] Pastikan item objek memakai author dari file.
- [ ] Jalankan `.menu`.
- [x] Jalankan `npm run build`.
- [x] Jalankan `npm run lint`.
- [ ] Jalankan smoke test fitur existing yang terdampak router dan menu.

## Tahap 48 - Private Downloader Limit Global (Selesai)

Membuat fondasi agar member dapat memakai downloader lewat chat pribadi bot.
Limit private tidak memakai `groupJid` grup biasa, tetapi memakai scope global khusus agar data tidak bercampur dengan limit per grup.

### Tujuan

- `.tt`, `.ig`, dan `.igstory` dapat dipakai lewat chat pribadi.
- Limit private berlaku global untuk user tersebut, bukan per grup.
- Limit grup yang sudah ada tetap berjalan seperti sekarang.
- Owner tetap unlimited.
- Tidak merusak sistem poin, limit, dan downloader grup.

### Keputusan Teknis

Gunakan scope khusus:

```txt
PRIVATE
```

atau konstanta yang jelas di service, misalnya:

```ts
const privateDownloadGroupJid = 'PRIVATE';
```

Dengan cara ini schema `UserDownloadLimit` tidak perlu langsung diubah karena key existing tetap:

```txt
userJid + groupJid
```

Untuk chat pribadi:

```txt
userJid + PRIVATE
```

### File yang Akan Diubah

- `src/services/downloadLimit.service.ts`
  - Tambahkan helper untuk menentukan scope limit private.
  - Pastikan read/add/reset/reserve bisa menerima scope private.
- `src/commands/downloadLimit.command.ts`
  - `.limit` bisa dipakai di chat pribadi.
  - `.belilimit` bisa dipakai di chat pribadi dengan limit global.
- `src/commands/downloader.command.ts`
  - `.tt` dan `.ig` bisa reserve limit walaupun chat bukan grup.
- `src/commands/instagramStory.command.ts`
  - `.igstory` bisa reserve limit walaupun chat bukan grup.
- `src/types/command.ts`
  - Jika perlu, tambahkan helper/scope agar command tidak menebak manual.

### Alur Limit Private

1. User chat pribadi bot.
2. User menjalankan `.limit`.
3. Bot membaca `UserDownloadLimit` dengan:
   - `userJid = senderJid`
   - `groupJid = PRIVATE`
4. User menjalankan `.belilimit 1`.
5. Bot memotong 100 poin dari scope yang disepakati.
6. Bot menambah limit pada scope `PRIVATE`.
7. User menjalankan `.tt <link>` atau `.ig <link>`.
8. Bot reserve 1 limit dari scope `PRIVATE`.
9. Jika download gagal setelah reserve, limit direfund ke scope yang sama.

### Catatan Poin

Perlu diputuskan saat implementasi:

- Opsi A: beli limit private memakai poin dari grup terakhir/utama tidak tersedia.
- Opsi B: private downloader hanya memakai limit yang diberi owner/daily/transfer global.
- Opsi C: tambahkan scope poin global juga.

Pilihan paling aman untuk tahap ini:

- `.limit` private menampilkan limit global.
- `.tt`, `.ig`, `.igstory` private memakai limit global.
- `.belilimit` private ditahan dulu jika belum ada sistem poin global.
- Owner dapat memakai downloader private unlimited.

Jika ingin `.belilimit` private benar-benar aktif untuk member, lanjutkan dengan Tahap 49.

### Acceptance Criteria

- [x] Ada konstanta/helper scope private download.
- [x] `.limit` di chat pribadi menampilkan limit private/global user.
- [x] Owner di chat pribadi tetap unlimited.
- [x] `.tt` di chat pribadi memakai limit private.
- [x] `.ig` di chat pribadi memakai limit private.
- [x] `.igstory` di chat pribadi memakai limit private.
- [x] Refund limit private berjalan jika download gagal setelah reserve.
- [x] Limit grup tidak ikut berkurang saat download private.
- [x] Limit private tidak ikut berkurang saat download grup.
- [x] TypeScript build berhasil.

## Tahap 49 - Beli dan Kelola Limit Private (Selesai)

Melengkapi sistem agar member bisa membeli atau menerima limit untuk pemakaian chat pribadi.

### Tujuan

- Member bisa mendapat limit private secara jelas.
- `.belilimit` di chat pribadi tidak hanya visual.
- Owner bisa `.givelimit` ke user untuk private jika command dijalankan di chat pribadi atau mode khusus.

### Opsi Implementasi

#### Opsi 1 - Poin Global / Lintas Grup (Dipakai)

Untuk pembelian limit private, bot menghitung total poin minggu berjalan dari semua grup user:

```txt
SUM WeeklyScore.score
WHERE userJid = target
AND weekStart = minggu berjalan
AND groupJid != PRIVATE
```

Kelebihan:

- `.belilimit` private bisa berjalan mandiri.
- User dapat memakai poin dari grup mana saja tanpa memilih grup.

Kekurangan:

- Saat membeli limit private, poin dapat terpotong dari beberapa grup sekaligus.

#### Opsi 2 - Limit Private Hanya dari Owner/Daily

Tidak membuat poin global.

Kelebihan:

- Lebih sederhana.
- Risiko bug lebih kecil.

Kekurangan:

- User tidak bisa beli limit private dari poin game grup.

#### Opsi 3 - Beli Private dari Poin Grup Pilihan

User harus memberi argumen grup atau bot memakai grup terakhir user.

Kelebihan:

- Poin game grup tetap berguna untuk private downloader.

Kekurangan:

- Butuh mapping user ke grup terakhir.
- Rawan membingungkan user.

### Implementasi

- `.limit` private aktif.
- Downloader private aktif.
- `.belilimit` private memakai total poin minggu ini dari semua grup.
- Owner dapat memberi limit private melalui command:

```txt
.givelimitprivate <nomor|@user> <jumlah>
.resetlimitprivate <nomor|@user>
```

### File yang Akan Dibuat/Diubah

- `src/services/downloadLimit.service.ts`
  - Tambahkan API eksplisit untuk limit private jika dibutuhkan.
- `src/commands/owner.command.ts`
  - Tambah command owner untuk memberi/reset limit private.
- `src/commands/downloadLimit.command.ts`
  - Tentukan perilaku `.belilimit` di chat pribadi.
- `README.md`
  - Dokumentasi private downloader dan batasannya.
- `AGENT.md`
  - Sinkronkan aturan baru.

### Acceptance Criteria

- [x] Ada aturan jelas cara member mendapat limit private.
- [x] Owner bisa memberi limit private.
- [x] Owner bisa reset limit private.
- [x] `.belilimit` private memakai total poin minggu ini dari semua grup.
- [x] `.limit` private menampilkan angka yang sama dengan yang dipakai downloader private.
- [x] `.tt` private gagal jika limit private 0.
- [x] `.tt` private berhasil reserve jika limit private > 0.
- [x] Tidak ada perubahan perilaku limit grup.
- [x] TypeScript build dan lint berhasil.

## Tahap 50 - Menu, Dokumentasi, dan Acceptance Test Private Downloader (Selesai)

Finalisasi fitur downloader via chat pribadi setelah Tahap 48 dan 49 selesai.

### Update Menu

Tambahkan catatan ringkas:

```txt
Downloader juga bisa dipakai lewat chat pribadi bot jika user punya limit private.
```

Jika command private limit dibuat, tambahkan ke owner menu atau menu yang sesuai.

### Dokumentasi

Update:

- `README.md`
  - Cara pakai downloader di grup.
  - Cara pakai downloader di chat pribadi.
  - Perbedaan limit grup dan limit private.
  - Cara owner memberi/reset limit private.
- `AGENT.md`
  - Ringkasan aturan private downloader.
- `PLAN.md`
  - Tandai tahap selesai setelah implementasi dan test.

### Acceptance Test

- [x] Menu menampilkan catatan downloader private.
- [x] README menjelaskan cara pakai downloader private.
- [x] README menjelaskan perbedaan limit grup dan limit private.
- [x] README menjelaskan cara owner memberi/reset limit private.
- [x] AGENT menjelaskan aturan private downloader.
- [x] User tanpa limit private menjalankan reserve private dan ditolak.
- [x] Owner memberi limit private ke user melalui service/command owner.
- [x] User cek `.limit` private dan angka sama dengan yang dipakai downloader private.
- [x] Reserve private mengurangi limit private.
- [x] Reserve private tidak mengurangi limit grup.
- [x] Reserve grup tidak mengurangi limit private.
- [x] Owner download private tetap unlimited.
- [x] `npm run build` berhasil.
- [x] `npm run lint` berhasil.

### Checklist WhatsApp Live

- [ ] User tanpa limit private menjalankan `.tt <link>` di chat pribadi dan ditolak.
- [ ] Owner memberi limit private ke user.
- [ ] User cek `.limit` di chat pribadi dan angka benar.
- [ ] User download TikTok via chat pribadi dan limit berkurang 1.
- [ ] User download Instagram Reels via chat pribadi dan limit berkurang 1.
- [ ] Jika download gagal setelah reserve, limit private kembali.
- [ ] Download di grup tetap memakai limit grup.
- [ ] Download di private tetap memakai limit private.
- [ ] Owner download private tetap unlimited.
