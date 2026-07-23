"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Trash2,
  Pencil,
  FileText,
  FileJson,
  FileSpreadsheet,
  GraduationCap,
  Layers,
  Settings2,
  Save,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { useStore } from "@/lib/store";
import { useConfirm } from "@/components/shared/confirm-dialog";
import { DocPreviewDialog } from "@/components/shared/doc-preview-dialog";
import { DocKop, DocPengesahan } from "@/components/shared/doc-parts";
import {
  PRESET_BOBOT,
  applyPreset,
  validasiBobot,
  hitungNilaiAkhir,
  kategoriNilai,
  rataKelas,
  angkaBersih,
  uid,
} from "@/lib/bobot";
import { parseNilai, formatNilai } from "@/lib/parse-nilai";
import { cetakNilai, cetakSesuaiPratinjau } from "@/lib/pdf";
import type { Komponen, Siswa } from "@/lib/types";
import { toast } from "sonner";

export function NilaiView() {
  const siswa = useStore((s) => s.siswa);
  const komponen = useStore((s) => s.komponen);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Badge variant="secondary" className="w-fit">Nilai Siswa</Badge>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Input &amp; Rekap Nilai
        </h1>
        <p className="text-sm text-muted-foreground">
          Masukkan nilai tanpa rumus — perhitungan otomatis. Atur komponen &amp;
          bobot sesuai kebutuhan.
        </p>
      </div>

      <Tabs defaultValue="input" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="input">
            <GraduationCap className="mr-1.5 size-4" />
            Input Nilai
          </TabsTrigger>
          <TabsTrigger value="siswa">
            <Layers className="mr-1.5 size-4" />
            Daftar Siswa
            {siswa.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-[10px]">
                {siswa.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="komponen">
            <Settings2 className="mr-1.5 size-4" />
            Komponen &amp; Bobot
          </TabsTrigger>
        </TabsList>

        <TabsContent value="input" className="mt-4">
          <InputPanel />
        </TabsContent>
        <TabsContent value="siswa" className="mt-4">
          <SiswaPanel />
        </TabsContent>
        <TabsContent value="komponen" className="mt-4">
          <KomponenPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ============================== INPUT PANEL ============================== */

function InputPanel() {
  const siswa = useStore((s) => s.siswa);
  const komponen = useStore((s) => s.komponen);
  const nilai = useStore((s) => s.nilai);
  const pengaturan = useStore((s) => s.pengaturan);
  const setNilai = useStore((s) => s.setNilai);
  const exportData = useStore((s) => s.exportJSON);
  const confirm = useConfirm();
  const [previewOpen, setPreviewOpen] = React.useState(false);

  if (!siswa.length || !komponen.length) {
    return (
      <Card className="border-warning/40 bg-warning/5">
        <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
          <AlertCircle className="size-8 text-warning" />
          <p className="text-sm">
            {!siswa.length && "Belum ada siswa. "}
            {!komponen.length && "Belum ada komponen nilai. "}
          </p>
          <p className="text-xs text-muted-foreground">
            Silakan tambahkan di tab <strong>Daftar Siswa</strong> dan{" "}
            <strong>Komponen &amp; Bobot</strong> terlebih dahulu.
          </p>
        </CardContent>
      </Card>
    );
  }

  const v = validasiBobot(komponen);
  const siswaIds = siswa.map((s) => s.id);

  // Class average per component
  const footKomp = komponen.map((k) => rataKelas(nilai, siswaIds, k.id));
  let sumAkhir = 0;
  let cntAkhir = 0;
  siswa.forEach((s) => {
    const h = hitungNilaiAkhir(nilai[s.id] || {}, komponen);
    if (h.akhir !== null) {
      sumAkhir += h.akhir;
      cntAkhir++;
    }
  });
  const rataAkhir = cntAkhir ? angkaBersih(sumAkhir / cntAkhir) : null;

  const handleExportCSV = () => {
    const header = [
      "NISN",
      "Nama",
      ...komponen.map((k) => `${k.nama} (${k.bobot}%)`),
      "Nilai Akhir",
      "Kategori",
    ];
    const rows = siswa.map((m) => {
      const h = hitungNilaiAkhir(nilai[m.id] || {}, komponen);
      const kat = kategoriNilai(h.akhir, pengaturan.kategori);
      const kompVals = komponen.map((k) => {
        const entri = (nilai[m.id] && nilai[m.id][k.id]) || [];
        const angka = entri.map(parseFloat).filter((x) => !isNaN(x));
        return angka.length
          ? angkaBersih(angka.reduce((s, x) => s + x, 0) / angka.length)
          : "";
      });
      return [
        m.nisn || "",
        m.nama,
        ...kompVals,
        h.akhir !== null ? h.akhir : "",
        h.akhir !== null ? kat.label : "",
      ];
    });
    const csv = [header, ...rows]
      .map((r) =>
        r
          .map((c) => {
            const s = String(c == null ? "" : c);
            return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
          })
          .join(",")
      )
      .join("\n");
    downloadFile(
      `rekap-nilai-${new Date().toISOString().slice(0, 10)}.csv`,
      "\ufeff" + csv,
      "text/csv;charset=utf-8"
    );
    toast.success("CSV diunduh.");
  };

  const handleExportJSON = () => {
    const data = {
      siswa,
      komponen,
      nilai,
    };
    downloadFile(
      `nilai-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(data, null, 2),
      "application/json"
    );
    toast.success("JSON diunduh.");
  };

  const handleCetak = async () => {
    if (!v.valid) {
      const ok = await confirm({
        message: `Total bobot belum 100% (${v.total}%). Tetap cetak?`,
        okLabel: "Ya, cetak",
      });
      if (!ok) return;
    }
    try {
      await cetakNilai(exportData());
      toast.success("PDF Nilai (Tajam) berhasil diunduh.");
    } catch (e) {
      console.error(e);
      toast.error("Gagal membuat PDF.");
    }
  };

  return (
    <div className="space-y-4">
      {/* Validation alert */}
      <Card
        className={
          v.valid
            ? "border-success/30 bg-success/5"
            : "border-warning/40 bg-warning/5"
        }
      >
        <CardContent className="flex items-start gap-3 p-4">
          {v.valid ? (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
          ) : (
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-warning" />
          )}
          <div className="flex-1 text-xs">
            {v.valid ? (
              <span>
                Total bobot 100% ✓. Nilai Akhir dihitung sebagai rata-rata
                tertimbang.
              </span>
            ) : (
              <span>
                Total bobot <strong>{v.total}%</strong> (harus 100%).{" "}
                {v.pesan} Perbaiki di tab Komponen &amp; Bobot.
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="card-fancy">
        <CardHeader className="flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <GraduationCap className="size-4 text-primary" />
            Tabel Nilai
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="ghost" onClick={handleExportCSV}>
              <FileSpreadsheet className="mr-1 size-4" />
              CSV
            </Button>
            <Button size="sm" variant="ghost" onClick={handleExportJSON}>
              <FileJson className="mr-1 size-4" />
              JSON
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setPreviewOpen(true)}>
              <FileText className="mr-1 size-4" />
              Pratinjau
            </Button>
            <Button size="sm" onClick={handleCetak}>
              <FileText className="mr-1 size-4" />
              Cetak / PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-xs text-muted-foreground">
            Masukkan nilai 0–100. Banyak nilai dalam satu komponen dipisah koma
            (mis. <code className="rounded bg-muted px-1 py-0.5">80, 75, 90</code>)
            → otomatis dirata-rata. Klik di luar sel untuk menyimpan.
          </p>

          <div className="overflow-x-auto rounded-lg border">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-24">NISN</TableHead>
                  <TableHead className="min-w-[160px]">Nama</TableHead>
                  {komponen.map((k) => (
                    <TableHead key={k.id} className="text-center min-w-[120px]">
                      <div className="font-semibold">{k.nama}</div>
                      <div className="text-[10px] font-normal text-muted-foreground">
                        bobot {k.bobot}%
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="text-center min-w-[110px]">Nilai Akhir</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {siswa.map((m) => {
                  const h = hitungNilaiAkhir(nilai[m.id] || {}, komponen);
                  const kat = kategoriNilai(h.akhir, pengaturan.kategori);
                  return (
                    <TableRow key={m.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {m.nisn || "—"}
                      </TableCell>
                      <TableCell className="font-medium">{m.nama}</TableCell>
                      {komponen.map((k) => (
                        <TableCell key={k.id} className="p-1">
                          <GradeInput
                            siswaId={m.id}
                            komponenId={k.id}
                            value={(nilai[m.id] && nilai[m.id][k.id]) || []}
                            onChange={(angka) => setNilai(m.id, k.id, angka)}
                          />
                        </TableCell>
                      ))}
                      <TableCell className="text-center">
                        {h.akhir !== null ? (
                          <div className="flex flex-col items-center gap-1">
                            <span
                              className="text-base font-bold tabular-nums"
                              style={{ color: kat.warna }}
                            >
                              {h.akhir}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[10px]"
                              style={{
                                borderColor: kat.warna,
                                color: kat.warna,
                                backgroundColor: `${kat.warna}15`,
                              }}
                            >
                              {kat.label}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              <TableFooter>
                <TableRow className="bg-muted/40 font-semibold">
                  <TableCell colSpan={2}>Rata-rata Kelas</TableCell>
                  {footKomp.map((r, i) => (
                    <TableCell key={i} className="text-center tabular-nums">
                      {r !== null ? r : "—"}
                    </TableCell>
                  ))}
                  <TableCell className="text-center tabular-nums">
                    {rataAkhir !== null ? rataAkhir : "—"}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>

      <DocPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title="Pratinjau Rekap Nilai"
        onPrintSharp={async () => {
          setPreviewOpen(false);
          await handleCetak();
        }}
        onPrintVisual={async (node) => {
          if (!v.valid) {
            const ok = await confirm({
              message: `Total bobot belum 100% (${v.total}%). Tetap cetak?`,
              okLabel: "Ya, cetak",
            });
            if (!ok) return;
          }
          await cetakSesuaiPratinjau(node, "Rekap-Nilai");
        }}
      >
        <NilaiDocument />
      </DocPreviewDialog>
    </div>
  );
}

function GradeInput({
  siswaId: _siswaId,
  komponenId: _komponenId,
  value,
  onChange,
}: {
  siswaId: string;
  komponenId: string;
  value: number[];
  onChange: (arr: number[]) => void;
}) {
  const [text, setText] = React.useState(formatNilai(value));
  const [focused, setFocused] = React.useState(false);

  React.useEffect(() => {
    if (!focused) setText(formatNilai(value));
  }, [value, focused]);

  const commit = () => {
    setFocused(false);
    const parsed = parseNilai(text);
    onChange(parsed);
    setText(formatNilai(parsed));
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          (e.target as HTMLInputElement).blur();
        }
      }}
      placeholder="0"
      title="Pisahkan banyak nilai dengan koma, mis. 80, 75, 90"
      className="grade-input"
    />
  );
}

/* ============================== SISWA PANEL ============================== */

function SiswaPanel() {
  const siswa = useStore((s) => s.siswa);
  const addSiswa = useStore((s) => s.addSiswa);
  const updateSiswa = useStore((s) => s.updateSiswa);
  const deleteSiswa = useStore((s) => s.deleteSiswa);
  const confirm = useConfirm();

  const [editing, setEditing] = React.useState<Siswa | null>(null);
  const [open, setOpen] = React.useState(false);

  const handleAdd = () => {
    setEditing(null);
    setOpen(true);
  };

  const handleEdit = (s: Siswa) => {
    setEditing(s);
    setOpen(true);
  };

  const handleDelete = async (s: Siswa) => {
    const ok = await confirm({
      message: `Hapus siswa "${s.nama}" beserta nilainya?`,
      okLabel: "Hapus",
      danger: true,
    });
    if (!ok) return;
    deleteSiswa(s.id);
    toast.info("Siswa dihapus.");
  };

  return (
    <Card className="card-fancy">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <Layers className="size-4 text-primary" />
          Daftar Siswa
        </CardTitle>
        <Button size="sm" variant="secondary" onClick={handleAdd}>
          <Plus className="mr-1 size-4" />
          Tambah Siswa
        </Button>
      </CardHeader>
      <CardContent>
        {siswa.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-muted/20 py-12 text-center">
            <div className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
              <GraduationCap className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Belum ada siswa.</p>
              <p className="text-xs text-muted-foreground">
                Klik <strong>+ Tambah Siswa</strong> untuk memulai.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-12 text-center">No</TableHead>
                  <TableHead>Nama Siswa</TableHead>
                  <TableHead>NISN</TableHead>
                  <TableHead className="w-32 text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {siswa.map((m, i) => (
                  <TableRow key={m.id} className="hover:bg-muted/30">
                    <TableCell className="text-center text-muted-foreground">
                      {i + 1}
                    </TableCell>
                    <TableCell className="font-medium">{m.nama}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {m.nisn || "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8"
                          onClick={() => handleEdit(m)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleDelete(m)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          {siswa.length} siswa terdaftar.
        </p>
      </CardContent>

      <SiswaFormDialog
        open={open}
        onOpenChange={setOpen}
        siswa={editing}
        onSave={(nama, nisn) => {
          if (editing) {
            updateSiswa(editing.id, { nama, nisn });
            toast.success("Perubahan disimpan.");
          } else {
            addSiswa(nama, nisn);
            toast.success("Siswa ditambahkan.");
          }
          setOpen(false);
        }}
      />
    </Card>
  );
}

function SiswaFormDialog({
  open,
  onOpenChange,
  siswa,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  siswa: Siswa | null;
  onSave: (nama: string, nisn: string) => void;
}) {
  const [nama, setNama] = React.useState("");
  const [nisn, setNisn] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setNama(siswa?.nama ?? "");
      setNisn(siswa?.nisn ?? "");
    }
  }, [open, siswa]);

  const handleSave = () => {
    if (!nama.trim()) {
      toast.warning("Nama wajib diisi.");
      return;
    }
    onSave(nama.trim(), nisn.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{siswa ? "Edit Siswa" : "Tambah Siswa"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="m-nama">
              Nama Lengkap <span className="text-destructive">*</span>
            </Label>
            <Input
              id="m-nama"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Nama siswa"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="m-nisn">NISN (opsional)</Label>
            <Input
              id="m-nisn"
              value={nisn}
              onChange={(e) => setNisn(e.target.value)}
              placeholder="Nomor Induk Siswa Nasional"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleSave}>Simpan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ============================== KOMPONEN PANEL ============================== */

function KomponenPanel() {
  const komponen = useStore((s) => s.komponen);
  const setKomponen = useStore((s) => s.setKomponen);
  const pengaturan = useStore((s) => s.pengaturan);
  const setPresetAktif = useStore((s) => s.setPresetAktif);
  const confirm = useConfirm();

  const [daftar, setDaftar] = React.useState<Komponen[]>(komponen);

  React.useEffect(() => {
    setDaftar(komponen);
  }, [komponen]);

  const v = validasiBobot(daftar);

  const handleAdd = () => {
    setDaftar((d) => [...d, { id: uid("k"), nama: "Komponen Baru", bobot: 0 }]);
  };

  const handleRemove = (i: number) => {
    setDaftar((d) => d.filter((_, idx) => idx !== i));
  };

  const handleUpdate = (i: number, patch: Partial<Komponen>) => {
    setDaftar((d) => d.map((k, idx) => (idx === i ? { ...k, ...patch } : k)));
  };

  const handlePreset = async (kunci: string) => {
    const label = PRESET_BOBOT[kunci].label;
    const ok = await confirm({
      message: `Terapkan preset "${label}"? Komponen saat ini akan diganti (nilai siswa tetap aman).`,
      okLabel: "Terapkan",
    });
    if (!ok) return;
    const baru = applyPreset(kunci, daftar);
    if (baru) {
      setDaftar(baru);
      setPresetAktif(kunci);
      toast.success(`Preset "${label}" diterapkan. Klik Simpan untuk menyimpan.`);
    }
  };

  const handleSave = () => {
    if (!v.valid) {
      toast.error(
        `Total bobot harus 100%. Saat ini ${v.total}%. ${v.pesan}`
      );
      return;
    }
    const cleaned = daftar.map((k) => ({
      id: k.id || uid("k"),
      nama: k.nama || "Komponen",
      bobot: parseFloat(k.bobot as unknown as string) || 0,
    }));
    setKomponen(cleaned);
    toast.success("Komponen & bobot tersimpan.");
  };

  return (
    <div className="space-y-4">
      {/* Presets */}
      <Card className="card-fancy">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4 text-primary" />
            Preset Bobot (satu klik)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-xs text-muted-foreground">
            Mengganti seluruh komponen &amp; bobot sekaligus. Data nilai siswa
            tetap aman.
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(PRESET_BOBOT).map(([k, p]) => {
              const aktif = pengaturan.presetAktif === k;
              return (
                <Button
                  key={k}
                  size="sm"
                  variant={aktif ? "default" : "secondary"}
                  onClick={() => handlePreset(k)}
                >
                  {aktif && <CheckCircle2 className="mr-1 size-3.5" />}
                  {p.label}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Editor */}
      <Card className="card-fancy">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings2 className="size-4 text-primary" />
            Komponen Nilai &amp; Bobot
          </CardTitle>
          <Button size="sm" variant="secondary" onClick={handleAdd}>
            <Plus className="mr-1 size-4" />
            Tambah Komponen
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {daftar.map((k, i) => (
              <motion.div
                key={k.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_120px_auto] sm:items-end"
              >
                <div className="space-y-1.5">
                  <Label className="text-xs">Nama Komponen</Label>
                  <Input
                    value={k.nama}
                    onChange={(e) => handleUpdate(i, { nama: e.target.value })}
                    placeholder="mis. Tugas Harian"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Bobot (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={k.bobot}
                    onChange={(e) =>
                      handleUpdate(i, { bobot: parseFloat(e.target.value) || 0 })
                    }
                    className="text-center tabular-nums"
                  />
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => handleRemove(i)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </motion.div>
            ))}
          </div>

          {/* Status */}
          <div
            className={
              "rounded-lg border p-3 text-sm " +
              (v.valid
                ? "border-success/30 bg-success/5 text-success"
                : "border-warning/40 bg-warning/5 text-warning")
            }
          >
            <div className="flex items-center gap-2">
              {v.valid ? (
                <CheckCircle2 className="size-4" />
              ) : (
                <AlertCircle className="size-4" />
              )}
              <span>
                Total bobot: <strong>{v.total}%</strong> — {v.pesan}
              </span>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave}>
              <Save className="mr-2 size-4" />
              Simpan Komponen &amp; Bobot
            </Button>
          </div>

          <details className="rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground">
            <summary className="cursor-pointer font-medium">
              Cara pembobotan
            </summary>
            <p className="mt-2">
              Nilai Akhir = Σ (rata-rata komponen × bobot%). Setiap komponen
              boleh punya banyak entri (mis. Ulangan Harian 1, 2, 3) yang
              otomatis dirata-rata. Total bobot <strong>wajib 100%</strong>.
            </p>
          </details>
        </CardContent>
      </Card>
    </div>
  );
}

/* ============================== DOCUMENT ============================== */

function NilaiDocument() {
  const siswa = useStore((s) => s.siswa);
  const komponen = useStore((s) => s.komponen);
  const nilai = useStore((s) => s.nilai);
  const pengaturan = useStore((s) => s.pengaturan);
  const identitas = useStore((s) => s.identitas);

  const siswaIds = siswa.map((s) => s.id);

  return (
    <div className="doc-preview">
      <DocKop />
      <div className="doc-title">REKAP NILAI SISWA</div>
      <div style={{ marginBottom: 10, fontSize: 11 }}>
        <div>
          <strong>Mata Pelajaran:</strong> {identitas.mapel || "—"}
        </div>
        <div>
          <strong>Kelas:</strong> {identitas.kelas || "—"}
        </div>
        <div>
          <strong>Tahun Ajaran:</strong> {identitas.tahun || "—"}
        </div>
      </div>
      <table className="data">
        <thead>
          <tr>
            <th className="num">No</th>
            <th className="num">NISN</th>
            <th>Nama</th>
            {komponen.map((k) => (
              <th key={k.id} className="num">
                {k.nama}
                <br />({k.bobot}%)
              </th>
            ))}
            <th className="num">Akhir</th>
            <th className="num">Kategori</th>
          </tr>
        </thead>
        <tbody>
          {siswa.map((m, idx) => {
            const h = hitungNilaiAkhir(nilai[m.id] || {}, komponen);
            const kat = kategoriNilai(h.akhir, pengaturan.kategori);
            return (
              <tr key={m.id}>
                <td className="num">{idx + 1}</td>
                <td className="num">{m.nisn || ""}</td>
                <td>{m.nama}</td>
                {komponen.map((k) => {
                  const entri = (nilai[m.id] && nilai[m.id][k.id]) || [];
                  const angka = entri.map(parseFloat).filter((x) => !isNaN(x));
                  const r = angka.length
                    ? angkaBersih(angka.reduce((s, x) => s + x, 0) / angka.length)
                    : null;
                  return (
                    <td key={k.id} className="num">
                      {r !== null ? r : "—"}
                    </td>
                  );
                })}
                <td className="num">
                  <strong>{h.akhir !== null ? h.akhir : "—"}</strong>
                </td>
                <td className="num">{h.akhir !== null ? kat.label : "—"}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3}>
              <strong>Rata-rata Kelas</strong>
            </td>
            {komponen.map((k) => {
              const r = rataKelas(nilai, siswaIds, k.id);
              return (
                <td key={k.id} className="num">
                  {r !== null ? r : "—"}
                </td>
              );
            })}
            <td colSpan={2}></td>
          </tr>
        </tfoot>
      </table>
      <DocPengesahan />
    </div>
  );
}

/* ============================== HELPERS ============================== */

function downloadFile(name: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

// Avoid unused import warnings
void FileText;
void Textarea;
