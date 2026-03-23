// src/components/ModalRubrica.tsx
"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";

interface Props {
  open: boolean;
  entregableNombre: string;
  onConfirm: (rubrica: {
    completitud: number;
    puntualidad: number;
    calidad: number;
    comentario: string;
  }) => Promise<void>;
  onCancel: () => void;
}

const criterios = [
  {
    key: "completitud" as const,
    label: "Completitud",
    desc: "¿El entregable cumple todo lo solicitado?",
  },
  {
    key: "puntualidad" as const,
    label: "Puntualidad",
    desc: "¿Se entregó dentro del plazo acordado?",
  },
  {
    key: "calidad" as const,
    label: "Calidad",
    desc: "¿El trabajo tiene la calidad esperada?",
  },
];

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            size={22}
            className={
              star <= (hover || value)
                ? "fill-amber-400 stroke-amber-400"
                : "stroke-black/20 fill-transparent"
            }
          />
        </button>
      ))}
    </div>
  );
}

export function ModalRubrica({ open, entregableNombre, onConfirm, onCancel }: Props) {
  const [valores, setValores] = useState({ completitud: 0, puntualidad: 0, calidad: 0 });
  const [comentario, setComentario] = useState("");
  const [loading, setLoading] = useState(false);

  const todoCalificado = Object.values(valores).every((v) => v > 0);

  const handleConfirm = async () => {
    if (!todoCalificado) return;
    setLoading(true);
    try {
      await onConfirm({ ...valores, comentario });
    } finally {
      setLoading(false);
    }
  };

  const promedio =
    todoCalificado
      ? ((valores.completitud + valores.puntualidad + valores.calidad) / 3).toFixed(1)
      : null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[15px] font-semibold">
            Evaluar entregable
          </DialogTitle>
          <p className="text-[13px] text-[#6b6a64] mt-0.5">{entregableNombre}</p>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {criterios.map(({ key, label, desc }) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <div>
                  <p className="text-[13px] font-medium text-[#1a1916]">{label}</p>
                  <p className="text-[11px] text-[#999891]">{desc}</p>
                </div>
                {valores[key] > 0 && (
                  <span className="text-[12px] font-mono font-medium text-[#2d5be3]">
                    {valores[key]}/5
                  </span>
                )}
              </div>
              <StarRating
                value={valores[key]}
                onChange={(v) => setValores((p) => ({ ...p, [key]: v }))}
              />
            </div>
          ))}

          {promedio && (
            <div className="bg-[#f0ede8] rounded-lg px-4 py-3 flex items-center justify-between">
              <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#999891]">
                Promedio general
              </span>
              <span className="font-mono text-[17px] font-medium tracking-[-0.5px] text-[#1a7a4a]">
                {promedio} / 5
              </span>
            </div>
          )}

          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#999891] mb-1.5">
              Comentario (opcional)
            </p>
            <Textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Observaciones sobre el entregable..."
              className="text-[13px] resize-none h-20 border border-black/[0.12] rounded-[8px] focus:border-[#2d5be3] focus:ring-2"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="text-[13px]"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!todoCalificado || loading}
            className="bg-[#1a1916] text-white rounded-[8px] hover:opacity-85 text-[13px]"
          >
            {loading ? "Aprobando..." : "Aprobar entregable"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}