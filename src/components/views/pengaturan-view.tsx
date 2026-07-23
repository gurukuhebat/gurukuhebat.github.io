"use client";

import * as React from "react";
import {
  Save,
  Trash2,
  Upload,
  PenLine,
  Download,
  AlertTriangle,
  School,
  Image as ImageIcon,
  Stamp,
  FileSignature,
  CheckCircle2,
  Database,
  RotateCcw,
  Plus,
  X,
  Settings,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/lib/store";
import { useConfirm } from "@/components/shared/confirm-dialog";
import { IdentityForm } from "@/components/shared/identity-form";
import { AssetUploadDialog } from "@/components/shared/asset-upload-dialog";
import { PRESET_BOBOT, DEFAULT_KATEGORI } from "@/lib/bobot";
import type { Aset, Kategori, Pengesahan, Pengaturan } from "@/lib/types";
import { toast } from "sonner";

export function PengaturanView() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Badge variant="secondary" className="w-fit">Pengaturan</Badge>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Pengaturan
        </h1>
        <p className="text-sm text-muted-foreground">
          Atur identitas sekolah, logo &amp; tanda tangan, pengesahan, bobot
          nilai, dan cadangan data.
        </p>
      </div>

      <Tabs defaultValue="identitas" className="w-full">
        <TabsList className="flex w-full flex-wrap h-auto gap-1">
          <TabsTrigger value="identitas" className="flex-1 min-w-[120px]">
            <School className="mr-1 size-4" />
            Identitas
          </TabsTrigger>
          <TabsTrigger value="aset" className="flex-1 min-w-[120px]">
            <ImageIcon className="mr-1 size-4" />
            Logo &amp; TTD
          </TabsTrigger>
          <TabsTrigger value="pengesahan" className="flex-1 min-w-[120px]">
            <FileSignature className="mr-1 size-4" />
            Pengesahan
          </TabsTrigger>
          <TabsTrigger value="bobot" className="flex-1 min-w-[120px]">
            <Settings className="mr-1 size-4" />
            Bobot &amp; Kategori
          </TabsTrigger>
          <TabsTrigger value="backup" className="flex-1 min-w-[120px]">
            <Database className="mr-1 size-4" />
            Backup
          </TabsTrigger>
        </TabsList>

        <TabsContent value="identitas" className="mt-4">
          <Card className="card-fancy">
            <CardHeader>
              <CardTitle className="text-base">Data Sekolah</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-xs text-muted-foreground">
                Data ini dipakai di kop dokumen jurnal &amp; rekap nilai. Diisi
                sekali, otomatis tersimpan.
              </p>
              <IdentityForm submitLabel="Simpan Identitas" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aset" className="mt-4">
          <AsetPanel />
        </TabsContent>

        <TabsContent value="pengesahan" className="mt-4">
          <PengesahanPanel />
        </TabsContent>

        <TabsContent value="bobot" className="mt-4">
          <BobotPanel />
        </TabsContent>

        <TabsContent value="backup" className="mt-4">
          <BackupPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ============================== ASET PANEL ============================== */

const ASET_ITEMS: Array<{
  key: keyof Aset;
  title: string;
  desc: string;
  buttonLabel: string;
  icon: React.ElementType;
  w: number;
  h: number;
}> = [
  {
    key: "logo",
    title: "Logo Sekolah",
    desc: "Tampil di kop (header) dokumen jurnal & rekap nilai.",
    buttonLabel: "Atur Logo",
    icon: School,
    w: 90,
    h: 90,
  },
  {
    key: "ttdKepsek",
    title: "Tanda Tangan Kepala Sekolah",
    desc: "Bisa diunggah sebagai gambar atau dibuat langsung di layar.",
    buttonLabel: "Atur TTD Kepsek",
    icon: FileSignature,
    w: 120,
    h: 60,
  },
  {
    key: "ttdGuru",
    title: "Tanda Tangan Guru",
    desc: "Bisa diunggah sebagai gambar atau dibuat langsung di layar.",
    buttonLabel: "Atur TTD Guru",
    icon: PenLine,
    w: 120,
    h: 60,
  },
  {
    key: "stempel",
    title: "Stempel (opsional)",
    desc: "Cap/stempel sekolah, disisipkan dekat tanda tangan.",
    buttonLabel: "Atur Stempel",
    icon: Stamp,
    w: 90,
    h: 90,
  },
];

function AsetPanel() {
  const aset = useStore((s) => s.aset);
  const setAset = useStore((s) => s.setAset);
  const confirm = useConfirm();
  const [openKey, setOpenKey] = React.useState<keyof Aset | null>(null);

  const handleSave = (key: keyof Aset, dataUrl: string) => {
    setAset({ [key]: dataUrl } as Partial<Aset>);
    toast.success("Gambar tersimpan.");
    setOpenKey(null);
  };

  const handleDelete = async (key: keyof Aset) => {
    const ok = await confirm({
      message: "Hapus gambar ini?",
      okLabel: "Hapus",
      danger: true,
    });
    if (!ok) return;
    setAset({ [key]: "" } as Partial<Aset>);
    toast.info("Gambar dihapus.");
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {ASET_ITEMS.map((item) => {
        const data = aset[item.key];
        return (
          <Card key={item.key} className="card-fancy">
            <CardContent className="flex flex-col gap-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
                      <item.icon className="size-4" />
                    </div>
                    <h3 className="font-semibold">{item.title}</h3>
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {item.desc}
                  </p>
                </div>
                {data && (
                  <div className="flex size-16 shrink-0 items-center justify-center rounded-lg border bg-white p-1">
                    <img
                      src={data}
                      alt={item.title}
                      style={{ maxWidth: item.w, maxHeight: item.h }}
                      className="max-h-14 max-w-full object-contain"
                    />
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setOpenKey(item.key)}
                >
                  <Upload className="mr-1.5 size-3.5" />
                  {data ? "Ganti" : item.buttonLabel}
                </Button>
                {data && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handleDelete(item.key)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}

      <AssetUploadDialog
        open={openKey !== null}
        onOpenChange={(v) => !v && setOpenKey(null)}
        title={ASET_ITEMS.find((i) => i.key === openKey)?.title ?? "Unggah Gambar"}
        label={ASET_ITEMS.find((i) => i.key === openKey)?.buttonLabel}
        currentData={openKey ? aset[openKey] : undefined}
        allowDelete={openKey ? !!aset[openKey] : false}
        onSave={(url) => openKey && handleSave(openKey, url)}
        onDelete={() => openKey && handleDelete(openKey)}
      />
    </div>
  );
}

/* ============================== PENGESAHAN PANEL ============================== */

function PengesahanPanel() {
  const p = useStore((s) => s.pengesahan);
  const setPengesahan = useStore((s) => s.setPengesahan);
  const [form, setForm] = React.useState<Pengesahan>(p);

  React.useEffect(() => setForm(p), [p]);

  const handleSave = () => {
    setPengesahan(form);
    toast.success("Data pengesahan tersimpan.");
  };

  return (
    <Card className="card-fancy">
      <CardHeader>
        <CardTitle className="text-base">Blok Pengesahan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-xs text-muted-foreground">
          Muncul di bagian bawah dokumen cetak: kota &amp; tanggal, lalu dua
          kolom (Kepala Sekolah &amp; Guru) berisi nama, NIP, dan area tanda
          tangan.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="pg-kota">Kota</Label>
            <Input
              id="pg-kota"
              value={form.kota}
              onChange={(e) => setForm((f) => ({ ...f, kota: e.target.value }))}
              placeholder="mis. Yogyakarta"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pg-tanggal">Tanggal Pengesahan</Label>
            <Input
              id="pg-tanggal"
              type="date"
              value={form.tanggal}
              onChange={(e) =>
                setForm((f) => ({ ...f, tanggal: e.target.value }))
              }
            />
          </div>
        </div>

        <div className="rounded-xl border bg-muted/20 p-4">
          <h4 className="mb-3 text-sm font-semibold">Kepala Sekolah</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pg-ks-nama">Nama</Label>
              <Input
                id="pg-ks-nama"
                value={form.kepsek.nama}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    kepsek: { ...f.kepsek, nama: e.target.value },
                  }))
                }
                placeholder="Nama lengkap"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pg-ks-nip">NIP</Label>
              <Input
                id="pg-ks-nip"
                value={form.kepsek.nip}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    kepsek: { ...f.kepsek, nip: e.target.value },
                  }))
                }
                placeholder="Nomor Induk Pegawai"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-muted/20 p-4">
          <h4 className="mb-3 text-sm font-semibold">Guru</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pg-g-nama">Nama</Label>
              <Input
                id="pg-g-nama"
                value={form.guru.nama}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    guru: { ...f.guru, nama: e.target.value },
                  }))
                }
                placeholder="Nama lengkap"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pg-g-nip">NIP</Label>
              <Input
                id="pg-g-nip"
                value={form.guru.nip}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    guru: { ...f.guru, nip: e.target.value },
                  }))
                }
                placeholder="Nomor Induk Pegawai"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave}>
            <Save className="mr-2 size-4" />
            Simpan Pengesahan
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ============================== BOBOT PANEL ============================== */

