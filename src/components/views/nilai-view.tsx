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
  Upload,
  StickyNote,
  Download,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { tglPendek, todayISO } from "@/lib/format";
import type { Komponen, Siswa, CatatanSiswa } from "@/lib/types";
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
                Total bobot 100%. Nilai Akhir dihitung sebagai rata-rata
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
  const catatan = useStore((s) => s.catatan);
  const confirm = useConfirm();

  const [editing, setEditing] = React.useState<Siswa | null>(null);
  const [open, setOpen] = React.useState(false);
  const [csvOpen, setCsvOpen] = React.useState(false);
  const [catatanSiswa, setCatatanSiswa] = React.useState<Siswa | null>(null);

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

  const catatanCount = (siswaId: string) =>
    catatan.filter((c) => c.siswaId === siswaId).length;

  return (
    <Card className="card-fancy">
      <CardHeader className="flex-row items-center justify-between flex-wrap gap-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Layers className="size-4 text-primary" />
          Daftar Siswa
        </CardTitle>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setCsvOpen(true)}>
            <Upload className="mr-1 size-4" />
            Impor CSV
          </Button>
          <Button size="sm" variant="secondary" onClick={handleAdd}>
            <Plus className="mr-1 size-4" />
            Tambah Siswa
          </Button>
        </div>
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
                Klik <strong>+ Tambah Siswa</strong> atau{" "}
                <strong>Impor CSV</strong> untuk memulai.
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
                  <TableHead className="w-44 text-center">Aksi</TableHead>
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
                          size="sm"
                          variant="ghost"
                          className="relative h-8 px-2"
                          onClick={() => setCatatanSiswa(m)}
                          title="Catatan anekdotal siswa"
                        >
                          <StickyNote className="size-3.5" />
                          {catatanCount(m.id) > 0 && (
                            <Badge
                              variant="secondary"
                              className="ml-1 h-4 min-w-4 justify-center px-1 text-[9px]"
                            >
                              {catatanCount(m.id)}
                            </Badge>
                          )}
                        </Button>
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

      <ImportCsvDialog
        open={csvOpen}
        onOpenChange={setCsvOpen}
        onImport={(items) => {
          items.forEach((it) => addSiswa(it.nama, it.nisn));
          toast.success(`${items.length} siswa berhasil diimpor.`);
          setCsvOpen(false);
        }}
      />

      {catatanSiswa && (
        <CatatanSiswaDialog
          siswa={catatanSiswa}
          onOpenChange={(v) => !v && setCatatanSiswa(null)}
        />
      )}
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

/* ============================ IMPORT CSV ============================ */

function parseCSVLine(line: string): string[] {
  // Simple CSV parser — supports quoted fields with commas inside
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result.map((s) => s.trim());
}

function parseCSVSiswa(text: string): { nama: string; nisn: string }[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length === 0) return [];

  // Detect delimiter from first line: comma, tab, or semicolon
  const firstLine = lines[0];
  let delimCount = { comma: 0, tab: 0, semi: 0 };
  for (const ch of firstLine) {
    if (ch === ",") delimCount.comma++;
    else if (ch === "\t") delimCount.tab++;
    else if (ch === ";") delimCount.semi++;
  }
  const delim = delimCount.tab >= delimCount.comma && delimCount.tab >= delimCount.semi
    ? "tab"
    : delimCount.semi > delimCount.comma
      ? "semi"
      : "comma";

  const splitLine = (l: string): string[] => {
    if (delim === "tab") return l.split("\t").map((s) => s.trim());
    if (delim === "semi") return l.split(";").map((s) => s.trim());
    return parseCSVLine(l);
  };

  // Detect if first line is a header
  const firstParts = splitLine(firstLine).map((s) => s.toLowerCase());
  const hasHeader =
    firstParts.some((p) => p.includes("nama")) ||
    firstParts.some((p) => p.includes("nisn")) ||
    firstParts.some((p) => p.includes("no"));

  const dataLines = hasHeader ? lines.slice(1) : lines;
  const out: { nama: string; nisn: string }[] = [];

  for (const line of dataLines) {
    const parts = splitLine(line);
    if (parts.length === 0) continue;
    let nama = "";
    let nisn = "";

    if (hasHeader) {
      // Try to match by header names
      const headers = firstParts;
      const namaIdx = headers.findIndex((h) => h.includes("nama"));
      const nisnIdx = headers.findIndex(
        (h) => h.includes("nisn") || h.includes("nis") || h.includes("induk")
      );
      nama = namaIdx >= 0 ? parts[namaIdx] || "" : parts[0] || "";
      nisn = nisnIdx >= 0 ? parts[nisnIdx] || "" : parts[1] || "";
    } else {
      // Assume: Nama, NISN (or just Nama)
      nama = parts[0] || "";
      nisn = parts[1] || "";
      // If first column looks numeric and second is text, swap
      if (nama && /^\d+$/.test(nama) && nisn && !/^\d+$/.test(nisn)) {
        [nama, nisn] = [nisn, nama];
      }
    }
    if (nama) {
      out.push({ nama, nisn: nisn || "" });
    }
  }
  return out;
}

