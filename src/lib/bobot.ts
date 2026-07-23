// Default values, presets, validation, and calculations for grades.

import type { AppData, Kategori, Komponen, NilaiMap } from "./types";

export const SCHEMA_VERSION = 2;

export const DEFAULT_KATEGORI: Kategori[] = [
  { min: 0, max: 60, label: "Kurang", warna: "#dc2626" },
  { min: 61, max: 70, label: "Cukup", warna: "#d97706" },
  { min: 71, max: 80, label: "Baik", warna: "#10b981" },
  { min: 81, max: 100, label: "Sangat Baik", warna: "#059669" },
];

export const DEFAULT_KOMPONEN: Komponen[] = [
  { id: "k1", nama: "Tugas Harian", bobot: 25 },
  { id: "k2", nama: "Ulangan Harian", bobot: 15 },
  { id: "k3", nama: "UTS", bobot: 20 },
  { id: "k4", nama: "UAS", bobot: 20 },
  { id: "k5", nama: "Lainnya", bobot: 20 },
];

export const DEFAULT_DATA: AppData = {
  identitas: { sekolah: "", kelas: "", tahun: "", mapel: "" },
  jurnal: [],
  siswa: [],
  komponen: DEFAULT_KOMPONEN,
  nilai: {},
  aset: { logo: "", ttdKepsek: "", ttdGuru: "", stempel: "" },
  pengesahan: {
    kota: "",
    tanggal: "",
    kepsek: { nama: "", nip: "" },
    guru: { nama: "", nip: "" },
  },
  pengaturan: { presetAktif: "kurmer", kategori: DEFAULT_KATEGORI },
  meta: { schema: SCHEMA_VERSION, created: new Date().toISOString() },
};

export interface PresetBobot {
  label: string;
  desc: string;
  komponen: Array<{ nama: string; bobot: number }>;
}

export const PRESET_BOBOT: Record<string, PresetBobot> = {
  kurmer: {
    label: "Kurikulum Merdeka",
    desc: "Sumatif/Tugas Harian 40%, UTS 20%, UAS 20%, komponen lain 20%.",
    komponen: [
      { nama: "Tugas Harian", bobot: 40 },
      { nama: "UTS", bobot: 20 },
      { nama: "UAS", bobot: 20 },
      { nama: "Lainnya (Proyek/Sikap)", bobot: 20 },
    ],
  },
  tradisional: {
    label: "Tradisional 60/20/20",
    desc: "Harian + Tugas 60%, UTS 20%, UAS 20%.",
    komponen: [
      { nama: "Harian + Tugas", bobot: 60 },
      { nama: "UTS", bobot: 20 },
      { nama: "UAS", bobot: 20 },
    ],
  },
  "30/30/40": {
    label: "30/30/40",
    desc: "Harian 30%, UTS 30%, UAS 40%.",
    komponen: [
      { nama: "Harian", bobot: 30 },
      { nama: "UTS", bobot: 30 },
      { nama: "UAS", bobot: 40 },
    ],
  },
  samarata: {
    label: "Sama Rata",
    desc: "100% dibagi rata ke seluruh komponen aktif.",
    komponen: [],
  },
};

export function uid(prefix = "id"): string {
  return (
    prefix +
    "-" +
    Date.now().toString(36) +
    "-" +
    Math.random().toString(36).slice(2, 7)
  );
}

// Round to 2 decimals
export function angkaBersih(n: number | null | undefined): number | null {
  if (n === null || n === undefined || n === undefined || isNaN(n as number))
    return null;
  return Math.round((n as number) * 100) / 100;
}

export function applyPreset(
  kunci: string,
  komponenAktif: Komponen[]
): Komponen[] | null {
  const p = PRESET_BOBOT[kunci];
  if (!p) return null;
  if (kunci === "samarata") {
    const aktif = komponenAktif.length ? komponenAktif : PRESET_BOBOT.kurmer.komponen.map((k, i) => ({ id: `k${i}`, ...k }));
    const n = aktif.length;
    const bobot = Math.floor(100 / n);
    const sisa = 100 - bobot * n;
    return aktif.map((k, i) => ({
      id: uid("k"),
      nama: k.nama,
      bobot: bobot + (i === 0 ? sisa : 0),
    }));
  }
  return p.komponen.map((k) => ({ id: uid("k"), nama: k.nama, bobot: k.bobot }));
}

export interface ValidasiBobotResult {
  total: number;
  valid: boolean;
  pesan: string;
}

export function validasiBobot(komponen: Komponen[] | null): ValidasiBobotResult {
  const total = (komponen || []).reduce((s, k) => {
    const b = parseFloat(k.bobot as unknown as string);
    return s + (isNaN(b) ? 0 : b);
  }, 0);
  const bulat = Math.round(total * 100) / 100;
  return {
    total: bulat,
    valid: Math.abs(bulat - 100) < 0.01,
    pesan:
      bulat === 100
        ? "Total bobot 100%."
        : bulat < 100
          ? `Kurang ${100 - bulat}%.`
          : `Lebih ${bulat - 100}%.`,
  };
}

export function kategoriNilai(
  nilai: number | null,
  kategori: Kategori[]
): { label: string; warna: string } {
  const n = parseFloat(nilai as unknown as string);
  if (isNaN(n)) return { label: "—", warna: "#94a3b8" };
  const sorted = kategori.slice().sort((a, b) => a.min - b.min);
  for (const k of sorted) {
    if (n >= k.min && n <= k.max)
      return { label: k.label, warna: k.warna || "#10b981" };
  }
  return { label: "Di luar rentang", warna: "#94a3b8" };
}

export interface NilaiDetail {
  id: string;
  nama: string;
  rata: number | null;
  bobot: number;
  kontribusi: number;
  jumlahEntri: number;
}

export interface HitungNilaiResult {
  akhir: number | null;
  detail: NilaiDetail[];
}

export function hitungNilaiAkhir(
  nilaiSiswa: Record<string, number[]> | undefined,
  komponen: Komponen[]
): HitungNilaiResult {
  const detail: NilaiDetail[] = [];
  let akhir = 0;
  (komponen || []).forEach((k) => {
    const entri = (nilaiSiswa && nilaiSiswa[k.id]) || [];
    const angka = entri
      .map((x) => parseFloat(x as unknown as string))
      .filter((x) => !isNaN(x));
    const rata = angka.length
      ? angka.reduce((s, x) => s + x, 0) / angka.length
      : null;
    const bobot = parseFloat(k.bobot as unknown as string) || 0;
    const kontribusi = rata !== null ? (rata * bobot) / 100 : 0;
    detail.push({
      id: k.id,
      nama: k.nama,
      rata,
      bobot,
      kontribusi,
      jumlahEntri: angka.length,
    });
    if (rata !== null) akhir += kontribusi;
  });
  return { akhir: angkaBersih(akhir), detail };
}

export function rataKelas(
  semuaNilai: NilaiMap,
  siswaIds: string[],
  komponenId: string
): number | null {
  let sum = 0;
  let count = 0;
  siswaIds.forEach((sid) => {
    const entri = (semuaNilai[sid] && semuaNilai[sid][komponenId]) || [];
    const angka = entri
      .map((x) => parseFloat(x as unknown as string))
      .filter((x) => !isNaN(x));
    if (angka.length) {
      const r = angka.reduce((s, x) => s + x, 0) / angka.length;
      sum += r;
      count++;
    }
  });
  return count ? angkaBersih(sum / count) : null;
}
