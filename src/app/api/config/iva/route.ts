import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — lista contratistas con su estado IVA
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (session.user.rol !== "ADMIN")
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

  const contratistas = await prisma.usuario.findMany({
    where: { empresaId: session.user.empresaId, rol: "CONTRATISTA" },
    select: { id: true, nombre: true, email: true, ivaResponsable: true },
    orderBy: { nombre: "asc" },
  });

  return NextResponse.json(contratistas);
}

// PATCH — actualizar ivaResponsable de un contratista
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (session.user.rol !== "ADMIN")
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

  const { contratistaId, ivaResponsable } = await req.json();

  // Verificar que el contratista pertenece a la empresa
  const contratista = await prisma.usuario.findFirst({
    where: { id: contratistaId, empresaId: session.user.empresaId, rol: "CONTRATISTA" },
  });

  if (!contratista)
    return NextResponse.json({ error: "Contratista no encontrado" }, { status: 404 });

  const actualizado = await prisma.usuario.update({
    where: { id: contratistaId },
    data: { ivaResponsable },
    select: { id: true, nombre: true, email: true, ivaResponsable: true },
  });

  return NextResponse.json(actualizado);
}