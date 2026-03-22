"use client";

import { useEffect, useState } from "react";

interface Contratista {
  id: string;
  nombre: string;
  email: string;
  ivaResponsable: boolean;
}

export default function IvaPage() {
  const [contratistas, setContratistas] = useState<Contratista[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/config/iva")
      .then((r) => r.json())
      .then((data) => { setContratistas(data); setCargando(false); })
      .catch(() => setCargando(false));
  }, []);

  async function toggleIva(id: string, valor: boolean) {
    setGuardando(id);

    const res = await fetch("/api/config/iva", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contratistaId: id, ivaResponsable: valor }),
    });

    if (res.ok) {
      setContratistas((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ivaResponsable: valor } : c))
      );
    }
    setGuardando(null);
  }

  return (
    <div className="min-h-screen bg-[#f0ede8]">
      <div className="bg-[#f0ede8] border-b border-black/[0.07] px-8 py-[11px] flex items-center gap-1.5 text-xs text-[#999891]">
        <span className="font-medium text-[#1a1916]">IVA en honorarios</span>
      </div>

      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-[20px] font-semibold tracking-[-0.4px] text-[#1a1916]">
            IVA en honorarios
          </h1>
          <p className="text-xs text-[#999891] mt-1">
            Activa el IVA (19%) para los contratistas que son responsables del régimen común
          </p>
        </div>

        <div className="grid grid-cols-[1fr_300px] gap-6 items-start">
          {/* Lista de contratistas */}
          <div className="bg-white rounded-xl border border-black/[0.07] overflow-hidden">
            <div className="px-5 py-[14px] border-b border-black/[0.06] bg-[#fafaf7]">
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#999891]">
                Contratistas
              </p>
            </div>

            {cargando ? (
              <div className="p-8 text-center text-xs text-[#999891]">
                Cargando...
              </div>
            ) : contratistas.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#999891]">
                No hay contratistas registrados
              </div>
            ) : (
              <div className="divide-y divide-black/[0.04]">
                {contratistas.map((c) => (
                  <div
                    key={c.id}
                    className="px-5 py-4 flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#1a1916]">{c.nombre}</p>
                      <p className="text-xs text-[#999891] mt-0.5">{c.email}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {c.ivaResponsable && (
                        <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#e6f5ed] text-[#1a7a4a]">
                          IVA 19%
                        </span>
                      )}
                      <button
                        onClick={() => toggleIva(c.id, !c.ivaResponsable)}
                        disabled={guardando === c.id}
                        className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
                          c.ivaResponsable ? "bg-[#1a1916]" : "bg-black/[0.12]"
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                            c.ivaResponsable ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Panel informativo */}
          <div className="space-y-3">
            <div className="bg-white rounded-xl border border-black/[0.07] overflow-hidden">
              <div className="px-5 py-[14px] border-b border-black/[0.06] bg-[#fafaf7]">
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#999891]">
                  Cómo funciona
                </p>
              </div>
              <div className="p-5 space-y-3 text-xs text-[#6b6a64] leading-relaxed">
                <p>
                  Cuando un contratista tiene IVA activo, se agrega un <strong className="text-[#1a1916]">19%</strong> sobre el valor de cada entregable aprobado.
                </p>
                <p>
                  El IVA se suma al pago que recibe el contratista. La retención en la fuente se sigue calculando sobre el valor base sin IVA.
                </p>
                <div className="bg-[#fafaf7] rounded-lg p-4 border border-black/[0.05] space-y-1.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#999891] mb-2">Ejemplo</p>
                  <div className="flex justify-between">
                    <span>Valor entregable</span>
                    <span className="font-mono text-[#1a1916]">$2.000.000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IVA (19%)</span>
                    <span className="font-mono text-[#1a7a4a]">+$380.000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Retención (6%)</span>
                    <span className="font-mono text-[#92600a]">-$120.000</span>
                  </div>
                  <div className="h-px bg-black/[0.06] my-1" />
                  <div className="flex justify-between font-medium text-[#1a1916]">
                    <span>Neto contratista</span>
                    <span className="font-mono">$2.260.000</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}