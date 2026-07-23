"use client";

import { Heart, Info } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/40 bg-card/40 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Guruku Hebat</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Berjalan sepenuhnya di peramban Anda. Semua data tersimpan lokal
              di perangkat ini — aman, privat, dan bisa diakses offline.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Tips</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Gunakan <strong>Pengaturan</strong> untuk mengunggah logo sekolah
              &amp; tanda tangan, lalu cetak/PDF dokumen resmi dari halaman{" "}
              <strong>Jurnal</strong> atau <strong>Nilai</strong>.
            </p>
          </div>

          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-start gap-2">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              <span>
                Backup berkala via{" "}
                <strong className="font-medium text-foreground">
                  Pengaturan → Backup Data
                </strong>{" "}
                untuk pindah perangkat.
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 border-t border-border/40 pt-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            Dibuat dengan <Heart className="inline size-3 fill-destructive text-destructive" />{" "}
            oleh <strong className="font-medium text-foreground">Nugraha Nastya</strong> di
            Semarang, 2026.
          </p>
          <p className="max-w-xl text-pretty sm:text-right">
            <em>
              Special thanks to{" "}
              <strong className="font-medium text-foreground">
                Farid Muslichul Umam S.Pd.
              </strong>{" "}
              selaku teman guru di Semarang — web ini dibuat untuknya, dan untuk
              semua guru di luar sana yang membutuhkan.
            </em>
          </p>
        </div>
      </div>
    </footer>
  );
}
