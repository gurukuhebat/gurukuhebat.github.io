"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  GraduationCap,
  Settings,
  Home,
  Menu,
  X,
  Cloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { ViewKey } from "@/lib/types";

const NAV: Array<{ key: ViewKey; label: string; icon: React.ElementType }> = [
  { key: "beranda", label: "Beranda", icon: Home },
  { key: "jurnal", label: "Jurnal Harian", icon: BookOpen },
  { key: "nilai", label: "Nilai Siswa", icon: GraduationCap },
  { key: "pengaturan", label: "Pengaturan", icon: Settings },
];

export function Header() {
  const view = useStore((s) => s.view);
  const setView = useStore((s) => s.setView);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleNav = (k: ViewKey) => {
    setView(k);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <button
          onClick={() => handleNav("beranda")}
          className="group flex items-center gap-3"
          aria-label="Beranda Guruku Hebat"
        >
          <div className="relative grid size-10 place-items-center rounded-xl brand-gradient shadow-md shadow-primary/20 transition-transform group-hover:scale-105">
            <GraduationCap className="size-6 text-white" strokeWidth={2.2} />
            <div className="absolute inset-0 rounded-xl ring-1 ring-white/20" />
          </div>
          <div className="hidden flex-col items-start leading-tight sm:flex">
            <span className="text-base font-bold tracking-tight">
              Guruku Hebat
            </span>
            <span className="text-xs text-muted-foreground">
              Jurnal &amp; Nilai Siswa
            </span>
          </div>
        </button>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Navigasi utama">
          {NAV.map(({ key, label, icon: Icon }) => {
            const active = view === key;
            return (
              <button
                key={key}
                onClick={() => handleNav(key)}
                className={cn(
                  "relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                <Icon className="size-4" />
                {label}
                {active && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-1.5">
          <div className="hidden items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success sm:flex">
            <Cloud className="size-3.5" />
            <span>Data lokal</span>
          </div>
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Buka menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile nav drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-border/40 bg-background md:hidden"
            aria-label="Navigasi mobile"
          >
            <div className="grid gap-1 p-3">
              {NAV.map(({ key, label, icon: Icon }) => {
                const active = view === key;
                return (
                  <button
                    key={key}
                    onClick={() => handleNav(key)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-accent"
                    )}
                  >
                    <Icon className="size-4" />
                    {label}
                  </button>
                );
              })}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
