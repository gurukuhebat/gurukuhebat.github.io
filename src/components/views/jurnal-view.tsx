"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Eye,
  FileText,
  Calendar,
  Clock,
  BookOpen,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useStore } from "@/lib/store";
import { useConfirm } from "@/components/shared/confirm-dialog";
import { IdentityForm } from "@/components/shared/identity-form";
import { DocPreviewDialog } from "@/components/shared/doc-preview-dialog";
import { DocKop, DocPengesahan } from "@/components/shared/doc-parts";
import { cetakJurnal, cetakSesuaiPratinjau } from "@/lib/pdf";
import { tglPendek } from "@/lib/format";
import { toast } from "sonner";

const HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

export function JurnalView() {
  const jurnal = useStore((s) => s.jurnal);
  const addEntry = useStore((s) => s.addJurnalEntry);
  const updateEntry = useStore((s) => s.updateJurnalEntry);
  const deleteEntry = useStore((s) => s.deleteJurnalEntry);
  const identitas = useStore((s) => s.identitas);
  const exportData = useStore((s) => s.exportJSON);

  const confirm = useConfirm();
  const [previewOpen, setPreviewOpen] = React.useState(false);

  const handleAdd = () => {
    addEntry();
    toast.success(`Pertemuan ke-${jurnal.length + 1} ditambahkan.`);
  };

  const handleDelete = async (id: string, minggu: number) => {
    const ok = await confirm({
      message: `Hapus pertemuan ke-${minggu}?`,
      okLabel: "Hapus",
      danger: true,
    });
    if (!ok) return;
    deleteEntry(id);
    toast.info("Pertemuan dihapus.");
  };

  const validateBeforeCetak = (): boolean => {
    if (!identitas.sekolah) {
      toast.warning("Isi nama sekolah dulu di Bagian A / Pengaturan.");
      return false;
    }
    if (!jurnal.length) {
      toast.warning("Belum ada entri pertemuan untuk dicetak.");
      return false;
    }
    const kosong = jurnal.filter(
      (e) => !e.tanggal && !e.tujuan && !e.materi
    );
    if (kosong.length) {
      toast.info(`Ada ${kosong.length} entri masih kosong. Tetap dicetak?`);
    }
    return true;
  };

  const handlePreview = () => {
    if (!jurnal.length) {
      toast.warning("Belum ada entri untuk dipratinjau.");
      return;
    }
    setPreviewOpen(true);
  };

  const handleSharpPDF = async () => {
    if (!validateBeforeCetak()) return;
    try {
      await cetakJurnal(exportData());
      toast.success("PDF Jurnal (Tajam) berhasil diunduh.");
    } catch (e) {
      console.error(e);
      toast.error("Gagal membuat PDF.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Head */}
      <div className="space-y-1">
        <Badge variant="secondary" className="w-fit">Jurnal</Badge>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Jurnal Harian Pembelajaran
        </h1>
        <p className="text-sm text-muted-foreground">
          Isi data sekolah, tambah pertemuan tiap minggu, lalu cetak/PDF menjadi
          dokumen resmi.
        </p>
      </div>

      {/* Action bar */}
      <Card className="card-fancy">
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="size-5 text-primary" />
            <span className="text-sm">
              <strong>{jurnal.length}</strong> pertemuan tersimpan
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={handlePreview}>
              <Eye className="mr-1.5 size-4" />
              Pratinjau
            </Button>
            <Button onClick={handleSharpPDF}>
              <FileText className="mr-1.5 size-4" />
              Cetak / PDF (Tajam)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bagian A — Identitas */}
      <Card className="card-fancy">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <span className="grid size-7 place-items-center rounded-md bg-primary/10 text-xs font-bold text-primary">
              A
            </span>
            Identitas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-xs text-muted-foreground">
            Disimpan otomatis &amp; dipakai di semua dokumen.
          </p>
          <IdentityForm submitLabel="Simpan Identitas" />
        </CardContent>
      </Card>

      {/* Bagian B — Entri mingguan */}
      <Card className="card-fancy">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <span className="grid size-7 place-items-center rounded-md bg-primary/10 text-xs font-bold text-primary">
              B
            </span>
            Entri Pertemuan / Mingguan
          </CardTitle>
          <Button size="sm" variant="secondary" onClick={handleAdd}>
            <Plus className="mr-1 size-4" />
            Tambah Pertemuan
          </Button>
        </CardHeader>
        <CardContent>
          {jurnal.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 py-12 text-center">
              <div className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
                <BookOpen className="size-5" />
              </div>
              <div>
                <p className="text-sm font-medium">Belum ada entri.</p>
                <p className="text-xs text-muted-foreground">
                  Klik <strong>+ Tambah Pertemuan</strong> untuk memulai.
                </p>
              </div>
              <Button size="sm" onClick={handleAdd} variant="secondary">
                <Plus className="mr-1 size-4" />
                Tambah Pertemuan
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence initial={false}>
                {jurnal.map((e, idx) => (
                  <motion.div
                    key={e.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden rounded-xl border bg-card"
                  >
                    <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2">
                      <div className="flex items-center gap-2">
                        <span className="grid size-7 place-items-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
                          {idx + 1}
                        </span>
                        <span className="text-sm font-medium">
                          Pertemuan ke-{e.minggu}
                        </span>
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => handleDelete(e.id, e.minggu)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Hapus pertemuan</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
                      <div className="space-y-1.5 lg:col-span-1">
                        <Label className="text-xs">Pertemuan</Label>
                        <Input
                          type="number"
                          min={1}
                          value={e.minggu}
                          onChange={(ev) =>
                            updateEntry(e.id, {
                              minggu: parseInt(ev.target.value, 10) || e.minggu,
                            })
                          }
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Hari</Label>
                        <Select
                          value={e.hari}
                          onValueChange={(v) => updateEntry(e.id, { hari: v })}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {HARI.map((h) => (
                              <SelectItem key={h} value={h}>
                                {h}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Tanggal</Label>
                        <Input
                          type="date"
                          value={e.tanggal}
                          onChange={(ev) =>
                            updateEntry(e.id, { tanggal: ev.target.value })
                          }
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs flex items-center gap-1">
                          <Clock className="size-3" /> Jam Mulai
                        </Label>
                        <Input
                          type="time"
                          value={e.jamMulai}
                          onChange={(ev) =>
                            updateEntry(e.id, { jamMulai: ev.target.value })
                          }
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs flex items-center gap-1">
                          <Clock className="size-3" /> Jam Selesai
                        </Label>
                        <Input
                          type="time"
                          value={e.jamSelesai}
                          onChange={(ev) =>
                            updateEntry(e.id, { jamSelesai: ev.target.value })
                          }
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1.5 sm:col-span-2 lg:col-span-5">
                        <Label className="text-xs">Tujuan Pembelajaran</Label>
                        <Input
                          value={e.tujuan}
                          onChange={(ev) =>
                            updateEntry(e.id, { tujuan: ev.target.value })
                          }
                          placeholder="mis. Siswa mampu mengenal harokat fathah"
                        />
                      </div>
                      <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                        <Label className="text-xs">Materi</Label>
                        <Textarea
                          rows={2}
                          value={e.materi}
                          onChange={(ev) =>
                            updateEntry(e.id, { materi: ev.target.value })
                          }
                          placeholder="mis. Harokat fathah, contoh بَ تَ ثَ"
                          className="resize-y"
                        />
                      </div>
                      <div className="space-y-1.5 sm:col-span-2 lg:col-span-2">
                        <Label className="text-xs">Penilaian</Label>
                        <Textarea
                          rows={2}
                          value={e.penilaian}
                          onChange={(ev) =>
                            updateEntry(e.id, { penilaian: ev.target.value })
                          }
                          placeholder="mis. Lisan, tulisan, observasi"
                          className="resize-y"
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Validation note */}
      {jurnal.length > 0 && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-warning" />
            <p className="text-xs text-muted-foreground">
              Perubahan disimpan otomatis. Sebelum cetak PDF, pastikan{" "}
              <strong>nama sekolah</strong> sudah diisi di Bagian A.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Preview dialog */}
      <DocPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title="Pratinjau Dokumen Jurnal"
        onPrintSharp={async () => {
          setPreviewOpen(false);
          await handleSharpPDF();
        }}
        onPrintVisual={async (node) => {
          if (!validateBeforeCetak()) return;
          await cetakSesuaiPratinjau(node, "Jurnal-Pembelajaran");
        }}
      >
        <JurnalDocument />
      </DocPreviewDialog>
    </div>
  );
}

function JurnalDocument() {
  const jurnal = useStore((s) => s.jurnal);
  const identitas = useStore((s) => s.identitas);

  return (
    <div className="doc-preview">
      <DocKop />
      <div className="doc-title">JURNAL HARIAN PEMBELAJARAN</div>
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
            <th className="num">Mgg</th>
            <th>Hari</th>
            <th>Tanggal</th>
            <th className="num">Jam</th>
            <th>Tujuan Pembelajaran</th>
            <th>Materi</th>
            <th>Penilaian</th>
          </tr>
        </thead>
        <tbody>
          {jurnal.map((e) => {
            const jam =
              e.jamMulai || e.jamSelesai
                ? `${e.jamMulai || "--"} – ${e.jamSelesai || "--"}`
                : "—";
            return (
              <tr key={e.id}>
                <td className="num">{e.minggu}</td>
                <td>{e.hari}</td>
                <td>{e.tanggal ? tglPendek(e.tanggal) : "—"}</td>
                <td className="num">{jam}</td>
                <td>{e.tujuan || "—"}</td>
                <td>{(e.materi || "—").split("\n").map((line, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <br />}
                    {line}
                  </React.Fragment>
                ))}</td>
                <td>{(e.penilaian || "—").split("\n").map((line, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <br />}
                    {line}
                  </React.Fragment>
                ))}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <DocPengesahan />
    </div>
  );
}
