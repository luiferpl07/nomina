import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const prisma = new PrismaClient();

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const contratos = await prisma.contrato.findMany({
    where: { empresaId: session.user.empresaId },
    include: {
      contratista: { select: { nombre: true } },
      entregables: { include: { pago: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalPorPagar = contratos
    .flatMap((c) => c.entregables)
    .filter((e) => e.estado !== "APROBADO")
    .reduce((sum, e) => sum + e.valor, 0);

  const totalPagado = contratos
    .flatMap((c) => c.entregables)
    .filter((e) => e.estado === "APROBADO")
    .reduce((sum, e) => sum + (e.pago?.valor ?? e.valor), 0);

  const enRevision = contratos
    .flatMap((c) => c.entregables)
    .filter((e) => e.estado === "EN_REVISION").length;

  const diasSemana = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
  const meses = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  const hoy = new Date();
  const fechaTexto = `${diasSemana[hoy.getDay()]}, ${hoy.getDate()} de ${meses[hoy.getMonth()]} de ${hoy.getFullYear()}`;

  return (
    <div className="p-8">
      {/* Encabezado */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
          Buenos días, {session.user.nombre.split(" ")[0]}
        </h1>
        <p className="text-sm text-stone-400 mt-1 capitalize">{fechaTexto}</p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="shadow-sm border-stone-100 hover:shadow-md transition-shadow">
            <CardHeader className="pb-1 pt-5 px-6">
            <CardTitle className="text-xs font-medium text-stone-400 uppercase tracking-wide">Contratos activos</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-5">
            <p className="text-4xl font-semibold text-stone-900 mt-1">{contratos.length}</p>
            <p className="text-xs text-stone-400 mt-2">en curso</p>
            </CardContent>
        </Card>

        <Card className="shadow-sm border-stone-100 hover:shadow-md transition-shadow">
            <CardHeader className="pb-1 pt-5 px-6">
            <CardTitle className="text-xs font-medium text-stone-400 uppercase tracking-wide">Por pagar</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-5">
            <p className="text-4xl font-semibold text-stone-900 mt-1">${totalPorPagar.toLocaleString()}</p>
            <p className="text-xs text-stone-400 mt-2">en entregables pendientes</p>
            </CardContent>
        </Card>

        <Card className="shadow-sm border-stone-100 hover:shadow-md transition-shadow">
            <CardHeader className="pb-1 pt-5 px-6">
            <CardTitle className="text-xs font-medium text-stone-400 uppercase tracking-wide">En revisión</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-5">
            <p className="text-4xl font-semibold text-amber-500 mt-1">{enRevision}</p>
            <p className="text-xs text-stone-400 mt-2">{enRevision === 1 ? "entregable esperando" : "entregables esperando"}</p>
            </CardContent>
        </Card>

        <Card className="shadow-sm border-stone-100 hover:shadow-md transition-shadow">
            <CardHeader className="pb-1 pt-5 px-6">
            <CardTitle className="text-xs font-medium text-stone-400 uppercase tracking-wide">Total pagado</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-5">
            <div className="flex items-center gap-2 mt-1 mb-1">
                <p className="text-4xl font-semibold text-green-600">${totalPagado.toLocaleString()}</p>
            </div>
            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 text-xs">
                liberado este mes
            </Badge>
            </CardContent>
        </Card>
        </div>
      {/* Tabla de contratos */}
      <Card className="shadow-none border-stone-100">
        <CardHeader className="flex flex-row items-center justify-between py-4">
          <CardTitle className="text-sm font-semibold text-stone-900">Contratos</CardTitle>
          <Button asChild size="sm" className="bg-stone-900 hover:bg-stone-800 text-white h-8 text-xs">
            <Link href="/dashboard/contratos">+ Nuevo</Link>
          </Button>
        </CardHeader>

        {contratos.length === 0 ? (
          <CardContent className="py-16 text-center">
            <p className="text-sm text-stone-400">No hay contratos aún</p>
            <Link href="/dashboard/contratos" className="inline-block mt-3 text-xs text-stone-900 underline underline-offset-2">
              Crear el primero →
            </Link>
          </CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-stone-100 hover:bg-transparent">
                <TableHead className="text-xs text-stone-400 font-medium">Proyecto</TableHead>
                <TableHead className="text-xs text-stone-400 font-medium">Contratista</TableHead>
                <TableHead className="text-xs text-stone-400 font-medium">Progreso</TableHead>
                <TableHead className="text-xs text-stone-400 font-medium text-right">Pagado</TableHead>
                <TableHead className="text-xs text-stone-400 font-medium text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contratos.map((c) => {
                const aprobados = c.entregables.filter((e) => e.estado === "APROBADO").length;
                const enRevisionC = c.entregables.filter((e) => e.estado === "EN_REVISION").length;
                const progreso = Math.round((aprobados / c.entregables.length) * 100) || 0;
                const pagadoC = c.entregables
                  .filter((e) => e.estado === "APROBADO")
                  .reduce((sum, e) => sum + (e.pago?.valor ?? e.valor), 0);

                return (
                  <TableRow
                    key={c.id}
                    className="border-stone-50 cursor-pointer hover:bg-stone-50 transition-colors"
                  >
                    <TableCell>
                      <Link href={`/dashboard/contratos/${c.id}`} className="block">
                        <p className="text-sm font-medium text-stone-900">{c.titulo}</p>
                        {enRevisionC > 0 && (
                          <Badge variant="outline" className="mt-1 text-xs text-amber-600 border-amber-200 bg-amber-50">
                            {enRevisionC} en revisión
                          </Badge>
                        )}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/dashboard/contratos/${c.id}`} className="block">
                        <p className="text-sm text-stone-500">{c.contratista.nombre}</p>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/dashboard/contratos/${c.id}`} className="block">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-stone-900 rounded-full transition-all"
                              style={{ width: `${progreso}%` }}
                            />
                          </div>
                          <span className="text-xs text-stone-400 min-w-[32px]">{progreso}%</span>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/contratos/${c.id}`} className="block">
                        <p className="text-sm font-medium text-green-600">${pagadoC.toLocaleString()}</p>
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/contratos/${c.id}`} className="block">
                        <p className="text-sm font-medium text-stone-900">${c.valorTotal.toLocaleString()}</p>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}