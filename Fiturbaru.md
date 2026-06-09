Tambahkan fitur HD Foto dan HD AI Foto untuk KOGBot/MinjiBot, sekaligus integrasikan .hdai dengan sistem limit existing.

Konteks project:

* Project adalah bot WhatsApp berbasis Node.js, TypeScript, Baileys, Prisma, dan SQLite.
* Struktur project sudah modular dengan folder src/commands, src/services, src/utils, src/types, src/bot, dan prisma.
* Project sudah memiliki sistem limit existing untuk downloader melalui service downloadLimit.
* Limit existing saat ini dipakai oleh .tt, .ig, dan .igstory.
* Mulai sekarang limit harus dianggap sebagai limit fitur berat, bukan hanya limit download video.
* Jangan membuat sistem limit baru khusus .hdai.
* Gunakan service limit existing agar .belilimit, .daily, .givelimit, .resetlimit, .transferlimit, dan private limit tetap berlaku untuk .hdai.
* Jangan membuat file besar. Ikuti single responsibility principle.
* Jangan mengubah fitur lama yang tidak terkait.
* Jangan gunakan em dash.
* Jangan gunakan emoji baru di kode, komentar, atau pesan bot.
* Semua pesan bot menggunakan Bahasa Indonesia.
* Semua error harus ditangani dengan try/catch dan logger yang sudah ada.
* Jalankan npm run build dan npm run lint setelah implementasi.

Tujuan fitur:
Menambahkan fitur peningkatan kualitas foto agar user bisa:

1. Reply foto dengan command .hd
2. Kirim foto dengan caption .hd
3. Reply foto dengan command .hd doc
4. Kirim foto dengan caption .hd doc
5. Reply foto dengan command .hdai
6. Kirim foto dengan caption .hdai
7. Reply foto dengan command .hdai doc
8. Kirim foto dengan caption .hdai doc

Konsep fitur:

* .hd = enhance cepat dan ringan menggunakan sharp.
* .hd doc = enhance cepat dan kirim hasil sebagai document.
* .hdai = AI upscale dengan hasil lebih bagus tetapi lebih lambat.
* .hdai doc = AI upscale dan kirim hasil sebagai document.
* .hd tidak memakai limit fitur.
* .hd doc tidak memakai limit fitur.
* .hdai wajib memakai 1 limit fitur.
* .hdai doc wajib memakai 1 limit fitur.
* Owner tetap unlimited mengikuti behavior limit existing.
* Hasil harus kompatibel untuk WhatsApp Android dan iPhone.
* Hasil harus auto-orient, tidak rusak rotasi, dan output harus memakai format umum seperti JPEG atau PNG.
* Mode AI tidak boleh membuat bot terlalu berat, jadi wajib memakai queue.

Keputusan teknis wajib:

* Maksimal input foto: 7 MB.
* .hd menggunakan upscale 2x.
* .hdai menggunakan upscale 4x.
* .hd boleh digunakan semua user dengan cooldown ringan.
* .hdai memakai limit fitur dan queue.
* .hdai sebaiknya dibatasi untuk owner, premium, atau user yang memiliki limit fitur.
* Jika sistem premium belum final, buat helper placeholder yang mudah dikembangkan nanti.
* Output default dikirim sebagai image agar mudah dilihat.
* Mode doc mengirim hasil sebagai document agar kualitas lebih terjaga dari kompresi WhatsApp.

Command yang harus dibuat:

* .hd
* .hd doc
* .hdai
* .hdai doc

Aturan penggunaan:

1. .hd

   * Bisa dipakai dengan reply ke foto.
   * Bisa dipakai sebagai caption foto.
   * Menggunakan enhance cepat.
   * Upscale output 2x.
   * Output default sebagai image/jpeg.
   * Tidak memakai limit fitur.
   * Memakai cooldown ringan, misalnya 15 sampai 30 detik per user.

2. .hd doc

   * Sama seperti .hd.
   * Tidak memakai limit fitur.
   * Output dikirim sebagai document agar kualitas lebih aman.
   * Filename: hd-photo.jpg.
   * Mimetype: image/jpeg.

3. .hdai

   * Bisa dipakai dengan reply ke foto.
   * Bisa dipakai sebagai caption foto.
   * Menggunakan AI upscale.
   * Upscale output 4x.
   * Wajib memakai 1 limit fitur.
   * Wajib masuk queue.
   * Output default sebagai image/jpeg atau image/png yang aman untuk Android dan iPhone.
   * Lebih lambat daripada .hd.
   * Jika user tidak memiliki limit fitur, command ditolak sebelum masuk queue.

