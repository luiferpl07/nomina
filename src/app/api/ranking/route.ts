// src/app/api/ranking/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "APROBADOR"].includes(session.user.rol)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
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

  const ranking = contratistas.map((c) => {
    const entregables = c.contratos.flatMap((co) => co.entregables);
    const aprobados = entregables.filter((e) => e.estado === "APROBADO");
    const rechazados = entregables.filter((e) => e.estado === "RECHAZADO");
    const enProgreso = entregables.filter((e) =>
      ["PENDIENTE", "EN_REVISION"].includes(e.estado)
    );

    // Puntualidad: aprobados a tiempo vs tarde
    const aTiempo = aprobados.filter(
      (e) => e.pago?.fecha && e.pago.fecha <= e.fechaLimite
    ).length;
    const puntualidadPct =
      aprobados.length > 0 ? Math.round((aTiempo / aprobados.length) * 100) : null;

    // Promedios de rúbricas
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
        ) // 0-100
      : null;

    return {
      id: c.id,
      nombre: c.nombre,
      email: c.email,
      totalEntregables: entregables.length,
      aprobados: aprobados.length,
      rechazados: rechazados.length,
      enProgreso: enProgreso.length,
      puntualidadPct,
      promedios,
      scoreGeneral,
    };
  });

  // Ordenar: con score primero (desc), luego sin score
  ranking.sort((a, b) => {
    if (a.scoreGeneral === null && b.scoreGeneral === null) return 0;
    if (a.scoreGeneral === null) return 1;
    if (b.scoreGeneral === null) return -1;
    return b.scoreGeneral - a.scoreGeneral;
  });

  return NextResponse.json(ranking);
}