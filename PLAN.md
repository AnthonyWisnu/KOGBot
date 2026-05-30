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
  - 10 poin = 1 limit download.
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
- `.resetlimit` mengembalikan limit target ke default 3.
- Jika user target tidak ditemukan atau belum ada data yang relevan, balas pesan jelas.
- Tambahkan command ke owner router dan owner menu.

Verifikasi:

- Non-owner tidak bisa menjalankan command.
- Owner bisa memberi poin.
- Owner bisa memberi limit.
- Owner bisa reset limit user menjadi 3.
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
