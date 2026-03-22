import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { calcularPenalizacion } from "@/lib/penalizaciones";
import { calcularMontoRetencion } from "@/lib/retencion";
import {
  emailRevisionAdmin,
  emailAprobado,
  emailRechazado,
} from "@/lib/email";

const prisma = new PrismaClient();

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { estado, comentario } = body;

    const entregable = await prisma.entregable.findUnique({
      where: { id },
      include: {
        contrato: {
          include: {
            contratista: { select: { id: true, nombre: true, email: true } },
            empresa: {
              include: {
                usuarios: {
                  where: { rol: "ADMIN" },
                  select: { nombre: true, email: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!entregable)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    if (session.user.rol === "CONTRATISTA" && estado !== "EN_REVISION")
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const urlDetalle = `${baseUrl}/dashboard/contratos/${entregable.contratoId}`;

    // ── EN_REVISION ──────────────────────────────────────────────────────────
    if (estado === "EN_REVISION") {
      await prisma.acta.upsert({
        where: { entregableId: id },
        update: { firmaContratista: new Date() },
        create: { entregableId: id, firmaContratista: new Date() },
      });

      const admin = entregable.contrato.empresa.usuarios[0];
      if (admin) {
        await emailRevisionAdmin({
          adminEmail: admin.email,
          adminNombre: admin.nombre,
          contratistaNombre: entregable.contrato.contratista.nombre,
          entregableNombre: entregable.nombre,
          contratoTitulo: entregable.contrato.titulo,
          valor: entregable.valor,
          url: urlDetalle,
        }).catch((err) => console.error("Email admin error:", err));
      }
    }

    // ── APROBADO ─────────────────────────────────────────────────────────────
    if (estado === "APROBADO") {
      const fechaEntrega = new Date();
      const { penalizacion, bono, diasRetraso } = calcularPenalizacion(
        entregable.valor,
        entregable.fechaLimite,
        fechaEntrega
      );

      const valorConPenalizacion = entregable.valor - penalizacion + bono;
      const retencionPorcentaje = entregable.contrato.retencionPorcentaje;
      const retencion = calcularMontoRetencion(valorConPenalizacion, retencionPorcentaje);
      const valorNeto = valorConPenalizacion - retencion;

      await prisma.entregable.update({
        where: { id },
        data: {
          penalizacion: penalizacion > 0 ? -penalizacion : bono,
          diasRetraso,
        },
      });

      await prisma.acta.update({
        where: { entregableId: id },
        data: {
          firmaAprobador: new Date(),
          aprobadorId: session.user.id,
          comentario,
        },
      });

      await prisma.pago.upsert({
        where: { entregableId: id },
        update: {
          estado: "PAGADO",
          fecha: new Date(),
          valor: valorConPenalizacion,
          retencion,
          valorNeto,
        },
        create: {
          entregableId: id,
          valor: valorConPenalizacion,
          retencion,
          valorNeto,
          estado: "PAGADO",
          fecha: new Date(),
        },
      });

      const contratista = entregable.contrato.contratista;
      await emailAprobado({
        contratistaNombre: contratista.nombre,
        contratistaEmail: contratista.email,
        entregableNombre: entregable.nombre,
        contratoTitulo: entregable.contrato.titulo,
        valorOriginal: entregable.valor,
        valorFinal: valorNeto,
        penalizacion,
        bono,
        retencion,
        retencionPorcentaje,
        url: urlDetalle,
      }).catch((err) => console.error("Email aprobado error:", err));
    }

    // ── RECHAZADO ─────────────────────────────────────────────────────────────
    if (estado === "RECHAZADO") {
      await prisma.acta.update({
        where: { entregableId: id },
        data: { comentario },
      });

      const contratista = entregable.contrato.contratista;
      await emailRechazado({
        contratistaNombre: contratista.nombre,
        contratistaEmail: contratista.email,
        entregableNombre: entregable.nombre,
        contratoTitulo: entregable.contrato.titulo,
        comentario,
        url: urlDetalle,
      }).catch((err) => console.error("Email rechazado error:", err));
    }

    const actualizado = await prisma.entregable.update({
      where: { id },
      data: { estado },
    });

    return NextResponse.json(actualizado);
  } catch (error) {
    console.error("ERROR DETALLADO:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}