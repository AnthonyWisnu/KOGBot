# Deskripsi Project MinjiBot

MinjiBot adalah bot WhatsApp berbasis Node.js yang dibuat untuk membantu aktivitas grup WhatsApp, terutama dalam hiburan, pengelolaan anggota, sistem poin, downloader media, dan fitur administrasi grup. Bot ini berjalan menggunakan nomor WhatsApp khusus bot dan di-host pada VPS DigitalOcean agar dapat aktif selama 24 jam.

Project ini dibuat untuk kebutuhan grup pribadi atau komunitas kecil. Bot dapat digunakan untuk memainkan beberapa game interaktif, mengelola poin dan limit download, mengunduh media dari TikTok dan Instagram, mengubah gambar menjadi sticker, mengubah sticker menjadi gambar, serta membantu admin dalam mengatur grup.

## Teknologi yang Digunakan

Project MinjiBot menggunakan beberapa teknologi utama, yaitu:

* Node.js sebagai runtime utama bot.
* TypeScript untuk membuat kode lebih rapi dan aman.
* Baileys sebagai library koneksi WhatsApp.
* Prisma sebagai ORM untuk mengelola database.
* SQLite sebagai database lokal.
* PM2 untuk menjalankan bot secara otomatis di VPS.
* yt-dlp untuk membantu proses downloader media.
* Ubuntu 24.04 sebagai sistem operasi VPS.
* DigitalOcean sebagai layanan hosting VPS.

## Tujuan Project

Tujuan utama MinjiBot adalah menyediakan bot WhatsApp yang ringan, fleksibel, dan mudah digunakan untuk grup. Bot ini tidak hanya berfungsi sebagai bot hiburan, tetapi juga sebagai alat bantu admin grup.

Dengan adanya MinjiBot, anggota grup dapat bermain game, mengumpulkan poin, membeli limit download, mengunduh media, membuat sticker, serta menggunakan fitur interaktif lainnya. Di sisi lain, admin grup dapat menggunakan bot untuk mengelola anggota, menghapus pesan, mengaktifkan anti link grup WhatsApp, dan mengirim pengumuman ke semua anggota.

## Sistem Akses dan Role

MinjiBot memiliki beberapa tingkat akses pengguna, yaitu:

1. Owner Bot
   Owner adalah pemilik utama bot. Owner memiliki akses tertinggi dan dapat menggunakan seluruh fitur bot, termasuk fitur khusus seperti reset poin, memberi poin, memberi limit, kick admin, demote admin, dan fitur administrasi lainnya.

2. Admin Grup
   Admin grup dapat menggunakan fitur moderasi seperti kick member, promote member, tagall, menghapus pesan, mengatur welcome message, dan mengaktifkan anti link grup WhatsApp.

3. Member
   Member biasa dapat menggunakan fitur umum seperti bermain game, melihat poin, melihat limit, membeli limit, mengunduh media jika memiliki limit, membuat sticker, dan melihat menu bot.

## Fitur Utama MinjiBot

### 1. Menu Bot

Command:

```text
.menu
```

Fitur ini digunakan untuk menampilkan daftar fitur yang tersedia di dalam bot. Menu berisi daftar command game, poin, limit, downloader, media, welcome, dan fitur admin.

### 2. Sistem Whitelist Grup

Bot hanya dapat digunakan pada grup yang sudah diizinkan oleh owner. Jika bot masuk ke grup baru, owner perlu mengaktifkan bot terlebih dahulu dengan command:

```text
.approvegroup
```

Fitur ini berguna agar bot tidak bisa digunakan sembarangan di grup lain tanpa izin owner.

### 3. Game Grup

MinjiBot memiliki beberapa game yang bisa dimainkan oleh anggota grup.

#### Kuis Matematika

Command:

```text
.kuis mtk
```

Game ini berisi soal matematika sederhana seperti penjumlahan, pengurangan, perkalian, dan pembagian. User yang menjawab benar akan mendapatkan poin.

#### Family 100

Command:

```text
.family100
```

Game ini meminta anggota grup menebak jawaban dari pertanyaan yang memiliki beberapa kemungkinan jawaban. Setiap jawaban memiliki nilai poin berbeda.

#### Tebak Kata Acak

Command:

```text
.tebakkata
```

Bot akan memberikan huruf acak dan petunjuk kategori. Anggota grup harus menebak kata yang benar.

#### Tebak Emoji

Command:

```text
.tebakemoji
```

Bot akan menampilkan kombinasi emoji, lalu anggota grup harus menebak maksud dari emoji tersebut.

#### Tebak Angka

Command:

```text
.tebakangka
```

Bot akan menyimpan angka acak dari 1 sampai 100. Anggota grup harus menebak angka tersebut. Bot akan memberi petunjuk apakah tebakan terlalu besar atau terlalu kecil.

#### Tic Tac Toe

Command:

```text
.tictactoe @user
```

Game ini dimainkan oleh dua orang dalam grup. Pemain bermain secara bergantian sampai ada pemenang atau hasil seri.

### 4. Sistem Menyerah Game

Jika game belum selesai, user dapat menghentikan game dengan command:

```text
.nyerah [nama game]
```

Contoh:

```text
.nyerah kuis
.nyerah family100
.nyerah tebakkata
.nyerah tebakemoji
.nyerah tebakangka
.nyerah tictactoe
```

Bot juga mendukung sistem reply untuk menyerah. Jika game masih aktif dan user mencoba memulai game yang sama, bot akan me-reply pesan game terakhir. User bisa membalas pesan tersebut dengan kata:

```text
nyerah
```

Maka bot akan otomatis menghentikan game yang sesuai.

### 5. Sistem Poin

Setiap user dapat memperoleh poin dari game. Poin digunakan sebagai nilai aktivitas anggota dalam grup dan dapat ditukar menjadi limit download.

Command untuk cek poin:

```text
.poin
```

Command untuk melihat ranking grup:

```text
.rank
```

Owner memiliki mode unlimited, sehingga poin owner dapat ditampilkan sebagai 999.

### 6. Sistem Limit Download

Limit digunakan untuk memakai fitur downloader. Setiap download yang berhasil akan mengurangi 1 limit user.

Command cek limit:

```text
.limit
```

Command beli limit:

```text
.belilimit <jumlah>
```

Contoh:

```text
.belilimit 3
```

Jika aturan yang digunakan adalah 10 poin = 1 limit, maka untuk membeli 3 limit dibutuhkan 30 poin.

Owner memiliki limit unlimited, sehingga limit owner dapat ditampilkan sebagai 999 dan tidak akan berkurang saat menggunakan downloader.

### 7. Profile User

Command:

```text
.profile
.profile @user
```

Fitur ini digunakan untuk melihat profil user, seperti poin, limit, ranking, dan statistik game.

Contoh penggunaan:

```text
.profile
.profile @user
```

### 8. Transfer Limit

Command:

```text
.transferlimit @user <jumlah>
```

Fitur ini digunakan untuk mengirim limit ke anggota lain.

Contoh:

```text
.transferlimit @user 2
```

Jika berhasil, limit pengirim akan berkurang dan limit penerima akan bertambah. Khusus owner, transfer limit tidak mengurangi limit owner.

### 9. Daily Reward

Command:

```text
.daily
```

Fitur ini digunakan untuk mengambil hadiah harian. Reward dapat berupa poin atau limit. User hanya bisa claim daily reward satu kali dalam 24 jam.

### 10. Give Poin

Command:

```text
.givepoin @user <jumlah>
```

Fitur ini hanya bisa digunakan oleh owner. Command ini digunakan untuk memberikan poin secara manual kepada user.

Contoh:

```text
.givepoin @user 50
```

### 11. Give Limit

Command:

```text
.givelimit @user <jumlah>
```

Fitur ini hanya bisa digunakan oleh owner. Command ini digunakan untuk memberikan limit secara manual kepada user.

Contoh:

```text
.givelimit @user 5
```

### 12. Reset Limit

Command:

```text
.resetlimit @user
```

Fitur ini hanya bisa digunakan oleh owner. Command ini digunakan untuk mengembalikan limit user ke nilai default.

### 13. Downloader TikTok

Command:

```text
.tt <link>
```

Fitur ini digunakan untuk mengunduh video TikTok. Setiap download berhasil akan mengurangi 1 limit user. Jika download gagal, limit tidak berkurang.

Contoh:

```text
.tt https://vt.tiktok.com/xxxx
```

### 14. Downloader Instagram

Command:

```text
.ig <link>
```

Fitur ini digunakan untuk mengunduh Instagram Reels atau video Instagram. Fitur ini menggunakan cookies Instagram agar proses download lebih stabil.

Contoh:

```text
.ig https://www.instagram.com/reel/xxxx
```

### 15. Downloader Instagram Story

Command yang direncanakan:

```text
.igstory <link>
```

Fitur ini digunakan untuk mengunduh Instagram Story berdasarkan link story yang disalin dari Instagram. Bot hanya akan mengunduh story sesuai link yang diberikan, bukan semua story dari akun tersebut.

Contoh:

```text
.igstory https://www.instagram.com/stories/username/story_id
```

### 16. Sticker Maker

Command:

```text
.s
```

Fitur ini digunakan untuk mengubah gambar menjadi sticker. Cara penggunaannya adalah user me-reply gambar, lalu mengetik command `.s`.

Contoh:

```text
.s
```

### 17. Sticker to Image

Command:

```text
.gambar
```

Fitur ini digunakan untuk mengubah sticker menjadi gambar. Cara penggunaannya adalah user me-reply sticker, lalu mengetik command `.gambar`.

### 18. Welcome Message

Command:

```text
.welcome on
.welcome off
.setwelcome <pesan>
```

Fitur ini digunakan untuk mengatur pesan sambutan saat ada anggota baru masuk grup.

Contoh:

```text
.setwelcome Selamat datang @user di @group
```

Placeholder yang dapat digunakan:

```text
@user
@group
```

### 19. Kick Member

Command:

```text
.kick @user
```

Fitur ini digunakan untuk mengeluarkan anggota dari grup. Bot harus menjadi admin grup agar fitur ini dapat digunakan.