function BobotPanel() {
  const pengaturan = useStore((s) => s.pengaturan);
  const setPengaturan = useStore((s) => s.setPengaturan);
  const confirm = useConfirm();

  const [preset, setPreset] = React.useState(pengaturan.presetAktif);
  const [kategori, setKategori] = React.useState<Kategori[]>(
    pengaturan.kategori
  );

  React.useEffect(() => {
    setPreset(pengaturan.presetAktif);
    setKategori(pengaturan.kategori);
  }, [pengaturan]);

  const handleAddKategori = () => {
    setKategori((k) => [
      ...k,
      { min: 0, max: 0, label: "Baru", warna: "#94a3b8" },
    ]);
  };

  const handleRemoveKategori = (i: number) => {
    setKategori((k) => k.filter((_, idx) => idx !== i));
  };

  const handleUpdateKategori = (i: number, patch: Partial<Kategori>) => {
    setKategori((k) =>
      k.map((kat, idx) => (idx === i ? { ...kat, ...patch } : kat))
    );
  };

  const handleReset = async () => {
    const ok = await confirm({
      message: "Kembalikan kategori ke pengaturan default?",
      okLabel: "Ya, kembalikan",
    });
    if (!ok) return;
    setKategori(JSON.parse(JSON.stringify(DEFAULT_KATEGORI)));
    toast.info("Kategori dikembalikan ke default (belum disimpan).");
  };

  const handleSave = () => {
    const tidakValid = kategori.some(
      (k) =>
        isNaN(k.min) ||
        isNaN(k.max) ||
        k.min > k.max ||
        !k.label
    );
    if (tidakValid) {
      toast.warning("Periksa kembali rentang & label kategori.");
      return;
    }
    const next: Pengaturan = {
      presetAktif: preset,
      kategori,
    };
    setPengaturan(next);
    toast.success("Pengaturan bobot & kategori tersimpan.");
  };

  return (
    <div className="space-y-4">
      <Card className="card-fancy">
        <CardHeader>
          <CardTitle className="text-base">Preset Bobot Default</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-xs text-muted-foreground">
            Pilih preset yang otomatis dipakai saat membuka halaman Nilai Siswa.
            Anda masih bisa mengubah komponen &amp; bobot kapan saja di halaman
            Nilai.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {Object.entries(PRESET_BOBOT).map(([k, p]) => {
              const selected = preset === k;
              return (
                <button
                  key={k}
                  onClick={() => setPreset(k)}
                  className={
                    "flex flex-col items-start gap-1 rounded-xl border-2 p-4 text-left transition-all " +
                    (selected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40")
                  }
                >
                  <div className="flex w-full items-center justify-between">
                    <strong className="text-sm">{p.label}</strong>
                    {selected && (
                      <CheckCircle2 className="size-4 text-primary" />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{p.desc}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="card-fancy">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Kategori Capaian</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={handleReset}>
              <RotateCcw className="mr-1 size-3.5" />
              Default
            </Button>
            <Button size="sm" variant="ghost" onClick={handleAddKategori}>
              <Plus className="mr-1 size-3.5" />
              Tambah
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Rentang nilai → label &amp; warna. Pastikan rentang saling
            melengkapi (0–100).
          </p>
          <div className="space-y-2">
            {kategori.map((k, i) => (
              <div
                key={i}
                className="grid grid-cols-2 gap-2 rounded-lg border bg-card p-3 sm:grid-cols-[80px_80px_1fr_70px_auto] sm:items-end"
              >
                <div className="space-y-1">
                  <Label className="text-[10px]">Min</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={k.min}
                    onChange={(e) =>
                      handleUpdateKategori(i, {
                        min: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className="h-9 tabular-nums"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Maks</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={k.max}
                    onChange={(e) =>
                      handleUpdateKategori(i, {
                        max: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className="h-9 tabular-nums"
                  />
                </div>
                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <Label className="text-[10px]">Label</Label>
                  <Input
                    value={k.label}
                    onChange={(e) =>
                      handleUpdateKategori(i, { label: e.target.value })
                    }
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Warna</Label>
                  <div className="relative">
                    <input
                      type="color"
                      value={k.warna}
                      onChange={(e) =>
                        handleUpdateKategori(i, { warna: e.target.value })
                      }
                      className="h-9 w-full cursor-pointer rounded-md border bg-background p-1"
                    />
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => handleRemoveKategori(i)}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Preview */}
          <div className="flex flex-wrap gap-2 rounded-lg border bg-muted/20 p-3">
            {kategori.map((k, i) => (
              <span
                key={i}
                className="rounded-full px-2.5 py-1 text-xs font-medium"
                style={{
                  backgroundColor: `${k.warna}22`,
                  color: k.warna,
                }}
              >
                {k.label} ({k.min}–{k.max})
              </span>
            ))}
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave}>
              <Save className="mr-2 size-4" />
              Simpan Kategori
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ============================== BACKUP PANEL ============================== */

function BackupPanel() {
  const exportJSON = useStore((s) => s.exportJSON);
  const importJSON = useStore((s) => s.importJSON);
  const resetAll = useStore((s) => s.resetAll);
  const confirm = useConfirm();
  const fileRef = React.useRef<HTMLInputElement | null>(null);

  const handleExport = () => {
    const data = exportJSON();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `guruku-hebat-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    toast.success("Data diekspor.");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ok = await confirm({
      message: "Import akan menimpa data saat ini. Lanjutkan?",
      okLabel: "Ya, impor",
      danger: true,
    });
    if (!ok) {
      e.target.value = "";
      return;
    }
    try {
      const text = await file.text();
      const obj = JSON.parse(text);
      const n = importJSON(obj);
      toast.success(`Import berhasil (${n} kategori data).`);
    } catch (err) {
      console.error(err);
      toast.error("Gagal import: format tidak valid.");
    }
    e.target.value = "";
  };

  const handleReset = async () => {
    const ok = await confirm({
      message:
        "Yakin menghapus SEMUA data? Ini tidak bisa dibatalkan.",
      okLabel: "Ya, hapus semua",
      danger: true,
    });
    if (!ok) return;
    resetAll();
    toast.info("Semua data dihapus.");
  };

  return (
    <div className="space-y-4">
      <Card className="card-fancy">
        <CardHeader>
          <CardTitle className="text-base">Backup &amp; Pemulihan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Ekspor seluruh data (identitas, jurnal, siswa, nilai, aset,
            pengaturan) sebagai satu berkas JSON untuk cadangan atau pindah
            perangkat.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleExport}>
              <Download className="mr-2 size-4" />
              Export Semua Data (JSON)
            </Button>
            <Button variant="secondary" onClick={() => fileRef.current?.click()}>
              <Upload className="mr-2 size-4" />
              Import Data (JSON)
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={handleImport}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-destructive">
            <AlertTriangle className="size-4" />
            Reset Total
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Menghapus <strong>semua</strong> data di perangkat ini. Tindakan ini
            tidak bisa dibatalkan.
          </p>
          <Button variant="destructive" onClick={handleReset}>
            <Trash2 className="mr-2 size-4" />
            Hapus Semua Data
          </Button>
        </CardContent>
      </Card>

      <Card className="border-info/30 bg-info/5">
        <CardContent className="flex items-start gap-3 p-4">
          <Database className="mt-0.5 size-4 shrink-0 text-info" />
          <div className="text-xs">
            <strong>Catatan sinkronisasi:</strong> saat ini data hanya tersimpan
            di perangkat ini. Untuk akses dari beberapa perangkat, bisa
            ditambahkan backend gratis (mis. Supabase/Firebase) sebagai
            peningkatan opsional di masa depan.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
