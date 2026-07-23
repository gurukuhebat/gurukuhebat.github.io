"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ButtonProps } from "@/components/ui/button";
import { Save, School } from "lucide-react";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import type { Identitas } from "@/lib/types";

interface IdentityFormProps {
  submitLabel?: string;
  onSubmit?: (data: Identitas) => void;
  hideButton?: boolean;
}

export function IdentityForm({
  submitLabel = "Simpan Identitas",
  onSubmit,
  hideButton = false,
}: IdentityFormProps) {
  const identitas = useStore((s) => s.identitas);
  const setIdentitas = useStore((s) => s.setIdentitas);
  const [form, setForm] = React.useState<Identitas>(identitas);

  React.useEffect(() => {
    setForm(identitas);
  }, [identitas]);

  const handleSave = () => {
    if (!form.sekolah.trim()) {
      toast.warning("Nama sekolah wajib diisi.");
      return;
    }
    setIdentitas(form);
    toast.success("Identitas tersimpan.");
    onSubmit?.(form);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="idn-sekolah">
          Nama Institusi / Sekolah <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <School className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="idn-sekolah"
            value={form.sekolah}
            onChange={(e) => setForm((f) => ({ ...f, sekolah: e.target.value }))}
            placeholder="mis. MI Al-Hikmah"
            autoComplete="organization"
            className="pl-9"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="idn-kelas">Kelas / Semester</Label>
          <Input
            id="idn-kelas"
            value={form.kelas}
            onChange={(e) => setForm((f) => ({ ...f, kelas: e.target.value }))}
            placeholder="mis. 4A / Ganjil"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="idn-tahun">Tahun Pelajaran</Label>
          <Input
            id="idn-tahun"
            value={form.tahun}
            onChange={(e) => setForm((f) => ({ ...f, tahun: e.target.value }))}
            placeholder="mis. 2025/2026"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="idn-mapel">Mata Pelajaran (opsional)</Label>
        <Input
          id="idn-mapel"
          value={form.mapel}
          onChange={(e) => setForm((f) => ({ ...f, mapel: e.target.value }))}
          placeholder="mis. Akidah Akhlak"
        />
      </div>

      {!hideButton && (
        <Button onClick={handleSave} className="w-full sm:w-auto">
          <Save className="mr-2 size-4" />
          {submitLabel}
        </Button>
      )}
    </div>
  );
}

// Helper to avoid unused import warning when ButtonProps is exported but not used directly.
export type { ButtonProps };
