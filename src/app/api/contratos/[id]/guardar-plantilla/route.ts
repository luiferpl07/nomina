// src/app/api/contratos/[id]/guardar-plantilla/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const { titulo } = await req.json(); // nombre personalizado para la plantilla

  const contrato = await prisma.contrato.findUnique({
    where: { id },
    include: { entregables: true },
  });

  if (!contrato) {
    return NextResponse.json({ error: "Contrato no encontrado" }, { status: 404 });
  }
  if (contrato.empresaId !== session.user.empresaId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  // Convertir entregables a formato plantilla (sin fechas, con diasPlazo calculado)
  const entregablesPlantilla = contrato.entregables.map((e) => {
    const msPerDia = 1000 * 60 * 60 * 24;
    const diasPlazo = Math.max(
      1,
      Math.round(
        (e.fechaLimite.getTime() - contrato.fechaInicio.getTime()) / msPerDia
      )
    );
    return {
      nombre: e.nombre,
      descripcion: e.descripcion ?? "",
      valor: e.valor,
      diasPlazo,
    };
  });

  const plantilla = await prisma.plantillaContrato.create({
    data: {
      titulo: titulo || contrato.titulo,
      descripcion: contrato.descripcion ?? null,
      valorSugerido: contrato.valorTotal,
      empresaId: session.user.empresaId,
      entregables: entregablesPlantilla as Prisma.InputJsonValue,
    },
  });

  return NextResponse.json(plantilla, { status: 201 });
}