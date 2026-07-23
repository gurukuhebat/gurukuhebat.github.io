"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  CalendarCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileText,
  Users,
  CheckCheck,
  Eraser,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useStore } from "@/lib/store";
import { useConfirm } from "@/components/shared/confirm-dialog";
import { DocPreviewDialog } from "@/components/shared/doc-preview-dialog";
import { DocKop, DocPengesahan } from "@/components/shared/doc-parts";
import { cetakAbsensi, cetakSesuaiPratinjau } from "@/lib/pdf";
import { tglID, todayISO } from "@/lib/format";
import type { AbsensiStatus } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface StatusConfig {
  code: AbsensiStatus;
  label: string;
  fullLabel: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

const STATUS_LIST: StatusConfig[] = [
  {
    code: "H",
    label: "H",
    fullLabel: "Hadir",
    color: "text-emerald-700 dark:text-emerald-300",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/40",
    borderColor: "border-emerald-300 dark:border-emerald-700",
  },
  {
    code: "S",
    label: "S",
    fullLabel: "Sakit",
    color: "text-amber-700 dark:text-amber-300",
    bgColor: "bg-amber-100 dark:bg-amber-900/40",
    borderColor: "border-amber-300 dark:border-amber-700",
  },
  {
    code: "I",
    label: "I",
    fullLabel: "Izin",
    color: "text-blue-700 dark:text-blue-300",
    bgColor: "bg-blue-100 dark:bg-blue-900/40",
    borderColor: "border-blue-300 dark:border-blue-700",
  },
  {
    code: "A",
    label: "A",
    fullLabel: "Alpa",
    color: "text-rose-700 dark:text-rose-300",
    bgColor: "bg-rose-100 dark:bg-rose-900/40",
    borderColor: "border-rose-300 dark:border-rose-700",
  },
  {
    code: "B",
    label: "B",
    fullLabel: "Bolos",
    color: "text-purple-700 dark:text-purple-300",
    bgColor: "bg-purple-100 dark:bg-purple-900/40",
    borderColor: "border-purple-300 dark:border-purple-700",
  },
];

const STATUS_BY_CODE: Record<AbsensiStatus, StatusConfig> = STATUS_LIST.reduce(
  (acc, s) => ({ ...acc, [s.code]: s }),
  {} as Record<AbsensiStatus, StatusConfig>
);

// ISO date manipulation (yyyy-mm-dd)
function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

function startOfMonthISO(iso: string): string {
  return iso.slice(0, 8) + "01";
}

function endOfMonthISO(iso: string): string {
  const [y, m] = iso.split("-").map(Number);
  const last = new Date(y, m, 0).getDate();
  return `${iso.slice(0, 8)}${String(last).padStart(2, "0")}`;
}

const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

function getHari(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return HARI[d.getDay()];
}

function isWeekend(iso: string): boolean {
  const d = new Date(iso + "T00:00:00");
  return d.getDay() === 0; // Minggu
}

export function AbsensiView() {
  const siswa = useStore((s) => s.siswa);
  const absensi = useStore((s) => s.absensi);
  const setAbsensi = useStore((s) => s.setAbsensi);
  const setAbsensiBulk = useStore((s) => s.setAbsensiBulk);
  const clearAbsensiTanggal = useStore((s) => s.clearAbsensiTanggal);
  const identitas = useStore((s) => s.identitas);
  const confirm = useConfirm();

  const [selectedDate, setSelectedDate] = React.useState<string>(todayISO());
  const [previewOpen, setPreviewOpen] = React.useState(false);

  const dayAbsensi = absensi[selectedDate] || {};

  // Hitung statistik hari ini
  const stats = React.useMemo(() => {
    const counts: Record<AbsensiStatus, number> = { H: 0, S: 0, I: 0, A: 0, B: 0 };
    let total = 0;
    siswa.forEach((s) => {
      const st = dayAbsensi[s.id];
      if (st) {
        counts[st]++;
        total++;
      }
    });
    return { counts, total, terisi: total, kosong: siswa.length - total };
  }, [dayAbsensi, siswa]);

  // Statistik bulan ini
  const monthStats = React.useMemo(() => {
    const start = startOfMonthISO(selectedDate);
    const end = endOfMonthISO(selectedDate);
    const monthCounts: Record<AbsensiStatus, number> = { H: 0, S: 0, I: 0, A: 0, B: 0 };
    Object.entries(absensi).forEach(([tgl, map]) => {
      if (tgl >= start && tgl <= end) {
        Object.values(map).forEach((st) => {
          if (st) monthCounts[st]++;
        });
      }
    });
    const total = Object.values(monthCounts).reduce((a, b) => a + b, 0);
    return { monthCounts, total };
  }, [absensi, selectedDate]);

  const handleSetStatus = (siswaId: string, status: AbsensiStatus) => {
    // Toggle off if same status
    if (dayAbsensi[siswaId] === status) {
      // remove
      const next = { ...absensi };
      if (next[selectedDate]) {
        delete next[selectedDate][siswaId];
        if (Object.keys(next[selectedDate]).length === 0) {
          delete next[selectedDate];
        }
      }
      useStore.setState({ absensi: next });
    } else {
      setAbsensi(selectedDate, siswaId, status);
    }
  };

  const handleMarkAllHadir = () => {
    if (siswa.length === 0) {
      toast.info("Tambahkan siswa dulu di tab Nilai → Daftar Siswa.");
      return;
    }
    setAbsensiBulk(
      selectedDate,
      siswa.map((s) => s.id),
      "H"
    );
    toast.success(`${siswa.length} siswa ditandai Hadir.`);
  };

  const handleClearDay = async () => {
    if (!dayAbsensi || Object.keys(dayAbsensi).length === 0) {
      toast.info("Tidak ada data absensi untuk tanggal ini.");
      return;
    }
    const ok = await confirm({
      message: `Hapus semua absensi tanggal ${tglID(selectedDate)}?`,
      okLabel: "Hapus",
      danger: true,
    });
    if (!ok) return;
    clearAbsensiTanggal(selectedDate);
    toast.info("Absensi tanggal ini dihapus.");
  };

  const handleCetak = async () => {
    if (siswa.length === 0) {
      toast.warning("Tambahkan siswa dulu sebelum mencetak.");
      return;
    }
    try {
      await cetakAbsensi({
        identitas,
        siswa,
        absensi,
        pengesahan: useStore.getState().pengesahan,
        aset: useStore.getState().aset,
        pengaturan: useStore.getState().pengaturan,
        // pass through additional fields expected by AppData type
        jurnal: [],
        komponen: [],
        nilai: {},
        catatan: [],
        meta: useStore.getState().meta,
      } as any, selectedDate);
      toast.success("PDF Absensi berhasil diunduh.");
    } catch (e) {
      console.error(e);
      toast.error("Gagal membuat PDF.");
    }
  };

  // Navigation
  const goToPrevDay = () => setSelectedDate((d) => addDaysISO(d, -1));
  const goToNextDay = () => setSelectedDate((d) => addDaysISO(d, 1));
  const goToToday = () => setSelectedDate(todayISO());

  const weekend = isWeekend(selectedDate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <Badge variant="secondary" className="w-fit">
          Absensi Siswa
        </Badge>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Rekap Kehadiran Harian
        </h1>
        <p className="text-sm text-muted-foreground">
          Tandai kehadiran siswa per tanggal. Statistik bulanan otomatis
          terhitung. Cetak PDF untuk arsip.
        </p>
      </div>

      {/* Date navigator + actions */}
      <Card className="card-fancy">
        <CardHeader className="flex-row items-center justify-between pb-3 gap-2 flex-wrap">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarCheck className="size-4 text-primary" />
            <span>Pilih Tanggal</span>
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="ghost" onClick={handleMarkAllHadir}>
              <CheckCheck className="mr-1 size-4" />
              Tandai Semua Hadir
            </Button>
            <Button size="sm" variant="ghost" onClick={handleClearDay}>
              <Eraser className="mr-1 size-4" />
              Bersihkan Hari Ini
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setPreviewOpen(true)}
            >
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
          <div className="flex flex-wrap items-center gap-3">
            <Button
              size="icon"
              variant="outline"
              onClick={goToPrevDay}
              aria-label="Hari sebelumnya"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value || todayISO())}
              className="w-auto"
            />
            <Button
              size="icon"
              variant="outline"
              onClick={goToNextDay}
              aria-label="Hari berikutnya"
            >
              <ChevronRight className="size-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={goToToday}>
              Hari ini
            </Button>
            <div className="ml-auto flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">
                {getHari(selectedDate)},{" "}
              </span>
              <span className="font-medium">{tglID(selectedDate)}</span>
              {weekend && (
                <Badge variant="outline" className="ml-1 text-amber-600">
                  Akhir pekan
                </Badge>
              )}
            </div>
          </div>

          {/* Stats summary for today */}
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <SummaryPill
              label="Total Siswa"
              value={siswa.length}
              hint="terdaftar"
            />
            {STATUS_LIST.map((s) => (
              <SummaryPill
                key={s.code}
                label={`${s.label} · ${s.fullLabel}`}
                value={stats.counts[s.code]}
                hint={
                  stats.total > 0
                    ? `${Math.round((stats.counts[s.code] / stats.total) * 100)}%`
                    : "—"
                }
                colorDot={s.bgColor}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Empty state */}
      {siswa.length === 0 ? (
        <Card className="card-fancy">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
              <Users className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Belum ada siswa.</p>
              <p className="text-xs text-muted-foreground">
                Tambahkan siswa di tab <strong>Nilai → Daftar Siswa</strong>{" "}
                terlebih dahulu.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="card-fancy">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="size-4 text-primary" />
              Daftar Kehadiran
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-xs text-muted-foreground">
              Klik salah satu tombol (H / S / I / A / B) untuk menandai. Klik
              ulang untuk menghapus.
            </p>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-12 text-center">No</TableHead>
                    <TableHead className="min-w-[180px]">Nama Siswa</TableHead>
                    <TableHead>NISN</TableHead>
                    <TableHead className="text-center">Kehadiran</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {siswa.map((m, i) => {
                    const cur = dayAbsensi[m.id];
                    return (
                      <TableRow key={m.id} className="hover:bg-muted/30">
                        <TableCell className="text-center text-muted-foreground">
                          {i + 1}
                        </TableCell>
                        <TableCell className="font-medium">{m.nama}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {m.nisn || "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-1.5">
                            <TooltipProvider delayDuration={200}>
                              {STATUS_LIST.map((s) => {
                                const active = cur === s.code;
                                return (
                                  <Tooltip key={s.code}>
                                    <TooltipTrigger asChild>
                                      <button
                                        type="button"
                                        onClick={() => handleSetStatus(m.id, s.code)}
                                        className={cn(
                                          "grid size-8 place-items-center rounded-md border text-xs font-bold transition-all",
                                          active
                                            ? cn(s.bgColor, s.color, s.borderColor, "shadow-sm scale-105")
                                            : "border-border bg-background text-muted-foreground hover:bg-accent hover:border-primary/40"
                                        )}
                                        aria-pressed={active}
                                        aria-label={`${s.fullLabel} (${s.code})`}
                                      >
                                        {s.label}
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                      {s.fullLabel}
                                    </TooltipContent>
                                  </Tooltip>
                                );
                              })}
                            </TooltipProvider>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly summary */}
      <Card className="card-fancy">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="size-4 text-primary" />
            Ringkasan Bulan{" "}
            {new Date(selectedDate + "T00:00:00").toLocaleDateString("id-ID", {
              month: "long",
              year: "numeric",
            })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {monthStats.total === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Info className="size-4" />
              Belum ada entri absensi di bulan ini.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {STATUS_LIST.map((s) => {
                const count = monthStats.monthCounts[s.code];
                const pct =
                  monthStats.total > 0
                    ? Math.round((count / monthStats.total) * 100)
                    : 0;
                return (
                  <div
                    key={s.code}
                    className={cn(
                      "rounded-lg border p-3",
                      s.bgColor,
                      s.borderColor
                    )}
                  >
                    <div className={cn("text-xs font-medium", s.color)}>
                      {s.fullLabel} ({s.code})
                    </div>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-2xl font-bold tabular-nums">
                        {count}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        entri · {pct}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <DocPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title={`Pratinjau Absensi — ${tglID(selectedDate)}`}
        onPrintSharp={async () => {
          setPreviewOpen(false);
          await handleCetak();
        }}
        onPrintVisual={async (node) => {
          await cetakSesuaiPratinjau(node, `Absensi-${selectedDate}`);
        }}
      >
        <AbsensiDocument selectedDate={selectedDate} />
      </DocPreviewDialog>
    </div>
  );
}

function SummaryPill({
  label,
  value,
  hint,
  colorDot,
}: {
  label: string;
  value: number;
  hint?: string;
  colorDot?: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {colorDot && (
          <span className={cn("size-2 rounded-full", colorDot)} />
        )}
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="text-xl font-bold tabular-nums">{value}</span>
        {hint && (
          <span className="text-[10px] text-muted-foreground">{hint}</span>
        )}
      </div>
    </div>
  );
}

/* ===================== Document Preview ===================== */

function AbsensiDocument({ selectedDate }: { selectedDate: string }) {
  const siswa = useStore((s) => s.siswa);
  const absensi = useStore((s) => s.absensi);
  const identitas = useStore((s) => s.identitas);

  const dayMap = absensi[selectedDate] || {};
  const counts: Record<AbsensiStatus, number> = { H: 0, S: 0, I: 0, A: 0, B: 0 };
  siswa.forEach((s) => {
    const st = dayMap[s.id];
    if (st) counts[st]++;
  });
  const totalHadir = counts.H;
  const persenHadir =
    siswa.length > 0 ? Math.round((totalHadir / siswa.length) * 100) : 0;

  return (
    <div className="doc-preview">
      <DocKop />
      <div className="doc-title">REKAP ABSENSI SISWA</div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "11px",
          marginBottom: "10px",
        }}
      >
        <span>
          <strong>Hari:</strong> {getHari(selectedDate)}
        </span>
        <span>
          <strong>Tanggal:</strong> {tglID(selectedDate)}
        </span>
        <span>
          <strong>Kelas:</strong> {identitas.kelas || "—"}
        </span>
      </div>
      <table className="data" style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ width: "40px", border: "1px solid #333", padding: "6px", textAlign: "center" }}>No</th>
            <th style={{ border: "1px solid #333", padding: "6px", textAlign: "left" }}>Nama Siswa</th>
            <th style={{ width: "120px", border: "1px solid #333", padding: "6px", textAlign: "center" }}>NISN</th>
            <th style={{ width: "100px", border: "1px solid #333", padding: "6px", textAlign: "center" }}>Kehadiran</th>
            <th style={{ border: "1px solid #333", padding: "6px", textAlign: "left" }}>Keterangan</th>
          </tr>
        </thead>
        <tbody>
          {siswa.length === 0 && (
            <tr>
              <td colSpan={5} style={{ border: "1px solid #333", padding: "12px", textAlign: "center", color: "#999" }}>
                Belum ada siswa terdaftar.
              </td>
            </tr>
          )}
          {siswa.map((m, i) => {
            const st = dayMap[m.id];
            const cfg = st ? STATUS_BY_CODE[st] : null;
            return (
              <tr key={m.id}>
                <td style={{ border: "1px solid #333", padding: "6px", textAlign: "center" }}>{i + 1}</td>
                <td style={{ border: "1px solid #333", padding: "6px" }}>{m.nama}</td>
                <td style={{ border: "1px solid #333", padding: "6px", textAlign: "center" }}>{m.nisn || "—"}</td>
                <td style={{ border: "1px solid #333", padding: "6px", textAlign: "center", fontWeight: "bold" }}>
                  {st || "—"}
                </td>
                <td style={{ border: "1px solid #333", padding: "6px" }}>
                  {cfg ? cfg.fullLabel : "Belum ditandai"}
                </td>
              </tr>
            );
          })}
        </tbody>
        {siswa.length > 0 && (
          <tfoot>
            <tr style={{ fontWeight: "bold" }}>
              <td colSpan={3} style={{ border: "1px solid #333", padding: "6px", textAlign: "right" }}>
                Total Hadir: {totalHadir} dari {siswa.length} ({persenHadir}%)
              </td>
              <td style={{ border: "1px solid #333", padding: "6px", textAlign: "center" }}>H</td>
              <td style={{ border: "1px solid #333", padding: "6px" }}>
                S:{counts.S} I:{counts.I} A:{counts.A} B:{counts.B}
              </td>
            </tr>
          </tfoot>
        )}
      </table>
      <div style={{ marginTop: "8px", fontSize: "10px", color: "#666" }}>
        Keterangan: H = Hadir, S = Sakit, I = Izin, A = Alpa, B = Bolos
      </div>
      <DocPengesahan />
    </div>
  );
}
