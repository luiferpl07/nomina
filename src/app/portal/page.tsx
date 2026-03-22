import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
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
    .reduce((sum, e) => sum + e.valor, 0);

  const totalPorCobrar = contratos
    .flatMap((c) => c.entregables)
    .filter((e) => e.estado !== "APROBADO")
    .reduce((sum, e) => sum + e.valor, 0);

  const enRevision = contratos
    .flatMap((c) => c.entregables)
    .filter((e) => e.estado === "EN_REVISION").length;

  const estadoColor: Record<string, string> = {
    PENDIENTE: "bg-gray-100 text-gray-600",
    EN_REVISION: "bg-amber-50 text-amber-700",
    APROBADO: "bg-green-50 text-green-700",
    RECHAZADO: "bg-red-50 text-red-600",
  };

  const estadoLabel: Record<string, string> = {
    PENDIENTE: "Pendiente",
    EN_REVISION: "En revisión",
    APROBADO: "Aprobado",
    RECHAZADO: "Rechazado",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-base font-medium text-gray-900">NóminaFlow</h1>
          <p className="text-xs text-gray-500">Mi portal</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">{session.user.nombre}</span>
          <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full font-medium">
            CONTRATISTA
          </span>
          <LogoutButton />
        </div>
      </div>

      <div className="p-6 max-w-4xl mx-auto">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Cobrado</p>
            <p className="text-xl font-medium text-green-600">
              ${totalCobrado.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Por cobrar</p>
            <p className="text-xl font-medium text-gray-900">
              ${totalPorCobrar.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">En revisión</p>
            <p className="text-xl font-medium text-amber-600">{enRevision}</p>
          </div>
        </div>

        {contratos.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-sm text-gray-500">No tienes contratos asignados aún.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {contratos.map((c) => (
              <div key={c.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{c.titulo}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      ${c.valorTotal.toLocaleString()} total
                    </p>
                  </div>
                  <p className="text-xs text-gray-400">
                    Vence: {new Date(c.fechaFin).toLocaleDateString("es-CO")}
                  </p>
                </div>
                <div className="divide-y divide-gray-50">
                  {c.entregables.map((e, i) => (
                    <div key={e.id} className="px-5 py-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-400">#{i + 1}</span>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{e.nombre}</p>
                            {e.descripcion && (
                              <p className="text-xs text-gray-500">{e.descripcion}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${estadoColor[e.estado]}`}>
                            {estadoLabel[e.estado]}
                          </span>
                          <p className="text-sm font-medium text-gray-900">
                            ${e.valor.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-400">
                          Vence: {new Date(e.fechaLimite).toLocaleDateString("es-CO")}
                        </p>
                        <AccionesEntregable
                          entregableId={e.id}
                          estado={e.estado}
                          rol={session.user.rol}
                          firmaContratista={e.acta?.firmaContratista?.toISOString() ?? null}
                          firmaAprobador={e.acta?.firmaAprobador?.toISOString() ?? null}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}