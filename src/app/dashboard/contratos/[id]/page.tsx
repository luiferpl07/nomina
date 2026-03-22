import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import Link from "next/link";
import AccionesEntregable from "@/components/AccionesEntregable";

const prisma = new PrismaClient();

export default async function DetalleContratoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { id } = await params;

  const contrato = await prisma.contrato.findUnique({
    where: { id },
    include: {
      contratista: { select: { nombre: true, email: true } },
      entregables: {
        include: {
          acta: true,
          pago: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!contrato) redirect("/dashboard/contratos");

  const pagado = contrato.entregables
    .filter((e) => e.estado === "APROBADO")
    .reduce((sum, e) => sum + e.valor, 0);

  const progreso = Math.round((pagado / contrato.valorTotal) * 100) || 0;

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
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
        <Link
          href="/dashboard/contratos"
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          ← Contratos
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-sm font-medium text-gray-900">{contrato.titulo}</h1>
      </div>

      <div className="p-6 max-w-4xl mx-auto">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Valor total</p>
            <p className="text-xl font-medium text-blue-600">
              ${contrato.valorTotal.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Pagado</p>
            <p className="text-xl font-medium text-green-600">
              ${pagado.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Por pagar</p>
            <p className="text-xl font-medium text-gray-900">
              ${(contrato.valorTotal - pagado).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500">Progreso del contrato</p>
            <p className="text-xs font-medium text-gray-900">{progreso}%</p>
          </div>
          <div className="bg-gray-100 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${progreso}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-gray-500">
              Contratista: {contrato.contratista.nombre}
            </p>
            <p className="text-xs text-gray-500">
              {new Date(contrato.fechaInicio).toLocaleDateString("es-CO")} —{" "}
              {new Date(contrato.fechaFin).toLocaleDateString("es-CO")}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {contrato.entregables.map((e, i) => (
            <div
              key={e.id}
              className="bg-white rounded-xl border border-gray-200 p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-gray-400">
                    #{i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {e.nombre}
                    </p>
                    {e.descripcion && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {e.descripcion}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${estadoColor[e.estado]}`}
                  >
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
            <div className="flex items-center gap-4">
                {e.estado === "APROBADO" && e.acta && (
                <a
                    href={`/api/actas/${e.acta.id}/pdf`}
                    target="_blank"
                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                    Descargar acta PDF
                </a>
                )}
                <AccionesEntregable
                entregableId={e.id}
                estado={e.estado}
                rol={session.user.rol}
                firmaContratista={e.acta?.firmaContratista?.toISOString() ?? null}
                firmaAprobador={e.acta?.firmaAprobador?.toISOString() ?? null}
                />
            </div>
            </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}