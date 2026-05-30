Saya sudah memiliki project KOGBot, yaitu bot WhatsApp berbasis Node.js + TypeScript + Baileys + Prisma + SQLite.

Tugas Anda adalah menambahkan beberapa game baru ke project yang sudah ada, tanpa mengubah arsitektur utama secara sembarangan dan tanpa merusak fitur yang sudah berjalan.

## Konteks Project

Bot sudah memiliki fitur:

* WhatsApp connection menggunakan Baileys
* Command prefix `.`
* Menu bot
* Role owner, admin grup, dan member
* Whitelist grup
* Sistem poin mingguan
* Kuis MTK
* Family 100
* Downloader TikTok dan Instagram Reels publik
* Welcome member baru

Kuis MTK sekarang sudah diubah menjadi soal hitung cepat sederhana, yaitu hanya berisi:

* Penjumlahan
* Pengurangan
* Perkalian
* Pembagian

Jangan ubah konsep kuis MTK menjadi soal matematika rumit.

## Tujuan Penambahan Fitur

Tambahkan game baru berikut:

1. Tebak Kata Acak
2. Tebak Emoji
3. Tebak Angka
4. Tic Tac Toe

Semua game harus terintegrasi dengan sistem poin mingguan yang sudah ada.

## Aturan Umum Game

Ikuti aturan umum berikut:

1. Jangan merusak fitur yang sudah ada.
2. Jangan menghapus command lama.
3. Jangan mengganti database schema yang sudah ada kecuali benar-benar diperlukan.
4. Jika perlu menambah model Prisma baru, buat migrasi dengan rapi.
5. Gunakan struktur folder existing.
6. Pisahkan logic game ke service masing-masing.
7. Pisahkan command handler berdasarkan game.
8. Semua error harus ditangani dengan pesan yang jelas.
9. Game harus berjalan per grup, bukan global.
10. Game di satu grup tidak boleh mengganggu grup lain.
11. Setiap jenis game hanya boleh punya satu sesi aktif dalam satu grup.
12. Game berbeda boleh aktif bersamaan selama tidak bertabrakan secara logic.
13. Semua game harus bisa dihentikan dengan command menyerah yang spesifik.
14. Jangan membuat fitur spam.
15. Jangan membuat fitur di luar instruksi ini.

## Command yang Harus Ditambahkan

Tambahkan command berikut:

```txt
.tebakkata
.tebakemoji
.tebakangka
.tictactoe @user
.nyerah tebakkata
.nyerah tebakemoji
.nyerah tebakangka
.nyerah tictactoe
```

Tambahkan juga daftar game baru ke `.menu`.

## 1. Tebak Kata Acak

Game Tebak Kata Acak bekerja seperti ini:

* Bot memilih satu kata dari database atau seed data.
* Bot mengacak huruf dari kata tersebut.
* Bot menampilkan huruf acak dan petunjuk kategori.
* Semua member grup boleh menjawab.
* User pertama yang menjawab benar mendapat poin.
* Setelah terjawab benar, game selesai.
* Jika menyerah, bot menampilkan jawaban benar.

Contoh tampilan:

```txt
🎮 Tebak Kata

Huruf acak:
A K N M A A

Petunjuk:
Buah

Jawab langsung di chat.
```

Jika benar:

```txt
✅ Benar, @user!
Jawaban: MANGGA
+10 poin
```

Jika menyerah:

```txt
Game Tebak Kata dihentikan.
Jawaban benar: MANGGA
```

Aturan poin:

```txt
Jawaban benar: 10 poin
Salah jawab: 0 poin, tidak dikurangi
```

Seed data minimal 50 kata.

Contoh kategori:

* Buah
* Hewan
* Benda
* Makanan
* Tempat
* Profesi
* Kendaraan

## 2. Tebak Emoji

Game Tebak Emoji bekerja seperti ini:

* Bot memilih satu soal emoji dari database atau seed data.
* Bot menampilkan kombinasi emoji.
* Semua member boleh menjawab.
* User pertama yang menjawab benar mendapat poin.
* Setelah benar, game selesai.
* Jika menyerah, bot menampilkan jawaban benar.

