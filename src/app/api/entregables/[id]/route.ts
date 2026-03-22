import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { estado, comentario } = body;

  const entregable = await prisma.entregable.findUnique({
    where: { id },
    include: { contrato: true },
  });

  if (!entregable) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  if (session.user.rol === "CONTRATISTA" && estado !== "EN_REVISION") {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  if (estado === "EN_REVISION") {
    await prisma.acta.upsert({
      where: { entregableId: id },
      update: { firmaContratista: new Date() },
      create: {
        entregableId: id,
        firmaContratista: new Date(),
      },
    });
  }

  if (estado === "APROBADO") {
    await prisma.acta.update({
      where: { entregableId: id },
      data: {
        firmaAprobador: new Date(),
        aprobadorId: session.user.id,
        comentario,
      },
    });

    await prisma.pago.upsert({
      where: { entregableId: id },
      update: { estado: "PAGADO", fecha: new Date() },
      create: {
        entregableId: id,
        valor: entregable.valor,
        estado: "PAGADO",
        fecha: new Date(),
      },
    });
  }

  const actualizado = await prisma.entregable.update({
    where: { id },
    data: { estado },
  });

  return NextResponse.json(actualizado);
}