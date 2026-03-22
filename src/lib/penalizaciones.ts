export const REGLAS = {
  // % de penalización por día de retraso
  porcentajePorDia: 2,
  // Máximo % de penalización sobre el valor del entregable
  toperMaximo: 20,
  // % de bono por entrega anticipada por día
  bonoPorDia: 1,
  // Máximo % de bono
  topeBonoMaximo: 10,
};

export function calcularPenalizacion(
  valor: number,
  fechaLimite: Date,
  fechaEntrega: Date
): { penalizacion: number; bono: number; diasRetraso: number; diasAnticipado: number } {
  const msPerDia = 1000 * 60 * 60 * 24;
  const diff = Math.round(
    (fechaEntrega.getTime() - fechaLimite.getTime()) / msPerDia
  );

  if (diff > 0) {
    // Retraso
    const porcentaje = Math.min(
      diff * REGLAS.porcentajePorDia,
      REGLAS.toperMaximo
    );
    const penalizacion = Math.round((valor * porcentaje) / 100);
    return { penalizacion, bono: 0, diasRetraso: diff, diasAnticipado: 0 };
  } else if (diff < 0) {
    // Anticipado
    const diasAnticipado = Math.abs(diff);
    const porcentaje = Math.min(
      diasAnticipado * REGLAS.bonoPorDia,
      REGLAS.topeBonoMaximo
    );
    const bono = Math.round((valor * porcentaje) / 100);
    return { penalizacion: 0, bono, diasRetraso: 0, diasAnticipado };
  }

  return { penalizacion: 0, bono: 0, diasRetraso: 0, diasAnticipado: 0 };
}