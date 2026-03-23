import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import Link from "next/link";
import AccionesEntregable from "@/components/AccionesEntregable";
import { BtnGuardarPlantilla } from "@/components/BtnGuardarPlantilla";

const prisma = new PrismaClient();

const estadoConfig: Record<string, { label: string; className: string }> = {
  PENDIENTE:   { label: "Pendiente",   className: "bg-black/[0.05] text-[#6b6a64]" },
  EN_REVISION: { label: "En revisión", className: "bg-[#fef3dc] text-[#92600a]" },
  APROBADO:    { label: "Aprobado",    className: "bg-[#e6f5ed] text-[#1a7a4a]" },
  RECHAZADO:   { label: "Rechazado",   className: "bg-[#faeaea] text-[#a02020]" },
};

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
        include: { acta: true, pago: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!contrato) redirect("/dashboard/contratos");

  const pagado = contrato.entregables
    .filter((e) => e.estado === "APROBADO")
    .reduce((s, e) => s + (e.pago?.valor ?? e.valor), 0);

  const porPagar = contrato.valorTotal - pagado;
  const aprobados = contrato.entregables.filter((e) => e.estado === "APROBADO").length;
  const enRevision = contrato.entregables.filter((e) => e.estado === "EN_REVISION").length;
  const progreso = Math.round((pagado / contrato.valorTotal) * 100) || 0;
  const completo = progreso === 100;

  return (
    <div className="min-h-screen bg-[#f0ede8]">
      {/* Topbar */}
      <div className="bg-[#f0ede8] border-b border-black/[0.07] px-8 py-[11px] flex items-center gap-1.5 text-xs text-[#999891]">
        <Link href="/dashboard" className="hover:text-[#1a1916] transition-colors">
          Dashboard
        </Link>
        <span className="text-[#bbb9b0]">/</span>
        <Link href="/dashboard/contratos" className="hover:text-[#1a1916] transition-colors">
          Contratos
        </Link>
        <span className="text-[#bbb9b0]">/</span>
        <span className="font-medium text-[#1a1916] truncate max-w-[240px]">
          {contrato.titulo}
        </span>
      </div>

      <div className="p-8">
        {/* Encabezado */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-[20px] font-semibold tracking-[-0.4px] text-[#1a1916]">
                {contrato.titulo}
              </h1>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-[#999891]">
                <span>{contrato.contratista.nombre}</span>
                <span className="text-[#d0cec7]">·</span>
                <span>
                  {new Date(contrato.fechaInicio).toLocaleDateString("es-CO")}
                  {" — "}
                  {new Date(contrato.fechaFin).toLocaleDateString("es-CO")}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {completo && (
                <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#e6f5ed] text-[#1a7a4a]">
                  Completado
                </span>
              )}
              {!completo && enRevision > 0 && (
                <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#fef3dc] text-[#92600a]">
                  {enRevision} en revisión
                </span>
              )}
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-[3px] bg-black/[0.07] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  completo ? "bg-[#1a7a4a]" : "bg-[#2d5be3]"
                }`}
                style={{ width: `${progreso}%` }}
              />
            </div>
            <span className="font-mono text-[11px] text-[#999891]">
              {aprobados}/{contrato.entregables.length} · {progreso}%
            </span>
          </div>

          <BtnGuardarPlantilla contratoId={contrato.id} tituloDefault={contrato.titulo} />
        </div>

        {/* Summary strip */}
        <div className="flex rounded-xl overflow-hidden border border-black/[0.08] divide-x divide-black/[0.06] mb-6">
          {[
            { label: "Valor total", value: `$${contrato.valorTotal.toLocaleString("es-CO")}` },
            { label: "Pagado", value: `$${pagado.toLocaleString("es-CO")}`, color: "text-[#1a7a4a]" },
            { label: "Por pagar", value: `$${porPagar.toLocaleString("es-CO")}`, color: "text-[#1a4fa0]" },
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

        {/* Entregables */}
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#999891] mb-2.5">
          Entregables
        </p>
        <div className="flex flex-col gap-2">
          {contrato.entregables.map((e, i) => {
            const cfg = estadoConfig[e.estado] ?? estadoConfig.PENDIENTE;

            return (
              <div
                key={e.id}
                className="bg-white rounded-xl border border-black/[0.07] overflow-hidden"
              >
                {/* Fila principal */}
                <div className="px-5 py-4 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="text-[11px] font-mono text-[#bbb9b0] mt-0.5 flex-shrink-0 w-5">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#1a1916]">{e.nombre}</p>
                      {e.descripcion && (
                        <p className="text-xs text-[#999891] mt-0.5 line-clamp-2">
                          {e.descripcion}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3 flex-shrink-0 text-right">
                    <span
                      className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${cfg.className}`}
                    >
                      {cfg.label}
                    </span>
                    <div>
                      <p className="font-mono text-[15px] font-medium tracking-[-0.3px] text-[#1a1916]">
                        ${e.valor.toLocaleString("es-CO")}
                      </p>
                      {(e.penalizacion ?? 0) !== 0 && (
                        <p
                          className={`text-[11px] font-medium mt-0.5 ${
                            (e.penalizacion ?? 0) < 0 ? "text-[#a02020]" : "text-[#1a7a4a]"
                          }`}
                        >
                          {(e.penalizacion ?? 0) < 0
                            ? `-$${Math.abs(e.penalizacion ?? 0).toLocaleString("es-CO")}`
                            : `+$${(e.penalizacion ?? 0).toLocaleString("es-CO")}`}
                        </p>
                      )}
                      {e.diasRetraso > 0 && (
                        <p className="text-[11px] text-[#a02020] mt-0.5">
                          {e.diasRetraso}d tarde
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer de la card */}
                <div className="px-5 py-2.5 border-t border-black/[0.05] bg-[#fafaf7] flex items-center justify-between">
                  <span className="text-[11px] text-[#999891]">
                    Vence: {new Date(e.fechaLimite).toLocaleDateString("es-CO")}
                  </span>
                  <div className="flex items-center gap-4">
                    {e.estado === "APROBADO" && e.acta && (
                      <a
                        href={`/api/actas/${e.acta.id}/pdf`}
                        target="_blank"
                        className="text-[11px] text-[#2d5be3] hover:opacity-70 transition-opacity"
                      >
                        Descargar acta PDF →
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
            );
          })}
        </div>
      </div>
    </div>
  );
}