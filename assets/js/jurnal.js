/* =====================================================================
   jurnal.js — Fitur 1: Jurnal Harian Pembelajaran (Mingguan)
   Bagian A: Identitas (reuse dari identitas.js)
   Bagian B: Entri per pertemuan/minggu (dinamis)
   Bagian C: Pengesahan (dari store)
   + Pratinjau dokumen + Cetak/PDF
   ===================================================================== */
(function () {
  "use strict";

  const app = window.GHApp = window.GHApp || {};
  const Store = window.GHStore;

  const HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

  /* ---------- HALAMAN JURNAL ---------- */
  app.renderJurnal = function (el) {
    el.innerHTML =
      '<div class="page-head no-print"><div class="breadcrumb">Jurnal</div>' +
      "<h1>📓 Jurnal Harian Pembelajaran</h1>" +
      '<p class="text-muted">Isi data sekolah, tambah pertemuan tiap minggu, lalu cetak/PDF menjadi dokumen resmi.</p></div>' +

      // Tombol aksi
      '<div class="card no-print">' +
        '<div class="flex-between">' +
          "<div><strong>Entri tersimpan:</strong> <span id='jumlahEntri'>0</span> pertemuan</div>" +
          '<div class="btn-row">' +
            '<button class="btn btn--secondary" id="jrPratinjau">👁️ Pratinjau Dokumen</button>' +
            '<button class="btn btn--primary" id="jrCetak">🖨️ Cetak / PDF (Tajam)</button>' +
            '<button class="btn btn--ghost" id="jrCetakPrev">PDF Sesuai Pratinjau</button>' +
          "</div>" +
        "</div>" +
      "</div>" +

      // Bagian A — Identitas
      '<div class="card no-print"><h3>Bagian A — Identitas</h3>' +
      '<p class="text-muted">Disimpan otomatis & dipakai di semua dokumen. <a href="#/pengaturan">Atur lebih lengkap →</a></p>' +
      '<div id="jr-identitas"></div></div>' +

      // Bagian B — Entri mingguan
      '<div class="card no-print">' +
        '<div class="card__header"><h3>Bagian B — Entri Pertemuan / Mingguan</h3>' +
        '<button class="btn btn--secondary btn--sm" id="jrTambah">+ Tambah Pertemuan</button></div>' +
      '<div id="jr-entri"></div></div>';

    // Identitas
    app.renderFormIdentitas(el.querySelector("#jr-identitas"), {
      tombolLabel: "Simpan Identitas"
    });

    // Render entri
    renderEntri(el);

    // Tombol aksi
    el.querySelector("#jrTambah").onclick = function () {
      const jurnal = Store.get("jurnal");
      const no = jurnal.length + 1;
      jurnal.push({
        id: Store.uid("j"),
        minggu: no,
        hari: "Senin",
        tanggal: "",
        jamMulai: "",
        jamSelesai: "",
        tujuan: "",
        materi: "",
        penilaian: ""
      });
      Store.set("jurnal", jurnal);
      renderEntri(el);
      app.toast("Pertemuan ke-" + no + " ditambahkan.", "success");
      // scroll ke entri terakhir
      const rows = el.querySelectorAll(".entry-row");
      if (rows.length) rows[rows.length - 1].scrollIntoView({ behavior: "smooth", block: "center" });
    };

    el.querySelector("#jrPratinjau").onclick = function () { bukaPratinjau(); };
    el.querySelector("#jrCetak").onclick = function () {
      if (!validasiSebelumCetak()) return;
      window.GHPDF.cetakJurnal();
    };
    el.querySelector("#jrCetakPrev").onclick = function () {
      if (!validasiSebelumCetak()) return;
      bukaPratinjau();
    };
  };

  /* ---------- RENDER ENTRI MINGGUAN ---------- */
  function renderEntri(root) {
    const wrap = root.querySelector("#jr-entri");
    const jurnal = Store.get("jurnal");
    root.querySelector("#jumlahEntri").textContent = jurnal.length;

    if (!jurnal.length) {
      wrap.innerHTML = '<div class="alert alert--info">Belum ada entri. Klik <strong>+ Tambah Pertemuan</strong> untuk memulai.</div>';
      return;
    }

    wrap.innerHTML = jurnal.map(function (e, i) {
      return '<div class="entry-row" data-id="' + e.id + '" style="grid-template-columns: 70px 1fr 1fr 1fr 1fr auto">' +
        '<div class="form-group"><label>Pertemuan</label><input type="number" class="e-minggu" min="1" value="' + e.minggu + '" /></div>' +
        '<div class="form-group"><label>Hari</label><select class="e-hari">' +
          HARI.map(function (h) { return '<option ' + (h === e.hari ? "selected" : "") + ">" + h + "</option>"; }).join("") +
        "</select></div>" +
        '<div class="form-group"><label>Tanggal</label><input type="date" class="e-tanggal" value="' + app.esc(e.tanggal) + '" /></div>' +
        '<div class="form-group"><label>Jam Mulai</label><input type="time" class="e-jam1" value="' + app.esc(e.jamMulai) + '" /></div>' +
        '<div class="form-group"><label>Jam Selesai</label><input type="time" class="e-jam2" value="' + app.esc(e.jamSelesai) + '" /></div>' +
        '<button class="btn btn--ghost btn--sm entry-row__remove" data-hapus="' + e.id + '" title="Hapus pertemuan">✕</button>' +
        '<div class="form-group form-group--full"><label>Tujuan Pembelajaran</label><input type="text" class="e-tujuan" value="' + app.esc(e.tujuan) + '" placeholder="mis. Siswa mampu mengenal harokat fathah" /></div>' +
        '<div class="form-group"><label>Materi</label><textarea class="e-materi" placeholder="mis. Harokat fathah, contoh بَ تَ ثَ">' + app.esc(e.materi) + "</textarea></div>" +
        '<div class="form-group"><label>Penilaian</label><textarea class="e-penilaian" placeholder="mis. Lisan, tulisan, observasi">' + app.esc(e.penilaian) + "</textarea></div>" +
      "</div>";
    }).join("");

    // Autosave per-field
    const fields = ["minggu", "hari", "tanggal", "jam1|jamMulai", "jam2|jamSelesai", "tujuan", "materi", "penilaian"];
    wrap.querySelectorAll(".entry-row").forEach(function (row) {
      const id = row.getAttribute("data-id");
      const handler = function () {
        const jurnal = Store.get("jurnal");
        const idx = jurnal.findIndex(function (x) { return x.id === id; });
        if (idx < 0) return;
        jurnal[idx].minggu = parseInt(row.querySelector(".e-minggu").value, 10) || jurnal[idx].minggu;
        jurnal[idx].hari = row.querySelector(".e-hari").value;
        jurnal[idx].tanggal = row.querySelector(".e-tanggal").value;
        jurnal[idx].jamMulai = row.querySelector(".e-jam1").value;
        jurnal[idx].jamSelesai = row.querySelector(".e-jam2").value;
        jurnal[idx].tujuan = row.querySelector(".e-tujuan").value;
        jurnal[idx].materi = row.querySelector(".e-materi").value;
        jurnal[idx].penilaian = row.querySelector(".e-penilaian").value;
        Store.set("jurnal", jurnal);
      };
      row.addEventListener("input", handler);
      row.addEventListener("change", handler);
    });

    // Hapus
    wrap.querySelectorAll("[data-hapus]").forEach(function (btn) {
      btn.addEventListener("click", async function () {
        const id = btn.getAttribute("data-hapus");
        if (!await app.konfirmasi("Hapus pertemuan ini?", { ok: "Hapus", bahaya: true })) return;
        let jurnal = Store.get("jurnal");
        jurnal = jurnal.filter(function (x) { return x.id !== id; });
        Store.set("jurnal", jurnal);
        renderEntri(root);
        app.toast("Pertemuan dihapus.", "info");
      });
    });
  }

  /* ---------- VALIDASI SEBELUM CETAK ---------- */
  function validasiSebelumCetak() {
    const jurnal = Store.get("jurnal");
    const idn = Store.get("identitas");
    if (!idn.sekolah) { app.toast("Isi nama sekolah dulu di Bagian A / Pengaturan.", "warning"); return false; }
    if (!jurnal.length) { app.toast("Belum ada entri pertemuan untuk dicetak.", "warning"); return false; }
    const kosong = jurnal.filter(function (e) { return !e.tanggal && !e.tujuan && !e.materi; });
    if (kosong.length) { app.toast("Ada " + kosong.length + " entri masih kosong (tidak diisi). Tetap dicetak?", "info"); }
    return true;
  }

  /* ---------- BANGUN HTML DOKUMEN JURNAL (pratinjau & cetak html2canvas) ---------- */
  app.bangunDokumenJurnalHTML = function () {
    const idn = Store.get("identitas");
    const jurnal = Store.get("jurnal");
    const p = Store.get("pengesahan");
    const aset = Store.get("aset");

    const tanggalTtd = p.tanggal ? app.tglPendek(p.tanggal) : "_____________";

    const baris = jurnal.map(function (e) {
      const jam = (e.jamMulai || e.jamSelesai) ? (app.esc(e.jamMulai || "--") + " – " + app.esc(e.jamSelesai || "--")) : "—";
      return "<tr>" +
        '<td class="num">' + app.esc(e.minggu) + "</td>" +
        "<td>" + app.esc(e.hari) + "</td>" +
        "<td>" + (e.tanggal ? app.tglPendek(e.tanggal) : "—") + "</td>" +
        "<td>" + jam + "</td>" +
        "<td>" + (e.tujuan ? app.esc(e.tujuan) : "—") + "</td>" +
        "<td>" + (e.materi ? app.esc(e.materi).replace(/\n/g, "<br>") : "—") + "</td>" +
        "<td>" + (e.penilaian ? app.esc(e.penilaian).replace(/\n/g, "<br>") : "—") + "</td>" +
      "</tr>";
    }).join("");

    function kolomTTD(peran, data, ttdUrl) {
      return '<div><div>' + app.esc(peran) + "</div>" +
        '<div class="doc-pengesahan__sign">' + (ttdUrl ? '<img src="' + ttdUrl + '" alt="ttd" />' : '<span style="color:#999">Tanda tangan</span>') + "</div>" +
        '<div style="margin-top:.4rem"><strong>' + (data.nama ? app.esc(data.nama) : "............................") + "</strong></div>" +
        "<div>NIP. " + (data.nip ? app.esc(data.nip) : "......................") + "</div></div>";
    }

    const stempel = aset.stempel
      ? '<img src="' + aset.stempel + '" alt="stempel" style="position:absolute;right:8%;bottom:60px;width:90px;opacity:.9" />'
      : "";

    return '<div class="doc-preview" id="dokumenJurnal" style="position:relative">' +
      app.renderKop(idn) +
      '<div class="doc-title">JURNAL HARIAN PEMBELAJARAN</div>' +
      '<div class="table-wrap" style="font-family:inherit"><table class="data" style="width:100%">' +
        "<thead><tr>" +
        '<th class="num">Mgg</th><th>Hari</th><th>Tanggal</th><th class="num">Jam</th>' +
        "<th>Tujuan Pembelajaran</th><th>Materi</th><th>Penilaian</th>" +
        "</tr></thead><tbody>" + baris + "</tbody>" +
      "</table></div>" +
      '<div style="position:relative">' +
        '<div class="doc-pengesahan">' +
          kolomTTD("Kepala Sekolah", p.kepsek, aset.ttdKepsek) +
          '<div><div>' + app.esc(p.kota || "_____________") + ", " + tanggalTtd + "</div>" +
          '<div class="doc-pengesahan__sign">' + (aset.ttdGuru ? '<img src="' + aset.ttdGuru + '" alt="ttd" />' : '<span style="color:#999">Tanda tangan</span>') + "</div>" +
          '<div style="margin-top:.4rem"><strong>' + (p.guru.nama ? app.esc(p.guru.nama) : "............................") + "</strong></div>" +
          "<div>NIP. " + (p.guru.nip ? app.esc(p.guru.nip) : "......................") + "</div></div>" +
        "</div>" +
        stempel +
      "</div>" +
    "</div>";
  };

  /* ---------- BUKA MODAL PRATINJAU ---------- */
  function bukaPratinjau() {
    const jurnal = Store.get("jurnal");
    if (!jurnal.length) { app.toast("Belum ada entri untuk dipratinjau.", "warning"); return; }
    app.modal.buka({
      title: "Pratinjau Dokumen Jurnal",
      wide: true,
      bodyHTML: app.bangunDokumenJurnalHTML(),
      footerHTML:
        '<button class="btn btn--ghost" id="pvTutup">Tutup</button>' +
        '<button class="btn btn--primary" id="pvCetak">🖨️ Cetak / PDF (Tajam)</button>' +
        '<button class="btn btn--secondary" id="pvCetakPrev">PDF Sesuai Pratinjau</button>'
    });
    document.getElementById("pvTutup").onclick = function () { app.modal.tutup(); };
    document.getElementById("pvCetak").onclick = function () {
      app.modal.tutup();
      if (validasiSebelumCetak()) window.GHPDF.cetakJurnal();
    };
    document.getElementById("pvCetakPrev").onclick = function () {
      if (!validasiSebelumCetak()) return;
      const node = document.getElementById("dokumenJurnal");
      window.GHPDF.cetakSesuaiPratinjau(node, "Jurnal-Pembelajaran");
    };
  }
})();
