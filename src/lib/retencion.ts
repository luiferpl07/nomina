import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Tarifas DIAN 2025 para honorarios (por defecto si la empresa no tiene configuradas)
export const TARIFAS_DIAN_DEFAULT = [
  { desde: 0,        hasta: 1133000,  porcentaje: 0  },
  { desde: 1133000,  hasta: 2953000,  porcentaje: 4  },
  { desde: 2953000,  hasta: 4789000,  porcentaje: 6  },
  { desde: 4789000,  hasta: null,     porcentaje: 11 },
];

// Obtiene las tarifas de la empresa o usa los defaults DIAN
export async function obtenerTarifas(empresaId: string) {
  const tarifas = await prisma.tarifaRetencion.findMany({
    where: { empresaId },
    orderBy: { orden: "asc" },
  });

  if (tarifas.length > 0) return tarifas;
  return TARIFAS_DIAN_DEFAULT;
}

// Calcula el % de retención según el valor total del contrato
export function calcularTarifaRetencion(
  valorContrato: number,
  tarifas: { desde: number; hasta: number | null; porcentaje: number }[]
): number {
  for (const tarifa of tarifas) {
    const enRango =
      valorContrato >= tarifa.desde &&
      (tarifa.hasta === null || valorContrato < tarifa.hasta);
    if (enRango) return tarifa.porcentaje;
  }
  return 0;
}

// Calcula el monto de retención sobre un pago individual
export function calcularMontoRetencion(
  valorPago: number,
  porcentajeRetencion: number
): number {
  return Math.round((valorPago * porcentajeRetencion) / 100);
}