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
      where: { empresaId: session.user.empresaId, rol: "CONTRATISTA" },
      select: { id: true, nombre: true },
    }),
  ]);

  const totalValor = contratos.reduce((s, c) => s + c.valorTotal, 0);
  const totalPagado = contratos.reduce(
    (s, c) =>
      s +
      c.entregables
        .filter((e) => e.estado === "APROBADO")
        .reduce((se, e) => se + e.valor, 0),
    0
  );
  const totalEntregables = contratos.reduce((s, c) => s + c.entregables.length, 0);
  const totalAprobados = contratos.reduce(
    (s, c) => s + c.entregables.filter((e) => e.estado === "APROBADO").length,
    0
  );

  return (
    <div className="min-h-screen bg-[#f0ede8]">
      {/* Topbar */}
      <div className="bg-[#f0ede8] border-b border-black/[0.07] px-8 py-[11px] flex items-center gap-1.5 text-xs text-[#999891]">
        <Link href="/dashboard" className="hover:text-[#1a1916] transition-colors">
          Dashboard
        </Link>
        <span className="text-[#bbb9b0]">/</span>
        <span className="font-medium text-[#1a1916]">Contratos</span>
      </div>

      <div className="p-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-[20px] font-semibold tracking-[-0.4px] text-[#1a1916]">
            Contratos
          </h1>
          <p className="text-xs text-[#999891] mt-1">
            {contratos.length} contrato{contratos.length !== 1 ? "s" : ""} · última actualización hoy
          </p>

          {/* Summary strip */}
          {contratos.length > 0 && (
            <div className="mt-5 flex rounded-xl overflow-hidden border border-black/[0.08] divide-x divide-black/[0.06]">
              {[
                { label: "Valor total", value: `$${totalValor.toLocaleString("es-CO")}` },
                {
                  label: "Pagado",
                  value: `$${totalPagado.toLocaleString("es-CO")}`,
                  color: "text-[#1a7a4a]",
                },
                {
                  label: "Por pagar",
                  value: `$${(totalValor - totalPagado).toLocaleString("es-CO")}`,
                  color: "text-[#1a4fa0]",
                },
                { label: "Entregables", value: `${totalAprobados}/${totalEntregables}` },
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
          )}
        </div>

        {contratos.length === 0 ? (
          <div className="bg-white rounded-xl border border-black/[0.07] p-10 text-center">
            <p className="text-sm font-medium text-[#1a1916] mb-1">Sin contratos aún</p>
            <p className="text-xs text-[#999891] mb-6">
              Crea el primero para comenzar a gestionar entregables.
            </p>
            <NuevoContratoForm contratistas={contratistas} />
          </div>
        ) : (
          <>
            {/* Contract list */}
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#999891] mb-2.5">
              Activos
            </p>
            <div className="flex flex-col gap-2 mb-9">
              {contratos.map((c) => {
                const aprobados = c.entregables.filter(
                  (e) => e.estado === "APROBADO"
                ).length;
                const enRevision = c.entregables.filter(
                  (e) => e.estado === "EN_REVISION"
                ).length;
                const progreso =
                  Math.round((aprobados / c.entregables.length) * 100) || 0;
                const completo = progreso === 100;

                return (
                  <Link
                    key={c.id}
                    href={`/dashboard/contratos/${c.id}`}
                    className="bg-white rounded-xl border border-black/[0.07] px-5 py-4 grid grid-cols-[1fr_auto] gap-x-4 gap-y-3 hover:border-black/[0.18] hover:-translate-y-px transition-all duration-150"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#1a1916]">{c.titulo}</p>
                      <p className="text-xs text-[#999891] mt-0.5">{c.contratista.nombre}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <p className="font-mono text-[15px] font-medium tracking-[-0.3px] text-[#1a1916]">
                        ${c.valorTotal.toLocaleString("es-CO")}
                      </p>
                      {completo ? (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#e6f5ed] text-[#1a7a4a]">
                          Completado
                        </span>
                      ) : enRevision > 0 ? (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#fef3dc] text-[#92600a]">
                          {enRevision} en revisión
                        </span>
                      ) : null}
                    </div>
                    <div className="col-span-2 flex items-center gap-2.5">
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
                  </Link>
                );
              })}
            </div>

            {/* Nuevo contrato */}
            <div className="bg-white rounded-xl border border-black/[0.07] overflow-hidden">
              <div className="px-5 py-[14px] border-b border-black/[0.06] bg-[#fafaf7] flex items-center gap-2">
                <div className="w-6 h-6 rounded-[6px] bg-[#2d5be3]/10 flex items-center justify-center flex-shrink-0">
                  <svg
                    width="13"
                    height="13"
                    fill="none"
                    viewBox="0 0 13 13"
                    stroke="#2d5be3"
                    strokeWidth="1.8"
                  >
                    <path d="M6.5 1v11M1 6.5h11" />
                  </svg>
                </div>
                <span className="text-[13px] font-semibold text-[#1a1916]">
                  Nuevo contrato
                </span>
              </div>
              <div className="p-5">
                <NuevoContratoForm contratistas={contratistas} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}