Contoh tampilan:

```txt
🎮 Tebak Emoji

🐈 + 🐟

Jawabannya apa?
```

Jawaban benar:

```txt
Kucing makan ikan
```

Jika benar:

```txt
✅ Benar, @user!
Jawaban: Kucing makan ikan
+10 poin
```

Jika menyerah:

```txt
Game Tebak Emoji dihentikan.
Jawaban benar: Kucing makan ikan
```

Aturan poin:

```txt
Jawaban benar: 10 poin
Salah jawab: 0 poin, tidak dikurangi
```

Seed data minimal 50 soal emoji.

## 3. Tebak Angka

Game Tebak Angka bekerja seperti ini:

* Bot memilih angka random dari 1 sampai 100.
* Semua member grup boleh menebak.
* Bot memberi petunjuk apakah tebakan terlalu besar atau terlalu kecil.
* User yang menebak benar mendapat poin.
* Setelah benar, game selesai.
* Jika menyerah, bot menampilkan angka yang benar.

Command:

```txt
.tebakangka
```

Contoh tampilan awal:

```txt
🔢 Tebak Angka

Aku menyimpan angka dari 1 sampai 100.
Coba tebak angkanya!
```

Jika tebakan terlalu kecil:

```txt
Terlalu kecil.
```

Jika tebakan terlalu besar:

```txt
Terlalu besar.
```

Jika benar:

```txt
✅ Benar, @user!
Angkanya adalah 47.
+15 poin
```

Jika menyerah:

```txt
Game Tebak Angka dihentikan.
Angka yang benar: 47
```

Aturan poin:

```txt
Jawaban benar: 15 poin
Salah jawab: 0 poin, tidak dikurangi
```

Catatan teknis:

* Simpan angka target di active game payload.
* Validasi jawaban hanya angka.
* Abaikan pesan non-angka saat game aktif.

## 4. Tic Tac Toe

Game Tic Tac Toe adalah game duel 1 lawan 1.

Command:

```txt
.tictactoe @user
```

Aturan:

1. User yang menjalankan command menjadi player X.
2. User yang di-mention menjadi player O.
3. Bot membuat papan 3x3.
4. Player bermain bergantian.
5. Input langkah menggunakan angka 1 sampai 9.
6. Bot menolak langkah dari user yang bukan pemain.
7. Bot menolak langkah jika bukan giliran user tersebut.
8. Bot menolak langkah jika posisi sudah terisi.
9. Jika ada pemenang, game selesai.
10. Jika papan penuh dan tidak ada pemenang, hasil seri.
11. Siapa saja boleh menjalankan `.nyerah tictactoe`, tetapi jika yang menyerah adalah salah satu pemain, lawannya menang.
12. Jika orang luar menjalankan `.nyerah tictactoe`, game dihentikan tanpa pemenang.

Contoh papan:

```txt
❌ Tic Tac Toe

1 | 2 | 3
4 | 5 | 6
7 | 8 | 9

Giliran: @user
Ketik angka 1-9 untuk bermain.
```

Contoh setelah jalan:

```txt
❌ Tic Tac Toe

X | 2 | 3
4 | O | 6
7 | 8 | 9

Giliran: @user
```

Aturan poin:

```txt
Menang: 20 poin
Seri: masing-masing 5 poin
Kalah: 0 poin
```

Jika menang:

```txt
🏆 @user menang Tic Tac Toe!
+20 poin
```

Jika seri:

```txt
🤝 Tic Tac Toe seri.
Masing-masing pemain mendapat +5 poin.
```

## Active Game

Jika project sudah memiliki model ActiveGame, gunakan model tersebut.

Tambahkan type game berikut:

```txt
WORD_SCRAMBLE
EMOJI_GUESS
NUMBER_GUESS
TICTACTOE
```

Payload ActiveGame boleh berupa JSON string.

Contoh payload Tebak Angka:

```json
{
  "targetNumber": 47,
  "startedBy": "628xxxx@s.whatsapp.net"
}
```

Contoh payload Tic Tac Toe:

