import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import Link from "next/link";
import NuevoContratoForm from "@/components/NuevoContratoForm";

const prisma = new PrismaClient();

export default async function ContratosPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.rol !== "ADMIN") redirect("/portal");

  const [contratos, contratistas] = await Promise.all([
    prisma.contrato.findMany({
      where: { empresaId: session.user.empresaId },
      include: {
        contratista: { select: { nombre: true } },
        entregables: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.usuario.findMany({
      where: {
        empresaId: session.user.empresaId,
        rol: "CONTRATISTA",
      },
      select: { id: true, nombre: true },
    }),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900">
            ← Dashboard
          </Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-sm font-medium text-gray-900">Contratos</h1>
        </div>
      </div>

      <div className="p-6 max-w-5xl mx-auto">
        {contratos.length === 0 ? (
          <div className="mb-8">
            <p className="text-sm text-gray-500 mb-6">
              No hay contratos aún. Crea el primero:
            </p>
            <NuevoContratoForm contratistas={contratistas} />
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-500">{contratos.length} contrato(s)</p>
            </div>

            <div className="space-y-3 mb-8">
              {contratos.map((c) => {
                const pagados = c.entregables.filter(e => e.estado === "APROBADO").length;
                const progreso = Math.round((pagados / c.entregables.length) * 100) || 0;
                return (
                  <Link key={c.id} href={`/dashboard/contratos/${c.id}`}>
                    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 cursor-pointer transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{c.titulo}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{c.contratista.nombre}</p>
                        </div>
                        <p className="text-sm font-medium text-blue-600">
                          ${c.valorTotal.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                          <div
                            className="bg-blue-500 h-1.5 rounded-full"
                            style={{ width: `${progreso}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">
                          {pagados}/{c.entregables.length} entregables
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="border-t border-gray-200 pt-8">
              <h2 className="text-sm font-medium text-gray-900 mb-4">Nuevo contrato</h2>
              <NuevoContratoForm contratistas={contratistas} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}