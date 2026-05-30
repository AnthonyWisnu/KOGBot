Saya ingin menambahkan fitur moderasi grup ke project MinjiBot/KOGBot yang sudah ada.

Jangan langsung coding. Tugas pertama Anda adalah membuat file `PLAN.md` yang berisi rencana implementasi teknis, daftar file yang akan diubah, alur permission, database change jika diperlukan, dan acceptance criteria.

Setelah `PLAN.md` selesai, baru lanjut coding jika saya setujui.

# Konteks Project

Bot WhatsApp berbasis:

* Node.js
* TypeScript
* Baileys
* Prisma
* SQLite
* PM2
* VPS Ubuntu

Bot sudah memiliki fitur:

* Whitelist group
* Owner bot
* Admin group permission
* Game
* Poin dan limit
* Downloader TikTok
* Downloader Instagram
* Sticker tools
* Welcome message

Sekarang tambahkan fitur moderasi:

1. `.kick @user`
2. `.promote @user`
3. `.demote @user`
4. `.tagall <pesan>`
5. `.antilink on/off`

# Hierarki Role

Gunakan urutan kekuasaan berikut:

```txt
Owner Bot
Admin Grup
Member
```

Aturan:

1. Owner Bot memiliki hak tertinggi.
2. Admin Grup berada di bawah Owner Bot.
3. Member berada di bawah Admin Grup.

# 1. Kick Member

Command:

```txt
.kick @user
```

## Aturan Izin

### Owner Bot

Owner Bot dapat:

```txt
✅ Kick member biasa
✅ Kick admin grup
❌ Tidak bisa kick dirinya sendiri
```

### Admin Grup

Admin Grup dapat:

```txt
✅ Kick member biasa
❌ Tidak bisa kick admin grup lain
❌ Tidak bisa kick owner bot
❌ Tidak bisa kick dirinya sendiri
```

### Member

Member biasa:

```txt
❌ Tidak bisa menggunakan .kick
```

## Matrix Hak Kick

| Pelaksana  | Target Member | Target Admin | Target Owner |
| ---------- | ------------- | ------------ | ------------ |
| Owner Bot  | ✅             | ✅            | ❌            |
| Admin Grup | ✅             | ❌            | ❌            |
| Member     | ❌             | ❌            | ❌            |

## Validasi

Bot harus:

* Menjadi admin grup
* Berada di grup
* Target wajib di-mention
* Tidak boleh kick dirinya sendiri
* Tidak boleh kick owner bot

Jika target tidak disebut:

```txt
Gunakan format:
.kick @user
```

Jika bot belum admin:

```txt
Bot harus menjadi admin grup untuk menggunakan fitur kick.
```

Jika user bukan admin/owner:

```txt
Command ini hanya bisa digunakan oleh admin grup atau owner bot.
```

Jika target owner:

```txt
Owner bot tidak dapat dikeluarkan.
```

Jika admin mencoba kick admin lain:

```txt
Admin grup tidak dapat mengeluarkan admin grup lain.
Hanya owner bot yang memiliki izin tersebut.
```

Jika target adalah bot sendiri:

```txt
Bot tidak dapat mengeluarkan dirinya sendiri.
```

Jika sukses:

```txt
@user berhasil dikeluarkan dari grup.
```

# 2. Promote Member

Command:

```txt
.promote @user
```

## Aturan Izin

### Owner Bot

```txt
✅ Bisa promote member menjadi admin
```

### Admin Grup

```txt
✅ Bisa promote member menjadi admin
```

### Member

```txt
❌ Tidak bisa menggunakan .promote
```

Bot wajib menjadi admin grup.

Jika target tidak disebut:

```txt
Gunakan format:
.promote @user
```

Jika bot belum admin:

```txt
Bot harus menjadi admin grup untuk menggunakan fitur promote.
```

Jika target sudah admin:

```txt
User tersebut sudah menjadi admin grup.
```

Jika sukses:

```txt
@user berhasil dijadikan admin grup.
```

# 3. Demote Admin

Command:

