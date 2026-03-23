"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePlantillaActiva } from "@/hooks/usePlantillaActiva";

interface Entregable {
  nombre: string;
  descripcion: string;
  valor: string;
  fechaLimite: string;
}

interface Tarifa {
  desde: number;
  hasta: number | null;
  porcentaje: number;
}

export default function NuevoContratoForm({
  contratistas,
}: {
  contratistas: any[];
}) {
  const router = useRouter();
  const plantilla = usePlantillaActiva();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [tarifas, setTarifas] = useState<Tarifa[]>([]);
  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    valorTotal: "",
    fechaInicio: "",
    fechaFin: "",
    contratistaId: "",
  });
  const [entregables, setEntregables] = useState<Entregable[]>([
    { nombre: "", descripcion: "", valor: "", fechaLimite: "" },
  ]);

  // Cargar tarifas de retención para mostrar preview
  useEffect(() => {
    fetch("/api/config/retencion")
      .then((r) => r.json())
      .then((data) => setTarifas(data))
      .catch(() => {});
  }, []);

  // Precargar desde plantilla si viene con ?plantilla=1
  useEffect(() => {
    if (!plantilla) return;
    setForm((f) => ({
      ...f,
      titulo: plantilla.titulo,
      descripcion: plantilla.descripcion ?? "",
      valorTotal: plantilla.valorSugerido ? String(plantilla.valorSugerido) : "",
    }));
    const hoy = new Date();
    setEntregables(
      plantilla.entregables.map((e) => ({
        nombre: e.nombre,
        descripcion: e.descripcion ?? "",
        valor: String(e.valor),
        fechaLimite: new Date(hoy.getTime() + e.diasPlazo * 86400000)
          .toISOString()
          .slice(0, 10),
      }))
    );
  }, [plantilla]);

  function calcularRetencionPreview(valor: number): number {
    if (!valor || tarifas.length === 0) return 0;
    for (const t of tarifas) {
      if (valor >= t.desde && (t.hasta === null || valor < t.hasta)) {
        return t.porcentaje;
      }
    }
    return 0;
  }

  function agregarEntregable() {
    setEntregables([
      ...entregables,
      { nombre: "", descripcion: "", valor: "", fechaLimite: "" },
    ]);
  }

  function eliminarEntregable(i: number) {
    setEntregables(entregables.filter((_, idx) => idx !== i));
  }

  function actualizarEntregable(i: number, campo: string, valor: string) {
    const nuevos = [...entregables];
    nuevos[i] = { ...nuevos[i], [campo]: valor };
    setEntregables(nuevos);
  }

  const totalEntregables = entregables.reduce(
    (sum, e) => sum + (Number(e.valor) || 0),
    0
  );
  const valorTotal = Number(form.valorTotal) || 0;
  const diferencia = valorTotal - totalEntregables;
  const retencionPct = calcularRetencionPreview(valorTotal);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (diferencia !== 0) {
      setError(
        `La suma de entregables ($${totalEntregables.toLocaleString("es-CO")}) debe ser igual al valor total ($${valorTotal.toLocaleString("es-CO")})`
      );
      return;
    }
    setCargando(true);
    setError("");

    const res = await fetch("/api/contratos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, entregables }),
    });

    if (!res.ok) {
      setError("Error al crear el contrato");
      setCargando(false);
      return;
    }

    router.push("/dashboard/contratos");
    router.refresh();
  }

  const inputClass =
    "w-full border border-black/[0.12] rounded-[8px] px-3 py-2 text-sm text-[#1a1916] placeholder:text-[#bbb9b0] focus:outline-none focus:border-[#2d5be3] focus:ring-2 focus:ring-[#2d5be3]/10 transition-all bg-white";
  const labelClass =
    "text-[11px] font-medium uppercase tracking-[0.06em] text-[#6b6a64] block mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Banner plantilla activa */}
      {plantilla && (
        <div className="flex items-center gap-2 bg-[#e6f5ed] text-[#1a7a4a] text-[12px] font-medium px-4 py-2.5 rounded-[8px]">
          <svg width="13" height="13" fill="none" viewBox="0 0 13 13" stroke="currentColor" strokeWidth="2">
            <path d="M2 7l3 3 6-6" />
          </svg>
          Formulario precargado desde la plantilla &ldquo;{plantilla.titulo}&rdquo;
        </div>
      )}

      {/* Datos generales */}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className={labelClass}>Título del proyecto</label>
          <input
            type="text"
            required
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            className={inputClass}
            placeholder="Ej. Desarrollo app móvil"
          />
        </div>
        <div className="col-span-2">
          <label className={labelClass}>Descripción</label>
          <textarea
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            className={inputClass}
            rows={2}
            placeholder="Descripción del contrato..."
          />
        </div>
        <div>
          <label className={labelClass}>Valor total ($)</label>
          <input
            type="number"
            required
            value={form.valorTotal}
            onChange={(e) => setForm({ ...form, valorTotal: e.target.value })}
            className={inputClass}
            placeholder="10000000"
          />
          {/* Preview retención */}
          {valorTotal > 0 && (
            <p className="text-[11px] text-[#999891] mt-1.5">
              Retención en la fuente:{" "}
              <span className="font-medium text-[#92600a]">
                {retencionPct}%
              </span>
              {retencionPct > 0 && (
                <span className="text-[#bbb9b0]">
                  {" "}
                  · ${Math.round((valorTotal * retencionPct) / 100).toLocaleString("es-CO")} estimado por contrato
                </span>
              )}
            </p>
          )}
        </div>
        <div>
          <label className={labelClass}>Contratista</label>
          <select
            required
            value={form.contratistaId}
            onChange={(e) =>
              setForm({ ...form, contratistaId: e.target.value })
            }
            className={inputClass}
          >
            <option value="">Seleccionar...</option>
            {contratistas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Fecha inicio</label>
          <input
            type="date"
            required
            value={form.fechaInicio}
            onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Fecha fin</label>
          <input
            type="date"
            required
            value={form.fechaFin}
            onChange={(e) => setForm({ ...form, fechaFin: e.target.value })}
            className={inputClass}
          />
        </div>
      </div>

      {/* Entregables */}
      <div className="border-t border-black/[0.05] pt-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#999891]">
            Entregables
          </p>
          <span
            className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${
              diferencia === 0 && valorTotal > 0
                ? "bg-[#e6f5ed] text-[#1a7a4a]"
                : "bg-[#fef3dc] text-[#92600a]"
            }`}
          >
            {diferencia === 0 && valorTotal > 0
              ? "Suma correcta"
              : `Diferencia: $${Math.abs(diferencia).toLocaleString("es-CO")}`}
          </span>
        </div>

        <div className="space-y-2">
          {entregables.map((ent, i) => (
            <div
              key={i}
              className="border border-black/[0.06] rounded-[10px] p-4 bg-[#fafaf7]"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-medium text-[#bbb9b0] uppercase tracking-[0.06em]">
                  Entregable {String(i + 1).padStart(2, "0")}
                </span>
                {entregables.length > 1 && (
                  <button
                    type="button"
                    onClick={() => eliminarEntregable(i)}
                    className="text-[11px] text-[#a02020] hover:opacity-70 transition-opacity"
                  >
                    Eliminar
                  </button>
                )}
              </div>
              <div className="grid grid-cols-[1fr_120px_140px] gap-3">
                <div>
                  <label className={labelClass}>Nombre</label>
                  <input
                    type="text"
                    required
                    value={ent.nombre}
                    onChange={(e) =>
                      actualizarEntregable(i, "nombre", e.target.value)
                    }
                    className={inputClass}
                    placeholder="Ej. Diseño UI"
                  />
                </div>
                <div>
                  <label className={labelClass}>Valor ($)</label>
                  <input
                    type="number"
                    required
                    value={ent.valor}
                    onChange={(e) =>
                      actualizarEntregable(i, "valor", e.target.value)
                    }
                    className={inputClass}
                    placeholder="2000000"
                  />
                </div>
                <div>
                  <label className={labelClass}>Fecha límite</label>
                  <input
                    type="date"
                    required
                    value={ent.fechaLimite}
                    onChange={(e) =>
                      actualizarEntregable(i, "fechaLimite", e.target.value)
                    }
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-[#faeaea] text-[#a02020] text-xs px-4 py-3 rounded-[8px]">
          <svg width="13" height="13" fill="none" viewBox="0 0 13 13" stroke="currentColor" strokeWidth="1.5">
            <circle cx="6.5" cy="6.5" r="5.5" /><path d="M6.5 4v3M6.5 9h.01" />
          </svg>
          {error}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-black/[0.05]">
        <button
          type="button"
          onClick={agregarEntregable}
          className="text-[12px] font-medium text-[#2d5be3] hover:opacity-70 transition-opacity flex items-center gap-1.5"
        >
          <svg width="12" height="12" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="2">
            <path d="M6 1v10M1 6h10" />
          </svg>
          Agregar entregable
        </button>
        <button
          type="submit"
          disabled={cargando}
          className="bg-[#1a1916] text-white rounded-[8px] px-5 py-2.5 text-sm font-medium hover:opacity-85 disabled:opacity-40 transition-opacity"
        >
          {cargando ? "Creando..." : "Crear contrato →"}
        </button>
      </div>
    </form>
  );
}