function ImportCsvDialog({
  open,
  onOpenChange,
  onImport,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onImport: (items: { nama: string; nisn: string }[]) => void;
}) {
  const [text, setText] = React.useState("");
  const fileRef = React.useRef<HTMLInputElement>(null);
  const parsed = React.useMemo(() => (text ? parseCSVSiswa(text) : []), [text]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setText(String(reader.result || ""));
    reader.readAsText(f);
  };

  const handleDownloadTemplate = () => {
    const tmpl = "Nama,NISN\nAhmad Fauzi,1234567890\nSiti Aminah,2345678901";
    downloadFile("template-siswa.csv", tmpl, "text/csv;charset=utf-8");
  };

  const handlePasteFromClipboard = async () => {
    try {
      const t = await navigator.clipboard.readText();
      if (t) setText(t);
      else toast.info("Clipboard kosong.");
    } catch {
      toast.error("Tidak bisa akses clipboard. Coba paste manual.");
    }
  };

  const handleImport = () => {
    if (parsed.length === 0) {
      toast.warning("Tidak ada data valid untuk diimpor.");
      return;
    }
    onImport(parsed);
    setText("");
    if (fileRef.current) fileRef.current.value = "";
  };

  React.useEffect(() => {
    if (!open) {
      setText("");
      if (fileRef.current) fileRef.current.value = "";
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Impor Siswa dari CSV / Teks</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Format didukung: <strong>CSV (koma)</strong>,{" "}
            <strong>TSV (tab)</strong>, atau <strong>titik-koma</strong>. Bisa
            dengan atau tanpa baris header (Nama, NISN).
          </p>

          <div className="flex flex-wrap gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.txt,.tsv,text/csv,text/plain"
              onChange={handleFile}
              className="hidden"
              id="csv-file-input"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="mr-1 size-3.5" />
              Pilih File
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handlePasteFromClipboard}
            >
              Tempel dari Clipboard
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDownloadTemplate}
            >
              <Download className="mr-1 size-3.5" />
              Unduh Template
            </Button>
          </div>

          <div className="space-y-1">
            <Label htmlFor="csv-text">Atau tempel data di sini</Label>
            <Textarea
              id="csv-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={"Nama,NISN\nAhmad Fauzi,1234567890\nSiti Aminah,2345678901"}
              className="min-h-[140px] font-mono text-xs"
            />
          </div>

          {parsed.length > 0 && (
            <div className="rounded-md border bg-muted/30 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium">
                  Pratinjau ({parsed.length} siswa akan diimpor)
                </span>
              </div>
              <ScrollArea className="h-32">
                <div className="space-y-1 pr-2">
                  {parsed.slice(0, 50).map((p, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded bg-background px-2 py-1 text-xs"
                    >
                      <span>
                        <span className="text-muted-foreground">{i + 1}.</span>{" "}
                        {p.nama}
                      </span>
                      <span className="font-mono text-muted-foreground">
                        {p.nisn || "—"}
                      </span>
                    </div>
                  ))}
                  {parsed.length > 50 && (
                    <p className="text-[10px] text-muted-foreground">
                      … dan {parsed.length - 50} lainnya.
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleImport} disabled={parsed.length === 0}>
            Impor {parsed.length > 0 ? `(${parsed.length})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ====================== CATATAN ANEKDOTAL SISWA ====================== */

const KATEGORI_CATATAN: Array<{
  value: CatatanSiswa["kategori"];
  label: string;
  color: string;
  bg: string;
}> = [
  {
    value: "positif",
    label: "Positif",
    color: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-100 dark:bg-emerald-900/40 border-emerald-300 dark:border-emerald-700",
  },
  {
    value: "pencapaian",
    label: "Pencapaian",
    color: "text-blue-700 dark:text-blue-300",
    bg: "bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700",
  },
  {
    value: "perlu_perhatian",
    label: "Perlu Perhatian",
    color: "text-amber-700 dark:text-amber-300",
    bg: "bg-amber-100 dark:bg-amber-900/40 border-amber-300 dark:border-amber-700",
  },
  {
    value: "lainnya",
    label: "Lainnya",
    color: "text-muted-foreground",
    bg: "bg-muted border-border",
  },
];

function CatatanSiswaDialog({
  siswa,
  onOpenChange,
}: {
  siswa: Siswa;
  onOpenChange: (v: boolean) => void;
}) {
  const allCatatan = useStore((s) => s.catatan);
  const addCatatan = useStore((s) => s.addCatatan);
  const updateCatatan = useStore((s) => s.updateCatatan);
  const deleteCatatan = useStore((s) => s.deleteCatatan);
  const confirm = useConfirm();

  const siswaCatatan = allCatatan
    .filter((c) => c.siswaId === siswa.id)
    .sort((a, b) => (a.tanggal < b.tanggal ? 1 : a.tanggal > b.tanggal ? -1 : 0));

  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CatatanSiswa | null>(null);
  const [tanggal, setTanggal] = React.useState(todayISO());
  const [kategori, setKategori] =
    React.useState<CatatanSiswa["kategori"]>("positif");
  const [judul, setJudul] = React.useState("");
  const [isi, setIsi] = React.useState("");

  const openNew = () => {
    setEditing(null);
    setTanggal(todayISO());
    setKategori("positif");
    setJudul("");
    setIsi("");
    setFormOpen(true);
  };

  const openEdit = (c: CatatanSiswa) => {
    setEditing(c);
    setTanggal(c.tanggal);
    setKategori(c.kategori);
    setJudul(c.judul);
    setIsi(c.isi);
    setFormOpen(true);
  };

  const handleSave = () => {
    if (!judul.trim() && !isi.trim()) {
      toast.warning("Isi judul atau catatan terlebih dahulu.");
      return;
    }
    if (editing) {
      updateCatatan(editing.id, { tanggal, kategori, judul: judul.trim(), isi: isi.trim() });
      toast.success("Catatan diperbarui.");
    } else {
      addCatatan({
        siswaId: siswa.id,
        tanggal,
        kategori,
        judul: judul.trim(),
        isi: isi.trim(),
      });
      toast.success("Catatan ditambahkan.");
    }
    setFormOpen(false);
  };

  const handleDelete = async (c: CatatanSiswa) => {
    const ok = await confirm({
      message: `Hapus catatan "${c.judul || c.isi.slice(0, 30)}"?`,
      okLabel: "Hapus",
      danger: true,
    });
    if (!ok) return;
    deleteCatatan(c.id);
    toast.info("Catatan dihapus.");
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StickyNote className="size-4 text-primary" />
            Catatan: {siswa.nama}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            NISN: {siswa.nisn || "—"} · {siswaCatatan.length} catatan
          </p>
        </DialogHeader>

        <div className="space-y-3">
          {siswaCatatan.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-muted/20 py-8 text-center">
              <StickyNote className="mx-auto mb-2 size-6 text-muted-foreground" />
              <p className="text-sm font-medium">Belum ada catatan.</p>
              <p className="text-xs text-muted-foreground">
                Catat prestasi, perilaku, atau hal penting tentang siswa ini.
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[360px]">
              <div className="space-y-2 pr-2">
                {siswaCatatan.map((c) => {
                  const k = KATEGORI_CATATAN.find((x) => x.value === c.kategori) || KATEGORI_CATATAN[3];
                  return (
                    <div key={c.id} className={`rounded-lg border p-3 ${k.bg}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`text-[10px] ${k.color}`}>
                              {k.label}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {tglPendek(c.tanggal)}
                            </span>
                          </div>
                          {c.judul && (
                            <p className="mt-1 text-sm font-semibold">{c.judul}</p>
                          )}
                          {c.isi && (
                            <p className="mt-0.5 text-xs leading-relaxed whitespace-pre-wrap">
                              {c.isi}
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 gap-0.5">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7"
                            onClick={() => openEdit(c)}
                          >
                            <Pencil className="size-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleDelete(c)}
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}

          {formOpen ? (
            <div className="rounded-lg border bg-card p-3 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Tanggal</Label>
                  <Input
                    type="date"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Kategori</Label>
                  <Select
                    value={kategori}
                    onValueChange={(v) =>
                      setKategori(v as CatatanSiswa["kategori"])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {KATEGORI_CATATAN.map((k) => (
                        <SelectItem key={k.value} value={k.value}>
                          {k.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Judul (opsional)</Label>
                <Input
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  placeholder="Mis. Aktif bertanya di kelas"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Catatan</Label>
                <Textarea
                  value={isi}
                  onChange={(e) => setIsi(e.target.value)}
                  placeholder="Tuliskan observasi, pencapaian, atau hal yang perlu diingat..."
                  className="min-h-[80px]"
                />
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          {formOpen ? (
            <>
              <Button variant="ghost" onClick={() => setFormOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleSave}>
                {editing ? "Perbarui" : "Simpan Catatan"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Tutup
              </Button>
              <Button onClick={openNew}>
                <Plus className="mr-1 size-4" />
                Tambah Catatan
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
