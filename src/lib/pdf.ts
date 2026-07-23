// PDF generation engine — uses pdfmake for sharp, selectable text PDFs,
// and html2canvas + jsPDF for "preview-faithful" image-based PDFs.
// All client-side. Should only be called from client components.

import type { AppData } from "./types";
import { tglPendek } from "./format";
import { hitungNilaiAkhir, kategoriNilai, rataKelas, angkaBersih } from "./bobot";

let pdfMakeReady: Promise<typeof import("pdfmake/build/pdfmake")> | null = null;

async function getPdfMake() {
  if (!pdfMakeReady) {
    pdfMakeReady = (async () => {
      const pdfMakeMod = await import("pdfmake/build/pdfmake");
      const pdfFontsMod = await import("pdfmake/build/vfs_fonts");
      const pdfMake = (pdfMakeMod as any).default || pdfMakeMod;
      const vfs = (pdfFontsMod as any).vfs || (pdfFontsMod as any).pdfMake?.vfs;
      if (vfs) pdfMake.vfs = vfs;
      return pdfMake;
    })();
  }
  return pdfMakeReady;
}

interface PdfImage {
  image: string;
  width: number;
}

function getPdfImage(dataUrl: string, width = 60): PdfImage | null {
  if (!dataUrl || !dataUrl.startsWith("data:image")) return null;
  return { image: dataUrl, width };
}

function buildKop(idn: AppData["identitas"], aset: AppData["aset"], pengesahan: AppData["pengesahan"]) {
  return {
    columns: [
      {
        width: 70,
        stack: [aset.logo ? getPdfImage(aset.logo, 60) : { text: "", width: 60 }],
        alignment: "center" as const,
      },
      {
        width: "*",
        stack: [
          {
            text:
              "PEMERINTAH KOTA / KABUPATEN " +
              (pengesahan.kota || "...............").toUpperCase(),
            fontSize: 11,
            bold: true,
            alignment: "center" as const,
          },
          { text: "DINAS PENDIDIKAN", fontSize: 11, bold: true, alignment: "center" as const },
          {
            text: (idn.sekolah || "NAMA SEKOLAH").toUpperCase(),
            fontSize: 13,
            bold: true,
            alignment: "center" as const,
          },
          {
            text: "Alamat: ........................................................................",
            fontSize: 9,
            alignment: "center" as const,
          },
        ],
      },
      { width: 70, text: "" },
    ],
    margin: [0, 0, 0, 8] as [number, number, number, number],
  };
}

function buildPengesahan(p: AppData["pengesahan"], aset: AppData["aset"]) {
  const tanggalTtd = p.tanggal ? tglPendek(p.tanggal) : "_____________";
  const kota = p.kota || "_____________";
  return {
    unbreakable: true,
    margin: [0, 20, 0, 0] as [number, number, number, number],
    columns: [
      {
        width: "*",
        alignment: "center" as const,
        stack: [
          { text: "Mengetahui,", margin: [0, 0, 0, 2] },
          { text: "Kepala Sekolah", margin: [0, 0, 0, 40] },
          { stack: [aset.ttdKepsek ? getPdfImage(aset.ttdKepsek, 80) : null] },
          {
            text: p.kepsek.nama || "............................",
            bold: true,
            decoration: "underline" as const,
          },
          { text: "NIP. " + (p.kepsek.nip || "......................") },
        ],
      },
      {
        width: "*",
        alignment: "center" as const,
        stack: [
          { text: kota + ", " + tanggalTtd, margin: [0, 0, 0, 2] },
          { text: "Guru Mata Pelajaran", margin: [0, 0, 0, 40] },
          { stack: [aset.ttdGuru ? getPdfImage(aset.ttdGuru, 80) : null] },
          {
            text: p.guru.nama || "............................",
            bold: true,
            decoration: "underline" as const,
          },
          { text: "NIP. " + (p.guru.nip || "......................") },
        ],
      },
    ],
  };
}

