import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { TARIFAS_DIAN_DEFAULT } from "@/lib/retencion";
import { prisma } from "@/lib/prisma";

// Tipo del body — hasta puede venir como number, null, o string vacío desde el form
interface TarifaInput {
  desde: number | string;
  hasta: number | string | null;
  porcentaje: number | string;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const tarifas = await prisma.tarifaRetencion.findMany({
    where: { empresaId: session.user.empresaId },
    orderBy: { orden: "asc" },
  });

  if (tarifas.length > 0) return NextResponse.json(tarifas);
  return NextResponse.json(TARIFAS_DIAN_DEFAULT);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (session.user.rol !== "ADMIN")
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

  const { tarifas } = (await req.json()) as { tarifas: TarifaInput[] };

  if (!Array.isArray(tarifas) || tarifas.length === 0)
    return NextResponse.json({ error: "Tarifas inválidas" }, { status: 400 });

  await prisma.$transaction([
    prisma.tarifaRetencion.deleteMany({
      where: { empresaId: session.user.empresaId },
    }),
    prisma.tarifaRetencion.createMany({
      data: tarifas.map((t, i) => {
        const hastaVal = t.hasta === null || t.hasta === "" || t.hasta === undefined
          ? null
          : Number(t.hasta);
        return {
          empresaId: session.user.empresaId,
          desde: Number(t.desde),
          hasta: hastaVal,
          porcentaje: Number(t.porcentaje),
          orden: i,
        };
      }),
    }),
  ]);

  return NextResponse.json({ ok: true });
}