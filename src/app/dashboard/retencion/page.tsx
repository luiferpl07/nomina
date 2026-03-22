"use client";

import { useEffect, useState } from "react";

interface Tarifa {
  desde: number | string;
  hasta: number | string | null;
  porcentaje: number | string;
}

const DIAN_DEFAULT: Tarifa[] = [
  { desde: 0,       hasta: 1133000,  porcentaje: 0  },
  { desde: 1133000, hasta: 2953000,  porcentaje: 4  },
  { desde: 2953000, hasta: 4789000,  porcentaje: 6  },
  { desde: 4789000, hasta: null,     porcentaje: 11 },
];

export default function RetencionPage() {
  const [tarifas, setTarifas] = useState<Tarifa[]>(DIAN_DEFAULT);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/config/retencion")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setTarifas(data);
      })
      .catch(() => {});
  }, []);

  function actualizar(i: number, campo: keyof Tarifa, valor: string) {
    const nuevas = [...tarifas];
    nuevas[i] = {
      ...nuevas[i],
      [campo]: campo === "hasta" && valor === "" ? null : valor,
    };
    setTarifas(nuevas);
  }

  function agregar() {
    const ultima = tarifas[tarifas.length - 1];
    const nuevoDesde = ultima?.hasta ? Number(ultima.hasta) : 0;
    setTarifas([...tarifas, { desde: nuevoDesde, hasta: null, porcentaje: 0 }]);
  }

  function eliminar(i: number) {
    if (tarifas.length <= 1) return;
    setTarifas(tarifas.filter((_, idx) => idx !== i));
  }

  function restaurarDIAN() {
    setTarifas(DIAN_DEFAULT);
  }

  async function guardar() {
    setGuardando(true);
    setError("");
    setGuardado(false);

    const res = await fetch("/api/config/retencion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tarifas }),
    });

    if (res.ok) {
      setGuardado(true);
      setTimeout(() => setGuardado(false), 3000);
    } else {
      const data = await res.json();
      setError(data.error ?? "Error al guardar");
    }
    setGuardando(false);
  }

  // Preview: calcula qué tarifa aplica para un valor de ejemplo
  const ejemploValor = 5000000;
  const tarifaEjemplo = tarifas.find((t) => {
    const desde = Number(t.desde);
    const hasta = t.hasta !== null && t.hasta !== "" ? Number(t.hasta) : null;
    return ejemploValor >= desde && (hasta === null || ejemploValor < hasta);
  });

  const inputClass =
    "w-full border border-black/[0.12] rounded-[8px] px-3 py-2 text-sm text-[#1a1916] font-mono placeholder:text-[#bbb9b0] focus:outline-none focus:border-[#2d5be3] focus:ring-2 focus:ring-[#2d5be3]/10 transition-all bg-white";

  return (
    <div className="min-h-screen bg-[#f0ede8]">
      <div className="bg-[#f0ede8] border-b border-black/[0.07] px-8 py-[11px] flex items-center gap-1.5 text-xs text-[#999891]">
        <span className="font-medium text-[#1a1916]">Retención en la fuente</span>
      </div>

      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-[20px] font-semibold tracking-[-0.4px] text-[#1a1916]">
            Tarifas de retención
          </h1>
          <p className="text-xs text-[#999891] mt-1">
            Define los rangos y porcentajes según la tabla DIAN vigente para honorarios
          </p>
        </div>

        <div className="grid grid-cols-[1fr_300px] gap-6 items-start">
          {/* Tabla de tarifas */}
          <div className="space-y-3">
            {/* Header */}
            <div className="grid grid-cols-[1fr_1fr_80px_32px] gap-3 px-1">
              <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#999891]">
                Desde ($)
              </p>
              <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#999891]">
                Hasta ($) — vacío = sin límite
              </p>
              <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#999891]">
                Tarifa
              </p>
              <span />
            </div>

            {tarifas.map((t, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-black/[0.07] px-4 py-3 grid grid-cols-[1fr_1fr_80px_32px] gap-3 items-center"
              >
                <input
                  type="number"
                  value={t.desde}
                  onChange={(e) => actualizar(i, "desde", e.target.value)}
                  className={inputClass}
                  placeholder="0"
                  min={0}
                />
                <input
                  type="number"
                  value={t.hasta ?? ""}
                  onChange={(e) => actualizar(i, "hasta", e.target.value)}
                  className={inputClass}
                  placeholder="Sin límite"
                  min={0}
                />
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={t.porcentaje}
                    onChange={(e) => actualizar(i, "porcentaje", e.target.value)}
                    className={inputClass}
                    placeholder="0"
                    min={0}
                    max={100}
                  />
                  <span className="text-sm text-[#999891] flex-shrink-0">%</span>
                </div>
                <button
                  type="button"
                  onClick={() => eliminar(i)}
                  disabled={tarifas.length <= 1}
                  className="w-8 h-8 rounded-[6px] flex items-center justify-center text-[#bbb9b0] hover:text-[#a02020] hover:bg-[#faeaea] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg width="13" height="13" fill="none" viewBox="0 0 13 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M2 2l9 9M11 2l-9 9" />
                  </svg>
                </button>
              </div>
            ))}

            {/* Acciones */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={agregar}
                  className="text-[12px] font-medium text-[#2d5be3] hover:opacity-70 transition-opacity flex items-center gap-1.5"
                >
                  <svg width="12" height="12" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="2">
                    <path d="M6 1v10M1 6h10" />
                  </svg>
                  Agregar rango
                </button>
                <button
                  type="button"
                  onClick={restaurarDIAN}
                  className="text-[12px] text-[#999891] hover:text-[#1a1916] transition-colors"
                >
                  Restaurar tabla DIAN 2025
                </button>
              </div>
              <div className="flex items-center gap-3">
                {guardado && (
                  <span className="text-[11px] font-medium text-[#1a7a4a] flex items-center gap-1.5">
                    <svg width="13" height="13" fill="none" viewBox="0 0 13 13" stroke="currentColor" strokeWidth="1.8">
                      <path d="M2 7l3.5 3.5L11 3.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Guardado
                  </span>
                )}
                {error && (
                  <span className="text-[11px] text-[#a02020]">{error}</span>
                )}
                <button
                  onClick={guardar}
                  disabled={guardando}
                  className="bg-[#1a1916] text-white rounded-[8px] px-5 py-2.5 text-sm font-medium hover:opacity-85 disabled:opacity-40 transition-opacity"
                >
                  {guardando ? "Guardando..." : "Guardar cambios →"}
                </button>
              </div>
            </div>
          </div>

          {/* Panel de ayuda */}
          <div className="space-y-3">
            {/* Vista previa */}
            <div className="bg-white rounded-xl border border-black/[0.07] overflow-hidden">
              <div className="px-5 py-[14px] border-b border-black/[0.06] bg-[#fafaf7]">
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#999891]">
                  Vista previa
                </p>
              </div>
              <div className="p-5">
                <p className="text-xs text-[#999891] mb-3">
                  Contrato de{" "}
                  <span className="font-mono font-medium text-[#1a1916]">
                    ${ejemploValor.toLocaleString("es-CO")}
                  </span>
                </p>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#6b6a64]">Tarifa aplicada</span>
                    <span className="font-mono font-medium text-[#92600a]">
                      {tarifaEjemplo ? `${tarifaEjemplo.porcentaje}%` : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#6b6a64]">Retención estimada</span>
                    <span className="font-mono font-medium text-[#a02020]">
                      -${tarifaEjemplo
                        ? Math.round((ejemploValor * Number(tarifaEjemplo.porcentaje)) / 100).toLocaleString("es-CO")
                        : "0"}
                    </span>
                  </div>
                  <div className="h-px bg-black/[0.06] my-1" />
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-[#1a1916]">Neto contratista</span>
                    <span className="font-mono text-[#1a7a4a]">
                      ${tarifaEjemplo
                        ? (ejemploValor - Math.round((ejemploValor * Number(tarifaEjemplo.porcentaje)) / 100)).toLocaleString("es-CO")
                        : ejemploValor.toLocaleString("es-CO")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Nota informativa */}
            <div className="bg-white rounded-xl border border-black/[0.07] p-5">
              <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#999891] mb-3">
                Tabla DIAN 2025
              </p>
              <div className="space-y-2">
                {DIAN_DEFAULT.map((t, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-[#6b6a64]">
                      {t.hasta
                        ? `$${Number(t.desde).toLocaleString("es-CO")} – $${Number(t.hasta).toLocaleString("es-CO")}`
                        : `Más de $${Number(t.desde).toLocaleString("es-CO")}`}
                    </span>
                    <span className={`font-mono font-medium ${Number(t.porcentaje) === 0 ? "text-[#1a7a4a]" : "text-[#92600a]"}`}>
                      {t.porcentaje}%
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-[#bbb9b0] mt-3">
                Honorarios y servicios. Actualizar cuando la DIAN publique nueva tabla.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}