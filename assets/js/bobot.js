/* =====================================================================
   bobot.js — Preset bobot nilai, validasi total 100%, kategori capaian
   ===================================================================== */
(function () {
  "use strict";

  const app = window.GHApp = window.GHApp || {};
  const Store = window.GHStore;

  /* ---------- PRESET BOBOT ----------
     Tiap preset menentukan daftar komponen + bobot.
     "Sama Rata" dihitung dinamis (100 / jumlah komponen aktif). */
  const PRESET = {
    kurmer: {
      label: "Kurikulum Merdeka",
      desc: "Sumatif/Tugas Harian 40%, UTS 20%, UAS 20%, komponen lain 20%.",
      komponen: [
        { nama: "Tugas Harian", bobot: 40 },
        { nama: "UTS", bobot: 20 },
        { nama: "UAS", bobot: 20 },
        { nama: "Lainnya (Proyek/Sikap)", bobot: 20 }
      ]
    },
    tradisional: {
      label: "Tradisional 60/20/20",
      desc: "Harian + Tugas 60%, UTS 20%, UAS 20%.",
      komponen: [
        { nama: "Harian + Tugas", bobot: 60 },
        { nama: "UTS", bobot: 20 },
        { nama: "UAS", bobot: 20 }
      ]
    },
    "30/30/40": {
      label: "30/30/40",
      desc: "Harian 30%, UTS 30%, UAS 40%.",
      komponen: [
        { nama: "Harian", bobot: 30 },
        { nama: "UTS", bobot: 30 },
        { nama: "UAS", bobot: 40 }
      ]
    },
    samarata: {
      label: "Sama Rata",
      desc: "100% dibagi rata ke seluruh komponen aktif.",
      komponen: [] // dihitung saat diterapkan
    }
  };

  app.PRESET_BOBOT = PRESET;

  /* ---------- TERAPKAN PRESET ---------- */
  // Mengembalikan array komponen baru (dengan id) sesuai preset.
  app.terapkanPreset = function (kunci, komponenAktif) {
    const p = PRESET[kunci];
    if (!p) return null;

    // "Sama Rata" → pakai komponen aktif yang sudah ada, bobot dibagi rata
    if (kunci === "samarata") {
      const aktif = (komponenAktif && komponenAktif.length) ? komponenAktif : PRESET.kurmer.komponen;
      const n = aktif.length;
      const bobot = Math.floor(100 / n);
      let sisa = 100 - bobot * n; // sisa dibagi ke elemen pertama agar total 100
      return aktif.map(function (k, i) {
        const b = bobot + (i === 0 ? sisa : 0);
        return { id: Store.uid("k"), nama: k.nama, bobot: b };
      });
    }

    return p.komponen.map(function (k) {
      return { id: Store.uid("k"), nama: k.nama, bobot: k.bobot };
    });
  };

  /* ---------- VALIDASI TOTAL BOBOT ---------- */
  // Mengembalikan { total, valid, pesan }
  app.validasiBobot = function (komponen) {
    const total = (komponen || []).reduce(function (s, k) {
      const b = parseFloat(k.bobot);
      return s + (isNaN(b) ? 0 : b);
    }, 0);
    const bulat = Math.round(total * 100) / 100;
    return {
      total: bulat,
      valid: Math.abs(bulat - 100) < 0.01,
      pesan: bulat === 100 ? "Total bobot 100%." :
             (bulat < 100 ? "Kurang " + (100 - bulat) + "%." : "Lebih " + (bulat - 100) + "%.")
    };
  };

  /* ---------- KATEGORI CAPAIAN ---------- */
  // Mengembalikan { label, warna } berdasarkan nilai (0–100).
  app.kategoriNilai = function (nilai) {
    const kategori = Store.get("pengaturan").kategori || [];
    const n = parseFloat(nilai);
    if (isNaN(n)) return { label: "—", warna: "#94a3b8" };
    // urutkan menaik agar rentang tertangkap benar
    const sorted = kategori.slice().sort(function (a, b) { return a.min - b.min; });
    for (let i = 0; i < sorted.length; i++) {
      const k = sorted[i];
      if (n >= k.min && n <= k.max) return { label: k.label, warna: k.warna || "#1d4ed8" };
    }
    return { label: "Di luar rentang", warna: "#94a3b8" };
  };

  /* ---------- HITUNG NILAI AKHIR (rata-rata tertimbang) ---------- */
  // nilaiSiswa: { [komponenId]: [angka, ...] }
  // komponen: [{id, nama, bobot}]
  // Mengembalikan { akhir, detail:[{id, nama, rata, bobot, kontribusi}] }
  app.hitungNilaiAkhir = function (nilaiSiswa, komponen) {
    const detail = [];
    let akhir = 0;
    let totalBobot = 0;
    (komponen || []).forEach(function (k) {
      const entri = (nilaiSiswa && nilaiSiswa[k.id]) || [];
      const angka = entri.map(function (x) { return parseFloat(x); }).filter(function (x) { return !isNaN(x); });
      const rata = angka.length ? angka.reduce(function (s, x) { return s + x; }, 0) / angka.length : null;
      const bobot = parseFloat(k.bobot) || 0;
      const kontribusi = rata !== null ? (rata * bobot / 100) : 0;
      detail.push({ id: k.id, nama: k.nama, rata: rata, bobot: bobot, kontribusi: kontribusi, jumlahEntri: angka.length });
      if (rata !== null) { akhir += kontribusi; totalBobot += bobot; }
    });
    // Normalisasi bila total bobot komponen yang terisi ≠ 100 (transparan: hanya bobot terisi)
    // Catatan: idealnya total bobot = 100. Jika tidak, kita tampilkan apa adanya
    // (ditangani validasi di UI) agar guru tahu.
    const akhirBersih = Store.angkaBersih(akhir);
    return { akhir: akhirBersih, detail: detail };
  };

  // Rata-rata kelas per komponen
  // semuaNilai: { [siswaId]: { [komponenId]: [angka,...] } }
  app.rataKelas = function (semuaNilai, siswaIds, komponenId) {
    let sum = 0, count = 0;
    siswaIds.forEach(function (sid) {
      const entri = (semuaNilai[sid] && semuaNilai[sid][komponenId]) || [];
      const angka = entri.map(parseFloat).filter(function (x) { return !isNaN(x); });
      if (angka.length) {
        const r = angka.reduce(function (s, x) { return s + x; }, 0) / angka.length;
        sum += r; count++;
      }
    });
    return count ? Store.angkaBersih(sum / count) : null;
  };
})();
