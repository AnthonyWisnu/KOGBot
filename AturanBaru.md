Tambahkan perubahan fitur berikut ke project KOGBot yang sudah ada.

## Tujuan Perubahan

Saya ingin meningkatkan sistem game aktif, surrender, dan sistem poin-limit.

Perubahan utama:

1. Game aktif harus menyimpan message id dari pesan game terakhir.
2. Jika user mencoba memulai game yang sama padahal masih aktif, bot harus reply ke pesan game aktif terakhir.
3. User bisa membalas pesan game aktif tersebut dengan teks `nyerah` untuk menghentikan game.
4. Command `.nyerah ...` boleh tetap ada, tetapi user tidak wajib mengetik command panjang.
5. Game berbeda tetap boleh aktif bersamaan dalam satu grup.
6. Hapus sistem reset poin mingguan otomatis.
7. Reset poin hanya boleh dilakukan manual oleh owner.
8. Tambahkan sistem limit downloader.
9. Poin bisa dipakai untuk membeli limit.
10. Limit dipakai untuk download TikTok dan Instagram Reels.

## Aturan Game Aktif

Dalam satu grup, setiap jenis game hanya boleh punya satu sesi aktif.

Contoh:

* Jika Kuis MTK aktif, user tidak bisa mulai Kuis MTK baru.
* Jika Tebak Kata aktif, user tidak bisa mulai Tebak Kata baru.
* Jika Family 100 aktif, user tidak bisa mulai Family 100 baru.
* Namun Kuis MTK, Family 100, Tebak Kata, Tebak Emoji, Tebak Angka, dan Tic Tac Toe boleh aktif bersamaan karena beda jenis game.

## Simpan Message ID Game

Update model ActiveGame agar menyimpan message id dari pesan utama game.

Jika model ActiveGame sudah ada, tambahkan field:

```txt
messageId String?
```

Jika perlu, tambahkan juga:

```txt
lastPromptMessageId String?
```

Gunakan field ini untuk menyimpan id pesan bot yang menampilkan game aktif.

Contoh data ActiveGame:

```json
{
  "groupJid": "120xxxx@g.us",
  "type": "QUIZ_MTK",
  "messageId": "ABC123",
  "payload": "{...}"
}
```

## Saat User Mencoba Memulai Game yang Sama

Jika user mengetik command game yang sama saat game itu masih aktif, bot jangan hanya mengirim pesan biasa.

Bot harus reply ke pesan game aktif terakhir.

Contoh:

User mengetik:

```txt
.kuis mtk
```

Padahal Kuis MTK masih aktif.

Bot reply ke pesan kuis terakhir:

```txt
Kuis MTK masih aktif.
Reply pesan ini dengan "nyerah" kalau ingin menghentikan game ini.
```

Untuk Family 100:

```txt
Family 100 masih aktif.
Reply pesan ini dengan "nyerah" kalau ingin menghentikan game ini.
```

Untuk Tebak Kata:

```txt
Tebak Kata masih aktif.
Reply pesan ini dengan "nyerah" kalau ingin menghentikan game ini.
```

Untuk Tebak Emoji:

```txt
Tebak Emoji masih aktif.
Reply pesan ini dengan "nyerah" kalau ingin menghentikan game ini.
```

Untuk Tebak Angka:

```txt
Tebak Angka masih aktif.
Reply pesan ini dengan "nyerah" kalau ingin menghentikan game ini.
```

Untuk Tic Tac Toe:

```txt
Tic Tac Toe masih aktif.
Reply pesan ini dengan "nyerah" kalau ingin menghentikan game ini.
```

## Reply-Based Surrender

Tambahkan handler untuk membaca pesan reply.

Jika user membalas pesan bot yang berhubungan dengan game aktif, dan isi pesan user adalah:

```txt
nyerah
```

Maka bot harus menghentikan game yang sesuai.

Aturan deteksi:

