# Guruku Hebat — Jurnal & Rekap Nilai Siswa

**Guruku Hebat** adalah platform ringan berbasis peramban (browser) yang dirancang untuk memudahkan Bapak/Ibu guru dalam mengelola **jurnal pembelajaran harian** dan **rekap nilai siswa**. Aplikasi ini beroperasi 100% di sisi klien menggunakan LocalStorage, dilengkapi dengan ekspor PDF presisi dan tanda tangan digital terintegrasi.

---

## 🚀 Fitur Utama

### 1. Jurnal Harian Pembelajaran
- Form identitas sekolah & guru yang tersimpan otomatis.
- Entri jurnal mingguan/harian (tanggal, jam, tujuan, materi, penilaian).
- **Ekspor Dokumen Resmi**: Menghasilkan dokumen PDF berukuran A4 yang rapi, teks tajam (bisa diseleksi), mendukung multi-halaman tanpa memotong baris tabel, serta dibubuhi kop surat dan blok pengesahan tanda tangan.

### 2. Nilai Siswa
- Manajemen data siswa (CRUD Siswa & NISN).
- Konfigurasi komponen nilai yang fleksibel dengan bobot kustom. Tersedia juga preset satu-klik (misal: Kurikulum Merdeka).
- Tabel antarmuka *spreadsheet-like* untuk input nilai dengan kalkulasi rata-rata tertimbang secara *real-time*.
- Ekspor rekap nilai ke format CSV, JSON, atau PDF (cetak tajam dengan orientasi *landscape*).

### 3. Pengaturan & Personalisasi
- Atur identitas sekolah dan kelas secara global.
- Unggah logo sekolah, stempel, dan tanda tangan digital.
- Fitur "Tanda Tangan Langsung" di peramban menggunakan *canvas pad*.

---

## 💻 Cara Menjalankan Secara Lokal

Karena aplikasi ini sepenuhnya mengandalkan teknologi *client-side* murni (HTML, CSS, JS), Anda tidak perlu menginstal Node.js atau server *backend* apa pun.

1. **Unduh atau Clone repositori ini**:
   ```bash
   git clone https://github.com/gurukuhebat/gurukuhebat.github.io.git
   ```
2. **Buka folder tersebut**.
3. Buka file `index.html` menggunakan peramban modern (Chrome, Edge, Firefox, Safari). Anda juga dapat menggunakan ekstensi *Live Server* pada VS Code.

---

## 🌍 Cara Deploy ke GitHub Pages

Jika repositori ini menggunakan penamaan `<username>.github.io` (misalnya, `gurukuhebat.github.io`), maka GitHub secara otomatis mengenali dan menayangkannya melalui GitHub Pages.

1. Lakukan perubahan atau tambahan kode pada *branch* `main`.
2. Commit dan push ke *remote repository*.
   ```bash
   git add .
   git commit -m "chore: update app"
   git push origin main
   ```
3. Buka halaman pengaturan repositori (Settings > Pages).
4. Pastikan *source* disetel ke *branch* `main`.
5. Buka tautan `https://<username>.github.io` untuk mengakses aplikasi secara *live*.

---

## 📚 Daftar Library Vendor (Lokal)

Semua library di-*host* secara lokal di dalam folder `assets/lib/` untuk memastikan aplikasi tetap berjalan meski tanpa koneksi internet yang stabil:

1. **pdfmake** (`pdfmake.min.js`, `vfs_fonts.js`) - Engine pembuat PDF *client-side* berbasis dokumen definisi.
2. **html2canvas** (`html2canvas.min.js`) - Library untuk menangkap *screenshot* elemen HTML/DOM menjadi *canvas*.
3. **jsPDF** (`jspdf.umd.min.js`) - Library pengubah gambar canvas menjadi format dokumen PDF (dipakai bersama html2canvas untuk mode Sesuai Pratinjau).
4. **Signature Pad** (`signature_pad.umd.min.js`) - Library kanvas tanda tangan berbasis kurva Bezier halus.

---

## 🔮 Catatan Peningkatan Opsional

Aplikasi saat ini hanya menyimpan data di perangkat spesifik (*LocalStorage* peramban). Jika *cache* peramban dibersihkan, data berpotensi hilang jika tidak di-*backup* (Ekspor JSON).

Untuk pengembangan selanjutnya, direkomendasikan:
- **Sinkronisasi Multi-perangkat**: Menambahkan integrasi dengan **Supabase**, **Firebase**, atau solusi BaaS (*Backend as a Service*) lainnya agar data dapat disinkronkan lintas perangkat menggunakan akun pengguna.
- **PWA Lanjutan**: Menambahkan *Service Worker* murni agar aplikasi dapat berjalan sebagai PWA (*Progressive Web App*) sepenuhnya secara *offline* di perangkat seluler.

