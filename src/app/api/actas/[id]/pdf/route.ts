import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

const prisma = new PrismaClient();

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  const acta = await prisma.acta.findUnique({
    where: { id },
    include: {
      entregable: {
        include: {
          contrato: {
            include: {
              contratista: true,
              empresa: true,
            },
          },
        },
      },
      aprobador: true,
    },
  });

  if (!acta) return NextResponse.json({ error: "Acta no encontrada" }, { status: 404 });
  if (!acta.firmaAprobador) return NextResponse.json({ error: "Acta sin aprobar" }, { status: 400 });

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const { width, height } = page.getSize();

  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);

  const azul = rgb(0.094, 0.373, 0.647);
  const azulClaro = rgb(0.878, 0.929, 0.984);
  const verde = rgb(0.18, 0.49, 0.196);
  const verdeClaro = rgb(0.9, 0.97, 0.91);
  const gris = rgb(0.45, 0.45, 0.45);
  const grisClaro = rgb(0.96, 0.96, 0.96);
  const negro = rgb(0.1, 0.1, 0.1);
  const blanco = rgb(1, 1, 1);

  // Franja azul superior
  page.drawRectangle({ x: 0, y: height - 90, width, height: 90, color: azul });

  // Línea decorativa inferior del header
  page.drawRectangle({ x: 0, y: height - 94, width, height: 4, color: rgb(0.2, 0.6, 1) });

  // Logo / nombre
  page.drawText("NóminaFlow", {
    x: 40, y: height - 40,
    size: 26, font: fontBold, color: blanco,
  });

  page.drawText("Sistema de nómina por entregables", {
    x: 40, y: height - 62,
    size: 10, font: fontRegular, color: rgb(0.75, 0.88, 1),
  });

  // Número de acta arriba a la derecha
  page.drawText("ACTA DE ENTREGA", {
    x: width - 170, y: height - 38,
    size: 10, font: fontBold, color: rgb(0.75, 0.88, 1),
  });
  page.drawText(`#${acta.id.slice(-8).toUpperCase()}`, {
    x: width - 170, y: height - 58,
    size: 16, font: fontBold, color: blanco,
  });

  // Fecha de generación
  const fechaHoy = new Date().toLocaleDateString("es-CO", {
    day: "2-digit", month: "long", year: "numeric",
  });
  page.drawText(`Generado: ${fechaHoy}`, {
    x: width - 170, y: height - 76,
    size: 8, font: fontRegular, color: rgb(0.75, 0.88, 1),
  });

  // ---- Helper functions ----
  const drawSectionTitle = (text: string, y: number) => {
    page.drawRectangle({ x: 40, y: y - 4, width: width - 80, height: 24, color: azulClaro });
    page.drawRectangle({ x: 40, y: y - 4, width: 4, height: 24, color: azul });
    page.drawText(text, { x: 50, y: y + 4, size: 11, font: fontBold, color: azul });
    return y - 14;
  };

  const drawField = (label: string, value: string, x: number, y: number, w: number) => {
    page.drawText(label.toUpperCase(), {
      x, y: y + 2, size: 7, font: fontBold, color: gris,
    });
    page.drawText(value, {
      x, y: y - 12, size: 10, font: fontRegular, color: negro,
    });
    page.drawLine({
      start: { x, y: y - 16 },
      end: { x: x + w, y: y - 16 },
      thickness: 0.3, color: rgb(0.85, 0.85, 0.85),
    });
  };

  // ---- Sección 1: Partes ----
  let y = height - 120;
  y = drawSectionTitle("1. Partes del contrato", y);
  y -= 30;

  drawField("Empresa contratante", acta.entregable.contrato.empresa.nombre, 40, y, 240);
  drawField("NIT", acta.entregable.contrato.empresa.nit, 320, y, 220);

  y -= 45;
  drawField("Contratista", acta.entregable.contrato.contratista.nombre, 40, y, 240);
  drawField("Email", acta.entregable.contrato.contratista.email, 320, y, 220);

  // ---- Sección 2: Contrato ----
  y -= 55;
  y = drawSectionTitle("2. Datos del contrato", y);
  y -= 30;

  drawField("Nombre del proyecto", acta.entregable.contrato.titulo, 40, y, 340);
  drawField(
    "Valor total",
    `$${acta.entregable.contrato.valorTotal.toLocaleString("es-CO")} COP`,
    420, y, 130
  );

  y -= 45;
  drawField(
    "Fecha inicio",
    new Date(acta.entregable.contrato.fechaInicio).toLocaleDateString("es-CO"),
    40, y, 150
  );
  drawField(
    "Fecha fin",
    new Date(acta.entregable.contrato.fechaFin).toLocaleDateString("es-CO"),
    220, y, 150
  );

  // ---- Sección 3: Entregable ----
  y -= 55;
  y = drawSectionTitle("3. Entregable aprobado", y);
  y -= 30;

  // Caja destacada del entregable
  page.drawRectangle({
    x: 40, y: y - 55, width: width - 80, height: 65,
    color: grisClaro,
    borderColor: rgb(0.85, 0.85, 0.85),
    borderWidth: 0.5,
  });

  page.drawText(acta.entregable.nombre, {
    x: 55, y: y - 15,
    size: 14, font: fontBold, color: negro,
  });

  if (acta.entregable.descripcion) {
    page.drawText(acta.entregable.descripcion, {
      x: 55, y: y - 32,
      size: 9, font: fontRegular, color: gris,
    });
  }

  // Badge valor
  page.drawRectangle({
    x: width - 180, y: y - 42, width: 130, height: 26,
    color: azul,
  });
  page.drawText("VALOR LIBERADO", {
    x: width - 173, y: y - 30,
    size: 7, font: fontBold, color: rgb(0.75, 0.88, 1),
  });
  page.drawText(`$${acta.entregable.valor.toLocaleString("es-CO")} COP`, {
    x: width - 173, y: y - 43,
    size: 10, font: fontBold, color: blanco,
  });

  y -= 75;

  if (acta.comentario) {
    drawField("Observaciones del aprobador", acta.comentario, 40, y, width - 80);
    y -= 40;
  }

  // ---- Sección 4: Firmas ----
  y -= 20;
  y = drawSectionTitle("4. Firmas digitales", y);
  y -= 20;

  // Firma contratista
  page.drawRectangle({
    x: 40, y: y - 80, width: 235, height: 90,
    color: verdeClaro,
    borderColor: verde,
    borderWidth: 0.8,
  });

  page.drawRectangle({ x: 40, y: y - 80, width: 235, height: 6, color: verde });

  page.drawText("CONTRATISTA", {
    x: 52, y: y - 22,
    size: 8, font: fontBold, color: verde,
  });
  page.drawText(acta.entregable.contrato.contratista.nombre, {
    x: 52, y: y - 38,
    size: 12, font: fontBold, color: negro,
  });
  page.drawText(acta.entregable.contrato.contratista.email, {
    x: 52, y: y - 54,
    size: 8, font: fontRegular, color: gris,
  });
  page.drawText(
    `Firmado digitalmente el ${acta.firmaContratista
      ? new Date(acta.firmaContratista).toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" })
      : "—"}`,
    { x: 52, y: y - 70, size: 8, font: fontRegular, color: verde }
  );

  // Firma aprobador
  page.drawRectangle({
    x: 315, y: y - 80, width: 235, height: 90,
    color: verdeClaro,
    borderColor: verde,
    borderWidth: 0.8,
  });

  page.drawRectangle({ x: 315, y: y - 80, width: 235, height: 6, color: verde });

  page.drawText("APROBADOR", {
    x: 327, y: y - 22,
    size: 8, font: fontBold, color: verde,
  });
  page.drawText(acta.aprobador?.nombre ?? "Administrador", {
    x: 327, y: y - 38,
    size: 12, font: fontBold, color: negro,
  });
  page.drawText(acta.aprobador?.email ?? "", {
    x: 327, y: y - 54,
    size: 8, font: fontRegular, color: gris,
  });
  page.drawText(
    `Firmado digitalmente el ${acta.firmaAprobador
      ? new Date(acta.firmaAprobador).toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" })
      : "—"}`,
    { x: 327, y: y - 70, size: 8, font: fontRegular, color: verde }
  );

  // ---- Footer ----
  page.drawRectangle({ x: 0, y: 0, width, height: 45, color: azul });
  page.drawText(
    "Este documento tiene validez como acta de entrega y aprobación de servicios profesionales.",
    { x: 40, y: 28, size: 7, font: fontRegular, color: rgb(0.75, 0.88, 1) }
  );
  page.drawText(
    `NóminaFlow · Sistema de nómina por entregables · Generado el ${fechaHoy}`,
    { x: 40, y: 14, size: 7, font: fontRegular, color: rgb(0.6, 0.78, 1) }
  );

  const pdfBytes = await pdf.save();
  const buffer = Buffer.from(pdfBytes);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="acta-${acta.id.slice(-8)}.pdf"`,
    },
  });
}