1. Hanya proses jika pesan user adalah reply.
2. Hanya proses jika isi pesan setelah dinormalisasi sama dengan `nyerah`.
3. Jangan proses jika hanya mengandung kata nyerah dalam kalimat panjang.
4. Cocokkan quoted message id dengan `messageId` atau `lastPromptMessageId` pada ActiveGame.
5. Jika cocok, hentikan game tersebut.
6. Jika tidak cocok, abaikan.

Normalisasi:

```txt
trim
lowercase
hapus spasi berlebih
```

Contoh valid:

```txt
nyerah
Nyerah
 NYERAH 
```

Contoh tidak valid:

```txt
aku nyerah deh
nyerah dong
menyerah
```

## Output Saat Reply Nyerah

Jika user reply `nyerah` ke game aktif, bot harus menampilkan jawaban atau hasil akhir sesuai jenis game.

Contoh Kuis MTK:

```txt
Game Kuis MTK dihentikan.
Jawaban benar: C. 96
```

Contoh Family 100:

```txt
Family 100 dihentikan.

Jawaban:
1. Kompor - 40 poin
2. Piring - 25 poin
3. Sendok - 20 poin
4. Pisau - 15 poin
```

Contoh Tebak Kata:

```txt
Game Tebak Kata dihentikan.
Jawaban benar: MANGGA
```

Contoh Tebak Emoji:

```txt
Game Tebak Emoji dihentikan.
Jawaban benar: Kucing makan ikan
```

Contoh Tebak Angka:

```txt
Game Tebak Angka dihentikan.
Angka yang benar: 47
```

Contoh Tic Tac Toe:

```txt
Game Tic Tac Toe dihentikan.
```

Jika yang menyerah adalah salah satu pemain Tic Tac Toe, lawannya menang dan mendapat poin.

## Command Surrender Lama Tetap Ada

Command lama jangan dihapus.

Command ini tetap harus berjalan:

```txt
.nyerah kuis
.nyerah family100
.nyerah tebakkata
.nyerah tebakemoji
.nyerah tebakangka
.nyerah tictactoe
```

Namun sekarang user juga bisa reply pesan game dengan:

```txt
nyerah
```

## Hapus Reset Mingguan Otomatis

Hapus sistem reset poin mingguan otomatis.

Jangan ada cron reset mingguan.

Poin tidak perlu otomatis reset setiap Senin.

Reset poin hanya boleh dilakukan owner secara manual.

Command owner:

```txt
.resetpoin
```

Aturan:

1. Hanya owner yang boleh menjalankan `.resetpoin`.
2. Reset poin hanya untuk grup tempat command dijalankan.
3. Bot harus minta konfirmasi agar tidak salah reset.

Alur:

Owner mengetik:

```txt
.resetpoin
```

Bot membalas:

```txt
Yakin ingin reset semua poin di grup ini?
Ketik .confirmresetpoin dalam 30 detik untuk melanjutkan.
```

Owner mengetik:

```txt
.confirmresetpoin
```

Bot membalas:

```txt
Semua poin di grup ini berhasil direset.
```

Jika bukan owner:

```txt
Command ini hanya bisa digunakan oleh owner bot.
```

## Sistem Limit Downloader

Tambahkan sistem limit untuk downloader.

Limit digunakan untuk:

```txt
.tt <link>
.ig <link>
```

Setiap berhasil download video, limit user berkurang 1.

Jika download gagal, limit tidak boleh berkurang.

Jika user tidak punya limit, bot menolak download.

Pesan jika limit habis:

```txt
Limit download kamu habis.
Kumpulkan poin dari game, lalu beli limit dengan .belilimit.
```

## Poin untuk Membeli Limit

Tambahkan command:

```txt
.belilimit
.belilimit <jumlah>
.limit
```

Aturan konversi:

```txt
10 poin = 1 limit download
```

Contoh:

User mengetik:

```txt
.belilimit 3
```

Berarti membutuhkan:

```txt
30 poin
```

Jika poin cukup:

```txt
Berhasil membeli 3 limit download.
Poin terpakai: 30
Sisa poin: 70
Limit sekarang: 3
```

Jika poin tidak cukup:

```txt
Poin kamu belum cukup.
Butuh 30 poin untuk membeli 3 limit.
Poin kamu sekarang: 20
```

