"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  AppData,
  Identitas,
  JurnalEntry,
  Siswa,
  Komponen,
  NilaiMap,
  AbsensiStatus,
  AbsensiMap,
  CatatanSiswa,
  Aset,
  Pengesahan,
  Pengaturan,
  ViewKey,
} from "./types";
import { DEFAULT_DATA, SCHEMA_VERSION, uid } from "./bobot";

interface AppState extends AppData {
  // Active view (client-side routing since Next.js skill restricts to single route)
  view: ViewKey;
  setView: (v: ViewKey) => void;

  // Mutators — fine-grained updates
  setIdentitas: (idn: Identitas) => void;
  setJurnal: (j: JurnalEntry[]) => void;
  addJurnalEntry: () => void;
  updateJurnalEntry: (id: string, patch: Partial<JurnalEntry>) => void;
  deleteJurnalEntry: (id: string) => void;

  setSiswa: (s: Siswa[]) => void;
  addSiswa: (nama: string, nisn?: string) => string;
  updateSiswa: (id: string, patch: Partial<Siswa>) => void;
  deleteSiswa: (id: string) => void;

  setKomponen: (k: Komponen[]) => void;

  setNilai: (siswaId: string, komponenId: string, angka: number[]) => void;
  setNilaiMap: (n: NilaiMap) => void;

  // Absensi mutators
  setAbsensi: (tanggal: string, siswaId: string, status: AbsensiStatus) => void;
  setAbsensiBulk: (tanggal: string, siswaIds: string[], status: AbsensiStatus) => void;
  clearAbsensiTanggal: (tanggal: string) => void;
  setAbsensiMap: (a: AbsensiMap) => void;

  // Catatan anekdotal mutators
  addCatatan: (c: Omit<CatatanSiswa, "id" | "createdAt">) => void;
  updateCatatan: (id: string, patch: Partial<CatatanSiswa>) => void;
  deleteCatatan: (id: string) => void;

  setAset: (patch: Partial<Aset>) => void;
  setPengesahan: (p: Pengesahan) => void;
  setPengaturan: (p: Pengaturan) => void;
  setPresetAktif: (k: string) => void;
  setKategori: (k: Pengaturan["kategori"]) => void;

  // Backup/restore
  exportJSON: () => AppData;
  importJSON: (obj: Partial<AppData>) => number;
  resetAll: () => void;
}

// Migrate legacy `gh_*` localStorage keys into a single state object.
function migrateFromLegacy(): Partial<AppData> | null {
  if (typeof window === "undefined") return null;
  const legacyKeys = [
    "identitas",
    "jurnal",
    "siswa",
    "komponen",
    "nilai",
    "aset",
    "pengesahan",
    "pengaturan",
  ];
  const out: Record<string, unknown> = {};
  let foundAny = false;
  for (const k of legacyKeys) {
    const raw = localStorage.getItem("gh_" + k);
    if (raw !== null) {
      try {
        out[k] = JSON.parse(raw);
        foundAny = true;
      } catch {
        /* ignore corrupt */
      }
    }
  }
  if (!foundAny) return null;
  return out as Partial<AppData>;
}