export async function cetakJurnal(data: AppData): Promise<void> {
  const pdfMake = await getPdfMake();
  const { identitas: idn, jurnal, pengesahan: p, aset } = data;

  const tableBody: any[] = [
    [
      { text: "Mgg", style: "tableHeader", alignment: "center" },
      { text: "Hari", style: "tableHeader", alignment: "center" },
      { text: "Tanggal", style: "tableHeader", alignment: "center" },
      { text: "Jam", style: "tableHeader", alignment: "center" },
      { text: "Tujuan Pembelajaran", style: "tableHeader", alignment: "center" },
      { text: "Materi", style: "tableHeader", alignment: "center" },
      { text: "Penilaian", style: "tableHeader", alignment: "center" },
    ],
  ];

  jurnal.forEach((e) => {
    const jam =
      e.jamMulai || e.jamSelesai
        ? `${e.jamMulai || "--"} – ${e.jamSelesai || "--"}`
        : "—";
    tableBody.push([
      { text: String(e.minggu), alignment: "center" },
      { text: e.hari, alignment: "center" },
      { text: e.tanggal ? tglPendek(e.tanggal) : "—", alignment: "center" },
      { text: jam, alignment: "center" },
      { text: e.tujuan || "—" },
      { text: e.materi || "—" },
      { text: e.penilaian || "—" },
    ]);
  });

  const docDefinition: any = {
    pageSize: "A4",
    pageOrientation: "portrait",
    pageMargins: [40, 40, 40, 40],
    content: [
      buildKop(idn, aset, p),
      { canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 2 }] },
      { canvas: [{ type: "line", x1: 0, y1: 2, x2: 515, y2: 2, lineWidth: 1 }] },
      { text: "JURNAL HARIAN PEMBELAJARAN", style: "docTitle", margin: [0, 15, 0, 10] },
      {
        columns: [
          { width: 80, text: "Mata Pelajaran" },
          { width: 10, text: ":" },
          { text: idn.mapel || "—" },
        ],
        margin: [0, 0, 0, 2],
      },
      {
        columns: [
          { width: 80, text: "Kelas" },
          { width: 10, text: ":" },
          { text: idn.kelas || "—" },
        ],
        margin: [0, 0, 0, 2],
      },
      {
        columns: [
          { width: 80, text: "Tahun Ajaran" },
          { width: 10, text: ":" },
          { text: idn.tahun || "—" },
        ],
        margin: [0, 0, 0, 10],
      },
      {
        style: "tableExample",
        table: {
          headerRows: 1,
          widths: ["auto", "auto", "auto", "auto", "*", "*", "*"],
          dontBreakRows: true,
          body: tableBody,
        },
        layout: "lightHorizontalLines",
      },
      buildPengesahan(p, aset),
    ],
    styles: {
      tableHeader: { bold: true, fontSize: 10, color: "black", fillColor: "#f1f5f9" },
      tableExample: { margin: [0, 5, 0, 15], fontSize: 9 },
      docTitle: { fontSize: 14, bold: true, alignment: "center" },
    },
    defaultStyle: { fontSize: 10 },
  };

  if (aset.stempel) {
    docDefinition.background = (currentPage: number, pageCount: number) => {
      if (currentPage === pageCount) {
        return {
          image: aset.stempel,
          width: 80,
          absolutePosition: { x: 400, y: 700 },
          opacity: 0.8,
        };
      }
      return null;
    };
  }

  pdfMake.createPdf(docDefinition).download("Jurnal_Pembelajaran.pdf");
}