4. .hdai doc

   * Sama seperti .hdai.
   * Wajib memakai 1 limit fitur.
   * Wajib masuk queue.
   * Output dikirim sebagai document agar kualitas lebih aman.
   * Filename: hdai-photo.png atau hdai-photo.jpg.
   * Mimetype harus sesuai.

Pesan bantuan jika tidak ada media:
Gunakan command ini dengan cara:

* reply foto lalu ketik .hd
* kirim foto dengan caption .hd
* reply foto lalu ketik .hdai
* kirim foto dengan caption .hdai

Jika media bukan foto:
Command ini hanya bisa digunakan untuk foto.

Jika ukuran foto lebih dari 7 MB:
Ukuran foto terlalu besar. Maksimal 7 MB.

Jika limit fitur habis saat .hdai:
Limit fitur kamu habis.
Kumpulkan poin dari game, lalu beli limit dengan .belilimit.

Jika dependency AI belum siap:
Fitur HD AI belum siap di server.

Jika proses gagal:
Gagal memproses foto. Coba lagi nanti.

Kompatibilitas Android dan iPhone:

* Pastikan hasil akhir dapat dibuka dengan baik di WhatsApp Android dan iPhone.
* Gunakan auto-rotate berdasarkan EXIF/orientation.
* Konversi output preview ke format aman seperti JPEG.
* Untuk document, gunakan ekstensi file dan mimetype yang benar.
* Jangan menghasilkan file dengan metadata atau format yang rawan tidak terbaca di iPhone.
* Pastikan rotasi gambar tetap benar.
* Pastikan warna tidak berubah aneh.
* Jika input punya alpha/transparency, hasil tetap aman. Untuk output JPEG, background boleh dibuat putih jika perlu.

==================================================
BAGIAN 1 - STRUKTUR FILE
========================

File baru yang perlu dibuat:

* src/commands/hd.command.ts
* src/services/imageEnhance.service.ts
* src/services/imageAiUpscale.service.ts
* src/services/hdQueue.service.ts
* src/utils/mediaTarget.ts

Jika lebih rapi, boleh buat subfolder:

* src/services/hd/imageEnhance.service.ts
* src/services/hd/imageAiUpscale.service.ts
* src/services/hd/hdQueue.service.ts

File yang perlu diubah:

* src/commands/index.ts
* src/commands/menu.command.ts
* src/commands/downloadLimit.command.ts jika perlu mengubah wording limit
* README.md
* AGENT.md atau PLAN.md jika project memakai dokumen kerja internal

Dependency:

* Tambahkan sharp untuk mode .hd.
* Mode .hdai menggunakan Real-ESRGAN atau engine AI upscale gratis yang realistis untuk dipanggil dari CLI.
* Jika dependency AI belum tersedia, jangan membuat bot crash. Bot harus memberi pesan bahwa fitur HD AI belum siap di server.

==================================================
BAGIAN 2 - DETEKSI TARGET MEDIA
===============================

Buat helper di src/utils/mediaTarget.ts untuk mengambil target foto dari:

1. Quoted/reply message.
2. Current message dengan caption .hd atau .hdai.

Aturan:

* Prioritaskan quoted image jika command adalah reply.
* Jika command berupa caption pada image, gunakan image dari current message.
* Abaikan video, sticker, document, dan audio untuk versi awal.
* Jika media bukan image, tolak.
* Helper harus bisa digunakan ulang oleh .hd dan .hdai.

Helper harus mengembalikan minimal:

* sourceType: quoted atau current.
* mimeType.
* fileLength jika tersedia.
* buffer atau data yang dibutuhkan untuk download media.
* informasi filename jika tersedia.

Catatan penting:

* Jangan hanya mengandalkan text command biasa.
* Command harus bisa berjalan ketika user mengirim foto dengan caption .hd.
* Command juga harus bisa berjalan ketika user reply foto lalu mengetik .hd.

==================================================
BAGIAN 3 - MODE .HD CEPAT
=========================

Teknologi:

* Gunakan sharp.
* Jangan klaim ini AI.
* Ini adalah enhance cepat dan ringan.

Implementasi .hd:

