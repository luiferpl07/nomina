import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import AccionesEntregable from "@/components/AccionesEntregable";

const prisma = new PrismaClient();

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

  const totalCobrado = contratos
    .flatMap((c) => c.entregables)
    .filter((e) => e.estado === "APROBADO")
    .reduce((sum, e) => sum + (e.pago?.valor ?? e.valor), 0);

  const totalPorCobrar = contratos
    .flatMap((c) => c.entregables)
    .filter((e) => e.estado !== "APROBADO")
    .reduce((sum, e) => sum + e.valor, 0);

  const enRevision = contratos
    .flatMap((c) => c.entregables)
    .filter((e) => e.estado === "EN_REVISION").length;

  const estadoConfig: Record<string, { label: string; clase: string; punto: string }> = {
    PENDIENTE: { label: "Pendiente", clase: "bg-gray-100 text-gray-500", punto: "bg-gray-400" },
    EN_REVISION: { label: "En revisión", clase: "bg-amber-50 text-amber-700 border border-amber-200", punto: "bg-amber-400" },
    APROBADO: { label: "Aprobado", clase: "bg-green-50 text-green-700 border border-green-200", punto: "bg-green-500" },
    RECHAZADO: { label: "Rechazado", clase: "bg-red-50 text-red-600 border border-red-200", punto: "bg-red-500" },
  };

  const iniciales = session.user.nombre
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
  <div className="p-8">
    {/* Encabezado */}
    <div className="mb-8">
      <h1 className="text-xl font-semibold text-gray-900">
        Hola, {session.user.nombre.split(" ")[0]}
      </h1>
      <p className="text-sm text-gray-400 mt-1">
        {new Date().toLocaleDateString("es-CO", {
          weekday: "long", day: "numeric", month: "long", year: "numeric"
        })}
      </p>
    </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Saludo */}
        <div className="mb-8">
          <h1 className="text-xl font-medium text-gray-900">
            Hola, {session.user.nombre.split(" ")[0]}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Aquí está el resumen de tus contratos y pagos
          </p>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Cobrado</p>
            <p className="text-2xl font-medium text-green-600">
              ${totalCobrado.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">pesos colombianos</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Por cobrar</p>
            <p className="text-2xl font-medium text-gray-900">
              ${totalPorCobrar.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">en entregables pendientes</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">En revisión</p>
            <p className="text-2xl font-medium text-amber-500">{enRevision}</p>
            <p className="text-xs text-gray-400 mt-1">
              {enRevision === 1 ? "entregable esperando aprobación" : "entregables esperando aprobación"}
            </p>
          </div>
        </div>

        {/* Contratos */}
        {contratos.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M4 4h12v12H4V4z" stroke="#9CA3AF" strokeWidth="1.5" rx="2"/>
                <path d="M7 8h6M7 11h4" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900">Sin contratos asignados</p>
            <p className="text-xs text-gray-400 mt-1">Cuando te asignen un contrato aparecerá aquí</p>
          </div>
        ) : (
          <div className="space-y-4">
            {contratos.map((c) => {
              const aprobados = c.entregables.filter((e) => e.estado === "APROBADO").length;
              const progreso = Math.round((aprobados / c.entregables.length) * 100) || 0;

              return (
                <div key={c.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  {/* Cabecera del contrato */}
                  <div className="px-6 py-5 border-b border-gray-100">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-sm font-medium text-gray-900">{c.titulo}</h2>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Vence {new Date(c.fechaFin).toLocaleDateString("es-CO", {
                            day: "numeric", month: "long", year: "numeric"
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-blue-600">
                          ${c.valorTotal.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">valor total</p>
                      </div>
                    </div>
                    {/* Barra de progreso */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-gray-400">
                          {aprobados} de {c.entregables.length} entregables completados
                        </span>
                        <span className="text-xs font-medium text-gray-600">{progreso}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all duration-500"
                          style={{ width: `${progreso}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Entregables */}
                  <div className="divide-y divide-gray-50">
                    {c.entregables.map((e, i) => {
                      const cfg = estadoConfig[e.estado];
                      const valorFinal = e.pago?.valor ?? e.valor;
                      const tienePenalizacion = e.penalizacion !== 0 && e.penalizacion !== null;

                      return (
                        <div key={e.id} className="px-6 py-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${cfg.punto}`} />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{e.nombre}</p>
                                {e.descripcion && (
                                  <p className="text-xs text-gray-400 mt-0.5">{e.descripcion}</p>
                                )}
                                <p className="text-xs text-gray-400 mt-1">
                                  Vence {new Date(e.fechaLimite).toLocaleDateString("es-CO", {
                                    day: "numeric", month: "short"
                                  })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3 ml-4">
                              <div className="text-right">
                                <p className="text-sm font-medium text-gray-900">
                                  ${valorFinal.toLocaleString()}
                                </p>
                                {tienePenalizacion && (
                                  <p className={`text-xs mt-0.5 ${(e.penalizacion ?? 0) < 0 ? "text-red-500" : "text-green-500"}`}>
                                    {(e.penalizacion ?? 0) < 0
                                      ? `-$${Math.abs(e.penalizacion ?? 0).toLocaleString()}`
                                      : `+$${(e.penalizacion ?? 0).toLocaleString()}`}
                                  </p>
                                )}
                              </div>
                              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${cfg.clase}`}>
                                {cfg.label}
                              </span>
                            </div>
                          </div>

                          {/* Acciones */}
                          <div className="mt-3 flex items-center justify-between">
                            <div>
                              {e.estado === "APROBADO" && e.acta && (
                               <a
                                  href={`/api/actas/${e.acta.id}/pdf`}
                                  target="_blank"
                                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                >
                                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                                    <path d="M3 2h7l4 4v9H3V2z" stroke="currentColor" strokeWidth="1.3"/>
                                    <path d="M10 2v4h4" stroke="currentColor" strokeWidth="1.3"/>
                                  </svg>
                                  Descargar acta
                                </a>
                              )}
                            </div>
                            <AccionesEntregable
                              entregableId={e.id}
                              estado={e.estado}
                              rol={session.user.rol}
                              firmaContratista={e.acta?.firmaContratista?.toISOString() ?? null}
                              firmaAprobador={e.acta?.firmaAprobador?.toISOString() ?? null}
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