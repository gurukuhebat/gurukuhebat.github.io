"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  GraduationCap,
  Settings,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Users,
  Calendar,
  CheckCircle2,
  Award,
  Layers,
  CalendarCheck,
  ClipboardList,
  AlertTriangle,
  Circle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";
import { hitungNilaiAkhir, kategoriNilai } from "@/lib/bobot";
import type { ViewKey } from "@/lib/types";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export function BerandaView() {
  const setView = useStore((s) => s.setView);
  const identitas = useStore((s) => s.identitas);
  const jurnal = useStore((s) => s.jurnal);
  const siswa = useStore((s) => s.siswa);
  const komponen = useStore((s) => s.komponen);
  const nilai = useStore((s) => s.nilai);
  const absensi = useStore((s) => s.absensi);
  const aset = useStore((s) => s.aset);
  const pengesahan = useStore((s) => s.pengesahan);
  const pengaturan = useStore((s) => s.pengaturan);

  // Statistics
  const siswaDenganNilai = siswa.filter((s) => {
    const h = hitungNilaiAkhir(nilai[s.id] || {}, komponen);
    return h.akhir !== null;
  });

  const avgKelas =
    siswaDenganNilai.length > 0
      ? siswaDenganNilai.reduce((sum, s) => {
          const h = hitungNilaiAkhir(nilai[s.id] || {}, komponen);
          return sum + (h.akhir || 0);
        }, 0) / siswaDenganNilai.length
      : null;

  // Chart: distribution of grades by category
  const distribusi = pengaturan.kategori.map((k) => {
    const count = siswaDenganNilai.filter((s) => {
      const h = hitungNilaiAkhir(nilai[s.id] || {}, komponen);
      const kat = kategoriNilai(h.akhir, pengaturan.kategori);
      return kat.label === k.label;
    }).length;
    return { name: k.label, value: count, warna: k.warna };
  });

  // Chart: per-component class average
  const rataPerKomp = komponen
    .map((k) => {
      const angka: number[] = [];
      siswa.forEach((s) => {
        const entri = (nilai[s.id] && nilai[s.id][k.id]) || [];
        const nums = entri
          .map((x) => parseFloat(x as unknown as string))
          .filter((x) => !isNaN(x));
        if (nums.length) angka.push(nums.reduce((a, b) => a + b, 0) / nums.length);
      });
      const rata = angka.length
        ? Math.round((angka.reduce((a, b) => a + b, 0) / angka.length) * 100) / 100
        : 0;
      return { name: k.nama.length > 12 ? k.nama.slice(0, 11) + "…" : k.nama, rata, bobot: k.bobot };
    })
    .filter((d) => d.rata > 0);

  // Absensi stats — count distinct dates with entries
  const absensiHari = Object.keys(absensi).filter((tgl) =>
    Object.keys(absensi[tgl] || {}).length > 0
  ).length;

  // Health check — apa saja yang belum siap untuk cetak PDF
  const healthChecks: Array<{
    label: string;
    ok: boolean;
    hint: string;
    view?: ViewKey;
  }> = [
    {
      label: "Identitas sekolah",
      ok: Boolean(identitas.sekolah && identitas.kelas && identitas.mapel),
      hint: identitas.sekolah ? "Sudah lengkap" : "Isi nama sekolah, kelas, mapel",
      view: "pengaturan",
    },
    {
      label: "Logo sekolah",
      ok: Boolean(aset.logo),
      hint: aset.logo ? "Sudah diunggah" : "Unggah logo di Pengaturan",
      view: "pengaturan",
    },
    {
      label: "Tanda tangan guru",
      ok: Boolean(aset.ttdGuru),
      hint: aset.ttdGuru ? "Sudah diatur" : "Buat TTD digital di Pengaturan",
      view: "pengaturan",
    },
    {
      label: "Data pengesahan",
      ok: Boolean(
        pengesahan.kota &&
          pengesahan.guru.nama &&
          pengesahan.kepsek.nama
      ),
      hint:
        pengesahan.guru.nama && pengesahan.kepsek.nama
          ? "Sudah lengkap"
          : "Isi nama guru & kepsek",
      view: "pengaturan",
    },
    {
      label: "Daftar siswa",
      ok: siswa.length > 0,
      hint: siswa.length > 0 ? `${siswa.length} siswa` : "Tambahkan siswa dulu",
      view: "nilai",
    },
    {
      label: "Komponen & bobot nilai",
      ok: Math.abs(
        komponen.reduce((s, k) => s + (parseFloat(k.bobot as any) || 0), 0) - 100
      ) < 0.01,
      hint:
        Math.abs(
          komponen.reduce((s, k) => s + (parseFloat(k.bobot as any) || 0), 0) - 100
        ) < 0.01
          ? "Total 100%"
          : "Total belum 100%",
      view: "nilai",
    },
    {
      label: "Entri jurnal",
      ok: jurnal.length > 0,
      hint: jurnal.length > 0 ? `${jurnal.length} entri` : "Belum ada jurnal",
      view: "jurnal",
    },
  ];
  const healthOk = healthChecks.filter((c) => c.ok).length;
  const healthTotal = healthChecks.length;
  const healthPct = Math.round((healthOk / healthTotal) * 100);

  const stats = [
    {
      label: "Sekolah",
      value: identitas.sekolah || "belum diisi",
      hint: [identitas.kelas, identitas.tahun].filter(Boolean).join(" · ") || "—",
      icon: Layers,
      big: false,
    },
    {
      label: "Entri Jurnal",
      value: String(jurnal.length),
      hint: "pertemuan tercatat",
      icon: Calendar,
      big: true,
    },
    {
      label: "Siswa",
      value: String(siswa.length),
      hint: `${siswaDenganNilai.length} sudah dinilai`,
      icon: Users,
      big: true,
    },
    {
      label: "Hari Absensi",
      value: String(absensiHari),
      hint: absensiHari > 0 ? "tanggal tercatat" : "mulai di Absensi",
      icon: CalendarCheck,
      big: true,
    },
    {
      label: "Rata-rata Kelas",
      value: avgKelas !== null ? avgKelas.toFixed(1) : "—",
      hint: "dari nilai akhir",
      icon: TrendingUp,
      big: true,
    },
    {
      label: "Logo & TTD",
      value: aset.logo ? "Sudah" : "Belum",
      hint: aset.logo ? "aset siap" : "cek Pengaturan",
      icon: CheckCircle2,
      big: false,
    },
  ];

  const quickSteps: Array<{
    no: number;
    title: string;
    desc: string;
    icon: React.ElementType;
    view: ViewKey;
  }> = [
    {
      no: 1,
      title: "Pengaturan Awal",
      desc: "Identitas sekolah, logo, tanda tangan, pengesahan",
      icon: Settings,
      view: "pengaturan",
    },
    {
      no: 2,
      title: "Jurnal Harian",
      desc: "Isi & cetak jurnal pembelajaran mingguan",
      icon: BookOpen,
      view: "jurnal",
    },
    {
      no: 3,
      title: "Absensi Siswa",
      desc: "Tandai kehadiran harian & rekap bulanan",
      icon: CalendarCheck,
      view: "absensi",
    },
    {
      no: 4,
      title: "Nilai Siswa",
      desc: "Input nilai & rekap otomatis dengan kategori",
      icon: GraduationCap,
      view: "nilai",
    },
  ];

  return (
    <div className="space-y-8">
      {/* HERO */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-br from-primary/95 via-primary to-primary/80 p-8 text-primary-foreground shadow-xl sm:p-12"
      >
        {/* Decorative gradient blobs */}
        <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 size-72 rounded-full bg-emerald-300/20 blur-3xl" />

        <div className="relative max-w-2xl">
          <Badge className="mb-4 border-white/30 bg-white/15 text-primary-foreground backdrop-blur-sm">
            <Sparkles className="mr-1 size-3" />
            Versi 2.0 — React + Next.js
          </Badge>
          <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Selamat datang di Guruku Hebat
          </h1>
          <p className="mt-4 max-w-xl text-pretty text-sm leading-relaxed text-primary-foreground/90 sm:text-base">
            Platform ringan untuk membantu Bapak/Ibu guru mengelola{" "}
            <strong className="font-semibold">jurnal pembelajaran</strong> dan{" "}
            <strong className="font-semibold">rekap nilai siswa</strong> — lengkap
            dengan cetak PDF resmi dan tanda tangan digital.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button
              size="lg"
              variant="secondary"
              onClick={() => setView("jurnal")}
              className="bg-white text-primary hover:bg-white/90"
            >
              <BookOpen className="mr-2 size-4" />
              Buat Jurnal Pembelajaran
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setView("nilai")}
              className="border-white/40 bg-white/10 text-primary-foreground backdrop-blur-sm hover:bg-white/20 hover:text-primary-foreground"
            >
              <GraduationCap className="mr-2 size-4" />
              Input Nilai Siswa
            </Button>
          </div>
        </div>
      </motion.section>

      {/* STATS GRID */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            custom={i}
            variants={fadeUp}
            initial="hidden"
            animate="show"
          >
            <Card className="card-fancy h-full">
              <CardContent className="flex h-full flex-col justify-between p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {s.label}
                  </span>
                  <div className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
                    <s.icon className="size-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div
                    className={
                      s.big
                        ? "text-2xl font-bold tracking-tight"
                        : "text-base font-semibold leading-tight"
                    }
                  >
                    {s.value}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{s.hint}</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </section>

      {/* CHARTS — only when there's grade data */}
      {siswaDenganNilai.length > 0 && (
        <section className="grid gap-4 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="card-fancy h-full">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Award className="size-4 text-primary" />
                  Distribusi Kategori Capaian
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={distribusi}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={2}
                    >
                      {distribusi.map((d) => (
                        <Cell key={d.name} fill={d.warna} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: number) => [`${v} siswa`, "Jumlah"]}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid var(--border)",
                        background: "var(--popover)",
                        color: "var(--popover-foreground)",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {rataPerKomp.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
            >
              <Card className="card-fancy h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="size-4 text-primary" />
                    Rata-rata Kelas per Komponen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={rataPerKomp} margin={{ left: -16, right: 8 }}>
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11 }}
                        interval={0}
                        angle={-15}
                        textAnchor="end"
                        height={50}
                      />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <Tooltip
                        formatter={(v: number) => [v, "Rata-rata"]}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid var(--border)",
                          background: "var(--popover)",
                          color: "var(--popover-foreground)",
                        }}
                      />
                      <Bar dataKey="rata" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </section>
      )}

      {/* HEALTH CHECK WIDGET */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="card-fancy">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <ClipboardList className="size-5 text-primary" />
                Siap Cetak?
              </span>
              <Badge
                variant="outline"
                className={
                  healthPct === 100
                    ? "border-success/40 bg-success/10 text-success"
                    : healthPct >= 60
                      ? "border-warning/40 bg-warning/10 text-warning"
                      : "border-destructive/40 bg-destructive/10 text-destructive"
                }
              >
                {healthOk}/{healthTotal} siap · {healthPct}%
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {healthChecks.map((c) => (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => c.view && setView(c.view)}
                  className="group flex items-start gap-2.5 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-primary/40 hover:bg-accent/30"
                >
                  {c.ok ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                  ) : (
                    <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground/40" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium">{c.label}</span>
                      {!c.ok && c.view && (
                        <ArrowRight className="size-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      )}
                    </div>
                    <p
                      className={`text-xs ${
                        c.ok ? "text-muted-foreground" : "text-warning"
                      }`}
                    >
                      {c.hint}
                    </p>
                  </div>
                </button>
              ))}
            </div>
            {healthPct < 100 && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-warning/5 p-3 text-xs text-warning">
                <AlertTriangle className="size-4 shrink-0" />
                <span>
                  Lengkapi item yang belum tercentang agar dokumen yang dicetak
                  tampil sempurna dengan kop, TTD, dan pengesahan.
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.section>

      {/* QUICK START STEPS */}
      <section>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="card-fancy">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="size-5 text-primary" />
                Mulai dari mana?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {quickSteps.map((step, i) => (
                  <motion.button
                    key={step.no}
                    custom={i}
                    variants={fadeUp}
                    initial="hidden"
                    animate="show"
                    onClick={() => setView(step.view)}
                    className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 text-left transition-all hover:border-primary/40 hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                        <step.icon className="size-5" />
                      </div>
                      <span className="text-3xl font-bold text-muted-foreground/30 transition-colors group-hover:text-primary/30">
                        {step.no}
                      </span>
                    </div>
                    <h3 className="mt-3 font-semibold">{step.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{step.desc}</p>
                    <div className="mt-3 flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                      Buka <ArrowRight className="size-3" />
                    </div>
                  </motion.button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* TIP CARD */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card className="border-info/30 bg-info/5">
          <CardContent className="flex items-start gap-3 p-5">
            <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-info/15 text-info">
              <Sparkles className="size-4" />
            </div>
            <div>
              <p className="text-sm font-medium">Catatan</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Semua data disimpan di perangkat ini (peramban). Gunakan tombol{" "}
                <strong>Export</strong> di tiap fitur untuk membuat cadangan, dan{" "}
                <strong>Pengaturan → Backup</strong> untuk memindahkan data ke
                perangkat lain.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
