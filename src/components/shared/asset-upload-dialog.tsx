"use client";

import * as React from "react";
import { Upload, Image as ImageIcon, PenLine, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SignaturePadDialog } from "./signature-pad-dialog";
import { toast } from "sonner";

interface AssetUploadDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  label?: string;
  currentData?: string;
  maxMB?: number;
  allowDelete?: boolean;
  onSave: (dataUrl: string) => void;
  onDelete?: () => void;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

export function AssetUploadDialog({
  open,
  onOpenChange,
  title,
  label,
  currentData,
  maxMB = 2,
  allowDelete = false,
  onSave,
  onDelete,
}: AssetUploadDialogProps) {
  const [tab, setTab] = React.useState<"file" | "draw">("file");
  const [preview, setPreview] = React.useState<string | null>(null);
  const [sigOpen, setSigOpen] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setPreview(null);
      setTab("file");
    }
  }, [open]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\//.test(file.type)) {
      toast.error("File harus berupa gambar.");
      return;
    }
    if (file.size > maxMB * 1024 * 1024) {
      toast.error(`Ukuran gambar melebihi ${maxMB} MB.`);
      return;
    }
    try {
      const url = await readFileAsDataUrl(file);
      setPreview(url);
    } catch {
      toast.error("Gagal membaca file.");
    }
    e.target.value = "";
  };

  const handleSave = () => {
    if (!preview) {
      toast.warning("Belum ada gambar dipilih.");
      return;
    }
    onSave(preview);
    onOpenChange(false);
  };

  const handleDelete = () => {
    onOpenChange(false);
    onDelete?.();
  };

  const display = preview || currentData;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>

          <Tabs value={tab} onValueChange={(v) => setTab(v as "file" | "draw")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="file">
                <Upload className="mr-1.5 size-4" />
                Unggah File
              </TabsTrigger>
              <TabsTrigger value="draw">
                <PenLine className="mr-1.5 size-4" />
                Tanda Tangan Digital
              </TabsTrigger>
            </TabsList>

            <TabsContent value="file" className="mt-4 space-y-3">
              <label
                htmlFor="asset-file-input"
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 p-6 text-center transition-colors hover:border-primary hover:bg-primary/5"
              >
                <div className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
                  <ImageIcon className="size-6" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {label ?? "Pilih gambar"}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Format JPG/PNG/WEBP · maksimal {maxMB} MB · disimpan lokal
                  </p>
                </div>
                <input
                  id="asset-file-input"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleFile}
                />
              </label>
              {display && (
                <div className="flex items-center justify-center rounded-lg border bg-white p-3">
                  <img
                    src={display}
                    alt="Pratinjau"
                    className="max-h-32 object-contain"
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="draw" className="mt-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Tanda tangan langsung di layar dengan jari/mouse, lalu simpan
                sebagai PNG transparan.
              </p>
              <Button variant="secondary" onClick={() => setSigOpen(true)}>
                <PenLine className="mr-1.5 size-4" />
                Buka Kanvas Tanda Tangan
              </Button>
              {preview && (
                <div className="flex items-center justify-center rounded-lg border bg-white p-3">
                  <img
                    src={preview}
                    alt="Tanda tangan"
                    className="max-h-32 object-contain"
                  />
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            {allowDelete && (
              <Button variant="destructive" onClick={handleDelete} className="mr-auto">
                <Trash2 className="mr-1.5 size-4" />
                Hapus
              </Button>
            )}
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={!preview}>
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SignaturePadDialog
        open={sigOpen}
        onOpenChange={setSigOpen}
        title={title}
        onSave={(url) => {
          setPreview(url);
          setTab("file");
          toast.success("Tanda tangan siap disimpan.");
        }}
      />
    </>
  );
}
