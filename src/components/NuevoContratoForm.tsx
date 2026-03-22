"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Entregable {
  nombre: string;
  descripcion: string;
  valor: string;
  fechaLimite: string;
}

export default function NuevoContratoForm({ contratistas }: { contratistas: any[] }) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
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

  function agregarEntregable() {
    setEntregables([...entregables, { nombre: "", descripcion: "", valor: "", fechaLimite: "" }]);
  }

  function eliminarEntregable(i: number) {
    setEntregables(entregables.filter((_, idx) => idx !== i));
  }

  function actualizarEntregable(i: number, campo: string, valor: string) {
    const nuevos = [...entregables];
    nuevos[i] = { ...nuevos[i], [campo]: valor };
    setEntregables(nuevos);
  }

  const totalEntregables = entregables.reduce((sum, e) => sum + (Number(e.valor) || 0), 0);
  const valorTotal = Number(form.valorTotal) || 0;
  const diferencia = valorTotal - totalEntregables;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (diferencia !== 0) {
      setError(`La suma de entregables ($${totalEntregables.toLocaleString()}) debe ser igual al valor total ($${valorTotal.toLocaleString()})`);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-medium text-gray-900 mb-4">Datos del contrato</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-xs text-gray-500 block mb-1">Título del proyecto</label>
            <input
              type="text"
              required
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              placeholder="Ej. Desarrollo app móvil"
            />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-gray-500 block mb-1">Descripción</label>
            <textarea
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              rows={2}
              placeholder="Descripción del contrato..."
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Valor total ($)</label>
            <input
              type="number"
              required
              value={form.valorTotal}
              onChange={(e) => setForm({ ...form, valorTotal: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              placeholder="10000000"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Contratista</label>
            <select
              required
              value={form.contratistaId}
              onChange={(e) => setForm({ ...form, contratistaId: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            >
              <option value="">Seleccionar...</option>
              {contratistas.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Fecha inicio</label>
            <input
              type="date"
              required
              value={form.fechaInicio}
              onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Fecha fin</label>
            <input
              type="date"
              required
              value={form.fechaFin}
              onChange={(e) => setForm({ ...form, fechaFin: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-gray-900">Entregables</h2>
          <div className={`text-xs px-3 py-1 rounded-full font-medium ${diferencia === 0 && valorTotal > 0 ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
            {diferencia === 0 && valorTotal > 0
              ? "Suma correcta"
              : `Diferencia: $${Math.abs(diferencia).toLocaleString()}`}
          </div>
        </div>

        <div className="space-y-3">
          {entregables.map((ent, i) => (
            <div key={i} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-500">Entregable {i + 1}</span>
                {entregables.length > 1 && (
                  <button
                    type="button"
                    onClick={() => eliminarEntregable(i)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Eliminar
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    value={ent.nombre}
                    onChange={(e) => actualizarEntregable(i, "nombre", e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"
                    placeholder="Ej. Diseño UI"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Valor ($)</label>
                  <input
                    type="number"
                    required
                    value={ent.valor}
                    onChange={(e) => actualizarEntregable(i, "valor", e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"
                    placeholder="2000000"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Fecha límite</label>
                  <input
                    type="date"
                    required
                    value={ent.fechaLimite}
                    onChange={(e) => actualizarEntregable(i, "fechaLimite", e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Descripción</label>
                  <input
                    type="text"
                    value={ent.descripcion}
                    onChange={(e) => actualizarEntregable(i, "descripcion", e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"
                    placeholder="Opcional"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={agregarEntregable}
          className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          + Agregar entregable
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">{error}</p>
      )}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-gray-600 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={cargando}
          className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {cargando ? "Creando..." : "Crear contrato"}
        </button>
      </div>
    </form>
  );
}