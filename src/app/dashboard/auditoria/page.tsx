import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import {prisma} from "@/lib/prisma";
import { AuditoriaTable } from "@/components/AuditoriaTable";
import { Suspense } from "react";

interface Props {
  searchParams: Promise<{ page?: string; accion?: string; usuarioId?: string }>;
}

export default async function AuditoriaPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.rol === "CONTRATISTA") redirect("/portal");

  const sp      = await searchParams;
  const page     = Math.max(1, parseInt(sp.page ?? "1"));
  const pageSize = 25;
  const accion   = sp.accion ?? undefined;
  const usuarioId = sp.usuarioId ?? undefined;

  const where = {
    usuario: { empresaId: session.user.empresaId },
    ...(accion    ? { accion }    : {}),
    ...(usuarioId ? { usuarioId } : {}),
  };

  const [logs, total, usuarios] = await Promise.all([
    prisma.auditoriaLog.findMany({
      where,
      include: {
        usuario: { select: { id: true, nombre: true, email: true, rol: true } },
      },
      orderBy: { creadoEn: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.auditoriaLog.count({ where }),
    prisma.usuario.findMany({
      where: { empresaId: session.user.empresaId },
      select: { id: true, nombre: true, rol: true },
      orderBy: { nombre: "asc" },
    }),
  ]);

  // Serializar fechas para el client component
  const logsSerialized = logs.map((l) => ({
    ...l,
    creadoEn: l.creadoEn.toISOString(),
    detalle: (l.detalle ?? {}) as Record<string, unknown>,
  }));

  return (
    <div className="p-8">
      {/* Encabezado */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
          Log de auditoría
        </h1>
        <p className="text-sm text-stone-400 mt-1">
          Registro inmutable de todas las acciones del sistema
        </p>
      </div>

      {/* Resumen rápido */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total registros", valor: total },
          {
            label: "Aprobaciones",
            valor: logs.filter((l) => l.accion === "APROBAR_ENTREGABLE").length,
          },
          {
            label: "Rechazos",
            valor: logs.filter((l) => l.accion === "RECHAZAR_ENTREGABLE").length,
          },
        ].map((m) => (
          <div
            key={m.label}
            className="bg-white rounded-xl border border-black/[0.07] px-5 py-4"
          >
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#999891] mb-1">
              {m.label}
            </p>
            <p className="text-3xl font-semibold text-stone-900">{m.valor}</p>
          </div>
        ))}
      </div>

      <Suspense fallback={<div className="text-sm text-stone-400">Cargando...</div>}>
        <AuditoriaTable
          logs={logsSerialized}
          total={total}
          page={page}
          pageSize={pageSize}
          usuarios={usuarios}
        />
      </Suspense>
    </div>
  );
}