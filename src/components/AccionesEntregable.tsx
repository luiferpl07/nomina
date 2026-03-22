"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  entregableId: string;
  estado: string;
  rol: string;
  firmaContratista: string | null;
  firmaAprobador: string | null;
}

export default function AccionesEntregable({
  entregableId,
  estado,
  rol,
  firmaContratista,
  firmaAprobador,
}: Props) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [comentario, setComentario] = useState("");
  const [mostrarComentario, setMostrarComentario] = useState(false);

  async function cambiarEstado(nuevoEstado: string) {
    setCargando(true);
    const res = await fetch(`/api/entregables/${entregableId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado, comentario }),
    });

    if (!res.ok) {
        const error = await res.json();
        console.error("Error:", error);
        alert(`Error: ${JSON.stringify(error)}`);
        setCargando(false);
        return;
    }

    setCargando(false);
    setMostrarComentario(false);
    window.location.reload();
    }

  if (estado === "APROBADO") {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-green-600">
          Firma contratista: {firmaContratista ? new Date(firmaContratista).toLocaleDateString("es-CO") : "—"}
        </span>
        <span className="text-xs text-green-600">
          Firma aprobador: {firmaAprobador ? new Date(firmaAprobador).toLocaleDateString("es-CO") : "—"}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        {rol === "CONTRATISTA" && estado === "PENDIENTE" && (
          <button
            onClick={() => cambiarEstado("EN_REVISION")}
            disabled={cargando}
            className="text-xs bg-amber-500 text-white px-3 py-1.5 rounded-lg hover:bg-amber-600 disabled:opacity-50"
          >
            {cargando ? "..." : "Enviar a revisión"}
          </button>
        )}

        {(rol === "ADMIN" || rol === "APROBADOR") && estado === "EN_REVISION" && (
          <>
            <button
              onClick={() => setMostrarComentario(!mostrarComentario)}
              disabled={cargando}
              className="text-xs border border-red-200 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50"
            >
              Rechazar
            </button>
            <button
              onClick={() => cambiarEstado("APROBADO")}
              disabled={cargando}
              className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {cargando ? "..." : "Aprobar y firmar"}
            </button>
          </>
        )}
      </div>

      {mostrarComentario && (
        <div className="flex items-center gap-2 w-full justify-end">
          <input
            type="text"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Motivo del rechazo..."
            className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 w-48 focus:outline-none focus:border-red-400"
          />
          <button
            onClick={() => cambiarEstado("RECHAZADO")}
            disabled={cargando}
            className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            Confirmar rechazo
          </button>
        </div>
      )}
    </div>
  );
}