function deepMerge<T>(base: T, patch: Partial<T> | undefined): T {
  if (!patch) return base;
  if (Array.isArray(base)) return (patch as unknown as T) ?? base;
  if (typeof base === "object" && base !== null) {
    const result: Record<string, unknown> = { ...(base as Record<string, unknown>) };
    for (const k of Object.keys(patch as Record<string, unknown>)) {
      const bv = (base as Record<string, unknown>)[k];
      const pv = (patch as Record<string, unknown>)[k];
      if (
        bv &&
        pv &&
        typeof bv === "object" &&
        !Array.isArray(bv) &&
        typeof pv === "object" &&
        !Array.isArray(pv)
      ) {
        result[k] = deepMerge(bv, pv as Record<string, unknown>);
      } else {
        result[k] = pv;
      }
    }
    return result as T;
  }
  return (patch as unknown as T) ?? base;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...structuredCloneSafe(DEFAULT_DATA),
      view: "beranda",
      setView: (v) => set({ view: v }),

      setIdentitas: (idn) => set({ identitas: idn }),
      setJurnal: (j) => set({ jurnal: j }),
      addJurnalEntry: () => {
        const j = [...get().jurnal];
        const no = j.length + 1;
        j.push({
          id: uid("j"),
          minggu: no,
          hari: "Senin",
          tanggal: "",
          jamMulai: "",
          jamSelesai: "",
          tujuan: "",
          materi: "",
          penilaian: "",
        });
        set({ jurnal: j });
      },
      updateJurnalEntry: (id, patch) =>
        set({
          jurnal: get().jurnal.map((e) =>
            e.id === id ? { ...e, ...patch } : e
          ),
        }),
      deleteJurnalEntry: (id) =>
        set({ jurnal: get().jurnal.filter((e) => e.id !== id) }),

      setSiswa: (s) => set({ siswa: s }),
      addSiswa: (nama, nisn = "") => {
        const id = uid("s");
        set({
          siswa: [...get().siswa, { id, nama, nisn }],
        });
        return id;
      },
      updateSiswa: (id, patch) =>
        set({
          siswa: get().siswa.map((s) =>
            s.id === id ? { ...s, ...patch } : s
          ),
        }),
      deleteSiswa: (id) => {
        const nilai = { ...get().nilai };
        delete nilai[id];
        set({
          siswa: get().siswa.filter((s) => s.id !== id),
          nilai,
        });
      },

      setKomponen: (k) => set({ komponen: k }),

      setNilai: (siswaId, komponenId, angka) => {
        const nilai = { ...get().nilai };
        if (!nilai[siswaId]) nilai[siswaId] = {};
        nilai[siswaId] = { ...nilai[siswaId], [komponenId]: angka };
        set({ nilai });
      },
      setNilaiMap: (n) => set({ nilai: n }),

      // ===== Absensi =====
      setAbsensi: (tanggal, siswaId, status) => {
        const absensi = { ...get().absensi };
        if (!absensi[tanggal]) absensi[tanggal] = {};
        absensi[tanggal] = { ...absensi[tanggal], [siswaId]: status };
        set({ absensi });
      },
      setAbsensiBulk: (tanggal, siswaIds, status) => {
        const absensi = { ...get().absensi };
        const tanggalMap = { ...(absensi[tanggal] || {}) };
        siswaIds.forEach((sid) => {
          tanggalMap[sid] = status;
        });
        absensi[tanggal] = tanggalMap;
        set({ absensi });
      },
      clearAbsensiTanggal: (tanggal) => {
        const absensi = { ...get().absensi };
        delete absensi[tanggal];
        set({ absensi });
      },
      setAbsensiMap: (a) => set({ absensi: a }),

      // ===== Catatan Anekdotal =====
      addCatatan: (c) => {
        const catatan: CatatanSiswa = {
          ...c,
          id: uid("c"),
          createdAt: new Date().toISOString(),
        };
        set({ catatan: [catatan, ...get().catatan] });
      },
      updateCatatan: (id, patch) =>
        set({
          catatan: get().catatan.map((c) =>
            c.id === id ? { ...c, ...patch } : c
          ),
        }),
      deleteCatatan: (id) =>
        set({ catatan: get().catatan.filter((c) => c.id !== id) }),

      setAset: (patch) => set({ aset: { ...get().aset, ...patch } }),
      setPengesahan: (p) => set({ pengesahan: p }),
      setPengaturan: (p) => set({ pengaturan: p }),
      setPresetAktif: (k) =>
        set({ pengaturan: { ...get().pengaturan, presetAktif: k } }),
      setKategori: (k) =>
        set({ pengaturan: { ...get().pengaturan, kategori: k } }),

      exportJSON: () => {
        const s = get();
        return {
          identitas: s.identitas,
          jurnal: s.jurnal,
          siswa: s.siswa,
          komponen: s.komponen,
          nilai: s.nilai,
          absensi: s.absensi,
          catatan: s.catatan,
          aset: s.aset,
          pengesahan: s.pengesahan,
          pengaturan: s.pengaturan,
          meta: {
            schema: SCHEMA_VERSION,
            exported: new Date().toISOString(),
            created: s.meta?.created ?? new Date().toISOString(),
          },
        };
      },
      importJSON: (obj) => {
        if (!obj || typeof obj !== "object") throw new Error("Format tidak valid.");
        const cur = get();
        const next: Partial<AppData> = {};
        let count = 0;
        if (obj.identitas) { next.identitas = obj.identitas; count++; }
        if (obj.jurnal) { next.jurnal = obj.jurnal; count++; }
        if (obj.siswa) { next.siswa = obj.siswa; count++; }
        if (obj.komponen) { next.komponen = obj.komponen; count++; }
        if (obj.nilai) { next.nilai = obj.nilai; count++; }
        if (obj.absensi) { next.absensi = obj.absensi; count++; }
        if (obj.catatan) { next.catatan = obj.catatan; count++; }
        if (obj.aset) { next.aset = obj.aset; count++; }
        if (obj.pengesahan) { next.pengesahan = obj.pengesahan; count++; }
        if (obj.pengaturan) { next.pengaturan = obj.pengaturan; count++; }
        set({ ...cur, ...next });
        return count;
      },
      resetAll: () => {
        const fresh = structuredCloneSafe(DEFAULT_DATA);
        set({
          ...fresh,
          view: "beranda",
          meta: {
            schema: SCHEMA_VERSION,
            created: new Date().toISOString(),
          },
        });
      },
    }),
    {
      name: "gh_data_v2",
      version: SCHEMA_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
        // Don't persist the view
        const { view, setView, ...rest } = state as AppState;
        void view;
        void setView;
        const data: AppData = {
          identitas: rest.identitas,
          jurnal: rest.jurnal,
          siswa: rest.siswa,
          komponen: rest.komponen,
          nilai: rest.nilai,
          absensi: rest.absensi,
          catatan: rest.catatan,
          aset: rest.aset,
          pengesahan: rest.pengesahan,
          pengaturan: rest.pengaturan,
          meta: rest.meta,
        };
        return data as unknown as Partial<AppState>;
      },
      merge: (persisted, currentState) => {
        const persistedData = (persisted as Partial<AppData>) || {};
        // Auto-migrate from legacy gh_* keys on first run
        const legacy = migrateFromLegacy();
        let merged = deepMerge(DEFAULT_DATA, persistedData);
        if (legacy && !persistedData.meta?.migratedFromLegacy) {
          merged = deepMerge(merged, legacy);
          merged.meta = {
            ...(merged.meta || ({} as AppData["meta"])),
            schema: SCHEMA_VERSION,
            created: merged.meta?.created || new Date().toISOString(),
            migratedFromLegacy: true,
          };
        }
        return {
          ...currentState,
          ...merged,
        } as AppState;
      },
    }
  )
);

// SSR-safe structuredClone with fallback
function structuredCloneSafe<T>(obj: T): T {
  if (typeof structuredClone === "function") return structuredClone(obj);
  return JSON.parse(JSON.stringify(obj));
}

// Helper: read a value from store reactively, with hydration guard
export function useHydrated() {
  if (typeof window === "undefined") return false;
  return true;
}
