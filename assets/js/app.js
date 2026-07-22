/* =====================================================================
   app.js — Bootstrap, Router SPA, Utilitas UI bersama, halaman Beranda
   ===================================================================== */
(function () {
  "use strict";

  const app = window.GHApp = window.GHApp || {};
  const Store = window.GHStore;

  /* ---------- UTIL: escape & membuat elemen ---------- */
  function esc(s) {
    if (s === null || s === undefined) return "";
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  app.esc = esc;

  // helper: format tanggal ID
  function tglID(str) {
    if (!str) return "";
    const d = new Date(str + "T00:00:00");
    if (isNaN(d.getTime())) return str;
    return d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }
  app.tglID = tglID;

  function tglPendek(str) {
    if (!str) return "";
    const d = new Date(str + "T00:00:00");
    if (isNaN(d.getTime())) return str;
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  }
  app.tglPendek = tglPendek;

  /* ---------- TOAST ---------- */
  function toast(pesan, tipe) {
    const area = document.getElementById("toastArea");
    if (!area) return;
    const el = document.createElement("div");
    el.className = "toast toast--" + (tipe || "info");
    el.textContent = pesan;
    area.appendChild(el);
    setTimeout(function () {
      el.style.opacity = "0";
      el.style.transition = "opacity .3s";
      setTimeout(function () { el.remove(); }, 320);
    }, 3500);
  }
  app.toast = toast;

  /* ---------- MODAL ---------- */
  // opts: { title, bodyHTML, wide, footerHTML }
  app.modal = {
    buka(opts) {
      const overlay = document.getElementById("modalOverlay");
      document.getElementById("modalTitle").textContent = opts.title || "";
      document.getElementById("modalBody").innerHTML = opts.bodyHTML || "";
      document.getElementById("modalFooter").innerHTML = opts.footerHTML || "";
      const box = document.getElementById("modalBox");
      box.classList.toggle("modal--wide", !!opts.wide);
      overlay.hidden = false;
      // fokus awal
      const focusable = box.querySelector("input, select, textarea, button, a, [tabindex]");
      if (focusable) setTimeout(() => focusable.focus(), 30);
    },
    tutup() {
      document.getElementById("modalOverlay").hidden = true;
    },
    setBody(html) { document.getElementById("modalBody").innerHTML = html; },
    setFooter(html) { document.getElementById("modalFooter").innerHTML = html; }
  };

  // Event modal
  document.addEventListener("click", function (e) {
    if (e.target.id === "modalClose" || e.target.id === "modalOverlay") {
      app.modal.tutup();
    }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") app.modal.tutup();
  });

  /* ---------- KONFIRMASI (Promise) ---------- */
  app.konfirmasi = function (pesan, opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      app.modal.buka({
        title: opts.title || "Konfirmasi",
        bodyHTML: "<p>" + esc(pesan) + "</p>",
        footerHTML:
          '<button class="btn btn--ghost" id="konfBatal">' + esc(opts.batal || "Batal") + "</button>" +
          '<button class="btn ' + (opts.bahaya ? "btn--danger" : "btn--primary") + '" id="konfOK">' + esc(opts.ok || "Ya, lanjutkan") + "</button>"
      });
      document.getElementById("konfBatal").onclick = function () { app.modal.tutup(); resolve(false); };
      document.getElementById("konfOK").onclick = function () { app.modal.tutup(); resolve(true); };
    });
  };

  /* ---------- NAVIGASI MOBILE ---------- */
  function initNav() {
    const toggle = document.getElementById("navToggle");
    const nav = document.getElementById("navUtama");
    toggle.addEventListener("click", function () {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    // tutup setelah klik link
    nav.addEventListener("click", function (e) {
      if (e.target.classList.contains("nav__link")) {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- ROUTER ---------- */
  const RUTE = {
    "/": "renderBeranda",
    "/jurnal": "renderJurnal",
    "/nilai": "renderNilai",
    "/pengaturan": "renderPengaturan"
  };

  function ruteAktif() {
    const h = location.hash.replace(/^#/, "") || "/";
    return RUTE[h] ? h : "/";
  }

  function navigasi() {
    const rute = ruteAktif();
    // tandai link aktif
    document.querySelectorAll(".nav__link").forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("data-route") === rute);
    });
    // render
    const fn = RUTE[rute];
    const konten = document.getElementById("konten-utama");
    konten.innerHTML = '<p class="text-muted">Memuat…</p>';
    try {
      if (app[fn]) {
        app[fn](konten);
      } else {
        konten.innerHTML = '<div class="alert alert--danger">Halaman tidak ditemukan.</div>';
      }
    } catch (e) {
      console.error(e);
      konten.innerHTML = '<div class="alert alert--danger">Terjadi kesalahan saat memuat halaman: ' + esc(e.message) + "</div>";
    }
    // scroll ke atas + fokus konten
    konten.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ---------- HALAMAN BERANDA ---------- */
  app.renderBeranda = function (el) {
    const idn = Store.get("identitas");
    const jurnal = Store.get("jurnal") || [];
    const siswa = Store.get("siswa") || [];
    const aset = Store.get("aset");

    const namaSekolah = idn.sekolah ? esc(idn.sekolah) : '<span class="text-muted">belum diisi</span>';

    el.innerHTML =
      '<section class="hero">' +
        '<h1>Selamat datang di Guruku Hebat 👋</h1>' +
        "<p>Platform ringan untuk membantu Bapak/Ibu guru mengelola <strong>jurnal pembelajaran</strong> dan <strong>rekap nilai siswa</strong> — lengkap dengan cetak PDF resmi dan tanda tangan digital.</p>" +
        '<div class="hero__actions">' +
          '<a class="btn" href="#/jurnal">Buat Jurnal Pembelajaran</a>' +
          '<a class="btn" href="#/nilai" style="background:rgba(255,255,255,.2);color:#fff;">Input Nilai Siswa</a>' +
        "</div>" +
      "</section>" +

      '<div class="stat-grid">' +
        '<div class="stat"><div class="stat__label">Sekolah</div><div class="stat__value" style="font-size:1rem;line-height:1.3">' + namaSekolah + "</div>" +
        '<div class="stat__hint">' + esc(idn.kelas || "—") + (idn.tahun ? " · " + esc(idn.tahun) : "") + "</div></div>" +
        '<div class="stat"><div class="stat__label">Entri Jurnal</div><div class="stat__value">' + jurnal.length + "</div>" +
        '<div class="stat__hint">pertemuan tercatat</div></div>' +
        '<div class="stat"><div class="stat__label">Siswa</div><div class="stat__value">' + siswa.length + "</div>" +
        '<div class="stat__hint">dalam daftar</div></div>' +
        '<div class="stat"><div class="stat__label">Logo &amp; TTD</div><div class="stat__value">' + (aset.logo ? "✓" : "—") + '</div>' +
        '<div class="stat__hint">cek Pengaturan</div></div>' +
      "</div>" +

      '<div class="card mt-2">' +
        "<h2><span class=\"card__title-icon\">🚀</span>Mulai dari mana?</h2>" +
        '<div class="form-grid">' +
          '<a class="card-link" href="#/pengaturan"><div class="stat"><div class="stat__label">Langkah 1</div><div class="stat__value" style="font-size:1rem">Pengaturan Awal</div>' +
          '<div class="stat__hint">Identitas sekolah, logo, tanda tangan</div></div></a>' +
          '<a class="card-link" href="#/jurnal"><div class="stat"><div class="stat__label">Langkah 2</div><div class="stat__value" style="font-size:1rem">Jurnal Harian</div>' +
          '<div class="stat__hint">Isi & cetak jurnal mingguan</div></div></a>' +
          '<a class="card-link" href="#/nilai"><div class="stat"><div class="stat__label">Langkah 3</div><div class="stat__value" style="font-size:1rem">Nilai Siswa</div>' +
          '<div class="stat__hint">Input & rekap otomatis</div></div></a>' +
        "</div>" +
      "</div>" +

      '<div class="card">' +
        "<h3>💡 Catatan</h3>" +
        "<p class=\"text-muted mb-0\">Semua data disimpan di perangkat ini (peramban). Gunakan tombol <strong>Export</strong> di tiap fitur untuk membuat cadangan, dan <strong>Pengaturan → Backup</strong> untuk memindahkan data ke perangkat lain.</p>" +
      "</div>";
  };

  /* ---------- HALAMAN PENGATURAN ---------- */
  app.renderPengaturan = function (el) {
    el.innerHTML =
      '<div class="page-head"><div class="breadcrumb">Pengaturan</div>' +
      "<h1>Pengaturan</h1>" +
      '<p class="text-muted">Atur identitas sekolah, logo & tanda tangan, pengesahan, bobot nilai, dan cadangan data.</p></div>' +

      '<div class="tabs" role="tablist">' +
        '<button class="tab active" data-ptab="identitas">Identitas Sekolah</button>' +
        '<button class="tab" data-ptab="aset">Logo &amp; Tanda Tangan</button>' +
        '<button class="tab" data-ptab="pengesahan">Pengesahan</button>' +
        '<button class="tab" data-ptab="bobot">Bobot &amp; Kategori</button>' +
        '<button class="tab" data-ptab="backup">Backup Data</button>' +
      "</div>" +

      '<div class="tab-panel active" data-ppanel="identitas"><div id="panel-identitas"></div></div>' +
      '<div class="tab-panel" data-ppanel="aset"><div id="panel-aset"></div></div>' +
      '<div class="tab-panel" data-ppanel="pengesahan"><div id="panel-pengesahan"></div></div>' +
      '<div class="tab-panel" data-ppanel="bobot"><div id="panel-bobot"></div></div>' +
      '<div class="tab-panel" data-ppanel="backup"><div id="panel-backup"></div></div>';

    // Tab switching
    el.querySelectorAll(".tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        const id = tab.getAttribute("data-ptab");
        el.querySelectorAll(".tab").forEach(function (t) { t.classList.toggle("active", t === tab); });
        el.querySelectorAll(".tab-panel").forEach(function (p) {
          p.classList.toggle("active", p.getAttribute("data-ppanel") === id);
        });
      });
    });

    isiPanelIdentitas(el);
    isiPanelAset(el);
    isiPanelPengesahan(el);
    isiPanelBobot(el);
    isiPanelBackup(el);
  };

  function isiPanelIdentitas(root) {
    const target = root.querySelector("#panel-identitas");
    target.innerHTML = '<div class="card"><h3>Data Sekolah</h3><p class="text-muted">Data ini dipakai di kop dokumen jurnal & rekap nilai. Diisi sekali, otomatis tersimpan.</p><div id="form-identitas"></div></div>';
    app.renderFormIdentitas(target.querySelector("#form-identitas"), {
      tombolLabel: "Simpan Identitas",
      onSubmit: function () { /* toast sudah muncul */ }
    });
  }

  function isiPanelAset(root) {
    const aset = Store.get("aset");
    const target = root.querySelector("#panel-aset");
    function baris(judul, desk, tombolLabel, kunciAset, w, h) {
      const data = aset[kunciAset];
      return '<div class="card">' +
        '<div class="flex-between"><div><h3 class="mt-0">' + judul + "</h3>" +
        '<p class="text-muted mb-0">' + desk + "</p></div>" +
        '<div class="upload-preview" ' + (data ? "" : "hidden") + ">" + app.tampilAset(data, judul, w, h) + "</div></div>" +
        '<div class="btn-row mt-1">' +
          '<button class="btn btn--secondary btn--sm" data-aset="' + kunciAset + '">' + tombolLabel + "</button>" +
          (data ? '<button class="btn btn--ghost btn--sm" data-aset-hapus="' + kunciAset + '">Hapus</button>' : "") +
        "</div></div>";
    }
    target.innerHTML =
      baris("Logo Sekolah", "Tampil di kop (header) dokumen jurnal & rekap nilai.", "Unggah / Ganti Logo", "logo", 90, 90) +
      baris("Tanda Tangan Kepala Sekolah", "Bisa diunggah sebagai gambar atau dibuat langsung di layar.", "Atur TTD Kepala Sekolah", "ttdKepsek", 120, 60) +
      baris("Tanda Tangan Guru", "Bisa diunggah sebagai gambar atau dibuat langsung di layar.", "Atur TTD Guru", "ttdGuru", 120, 60) +
      baris("Stempel (opsional)", "Cap/stempel sekolah, disisipkan dekat tanda tangan.", "Unggah / Ganti Stempel", "stempel", 90, 90);

    // Event tombol
    target.querySelectorAll("[data-aset]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const kunci = btn.getAttribute("data-aset");
        app.bukaUnggahGambar({
          title: btn.textContent.trim(),
          label: "Unggah gambar " + btn.textContent.trim().toLowerCase(),
          dataSaatIni: aset[kunci],
          bolehHapus: !!aset[kunci],
          onSimpan: function (dataUrl) {
            aset[kunci] = dataUrl;
            Store.set("aset", aset);
            app.toast("Gambar tersimpan.", "success");
            isiPanelAset(root);
          },
          onHapus: function () {
            aset[kunci] = "";
            Store.set("aset", aset);
            app.toast("Gambar dihapus.", "info");
            isiPanelAset(root);
          }
        });
      });
    });
    target.querySelectorAll("[data-aset-hapus]").forEach(function (btn) {
      btn.addEventListener("click", async function () {
        const kunci = btn.getAttribute("data-aset-hapus");
        if (await app.konfirmasi("Hapus gambar ini?", { bahaya: true, ok: "Hapus" })) {
          aset[kunci] = "";
          Store.set("aset", aset);
          app.toast("Gambar dihapus.", "info");
          isiPanelAset(root);
        }
      });
    });
  }

  function isiPanelPengesahan(root) {
    const target = root.querySelector("#panel-pengesahan");
    const p = Store.get("pengesahan");

    target.innerHTML = '<div class="card"><h3>Blok Pengesahan</h3>' +
      '<p class="text-muted">Muncul di bagian bawah dokumen cetak: kota & tanggal, lalu dua kolom (Kepala Sekolah & Guru) berisi nama, NIP, dan area tanda tangan.</p>' +
      '<div class="form-grid">' +
        '<div class="form-group"><label for="pg-kota">Kota</label><input type="text" id="pg-kota" value="' + app.esc(p.kota) + '" placeholder="mis. Yogyakarta" /></div>' +
        '<div class="form-group"><label for="pg-tanggal">Tanggal Pengesahan</label><input type="date" id="pg-tanggal" value="' + app.esc(p.tanggal) + '" /></div>' +
      "</div>" +
      '<h4 class="mt-2">Kepala Sekolah</h4>' +
      '<div class="form-grid">' +
        '<div class="form-group"><label for="pg-ks-nama">Nama</label><input type="text" id="pg-ks-nama" value="' + app.esc(p.kepsek.nama) + '" placeholder="Nama lengkap" /></div>' +
        '<div class="form-group"><label for="pg-ks-nip">NIP</label><input type="text" id="pg-ks-nip" value="' + app.esc(p.kepsek.nip) + '" placeholder="Nomor Induk Pegawai" /></div>' +
      "</div>" +
      '<h4 class="mt-2">Guru</h4>' +
      '<div class="form-grid">' +
        '<div class="form-group"><label for="pg-g-nama">Nama</label><input type="text" id="pg-g-nama" value="' + app.esc(p.guru.nama) + '" placeholder="Nama lengkap" /></div>' +
        '<div class="form-group"><label for="pg-g-nip">NIP</label><input type="text" id="pg-g-nip" value="' + app.esc(p.guru.nip) + '" placeholder="Nomor Induk Pegawai" /></div>' +
      "</div>" +
      '<div class="btn-row mt-1"><button class="btn btn--primary" id="pgSimpan">Simpan Pengesahan</button></div>' +
      "</div>";

    document.getElementById("pgSimpan").onclick = function () {
      const data = {
        kota: document.getElementById("pg-kota").value.trim(),
        tanggal: document.getElementById("pg-tanggal").value,
        kepsek: {
          nama: document.getElementById("pg-ks-nama").value.trim(),
          nip: document.getElementById("pg-ks-nip").value.trim()
        },
        guru: {
          nama: document.getElementById("pg-g-nama").value.trim(),
          nip: document.getElementById("pg-g-nip").value.trim()
        }
      };
      Store.set("pengesahan", data);
      app.toast("Data pengesahan tersimpan.", "success");
    };
  }

  function isiPanelBobot(root) {
    const target = root.querySelector("#panel-bobot");
    const pengaturan = Store.get("pengaturan");

    target.innerHTML = '<div class="card"><h3>Preset Bobot Default</h3>' +
      '<p class="text-muted">Pilih preset yang otomatis dipakai saat membuka halaman Nilai Siswa. Anda masih bisa mengubah komponen & bobot kapan saja di halaman Nilai.</p>' +
      '<div class="form-grid">' +
        Object.keys(app.PRESET_BOBOT).map(function (k) {
          const p = app.PRESET_BOBOT[k];
          const cek = pengaturan.presetAktif === k ? "checked" : "";
          return '<label class="card" style="cursor:pointer"><input type="radio" name="presetDef" value="' + k + '" ' + cek + " /> <strong>" + app.esc(p.label) + "</strong><br><span class=\"field-note\">" + app.esc(p.desc) + "</span></label>";
        }).join("") +
      "</div></div>" +

      '<div class="card"><h3>Kategori Capaian</h3>' +
      '<p class="text-muted">Rentang nilai → label & warna. Bisa diubah. Pastikan rentang saling melengkapi (0–100).</p>' +
      '<div id="kategori-wrap"></div>' +
      '<div class="btn-row mt-1"><button class="btn btn--ghost btn--sm" id="katTambah">+ Tambah Kategori</button>' +
      '<button class="btn btn--secondary btn--sm" id="katReset">Kembalikan Default</button></div>' +
      '<div class="btn-row mt-2"><button class="btn btn--primary" id="katSimpan">Simpan Kategori</button></div></div>';

    // Render baris kategori
    function renderKategori(kategori) {
      const wrap = target.querySelector("#kategori-wrap");
      wrap.innerHTML = kategori.map(function (k, i) {
        return '<div class="entry-row" style="grid-template-columns:60px 70px 1fr 70px auto">' +
          '<div class="form-group"><label>Min</label><input type="number" class="kat-min" data-i="' + i + '" value="' + k.min + '" min="0" max="100" /></div>' +
          '<div class="form-group"><label>Maks</label><input type="number" class="kat-max" data-i="' + i + '" value="' + k.max + '" min="0" max="100" /></div>' +
          '<div class="form-group"><label>Label</label><input type="text" class="kat-label" data-i="' + i + '" value="' + app.esc(k.label) + '" /></div>' +
          '<div class="form-group"><label>Warna</label><input type="color" class="kat-warna" data-i="' + i + '" value="' + (k.warna || "#1d4ed8") + '" style="height:42px;padding:4px" /></div>' +
          '<button class="btn btn--ghost btn--sm entry-row__remove" data-hapus-i="' + i + '">✕</button>' +
        "</div>";
      }).join("");
      wrap.querySelectorAll("[data-hapus-i]").forEach(function (b) {
        b.addEventListener("click", function () {
          const i = parseInt(b.getAttribute("data-hapus-i"), 10);
          kategori.splice(i, 1);
          renderKategori(kategori);
        });
      });
      target._kategori = kategori;
    }
    let kategori = JSON.parse(JSON.stringify(pengaturan.kategori));
    renderKategori(kategori);

    target.querySelector("#katTambah").onclick = function () {
      kategori.push({ min: 0, max: 0, label: "Baru", warna: "#94a3b8" });
      renderKategori(kategori);
    };
    target.querySelector("#katReset").onclick = async function () {
      if (await app.konfirmasi("Kembalikan kategori ke pengaturan default?")) {
        kategori = JSON.parse(JSON.stringify(Store.DEFAULTS.pengaturan.kategori));
        renderKategori(kategori);
        app.toast("Kategori dikembalikan ke default (belum disimpan).", "info");
      }
    };
    target.querySelector("#katSimpan").onclick = function () {
      // baca dari DOM
      const mins = Array.from(target.querySelectorAll(".kat-min")).map(function (e) { return parseInt(e.value, 10); });
      const maxs = Array.from(target.querySelectorAll(".kat-max")).map(function (e) { return parseInt(e.value, 10); });
      const labels = Array.from(target.querySelectorAll(".kat-label")).map(function (e) { return e.value.trim(); });
      const warnas = Array.from(target.querySelectorAll(".kat-warna")).map(function (e) { return e.value; });
      const baru = mins.map(function (m, i) {
        return { min: m, max: maxs[i], label: labels[i] || "—", warna: warnas[i] };
      });
      // validasi sederhana
      const tidakValid = baru.some(function (k) { return isNaN(k.min) || isNaN(k.max) || k.min > k.max || !k.label; });
      if (tidakValid) { app.toast("Periksa kembali rentang & label kategori.", "warning"); return; }
      pengaturan.kategori = baru;
      // preset default
      const pilih = target.querySelector('input[name="presetDef"]:checked');
      if (pilih) pengaturan.presetAktif = pilih.value;
      Store.set("pengaturan", pengaturan);
      app.toast("Pengaturan bobot & kategori tersimpan.", "success");
    };
  }

  function isiPanelBackup(root) {
    const target = root.querySelector("#panel-backup");
    target.innerHTML = '<div class="card"><h3>Backup &amp; Pemulihan</h3>' +
      '<p class="text-muted">Ekspor seluruh data (identitas, jurnal, siswa, nilai, aset, pengaturan) sebagai satu berkas JSON untuk cadangan atau pindah perangkat.</p>' +
      '<div class="btn-row">' +
        '<button class="btn btn--primary" id="bkExport">Export Semua Data (JSON)</button>' +
        '<label class="btn btn--secondary" for="bkImport">Import Data (JSON)</label>' +
        '<input type="file" id="bkImport" accept="application/json,.json" hidden />' +
      "</div>" +
      '<hr class="divider" />' +
      '<h3 class="mt-2">Reset Total</h3>' +
      '<p class="text-muted">Menghapus <strong>semua</strong> data di perangkat ini. Tindakan ini tidak bisa dibatalkan.</p>' +
      '<button class="btn btn--danger" id="bkReset">Hapus Semua Data</button>' +
      "</div>" +
      '<div class="alert alert--info mt-2"><strong>Catatan sinkronisasi:</strong> saat ini data hanya tersimpan di perangkat ini. Untuk akses dari beberapa perangkat, bisa ditambahkan backend gratis (mis. Supabase/Firebase) sebagai peningkatan opsional di masa depan.</div>';

    target.querySelector("#bkExport").onclick = function () {
      const data = Store.exportJSON();
      Store.unduh("guruku-hebat-backup-" + new Date().toISOString().slice(0, 10) + ".json", JSON.stringify(data, null, 2), "application/json");
      app.toast("Data diekspor.", "success");
    };
    target.querySelector("#bkImport").addEventListener("change", async function (e) {
      const file = e.target.files[0];
      if (!file) return;
      if (!await app.konfirmasi("Import akan menimpa data saat ini. Lanjutkan?")) { e.target.value = ""; return; }
      try {
        const teks = await Store.bacaFile(file);
        const obj = JSON.parse(teks);
        const n = Store.importJSON(obj);
        app.toast("Import berhasil (" + n + " kategori data).", "success");
        app.renderPengaturan(root); // refresh
      } catch (err) {
        app.toast("Gagal import: " + err.message, "danger");
      }
      e.target.value = "";
    });
    target.querySelector("#bkReset").onclick = async function () {
      if (!await app.konfirmasi("Yakin menghapus SEMUA data? Ini tidak bisa dibatalkan.", { bahaya: true, ok: "Ya, hapus semua" })) return;
      Store.resetSemua();
      app.toast("Semua data dihapus.", "info");
      location.hash = "#/";
      setTimeout(function () { location.reload(); }, 600);
    };
  }

  /* ---------- BOOT ---------- */
  function init() {
    initNav();
    window.addEventListener("hashchange", navigasi);
    navigasi();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
