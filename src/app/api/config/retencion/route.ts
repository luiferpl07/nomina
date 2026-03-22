import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { obtenerTarifas, TARIFAS_DIAN_DEFAULT } from "@/lib/retencion";

// GET — devuelve las tarifas actuales (para el formulario y la página de config)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const tarifas = await obtenerTarifas(session.user.empresaId);
  return NextResponse.json(tarifas);
}