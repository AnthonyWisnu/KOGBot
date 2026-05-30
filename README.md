# KOGBot

KOGBot adalah project bot WhatsApp berbasis Node.js dan TypeScript untuk grup pribadi kecil. Nama bot runtime saat ini memakai `BOT_NAME=MinjiBot`.

## Fitur Utama

- Whitelist grup oleh owner
- Menu bot
- Kuis MTK
- Family 100
- Tebak Kata
- Tebak Emoji
- Tebak Angka
- Tic Tac Toe
- Poin grup dan leaderboard
- Profile user, jumlah kemenangan game, dan rank
- Welcome member baru dan pesan perpisahan member keluar
- Downloader TikTok publik via `yt-dlp`
- Downloader Instagram Reels publik via `yt-dlp`
- Gambar jadi sticker dengan reply `.s`
- Sticker jadi gambar dengan reply `.gambar`
- Limit downloader per user per grup
- Transfer limit antar user
- Daily reward 1 kali per 24 jam
- Owner unlimited poin dan limit
- Reset poin manual oleh owner dengan konfirmasi
- Owner tools untuk give poin, give limit, dan reset limit

## Setup Lokal

Install dependency:

```bash
npm install
```

Salin `.env.example` menjadi `.env`, lalu isi `OWNER_NUMBER` dengan format internasional tanpa tanda `+`.

Contoh:

```env
OWNER_NUMBER=628xxxxxxxxxx
```

Generate Prisma client:

```bash
npm run prisma:generate
```

Jalankan migration:

```bash
npm run prisma:migrate
```

Isi seed data:

```bash
npm run seed
```

Jalankan mode development:

```bash
npm run dev
```

Scan QR WhatsApp yang tampil di terminal. Session akan tersimpan di folder `sessions/`.

## Build Production

```bash
npm run build
npm start
```

## Deployment VPS Ubuntu dengan PM2

Install dependency OS:

```bash
sudo apt update
sudo apt install git curl build-essential ffmpeg python3-pip pipx -y
pipx ensurepath
source ~/.bashrc
pipx install yt-dlp
yt-dlp --version
```

Install Node.js 20 atau lebih baru, lalu install PM2:

```bash
npm install -g pm2
```

Install dependency project:

```bash
npm install
```

Siapkan `.env`:

```bash
cp .env.example .env
nano .env
```

Contoh isi penting:

```env
BOT_NAME=MinjiBot
BOT_PREFIX=.
OWNER_NUMBER=628xxxxxxxxxx
DATABASE_URL=file:./dev.db
SESSION_DIR=./sessions
TEMP_DIR=./temp
MAX_DOWNLOAD_MB=50
YTDLP_BINARY=yt-dlp
TIMEZONE=Asia/Jakarta
```

Generate Prisma client, migration, dan seed:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run seed
```

Build project:

```bash
npm run build
```

Start dengan PM2:

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

Melihat log:

```bash
pm2 logs kogbot
```

Restart setelah update:

```bash
npm install
npm run prisma:generate
npm run build
pm2 restart kogbot
```

## Catatan Operasional

- Jangan commit file `.env`.
- Jangan commit isi folder `sessions/`.
- Jangan commit isi folder `temp/`.
- Gunakan nomor WhatsApp second khusus bot.
- Bot hanya aktif di grup yang sudah menjalankan `.approvegroup` atau `.approvegrup` oleh owner.
- Downloader hanya mendukung TikTok publik dan Instagram Reels publik.
- Instagram Story dan Instagram private tidak didukung.
- Setiap download sukses memakai 1 limit. Download gagal tidak mengurangi limit.
- Owner selalu tampil memiliki 999 poin dan 999 limit tanpa menyimpan nilai 999 permanen di database.
- Poin tidak direset otomatis. Reset poin hanya manual oleh owner dengan `.resetpoin` lalu `.confirmresetpoin`.

## Manual Test WhatsApp Live

Jalankan setelah bot berhasil login dan masuk ke grup uji:

1. Owner menjalankan `.approvegroup`, lalu member menjalankan `.menu`.
2. Cek game baru: `.tebakkata`, `.tebakemoji`, `.tebakangka`, `.tictactoe @user`.
3. Jawab benar pada tiap game dan cek poin dengan `.poin` serta `.rank`.
4. Jalankan `.nyerah kuis`, `.nyerah family100`, `.nyerah tebakkata`, `.nyerah tebakemoji`, `.nyerah tebakangka`, dan `.nyerah tictactoe`.
5. Reply pesan game aktif dengan teks persis `nyerah`. Pastikan teks seperti `aku nyerah` diabaikan.
6. Cek `.limit`, lalu `.belilimit <jumlah>` dengan poin cukup dan tidak cukup.
7. Cek `.profile`, lalu `.profile @user`. Pastikan owner tampil 999 poin, 999 limit, dan rank Owner.
8. Jalankan `.transferlimit @user 1`. Pastikan pengirim berkurang dan penerima bertambah.
9. Jalankan `.daily` dua kali. Klaim pertama berhasil, klaim kedua menampilkan sisa waktu.
10. Test `.tt <link>` dan `.ig <link>` publik. Pastikan limit hanya berkurang setelah video berhasil dikirim.
11. Reply gambar dengan `.s`, lalu reply sticker dengan `.gambar`.
12. Aktifkan `.welcome on`, lalu test member masuk dan keluar.
13. Owner menjalankan `.resetpoin`, lalu `.confirmresetpoin` dalam 30 detik.
14. Owner menjalankan `.givepoin @user 10`, `.givelimit @user 5`, dan `.resetlimit @user`.
15. Cek `pm2 logs kogbot` dan pastikan tidak ada crash.
