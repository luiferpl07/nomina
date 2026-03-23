// src/app/api/entregables/[id]/aprobar/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calcularPenalizacion, obtenerReglas } from "@/lib/penalizaciones";
import { registrarAuditoria } from "@/lib/auditoria";
import { emailAprobado } from "@/lib/email";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "APROBADOR"].includes(session.user.rol)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  // Rúbrica es requerida
  const { completitud, puntualidad, calidad, comentario } = body;
  if (!completitud || !puntualidad || !calidad) {
    return NextResponse.json(
      { error: "La rúbrica de evaluación es requerida" },
      { status: 400 }
    );
  }
  if (
    [completitud, puntualidad, calidad].some(
      (v) => !Number.isInteger(v) || v < 1 || v > 5
    )
  ) {
    return NextResponse.json(
      { error: "Cada criterio debe ser un número entre 1 y 5" },
      { status: 400 }
    );
  }

  const entregable = await prisma.entregable.findUnique({
    where: { id },
    include: {
      contrato: {
        include: {
          contratista: true,
          empresa: true,
        },
      },
    },
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

  // Calcular pago con la lógica del CLAUDE.md
  const reglas = await obtenerReglas(entregable.contrato.empresaId);
  const { penalizacion, bono } = calcularPenalizacion(
    entregable.valor,
    entregable.fechaLimite,
    new Date(), // momento de aprobación
    reglas
  );
  const valorConPenalizacion = entregable.valor - penalizacion + bono;
  const ivaResponsable = entregable.contrato.contratista.ivaResponsable ?? false;
  const iva = ivaResponsable ? Math.round(valorConPenalizacion * 0.19) : 0;
  const retencionPorcentaje = entregable.contrato.retencionPorcentaje ?? 0;
  const retencion = Math.round((valorConPenalizacion * retencionPorcentaje) / 100);
  const valorNeto = valorConPenalizacion + iva - retencion;

  // Transacción: aprobar + rúbrica + pago
  const resultado = await prisma.$transaction(async (tx) => {
    const entregableActualizado = await tx.entregable.update({
      where: { id },
      data: { estado: "APROBADO" },
    });

    const rubrica = await tx.rubrica.create({
      data: {
        entregableId: id,
        completitud,
        puntualidad,
        calidad,
        comentario: comentario ?? null,
        creadoPorId: session.user.id,
      },
    });

    const pago = await tx.pago.create({
      data: {
        entregableId: id,
        valor: valorConPenalizacion,
        iva,
        retencion,
        valorNeto,
        estado: "PENDIENTE",
        fecha: new Date(),
      },
    });

    return { entregable: entregableActualizado, rubrica, pago };
  });

  // Auditoría
  await registrarAuditoria({
    usuarioId: session.user.id,
    accion: "APROBAR_ENTREGABLE",
    entidad: "Entregable",
    entidadId: id,
    detalle: {
      contratoId: entregable.contratoId,
      valorNeto,
      penalizacion,
      bono,
      rubrica: { completitud, puntualidad, calidad },
    },
    req,
  });

  // Email al contratista
  try {
    const url = `${process.env.NEXTAUTH_URL}/portal`;
    await emailAprobado({
      contratistaNombre: entregable.contrato.contratista.nombre,
      contratistaEmail: entregable.contrato.contratista.email,
      entregableNombre: entregable.nombre,
      contratoTitulo: entregable.contrato.titulo,
      valorOriginal: entregable.valor,
      valorFinal: valorNeto,
      penalizacion,
      bono,
      iva,
      retencion,
      retencionPorcentaje,
      url,
    });
  } catch (e) {
    console.error("[EMAIL] Error:", e);
  }

  return NextResponse.json(resultado, { status: 200 });
}