```json
{
  "playerX": "628xxxx@s.whatsapp.net",
  "playerO": "628yyyy@s.whatsapp.net",
  "turn": "628xxxx@s.whatsapp.net",
  "board": ["", "", "", "", "", "", "", "", ""]
}
```

## Database Seed

Tambahkan seed data untuk:

1. Tebak Kata Acak minimal 50 data
2. Tebak Emoji minimal 50 data

Jika lebih sederhana, data boleh disimpan dalam file TypeScript constant terlebih dahulu. Namun lebih baik jika tetap masuk database melalui Prisma seed agar konsisten dengan kuis dan Family 100.

## Normalisasi Jawaban

Gunakan normalisasi jawaban agar user tidak harus menjawab dengan huruf besar/kecil yang sama.

Aturan normalisasi:

* trim spasi
* lowercase
* ganti spasi berlebih menjadi satu spasi
* boleh mengabaikan tanda baca sederhana

Contoh:

```txt
"  Mangga  " sama dengan "mangga"
"Kucing makan ikan!" sama dengan "kucing makan ikan"
```

## Update Menu

Update `.menu` agar menampilkan game baru:

```txt
🎮 Game
.kuis mtk - Mulai kuis hitung cepat
.family100 - Mulai Family 100
.tebakkata - Tebak kata dari huruf acak
.tebakemoji - Tebak jawaban dari emoji
.tebakangka - Tebak angka 1-100
.tictactoe @user - Main Tic Tac Toe

🏳️ Menyerah
.nyerah kuis
.nyerah family100
.nyerah tebakkata
.nyerah tebakemoji
.nyerah tebakangka
.nyerah tictactoe
```

## Acceptance Criteria

Fitur dianggap selesai jika:

1. `.tebakkata` bisa memulai game Tebak Kata Acak.
2. Jawaban benar Tebak Kata memberi 10 poin.
3. `.nyerah tebakkata` menghentikan game dan menampilkan jawaban.
4. `.tebakemoji` bisa memulai game Tebak Emoji.
5. Jawaban benar Tebak Emoji memberi 10 poin.
6. `.nyerah tebakemoji` menghentikan game dan menampilkan jawaban.
7. `.tebakangka` bisa memulai game angka 1 sampai 100.
8. Bot memberi respons terlalu besar atau terlalu kecil.
9. Jawaban benar Tebak Angka memberi 15 poin.
10. `.nyerah tebakangka` menghentikan game dan menampilkan angka benar.
11. `.tictactoe @user` bisa memulai duel.
12. Tic Tac Toe berjalan bergantian antara dua pemain.
13. Bot menolak input dari user yang bukan pemain.
14. Bot menolak input jika bukan giliran pemain.
15. Bot mendeteksi pemenang Tic Tac Toe.
16. Bot mendeteksi hasil seri Tic Tac Toe.
17. Pemenang Tic Tac Toe mendapat 20 poin.
18. Jika seri, kedua pemain mendapat 5 poin.
19. `.nyerah tictactoe` berjalan sesuai aturan.
20. Semua game terintegrasi dengan sistem poin mingguan existing.
21. Semua game berjalan per grup.
22. Game tidak merusak fitur existing.
23. `.menu` sudah menampilkan command baru.
24. Bot tidak crash saat input salah.
25. Semua perubahan menggunakan TypeScript yang rapi dan type-safe.

## Instruksi Pengerjaan

Kerjakan bertahap:

1. Audit struktur project existing.
2. Identifikasi command handler, active game service, dan score service yang sudah ada.
3. Tambahkan enum/type game baru.
4. Tambahkan seed data Tebak Kata dan Tebak Emoji.
5. Implementasi Tebak Kata.
6. Implementasi Tebak Emoji.
7. Implementasi Tebak Angka.
8. Implementasi Tic Tac Toe.
9. Update menu.
10. Jalankan build.
11. Perbaiki TypeScript error.
12. Pastikan tidak ada fitur lama yang rusak.

Jangan lanjut ke fitur berikutnya kalau fitur sebelumnya belum compile.
