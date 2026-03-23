// src/components/PlantillasClient.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2, Copy, ChevronDown, ChevronUp, FileText } from "lucide-react";

interface EntregablePlantilla {
  nombre: string;
  descripcion: string;
  valor: number;
  diasPlazo: number;
}

interface Plantilla {
  id: string;
  titulo: string;
  descripcion: string | null;
  valorSugerido: number | null;
  entregables: EntregablePlantilla[];
  creadoEn: string;
}

interface Props {
  plantillas: Plantilla[];
  isAdmin: boolean;
}

function formatCOP(v: number) {
  return `$${v.toLocaleString("es-CO")}`;
}

function formatFecha(d: string) {
  return new Date(d).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function PlantillasClient({ plantillas: initial, isAdmin }: Props) {
  const router = useRouter();
  const [plantillas, setPlantillas] = useState(initial);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [eliminando, setEliminando] = useState<string | null>(null);

  async function eliminar(id: string) {
    if (!confirm("¿Eliminar esta plantilla?")) return;
    setEliminando(id);
    try {
      await fetch(`/api/plantillas/${id}`, { method: "DELETE" });
      setPlantillas((p) => p.filter((x) => x.id !== id));
    } finally {
      setEliminando(null);
    }
  }

  function usarPlantilla(plantilla: Plantilla) {
    // Guarda en sessionStorage y navega al formulario de nuevo contrato
    sessionStorage.setItem("plantilla_activa", JSON.stringify(plantilla));
    router.push("/dashboard/contratos/nuevo?plantilla=1");
  }

  if (plantillas.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-black/[0.07] p-16 text-center">
        <FileText size={32} className="mx-auto mb-3 text-black/20" />
        <p className="text-[14px] font-medium text-[#1a1916] mb-1">
          No hay plantillas guardadas
        </p>
        <p className="text-[13px] text-[#6b6a64]">
          Abre un contrato existente y usa "Guardar como plantilla" para reutilizarlo.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {plantillas.map((p) => {
        const abierto = expandido === p.id;
        const totalEntregables = p.entregables.length;
        const sumaValores = p.entregables.reduce((s, e) => s + e.valor, 0);

        return (
          <div
            key={p.id}
            className="bg-white rounded-xl border border-black/[0.07] hover:border-black/[0.18] transition-all"
          >
            {/* Header */}
            <div className="px-5 py-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-[#1a1916] truncate">
                  {p.titulo}
                </p>
                {p.descripcion && (
                  <p className="text-[12px] text-[#6b6a64] truncate mt-0.5">
                    {p.descripcion}
                  </p>
                )}
              </div>

              {/* Stats */}
              <div className="hidden sm:flex items-center gap-5 shrink-0">
                <div className="text-right">
                  <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#999891]">
                    Valor
                  </p>
                  <p className="font-mono text-[14px] font-medium tracking-[-0.5px] text-[#1a1916]">
                    {p.valorSugerido ? formatCOP(p.valorSugerido) : formatCOP(sumaValores)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#999891]">
                    Entregables
                  </p>
                  <p className="font-mono text-[14px] font-medium tracking-[-0.5px] text-[#1a1916]">
                    {totalEntregables}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#999891]">
                    Creada
                  </p>
                  <p className="text-[12px] text-[#6b6a64]">{formatFecha(p.creadoEn)}</p>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  onClick={() => usarPlantilla(p)}
                  size="sm"
                  className="bg-[#1a1916] text-white rounded-[8px] hover:opacity-85 text-[12px] gap-1.5"
                >
                  <Copy size={13} />
                  Usar plantilla
                </Button>
                {isAdmin && (
                  <button
                    onClick={() => eliminar(p.id)}
                    disabled={eliminando === p.id}
                    className="p-2 rounded-[8px] text-[#999891] hover:text-[#a02020] hover:bg-[#faeaea] transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
                <button
                  onClick={() => setExpandido(abierto ? null : p.id)}
                  className="p-2 rounded-[8px] text-[#999891] hover:bg-black/[0.04] transition-colors"
                >
                  {abierto ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>
            </div>

            {/* Entregables expandidos */}
            {abierto && (
              <div className="border-t border-black/[0.05] bg-[#fafaf7] rounded-b-xl px-5 py-4">
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#999891] mb-3">
                  Entregables
                </p>
                <div className="space-y-2">
                  {p.entregables.map((e, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2 border-b border-black/[0.04] last:border-0"
                    >
                      <div>
                        <p className="text-[13px] font-medium text-[#1a1916]">{e.nombre}</p>
                        {e.descripcion && (
                          <p className="text-[11px] text-[#999891]">{e.descripcion}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-black/[0.05] text-[#6b6a64]">
                          {e.diasPlazo} días
                        </span>
                        <span className="font-mono text-[13px] font-medium text-[#1a1916]">
                          {formatCOP(e.valor)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}