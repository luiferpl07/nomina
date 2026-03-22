import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import SidebarWrapper from "@/components/SidebarWrapper";

const prisma = new PrismaClient();

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const empresa = await prisma.empresa.findUnique({
    where: { id: session.user.empresaId },
    select: { nombre: true },
  });

  return (
    <div className="flex min-h-screen bg-stone-200 p-2 gap-2">
      <SidebarWrapper
        rol={session.user.rol}
        nombre={session.user.nombre}
        empresaNombre={empresa?.nombre ?? ""}
      />
      <main className="main-content flex-1 bg-stone-50 rounded-2xl overflow-auto">
        {children}
      </main>
    </div>
  );
}