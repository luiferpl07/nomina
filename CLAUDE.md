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
- Emails: Resend (instalado, no configurado aún)
- Deploy: Railway (pendiente)
- UI Components: shadcn/ui con Radix

## Notas importantes de Next.js 16
- Los params son siempre Promise — usar await params en todas las rutas dinámicas
- Después de cambiar schema de Prisma siempre correr npx prisma generate
- Comandos en PowerShell: usar New-Item en vez de touch, Remove-Item en vez de rm

## Notas de diseño UI (sistema visual activo)
- Fondo general: `bg-[#f0ede8]`
- Cards: `bg-white rounded-xl border border-black/[0.07]`
- Card hover: `hover:border-black/[0.18] hover:-translate-y-px transition-all`
- Footer de cards: `bg-[#fafaf7] border-t border-black/[0.05]`
- Topbar/breadcrumb: `bg-[#f0ede8] border-b border-black/[0.07]`
- Summary strip (métricas): flex dividido, `bg-white`, borde `border-black/[0.08]`, divide-x
- Valores monetarios: `font-mono text-[17px] font-medium tracking-[-0.5px]`
- Badges: `text-[11px] font-medium px-2.5 py-1 rounded-full`
  - Verde: `bg-[#e6f5ed] text-[#1a7a4a]`
  - Ámbar: `bg-[#fef3dc] text-[#92600a]`
  - Rojo: `bg-[#faeaea] text-[#a02020]`
  - Gris: `bg-black/[0.05] text-[#6b6a64]`
- Labels de sección: `text-[11px] font-medium uppercase tracking-[0.08em] text-[#999891]`
- Barras de progreso: `h-[3px]`, azul `#2d5be3`, verde `#1a7a4a`
- Numeración de entregables: `font-mono text-[11px] text-[#bbb9b0]` con padStart(2,"0")
- Botón primario: `bg-[#1a1916] text-white rounded-[8px] hover:opacity-85`
- Inputs: `border border-black/[0.12] rounded-[8px]` focus `border-[#2d5be3] ring-2 ring-[#2d5be3]/10`
- Sin max-width en páginas internas — el contenido ocupa todo el área disponible con `p-8`

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
- ✅ Schema de base de datos (7 tablas: Empresa, Usuario, Contrato, Entregable, Evidencia, Acta, Pago)
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

### FASE 2 — Nómina inteligente
- ⏳ Notificaciones por email con Resend
  - Email al contratista cuando entregable es aprobado/rechazado
  - Email al admin cuando contratista envía a revisión
  - Recordatorio cuando se acerca fecha límite
- ⏳ Integración DIAN nómina electrónica
  - Generación de XML según estándar DIAN
  - Transmisión y acuse de recibo
  - Gestión de rechazos
- ⏳ Retención en la fuente automática
  - Cálculo por rango de ingresos según tabla DIAN vigente
  - Configurable sin deploy
- ⏳ IVA en honorarios configurable por contratista
- ⏳ Página de configuración de penalizaciones (UI para editar reglas)

### FASE 3 — Inteligencia y reportes
- ⏳ Dashboard financiero con proyección de flujo de caja
  - Cuánto se pagará en 30/60/90 días
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

---

## Módulo en progreso
Fase 2 — Nómina inteligente

## Próximo paso exacto
1. Configurar Resend: crear src/lib/email.ts con templates
2. Conectar emails al flujo de aprobación/rechazo en la API de entregables
3. Página de configuración de penalizaciones (UI para editar reglas sin deploy)
4. Retención en la fuente automática con tabla DIAN

## Última sesión
21 Mar 2026 — Fase 1.5 UI/UX completa.
Rediseño de contratos/page.tsx, contratos/[id]/page.tsx,
portal/page.tsx y login/page.tsx con sistema visual consistente:
fondo #f0ede8, cards blancas con border black/7, summary strips,
barras de progreso de 3px, badges de colores semánticos,
valores en font-mono, sin max-width (p-8 full width).
Login con toggle de contraseña (ojito SVG).

## Tablas que necesita la BD
- Usuario (id, nombre, email, rol, empresaId)
- Empresa (id, nombre, nit)
- Contrato (id, titulo, valorTotal, empresaId, contratistaId)
- Entregable (id, nombre, valor, fechaLimite, estado, contratoId)
- Evidencia (id, url, nombre, entregableId, subidoPorId)
- Acta (id, entregableId, firmaContratista, firmaAprobador, pdfUrl)
- Pago (id, entregableId, valor, estado, fecha)