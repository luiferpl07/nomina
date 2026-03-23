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
import { calcularAlertas } from "@/lib/alertas";

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

  const todosEntregables = contratos.flatMap((c) => c.entregables);

  const totalPorPagar = todosEntregables
    .filter((e) => e.estado !== "APROBADO")
    .reduce((sum, e) => sum + e.valor, 0);

  const totalPagado = todosEntregables
    .filter((e) => e.estado === "APROBADO")
    .reduce((sum, e) => sum + (e.pago?.valor ?? e.valor), 0);

  const enRevision = todosEntregables.filter(
    (e) => e.estado === "EN_REVISION"
  ).length;

  // ── Alertas predictivas ──────────────────────────────────────────────────
  const alertas = await calcularAlertas(session.user.empresaId);
  const alertasCriticas = alertas.filter((a) => a.nivel === "CRITICO");
  const alertasAltas = alertas.filter((a) => a.nivel === "ALTO");
  const alertasMedias = alertas.filter((a) => a.nivel === "MEDIO");

  // ── Proyección de flujo de caja ──────────────────────────────────────────
  const ahora = new Date();
  const en30 = new Date(ahora); en30.setDate(ahora.getDate() + 30);
  const en60 = new Date(ahora); en60.setDate(ahora.getDate() + 60);
  const en90 = new Date(ahora); en90.setDate(ahora.getDate() + 90);

  const pendientes = todosEntregables.filter(
    (e) => e.estado !== "APROBADO" && e.estado !== "RECHAZADO"
  );

  const flujo30 = pendientes
    .filter((e) => e.fechaLimite <= en30)
    .reduce((sum, e) => sum + e.valor, 0);

  const flujo60 = pendientes
    .filter((e) => e.fechaLimite > en30 && e.fechaLimite <= en60)
    .reduce((sum, e) => sum + e.valor, 0);

  const flujo90 = pendientes
    .filter((e) => e.fechaLimite > en60 && e.fechaLimite <= en90)
    .reduce((sum, e) => sum + e.valor, 0);

  const flujoTotal = flujo30 + flujo60 + flujo90;
  const maxFlujo = Math.max(flujo30, flujo60, flujo90, 1);

  const proximosVencer = pendientes
    .filter((e) => e.fechaLimite >= ahora)
    .sort((a, b) => a.fechaLimite.getTime() - b.fechaLimite.getTime())
    .slice(0, 5)
    .map((e) => {
      const contrato = contratos.find((c) =>
        c.entregables.some((ent) => ent.id === e.id)
      );
      const dias = Math.ceil(
        (e.fechaLimite.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24)
      );
      return { ...e, contratoTitulo: contrato?.titulo ?? "", diasRestantes: dias };
    });

  const diasSemana = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
  const meses = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  const hoy = new Date();
  const fechaTexto = `${diasSemana[hoy.getDay()]}, ${hoy.getDate()} de ${meses[hoy.getMonth()]} de ${hoy.getFullYear()}`;

  const nivelConfig = {
    CRITICO: {
      bg: "bg-red-50",
      border: "border-red-200",
      badge: "bg-[#faeaea] text-[#a02020]",
      dot: "bg-red-500",
      label: "Crítico",
    },
    ALTO: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      badge: "bg-[#fef3dc] text-[#92600a]",
      dot: "bg-amber-400",
      label: "Alto",
    },
    MEDIO: {
      bg: "bg-stone-50",
      border: "border-stone-200",
      badge: "bg-black/[0.05] text-[#6b6a64]",
      dot: "bg-stone-400",
      label: "Medio",
    },
  };

  return (
    <div className="p-8">
      {/* Encabezado */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
          Buenos días, {session.user.nombre.split(" ")[0]}
        </h1>
        <p className="text-sm text-stone-400 mt-1 capitalize">{fechaTexto}</p>
      </div>

      {/* ── Panel de alertas predictivas ─────────────────────────────────── */}
      {alertas.length > 0 && (
        <div className="mb-6">
          {/* Header del panel */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-amber-500">
                <path d="M8 2L14 13H2L8 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M8 6v3M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span className="text-sm font-semibold text-stone-900">Alertas de riesgo</span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#faeaea] text-[#a02020]">
                {alertas.length} {alertas.length === 1 ? "alerta" : "alertas"}
              </span>
            </div>
            {(alertasCriticas.length > 0 || alertasAltas.length > 0) && (
              <div className="flex items-center gap-2 text-[11px] text-stone-400">
                {alertasCriticas.length > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block"/>
                    {alertasCriticas.length} crítica{alertasCriticas.length > 1 ? "s" : ""}
                  </span>
                )}
                {alertasAltas.length > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block"/>
                    {alertasAltas.length} alta{alertasAltas.length > 1 ? "s" : ""}
                  </span>
                )}
                {alertasMedias.length > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-400 inline-block"/>
                    {alertasMedias.length} media{alertasMedias.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Lista de alertas */}
          <div className="space-y-2">
            {alertas.slice(0, 8).map((alerta) => {
              const cfg = nivelConfig[alerta.nivel];
              return (
                <Link
                  key={`${alerta.entregableId}`}
                  href={`/dashboard/contratos/${alerta.contratoId}`}
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl border ${cfg.bg} ${cfg.border} hover:opacity-90 transition-opacity`}
                >
                  {/* Dot nivel */}
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-stone-900 truncate">
                        {alerta.entregableNombre}
                      </span>
                      <span className="text-[11px] text-stone-400 truncate">
                        · {alerta.contratistaId ? alerta.contratistaNombre : ""} · {alerta.contratoTitulo}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-0.5">{alerta.motivo}</p>
                  </div>

                  {/* Badge nivel + días */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {alerta.porcentajeTarde > 0 && (
                      <span className="text-[11px] text-stone-400">
                        {alerta.porcentajeTarde}% tardías
                      </span>
                    )}
                    <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${cfg.badge}`}>
                      {cfg.label}
                    </span>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                      alerta.diasRestantes <= 1
                        ? "bg-[#faeaea] text-[#a02020]"
                        : alerta.diasRestantes <= 3
                        ? "bg-[#fef3dc] text-[#92600a]"
                        : "bg-black/[0.05] text-[#6b6a64]"
                    }`}>
                      {alerta.diasRestantes === 0
                        ? "Hoy"
                        : alerta.diasRestantes === 1
                        ? "Mañana"
                        : `${alerta.diasRestantes}d`}
                    </span>
                  </div>
                </Link>
              );
            })}
            {alertas.length > 8 && (
              <p className="text-xs text-stone-400 text-center pt-1">
                +{alertas.length - 8} alertas más
              </p>
            )}
          </div>
        </div>
      )}

      {/* Métricas */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="shadow-sm border-stone-100 hover:shadow-md transition-shadow">
          <CardHeader className="pb-1 pt-5 px-6">
            <CardTitle className="text-xs font-medium text-stone-400 uppercase tracking-wide">
              Contratos activos
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-5">
            <p className="text-4xl font-semibold text-stone-900 mt-1">
              {contratos.length}
            </p>
            <p className="text-xs text-stone-400 mt-2">en curso</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-stone-100 hover:shadow-md transition-shadow">
          <CardHeader className="pb-1 pt-5 px-6">
            <CardTitle className="text-xs font-medium text-stone-400 uppercase tracking-wide">
              Por pagar
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-5">
            <p className="text-4xl font-semibold text-stone-900 mt-1">
              ${totalPorPagar.toLocaleString()}
            </p>
            <p className="text-xs text-stone-400 mt-2">en entregables pendientes</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-stone-100 hover:shadow-md transition-shadow">
          <CardHeader className="pb-1 pt-5 px-6">
            <CardTitle className="text-xs font-medium text-stone-400 uppercase tracking-wide">
              En revisión
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-5">
            <p className="text-4xl font-semibold text-amber-500 mt-1">
              {enRevision}
            </p>
            <p className="text-xs text-stone-400 mt-2">
              {enRevision === 1 ? "entregable esperando" : "entregables esperando"}
            </p>
          </CardContent>
        </Card>

        <Card className={`shadow-sm border-stone-100 hover:shadow-md transition-shadow ${alertasCriticas.length > 0 ? "border-red-200" : ""}`}>
          <CardHeader className="pb-1 pt-5 px-6">
            <CardTitle className="text-xs font-medium text-stone-400 uppercase tracking-wide">
              {alertasCriticas.length > 0 ? "⚠ Alertas críticas" : "Total pagado"}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-5">
            {alertasCriticas.length > 0 ? (
              <>
                <p className="text-4xl font-semibold text-red-500 mt-1">
                  {alertasCriticas.length}
                </p>
                <p className="text-xs text-stone-400 mt-2">
                  {alertasCriticas.length === 1 ? "entregable en riesgo crítico" : "entregables en riesgo crítico"}
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mt-1 mb-1">
                  <p className="text-4xl font-semibold text-green-600">
                    ${totalPagado.toLocaleString()}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="text-green-600 border-green-200 bg-green-50 text-xs"
                >
                  liberado este mes
                </Badge>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Proyección de flujo de caja ──────────────────────────────────── */}
      <div className="grid grid-cols-[1fr_320px] gap-4 mb-6">
        <Card className="shadow-none border-stone-100">
          <CardHeader className="py-4 px-6 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-stone-900">
              Proyección de pagos
            </CardTitle>
            {flujoTotal > 0 && (
              <span className="text-xs text-stone-400">
                Total proyectado:{" "}
                <span className="font-medium text-stone-700">
                  ${flujoTotal.toLocaleString()}
                </span>
              </span>
            )}
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {flujoTotal === 0 ? (
              <p className="text-sm text-stone-400 py-4">
                No hay entregables pendientes en los próximos 90 días
              </p>
            ) : (
              <div className="space-y-4">
                {[
                  { label: "Próximos 30 días", valor: flujo30, color: "bg-stone-900" },
                  { label: "31 – 60 días",     valor: flujo60, color: "bg-stone-500" },
                  { label: "61 – 90 días",     valor: flujo90, color: "bg-stone-300" },
                ].map((franja) => (
                  <div key={franja.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-stone-500">{franja.label}</span>
                      <span className="text-xs font-medium text-stone-900 font-mono">
                        ${franja.valor.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${franja.color}`}
                        style={{
                          width: franja.valor > 0
                            ? `${Math.round((franja.valor / maxFlujo) * 100)}%`
                            : "0%",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Próximos por vencer */}
        <Card className="shadow-none border-stone-100">
          <CardHeader className="py-4 px-6">
            <CardTitle className="text-sm font-semibold text-stone-900">
              Por vencer
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {proximosVencer.length === 0 ? (
              <p className="text-xs text-stone-400 px-2">Sin entregables próximos</p>
            ) : (
              <div className="space-y-1">
                {proximosVencer.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-stone-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-stone-900 truncate">
                        {e.nombre}
                      </p>
                      <p className="text-[11px] text-stone-400 truncate">
                        {e.contratoTitulo}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                      <span className="font-mono text-xs text-stone-600">
                        ${e.valor.toLocaleString()}
                      </span>
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                          e.diasRestantes <= 3
                            ? "bg-red-50 text-red-600"
                            : e.diasRestantes <= 7
                            ? "bg-amber-50 text-amber-600"
                            : "bg-stone-100 text-stone-500"
                        }`}
                      >
                        {e.diasRestantes === 0
                          ? "hoy"
                          : e.diasRestantes === 1
                          ? "mañana"
                          : `${e.diasRestantes}d`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabla de contratos */}
      <Card className="shadow-none border-stone-100">
        <CardHeader className="flex flex-row items-center justify-between py-4">
          <CardTitle className="text-sm font-semibold text-stone-900">
            Contratos
          </CardTitle>
          <Button
            asChild
            size="sm"
            className="bg-stone-900 hover:bg-stone-800 text-white h-8 text-xs"
          >
            <Link href="/dashboard/contratos">+ Nuevo</Link>
          </Button>
        </CardHeader>

        {contratos.length === 0 ? (
          <CardContent className="py-16 text-center">
            <p className="text-sm text-stone-400">No hay contratos aún</p>
            <Link
              href="/dashboard/contratos"
              className="inline-block mt-3 text-xs text-stone-900 underline underline-offset-2"
            >
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
                const aprobados = c.entregables.filter(
                  (e) => e.estado === "APROBADO"
                ).length;
                const enRevisionC = c.entregables.filter(
                  (e) => e.estado === "EN_REVISION"
                ).length;
                const progreso =
                  Math.round((aprobados / c.entregables.length) * 100) || 0;
                const pagadoC = c.entregables
                  .filter((e) => e.estado === "APROBADO")
                  .reduce((sum, e) => sum + (e.pago?.valor ?? e.valor), 0);

                // ¿Tiene alertas este contrato?
                const tieneAlerta = alertas.some((a) => a.contratoId === c.id);
                const nivelContrato = tieneAlerta
                  ? alertas.find((a) => a.contratoId === c.id)?.nivel
                  : null;

                return (
                  <TableRow
                    key={c.id}
                    className="border-stone-50 cursor-pointer hover:bg-stone-50 transition-colors"
                  >
                    <TableCell>
                      <Link href={`/dashboard/contratos/${c.id}`} className="block">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-stone-900">{c.titulo}</p>
                          {nivelContrato === "CRITICO" && (
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" title="Alerta crítica"/>
                          )}
                          {nivelContrato === "ALTO" && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" title="Alerta alta"/>
                          )}
                        </div>
                        {enRevisionC > 0 && (
                          <Badge
                            variant="outline"
                            className="mt-1 text-xs text-amber-600 border-amber-200 bg-amber-50"
                          >
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
                          <span className="text-xs text-stone-400 min-w-[32px]">
                            {progreso}%
                          </span>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/contratos/${c.id}`} className="block">
                        <p className="text-sm font-medium text-green-600">
                          ${pagadoC.toLocaleString()}
                        </p>
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/contratos/${c.id}`} className="block">
                        <p className="text-sm font-medium text-stone-900">
                          ${c.valorTotal.toLocaleString()}
                        </p>
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