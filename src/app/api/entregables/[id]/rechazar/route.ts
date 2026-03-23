// src/app/api/entregables/[id]/rechazar/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/auditoria";
import { emailRechazado } from "@/lib/email";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "APROBADOR"].includes(session.user.rol)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const { comentario } = await req.json();

  const entregable = await prisma.entregable.findUnique({
    where: { id },
    include: { contrato: { include: { contratista: true } } },
  });

  if (!entregable) {
    return NextResponse.json({ error: "Entregable no encontrado" }, { status: 404 });
  }
  if (entregable.estado !== "EN_REVISION") {
    return NextResponse.json(
      { error: "El entregable no está en revisión" },
      { status: 400 }
    );
  }

  await prisma.entregable.update({
    where: { id },
    data: { estado: "RECHAZADO" },
  });

  await registrarAuditoria({
    usuarioId: session.user.id,
    accion: "RECHAZAR_ENTREGABLE",
    entidad: "Entregable",
    entidadId: id,
    detalle: { contratoId: entregable.contratoId, comentario },
    req,
  });

  try {
    const url = `${process.env.NEXTAUTH_URL}/portal`;
    await emailRechazado({
      contratistaNombre: entregable.contrato.contratista.nombre,
      contratistaEmail: entregable.contrato.contratista.email,
      entregableNombre: entregable.nombre,
      contratoTitulo: entregable.contrato.titulo,
      comentario,
      url,
    });
  } catch (e) {
    console.error("[EMAIL] Error:", e);
  }

  return NextResponse.json({ ok: true });
}