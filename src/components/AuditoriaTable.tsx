// src/components/AuditoriaTable.tsx
"use client";
import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Download, Filter } from "lucide-react";

const ACCIONES = [
  "CREAR_CONTRATO",
  "APROBAR_ENTREGABLE",
  "RECHAZAR_ENTREGABLE",
  "ENVIAR_REVISION",
  "SUBIR_EVIDENCIA",
  "CREAR_USUARIO",
  "CAMBIAR_ROL",
  "CONFIG_PENALIZACION",
  "CONFIG_RETENCION",
  "CONFIG_IVA",
  "GENERAR_ACTA",
];

const ACCION_LABEL: Record<string, { label: string; color: string }> = {
  CREAR_CONTRATO: { label: "Nuevo contrato", color: "bg-[#e6f5ed] text-[#1a7a4a]" },
  APROBAR_ENTREGABLE: { label: "Aprobó entregable", color: "bg-[#e6f5ed] text-[#1a7a4a]" },
  RECHAZAR_ENTREGABLE: { label: "Rechazó entregable", color: "bg-[#faeaea] text-[#a02020]" },
  ENVIAR_REVISION: { label: "Envió a revisión", color: "bg-[#fef3dc] text-[#92600a]" },
  SUBIR_EVIDENCIA: { label: "Subió evidencia", color: "bg-black/[0.05] text-[#6b6a64]" },
  CREAR_USUARIO: { label: "Creó usuario", color: "bg-[#e6f5ed] text-[#1a7a4a]" },
  CAMBIAR_ROL: { label: "Cambió rol", color: "bg-[#fef3dc] text-[#92600a]" },
  CONFIG_PENALIZACION: { label: "Config penalización", color: "bg-black/[0.05] text-[#6b6a64]" },
  CONFIG_RETENCION: { label: "Config retención", color: "bg-black/[0.05] text-[#6b6a64]" },
  CONFIG_IVA: { label: "Config IVA", color: "bg-black/[0.05] text-[#6b6a64]" },
  GENERAR_ACTA: { label: "Generó acta", color: "bg-black/[0.05] text-[#6b6a64]" },
};

interface Log {
  id: string;
  accion: string;
  entidad: string;
  entidadId: string;
  detalle: Record<string, unknown>;
  ip: string;
  creadoEn: string;
  usuario: { id: string; nombre: string; email: string; rol: string };
}

interface Props {
  logs: Log[];
  total: number;
  page: number;
  pageSize: number;
  usuarios: { id: string; nombre: string; rol: string }[];
}

function formatFecha(d: string) {
  return new Date(d).toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AuditoriaTable({ logs, total, page, pageSize, usuarios }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const accionFiltro = sp.get("accion") ?? "";
  const usuarioFiltro = sp.get("usuarioId") ?? "";

  function setFiltro(key: string, value: string) {
    const params = new URLSearchParams(sp.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  }

  function setPage(p: number) {
    const params = new URLSearchParams(sp.toString());
    params.set("page", String(p));
    router.push(`${pathname}?${params.toString()}`);
  }

  function exportarCSV() {
    const headers = ["Fecha", "Usuario", "Rol", "Acción", "Entidad", "ID", "IP"];
    const rows = logs.map((l) => [
      formatFecha(l.creadoEn),
      l.usuario.nombre,
      l.usuario.rol,
      l.accion,
      l.entidad,
      l.entidadId,
      l.ip ?? "",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `auditoria-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="bg-white rounded-xl border border-black/[0.07] px-5 py-4 flex flex-wrap items-center gap-3">
        <Filter size={14} className="text-[#999891]" />
        <select
          value={accionFiltro}
          onChange={(e) => setFiltro("accion", e.target.value)}
          className="text-[13px] border border-black/[0.12] rounded-[8px] px-3 py-1.5 bg-white focus:border-[#2d5be3] focus:ring-2 focus:outline-none"
        >
          <option value="">Todas las acciones</option>
          {ACCIONES.map((a) => (
            <option key={a} value={a}>
              {ACCION_LABEL[a]?.label ?? a}
            </option>
          ))}
        </select>

        <select
          value={usuarioFiltro}
          onChange={(e) => setFiltro("usuarioId", e.target.value)}
          className="text-[13px] border border-black/[0.12] rounded-[8px] px-3 py-1.5 bg-white focus:border-[#2d5be3] focus:ring-2 focus:outline-none"
        >
          <option value="">Todos los usuarios</option>
          {usuarios.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nombre} ({u.rol})
            </option>
          ))}
        </select>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-[12px] text-[#999891]">
            {total} registro{total !== 1 ? "s" : ""}
          </span>
          <Button
            onClick={exportarCSV}
            variant="outline"
            size="sm"
            className="text-[12px] gap-1.5"
          >
            <Download size={13} />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-black/[0.07] overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-12 text-center text-[14px] text-[#6b6a64]">
            No hay registros para los filtros seleccionados.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/[0.05]">
                {["Fecha", "Usuario", "Acción", "Entidad", "IP"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3 text-[11px] font-medium uppercase tracking-[0.08em] text-[#999891]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {logs.map((log) => {
                const accionInfo = ACCION_LABEL[log.accion] ?? {
                  label: log.accion,
                  color: "bg-black/[0.05] text-[#6b6a64]",
                };
                return (
                  <tr key={log.id} className="hover:bg-[#fafaf7] transition-colors">
                    <td className="px-5 py-3 text-[12px] text-[#6b6a64] font-mono whitespace-nowrap">
                      {formatFecha(log.creadoEn)}
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-[13px] font-medium text-[#1a1916]">
                        {log.usuario.nombre}
                      </p>
                      <p className="text-[11px] text-[#999891]">{log.usuario.rol}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${accionInfo.color}`}
                      >
                        {accionInfo.label}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-[12px] text-[#6b6a64]">{log.entidad}</p>
                      <p className="text-[11px] font-mono text-[#999891] truncate max-w-[120px]">
                        {log.entidadId}
                      </p>
                    </td>
                    <td className="px-5 py-3 text-[12px] font-mono text-[#999891]">
                      {log.ip ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-[#999891]">
            Página {page} de {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="text-[12px]"
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="text-[12px]"
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}