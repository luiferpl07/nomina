# NóminaFlow — bitácora del proyecto

## Qué es este proyecto
Sistema de nómina por entregables. En lugar de pagar quincenas,
cada contrato se divide en entregables con valor individual.
El pago se libera solo cuando el entregable es aprobado con
firma digital doble (contratista + aprobador) y evidencia adjunta.

## Stack
- Framework: Next.js 16 con App Router
- Lenguaje: TypeScript
- Estilos: Tailwind CSS + shadcn/ui (preset Nova)
- Base de datos: PostgreSQL + Prisma ORM
- Autenticación: NextAuth.js (roles: ADMIN, APROBADOR, CONTRATISTA)
- Archivos/PDFs: pdf-lib
- Emails: Resend ✅ configurado en src/lib/email.ts
- Deploy: Railway (pendiente)
- UI Components: shadcn/ui con Radix

## Notas importantes de Next.js 16
- Los params son siempre Promise — usar await params en todas las rutas dinámicas
- Después de cambiar schema de Prisma siempre correr npx prisma generate
- Comandos en PowerShell: usar New-Item en vez de touch, Remove-Item en vez de rm

## Variables de entorno necesarias
- DATABASE_URL
- NEXTAUTH_SECRET
- NEXTAUTH_URL
- RESEND_API_KEY → obtener en resend.com

## Notas de diseño UI (sistema visual activo)
- Fondo general: bg-[#f0ede8]
- Cards: bg-white rounded-xl border border-black/[0.07]
- Card hover: hover:border-black/[0.18] hover:-translate-y-px transition-all
- Footer de cards: bg-[#fafaf7] border-t border-black/[0.05]
- Topbar/breadcrumb: bg-[#f0ede8] border-b border-black/[0.07]
- Summary strip: flex dividido, bg-white, borde border-black/[0.08], divide-x
- Valores monetarios: font-mono text-[17px] font-medium tracking-[-0.5px]
- Badges: text-[11px] font-medium px-2.5 py-1 rounded-full
  - Verde: bg-[#e6f5ed] text-[#1a7a4a]
  - Ambar: bg-[#fef3dc] text-[#92600a]
  - Rojo: bg-[#faeaea] text-[#a02020]
  - Gris: bg-black/[0.05] text-[#6b6a64]
- Labels: text-[11px] font-medium uppercase tracking-[0.08em] text-[#999891]
- Barras de progreso: h-[3px], azul #2d5be3, verde #1a7a4a
- Boton primario: bg-[#1a1916] text-white rounded-[8px] hover:opacity-85
- Inputs: border border-black/[0.12] rounded-[8px] focus border-[#2d5be3] ring-2 ring-[#2d5be3]/10
- Sin max-width en paginas internas — p-8 full width

## Logica de retencion en la fuente
- Se calcula sobre el valor total del contrato al momento de crearlo
- El % queda guardado en Contrato.retencionPorcentaje
- Al aprobar cada entregable: valor - penalizacion + bono = valorConPenalizacion
- Retencion = valorConPenalizacion * retencionPorcentaje / 100
- valorNeto = valorConPenalizacion - retencion (lo que recibe el contratista)
- Tarifas DIAN 2025 default: 0% (<$1.133.000), 4%, 6%, 11% (>$4.789.000)
- Tarifas configurables por empresa en tabla TarifaRetencion

## Roles del sistema
- ADMIN: crea contratos, ve todo, configura penalizaciones, aprueba entregables
- APROBADOR: revisa entregables, firma actas, libera pagos
- CONTRATISTA: ve sus contratos, sube evidencia, firma entregas

## Usuarios de prueba
- admin@demo.com / admin123 → rol ADMIN
- juan@demo.com / juan123 → rol CONTRATISTA

## Reglas de penalizaciones (src/lib/penalizaciones.ts)
- 2% por dia de retraso, tope maximo 20%
- +1% bono por dia anticipado, tope maximo 10%

---

## ROADMAP COMPLETO

### FASE 1 — MVP core ✅ COMPLETA
- ✅ Proyecto creado con Next.js 16 + TypeScript + Tailwind
- ✅ Autenticacion con NextAuth.js (JWT + roles)
- ✅ Schema de base de datos
- ✅ Dashboard admin con metricas reales
- ✅ Portal contratista con contratos y entregables
- ✅ Flujo completo: enviar → aprobar/rechazar → pago registrado
- ✅ Acta PDF con firma doble
- ✅ Penalizaciones y bonos automaticos

### FASE 1.5 — UI/UX completo ✅ COMPLETA
- ✅ Dashboard admin rediseñado
- ✅ Sidebar colapsable
- ✅ Contratos, detalle, portal y login rediseñados

### FASE 2 — Nomina inteligente 🔄 EN PROGRESO
- ✅ Emails con Resend (revision, aprobado, rechazado)
- ✅ Configuracion de penalizaciones desde UI
- ✅ Retencion en la fuente automatica por contrato
  - ✅ src/lib/retencion.ts con tarifas DIAN 2025
  - ✅ Contrato.retencionPorcentaje calculado al crear
  - ✅ Pago con campos retencion y valorNeto
  - ✅ Preview en NuevoContratoForm
  - ✅ Email aprobado muestra desglose con retencion
- ⏳ Recordatorio por email cuando se acerca fecha limite
- ⏳ IVA en honorarios configurable por contratista
- ⏳ Integracion DIAN nomina electronica
- ⏳ Pagina de configuracion de tarifas de retencion (UI)

### FASE 3 — Inteligencia y reportes
- ⏳ Dashboard financiero con proyeccion de flujo de caja
- ⏳ Ranking de desempeno de contratistas
- ⏳ Rubricas de evaluacion al aprobar
- ⏳ Log de auditoria inmutable
- ⏳ Alertas predictivas
- ⏳ Notificaciones por WhatsApp

### FASE 4 — Escala y multiempresa
- ⏳ Arquitectura multi-tenant
- ⏳ Conciliacion bancaria
- ⏳ Plantillas de contrato reutilizables
- ⏳ API publica + webhooks
- ⏳ App movil para contratistas
- ⏳ Deploy en Railway

---

## Modulo en progreso
Fase 2 — Nomina inteligente

## Proximo paso exacto
1. Pagina UI de configuracion de tarifas de retencion
2. Recordatorio por email cuando se acerca fecha limite de entregable
3. IVA en honorarios configurable por contratista

## Ultima sesion
21 Mar 2026 — Retencion en la fuente completa.
Nuevo modelo TarifaRetencion en schema. Campo retencionPorcentaje
en Contrato. Campos retencion y valorNeto en Pago.
src/lib/retencion.ts con tarifas DIAN 2025.
Route contratos calcula tarifa al crear.
Route entregables descuenta retencion al aprobar.
NuevoContratoForm con preview de retencion en tiempo real.
Email aprobado con desglose completo.

## Tablas BD
- Usuario, Empresa, Contrato (+ retencionPorcentaje)
- Entregable, Evidencia, Acta
- Pago (+ retencion, valorNeto)
- ConfigPenalizacion, TarifaRetencion (nuevas en fase 2)