* Download image ke buffer atau temp file.
* Validasi ukuran maksimal 7 MB.
* Auto orient dengan rotate().
* Resize 2x dari dimensi asli.
* Gunakan kernel yang bagus seperti lanczos3.
* Tambahkan sharpen ringan.
* Tambahkan normalisasi ringan jika perlu, tetapi jangan berlebihan.
* Pertahankan hasil tetap natural.
* Output default ke JPEG berkualitas tinggi, misalnya quality 90 sampai 95.
* Jika gambar memiliki transparency dan output JPEG, gunakan background putih jika diperlukan.
* Nama file hasil: hd-photo.jpg.

Batas aman:

* Jika hasil 2x menjadi terlalu besar, beri batas dimensi maksimum pada sisi terpanjang, misalnya 4096 px atau 5000 px.
* Jelaskan keputusan batas dimensi dengan komentar singkat di kode.
* Jangan membuat hasil output terlalu besar sampai membuat WhatsApp atau server berat.

Output:

* .hd mengirim sebagai image/jpeg.
* .hd doc mengirim sebagai document dengan mimetype image/jpeg.

Cooldown:

* Tambahkan cooldown ringan untuk .hd dan .hd doc, misalnya 15 sampai 30 detik per user.
* Cooldown cukup in-memory untuk versi awal.
* Owner boleh bypass cooldown jika pola project existing mendukung.

==================================================
BAGIAN 4 - MODE .HDAI
=====================

Teknologi:

* Gunakan Real-ESRGAN sebagai solusi AI upscale gratis jika memungkinkan.
* Karena project ini Node.js, pendekatan paling aman adalah memanggil binary/CLI dari proses eksternal.
* Jika Real-ESRGAN belum terinstall, bot harus membalas:
  Fitur HD AI belum siap di server.
* Jangan membuat bot crash jika binary AI tidak ditemukan.

Ekspektasi hasil:

* Upscale output 4x.
* Hasil lebih bagus daripada .hd.
* Lebih lambat daripada .hd.
* Wajib memakai queue.
* Wajib memakai 1 limit fitur.

Queue:

* Buat queue sederhana in-memory.
* Maksimal 1 job AI berjalan dalam satu waktu.
* Jika ada job lain, user mendapat pesan:
  Permintaan HD AI sedang antre.
  Posisi antrean kamu: <n>
* Saat giliran diproses, bot boleh mengirim:
  Sedang memproses foto HD AI. Mohon tunggu, proses ini lebih lama.
* Setelah selesai, kirim hasil.
* Jika gagal, kirim pesan error ramah dan refund limit jika limit sudah di-reserve.

Akses:

* Siapkan helper canUseHdAi(context).
* Owner selalu bisa.
* Jika nanti ada premium, mudah ditambahkan.
* Untuk versi awal, jangan hardcode logic premium di banyak file.
* Buat placeholder yang rapi dan beri komentar TODO untuk integrasi premium.

Output:

* .hdai mengirim sebagai image/jpeg atau image/png yang kompatibel.
* .hdai doc mengirim sebagai document.
* Filename: hdai-photo.png atau hdai-photo.jpg.
* Mimetype harus sesuai.

Cooldown:

* Tambahkan cooldown lebih ketat untuk .hdai, misalnya 2 sampai 5 menit per user.
* Cooldown dilakukan sebelum proses berat.
* Jangan reserve limit jika user masih cooldown.

==================================================
BAGIAN 5 - INTEGRASI LIMIT FITUR UNTUK .HDAI
============================================

Konsep:

* Limit existing sekarang harus dipahami sebagai limit fitur berat.
* Fitur berat saat ini:

  * .tt
  * .ig
  * .igstory
  * .hdai
  * .hdai doc
* Jangan membuat tabel limit baru.
* Gunakan service limit existing.

Aturan limit:

* .hd tidak mengurangi limit.
* .hd doc tidak mengurangi limit.
* .hdai memakai 1 limit fitur jika berhasil.
* .hdai doc memakai 1 limit fitur jika berhasil.
* Owner tetap unlimited mengikuti behavior existing.
* Jika .hdai gagal karena download media gagal, dependency AI belum siap, proses AI error, queue error, atau sendMessage gagal, limit harus direfund.
* Jika input bukan foto, ukuran lebih dari 7 MB, user masih cooldown, atau queue penuh, jangan reserve limit.
* Jika user tidak punya limit, tolak sebelum masuk queue.

Integrasi teknis:

