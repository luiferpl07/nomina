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
- Emails: Resend configurado en src/lib/email.ts
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
- RESEND_API_KEY
- CRON_SECRET → string aleatorio para proteger el endpoint de cron

## Cómo configurar el cron en Railway
- Settings → Cron Jobs → Add Cron Job
- Command: curl -H "Authorization: Bearer $CRON_SECRET" https://tu-dominio.com/api/cron/recordatorios
- Schedule: 0 8 * * *

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
  - Ámbar: bg-[#fef3dc] text-[#92600a]
  - Rojo: bg-[#faeaea] text-[#a02020]
  - Gris: bg-black/[0.05] text-[#6b6a64]
- Labels: text-[11px] font-medium uppercase tracking-[0.08em] text-[#999891]
- Barras de progreso: h-[3px], azul #2d5be3, verde #1a7a4a
- Botón primario: bg-[#1a1916] text-white rounded-[8px] hover:opacity-85
- Inputs: border border-black/[0.12] rounded-[8px] focus border-[#2d5be3] ring-2
- Sin max-width en páginas internas — p-8 full width
- Dashboard usa shadcn Card/Table/Badge/Button — no cambiar a clases custom

## Lógica de cálculo de pago al aprobar entregable
1. valorConPenalizacion = valor - penalizacion + bono
2. iva = ivaResponsable ? valorConPenalizacion * 19% : 0
3. retencion = valorConPenalizacion * retencionPorcentaje%
4. valorNeto = valorConPenalizacion + iva - retencion

## Lógica de retención en la fuente
- Se calcula sobre el valor total del contrato al momento de crearlo
- El % queda guardado en Contrato.retencionPorcentaje
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
- 2% por día de retraso, tope máximo 20%
- +1% bono por día anticipado, tope máximo 10%

---

## ROADMAP COMPLETO

### FASE 1 — MVP core ✅ COMPLETA
- ✅ Proyecto creado con Next.js 16 + TypeScript + Tailwind
- ✅ Estructura de carpetas y documentación inicial
- ✅ Schema de base de datos
- ✅ Autenticación con NextAuth.js (JWT + roles)
- ✅ Middleware de protección de rutas por rol
- ✅ Dashboard admin con métricas reales
- ✅ Portal contratista con contratos y entregables reales
- ✅ API de contratos (GET y POST)
- ✅ Formulario de nuevo contrato con entregables
- ✅ Validación: suma de entregables igual al valor total
- ✅ Detalle del contrato con progreso
- ✅ Flujo completo: enviar a revisión → aprobar/rechazar → pago registrado
- ✅ Generación de acta PDF profesional con firma doble
- ✅ Penalizaciones y bonos automáticos por retraso o entrega anticipada
- ✅ Rediseño UI con shadcn/ui — estilo Linear/Notion
- ✅ Sidebar colapsable con layout flotante

### FASE 1.5 — UI/UX completo ✅ COMPLETA
- ✅ Dashboard admin rediseñado con shadcn
- ✅ Sidebar colapsable funcionando
- ✅ Aplicar diseño a página de contratos → src/app/dashboard/contratos/page.tsx
- ✅ Aplicar diseño a detalle del contrato → src/app/dashboard/contratos/[id]/page.tsx
- ✅ Aplicar diseño a portal del contratista → src/app/portal/page.tsx
- ✅ Página de login mejorada con ojito toggle → src/app/login/page.tsx

### FASE 2 — Nómina inteligente ✅ COMPLETA
- ✅ Notificaciones por email con Resend
  - ✅ Email al contratista cuando entregable es aprobado (desglose IVA + retención)
  - ✅ Email al contratista cuando entregable es rechazado (con comentario)
  - ✅ Email al admin cuando contratista envía a revisión
  - ✅ Recordatorio automático cuando se acerca fecha límite (cron diario)
- ✅ Configuración de penalizaciones desde UI
  - ✅ src/app/dashboard/penalizaciones/page.tsx
  - ✅ src/app/api/config/penalizaciones/route.ts
- ✅ Retención en la fuente automática por contrato
  - ✅ src/lib/retencion.ts con tarifas DIAN 2025
  - ✅ Contrato.retencionPorcentaje calculado al crear
  - ✅ Pago con campos retencion y valorNeto
  - ✅ Preview en NuevoContratoForm al escribir el valor total
  - ✅ Página UI para editar rangos → src/app/dashboard/retencion/page.tsx
  - ✅ src/app/api/config/retencion/route.ts
- ✅ IVA en honorarios configurable por contratista
  - ✅ Campo ivaResponsable en modelo Usuario
  - ✅ Campo iva en modelo Pago
  - ✅ Página UI con toggle por contratista → src/app/dashboard/iva/page.tsx
  - ✅ src/app/api/config/iva/route.ts
- ⏳ Integración DIAN nómina electrónica (movida a fase futura)

### FASE 3 — Inteligencia y reportes 🔄 EN PROGRESO
- ✅ Dashboard financiero con proyección de flujo de caja
  - ✅ Barras 30/60/90 días con entregables pendientes
  - ✅ Panel "Por vencer" con los 5 más cercanos y días restantes
- ⏳ Ranking de desempeño de contratistas
  - Puntualidad, calidad, rechazos
  - Historial por contratista
- ⏳ Rúbricas de evaluación al aprobar
  - Calificar completitud, puntualidad, calidad (1-5)
- ⏳ Log de auditoría inmutable
  - Quién hizo qué, desde qué IP, a qué hora
  - Exportable para auditorías legales
- ⏳ Alertas predictivas
  - Detecta contratistas en riesgo de retraso
- ⏳ Notificaciones por WhatsApp (Twilio/Meta API)

### FASE 4 — Escala y multiempresa
- ⏳ Arquitectura multi-tenant
  - Una instalación, múltiples empresas con datos aislados
- ⏳ Conciliación bancaria
  - Integración con PSE o Bancolombia API
- ⏳ Plantillas de contrato reutilizables
  - Clonar contratos con un clic
- ⏳ API pública + webhooks
  - Integración con Siigo, World Office, SAP
- ⏳ App móvil para contratistas (React Native)
  - Subir evidencia, ver pagos, firmar desde el celular
- ⏳ Deploy en Railway con dominio propio

### FASE DIAN — Nómina electrónica (futura)
- ⏳ Certificado digital para firma XML
- ⏳ Generación de XML según estándar DIAN
- ⏳ Ambiente de pruebas DIAN (habilitación)
- ⏳ Transmisión y acuse de recibo
- ⏳ Gestión de rechazos y notas de ajuste

---

## Módulo en progreso
Fase 3 — Inteligencia y reportes

## Próximo paso exacto
1. Ranking de desempeño de contratistas
2. Rúbricas de evaluación al aprobar entregable
3. Log de auditoría inmutable

## Última sesión
21 Mar 2026 — Flujo de caja en dashboard.
src/app/dashboard/page.tsx con proyección 30/60/90 días.
Barras proporcionales al máximo valor. Panel "Por vencer"
con badge rojo/ámbar/gris según urgencia (≤3d, ≤7d, resto).
Sin cambios al schema.

## Tablas BD
- Usuario (id, nombre, email, rol, empresaId, ivaResponsable)
- Empresa (id, nombre, nit)
- Contrato (id, titulo, valorTotal, empresaId, contratistaId, retencionPorcentaje)
- Entregable (id, nombre, valor, fechaLimite, estado, contratoId)
- Evidencia (id, url, nombre, entregableId, subidoPorId)
- Acta (id, entregableId, firmaContratista, firmaAprobador, pdfUrl)
- Pago (id, entregableId, valor, iva, retencion, valorNeto, estado, fecha)
- ConfigPenalizacion (id, empresaId, porcentajePorDia, topeMaximo, bonoPorDia, topeBonoMaximo)
- TarifaRetencion (id, empresaId, desde, hasta, porcentaje, orden)