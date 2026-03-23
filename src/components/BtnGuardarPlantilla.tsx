// src/components/BtnGuardarPlantilla.tsx
"use client";
import { useState } from "react";
import { BookmarkPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface Props {
  contratoId: string;
  tituloDefault: string;
}

export function BtnGuardarPlantilla({ contratoId, tituloDefault }: Props) {
  const [open, setOpen] = useState(false);
  const [titulo, setTitulo] = useState(tituloDefault);
  const [loading, setLoading] = useState(false);
  const [guardado, setGuardado] = useState(false);

  async function guardar() {
    if (!titulo.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/contratos/${contratoId}/guardar-plantilla`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo }),
      });
      if (res.ok) {
        setGuardado(true);
        setTimeout(() => {
          setOpen(false);
          setGuardado(false);
        }, 1200);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-[12px] gap-1.5 border-black/[0.12] hover:border-black/[0.24]"
      >
        <BookmarkPlus size={13} />
        Guardar como plantilla
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-semibold">
              Guardar como plantilla
            </DialogTitle>
            <p className="text-[13px] text-[#6b6a64] mt-0.5">
              Se guardará la estructura del contrato y sus entregables.
              Los plazos se convierten en días relativos.
            </p>
          </DialogHeader>

          <div className="py-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#999891] mb-1.5">
              Nombre de la plantilla
            </p>
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: Consultoría mensual estándar"
              className="text-[13px] border border-black/[0.12] rounded-[8px] focus:border-[#2d5be3] focus:ring-2"
              onKeyDown={(e) => e.key === "Enter" && guardar()}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="text-[13px]"
            >
              Cancelar
            </Button>
            <Button
              onClick={guardar}
              disabled={!titulo.trim() || loading}
              className="bg-[#1a1916] text-white rounded-[8px] hover:opacity-85 text-[13px]"
            >
              {guardado ? "¡Guardada!" : loading ? "Guardando..." : "Guardar plantilla"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}