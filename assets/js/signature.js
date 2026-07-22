/* =====================================================================
   signature.js — Tanda tangan digital (signature_pad) & upload gambar
   - Canvas halus (desktop & HP), simpan sebagai PNG transparan.
   - Upload gambar untuk ttd/stempel/logo → data URL (localStorage).
   ===================================================================== */
(function () {
  "use strict";

  const app = window.GHApp = window.GHApp || {};
  const Store = window.GHStore;

  /* ---------- KONSTANTA RASIO CANVAS TTD ---------- */
  const CANVAS_W = 420;
  const CANVAS_H = 180;

  /* ---------- BUKA MODAL TANDA TANGAN (signature_pad) ----------
     opts: { title, onSimpan(dataUrl), onHapus() }
     Mengembalikan instance melalui callback. */
  app.bukaTandaTangan = function (opts) {
    opts = opts || {};
    app.modal.buka({
      title: opts.title || "Bubuhkan Tanda Tangan",
      bodyHTML:
        '<div class="signature-box" id="sigBox">' +
          '<canvas id="sigCanvas" width="' + CANVAS_W + '" height="' + CANVAS_H + '"></canvas>' +
        "</div>" +
        '<p class="field-note mt-1">Gunakan jari (di HP) atau mouse (di komputer) untuk menandatangani di area di atas.</p>' +
        '<div class="btn-row mt-1"><button class="btn btn--ghost btn--sm" id="sigUlangi">↺ Ulangi</button></div>',
      footerHTML:
        '<button class="btn btn--ghost" id="sigBatal">Batal</button>' +
        (opts.bolehHapus ? '<button class="btn btn--danger" id="sigHapus">Hapus TTD</button>' : "") +
        '<button class="btn btn--primary" id="sigSimpan">Simpan</button>'
    });

    // Inisialisasi signature_pad
    const canvas = document.getElementById("sigCanvas");
    // Sesuaikan rasio tampilan dengan layar (retina-aware)
    function pasangUkuran() {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = CANVAS_W * ratio;
      canvas.height = CANVAS_H * ratio;
      canvas.style.width = "100%";
      canvas.style.height = CANVAS_H + "px";
      const ctx = canvas.getContext("2d");
      ctx.scale(ratio, ratio);
    }
    pasangUkuran();

    let pad;
    try {
      pad = new SignaturePad(canvas, {
        backgroundColor: "rgba(255,255,255,0)", // transparan
        penColor: "#0f172a",
        minWidth: 1.2,
        maxWidth: 3.0,
        velocityFilterWeight: 0.7
      });
    } catch (e) {
      app.toast("Pustaka tanda tangan tidak tersedia.", "danger");
      return;
    }

    document.getElementById("sigUlangi").onclick = function () { pad.clear(); };
    document.getElementById("sigBatal").onclick = function () { app.modal.tutup(); };
    document.getElementById("sigSimpan").onclick = function () {
      if (pad.isEmpty()) {
        app.toast("Tanda tangan masih kosong.", "warning");
        return;
      }
      // PNG transparan
      const dataUrl = pad.toDataURL("image/png");
      app.modal.tutup();
      if (opts.onSimpan) opts.onSimpan(dataUrl);
    };
    if (opts.bolehHapus) {
      document.getElementById("sigHapus").onclick = function () {
        app.modal.tutup();
        if (opts.onHapus) opts.onHapus();
      };
    }
  };

  /* ---------- BUKA MODAL UPLOAD GAMBAR ----------
     opts: { title, label, maxMB, onSimpan(dataUrl), dataSaatIni }
     Menyediakan dua tab: "Unggah File" & "Tanda Tangan Digital". */
  app.bukaUnggahGambar = function (opts) {
    opts = opts || {};
    const maxMB = opts.maxMB || 2;
    app.modal.buka({
      title: opts.title || "Unggah Gambar",
      bodyHTML:
        '<div class="tabs" role="tablist">' +
          '<button class="tab active" id="tabFile" role="tab">Unggah File</button>' +
          '<button class="tab" id="tabTtd" role="tab">Tanda Tangan Digital</button>' +
        "</div>" +
        '<div class="tab-panel active" id="panelFile">' +
          '<div class="upload-zone">' +
            '<p class="mb-0"><strong>' + esc(opts.label || "Pilih gambar") + "</strong></p>" +
            '<p class="field-note">Format JPG/PNG/WEBP · maksimal ' + maxMB + " MB. Disimpan lokal di perangkat ini.</p>" +
            '<input type="file" id="fileInput" accept="image/png,image/jpeg,image/webp" style="max-width:320px;margin:0 auto" />' +
            '<div class="upload-preview mt-1" id="preview" ' + (opts.dataSaatIni ? "" : "hidden") + '">' +
              (opts.dataSaatIni ? '<img src="' + opts.dataSaatIni + '" alt="pratinjau" />' : "") +
            "</div>" +
          "</div>" +
        "</div>" +
        '<div class="tab-panel" id="panelTtd">' +
          '<p class="field-note">Tanda tangan langsung di layar dengan jari/mouse, lalu simpan sebagai PNG transparan.</p>' +
          '<button class="btn btn--secondary" id="bukaTtd">Buka Kanvas Tanda Tangan</button>' +
        "</div>",
      footerHTML:
        '<button class="btn btn--ghost" id="ungBatal">Batal</button>' +
        (opts.bolehHapus ? '<button class="btn btn--danger" id="ungHapus">Hapus</button>' : "") +
        '<button class="btn btn--primary" id="ungSimpan" disabled>Simpan</button>'
    });

    let dataUrlBaru = null;

    // Tab switching
    function gantiTab(idAktif) {
      ["File", "Ttd"].forEach(function (t) {
        const tab = document.getElementById("tab" + t);
        const panel = document.getElementById("panel" + t);
        const aktif = t === idAktif;
        tab.classList.toggle("active", aktif);
        panel.classList.toggle("active", aktif);
      });
    }
    document.getElementById("tabFile").onclick = function () { gantiTab("File"); };
    document.getElementById("tabTtd").onclick = function () { gantiTab("Ttd"); };

    // File input
    document.getElementById("fileInput").addEventListener("change", async function (e) {
      const file = e.target.files[0];
      if (!file) return;
      try {
        dataUrlBaru = await Store.bacaGambar(file, { maxMB: maxMB });
        const preview = document.getElementById("preview");
        preview.innerHTML = '<img src="' + dataUrlBaru + '" alt="pratinjau" />';
        preview.hidden = false;
        document.getElementById("ungSimpan").disabled = false;
      } catch (err) {
        app.toast(err.message, "danger");
      }
    });

    // TTD
    document.getElementById("bukaTtd").onclick = function () {
      app.bukaTandaTangan({
        title: opts.title || "Tanda Tangan",
        onSimpan: function (dataUrl) {
          dataUrlBaru = dataUrl;
          gantiTab("File");
          const preview = document.getElementById("preview");
          preview.innerHTML = '<img src="' + dataUrlBaru + '" alt="pratinjau" />';
          preview.hidden = false;
          document.getElementById("ungSimpan").disabled = false;
          app.toast("Tanda tangan siap disimpan.", "success");
        }
      });
    };

    document.getElementById("ungBatal").onclick = function () { app.modal.tutup(); };
    document.getElementById("ungSimpan").onclick = function () {
      if (!dataUrlBaru) { app.toast("Belum ada gambar dipilih.", "warning"); return; }
      app.modal.tutup();
      if (opts.onSimpan) opts.onSimpan(dataUrlBaru);
    };
    if (opts.bolehHapus) {
      document.getElementById("ungHapus").onclick = function () {
        app.modal.tutup();
        if (opts.onHapus) opts.onHapus();
      };
    }
  };

  /* ---------- RENDER STATIK ASET (helper tampil di Pengaturan) ---------- */
  // Menghasilkan <img> atau placeholder bila kosong.
  app.tampilAset = function (dataUrl, alt, w, h) {
    if (dataUrl) {
      return '<img src="' + dataUrl + '" alt="' + esc(alt) + '" style="max-width:' + (w || 100) + "px;max-height:" + (h || 100) + 'px" />';
    }
    return '<span class="badge badge--muted">kosong</span>';
  };
})();
