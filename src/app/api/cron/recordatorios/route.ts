import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { emailRecordatorio } from "@/lib/email";
import { emailAlertasCriticas } from "@/lib/email";
import { calcularAlertas } from "@/lib/alertas";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const ahora = new Date();
  const en3dias = new Date(ahora.getTime() + 3 * 24 * 60 * 60 * 1000);
  const baseUrl = process.env.NEXTAUTH_URL ?? "https://tu-dominio.com";

  let enviados = 0;
  let errores = 0;

  // ── Recordatorios a contratistas ────────────────────────────────────────────
  const entregables = await prisma.entregable.findMany({
    where: {
      estado: { in: ["PENDIENTE", "EN_REVISION"] },
      fechaLimite: { gte: ahora, lte: en3dias },
    },
    include: {
      contrato: {
        include: {
          contratista: { select: { nombre: true, email: true } },
        },
      },
    },
  });

  for (const e of entregables) {
    const ms = e.fechaLimite.getTime() - ahora.getTime();
    const diasRestantes = Math.ceil(ms / (1000 * 60 * 60 * 24));
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
    } catch {
      errores++;
    }
  }

  // ── Alertas críticas al admin ────────────────────────────────────────────────
  // Obtener todas las empresas con admin
  const empresas = await prisma.empresa.findMany({
    include: {
      usuarios: {
        where: { rol: "ADMIN" },
        select: { id: true, nombre: true, email: true },
      },
    },
  });

  for (const empresa of empresas) {
    if (empresa.usuarios.length === 0) continue;

    const alertas = await calcularAlertas(empresa.id);
    const criticas = alertas.filter((a) => a.nivel === "CRITICO");

    if (criticas.length === 0) continue;

    for (const admin of empresa.usuarios) {
      try {
        await emailAlertasCriticas({
          adminEmail: admin.email,
          adminNombre: admin.nombre,
          alertas: criticas,
          url: `${baseUrl}/dashboard`,
        });
      } catch {
        errores++;
      }
    }
  }

  return NextResponse.json({ ok: true, recordatoriosEnviados: enviados, errores });
}