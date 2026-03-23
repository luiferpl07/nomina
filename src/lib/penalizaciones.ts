import { prisma } from "@/lib/prisma";

// Defaults hardcodeados como fallback
export const REGLAS_DEFAULT = {
  porcentajePorDia: 2,
  topeMaximo: 20,
  bonoPorDia: 1,
  topeBonoMaximo: 10,
};

// Obtiene las reglas desde BD o usa los defaults
export async function obtenerReglas(empresaId: string) {
  const config = await prisma.configPenalizacion.findUnique({
    where: { empresaId },
  });
  return config ?? REGLAS_DEFAULT;
}

export function calcularPenalizacion(
  valor: number,
  fechaLimite: Date,
  fechaEntrega: Date,
  reglas = REGLAS_DEFAULT
): { penalizacion: number; bono: number; diasRetraso: number; diasAnticipado: number } {
  const msPerDia = 1000 * 60 * 60 * 24;
  const diff = Math.round(
    (fechaEntrega.getTime() - fechaLimite.getTime()) / msPerDia
  );

  if (diff > 0) {
    const porcentaje = Math.min(
      diff * reglas.porcentajePorDia,
      reglas.topeMaximo
    );
    const penalizacion = Math.round((valor * porcentaje) / 100);
    return { penalizacion, bono: 0, diasRetraso: diff, diasAnticipado: 0 };
  } else if (diff < 0) {
    const diasAnticipado = Math.abs(diff);
    const porcentaje = Math.min(
      diasAnticipado * reglas.bonoPorDia,
      reglas.topeBonoMaximo
    );
    const bono = Math.round((valor * porcentaje) / 100);
    return { penalizacion: 0, bono, diasRetraso: 0, diasAnticipado };
  }

  return { penalizacion: 0, bono: 0, diasRetraso: 0, diasAnticipado: 0 };
}