```txt
.demote @user
```

## Aturan Izin

### Owner Bot

```txt
✅ Bisa demote admin grup
```

### Admin Grup

```txt
❌ Tidak bisa demote admin lain
```

### Member

```txt
❌ Tidak bisa menggunakan .demote
```

Bot wajib menjadi admin grup.

Owner Bot tidak boleh didemote.

Jika target tidak disebut:

```txt
Gunakan format:
.demote @user
```

Jika bot belum admin:

```txt
Bot harus menjadi admin grup untuk menggunakan fitur demote.
```

Jika target owner:

```txt
Owner bot tidak dapat didemote.
```

Jika admin mencoba demote admin lain:

```txt
Admin grup tidak dapat menurunkan admin lain.
Hanya owner bot yang memiliki izin tersebut.
```

Jika target bukan admin:

```txt
User tersebut bukan admin grup.
```

Jika sukses:

```txt
@user berhasil diturunkan dari admin grup.
```

# 4. Tag All

Command:

```txt
.tagall <pesan>
```

Catatan:

WhatsApp sekarang sudah memiliki fitur bawaan seperti `@all`, `@everyone`, atau `@semua`. Jadi jangan membuat hidden tag yang spammy atau menipu.

Fitur `.tagall` hanya digunakan untuk membantu admin membuat pengumuman grup yang rapi.

## Aturan

* Hanya owner bot dan admin grup yang boleh menggunakan command ini.
* Bot harus berada di grup.
* Wajib ada pesan setelah command.
* Cooldown 10 menit per grup.
* Mention seluruh member melalui metadata mentions.
* Jangan mention bot sendiri.
* Jangan mention user yang sudah keluar.
* Jika member lebih dari 100, batasi maksimal 100 mention.
* Jangan membuat fitur hidden tag yang spammy.

Contoh command:

```txt
.tagall Rapat jam 20.00
```

Format output:

```txt
📢 Pengumuman Grup

Rapat jam 20.00

Dikirim oleh @admin
```

Jika pesan kosong:

```txt
Gunakan format:
.tagall <pesan>
```

Jika cooldown:

```txt
Tagall masih cooldown.
Coba lagi dalam X menit.
```

Jika bukan admin/owner:

```txt
Command ini hanya dapat digunakan admin grup atau owner bot.
```

# 5. Anti Link Grup WhatsApp

Command:

```txt
.antilink on
.antilink off
```

Anti link yang dimaksud bukan anti semua link, tetapi hanya anti link grup WhatsApp.

Jangan mendeteksi atau menindak link:

* TikTok
* Instagram
* YouTube
* Website biasa
* Link downloader lain

## Aturan

1. Hanya owner bot atau admin grup yang boleh mengaktifkan/mematikan fitur ini.
2. Status anti link disimpan per grup.
3. Default anti link adalah off.
4. Bot wajib menjadi admin grup agar bisa menghapus pesan dan kick user.
5. Jika anti link aktif, bot hanya mendeteksi link undangan grup WhatsApp.
6. Owner bot dan admin grup tidak terkena anti link.
7. Member biasa yang mengirim link grup WhatsApp langsung ditindak:

   * Hapus pesan yang berisi link
   * Kick user dari grup
8. Tidak perlu sistem warning.
9. Tidak perlu `.warnlist`.
10. Tidak perlu `.clearwarn`.

## Pola Link yang Harus Dideteksi

Deteksi minimal:

```txt
chat.whatsapp.com/
https://chat.whatsapp.com/
http://chat.whatsapp.com/
www.chat.whatsapp.com/
```

Opsional, jika ingin sekalian anti channel WhatsApp:

```txt
whatsapp.com/channel/
https://whatsapp.com/channel/
https://www.whatsapp.com/channel/
```

## Tindakan Jika Melanggar

Jika member biasa mengirim link grup WhatsApp:

1. Bot menghapus pesan tersebut.
2. Bot mengeluarkan user dari grup.
3. Bot mengirim pesan:

```txt
@user dikeluarkan karena mengirim link grup WhatsApp.
```

