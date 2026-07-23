"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, FileText, Image as ImageIcon, Printer } from "lucide-react";
import { toast } from "sonner";

interface DocPreviewDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  // The doc HTML is rendered via a ref-passed React node so we can capture it
  children: React.ReactNode;
  onPrintSharp?: () => Promise<void> | void;
  onPrintVisual?: (node: HTMLElement) => Promise<void> | void;
  fileName?: string;
}

export function DocPreviewDialog({
  open,
  onOpenChange,
  title,
  children,
  onPrintSharp,
  onPrintVisual,
  fileName = "Dokumen",
}: DocPreviewDialogProps) {
  const docRef = React.useRef<HTMLDivElement | null>(null);
  const [busy, setBusy] = React.useState<"sharp" | "visual" | null>(null);

  const handleSharp = async () => {
    if (!onPrintSharp) return;
    setBusy("sharp");
    try {
      await onPrintSharp();
    } catch (e) {
      console.error(e);
      toast.error("Gagal membuat PDF.");
    } finally {
      setBusy(null);
    }
  };

  const handleVisual = async () => {
    if (!onPrintVisual || !docRef.current) return;
    setBusy("visual");
    try {
      await onPrintVisual(docRef.current);
      toast.warning(
        "PDF ini berupa gambar (teks tidak bisa diseleksi, ukuran file lebih besar)."
      );
    } catch (e) {
      console.error(e);
      toast.error("Gagal membuat PDF pratinjau.");
    } finally {
      setBusy(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-hidden sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="size-5 text-primary" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto rounded-lg border bg-muted/20 p-3" style={{ maxHeight: "70vh" }}>
          <div ref={docRef} className="print-area">
            {children}
          </div>
        </div>

        <DialogFooter className="flex-wrap gap-2 sm:flex-nowrap">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-1.5 size-4" />
            Cetak
          </Button>
          {onPrintVisual && (
            <Button
              variant="secondary"
              onClick={handleVisual}
              disabled={busy !== null}
            >
              <ImageIcon className="mr-1.5 size-4" />
              {busy === "visual" ? "Memproses..." : "PDF Sesuai Pratinjau"}
            </Button>
          )}
          {onPrintSharp && (
            <Button onClick={handleSharp} disabled={busy !== null}>
              <FileText className="mr-1.5 size-4" />
              {busy === "sharp" ? "Memproses..." : "Cetak / PDF (Tajam)"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Avoid unused var warning if fileName is provided but not used in this minimal version
void (undefined as unknown as string);
