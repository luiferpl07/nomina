import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import {prisma} from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.rol === "CONTRATISTA") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const actas = await prisma.acta.findMany({
    where: {
      entregable: {
        contrato: { empresaId: session.user.empresaId },
      },
    },
    include: {
      entregable: {
        include: {
          contrato: {
            include: {
              contratista: { select: { nombre: true } },
            },
          },
          pago: { select: { valorNeto: true, valor: true } },
        },
      },
      aprobador: { select: { nombre: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(actas);
}