// src/app/dashboard/ranking/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";

function scoreBadge(score: number | null) {
  if (score === null)
    return (
      <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-black/[0.05] text-[#6b6a64]">
        Sin datos
      </span>
    );
  if (score >= 80)
    return (
      <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#e6f5ed] text-[#1a7a4a]">
        Excelente
      </span>
    );
  if (score >= 60)
    return (
      <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#fef3dc] text-[#92600a]">
        Regular
      </span>
    );
  return (
    <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#faeaea] text-[#a02020]">
      Bajo
    </span>
  );
}

function MiniBar({ value, max = 5, color = "#2d5be3" }: { value: number; max?: number; color?: string }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-[3px] bg-black/[0.06] rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[12px] font-mono font-medium text-[#1a1916]">
        {value.toFixed(1)}
      </span>
    </div>
  );
}

export default async function RankingPage() {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "APROBADOR"].includes(session.user.rol)) {
    redirect("/dashboard");
  }

  const contratistas = await prisma.usuario.findMany({
    where: { rol: "CONTRATISTA" },
    include: {
      contratos: {
        include: {
          entregables: {
            include: {
              rubrica: true,
              pago: true,
            },
          },
        },
      },
    },
  });

  const ranking = contratistas
    .map((c) => {
      const entregables = c.contratos.flatMap((co) => co.entregables);
      const aprobados = entregables.filter((e) => e.estado === "APROBADO");
      const rechazados = entregables.filter((e) => e.estado === "RECHAZADO");

      const aTiempo = aprobados.filter(
        (e) => e.pago?.fecha && e.pago.fecha <= e.fechaLimite
      ).length;
      const puntualidadPct =
        aprobados.length > 0 ? Math.round((aTiempo / aprobados.length) * 100) : null;

      const conRubrica = aprobados.filter((e) => e.rubrica);
      const promedios =
        conRubrica.length > 0
          ? {
              completitud:
                conRubrica.reduce((s, e) => s + (e.rubrica?.completitud ?? 0), 0) /
                conRubrica.length,
              puntualidad:
                conRubrica.reduce((s, e) => s + (e.rubrica?.puntualidad ?? 0), 0) /
                conRubrica.length,
              calidad:
                conRubrica.reduce((s, e) => s + (e.rubrica?.calidad ?? 0), 0) /
                conRubrica.length,
            }
          : null;

      const scoreGeneral = promedios
        ? Math.round(
            ((promedios.completitud + promedios.puntualidad + promedios.calidad) / 3) * 20
          )
        : null;

      return {
        id: c.id,
        nombre: c.nombre,
        email: c.email,
        totalEntregables: entregables.length,
        aprobados: aprobados.length,
        rechazados: rechazados.length,
        puntualidadPct,
        promedios,
        scoreGeneral,
      };
    })
    .sort((a, b) => {
      if (a.scoreGeneral === null && b.scoreGeneral === null) return 0;
      if (a.scoreGeneral === null) return 1;
      if (b.scoreGeneral === null) return -1;
      return b.scoreGeneral - a.scoreGeneral;
    });

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[20px] font-semibold text-[#1a1916]">
          Ranking de desempeño
        </h1>
        <p className="text-[13px] text-[#6b6a64] mt-0.5">
          Basado en rúbricas de evaluación, puntualidad y tasa de aprobación
        </p>
      </div>

      {ranking.length === 0 ? (
        <div className="bg-white rounded-xl border border-black/[0.07] p-12 text-center">
          <p className="text-[14px] text-[#6b6a64]">No hay contratistas registrados.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-black/[0.07] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/[0.05]">
                <th className="text-left px-5 py-3 text-[11px] font-medium uppercase tracking-[0.08em] text-[#999891]">
                  #
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-medium uppercase tracking-[0.08em] text-[#999891]">
                  Contratista
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-medium uppercase tracking-[0.08em] text-[#999891]">
                  Score
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-medium uppercase tracking-[0.08em] text-[#999891]">
                  Completitud
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-medium uppercase tracking-[0.08em] text-[#999891]">
                  Puntualidad
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-medium uppercase tracking-[0.08em] text-[#999891]">
                  Calidad
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-medium uppercase tracking-[0.08em] text-[#999891]">
                  Aprobados
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-medium uppercase tracking-[0.08em] text-[#999891]">
                  Rechazos
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-medium uppercase tracking-[0.08em] text-[#999891]">
                  A tiempo
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {ranking.map((c, i) => (
                <tr
                  key={c.id}
                  className="hover:bg-[#fafaf7] transition-colors"
                >
                  <td className="px-5 py-4 text-[13px] font-mono font-medium text-[#6b6a64]">
                    {i + 1}
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-[13px] font-medium text-[#1a1916]">{c.nombre}</p>
                    <p className="text-[11px] text-[#999891]">{c.email}</p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      {c.scoreGeneral !== null && (
                        <span className="font-mono text-[15px] font-medium tracking-[-0.5px] text-[#1a1916]">
                          {c.scoreGeneral}
                        </span>
                      )}
                      {scoreBadge(c.scoreGeneral)}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {c.promedios ? (
                      <MiniBar value={c.promedios.completitud} color="#2d5be3" />
                    ) : (
                      <span className="text-[12px] text-[#999891]">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {c.promedios ? (
                      <MiniBar value={c.promedios.puntualidad} color="#1a7a4a" />
                    ) : (
                      <span className="text-[12px] text-[#999891]">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {c.promedios ? (
                      <MiniBar value={c.promedios.calidad} color="#92600a" />
                    ) : (
                      <span className="text-[12px] text-[#999891]">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4 font-mono text-[13px] font-medium text-[#1a1916]">
                    {c.aprobados}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`font-mono text-[13px] font-medium ${
                        c.rechazados > 0 ? "text-[#a02020]" : "text-[#6b6a64]"
                      }`}
                    >
                      {c.rechazados}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {c.puntualidadPct !== null ? (
                      <span
                        className={`font-mono text-[13px] font-medium ${
                          c.puntualidadPct >= 80
                            ? "text-[#1a7a4a]"
                            : c.puntualidadPct >= 50
                            ? "text-[#92600a]"
                            : "text-[#a02020]"
                        }`}
                      >
                        {c.puntualidadPct}%
                      </span>
                    ) : (
                      <span className="text-[12px] text-[#999891]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}