Jika bot belum admin:

```txt
Bot harus menjadi admin grup agar anti link dapat menghapus pesan dan mengeluarkan member.
```

Jika format salah:

```txt
Gunakan format:
.antilink on
.antilink off
```

Saat aktif:

```txt
Anti link grup WhatsApp berhasil diaktifkan.
```

Saat nonaktif:

```txt
Anti link grup WhatsApp berhasil dimatikan.
```

# Database

Jika belum ada, tambahkan field pada model Group:

```txt
antiLinkEnabled Boolean default false
```

Untuk `.tagall`, jika perlu menyimpan cooldown secara persistent, tambahkan model atau field yang sesuai. Jika tidak perlu persistent, cooldown boleh disimpan di memory, tetapi jelaskan alasannya di PLAN.md.

Jangan membuat model warning karena anti link langsung kick tanpa warning.

# Update Menu

Tambahkan ke bagian ADMIN atau MODERASI:

```txt
👮 MODERASI

.kick @user - Keluarkan member
.promote @user - Jadikan admin
.demote @user - Turunkan admin
.tagall <pesan> - Pengumuman ke semua member
.antilink on/off - Anti link grup WhatsApp
```

Jangan tambahkan:

```txt
.warnlist
.clearwarn
```

karena sistem warning tidak digunakan.

# PLAN.md

Buat `PLAN.md` terlebih dahulu.

Isi `PLAN.md` minimal:

1. Ringkasan fitur yang akan ditambahkan
2. Analisis struktur project existing
3. File yang akan dibuat
4. File yang akan diubah
5. Perubahan Prisma schema
6. Flow permission owner/admin/member
7. Matrix hak akses kick/promote/demote
8. Flow tagall
9. Flow anti link grup WhatsApp
10. Strategi hapus pesan dengan Baileys
11. Strategi kick user dengan Baileys
12. Risiko teknis
13. Urutan implementasi
14. Acceptance criteria
15. Testing checklist

# Acceptance Criteria

Fitur dianggap selesai jika:

1. `PLAN.md` dibuat terlebih dahulu.
2. Owner bisa kick member biasa.
3. Owner bisa kick admin grup.
4. Owner tidak bisa dikick.
5. Owner tidak bisa didemote.
6. Admin bisa kick member biasa.
7. Admin tidak bisa kick admin lain.
8. Admin tidak bisa kick owner.
9. Admin tidak bisa demote admin lain.
10. Member tidak bisa menggunakan command moderasi.
11. Owner dan admin bisa promote member.
12. Owner bisa demote admin.
13. Promote gagal jika target sudah admin.
14. Demote gagal jika target bukan admin.
15. Bot memberi error jika belum menjadi admin.
16. `.tagall <pesan>` hanya bisa digunakan owner/admin.
17. `.tagall` wajib memiliki pesan.
18. `.tagall` memiliki cooldown 10 menit per grup.
19. `.antilink on/off` hanya bisa digunakan owner/admin.
20. Status anti link tersimpan per grup.
21. Jika anti link off, link grup WhatsApp tidak ditindak.
22. Jika anti link on, link `chat.whatsapp.com` dari member biasa langsung dihapus.
23. Jika anti link on, member biasa yang mengirim link `chat.whatsapp.com` langsung dikick.
24. Owner bot tidak terkena anti link.
25. Admin grup tidak terkena anti link.
26. Link TikTok tidak ditindak.
27. Link Instagram tidak ditindak.
28. Link YouTube tidak ditindak.
29. Website biasa tidak ditindak.
30. Menu diperbarui.
31. TypeScript build berhasil.
32. Fitur lama tidak rusak.

# Larangan

Jangan membuat fitur hidden tag yang spammy.

Jangan membuat anti link untuk semua domain.

Jangan membuat sistem warning.

Jangan membuat `.warnlist`.

Jangan membuat `.clearwarn`.

Jangan langsung coding sebelum `PLAN.md` selesai.

Jangan mengubah fitur lama yang tidak terkait.
