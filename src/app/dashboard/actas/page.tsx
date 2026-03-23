import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import {prisma} from "@/lib/prisma";
import Link from "next/link";

export default async function ActasPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.rol === "CONTRATISTA") redirect("/portal");

  const actas = await prisma.acta.findMany({
    where: {
      entregable: {
        contrato: { empresaId: session.user.empresaId },
      },
    },
    include: {
      entregable: {
        include: {
          contrato: {
            include: {
              contratista: { select: { nombre: true } },
            },
          },
          pago: { select: { valorNeto: true, valor: true } },
        },
      },
      aprobador: { select: { nombre: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalActas   = actas.length;
  const conDosFirmas = actas.filter((a) => a.firmaContratista && a.firmaAprobador).length;
  const valorTotal   = actas.reduce(
    (s, a) => s + (a.entregable.pago?.valorNeto ?? a.entregable.pago?.valor ?? 0),
    0
  );

  function formatFecha(d: Date | null) {
    if (!d) return "—";
    return d.toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="p-8">
      {/* Encabezado */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
          Actas PDF
        </h1>
        <p className="text-sm text-stone-400 mt-1">
          Documentos de entrega firmados digitalmente
        </p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-black/[0.07] px-5 py-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#999891] mb-1">
            Total actas
          </p>
          <p className="text-3xl font-semibold text-stone-900">{totalActas}</p>
        </div>
        <div className="bg-white rounded-xl border border-black/[0.07] px-5 py-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#999891] mb-1">
            Doble firma
          </p>
          <p className="text-3xl font-semibold text-[#1a7a4a]">{conDosFirmas}</p>
          <p className="text-[11px] text-[#999891] mt-1">
            {totalActas > 0 ? Math.round((conDosFirmas / totalActas) * 100) : 0}% del total
          </p>
        </div>
        <div className="bg-white rounded-xl border border-black/[0.07] px-5 py-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#999891] mb-1">
            Valor neto total
          </p>
          <p className="text-3xl font-semibold text-stone-900 font-mono">
            ${valorTotal.toLocaleString("es-CO")}
          </p>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-black/[0.07] overflow-hidden">
        {actas.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-sm text-stone-400">No hay actas generadas aún</p>
            <p className="text-xs text-stone-300 mt-1">
              Las actas se crean automáticamente al aprobar un entregable
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/[0.05]">
                {["Entregable", "Contrato", "Contratista", "Aprobador", "Firmas", "Valor neto", "Fecha", ""].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 text-[11px] font-medium uppercase tracking-[0.08em] text-[#999891]"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {actas.map((acta) => {
                const tieneFirmaContratista = !!acta.firmaContratista;
                const tieneFirmaAprobador   = !!acta.firmaAprobador;
                const completa = tieneFirmaContratista && tieneFirmaAprobador;
                const valorNeto =
                  acta.entregable.pago?.valorNeto ??
                  acta.entregable.pago?.valor ??
                  0;

                return (
                  <tr
                    key={acta.id}
                    className="hover:bg-[#fafaf7] transition-colors"
                  >
                    <td className="px-5 py-3">
                      <Link
                        href={`/dashboard/contratos/${acta.entregable.contratoId}`}
                        className="text-[13px] font-medium text-[#1a1916] hover:underline"
                      >
                        {acta.entregable.nombre}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/dashboard/contratos/${acta.entregable.contratoId}`}
                        className="text-[13px] text-[#6b6a64] hover:underline truncate max-w-[160px] block"
                      >
                        {acta.entregable.contrato.titulo}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-[13px] text-[#6b6a64]">
                      {acta.entregable.contrato.contratista.nombre}
                    </td>
                    <td className="px-5 py-3 text-[13px] text-[#6b6a64]">
                      {acta.aprobador?.nombre ?? "—"}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        {/* Firma contratista */}
                        <span
                          title={`Contratista: ${tieneFirmaContratista ? formatFecha(acta.firmaContratista) : "pendiente"}`}
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                            tieneFirmaContratista
                              ? "bg-[#e6f5ed] text-[#1a7a4a]"
                              : "bg-black/[0.05] text-[#999891]"
                          }`}
                        >
                          C
                        </span>
                        {/* Firma aprobador */}
                        <span
                          title={`Aprobador: ${tieneFirmaAprobador ? formatFecha(acta.firmaAprobador) : "pendiente"}`}
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                            tieneFirmaAprobador
                              ? "bg-[#e6f5ed] text-[#1a7a4a]"
                              : "bg-black/[0.05] text-[#999891]"
                          }`}
                        >
                          A
                        </span>
                        <span
                          className={`text-[11px] font-medium px-2 py-0.5 rounded-full ml-1 ${
                            completa
                              ? "bg-[#e6f5ed] text-[#1a7a4a]"
                              : "bg-[#fef3dc] text-[#92600a]"
                          }`}
                        >
                          {completa ? "Completa" : "Pendiente"}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-mono text-[13px] font-medium text-[#1a1916]">
                        ${valorNeto.toLocaleString("es-CO")}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[12px] text-[#999891] whitespace-nowrap">
                      {formatFecha(acta.createdAt)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <a
                        href={`/api/actas/${acta.id}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#1a1916] bg-black/[0.05] hover:bg-black/[0.09] px-3 py-1.5 rounded-[6px] transition-colors"
                      >
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                          <path d="M3 2h7l4 4v9H3V2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                          <path d="M10 2v4h4" stroke="currentColor" strokeWidth="1.5"/>
                          <path d="M8 8v4M6 10l2 2 2-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                        PDF
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}