// src/app/api/plantillas/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const plantilla = await prisma.plantillaContrato.findUnique({ where: { id } });
  if (!plantilla) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }
  if (plantilla.empresaId !== session.user.empresaId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  await prisma.plantillaContrato.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}