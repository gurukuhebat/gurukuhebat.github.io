/* =====================================================================
   store.js — Lapisan data Guruku Hebat
   - Penyimpanan: localStorage dengan namespace "gh_*"
   - Default: identitas kosong, preset bobot "Kurikulum Merdeka",
     kategori capaian standar.
   - Menyediakan API tunggal `window.GHStore` dipakai semua modul.
   ===================================================================== */
(function () {
  "use strict";

  const PREFIX = "gh_";
  const SCHEMA_VERSION = 1;

  /* ---------- KONFIGURASI DEFAULT ---------- */
  const DEFAULT_KATEGORI = [
    { min: 0, max: 60, label: "Kurang", warna: "#b91c1c" },
    { min: 61, max: 70, label: "Cukup", warna: "#b45309" },
    { min: 71, max: 80, label: "Baik", warna: "#1d4ed8" },
    { min: 81, max: 100, label: "Sangat Baik", warna: "#15803d" }
  ];

  // Komponen & preset bobot (lihat bobot.js untuk detail preset lain)
  const DEFAULT_KOMPONEN = [
    { id: "k1", nama: "Tugas Harian", bobot: 25 },
    { id: "k2", nama: "Ulangan Harian", bobot: 15 },
    { id: "k3", nama: "UTS", bobot: 20 },
    { id: "k4", nama: "UAS", bobot: 20 },
    { id: "k5", nama: "Lainnya", bobot: 20 }
  ];

  const DEFAULTS = {
    identitas: { sekolah: "", kelas: "", tahun: "", mapel: "" },
    jurnal: [],                       // [{id, minggu, hari, tanggal, jamMulai, jamSelesai, tujuan, materi, penilaian}]
    siswa: [],                        // [{id, nama, nisn}]
    komponen: DEFAULT_KOMPONEN,
    nilai: {},                        // { [siswaId]: { [komponenId]: [angka, ...] } }
    aset: { logo: "", ttdKepsek: "", ttdGuru: "", stempel: "" },
    pengesahan: {
      kota: "", tanggal: "",
      kepsek: { nama: "", nip: "" },
      guru: { nama: "", nip: "" }
    },
    pengaturan: {
      presetAktif: "kurmer",
      kategori: DEFAULT_KATEGORI
    },
    meta: { schema: SCHEMA_VERSION, created: new Date().toISOString() }
  };

  /* ---------- UTIL PENYIMPANAN ---------- */
  function key(nama) { return PREFIX + nama; }

  function baca(nama) {
    try {
      const raw = localStorage.getItem(key(nama));
      if (raw === null) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.error("Gagal membaca '" + nama + "':", e);
      return null;
    }
  }

  function tulis(nama, nilai) {
    try {
      localStorage.setItem(key(nama), JSON.stringify(nilai));
      return true;
    } catch (e) {
      console.error("Gagal menulis '" + nama + "':", e);
      // Kemungkinan kuota penuh (aset gambar besar)
      if (e && (e.name === "QuotaExceededError" || e.code === 22)) {
        window.GHApp && window.GHApp.toast("Penyimpanan penuh. Kurangi ukuran gambar logo/tanda tangan.", "danger");
      }
      return false;
    }
  }

  /* ---------- API GET/SET PER-KUNCI ---------- */
  function get(nama) {
    const def = DEFAULTS[nama];
    const val = baca(nama);
    if (val === null) {
      // inisialisasi default bila belum ada
      tulis(nama, def);
      return JSON.parse(JSON.stringify(def));
    }
    // gabungkan dengan default agar field baru ikut (migrasi ringan)
    if (def && typeof def === "object" && !Array.isArray(def)) {
      return Object.assign({}, def, val);
    }
    return val;
  }

  function set(nama, nilai) {
    return tulis(nama, nilai);
  }

  /* ---------- UTIL UMUM ---------- */
  function uid(prefix) {
    return (prefix || "id") + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
  }

  // Rapikan angka: bilangan bulat atau 2 desimal
  function angkaBersih(n) {
    if (n === null || n === undefined || n === "" || isNaN(n)) return null;
    const x = Number(n);
    return Math.round(x * 100) / 100;
  }

  /* ---------- EXPORT / IMPORT (backup lengkap) ---------- */
  function exportJSON() {
    const data = {};
    Object.keys(DEFAULTS).forEach(function (nama) {
      if (nama === "meta") return;
      data[nama] = baca(nama) !== null ? baca(nama) : DEFAULTS[nama];
    });
    data.meta = { schema: SCHEMA_VERSION, exported: new Date().toISOString(), app: "Guruku Hebat" };
    return data;
  }

  function importJSON(obj) {
    if (!obj || typeof obj !== "object") throw new Error("Format tidak valid.");
    let jumlah = 0;
    Object.keys(DEFAULTS).forEach(function (nama) {
      if (nama === "meta") return;
      if (obj[nama] !== undefined) {
        tulis(nama, obj[nama]);
        jumlah++;
      }
    });
    return jumlah;
  }

  // Unduh string sebagai file
  function unduh(namaFile, isi, mime) {
    const blob = new Blob([isi], { type: mime || "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = namaFile;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }

  // Baca file menjadi teks (Promise)
  function bacaFile(file) {
    return new Promise(function (resolve, reject) {
      const r = new FileReader();
      r.onload = function () { resolve(r.result); };
      r.onerror = function () { reject(r.error); };
      r.readAsText(file);
    });
  }

  // Baca file gambar menjadi data URL (Promise), dengan validasi tipe & ukuran
  function bacaGambar(file, opts) {
    opts = opts || {};
    const maxMB = opts.maxMB || 2;
    return new Promise(function (resolve, reject) {
      if (!file) return reject(new Error("Tidak ada file."));
      if (!/^image\//.test(file.type)) return reject(new Error("File harus berupa gambar."));
      if (file.size > maxMB * 1024 * 1024) {
        return reject(new Error("Ukuran gambar melebihi " + maxMB + " MB."));
      }
      const r = new FileReader();
      r.onload = function () { resolve(r.result); };
      r.onerror = function () { reject(r.error); };
      r.readAsDataURL(file);
    });
  }

  /* ---------- RESET ---------- */
  function resetSemua() {
    Object.keys(DEFAULTS).forEach(function (nama) {
      localStorage.removeItem(key(nama));
    });
  }

  /* ---------- EXPOSE ---------- */
  window.GHStore = {
    SCHEMA_VERSION: SCHEMA_VERSION,
    DEFAULTS: DEFAULTS,
    get: get,
    set: set,
    uid: uid,
    angkaBersih: angkaBersih,
    exportJSON: exportJSON,
    importJSON: importJSON,
    unduh: unduh,
    bacaFile: bacaFile,
    bacaGambar: bacaGambar,
    resetSemua: resetSemua
  };
})();
