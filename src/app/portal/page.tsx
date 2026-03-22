import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import AccionesEntregable from "@/components/AccionesEntregable";

const prisma = new PrismaClient();

const estadoConfig: Record<string, { label: string; className: string }> = {
  PENDIENTE:   { label: "Pendiente",   className: "bg-black/[0.05] text-[#6b6a64]" },
  EN_REVISION: { label: "En revisión", className: "bg-[#fef3dc] text-[#92600a]" },
  APROBADO:    { label: "Aprobado",    className: "bg-[#e6f5ed] text-[#1a7a4a]" },
  RECHAZADO:   { label: "Rechazado",   className: "bg-[#faeaea] text-[#a02020]" },
};

export default async function PortalPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const contratos = await prisma.contrato.findMany({
    where: { contratistaId: session.user.id },
    include: {
      entregables: {
        include: { acta: true, pago: true },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const todosEntregables = contratos.flatMap((c) => c.entregables);

  const totalCobrado = todosEntregables
    .filter((e) => e.estado === "APROBADO")
    .reduce((sum, e) => sum + (e.pago?.valor ?? e.valor), 0);

  const totalPorCobrar = todosEntregables
    .filter((e) => e.estado !== "APROBADO")
    .reduce((sum, e) => sum + e.valor, 0);

  const enRevisionCount = todosEntregables.filter(
    (e) => e.estado === "EN_REVISION"
  ).length;

  const nombreCorto = session.user.nombre.split(" ")[0];
  const fecha = new Date().toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#f0ede8]">
      {/* Topbar */}
      <div className="bg-[#f0ede8] border-b border-black/[0.07] px-8 py-[11px] flex items-center gap-1.5 text-xs text-[#999891]">
        <span className="font-medium text-[#1a1916]">Mi portal</span>
      </div>

      <div className="p-8">
        {/* Saludo */}
        <div className="mb-8">
          <h1 className="text-[20px] font-semibold tracking-[-0.4px] text-[#1a1916]">
            Hola, {nombreCorto}
          </h1>
          <p className="text-xs text-[#999891] mt-1 capitalize">{fecha}</p>
        </div>

        {/* Summary strip */}
        <div className="flex rounded-xl overflow-hidden border border-black/[0.08] divide-x divide-black/[0.06] mb-8">
          {[
            {
              label: "Cobrado",
              value: `$${totalCobrado.toLocaleString("es-CO")}`,
              color: "text-[#1a7a4a]",
            },
            {
              label: "Por cobrar",
              value: `$${totalPorCobrar.toLocaleString("es-CO")}`,
            },
            {
              label: "En revisión",
              value: String(enRevisionCount),
              color: enRevisionCount > 0 ? "text-[#92600a]" : undefined,
            },
          ].map((s) => (
            <div key={s.label} className="flex-1 bg-white px-[18px] py-[14px]">
              <p className="text-[11px] uppercase tracking-[0.06em] text-[#999891] mb-1">
                {s.label}
              </p>
              <p
                className={`font-mono text-[17px] font-medium tracking-[-0.5px] ${
                  s.color ?? "text-[#1a1916]"
                }`}
              >
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Contratos */}
        {contratos.length === 0 ? (
          <div className="bg-white rounded-xl border border-black/[0.07] p-12 text-center">
            <p className="text-sm font-medium text-[#1a1916] mb-1">
              Sin contratos asignados
            </p>
            <p className="text-xs text-[#999891]">
              Cuando te asignen un contrato aparecerá aquí
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {contratos.map((c) => {
              const aprobados = c.entregables.filter(
                (e) => e.estado === "APROBADO"
              ).length;
              const progreso =
                Math.round((aprobados / c.entregables.length) * 100) || 0;
              const completo = progreso === 100;

              return (
                <div
                  key={c.id}
                  className="bg-white rounded-xl border border-black/[0.07] overflow-hidden"
                >
                  {/* Cabecera del contrato */}
                  <div className="px-5 py-4 border-b border-black/[0.05]">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <h2 className="text-sm font-semibold text-[#1a1916]">
                          {c.titulo}
                        </h2>
                        <p className="text-xs text-[#999891] mt-0.5">
                          Vence{" "}
                          {new Date(c.fechaFin).toLocaleDateString("es-CO", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-mono text-[15px] font-medium tracking-[-0.3px] text-[#1a1916]">
                          ${c.valorTotal.toLocaleString("es-CO")}
                        </p>
                        {completo && (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#e6f5ed] text-[#1a7a4a] mt-1 inline-block">
                            Completado
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Barra de progreso */}
                    <div className="flex items-center gap-2.5">
                      <div className="flex-1 h-[3px] bg-black/[0.07] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            completo ? "bg-[#1a7a4a]" : "bg-[#2d5be3]"
                          }`}
                          style={{ width: `${progreso}%` }}
                        />
                      </div>
                      <span className="font-mono text-[11px] text-[#999891]">
                        {aprobados}/{c.entregables.length}
                      </span>
                    </div>
                  </div>

                  {/* Entregables */}
                  <div className="divide-y divide-black/[0.04]">
                    {c.entregables.map((e, i) => {
                      const cfg = estadoConfig[e.estado] ?? estadoConfig.PENDIENTE;
                      const valorFinal = e.pago?.valor ?? e.valor;
                      const tienePenalizacion =
                        e.penalizacion !== null && e.penalizacion !== 0;

                      return (
                        <div key={e.id}>
                          {/* Fila principal */}
                          <div className="px-5 py-3.5 flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 min-w-0">
                              <span className="font-mono text-[11px] text-[#bbb9b0] mt-0.5 flex-shrink-0 w-5">
                                {String(i + 1).padStart(2, "0")}
                              </span>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-[#1a1916]">
                                  {e.nombre}
                                </p>
                                {e.descripcion && (
                                  <p className="text-xs text-[#999891] mt-0.5 line-clamp-1">
                                    {e.descripcion}
                                  </p>
                                )}
                                <p className="text-[11px] text-[#bbb9b0] mt-0.5">
                                  Vence{" "}
                                  {new Date(e.fechaLimite).toLocaleDateString(
                                    "es-CO",
                                    { day: "numeric", month: "short" }
                                  )}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start gap-3 flex-shrink-0 text-right">
                              <span
                                className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${cfg.className}`}
                              >
                                {cfg.label}
                              </span>
                              <div>
                                <p className="font-mono text-[14px] font-medium tracking-[-0.3px] text-[#1a1916]">
                                  ${valorFinal.toLocaleString("es-CO")}
                                </p>
                                {tienePenalizacion && (
                                  <p
                                    className={`text-[11px] font-medium mt-0.5 ${
                                      (e.penalizacion ?? 0) < 0
                                        ? "text-[#a02020]"
                                        : "text-[#1a7a4a]"
                                    }`}
                                  >
                                    {(e.penalizacion ?? 0) < 0
                                      ? `-$${Math.abs(
                                          e.penalizacion ?? 0
                                        ).toLocaleString("es-CO")}`
                                      : `+$${(
                                          e.penalizacion ?? 0
                                        ).toLocaleString("es-CO")}`}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Footer con acciones */}
                          <div className="px-5 py-2 border-t border-black/[0.04] bg-[#fafaf7] flex items-center justify-between">
                            <div>
                              {e.estado === "APROBADO" && e.acta && (
                                <a
                                  href={`/api/actas/${e.acta.id}/pdf`}
                                  target="_blank"
                                  className="text-[11px] text-[#2d5be3] hover:opacity-70 transition-opacity"
                                >
                                  Descargar acta →
                                </a>
                              )}
                            </div>
                            <AccionesEntregable
                              entregableId={e.id}
                              estado={e.estado}
                              rol={session.user.rol}
                              firmaContratista={
                                e.acta?.firmaContratista?.toISOString() ?? null
                              }
                              firmaAprobador={
                                e.acta?.firmaAprobador?.toISOString() ?? null
                              }
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}