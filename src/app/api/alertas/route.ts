import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { calcularAlertas } from "@/lib/alertas";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.rol === "CONTRATISTA") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const alertas = await calcularAlertas(session.user.empresaId);
  return NextResponse.json(alertas);
}