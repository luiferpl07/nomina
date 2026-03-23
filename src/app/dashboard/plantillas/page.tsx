// src/app/dashboard/plantillas/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PlantillasClient } from "@/components/PlantillasClient";

export default async function PlantillasPage() {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "APROBADOR"].includes(session.user.rol)) {
    redirect("/dashboard");
  }

  const plantillas = await prisma.plantillaContrato.findMany({
    where: { empresaId: session.user.empresaId },
    orderBy: { creadoEn: "desc" },
  });

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-[20px] font-semibold text-[#1a1916]">
          Plantillas de contrato
        </h1>
        <p className="text-[13px] text-[#6b6a64] mt-0.5">
          Reutiliza contratos frecuentes con un clic
        </p>
      </div>
      <PlantillasClient plantillas={plantillas as any} isAdmin={session.user.rol === "ADMIN"} />
    </div>
  );
}