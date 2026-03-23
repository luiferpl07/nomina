// src/lib/auditoria.ts
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export type AccionAuditoria =
  | "CREAR_CONTRATO"
  | "APROBAR_ENTREGABLE"
  | "RECHAZAR_ENTREGABLE"
  | "ENVIAR_REVISION"
  | "SUBIR_EVIDENCIA"
  | "CREAR_USUARIO"
  | "CAMBIAR_ROL"
  | "CONFIG_PENALIZACION"
  | "CONFIG_RETENCION"
  | "CONFIG_IVA"
  | "GENERAR_ACTA";

interface RegistrarAuditoriaParams {
  usuarioId: string;
  accion: AccionAuditoria;
  entidad: string;
  entidadId: string;
  detalle?: Record<string, unknown>;
  req?: NextRequest;
}

export async function registrarAuditoria({
  usuarioId,
  accion,
  entidad,
  entidadId,
  detalle,
  req,
}: RegistrarAuditoriaParams) {
  try {
    const ip =
      req?.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req?.headers.get("x-real-ip") ||
      "desconocida";

    await prisma.auditoriaLog.create({
      data: {
        usuarioId,
        accion,
        entidad,
        entidadId,
        detalle: detalle ?? {},
        ip,
      },
    });
  } catch (error) {
    // No bloquear el flujo principal si falla el log
    console.error("[AUDITORIA] Error al registrar:", error);
  }
}