Jika user mengetik:

```txt
.limit
```

Bot membalas:

```txt
Limit download kamu: 3
Poin kamu: 70
```

## Default Limit

Tambahkan default limit untuk user baru.

Aturan default:

```txt
User baru mendapat 3 limit download gratis.
```

Jika user belum pernah tercatat di database, buat user dengan:

```txt
score: 0
downloadLimit: 3
```

Jika struktur user dan score dipisah, simpan limit di model yang paling sesuai.

## Database Perubahan

Jika sudah ada model User atau WeeklyScore, sesuaikan dengan struktur existing.

Tambahkan field atau model untuk menyimpan limit.

Opsi yang disarankan:

```txt
UserDownloadLimit
```

Fields:

```txt
id
userJid
groupJid
limit
createdAt
updatedAt
```

Limit dibuat per grup, karena poin juga dihitung per grup.

Tambahkan juga model pending reset poin jika perlu:

```txt
PendingResetPoint
```

Fields:

```txt
id
groupJid
requestedBy
expiresAt
createdAt
```

Atau simpan pending confirmation di memory jika lebih sederhana, tetapi pastikan tidak mengganggu flow utama.

## Update Menu

Update `.menu` agar menampilkan fitur limit:

```txt
⬇️ Downloader
.tt <link> - Download video TikTok publik, memakai 1 limit
.ig <link> - Download Instagram Reels publik, memakai 1 limit
.limit - Cek limit download
.belilimit <jumlah> - Beli limit download dengan poin

💰 Poin & Limit
.poin - Cek poin kamu
.rank - Lihat ranking poin
.belilimit <jumlah> - 10 poin = 1 limit
```

Update owner menu:

```txt
👑 Owner Menu
.resetpoin - Reset semua poin di grup ini
```

Hapus informasi reset mingguan dari menu, README, dan dokumentasi lain.

## Acceptance Criteria

Perubahan dianggap selesai jika:

1. ActiveGame menyimpan message id pesan game aktif.
2. Jika user memulai game yang sama saat masih aktif, bot reply ke pesan game aktif terakhir.
3. User bisa reply pesan game dengan `nyerah`.
4. Reply `nyerah` menghentikan game yang sesuai.
5. Reply `nyerah` tidak memengaruhi game lain yang berbeda jenis.
6. Command `.nyerah ...` tetap berjalan.
7. Game berbeda tetap bisa aktif bersamaan dalam satu grup.
8. Cron reset mingguan dihapus.
9. Reset poin hanya bisa dilakukan owner.
10. Reset poin membutuhkan konfirmasi.
11. Downloader TikTok mengurangi 1 limit hanya jika berhasil.
12. Downloader Instagram Reels mengurangi 1 limit hanya jika berhasil.
13. Jika download gagal, limit tidak berkurang.
14. Jika limit habis, bot menolak download.
15. User bisa cek limit dengan `.limit`.
16. User bisa beli limit dengan `.belilimit <jumlah>`.
17. Konversi 10 poin = 1 limit berjalan.
18. User baru mendapat 3 limit gratis.
19. Menu sudah diperbarui.
20. Build TypeScript berhasil tanpa error.
21. Fitur lama tidak rusak.

## Instruksi Pengerjaan

Kerjakan bertahap:

1. Audit struktur ActiveGame existing.
2. Tambahkan penyimpanan message id game.
3. Implementasikan reply-based surrender.
4. Pastikan command `.nyerah ...` lama tetap bekerja.
5. Hapus cron reset mingguan.
6. Tambahkan reset poin manual owner dengan konfirmasi.
7. Tambahkan model atau field untuk download limit.
8. Implementasikan `.limit`.
9. Implementasikan `.belilimit <jumlah>`.
10. Integrasikan limit ke downloader TikTok dan Instagram.
11. Update menu dan owner menu.
12. Jalankan migration.
13. Jalankan build.
14. Perbaiki semua TypeScript error.
15. Uji manual setiap game dan downloader.

Jangan mengubah fitur lain di luar instruksi ini.
