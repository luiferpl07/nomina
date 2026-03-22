import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import Sidebar from "@/components/Sidebar";

const prisma = new PrismaClient();

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const empresa = await prisma.empresa.findUnique({
    where: { id: session.user.empresaId },
    select: { nombre: true },
  });

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        rol={session.user.rol}
        nombre={session.user.nombre}
        empresaNombre={empresa?.nombre ?? ""}
      />
      <main className="flex-1 ml-56 min-h-screen">
        {children}
      </main>
    </div>
  );
}