---

## 🧭 Cara Pakai Singkat

1. **Pengaturan** → isi identitas sekolah, unggah logo & tanda tangan (atau buat langsung di layar), isi data pengesahan (nama & NIP kepala sekolah/guru), pilih preset bobot & kategori capaian.
2. **Jurnal Harian** → klik **+ Tambah Pertemuan**, isi tiap minggu. Klik **Pratinjau** atau **Cetak / PDF**.
3. **Nilai Siswa** → tambah siswa (tab *Daftar Siswa*), atur komponen & bobot (tab *Komponen & Bobot*), input nilai di tabel (tab *Input Nilai*). Nilai akhir & kategori otomatis. Ekspor CSV/JSON atau cetak PDF.
4. **Pengaturan → Backup Data** untuk ekspor/impor seluruh data.

### Format input nilai
- Satu nilai: `80`
- Banyak nilai (dirata-rata otomatis): `80, 75, 90` — pisahkan dengan **koma + spasi**.
- Desimal: `75,5` atau `75.5`.
- Nilai di luar 0–100 otomatis dipotong ke rentang tersebut.

---

## 🏗️ Struktur Folder & Model Data

```
gurukuhebat.github.io/
├─ index.html              # Shell SPA + navigasi + container view
├─ 404.html, .nojekyll, manifest.webmanifest, favicon.svg
├─ robots.txt, sitemap.xml
└─ assets/
   ├─ css/{styles.css, print.css}
   ├─ lib/                 # Pustaka vendor LOKAL (versi dikunci, nol dependensi runtime)
   │  ├─ pdfmake.min.js, vfs_fonts.js
   │  ├─ signature_pad.umd.min.js, jspdf.umd.min.js, html2canvas.min.js
   └─ js/
      ├─ store.js          # Lapisan data localStorage (namespace gh_*) + export/import
      ├─ app.js            # Bootstrap, router, util UI (toast/modal/konfirmasi), Beranda, Pengaturan
      ├─ identitas.js      # Form identitas sekolah + render kop dokumen
      ├─ bobot.js          # Preset bobot, validasi 100%, kategori capaian, hitung nilai akhir
      ├─ signature.js      # Kanvas signature_pad + unggah gambar
      ├─ jurnal.js         # Fitur 1: entri mingguan + pratinjau + cetak
      ├─ nilai.js          # Fitur 2: siswa, komponen, tabel nilai, ekspor
      └─ pdf.js            # Engine PDF: pdfmake (utama) + html2canvas+jsPDF (opsi)
```

**Model data** disimpan di `localStorage` dengan namespace `gh_*`:

| Kunci | Isi |
|---|---|
| `gh_identitas` | `{ sekolah, kelas, tahun, mapel }` |
| `gh_jurnal` | `[{ id, minggu, hari, tanggal, jamMulai, jamSelesai, tujuan, materi, penilaian }]` |
| `gh_siswa` | `[{ id, nama, nisn }]` |
| `gh_komponen` | `[{ id, nama, bobot }]` |
| `gh_nilai` | `{ [siswaId]: { [komponenId]: [angka, ...] } }` |
| `gh_aset` | `{ logo, ttdKepsek, ttdGuru, stempel }` (data URL) |
| `gh_pengesahan` | `{ kota, tanggal, kepsek:{nama,nip}, guru:{nama,nip} }` |
| `gh_pengaturan` | `{ presetAktif, kategori:[{min,max,label,warna}] }` |

---

## 📦 Versi Pustaka Vendor

| Pustaka | Versi | Lisensi | Untuk |
|---|---|---|---|
| pdfmake + vfs_fonts (Roboto) | 0.2.10 | MIT | PDF teks tajam & terseleksi (mode utama) |
| signature_pad | 4.1.7 | MIT | Tanda tangan digital di kanvas |
| jsPDF | 2.5.2 | MIT | PDF mode "sesuai pratinjau" |
| html2canvas | 1.4.1 | MIT | Render DOM ke kanvas (mode pratinjau) |

---

## ✅ Status Pengujian

- Sintaks semua berkas JS lolos `node --check` (13/13 berkas).
- **Uji logis** lulus pada: validasi total bobot (100%), perhitungan nilai akhir (rata-rata tertimbang), rata-rata banyak entri per komponen, kategori capaian (batas rentang), parsing nilai (desimal Indonesia & banyak nilai), clamping 0–100.
- PDF utama memakai `dontBreakRows: true` agar baris tabel tidak terpotong saat pindah halaman.

> Catatan: pengujian bersifat **logis** (analisis kode + uji unit perhitungan), **belum** diuji end-to-end di peramban nyata. Disarankan verifikasi manual di peramban sebelum penggunaan produksi resmi.
