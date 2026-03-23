import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calcularPenalizacion } from "@/lib/penalizaciones";
import { calcularMontoRetencion } from "@/lib/retencion";
import { emailRevisionAdmin, emailAprobado, emailRechazado } from "@/lib/email";

const IVA_PORCENTAJE = 19;

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { id } = await params;
    const { estado, comentario } = await req.json();

    const entregable = await prisma.entregable.findUnique({
      where: { id },
      include: {
        contrato: {
          include: {
            contratista: {
              select: { id: true, nombre: true, email: true, ivaResponsable: true },
            },
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
        }).catch(console.error);
      }
    }

    if (estado === "APROBADO") {
      const { penalizacion, bono, diasRetraso } = calcularPenalizacion(
        entregable.valor,
        entregable.fechaLimite,
        new Date()
      );

      const valorConPenalizacion = entregable.valor - penalizacion + bono;
      const esIvaResponsable = entregable.contrato.contratista.ivaResponsable;
      const iva = esIvaResponsable
        ? Math.round((valorConPenalizacion * IVA_PORCENTAJE) / 100)
        : 0;
      const retencionPorcentaje = entregable.contrato.retencionPorcentaje;
      const retencion = calcularMontoRetencion(valorConPenalizacion, retencionPorcentaje);
      const valorNeto = valorConPenalizacion + iva - retencion;

      await prisma.entregable.update({
        where: { id },
        data: {
          penalizacion: penalizacion > 0 ? -penalizacion : bono,
          diasRetraso,
        },
      });

      await prisma.acta.update({
        where: { entregableId: id },
        data: { firmaAprobador: new Date(), aprobadorId: session.user.id, comentario },
      });

      await prisma.pago.upsert({
        where: { entregableId: id },
        update: { estado: "PAGADO", fecha: new Date(), valor: valorConPenalizacion, iva, retencion, valorNeto },
        create: { entregableId: id, valor: valorConPenalizacion, iva, retencion, valorNeto, estado: "PAGADO", fecha: new Date() },
      });

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
        url: urlDetalle,
      }).catch(console.error);
    }

    if (estado === "RECHAZADO") {
      await prisma.acta.update({
        where: { entregableId: id },
        data: { comentario },
      });

      await emailRechazado({
        contratistaNombre: entregable.contrato.contratista.nombre,
        contratistaEmail: entregable.contrato.contratista.email,
        entregableNombre: entregable.nombre,
        contratoTitulo: entregable.contrato.titulo,
        comentario,
        url: urlDetalle,
      }).catch(console.error);
    }

    const actualizado = await prisma.entregable.update({
      where: { id },
      data: { estado },
    });

    return NextResponse.json(actualizado);
  } catch (error) {
    console.error("ERROR:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}