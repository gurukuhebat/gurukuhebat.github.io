// Type definitions for Guruku Hebat

export interface Identitas {
  sekolah: string;
  kelas: string;
  tahun: string;
  mapel: string;
}

export interface JurnalEntry {
  id: string;
  minggu: number;
  hari: string;
  tanggal: string; // YYYY-MM-DD
  jamMulai: string; // HH:MM
  jamSelesai: string; // HH:MM
  tujuan: string;
  materi: string;
  penilaian: string;
}

export interface Siswa {
  id: string;
  nama: string;
  nisn: string;
}

export interface Komponen {
  id: string;
  nama: string;
  bobot: number;
}

// nilai[siswaId][komponenId] = number[]
export type NilaiMap = Record<string, Record<string, number[]>>;

export interface Aset {
  logo: string;
  ttdKepsek: string;
  ttdGuru: string;
  stempel: string;
}

export interface PengesahanPerson {
  nama: string;
  nip: string;
}

export interface Pengesahan {
  kota: string;
  tanggal: string;
  kepsek: PengesahanPerson;
  guru: PengesahanPerson;
}

export interface Kategori {
  min: number;
  max: number;
  label: string;
  warna: string;
}

export interface Pengaturan {
  presetAktif: string;
  kategori: Kategori[];
}

export interface AppMeta {
  schema: number;
  created: string;
  migratedFromLegacy?: boolean;
}

export interface AppData {
  identitas: Identitas;
  jurnal: JurnalEntry[];
  siswa: Siswa[];
  komponen: Komponen[];
  nilai: NilaiMap;
  aset: Aset;
  pengesahan: Pengesahan;
  pengaturan: Pengaturan;
  meta: AppMeta;
}

export type ViewKey = "beranda" | "jurnal" | "nilai" | "pengaturan";