* Di hd.command.ts, gunakan getDownloadLimitScope(context) untuk menentukan scope limit.
* Gunakan reserveDownloadLimit sebelum memasukkan job .hdai ke queue.
* Simpan flag reservedLimit agar bisa refund jika proses gagal.
* Gunakan refundReservedDownloadLimit jika job gagal.
* Untuk private chat, gunakan scope private existing.
* Untuk grup, gunakan groupJid sebagai scope seperti downloader existing.

Flow .hdai yang benar:

1. Validasi target media foto.
2. Validasi ukuran maksimal 7 MB.
3. Cek cooldown.
4. Cek apakah queue menerima job baru.
5. Reserve 1 limit fitur.
6. Jika reserve gagal, balas:
   Limit fitur kamu habis.
   Kumpulkan poin dari game, lalu beli limit dengan .belilimit.
7. Masukkan job ke queue.
8. Proses AI upscale.
9. Kirim hasil.
10. Jika sukses, hapus temp file dan jangan refund limit.
11. Jika gagal, refund limit dan hapus temp file.

Queue penuh:

* Jika queue terlalu panjang, misalnya lebih dari 5 job pending, tolak request.
* Jangan reserve limit jika queue penuh.
* Pesan:
  Antrean HD AI sedang penuh. Coba lagi nanti.

Update wording user-facing:

* Jangan lagi menyebut limit ini sebagai limit download saja pada konteks .hdai.
* Gunakan istilah limit fitur.
* Jika memungkinkan, update command .limit agar wording lebih umum.

Contoh output .limit:
Limit fitur kamu: <jumlah>
Limit ini bisa digunakan untuk download video dan HD AI.

Update README:

* Jelaskan bahwa limit digunakan untuk fitur berat.
* Jelaskan bahwa .hd biasa tidak memakai limit, hanya cooldown.
* Jelaskan bahwa .hdai memakai 1 limit per proses.
* Jelaskan bahwa .belilimit tetap bisa dipakai untuk membeli limit yang berlaku untuk downloader dan .hdai.
* Jelaskan bahwa daily reward limit juga bisa dipakai untuk downloader dan .hdai.

==================================================
BAGIAN 6 - OUTPUT DAN PENGIRIMAN
================================

Mode output:

1. Default image

   * .hd
   * .hdai
   * Cocok untuk preview dan mudah dilihat.

2. Document

   * .hd doc
   * .hdai doc
   * Cocok untuk menjaga kualitas karena WhatsApp tidak terlalu mengompres document.

Behavior:

* .hd: kirim image/jpeg.
* .hd doc: kirim document dengan filename hd-photo.jpg.
* .hdai: kirim image JPEG atau PNG yang aman.
* .hdai doc: kirim document dengan filename hdai-photo.png atau hdai-photo.jpg.

Pesan awal:

* Untuk .hd:
  Sedang memproses foto HD. Mohon tunggu sebentar.

* Untuk .hdai:
  Sedang memproses foto HD AI. Proses ini bisa memakan waktu lebih lama.

Pesan sukses:

* Untuk .hd:
  Foto HD berhasil diproses.

* Untuk .hdai:
  Foto HD AI berhasil diproses.

Jangan spam pesan terlalu banyak.
Cukup:

* satu pesan awal saat mulai,
* satu pesan antrean jika perlu,
* satu hasil akhir.

==================================================
BAGIAN 7 - VALIDASI DAN BATASAN
===============================

Batasan wajib:

* Maksimal input foto 7 MB.
* Hanya image.
* Jangan proses video untuk versi ini.
* Jangan proses sticker untuk versi ini.
* .hdai wajib queue.
* .hdai wajib limit fitur.
* .hd hanya cooldown.
* .hd doc hanya cooldown.
* Jika bot sedang sibuk, user diberi pesan informatif.

Batasan AI:

* Jangan menjalankan banyak proses AI secara paralel.
* AI job concurrency maksimal 1.
* Jika proses AI terlalu lama, beri timeout yang aman.
* Jika timeout terjadi, refund limit.
* Bersihkan semua temp file.

==================================================
BAGIAN 8 - ERROR HANDLING DAN CLEANUP
=====================================

Pastikan:

* Temp file input dihapus setelah proses.
* Temp file output dihapus setelah sendMessage selesai.
* Jika proses gagal di tengah, temp file tetap dibersihkan.
* Jangan double-delete sampai membuat crash.
* Log error dengan logger existing.
* Jangan log data sensitif berlebihan.
* Jangan log isi gambar atau data binary.

Pesan error ramah:

* Jika media tidak valid:
  Command ini hanya bisa digunakan untuk foto.

