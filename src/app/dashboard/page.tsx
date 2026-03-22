import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-base font-medium text-gray-900">NóminaFlow</h1>
          <p className="text-xs text-gray-500">Panel de administración</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">{session.user.nombre}</span>
          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">
            {session.user.rol}
          </span>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Contratos activos</p>
            <p className="text-2xl font-medium text-gray-900">0</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Por pagar</p>
            <p className="text-2xl font-medium text-gray-900">$0</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">En revisión</p>
            <p className="text-2xl font-medium text-gray-900">0</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Pagado este mes</p>
            <p className="text-2xl font-medium text-gray-900">$0</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500 text-center py-8">
            No hay contratos aún. Crea el primero.
          </p>
        </div>
      </div>
    </div>
  );
}