import { NextResponse } from "next/server";

import { emailRecordatorio } from "@/lib/email";
import { prisma } from "@/lib/prisma";

// Este endpoint lo llama Railway (o cualquier cron externo) una vez al día.
// Busca entregables que vencen en los próximos DIAS_AVISO días y notifica.
const DIAS_AVISO = 3;
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: Request) {
  // Verificar que la llamada viene autorizada
  const authHeader = req.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const ahora = new Date();
  const limite = new Date();
  limite.setDate(limite.getDate() + DIAS_AVISO);

  // Entregables pendientes o en revisión que vencen dentro de DIAS_AVISO días
  const entregables = await prisma.entregable.findMany({
    where: {
      estado: { in: ["PENDIENTE", "EN_REVISION"] },
      fechaLimite: {
        gte: ahora,
        lte: limite,
      },
    },
    include: {
      contrato: {
        include: {
          contratista: { select: { nombre: true, email: true } },
        },
      },
    },
  });

  if (entregables.length === 0) {
    return NextResponse.json({ enviados: 0, mensaje: "Sin recordatorios pendientes" });
  }

  let enviados = 0;
  let errores = 0;

  for (const e of entregables) {
    const diasRestantes = Math.ceil(
      (e.fechaLimite.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24)
    );

    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

    try {
      await emailRecordatorio({
        contratistaEmail: e.contrato.contratista.email,
        contratistaNombre: e.contrato.contratista.nombre,
        entregableNombre: e.nombre,
        contratoTitulo: e.contrato.titulo,
        fechaLimite: e.fechaLimite,
        diasRestantes,
        valor: e.valor,
        url: `${baseUrl}/portal`,
      });
      enviados++;
    } catch (err) {
      console.error(`Error enviando recordatorio para ${e.id}:`, err);
      errores++;
    }
  }

  return NextResponse.json({
    enviados,
    errores,
    total: entregables.length,
  });
}