// src/app/api/plantillas/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "APROBADOR"].includes(session.user.rol)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const plantillas = await prisma.plantillaContrato.findMany({
    where: { empresaId: session.user.empresaId },
    orderBy: { creadoEn: "desc" },
  });

  return NextResponse.json(plantillas);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { titulo, descripcion, valorSugerido, entregables } = body;

  if (!titulo || !entregables || !Array.isArray(entregables) || entregables.length === 0) {
    return NextResponse.json({ error: "Título y entregables son requeridos" }, { status: 400 });
  }

  const plantilla = await prisma.plantillaContrato.create({
    data: {
      titulo,
      descripcion: descripcion ?? null,
      valorSugerido: valorSugerido ?? null,
      empresaId: session.user.empresaId,
      entregables: entregables as Prisma.InputJsonValue,
    },
  });

  return NextResponse.json(plantilla, { status: 201 });
}