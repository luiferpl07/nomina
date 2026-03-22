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

### FASE 1.5 — UI/UX completo 🔄 EN PROGRESO
- ✅ Dashboard admin rediseñado con shadcn
- ✅ Sidebar colapsable funcionando
- ⏳ Aplicar diseño a página de contratos
- ⏳ Aplicar diseño a detalle del contrato
- ⏳ Aplicar diseño a portal del contratista
- ⏳ Aplicar diseño a página de login
- ⏳ Página de login mejorada

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
UI/UX — aplicar diseño a todas las pantallas

## Próximo paso exacto
1. Arreglar sidebar colapsable (usar SidebarWrapper)
2. Aplicar diseño shadcn a src/app/dashboard/contratos/page.tsx
3. Aplicar diseño shadcn a src/app/dashboard/contratos/[id]/page.tsx
4. Aplicar diseño shadcn a src/app/portal/page.tsx
5. Mejorar página de login

## Última sesión
21 Mar 2026 — Rediseño completo del dashboard con shadcn/ui.
Sidebar colapsable estilo Linear con fondo stone-200 exterior
y panel blanco redondeado. Acta PDF con diseño profesional.
Penalizaciones y bonos automáticos funcionando.

## Tablas que necesita la BD
- Usuario (id, nombre, email, rol, empresaId)
- Empresa (id, nombre, nit)
- Contrato (id, titulo, valorTotal, empresaId, contratistaId)
- Entregable (id, nombre, valor, fechaLimite, estado, contratoId)
- Evidencia (id, url, nombre, entregableId, subidoPorId)
- Acta (id, entregableId, firmaContratista, firmaAprobador, pdfUrl)
- Pago (id, entregableId, valor, estado, fecha)