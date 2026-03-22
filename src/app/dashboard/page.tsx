import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import Link from "next/link";

const prisma = new PrismaClient();

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const contratos = await prisma.contrato.findMany({
    where: { empresaId: session.user.empresaId },
    include: {
      contratista: { select: { nombre: true } },
      entregables: { include: { pago: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalPorPagar = contratos
    .flatMap((c) => c.entregables)
    .filter((e) => e.estado !== "APROBADO")
    .reduce((sum, e) => sum + e.valor, 0);

  const totalPagado = contratos
    .flatMap((c) => c.entregables)
    .filter((e) => e.estado === "APROBADO")
    .reduce((sum, e) => sum + (e.pago?.valor ?? e.valor), 0);

  const enRevision = contratos
    .flatMap((c) => c.entregables)
    .filter((e) => e.estado === "EN_REVISION").length;

  const diasSemana = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
  const meses = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  const hoy = new Date();
  const fechaTexto = `${diasSemana[hoy.getDay()]}, ${hoy.getDate()} de ${meses[hoy.getMonth()]} de ${hoy.getFullYear()}`;

  const metrics = [
    { label: "Contratos activos", valor: contratos.length, sub: "en curso", color: "" },
    { label: "Por pagar", valor: `$${totalPorPagar.toLocaleString()}`, sub: "en entregables pendientes", color: "" },
    { label: "En revisión", valor: enRevision, sub: enRevision === 1 ? "entregable" : "entregables", color: "text-amber-600" },
    { label: "Total pagado", valor: `$${totalPagado.toLocaleString()}`, sub: "liberado a contratistas", color: "text-green-600" },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-stone-900">
          Buenos días, {session.user.nombre.split(" ")[0]}
        </h1>
        <p className="text-sm text-stone-400 mt-1 capitalize">{fechaTexto}</p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {metrics.map((m) => (
          <div key={m.label} className="bg-white rounded-xl border border-stone-100 p-5">
            <p className="text-xs font-medium text-stone-400 mb-3">{m.label}</p>
            <p className={`text-2xl font-semibold ${m.color || "text-stone-900"}`}>{m.valor}</p>
            <p className="text-xs text-stone-400 mt-1">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-stone-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-stone-900">Contratos</h2>
          <Link
            href="/dashboard/contratos"
            className="text-xs bg-stone-900 text-white px-3 py-1.5 rounded-lg hover:bg-stone-800"
          >
            + Nuevo
          </Link>
        </div>

        {contratos.length === 0 ? (
          <div className="p-16 text-center">
            <p className="text-sm text-stone-400">No hay contratos aún</p>
            <Link href="/dashboard/contratos" className="inline-block mt-3 text-xs text-stone-900 underline underline-offset-2">
              Crear el primero →
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-12 px-6 py-2.5 border-b border-stone-50">
              {["Proyecto", "Contratista", "Progreso", "Pagado", "Total"].map((h, i) => (
                <p key={h} className={`text-xs font-medium text-stone-400 ${i === 0 ? "col-span-4" : i === 1 ? "col-span-3" : i === 2 ? "col-span-2" : "col-span-1 text-right"} ${i >= 3 ? "col-span-1" : ""}`}>
                  {h}
                </p>
              ))}
            </div>
            <div className="divide-y divide-stone-50">
              {contratos.map((c) => {
                const aprobados = c.entregables.filter((e) => e.estado === "APROBADO").length;
                const enRevisionC = c.entregables.filter((e) => e.estado === "EN_REVISION").length;
                const progreso = Math.round((aprobados / c.entregables.length) * 100) || 0;
                const pagadoC = c.entregables
                  .filter((e) => e.estado === "APROBADO")
                  .reduce((sum, e) => sum + (e.pago?.valor ?? e.valor), 0);

                return (
                  <Link key={c.id} href={`/dashboard/contratos/${c.id}`}>
                    <div className="grid grid-cols-12 px-6 py-4 hover:bg-stone-50 transition-colors items-center cursor-pointer">
                      <div className="col-span-4">
                        <p className="text-sm font-medium text-stone-900">{c.titulo}</p>
                        {enRevisionC > 0 && (
                          <span className="inline-block mt-1 text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                            {enRevisionC} en revisión
                          </span>
                        )}
                      </div>
                      <div className="col-span-3">
                        <p className="text-sm text-stone-500">{c.contratista.nombre}</p>
                      </div>
                      <div className="col-span-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                            <div className="h-full bg-stone-900 rounded-full" style={{ width: `${progreso}%` }} />
                          </div>
                          <span className="text-xs text-stone-400">{progreso}%</span>
                        </div>
                      </div>
                      <div className="col-span-1 text-right">
                        <p className="text-sm text-green-600 font-medium">${pagadoC.toLocaleString()}</p>
                      </div>
                      <div className="col-span-2 text-right">
                        <p className="text-sm text-stone-900 font-medium">${c.valorTotal.toLocaleString()}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}