* Jika ukuran terlalu besar:
  Ukuran foto terlalu besar. Maksimal 7 MB.

* Jika dependency AI belum siap:
  Fitur HD AI belum siap di server.

* Jika limit habis:
  Limit fitur kamu habis.
  Kumpulkan poin dari game, lalu beli limit dengan .belilimit.

* Jika proses gagal:
  Gagal memproses foto. Coba lagi nanti.

* Jika queue penuh:
  Antrean HD AI sedang penuh. Coba lagi nanti.

==================================================
BAGIAN 9 - MENU DAN DOKUMENTASI
===============================

Tambahkan ke menu:

[MEDIA]
.hd - Tingkatkan kualitas foto 2x
.hd doc - Tingkatkan kualitas foto 2x dan kirim sebagai dokumen
.hdai - Tingkatkan kualitas foto 4x dengan AI, memakai 1 limit fitur
.hdai doc - Tingkatkan kualitas foto 4x dengan AI dan kirim sebagai dokumen, memakai 1 limit fitur

Tambahkan penjelasan singkat:

* reply foto lalu ketik .hd
* kirim foto dengan caption .hd
* reply foto lalu ketik .hdai
* kirim foto dengan caption .hdai
* .hd tidak memakai limit fitur
* .hdai memakai 1 limit fitur

Update README:

* Jelaskan dependency sharp.
* Jelaskan dependency AI upscale seperti Real-ESRGAN jika dipakai.
* Jelaskan perbedaan .hd dan .hdai.
* Jelaskan batas ukuran 7 MB.
* Jelaskan bahwa .hdai lebih lambat dan memakai antrean.
* Jelaskan bahwa mode doc menjaga kualitas lebih baik.
* Jelaskan bahwa hasil kompatibel untuk WhatsApp Android dan iPhone.
* Jelaskan bahwa limit fitur digunakan untuk downloader dan HD AI.

==================================================
BAGIAN 10 - ACCEPTANCE CRITERIA
===============================

Acceptance criteria wajib:

1. User bisa reply foto lalu kirim .hd.
2. User bisa kirim foto dengan caption .hd.
3. User bisa reply foto lalu kirim .hd doc.
4. User bisa kirim foto dengan caption .hd doc.
5. User bisa reply foto lalu kirim .hdai.
6. User bisa kirim foto dengan caption .hdai.
7. User bisa reply foto lalu kirim .hdai doc.
8. User bisa kirim foto dengan caption .hdai doc.
9. Input di atas 7 MB ditolak.
10. Media selain foto ditolak.
11. .hd menghasilkan output 2x.
12. .hdai menghasilkan output 4x.
13. .hd berjalan cepat memakai sharp.
14. .hdai memakai AI upscale dan queue.
15. .hdai tidak menjalankan banyak job paralel sekaligus.
16. .hd tidak mengurangi limit fitur.
17. .hd doc tidak mengurangi limit fitur.
18. .hdai mengurangi 1 limit fitur jika berhasil.
19. .hdai doc mengurangi 1 limit fitur jika berhasil.
20. .hdai gagal harus refund limit.
21. .hdai dengan input invalid tidak mengurangi limit.
22. .hdai saat queue penuh tidak mengurangi limit.
23. .hdai saat user tidak punya limit ditolak.
24. Owner tetap unlimited.
25. .limit menampilkan wording limit fitur jika memungkinkan.
26. .belilimit tetap bisa membeli limit untuk downloader dan .hdai.
27. .daily reward limit tetap bisa dipakai untuk downloader dan .hdai.
28. .hd doc mengirim sebagai document.
29. .hdai doc mengirim sebagai document.
30. Hasil bisa dibuka dengan baik di WhatsApp Android.
31. Hasil bisa dibuka dengan baik di WhatsApp iPhone.
32. Rotasi/orientasi foto tetap benar.
33. Temp file dibersihkan.
34. Fitur lama tidak rusak, termasuk .tt, .ig, .igstory, .s, .gambar, .menu, dan fitur game.
35. npm run build berhasil.
36. npm run lint berhasil.

Catatan implementasi:

* Jika dependency AI belum tersedia, implementasikan guard yang rapi agar bot tidak crash.
* .hd harus selesai penuh karena mode ini ringan dan menjadi fitur utama awal.
* .hdai boleh membutuhkan dependency eksternal, tetapi struktur, queue, limit, error handling, dan dokumentasi harus disiapkan dengan benar.
* Jangan membuat sistem limit baru. Gunakan limit existing sebagai limit fitur.
