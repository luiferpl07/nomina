/**
 * alertas.ts — Algoritmo de alertas predictivas de riesgo
 *
 * Umbral: historial >40% tarde  O  entregable vence en ≤3 días
 * con contratista en zona de riesgo (>0% historial tarde si vence en ≤1 día)
 */

import { prisma } from "@/lib/prisma";

export type NivelRiesgo = "CRITICO" | "ALTO" | "MEDIO";

export interface AlertaPredictiva {
  contratistaNombre: string;
  contratistaEmail: string;
  contratistaId: string;
  entregableId: string;
  entregableNombre: string;
  contratoTitulo: string;
  contratoId: string;
  fechaLimite: Date;
  diasRestantes: number;
  porcentajeTarde: number; // historial: % de entregas tardías
  totalEntregados: number;
  nivel: NivelRiesgo;
  motivo: string;
}

function calcularNivel(diasRestantes: number, pctTarde: number): NivelRiesgo | null {
  // CRITICO: vence hoy o mañana + tiene historial de retrasos
  if (diasRestantes <= 1 && pctTarde > 0) return "CRITICO";
  // CRITICO: vence hoy o mañana aunque no tenga historial
  if (diasRestantes <= 0) return "CRITICO";
  // ALTO: vence en ≤3 días Y historial >40%
  if (diasRestantes <= 3 && pctTarde > 40) return "ALTO";
  // ALTO: historial muy alto (>60%) aunque falten más días
  if (pctTarde > 60 && diasRestantes <= 5) return "ALTO";
  // MEDIO: historial >40% y vence en ≤7 días
  if (pctTarde > 40 && diasRestantes <= 7) return "MEDIO";
  // MEDIO: vence en ≤3 días (sin historial preocupante)
  if (diasRestantes <= 3) return "MEDIO";

  return null; // sin riesgo
}

function buildMotivo(diasRestantes: number, pctTarde: number, total: number): string {
  const partes: string[] = [];
  if (diasRestantes <= 1)
    partes.push(`Vence ${diasRestantes === 0 ? "hoy" : "mañana"}`);
  else
    partes.push(`Vence en ${diasRestantes} días`);

  if (total >= 3 && pctTarde > 40)
    partes.push(`${Math.round(pctTarde)}% de sus entregas previas fueron tardías`);
  else if (total < 3 && pctTarde > 0)
    partes.push(`Ha tenido retrasos en entregas anteriores`);

  return partes.join(" · ");
}

export async function calcularAlertas(empresaId: string): Promise<AlertaPredictiva[]> {
  const ahora = new Date();

  // 1. Traer todos los entregables pendientes/en revisión con su contratista
  const entregables = await prisma.entregable.findMany({
    where: {
      estado: { in: ["PENDIENTE", "EN_REVISION"] },
      contrato: { empresaId },
      fechaLimite: { gte: new Date(ahora.getTime() - 1000 * 60 * 60 * 24) }, // desde ayer (incluye vencidos de hoy)
    },
    include: {
      contrato: {
        include: {
          contratista: {
            select: { id: true, nombre: true, email: true },
          },
        },
      },
    },
    orderBy: { fechaLimite: "asc" },
  });

  if (entregables.length === 0) return [];

  // 2. Para cada contratista único, calcular su historial
  const contratistaIds = [...new Set(entregables.map((e) => e.contrato.contratistaId))];

  const historiales = await Promise.all(
    contratistaIds.map(async (cid) => {
      const aprobados = await prisma.entregable.findMany({
        where: {
          estado: "APROBADO",
          contrato: { contratistaId: cid, empresaId },
        },
        include: { pago: { select: { fecha: true } } },
      });

      const conFecha = aprobados.filter((e) => e.pago?.fecha);
      const tarde = conFecha.filter(
        (e) => e.pago!.fecha! > e.fechaLimite
      );

      return {
        contratistaId: cid,
        total: conFecha.length,
        porcentajeTarde: conFecha.length > 0 ? (tarde.length / conFecha.length) * 100 : 0,
      };
    })
  );

  const historialMap = new Map(historiales.map((h) => [h.contratistaId, h]));

  // 3. Evaluar cada entregable
  const alertas: AlertaPredictiva[] = [];

  for (const e of entregables) {
    const { contratista, ...contrato } = e.contrato;
    const hist = historialMap.get(contratista.id)!;

    const msRestantes = e.fechaLimite.getTime() - ahora.getTime();
    const diasRestantes = Math.ceil(msRestantes / (1000 * 60 * 60 * 24));

    const nivel = calcularNivel(diasRestantes, hist.porcentajeTarde);
    if (!nivel) continue;

    alertas.push({
      contratistaId: contratista.id,
      contratistaNombre: contratista.nombre,
      contratistaEmail: contratista.email,
      entregableId: e.id,
      entregableNombre: e.nombre,
      contratoTitulo: contrato.titulo,
      contratoId: contrato.id,
      fechaLimite: e.fechaLimite,
      diasRestantes,
      porcentajeTarde: Math.round(hist.porcentajeTarde),
      totalEntregados: hist.total,
      nivel,
      motivo: buildMotivo(diasRestantes, hist.porcentajeTarde, hist.total),
    });
  }

  // Ordenar: CRITICO > ALTO > MEDIO, luego por fecha
  const orden = { CRITICO: 0, ALTO: 1, MEDIO: 2 };
  alertas.sort((a, b) =>
    orden[a.nivel] !== orden[b.nivel]
      ? orden[a.nivel] - orden[b.nivel]
      : a.diasRestantes - b.diasRestantes
  );

  return alertas;
}