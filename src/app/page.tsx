"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ConfirmProvider } from "@/components/shared/confirm-dialog";
import { BerandaView } from "@/components/views/beranda-view";
import { JurnalView } from "@/components/views/jurnal-view";
import { AbsensiView } from "@/components/views/absensi-view";
import { NilaiView } from "@/components/views/nilai-view";
import { PengaturanView } from "@/components/views/pengaturan-view";
import { useStore } from "@/lib/store";

export default function Home() {
  const view = useStore((s) => s.view);
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch — only render after client mount
  React.useEffect(() => setMounted(true), []);

  return (
    <ConfirmProvider>
      <div className="flex min-h-screen flex-col mesh-bg">
        <Header />
        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {mounted ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={view}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                >
                  {view === "beranda" && <BerandaView />}
                  {view === "jurnal" && <JurnalView />}
                  {view === "absensi" && <AbsensiView />}
                  {view === "nilai" && <NilaiView />}
                  {view === "pengaturan" && <PengaturanView />}
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="grid min-h-[50vh] place-items-center">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <p className="text-sm">Memuat Guruku Hebat…</p>
                </div>
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </ConfirmProvider>
  );
}
