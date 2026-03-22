import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const contratos = await prisma.contrato.findMany({
    where: { empresaId: session.user.empresaId },
    include: {
      contratista: {
        select: { nombre: true, email: true },
      },
      entregables: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(contratos);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (session.user.rol !== "ADMIN") return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

  const body = await req.json();
  const { titulo, descripcion, valorTotal, fechaInicio, fechaFin, contratistaId, entregables } = body;

  const contrato = await prisma.contrato.create({
    data: {
      titulo,
      descripcion,
      valorTotal: Number(valorTotal),
      fechaInicio: new Date(fechaInicio),
      fechaFin: new Date(fechaFin),
      empresaId: session.user.empresaId,
      contratistaId,
      entregables: {
        create: entregables.map((e: any) => ({
          nombre: e.nombre,
          descripcion: e.descripcion,
          valor: Number(e.valor),
          fechaLimite: new Date(e.fechaLimite),
        })),
      },
    },
    include: { entregables: true },
  });

  return NextResponse.json(contrato, { status: 201 });
}