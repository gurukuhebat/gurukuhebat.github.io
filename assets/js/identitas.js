/* =====================================================================
   identitas.js — Form identitas sekolah (Bagian A) yang dapat dipakai ulang.
   Digunakan di halaman Pengaturan & Jurnal.
   ===================================================================== */
(function () {
  "use strict";

  const app = window.GHApp = window.GHApp || {};
  const Store = window.GHStore;

  /* ---------- Render form identitas ke elemen target ----------
     opts: { onSubmit, tombolLabel } — bila onSubmit diberikan, render tombol simpan. */
  app.renderFormIdentitas = function (target, opts) {
    opts = opts || {};
    const idn = Store.get("identitas");
    target.innerHTML =
      '<div class="form-grid">' +
        '<div class="form-group form-group--full">' +
          '<label for="idn-sekolah">Nama Institusi / Sekolah <span class="req">*</span></label>' +
          '<input type="text" id="idn-sekolah" value="' + app.esc(idn.sekolah) + '" placeholder="mis. MI Al-Hikmah" autocomplete="organization" />' +
        "</div>" +
        '<div class="form-group">' +
          "<label for=\"idn-kelas\">Kelas / Semester</label>" +
          '<input type="text" id="idn-kelas" value="' + app.esc(idn.kelas) + '" placeholder="mis. 4A / Ganjil" />' +
        "</div>" +
        '<div class="form-group">' +
          "<label for=\"idn-tahun\">Tahun Pelajaran</label>" +
          '<input type="text" id="idn-tahun" value="' + app.esc(idn.tahun) + '" placeholder="mis. 2025/2026" />' +
        "</div>" +
        '<div class="form-group form-group--full">' +
          "<label for=\"idn-mapel\">Mata Pelajaran (opsional)</label>" +
          '<input type="text" id="idn-mapel" value="' + app.esc(idn.mapel) + '" placeholder="mis. Akidah Akhlak" />' +
        "</div>" +
      "</div>" +
      (opts.onSubmit
        ? '<div class="btn-row mt-1"><button class="btn btn--primary" id="idnSimpan">' + app.esc(opts.tombolLabel || "Simpan Identitas") + "</button></div>"
        : "");

    if (opts.onSubmit) {
      document.getElementById("idnSimpan").onclick = function () {
        const sekolah = document.getElementById("idn-sekolah").value.trim();
        if (!sekolah) {
          app.toast("Nama sekolah wajib diisi.", "warning");
          document.getElementById("idn-sekolah").focus();
          return;
        }
        const data = {
          sekolah: sekolah,
          kelas: document.getElementById("idn-kelas").value.trim(),
          tahun: document.getElementById("idn-tahun").value.trim(),
          mapel: document.getElementById("idn-mapel").value.trim()
        };
        Store.set("identitas", data);
        app.toast("Identitas tersimpan.", "success");
        opts.onSubmit(data);
      };
    }
  };

  /* ---------- Baca nilai form identitas langsung dari DOM ---------- */
  app.bacaFormIdentitas = function () {
    return {
      sekolah: (document.getElementById("idn-sekolah") || {}).value || "",
      kelas: (document.getElementById("idn-kelas") || {}).value || "",
      tahun: (document.getElementById("idn-tahun") || {}).value || "",
      mapel: (document.getElementById("idn-mapel") || {}).value || ""
    };
  };

  /* ---------- Render blok KOP dokumen (untuk pratinjau & cetak) ---------- */
  app.renderKop = function (idnOpsional) {
    const idn = idnOpsional || Store.get("identitas");
    const aset = Store.get("aset");
    const logoHTML = aset.logo
      ? '<img src="' + aset.logo + '" alt="Logo" class="doc-kop__logo" />'
      : '<div class="doc-kop__logo" style="display:flex;align-items:center;justify-content:center;border:1px dashed #999;color:#999;font-size:.7rem">LOGO</div>';

    const subBagian = [idn.kelas, idn.tahun, idn.mapel].filter(Boolean).map(app.esc).join(" · ");

    return '<div class="doc-kop">' +
      logoHTML +
      '<div class="doc-kop__text">' +
        '<div class="doc-kop__school">' + app.esc(idn.sekolah || "NAMA SEKOLAH") + "</div>" +
        (subBagian ? '<div class="doc-kop__subtitle">' + subBagian + "</div>" : "") +
      "</div>" +
    "</div>";
  };
})();
