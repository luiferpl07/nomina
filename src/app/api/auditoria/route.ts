import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import {prisma} from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.rol === "CONTRATISTA") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const page     = Math.max(1, parseInt(sp.get("page") ?? "1"));
  const pageSize = 25;
  const accion   = sp.get("accion") ?? undefined;
  const usuarioId = sp.get("usuarioId") ?? undefined;

  const where = {
    usuario: { empresaId: session.user.empresaId },
    ...(accion    ? { accion }    : {}),
    ...(usuarioId ? { usuarioId } : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.auditoriaLog.findMany({
      where,
      include: {
        usuario: { select: { id: true, nombre: true, email: true, rol: true } },
      },
      orderBy: { creadoEn: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.auditoriaLog.count({ where }),
  ]);

  // Lista de usuarios de la empresa para el filtro
  const usuarios = await prisma.usuario.findMany({
    where: { empresaId: session.user.empresaId },
    select: { id: true, nombre: true, rol: true },
    orderBy: { nombre: "asc" },
  });

  return NextResponse.json({ logs, total, page, pageSize, usuarios });
}