export async function cetakNilai(data: AppData): Promise<void> {
  const pdfMake = await getPdfMake();
  const { identitas: idn, siswa, komponen, nilai, pengesahan: p, aset } = data;

  const tableHeader: any[] = [
    { text: "No", style: "tableHeader", alignment: "center" },
    { text: "NISN", style: "tableHeader", alignment: "center" },
    { text: "Nama", style: "tableHeader", alignment: "center" },
  ];
  komponen.forEach((k) => {
    tableHeader.push({
      text: `${k.nama}\n(${k.bobot}%)`,
      style: "tableHeader",
      alignment: "center",
    });
  });
  tableHeader.push({ text: "Akhir", style: "tableHeader", alignment: "center" });
  tableHeader.push({ text: "Kategori", style: "tableHeader", alignment: "center" });

  const tableBody: any[] = [tableHeader];
  const siswaIds = siswa.map((s) => s.id);

  siswa.forEach((m, idx) => {
    const h = hitungNilaiAkhir(nilai[m.id] || {}, komponen);
    const kat = kategoriNilai(h.akhir, data.pengaturan.kategori);
    const row: any[] = [
      { text: String(idx + 1), alignment: "center" },
      { text: m.nisn || "—", alignment: "center" },
      { text: m.nama },
    ];
    komponen.forEach((k) => {
      const entri = (nilai[m.id] && nilai[m.id][k.id]) || [];
      const angka = entri.map((x) => parseFloat(x as any)).filter((x) => !isNaN(x));
      const r = angka.length
        ? angkaBersih(angka.reduce((s, x) => s + x, 0) / angka.length)
        : null;
      row.push({ text: r !== null ? String(r) : "—", alignment: "center" });
    });
    row.push({
      text: h.akhir !== null ? String(h.akhir) : "—",
      alignment: "center",
      bold: true,
    });
    row.push({
      text: h.akhir !== null ? kat.label : "—",
      alignment: "center",
    });
    tableBody.push(row);
  });

  // Footer: class average
  const rataRow: any[] = [
    { text: "Rata-rata Kelas", colSpan: 3, alignment: "right", bold: true },
    {},
    {},
  ];
  komponen.forEach((k) => {
    const r = rataKelas(nilai, siswaIds, k.id);
    rataRow.push({
      text: r !== null ? String(r) : "—",
      alignment: "center",
      bold: true,
    });
  });
  let sumAkhir = 0;
  let cntAkhir = 0;
  siswa.forEach((m) => {
    const h = hitungNilaiAkhir(nilai[m.id] || {}, komponen);
    if (h.akhir !== null) {
      sumAkhir += h.akhir;
      cntAkhir++;
    }
  });
  const rataAkhir = cntAkhir ? angkaBersih(sumAkhir / cntAkhir) : null;
  rataRow.push({
    text: rataAkhir !== null ? String(rataAkhir) : "—",
    alignment: "center",
    bold: true,
  });
  rataRow.push({ text: "" });
  tableBody.push(rataRow);

  const widths = ["auto", "auto", "*"];
  komponen.forEach(() => widths.push("auto"));
  widths.push("auto");
  widths.push("auto");

  const docDefinition: any = {
    pageSize: "A4",
    pageOrientation: "landscape",
    pageMargins: [40, 40, 40, 40],
    content: [
      buildKop(idn, aset, p),
      { canvas: [{ type: "line", x1: 0, y1: 0, x2: 760, y2: 0, lineWidth: 2 }] },
      { canvas: [{ type: "line", x1: 0, y1: 2, x2: 760, y2: 2, lineWidth: 1 }] },
      { text: "REKAP NILAI SISWA", style: "docTitle", margin: [0, 15, 0, 10] },
      {
        columns: [
          { width: 80, text: "Mata Pelajaran" },
          { width: 10, text: ":" },
          { text: idn.mapel || "—" },
        ],
        margin: [0, 0, 0, 2],
      },
      {
        columns: [
          { width: 80, text: "Kelas" },
          { width: 10, text: ":" },
          { text: idn.kelas || "—" },
        ],
        margin: [0, 0, 0, 2],
      },
      {
        columns: [
          { width: 80, text: "Tahun Ajaran" },
          { width: 10, text: ":" },
          { text: idn.tahun || "—" },
        ],
        margin: [0, 0, 0, 10],
      },
      {
        style: "tableExample",
        table: {
          headerRows: 1,
          widths,
          dontBreakRows: true,
          body: tableBody,
        },
        layout: "lightHorizontalLines",
      },
      buildPengesahan(p, aset),
    ],
    styles: {
      tableHeader: { bold: true, fontSize: 9, color: "black", fillColor: "#f1f5f9" },
      tableExample: { margin: [0, 5, 0, 15], fontSize: 9 },
      docTitle: { fontSize: 14, bold: true, alignment: "center" },
    },
    defaultStyle: { fontSize: 9 },
  };

  if (aset.stempel) {
    docDefinition.background = (currentPage: number, pageCount: number) => {
      if (currentPage === pageCount) {
        return {
          image: aset.stempel,
          width: 80,
          absolutePosition: { x: 600, y: 450 },
          opacity: 0.8,
        };
      }
      return null;
    };
  }

  pdfMake.createPdf(docDefinition).download("Rekap_Nilai.pdf");
}

// Preview-faithful PDF (image-based via html2canvas + jsPDF).
// node: HTMLElement to capture. filename: without extension.
export async function cetakSesuaiPratinjau(
  node: HTMLElement,
  fileName = "Dokumen"
): Promise<void> {
  const [{ default: html2canvas }, jsPdfMod] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);
  const jsPDF = (jsPdfMod as any).jsPDF || (jsPdfMod as any).default;

  const canvas = await html2canvas(node, {
    scale: 3,
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
  });
  const imgData = canvas.toDataURL("image/jpeg", 0.95);
  const pdf = new jsPDF("p", "mm", "a4");
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
  let heightLeft = pdfHeight;
  const pageHeight = pdf.internal.pageSize.getHeight();
  let position = 0;

  pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, pdfHeight);
  heightLeft -= pageHeight;
  while (heightLeft >= 0) {
    position = heightLeft - pdfHeight;
    pdf.addPage();
    pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, pdfHeight);
    heightLeft -= pageHeight;
  }
  pdf.save(`${fileName}_Visual.pdf`);
}
