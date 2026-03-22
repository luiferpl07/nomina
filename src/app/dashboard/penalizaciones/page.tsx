"use client";

import { useEffect, useState } from "react";

type Config = {
  porcentajePorDia: number;
  topeMaximo: number;
  bonoPorDia: number;
  topeBonoMaximo: number;
};

export default function PenalizacionesPage() {
  const [config, setConfig] = useState<Config>({
    porcentajePorDia: 2,
    topeMaximo: 20,
    bonoPorDia: 1,
    topeBonoMaximo: 10,
  });
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/config/penalizaciones")
      .then((r) => r.json())
      .then((data) => setConfig(data))
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError("");
    setGuardado(false);

    const res = await fetch("/api/config/penalizaciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
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

  function Campo({
    label,
    descripcion,
    campo,
    min = 1,
    max = 100,
  }: {
    label: string;
    descripcion: string;
    campo: keyof Config;
    min?: number;
    max?: number;
  }) {
    return (
      <div className="flex items-start justify-between gap-8 py-5 border-b border-black/[0.05] last:border-0">
        <div className="flex-1">
          <p className="text-sm font-medium text-[#1a1916]">{label}</p>
          <p className="text-xs text-[#999891] mt-0.5">{descripcion}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <input
            type="number"
            min={min}
            max={max}
            value={config[campo]}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                [campo]: Number(e.target.value),
              }))
            }
            className="w-20 border border-black/[0.12] rounded-[8px] px-3 py-2 text-sm text-[#1a1916] text-center font-mono focus:outline-none focus:border-[#2d5be3] focus:ring-2 focus:ring-[#2d5be3]/10 transition-all"
          />
          <span className="text-sm text-[#999891]">%</span>
        </div>
      </div>
    );
  }

  // Vista previa del cálculo
  const ejemploValor = 1000000;
  const diasRetraso = 5;
  const diasAnticipado = 3;
  const penalizacion = Math.round(
    (ejemploValor *
      Math.min(diasRetraso * config.porcentajePorDia, config.topeMaximo)) /
      100
  );
  const bono = Math.round(
    (ejemploValor *
      Math.min(diasAnticipado * config.bonoPorDia, config.topeBonoMaximo)) /
      100
  );

  return (
    <div className="min-h-screen bg-[#f0ede8]">
      <div className="bg-[#f0ede8] border-b border-black/[0.07] px-8 py-[11px] flex items-center gap-1.5 text-xs text-[#999891]">
        <span className="font-medium text-[#1a1916]">Penalizaciones</span>
      </div>

      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-[20px] font-semibold tracking-[-0.4px] text-[#1a1916]">
            Configuración de penalizaciones
          </h1>
          <p className="text-xs text-[#999891] mt-1">
            Define las reglas que se aplican automáticamente al aprobar entregables
          </p>
        </div>

        <div className="grid grid-cols-[1fr_340px] gap-6 items-start">
          {/* Formulario */}
          <form onSubmit={handleSubmit}>
            <div className="bg-white rounded-xl border border-black/[0.07] overflow-hidden mb-4">
              <div className="px-5 py-[14px] border-b border-black/[0.06] bg-[#fafaf7]">
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#999891]">
                  Penalizaciones por retraso
                </p>
              </div>
              <div className="px-5">
                <Campo
                  label="Porcentaje por día de retraso"
                  descripcion="Se descuenta este % del valor del entregable por cada día de retraso"
                  campo="porcentajePorDia"
                />
                <Campo
                  label="Tope máximo de penalización"
                  descripcion="El descuento nunca superará este % del valor total del entregable"
                  campo="topeMaximo"
                />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-black/[0.07] overflow-hidden mb-4">
              <div className="px-5 py-[14px] border-b border-black/[0.06] bg-[#fafaf7]">
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#999891]">
                  Bonos por entrega anticipada
                </p>
              </div>
              <div className="px-5">
                <Campo
                  label="Bono por día anticipado"
                  descripcion="Se suma este % del valor del entregable por cada día de anticipación"
                  campo="bonoPorDia"
                />
                <Campo
                  label="Tope máximo de bono"
                  descripcion="El bono nunca superará este % del valor total del entregable"
                  campo="topeBonoMaximo"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-[#faeaea] text-[#a02020] text-xs px-4 py-3 rounded-[8px] mb-4">
                <svg width="13" height="13" fill="none" viewBox="0 0 13 13" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="6.5" cy="6.5" r="5.5" /><path d="M6.5 4v3M6.5 9h.01" />
                </svg>
                {error}
              </div>
            )}

            <div className="flex items-center justify-between">
              {guardado && (
                <span className="text-[11px] font-medium text-[#1a7a4a] flex items-center gap-1.5">
                  <svg width="13" height="13" fill="none" viewBox="0 0 13 13" stroke="currentColor" strokeWidth="1.8">
                    <path d="M2 7l3.5 3.5L11 3.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Guardado correctamente
                </span>
              )}
              {!guardado && <span />}
              <button
                type="submit"
                disabled={guardando}
                className="bg-[#1a1916] text-white rounded-[8px] px-5 py-2.5 text-sm font-medium hover:opacity-85 disabled:opacity-40 transition-opacity"
              >
                {guardando ? "Guardando..." : "Guardar cambios →"}
              </button>
            </div>
          </form>

          {/* Vista previa */}
          <div className="bg-white rounded-xl border border-black/[0.07] overflow-hidden sticky top-6">
            <div className="px-5 py-[14px] border-b border-black/[0.06] bg-[#fafaf7]">
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#999891]">
                Vista previa
              </p>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-[#999891]">
                Ejemplo sobre un entregable de{" "}
                <span className="font-mono font-medium text-[#1a1916]">
                  $1.000.000
                </span>
              </p>

              {/* Retraso */}
              <div className="bg-[#fafaf7] rounded-lg p-4 border border-black/[0.05]">
                <p className="text-[11px] uppercase tracking-[0.06em] text-[#999891] mb-3">
                  Con {diasRetraso} días de retraso
                </p>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#6b6a64]">Valor base</span>
                    <span className="font-mono text-[#1a1916]">$1.000.000</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#6b6a64]">
                      Penalización ({Math.min(diasRetraso * config.porcentajePorDia, config.topeMaximo)}%)
                    </span>
                    <span className="font-mono text-[#a02020]">-${penalizacion.toLocaleString("es-CO")}</span>
                  </div>
                  <div className="h-px bg-black/[0.06] my-1" />
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-[#1a1916]">Total a pagar</span>
                    <span className="font-mono text-[#1a1916]">
                      ${(ejemploValor - penalizacion).toLocaleString("es-CO")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Anticipado */}
              <div className="bg-[#fafaf7] rounded-lg p-4 border border-black/[0.05]">
                <p className="text-[11px] uppercase tracking-[0.06em] text-[#999891] mb-3">
                  Con {diasAnticipado} días de anticipación
                </p>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#6b6a64]">Valor base</span>
                    <span className="font-mono text-[#1a1916]">$1.000.000</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#6b6a64]">
                      Bono ({Math.min(diasAnticipado * config.bonoPorDia, config.topeBonoMaximo)}%)
                    </span>
                    <span className="font-mono text-[#1a7a4a]">+${bono.toLocaleString("es-CO")}</span>
                  </div>
                  <div className="h-px bg-black/[0.06] my-1" />
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-[#1a1916]">Total a pagar</span>
                    <span className="font-mono text-[#1a1916]">
                      ${(ejemploValor + bono).toLocaleString("es-CO")}
                    </span>
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