import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET — obtener config actual (o defaults si no existe)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (session.user.rol !== "ADMIN") return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

  const config = await prisma.configPenalizacion.findUnique({
    where: { empresaId: session.user.empresaId },
  });

  // Si no existe aún devuelve los defaults
  return NextResponse.json(
    config ?? {
      porcentajePorDia: 2,
      topeMaximo: 20,
      bonoPorDia: 1,
      topeBonoMaximo: 10,
    }
  );
}

// POST — guardar o actualizar config
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (session.user.rol !== "ADMIN") return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

  const body = await req.json();
  const { porcentajePorDia, topeMaximo, bonoPorDia, topeBonoMaximo } = body;

  // Validaciones básicas
  if (
    porcentajePorDia < 1 || porcentajePorDia > 100 ||
    topeMaximo < 1 || topeMaximo > 100 ||
    bonoPorDia < 1 || bonoPorDia > 100 ||
    topeBonoMaximo < 1 || topeBonoMaximo > 100
  ) {
    return NextResponse.json({ error: "Valores fuera de rango (1-100)" }, { status: 400 });
  }

  const config = await prisma.configPenalizacion.upsert({
    where: { empresaId: session.user.empresaId },
    update: { porcentajePorDia, topeMaximo, bonoPorDia, topeBonoMaximo },
    create: {
      empresaId: session.user.empresaId,
      porcentajePorDia,
      topeMaximo,
      bonoPorDia,
      topeBonoMaximo,
    },
  });

  return NextResponse.json(config);
}