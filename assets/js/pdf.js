/* =====================================================================
   pdf.js — Modul Cetak PDF (Engine: pdfmake & html2canvas+jsPDF)
   - pdfmake: teks tajam, bisa diseleksi, tabel tidak terpotong (page-break), multi-halaman rapi
   - html2canvas+jsPDF: sesuai pratinjau (teks jadi gambar, file lebih besar)
   ===================================================================== */
(function () {
  "use strict";

  const app = window.GHApp = window.GHApp || {};
  const Store = window.GHStore;

  // --- Helper untuk konversi Base64 ke struktur Image pdfmake ---
  function getPdfImage(dataUrl, width) {
    if (!dataUrl || !dataUrl.startsWith("data:image")) return null;
    return { image: dataUrl, width: width || 60 };
  }

  // --- Helper untuk Kop Surat ---
  function buildKop(idn, aset) {
    return {
      columns: [
        {
          width: 70,
          stack: [
            aset.logo ? getPdfImage(aset.logo, 60) : { text: "", width: 60 }
          ],
          alignment: 'center'
        },
        {
          width: '*',
          stack: [
            { text: "PEMERINTAH KOTA / KABUPATEN " + (Store.get("pengesahan").kota || "...............").toUpperCase(), fontSize: 12, bold: true, alignment: 'center' },
            { text: "DINAS PENDIDIKAN", fontSize: 12, bold: true, alignment: 'center' },
            { text: (idn.sekolah || "NAMA SEKOLAH").toUpperCase(), fontSize: 14, bold: true, alignment: 'center' },
            { text: "Alamat: ........................................................................", fontSize: 10, alignment: 'center' }
          ]
        },
        {
          width: 70,
          text: "" // Space for symmetry if needed
        }
      ],
      margin: [0, 0, 0, 10]
    };
  }

  // --- Helper untuk Blok Pengesahan ---
  function buildPengesahan(p, aset) {
    const tanggalTtd = p.tanggal ? app.tglPendek(p.tanggal) : "_____________";
    const kota = p.kota || "_____________";

    return {
      unbreakable: true, // Jangan potong blok tanda tangan
      margin: [0, 20, 0, 0],
      columns: [
        {
          width: '*',
          alignment: 'center',
          stack: [
            { text: "Mengetahui,", margin: [0, 0, 0, 2] },
            { text: "Kepala Sekolah", margin: [0, 0, 0, 40], style: 'ttdSpace' }, // Spacer if no image
            { 
              // Overlay signature and stamp
              stack: [
                aset.ttdKepsek ? getPdfImage(aset.ttdKepsek, 80) : null
              ],
              absolutePosition: aset.ttdKepsek ? undefined : null // Just normal stack if used without absolute
            },
            { text: p.kepsek.nama || "............................", bold: true, decoration: 'underline' },
            { text: "NIP. " + (p.kepsek.nip || "......................") }
          ]
        },
        {
          width: '*',
          alignment: 'center',
          stack: [
            { text: kota + ", " + tanggalTtd, margin: [0, 0, 0, 2] },
            { text: "Guru Mata Pelajaran", margin: [0, 0, 0, 40], style: 'ttdSpace' },
            { 
              stack: [
                aset.ttdGuru ? getPdfImage(aset.ttdGuru, 80) : null
              ]
            },
            { text: p.guru.nama || "............................", bold: true, decoration: 'underline' },
            { text: "NIP. " + (p.guru.nip || "......................") }
          ]
        }
      ]
    };
  }

  /* =====================================================================
     1. CETAK JURNAL (pdfmake)
     ===================================================================== */
  function cetakJurnal() {
    if (typeof pdfMake === "undefined") {
      app.toast("Library PDF belum termuat.", "danger");
      return;
    }

    const idn = Store.get("identitas");
    const jurnal = Store.get("jurnal");
    const p = Store.get("pengesahan");
    const aset = Store.get("aset");

    // Header Tabel Jurnal
    const tableBody = [
      [
        { text: 'Mgg', style: 'tableHeader', alignment: 'center' },
        { text: 'Hari', style: 'tableHeader', alignment: 'center' },
        { text: 'Tanggal', style: 'tableHeader', alignment: 'center' },
        { text: 'Jam', style: 'tableHeader', alignment: 'center' },
        { text: 'Tujuan Pembelajaran', style: 'tableHeader', alignment: 'center' },
        { text: 'Materi', style: 'tableHeader', alignment: 'center' },
        { text: 'Penilaian', style: 'tableHeader', alignment: 'center' }
      ]
    ];

    // Isi Tabel Jurnal
    jurnal.forEach(function (e) {
      const jam = (e.jamMulai || e.jamSelesai) ? ((e.jamMulai || "--") + " – " + (e.jamSelesai || "--")) : "—";
      tableBody.push([
        { text: e.minggu.toString(), alignment: 'center' },
        { text: e.hari, alignment: 'center' },
        { text: e.tanggal ? app.tglPendek(e.tanggal) : "—", alignment: 'center' },
        { text: jam, alignment: 'center' },
        { text: e.tujuan || "—" },
        { text: e.materi || "—" },
        { text: e.penilaian || "—" }
      ]);
    });

    const docDefinition = {
      pageSize: 'A4',
      pageOrientation: 'portrait',
      pageMargins: [40, 40, 40, 40],
      content: [
        buildKop(idn, aset),
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 2 }] },
        { canvas: [{ type: 'line', x1: 0, y1: 2, x2: 515, y2: 2, lineWidth: 1 }] },
        { text: "JURNAL HARIAN PEMBELAJARAN", style: 'docTitle', margin: [0, 15, 0, 10] },
        {
          columns: [
            { width: 80, text: "Mata Pelajaran" }, { width: 10, text: ":" }, { text: idn.mapel || "—" }
          ],
          margin: [0, 0, 0, 2]
        },
        {
          columns: [
            { width: 80, text: "Kelas" }, { width: 10, text: ":" }, { text: idn.kelas || "—" }
          ],
          margin: [0, 0, 0, 2]
        },
        {
          columns: [
            { width: 80, text: "Tahun Ajaran" }, { width: 10, text: ":" }, { text: idn.tahun || "—" }
          ],
          margin: [0, 0, 0, 10]
        },
        {
          style: 'tableExample',
          table: {
            headerRows: 1,
            widths: ['auto', 'auto', 'auto', 'auto', '*', '*', '*'],
            dontBreakRows: true, // Jangan potong baris tabel saat pindah halaman
            body: tableBody
          },
          layout: 'lightHorizontalLines'
        },
        buildPengesahan(p, aset)
      ],
      styles: {
        tableHeader: { bold: true, fontSize: 10, color: 'black', fillColor: '#f3f4f6' },
        tableExample: { margin: [0, 5, 0, 15], fontSize: 9 },
        docTitle: { fontSize: 14, bold: true, alignment: 'center' },
        ttdSpace: { margin: [0, 30, 0, 0] }
      },
      defaultStyle: {
        fontSize: 10
      }
    };

    // Stempel custom overlay jika ada
    if (aset.stempel) {
      docDefinition.background = function(currentPage, pageCount) {
        if (currentPage === pageCount) {
          return {
            image: aset.stempel,
            width: 80,
            absolutePosition: { x: 400, y: 700 },
            opacity: 0.8
          };
        }
        return null;
      };
    }

    pdfMake.createPdf(docDefinition).download("Jurnal_Pembelajaran.pdf");
    app.toast("PDF Jurnal (Tajam) berhasil diunduh.", "success");
  }


  /* =====================================================================
     2. CETAK NILAI (pdfmake)
     ===================================================================== */
  function cetakNilai() {
    if (typeof pdfMake === "undefined") {
      app.toast("Library PDF belum termuat.", "danger");
      return;
    }

    const idn = Store.get("identitas");
    const siswa = Store.get("siswa");
    const komponen = Store.get("komponen");
    const nilai = Store.get("nilai");
    const p = Store.get("pengesahan");
    const aset = Store.get("aset");

    // Header
    const tableHeader = [
      { text: 'No', style: 'tableHeader', alignment: 'center' },
      { text: 'NISN', style: 'tableHeader', alignment: 'center' },
      { text: 'Nama', style: 'tableHeader', alignment: 'center' }
    ];
    komponen.forEach(function (k) {
      tableHeader.push({ text: k.nama + '\n(' + k.bobot + '%)', style: 'tableHeader', alignment: 'center' });
    });
    tableHeader.push({ text: 'Akhir', style: 'tableHeader', alignment: 'center' });
    tableHeader.push({ text: 'Kategori', style: 'tableHeader', alignment: 'center' });

    const tableBody = [tableHeader];

    const siswaIds = siswa.map(function(s) { return s.id; });

    // Rows
    siswa.forEach(function (m, idx) {
      const h = app.hitungNilaiAkhir(nilai[m.id] || {}, komponen);
      const kat = app.kategoriNilai(h.akhir);

      const row = [
        { text: (idx + 1).toString(), alignment: 'center' },
        { text: m.nisn || "—", alignment: 'center' },
        { text: m.nama }
      ];

      komponen.forEach(function (k) {
        const entri = (nilai[m.id] && nilai[m.id][k.id]) || [];
        const angka = entri.map(parseFloat).filter(function(x) { return !isNaN(x); });
        const r = angka.length ? Store.angkaBersih(angka.reduce(function(s, x) { return s + x; }, 0) / angka.length) : "—";
        row.push({ text: r.toString(), alignment: 'center' });
      });

      row.push({ text: h.akhir !== null ? h.akhir.toString() : "—", alignment: 'center', bold: true });
      row.push({ text: h.akhir !== null ? kat.label : "—", alignment: 'center' });

      tableBody.push(row);
    });

    // Footer rata-rata kelas
    const rataRow = [
      { text: 'Rata-rata Kelas', colSpan: 3, alignment: 'right', bold: true },
      {}, {}
    ];
    komponen.forEach(function (k) {
      const r = app.rataKelas(nilai, siswaIds, k.id);
      rataRow.push({ text: r !== null ? r.toString() : "—", alignment: 'center', bold: true });
    });
    
    // Rata-rata akhir kelas
    let sumAkhir = 0, cntAkhir = 0;
    siswa.forEach(function (m) {
      const h = app.hitungNilaiAkhir(nilai[m.id] || {}, komponen);
      if (h.akhir !== null) { sumAkhir += h.akhir; cntAkhir++; }
    });
    const rataAkhir = cntAkhir ? Store.angkaBersih(sumAkhir / cntAkhir) : "—";
    rataRow.push({ text: rataAkhir.toString(), alignment: 'center', bold: true });
    rataRow.push({ text: "" }); // Kategori rata-rata kosong
    
    tableBody.push(rataRow);

    // Hitung width kolom
    const widths = ['auto', 'auto', '*'];
    komponen.forEach(function() { widths.push('auto'); });
    widths.push('auto');
    widths.push('auto');

    const docDefinition = {
      pageSize: 'A4',
      pageOrientation: 'landscape', // Landscape karena kolomnya banyak
      pageMargins: [40, 40, 40, 40],
      content: [
        buildKop(idn, aset),
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 760, y2: 0, lineWidth: 2 }] },
        { canvas: [{ type: 'line', x1: 0, y1: 2, x2: 760, y2: 2, lineWidth: 1 }] },
        { text: "REKAP NILAI SISWA", style: 'docTitle', margin: [0, 15, 0, 10] },
        {
          columns: [
            { width: 80, text: "Mata Pelajaran" }, { width: 10, text: ":" }, { text: idn.mapel || "—" }
          ],
          margin: [0, 0, 0, 2]
        },
        {
          columns: [
            { width: 80, text: "Kelas" }, { width: 10, text: ":" }, { text: idn.kelas || "—" }
          ],
          margin: [0, 0, 0, 2]
        },
        {
          columns: [
            { width: 80, text: "Tahun Ajaran" }, { width: 10, text: ":" }, { text: idn.tahun || "—" }
          ],
          margin: [0, 0, 0, 10]
        },
        {
          style: 'tableExample',
          table: {
            headerRows: 1,
            widths: widths,
            dontBreakRows: true, // Tidak memotong baris
            body: tableBody
          },
          layout: 'lightHorizontalLines'
        },
        buildPengesahan(p, aset)
      ],
      styles: {
        tableHeader: { bold: true, fontSize: 9, color: 'black', fillColor: '#f3f4f6' },
        tableExample: { margin: [0, 5, 0, 15], fontSize: 9 },
        docTitle: { fontSize: 14, bold: true, alignment: 'center' },
        ttdSpace: { margin: [0, 30, 0, 0] }
      },
      defaultStyle: {
        fontSize: 9
      }
    };

    if (aset.stempel) {
      docDefinition.background = function(currentPage, pageCount) {
        if (currentPage === pageCount) {
          return {
            image: aset.stempel,
            width: 80,
            absolutePosition: { x: 600, y: 450 }, // Sesuaikan koordinat landscape
            opacity: 0.8
          };
        }
        return null;
      };
    }

    pdfMake.createPdf(docDefinition).download("Rekap_Nilai.pdf");
    app.toast("PDF Nilai (Tajam) berhasil diunduh.", "success");
  }


  /* =====================================================================
     3. CETAK SESUAI PRATINJAU (html2canvas + jsPDF)
     Trade-off: ukuran file besar, teks jadi gambar, margin tergantung DOM
     ===================================================================== */
  function cetakSesuaiPratinjau(nodeHTML, defaultFileName) {
    if (typeof html2canvas === "undefined" || typeof jspdf === "undefined") {
      app.toast("Library html2canvas / jsPDF belum termuat.", "danger");
      return;
    }

    if (!nodeHTML) {
      app.toast("Elemen HTML tidak ditemukan.", "danger");
      return;
    }

    app.toast("Sedang memproses PDF (Pratinjau)...", "info");

    const opt = {
      scale: 3, // Skala tinggi agar teks lebih jelas (tradeoff size)
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff"
    };

    html2canvas(nodeHTML, opt).then(function (canvas) {
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      
      const jsPDF = window.jspdf.jsPDF;
      
      // Hitung rasio untuk A4
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let position = 0; 
      const pageHeight = pdf.internal.pageSize.getHeight();
      let heightLeft = pdfHeight;

      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      pdf.save((defaultFileName || "Dokumen") + "_Visual.pdf");
      app.toast("Catatan: PDF ini berupa gambar (teks tidak bisa diseleksi dan ukuran file lebih besar).", "warning");
    }).catch(function (err) {
      console.error(err);
      app.toast("Gagal membuat PDF pratinjau.", "danger");
    });
  }

  // --- Ekspos ke Global ---
  window.GHPDF = {
    cetakJurnal: cetakJurnal,
    cetakNilai: cetakNilai,
    cetakSesuaiPratinjau: cetakSesuaiPratinjau
  };

})();