Aturan:

* Owner dapat kick member dan admin grup.
* Admin grup hanya dapat kick member biasa.
* Admin grup tidak dapat kick owner.
* Admin grup tidak dapat kick admin lain.
* Member biasa tidak dapat menggunakan command ini.

### 20. Promote Member

Command:

```text
.promote @user
```

Fitur ini digunakan untuk menjadikan member sebagai admin grup. Command ini hanya dapat digunakan oleh owner atau admin grup.

### 21. Demote Admin

Command:

```text
.demote @user
```

Fitur ini digunakan untuk menurunkan admin menjadi member biasa. Owner dapat demote admin grup. Admin biasa tidak dapat demote admin lain.

### 22. Delete Message

Command:

```text
.del
```

Fitur ini digunakan untuk menghapus pesan tertentu di grup. Cara penggunaannya adalah admin atau owner me-reply pesan yang ingin dihapus, lalu mengetik `.del`.

Aturan:

* Owner dapat menghapus pesan siapa pun.
* Admin dapat menghapus pesan member biasa dan admin lain.
* Admin tidak dapat menghapus pesan owner.
* Member biasa tidak dapat menggunakan fitur ini.
* Bot harus menjadi admin grup.

### 23. Tag All

Command:

```text
.tagall <pesan>
```

Fitur ini digunakan untuk membuat pengumuman ke seluruh anggota grup. Bot akan mengirim pesan pengumuman dan mention anggota melalui metadata mentions.

Contoh:

```text
.tagall Rapat jam 20.00
```

Format output:

```text
📢 Pengumuman Grup

Rapat jam 20.00

Dikirim oleh @admin
```

Fitur ini hanya dapat digunakan oleh owner dan admin grup. Fitur ini memiliki cooldown agar tidak digunakan secara berlebihan.

### 24. Anti Link Grup WhatsApp

Command:

```text
.antilink on
.antilink off
```

Fitur ini digunakan untuk mencegah anggota mengirim link undangan grup WhatsApp.

Anti link hanya mendeteksi link seperti:

```text
chat.whatsapp.com/
https://chat.whatsapp.com/
http://chat.whatsapp.com/
www.chat.whatsapp.com/
```

Fitur ini tidak mendeteksi link TikTok, Instagram, YouTube, atau website biasa.

Aturan:

* Jika anti link aktif dan member biasa mengirim link grup WhatsApp, bot akan menghapus pesan tersebut dan mengeluarkan user dari grup.
* Owner dan admin grup tidak terkena anti link.
* Bot harus menjadi admin grup agar dapat menghapus pesan dan mengeluarkan user.
* Tidak menggunakan sistem warning.

## Cara Menggunakan Bot

1. Masukkan nomor bot ke grup WhatsApp.
2. Jadikan bot sebagai admin grup jika ingin memakai fitur moderasi.
3. Owner menjalankan command:

```text
.approvegroup
```

4. Setelah grup disetujui, user dapat mengetik:

```text
.menu
```

5. Pilih fitur yang ingin digunakan dari menu bot.

## Contoh Menu Bot

```text
*MinjiBot Menu*

🎮 *GAME*
.kuis mtk - Kuis matematika
.family100 - Family 100
.tebakkata - Tebak kata acak
.tebakemoji - Tebak dari emoji
.tebakangka - Tebak angka 1-100
.tictactoe @user - Duel 1v1

_Nyerah game: .nyerah [nama game]_
_Contoh: .nyerah kuis_

🏆 *POIN & LIMIT*
.poin - Cek poin kamu
.rank - Ranking grup
.limit - Cek limit download
.belilimit <jumlah> - Beli limit
.profile - Cek profil
.transferlimit @user <jumlah> - Transfer limit
.daily - Ambil hadiah harian

📥 *DOWNLOADER*
.tt <link> - Download TikTok
.ig <link> - Download Instagram Reels
.igstory <link> - Download Instagram Story

🖼 *MEDIA*
.s - Reply gambar jadi sticker
.gambar - Reply sticker jadi gambar

👋 *ADMIN*
.welcome on/off - Atur welcome
.setwelcome <pesan> - Ubah welcome

👮 *MODERASI*
.kick @user - Keluarkan member
.promote @user - Jadikan admin
.demote @user - Turunkan admin
.del - Hapus pesan reply
.tagall <pesan> - Pengumuman ke semua member
.antilink on/off - Anti link grup WhatsApp

_Prefix: ._
_Setiap download memakai 1 limit._
```

## Kesimpulan

MinjiBot adalah bot WhatsApp multifungsi yang dibuat untuk kebutuhan grup pribadi atau komunitas kecil. Bot ini menggabungkan fitur hiburan, sistem poin, limit download, downloader media, sticker tools, welcome message, dan moderasi grup.

Project ini cocok digunakan untuk grup yang ingin memiliki bot interaktif, ringan, dan dapat berjalan 24 jam melalui VPS. Dengan menggunakan Node.js, TypeScript, Baileys, Prisma, SQLite, PM2, dan yt-dlp, bot ini dapat dikembangkan secara modular dan mudah ditambah fitur baru di masa depan.
