"use client";

import * as React from "react";
import SignaturePad from "signature_pad";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RotateCcw, Trash2 } from "lucide-react";

interface SignaturePadDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title?: string;
  onSave: (dataUrl: string) => void;
  onDelete?: () => void;
  allowDelete?: boolean;
}

const CANVAS_W = 480;
const CANVAS_H = 200;

export function SignaturePadDialog({
  open,
  onOpenChange,
  title = "Bubuhkan Tanda Tangan",
  onSave,
  onDelete,
  allowDelete = false,
}: SignaturePadDialogProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const padRef = React.useRef<SignaturePad | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Wait for dialog to mount canvas properly
    const t = setTimeout(() => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = CANVAS_W * ratio;
      canvas.height = CANVAS_H * ratio;
      canvas.style.width = "100%";
      canvas.style.height = `${CANVAS_H}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(ratio, ratio);

      padRef.current = new SignaturePad(canvas, {
        backgroundColor: "rgba(255,255,255,0)",
        penColor: "#0f172a",
        minWidth: 1.2,
        maxWidth: 3.0,
        velocityFilterWeight: 0.7,
      });
    }, 50);

    return () => {
      clearTimeout(t);
      padRef.current = null;
    };
  }, [open]);

  const handleClear = () => padRef.current?.clear();
  const handleSave = () => {
    const pad = padRef.current;
    if (!pad || pad.isEmpty()) return;
    onSave(pad.toDataURL("image/png"));
    onOpenChange(false);
  };
  const handleDelete = () => {
    onOpenChange(false);
    onDelete?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded-xl border-2 border-dashed border-border bg-muted/30 p-2">
            <canvas
              ref={canvasRef}
              className="block w-full touch-none rounded-lg bg-white"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Gunakan jari (di HP) atau mouse (di komputer) untuk menandatangani di
            area di atas. Tekan tombol Ulangi untuk memulai dari awal.
          </p>
          <Button variant="ghost" size="sm" onClick={handleClear}>
            <RotateCcw className="mr-1.5 size-4" />
            Ulangi
          </Button>
        </div>
        <DialogFooter>
          {allowDelete && (
            <Button variant="destructive" onClick={handleDelete} className="mr-auto">
              <Trash2 className="mr-1.5 size-4" />
              Hapus TTD
            </Button>
          )}
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleSave}>Simpan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
