Tambahkan fitur baru berikut ke project KOGBot yang sudah ada. Jangan merusak fitur existing dan gunakan struktur project yang sudah ada.

# 1. Owner Unlimited Mode

Implementasikan sistem owner unlimited.

Gunakan OWNER_NUMBER dari file .env.

Buat helper:

```ts
isOwner(jid: string): boolean
```

Aturan:

1. Owner selalu tampil memiliki 999 poin.
2. Owner selalu tampil memiliki 999 limit.
3. Downloader tidak mengurangi limit owner.
4. Owner tidak perlu membeli limit.
5. Jika owner menjalankan `.belilimit`, tampilkan:

```txt
Owner sudah memiliki limit unlimited.
```

6. Jika owner transfer limit ke user lain, limit owner tidak berkurang.
7. Jangan simpan nilai 999 secara permanen di database.
8. Gunakan override saat membaca data.

Command yang harus menampilkan override owner:

```txt
.profile
.poin
.limit
.rank
```

Acceptance Criteria:

* Owner selalu melihat 999 poin.
* Owner selalu melihat 999 limit.
* Owner tetap bisa download walaupun limit database 0.
* Limit owner tidak pernah berkurang.

---

# 2. Profile System

Tambahkan command:

```txt
.profile
.profile @user
```

Tujuan:

Menampilkan statistik user.

Contoh:

```txt
👤 Anthony

🏆 Poin: 250
🎫 Limit: 5
📈 Rank: #2
🎮 Game Menang: 34
```

Jika mention user:

```txt
.profile @user
```

Tampilkan profil user yang di-mention.

Jika target adalah owner:

```txt
👤 Owner

🏆 Poin: 999
🎫 Limit: 999
📈 Rank: Owner
```

---

# 3. Transfer Limit

Tambahkan command:

```txt
.transferlimit @user 1
```

Aturan:

1. User hanya bisa transfer jika limit cukup.
2. Limit pengirim berkurang.
3. Limit penerima bertambah.
4. Tidak boleh transfer ke diri sendiri.
5. Minimal transfer 1 limit.
6. Maksimal transfer sesuai limit yang dimiliki.

Contoh sukses:

```txt
Berhasil transfer 1 limit ke @user.

Sisa limit kamu: 4
```

Contoh gagal:

```txt
Limit kamu tidak mencukupi.
```

Khusus owner:

* Limit owner tidak berkurang.
* Owner bisa transfer berapa pun.

---

# 4. Daily Reward

Tambahkan command:

```txt
.daily
```

Tujuan:

User bisa claim hadiah harian.

Reward random:

```txt
5 poin
10 poin
15 poin
1 limit
2 limit
```

Aturan:

1. Hanya bisa claim 1 kali setiap 24 jam.
2. Simpan waktu claim terakhir.
3. Jika belum 24 jam:

```txt
Kamu sudah claim hari ini.
Coba lagi dalam X jam Y menit.
```

Contoh sukses:

```txt
🎁 Daily Reward

Kamu mendapatkan:
+10 poin
```

atau

```txt
🎁 Daily Reward

Kamu mendapatkan:
+1 limit
```

---

# 5. Give Poin

Command:

```txt
.givepoin @user 10
```

Role:

Owner Only

Aturan:

1. Owner dapat memberi poin ke user.
2. User target harus terdaftar.
3. Nilai minimal 1 poin.

Contoh:

```txt
Berhasil memberikan 10 poin ke @user.
```

Jika bukan owner:

```txt
Command ini hanya bisa digunakan owner.
```

---

# 6. Give Limit

Command:

```txt
.givelimit @user 5
```

Role:

Owner Only

Aturan:

1. Owner dapat memberi limit ke user.
2. Limit owner tidak berkurang.
3. Minimal 1 limit.

Contoh:

```txt
Berhasil memberikan 5 limit ke @user.
```

---

# 7. Reset Limit User

Command:

```txt
.resetlimit @user
```

Role:

Owner Only

Tujuan:

Reset limit user menjadi default.

Default limit:

```txt
3
```

Contoh:

```txt
Limit @user berhasil direset menjadi 3.
```

Jika user tidak ditemukan:

```txt
User tidak ditemukan.
```

---

# 8. Database Changes

Tambahkan data berikut jika belum ada:

## User Stats

```txt
gamesWon
lastDailyClaim
```

Atau model terpisah jika arsitektur project lebih cocok.

Pastikan migrasi Prisma dibuat dengan rapi.

---

# 9. Update Menu

Tambahkan menu berikut:

```txt
👤 PROFIL
.profile
.profile @user

🎁 REWARD
.daily

💸 LIMIT
.transferlimit @user jumlah

👑 OWNER
.givepoin @user jumlah
.givelimit @user jumlah
.resetlimit @user
```

Menu owner hanya tampil untuk owner.

---

# 10. Acceptance Criteria

Fitur dianggap selesai jika:

1. Owner selalu tampil memiliki 999 poin.
2. Owner selalu tampil memiliki 999 limit.
3. Downloader tidak mengurangi limit owner.
4. `.profile` berjalan.
5. `.profile @user` berjalan.
6. `.transferlimit` berjalan.
7. Owner transfer limit tanpa mengurangi limit owner.
8. `.daily` hanya bisa digunakan sekali per 24 jam.
9. `.givepoin` hanya owner.
10. `.givelimit` hanya owner.
11. `.resetlimit` hanya owner.
12. Migrasi Prisma berhasil.
13. TypeScript build berhasil.
14. Tidak ada fitur lama yang rusak.
15. Semua command muncul di menu sesuai role.
