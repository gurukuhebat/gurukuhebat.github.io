/* =====================================================================
   nilai.js — Fitur 2: Input & Rekap Nilai Siswa
   - CRUD siswa
   - Konfigurasi komponen + bobot fleksibel + preset satu-klik
   - Tabel spreadsheet (baris=siswa, kolom=komponen, kolom akhir=auto)
   - Nilai Akhir (rata-rata tertimbang) otomatis + kategori capaian
   - Ekspor CSV/JSON + Cetak/PDF
   ===================================================================== */
(function () {
  "use strict";

  const app = window.GHApp = window.GHApp || {};
  const Store = window.GHStore;

  /* ---------- HALAMAN NILAI ---------- */
  app.renderNilai = function (el) {
    el.innerHTML =
      '<div class="page-head"><div class="breadcrumb">Nilai Siswa</div>' +
      "<h1>Input &amp; Rekap Nilai</h1>" +
      '<p class="text-muted">Masukkan nilai tanpa rumus — perhitungan otomatis. Atur komponen & bobot sesuai kebutuhan.</p></div>' +

      '<div class="tabs" role="tablist">' +
        '<button class="tab active" data-ntab="input">Input Nilai</button>' +
        '<button class="tab" data-ntab="siswa">Daftar Siswa</button>' +
        '<button class="tab" data-ntab="komponen">Komponen &amp; Bobot</button>' +
      "</div>" +
      '<div class="tab-panel active" data-npanel="input"><div id="panel-input"></div></div>' +
      '<div class="tab-panel" data-npanel="siswa"><div id="panel-siswa"></div></div>' +
      '<div class="tab-panel" data-npanel="komponen"><div id="panel-komponen"></div></div>';

    // Tab switching
    el.querySelectorAll(".tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        const id = tab.getAttribute("data-ntab");
        el.querySelectorAll(".tab").forEach(function (t) { t.classList.toggle("active", t === tab); });
        el.querySelectorAll(".tab-panel").forEach(function (p) {
          p.classList.toggle("active", p.getAttribute("data-npanel") === id);
        });
      });
    });

    isiPanelSiswa(el);
    isiPanelKomponen(el);
    isiPanelInput(el);
  };

  /* ---------- PANEL: DAFTAR SISWA ---------- */
  function isiPanelSiswa(root) {
    const target = root.querySelector("#panel-siswa");
    const siswa = Store.get("siswa");

    target.innerHTML = '<div class="card">' +
      '<div class="card__header"><h3>Daftar Siswa</h3>' +
      '<button class="btn btn--secondary btn--sm" id="swTambah">+ Tambah Siswa</button></div>' +
      '<div class="table-wrap"><table class="data" id="tabelSiswa"><thead><tr>' +
      '<th class="num">No</th><th>Nama Siswa</th><th>NISN</th><th class="col-action">Aksi</th>' +
      "</tr></thead><tbody></tbody></table></div>" +
      '<p class="text-muted mt-1" id="jumlahSiswa">' + siswa.length + " siswa terdaftar.</p>" +
      "</div>";

    function renderBaris() {
      const s = Store.get("siswa");
      const tbody = target.querySelector("#tabelSiswa tbody");
      tbody.innerHTML = s.length ? s.map(function (m, i) {
        return "<tr>" +
          '<td class="num">' + (i + 1) + "</td>" +
          "<td>" + app.esc(m.nama) + "</td>" +
          '<td class="num">' + app.esc(m.nisn || "—") + "</td>" +
          '<td class="col-action"><button class="btn btn--ghost btn--sm" data-edit="' + m.id + '">Edit</button> ' +
          '<button class="btn btn--ghost btn--sm" data-hapus="' + m.id + '">Hapus</button></td>' +
        "</tr>";
      }).join("") : '<tr><td colspan="4" class="text-center text-muted">Belum ada siswa. Klik "+ Tambah Siswa".</td></tr>';
      target.querySelector("#jumlahSiswa").textContent = s.length + " siswa terdaftar.";
    }
    renderBaris();

    target.querySelector("#swTambah").onclick = function () { modalSiswa(root, null, function () { renderBaris(); isiPanelInput(root); }); };
    target.querySelectorAll("[data-edit]").forEach(function (b) {
      b.addEventListener("click", function () {
        const id = b.getAttribute("data-edit");
        const m = Store.get("siswa").find(function (x) { return x.id === id; });
        if (m) modalSiswa(root, m, function () { renderBaris(); isiPanelInput(root); });
      });
    });
    target.querySelectorAll("[data-hapus]").forEach(function (b) {
      b.addEventListener("click", async function () {
        const id = b.getAttribute("data-hapus");
        const m = Store.get("siswa").find(function (x) { return x.id === id; });
        if (!await app.konfirmasi("Hapus siswa \"" + (m ? m.nama : "") + "\" beserta nilainya?", { bahaya: true, ok: "Hapus" })) return;
        // hapus siswa + nilainya
        let siswa = Store.get("siswa").filter(function (x) { return x.id !== id; });
        Store.set("siswa", siswa);
        const nilai = Store.get("nilai");
        delete nilai[id];
        Store.set("nilai", nilai);
        renderBaris();
        isiPanelInput(root);
        app.toast("Siswa dihapus.", "info");
      });
    });
  }

  function modalSiswa(root, data, onDone) {
    const baru = !data;
    app.modal.buka({
      title: baru ? "Tambah Siswa" : "Edit Siswa",
      bodyHTML:
        '<div class="form-group"><label for="m-nama">Nama Lengkap <span class="req">*</span></label>' +
        '<input type="text" id="m-nama" value="' + (data ? app.esc(data.nama) : "") + '" placeholder="Nama siswa" /></div>' +
        '<div class="form-group"><label for="m-nisn">NISN (opsional)</label>' +
        '<input type="text" id="m-nisn" value="' + (data ? app.esc(data.nisn || "") : "") + '" placeholder="Nomor Induk Siswa Nasional" /></div>',
      footerHTML:
        '<button class="btn btn--ghost" id="mBatal">Batal</button>' +
        '<button class="btn btn--primary" id="mSimpan">Simpan</button>'
    });
    document.getElementById("mBatal").onclick = function () { app.modal.tutup(); };
    document.getElementById("mSimpan").onclick = function () {
      const nama = document.getElementById("m-nama").value.trim();
      if (!nama) { app.toast("Nama wajib diisi.", "warning"); return; }
      const nisn = document.getElementById("m-nisn").value.trim();
      if (baru) {
        const siswa = Store.get("siswa");
        siswa.push({ id: Store.uid("s"), nama: nama, nisn: nisn });
        Store.set("siswa", siswa);
        app.toast("Siswa ditambahkan.", "success");
      } else {
        const siswa = Store.get("siswa");
        const i = siswa.findIndex(function (x) { return x.id === data.id; });
        if (i >= 0) { siswa[i].nama = nama; siswa[i].nisn = nisn; Store.set("siswa", siswa); }
        app.toast("Perubahan disimpan.", "success");
      }
      app.modal.tutup();
      onDone && onDone();
    };
  }

  /* ---------- PANEL: KOMPONEN & BOBOT ---------- */
  function isiPanelKomponen(root) {
    const target = root.querySelector("#panel-komponen");
    const komponen = Store.get("komponen");
    const pengaturan = Store.get("pengaturan");

    target.innerHTML =
      '<div class="card"><h3>Preset Bobot (satu klik)</h3>' +
      '<p class="text-muted">Mengganti seluruh komponen & bobot sekaligus. Data nilai siswa tetap aman (komponen lama yang tak terpakai tidak ditampilkan).</p>' +
      '<div class="btn-row">' +
        Object.keys(app.PRESET_BOBOT).map(function (k) {
          const p = app.PRESET_BOBOT[k];
          const aktif = pengaturan.presetAktif === k ? '<span class="badge badge--success">aktif</span> ' : "";
          return '<button class="btn btn--secondary btn--sm" data-preset="' + k + '">' + aktif + app.esc(p.label) + "</button>";
        }).join("") +
      "</div></div>" +

      '<div class="card"><div class="card__header"><h3>Komponen Nilai &amp; Bobot</h3>' +
      '<button class="btn btn--secondary btn--sm" id="kpTambah">+ Tambah Komponen</button></div>' +
      '<div id="kp-wrap"></div>' +
      '<div id="kp-status"></div>' +
      '<div class="btn-row mt-1"><button class="btn btn--primary" id="kpSimpan">Simpan Komponen &amp; Bobot</button></div>' +
      '<details class="mt-2"><summary class="text-muted">Cara pembobotan</summary>' +
      '<p class="text-muted mb-0">Nilai Akhir = Σ (rata-rata komponen × bobot%). Setiap komponen boleh punya banyak entri (mis. Ulangan Harian 1, 2, 3) yang otomatis dirata-rata. Total bobot <strong>wajib 100%</strong>.</p></details>' +
      "</div>";

    // Render baris komponen
    let daftar = JSON.parse(JSON.stringify(komponen));
    function render() {
      const wrap = target.querySelector("#kp-wrap");
      wrap.innerHTML = daftar.map(function (k, i) {
        return '<div class="entry-row" style="grid-template-columns: 1fr 100px auto">' +
          '<div class="form-group"><label>Nama Komponen</label><input type="text" class="kp-nama" data-i="' + i + '" value="' + app.esc(k.nama) + '" placeholder="mis. Tugas Harian" /></div>' +
          '<div class="form-group"><label>Bobot (%)</label><input type="number" class="kp-bobot" data-i="' + i + '" value="' + k.bobot + '" min="0" max="100" /></div>' +
          '<button class="btn btn--ghost btn--sm entry-row__remove" data-hapus-i="' + i + '">✕</button>' +
        "</div>";
      }).join("");
      // status realtime
      updateStatus();
      // autosave realtime baca
      wrap.querySelectorAll("input").forEach(function (inp) {
        inp.addEventListener("input", function () {
          const i = parseInt(inp.getAttribute("data-i"), 10);
          if (inp.classList.contains("kp-nama")) daftar[i].nama = inp.value;
          else daftar[i].bobot = parseFloat(inp.value) || 0;
          updateStatus();
        });
      });
      wrap.querySelectorAll("[data-hapus-i]").forEach(function (b) {
        b.addEventListener("click", function () {
          const i = parseInt(b.getAttribute("data-hapus-i"), 10);
          daftar.splice(i, 1);
          render();
        });
      });
    }
    function updateStatus() {
      const v = app.validasiBobot(daftar);
      const warna = v.valid ? "success" : "warning";
      target.querySelector("#kp-status").innerHTML =
        '<div class="alert alert--' + warna + '">Total bobot: <strong>' + v.total + "%</strong> — " + app.esc(v.pesan) + "</div>";
    }
    render();

    target.querySelector("#kpTambah").onclick = function () {
      daftar.push({ id: Store.uid("k"), nama: "Komponen Baru", bobot: 0 });
      render();
    };

    // Preset satu-klik
    target.querySelectorAll("[data-preset]").forEach(function (b) {
      b.addEventListener("click", async function () {
        const kunci = b.getAttribute("data-preset");
        const label = app.PRESET_BOBOT[kunci].label;
        if (!await app.konfirmasi("Terapkan preset \"" + label + "\"? Komponen saat ini akan diganti (nilai siswa tetap aman).")) return;
        const baru = app.terapkanPreset(kunci, daftar);
        if (baru) {
          daftar = baru;
          pengaturan.presetAktif = kunci;
          Store.set("pengaturan", pengaturan);
          render();
          app.toast("Preset \"" + label + "\" diterapkan. Klik Simpan untuk menyimpan.", "success");
        }
      });
    });

    target.querySelector("#kpSimpan").onclick = function () {
      const v = app.validasiBobot(daftar);
      if (!v.valid) {
        app.toast("Total bobot harus 100%. Saat ini " + v.total + "%. " + v.pesan, "danger");
        return;
      }
      // pastikan tiap komponen punya id
      daftar = daftar.map(function (k) { return { id: k.id || Store.uid("k"), nama: k.nama || "Komponen", bobot: parseFloat(k.bobot) || 0 }; });
      Store.set("komponen", daftar);
      app.toast("Komponen & bobot tersimpan.", "success");
      isiPanelInput(root);
      // refresh tombol preset (badge aktif)
      isiPanelKomponen(root);
    };
  }

  /* ---------- PANEL: INPUT NILAI (spreadsheet) ---------- */
  function isiPanelInput(root) {
    const target = root.querySelector("#panel-input");
    const siswa = Store.get("siswa");
    const komponen = Store.get("komponen");
    const nilai = Store.get("nilai");

    // Cek prasyarat
    if (!siswa.length || !komponen.length) {
      target.innerHTML = '<div class="alert alert--warning">' +
        (!siswa.length ? "Belum ada siswa. " : "") +
        (!komponen.length ? "Belum ada komponen nilai. " : "") +
        'Silakan tambahkan di tab <strong>Daftar Siswa</strong> dan <strong>Komponen &amp; Bobot</strong> terlebih dahulu.</div>';
      return;
    }

    // Status validasi bobot
    const v = app.validasiBobot(komponen);
    const alertBobot = v.valid
      ? '<div class="alert alert--success">Total bobot 100% ✓. Nilai Akhir dihitung sebagai rata-rata tertimbang.</div>'
      : '<div class="alert alert--warning">Total bobot ' + v.total + "% (harus 100%). Nilai Akhir sementara dihitung dari bobot saat ini. Perbaiki di tab Komponen &amp; Bobot.</div>";

    // Bangun header kolom: tiap komponen punya sub-baris entri (mis. UH1, UH2...)
    // Untuk kesederhanaan, tiap komponen punya 1 sel input teks yang menerima banyak nilai dipisah koma/spasi.
    const headKomp = komponen.map(function (k) {
      const v2 = app.validasiBobot([k]);
      return "<th>" + app.esc(k.nama) + '<br><span class="field-note">bobot ' + k.bobot + "%</span></th>";
    }).join("");

    // Bangun baris siswa
    const baris = siswa.map(function (m) {
      const hitung = app.hitungNilaiAkhir(nilai[m.id] || {}, komponen);
      const kat = app.kategoriNilai(hitung.akhir);
      const selKomp = komponen.map(function (k) {
        const entri = (nilai[m.id] && nilai[m.id][k.id]) || [];
        const val = entri.join(", ");
        return '<td class="num"><input type="text" class="ns-input" data-s="' + m.id + '" data-k="' + k.id + '" value="' + app.esc(val) + '" inputmode="decimal" placeholder="0" title="Pisahkan banyak nilai dengan koma, mis. 80, 75, 90" /></td>';
      }).join("");
      const finalCell = hitung.akhir !== null
        ? '<span style="color:' + kat.warna + '">' + hitung.akhir + "</span><br><span class='badge' style='background:" + kat.warna + "22;color:" + kat.warna + "'>" + app.esc(kat.label) + "</span>"
        : "<span class='text-muted'>—</span>";
      return "<tr>" +
        '<td class="num">' + app.esc(m.nisn || "") + "</td>" +
        "<td>" + app.esc(m.nama) + "</td>" +
        selKomp +
        '<td class="num final" data-final="' + m.id + '">' + finalCell + "</td>" +
      "</tr>";
    }).join("");

    // Rata-rata kelas per komponen
    const siswaIds = siswa.map(function (m) { return m.id; });
    const footKomp = komponen.map(function (k) {
      const r = app.rataKelas(nilai, siswaIds, k.id);
      return '<td class="num">' + (r !== null ? r : "—") + "</td>";
    }).join("");
    // Rata-rata kelas nilai akhir
    let sumAkhir = 0, cntAkhir = 0;
    siswa.forEach(function (m) {
      const h = app.hitungNilaiAkhir(nilai[m.id] || {}, komponen);
      if (h.akhir !== null) { sumAkhir += h.akhir; cntAkhir++; }
    });
    const rataAkhir = cntAkhir ? Store.angkaBersih(sumAkhir / cntAkhir) : null;

    target.innerHTML = alertBobot +
      '<div class="card">' +
        '<div class="card__header"><h3>Tabel Nilai</h3>' +
        '<div class="btn-row">' +
          '<button class="btn btn--ghost btn--sm" id="nsExportCSV">CSV</button>' +
          '<button class="btn btn--ghost btn--sm" id="nsExportJSON">JSON</button>' +
          '<button class="btn btn--primary btn--sm" id="nsCetak">Cetak / PDF</button>' +
        "</div></div>" +
        '<p class="text-muted">Masukkan nilai 0–100. Banyak nilai dalam satu komponen dipisah koma (mis. <code>80, 75, 90</code>) → otomatis dirata-rata. Klik di luar sel untuk menyimpan.</p>' +
        '<div class="table-wrap"><table class="data grade-sheet" id="tabelNilai">' +
          "<thead><tr>" +
          '<th class="num">NISN</th><th>Nama</th>' + headKomp +
          '<th class="num">Nilai Akhir</th>' +
          "</tr></thead>" +
          "<tbody>" + baris + "</tbody>" +
          '<tfoot><tr><td colspan="2"><strong>Rata-rata Kelas</strong></td>' + footKomp +
          '<td class="num"><strong>' + (rataAkhir !== null ? rataAkhir : "—") + "</strong></td></tr></tfoot>" +
        "</table></div>" +
      "</div>";

    // Handler input: simpan per sel + update nilai akhir baris tersebut
    target.querySelectorAll(".ns-input").forEach(function (inp) {
      function simpan() {
        const sid = inp.getAttribute("data-s");
        const kid = inp.getAttribute("data-k");
        const nilaiAll = Store.get("nilai");
        if (!nilaiAll[sid]) nilaiAll[sid] = {};
        // parse: pisah koma/spasi, ambil angka 0–100
        const parts = inp.value.split(/[,;\s]+/).map(function (x) { return x.trim(); }).filter(Boolean);
        const angka = parts.map(function (x) {
          let n = parseFloat(x.replace(",", "."));
          if (isNaN(n)) return null;
          n = Math.max(0, Math.min(100, n)); // validasi 0–100
          return n;
        }).filter(function (x) { return x !== null; });
        nilaiAll[sid][kid] = angka;
        Store.set("nilai", nilaiAll);
        inp.value = angka.join(", "); // rapikan tampilan
        // update sel nilai akhir baris ini
        const hitung = app.hitungNilaiAkhir(nilaiAll[sid], komponen);
        const kat = app.kategoriNilai(hitung.akhir);
        const cell = target.querySelector('[data-final="' + sid + '"]');
        if (cell) {
          cell.innerHTML = hitung.akhir !== null
            ? '<span style="color:' + kat.warna + '">' + hitung.akhir + "</span><br><span class='badge' style='background:" + kat.warna + "22;color:" + kat.warna + "'>" + app.esc(kat.label) + "</span>"
            : "<span class='text-muted'>—</span>";
        }
        // update footer rata-rata (efisien: re-render footer saja)
        updateFooterRata();
      }
      inp.addEventListener("change", simpan);
      inp.addEventListener("blur", simpan);
    });

    function updateFooterRata() {
      const nilaiAll = Store.get("nilai");
      const tds = target.querySelectorAll("tfoot td");
      // indeks: 0..1 = colspan label, lalu per komponen, terakhir nilai akhir
      komponen.forEach(function (k, idx) {
        const r = app.rataKelas(nilaiAll, siswaIds, k.id);
        const td = tds[2 + idx];
        if (td) td.textContent = r !== null ? r : "—";
      });
      let sumAkhir2 = 0, cnt2 = 0;
      siswa.forEach(function (m) {
        const h = app.hitungNilaiAkhir(nilaiAll[m.id] || {}, komponen);
        if (h.akhir !== null) { sumAkhir2 += h.akhir; cnt2++; }
      });
      const tdAkhir = tds[tds.length - 1];
      if (tdAkhir) tdAkhir.innerHTML = "<strong>" + (cnt2 ? Store.angkaBersih(sumAkhir2 / cnt2) : "—") + "</strong>";
    }

    // Tombol ekspor
    target.querySelector("#nsExportCSV").onclick = function () { exportCSV(); };
    target.querySelector("#nsExportJSON").onclick = function () { exportJSON(); };
    target.querySelector("#nsCetak").onclick = function () {
      const v2 = app.validasiBobot(komponen);
      if (!v2.valid) {
        if (!confirm("Total bobot belum 100% (" + v2.total + "%). Tetap cetak?")) return;
      }
      window.GHPDF.cetakNilai();
    };
  }

  /* ---------- EKSPOR ---------- */
  function exportCSV() {
    const siswa = Store.get("siswa");
    const komponen = Store.get("komponen");
    const nilai = Store.get("nilai");
    const header = ["NISN", "Nama"].concat(komponen.map(function (k) { return k.nama + " (" + k.bobot + "%)"; })).concat(["Nilai Akhir", "Kategori"]);
    const rows = siswa.map(function (m) {
      const h = app.hitungNilaiAkhir(nilai[m.id] || {}, komponen);
      const kat = app.kategoriNilai(h.akhir);
      const kompVals = komponen.map(function (k) {
        const entri = (nilai[m.id] && nilai[m.id][k.id]) || [];
        const angka = entri.map(parseFloat).filter(function (x) { return !isNaN(x); });
        return angka.length ? Store.angkaBersih(angka.reduce(function (s, x) { return s + x; }, 0) / angka.length) : "";
      });
      return [m.nisn || "", m.nama].concat(kompVals).concat([h.akhir !== null ? h.akhir : "", h.akhir !== null ? kat.label : ""]);
    });
    const csv = [header, ...rows].map(function (r) {
      return r.map(function (c) {
        const s = String(c == null ? "" : c);
        return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
      }).join(",");
    }).join("\n");
    Store.unduh("rekap-nilai-" + new Date().toISOString().slice(0, 10) + ".csv", "\ufeff" + csv, "text/csv;charset=utf-8");
    app.toast("CSV diunduh.", "success");
  }

  function exportJSON() {
    const data = { siswa: Store.get("siswa"), komponen: Store.get("komponen"), nilai: Store.get("nilai") };
    Store.unduh("nilai-" + new Date().toISOString().slice(0, 10) + ".json", JSON.stringify(data, null, 2), "application/json");
    app.toast("JSON diunduh.", "success");
  }

  /* ---------- BANGUN HTML DOKUMEN NILAI (untuk cetak html2canvas) ---------- */
  app.bangunDokumenNilaiHTML = function () {
    const idn = Store.get("identitas");
    const siswa = Store.get("siswa");
    const komponen = Store.get("komponen");
    const nilai = Store.get("nilai");
    const p = Store.get("pengesahan");
    const aset = Store.get("aset");
    const tanggalTtd = p.tanggal ? app.tglPendek(p.tanggal) : "_____________";

    const headKomp = komponen.map(function (k) { return "<th>" + app.esc(k.nama) + "<br>(" + k.bobot + "%)</th>"; }).join("");
    const siswaIds = siswa.map(function (m) { return m.id; });

    const baris = siswa.map(function (m, idx) {
      const h = app.hitungNilaiAkhir(nilai[m.id] || {}, komponen);
      const kat = app.kategoriNilai(h.akhir);
      const selKomp = komponen.map(function (k) {
        const r = (function () {
          const entri = (nilai[m.id] && nilai[m.id][k.id]) || [];
          const angka = entri.map(parseFloat).filter(function (x) { return !isNaN(x); });
          return angka.length ? Store.angkaBersih(angka.reduce(function (s, x) { return s + x; }, 0) / angka.length) : "—";
        })();
        return '<td class="num">' + r + "</td>";
      }).join("");
      return "<tr>" +
        '<td class="num">' + (idx + 1) + "</td>" +
        '<td class="num">' + app.esc(m.nisn || "") + "</td>" +
        "<td>" + app.esc(m.nama) + "</td>" +
        selKomp +
        '<td class="num"><strong>' + (h.akhir !== null ? h.akhir : "—") + "</strong></td>" +
        '<td class="num">' + (h.akhir !== null ? app.esc(kat.label) : "—") + "</td>" +
      "</tr>";
    }).join("");

    const footKomp = komponen.map(function (k) {
      const r = app.rataKelas(nilai, siswaIds, k.id);
      return '<td class="num">' + (r !== null ? r : "—") + "</td>";
    }).join("");

    function kolomTTD(peran, data, ttdUrl) {
      return '<div><div>' + app.esc(peran) + "</div>" +
        '<div class="doc-pengesahan__sign">' + (ttdUrl ? '<img src="' + ttdUrl + '" alt="ttd" />' : '<span style="color:#999">Tanda tangan</span>') + "</div>" +
        '<div style="margin-top:.4rem"><strong>' + (data.nama ? app.esc(data.nama) : "............................") + "</strong></div>" +
        "<div>NIP. " + (data.nip ? app.esc(data.nip) : "......................") + "</div></div>";
    }

    return '<div class="doc-preview" id="dokumenNilai">' +
      app.renderKop(idn) +
      '<div class="doc-title">REKAP NILAI SISWA</div>' +
      '<div class="table-wrap" style="font-family:inherit"><table class="data" style="width:100%">' +
        "<thead><tr>" +
        '<th class="num">No</th><th class="num">NISN</th><th>Nama</th>' + headKomp +
        '<th class="num">Akhir</th><th class="num">Kategori</th>' +
        "</tr></thead><tbody>" + baris + "</tbody>" +
        '<tfoot><tr><td colspan="3"><strong>Rata-rata Kelas</strong></td>' + footKomp + '<td colspan="2"></td></tr></tfoot>' +
      "</table></div>" +
      '<div class="doc-pengesahan">' +
        kolomTTD("Kepala Sekolah", p.kepsek, aset.ttdKepsek) +
        '<div><div>' + app.esc(p.kota || "_____________") + ", " + tanggalTtd + "</div>" +
        '<div class="doc-pengesahan__sign">' + (aset.ttdGuru ? '<img src="' + aset.ttdGuru + '" alt="ttd" />' : '<span style="color:#999">Tanda tangan</span>') + "</div>" +
        '<div style="margin-top:.4rem"><strong>' + (p.guru.nama ? app.esc(p.guru.nama) : "............................") + "</strong></div>" +
        "<div>NIP. " + (p.guru.nip ? app.esc(p.guru.nip) : "......................") + "</div></div>" +
      "</div>" +
    "</div>";
  };
})();
