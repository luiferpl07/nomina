# NóminaFlow — bitácora del proyecto

## Qué es este proyecto
Sistema de nómina por entregables. En lugar de pagar quincenas,
cada contrato se divide en entregables con valor individual.
El pago se libera solo cuando el entregable es aprobado con
firma digital doble (contratista + aprobador) y evidencia adjunta.

## Stack
- Framework: Next.js 16 con App Router
- Lenguaje: TypeScript
- Estilos: Tailwind CSS
- Base de datos: PostgreSQL + Prisma ORM
- Autenticación: NextAuth.js (roles: admin, aprobador, contratista)
- Archivos/PDFs: Cloudflare R2 + pdf-lib
- Emails: Resend
- Deploy: Railway
- Nota importante: en Next.js 16 los params son siempre una Promise,
  usar await params en todas las rutas dinámicas

## Decisiones importantes
- Valores monetarios en pesos enteros (sin decimales) en la BD
- App Router de Next.js (no Pages Router)
- Un solo repositorio para frontend y backend (monorepo)
- Los archivos de evidencia nunca se borran, solo se archivan

## Roles del sistema
- admin: crea contratos, ve todo, configura penalizaciones
- aprobador: revisa entregables, firma actas, libera pagos
- contratista: ve sus contratos, sube evidencia, firma entregas

## Módulos completados
- ✅ Proyecto creado con Next.js 16 + TypeScript + Tailwind
- ✅ Estructura de carpetas y documentación inicial
- ✅ Dependencias instaladas (prisma, next-auth, pdf-lib, resend)
- ✅ Schema de base de datos creado y aplicado en PostgreSQL
- ✅ Autenticación con NextAuth.js (JWT + roles)
- ✅ Página de login creada
- ✅ Tipos de sesión personalizados (id, rol, nombre, empresaId)
- ✅ Middleware de protección de rutas por rol
- ✅ Dashboard admin y portal contratista con datos reales
- ✅ Usuarios de prueba (admin@demo.com / juan@demo.com)
- ✅ Cerrar sesión y navegación por roles
- ✅ API de contratos (GET y POST)
- ✅ Formulario de nuevo contrato con entregables
- ✅ Validación: suma de entregables igual al valor total
- ✅ Detalle del contrato con progreso
- ✅ Flujo completo: enviar a revisión → aprobar/rechazar → pago registrado
- ✅ Generación de acta PDF profesional con firma doble
- ✅ Penalizaciones y bonos automáticos por retraso o entrega anticipada

## Módulo en progreso
- Notificaciones por email con Resend

## Próximo paso exacto
1. Crear src/lib/emails.ts con plantillas de email
2. Enviar email al contratista cuando un entregable es aprobado o rechazado
3. Enviar email al admin cuando un contratista envía a revisión

## Última sesión
21 Mar 2026 — Penalizaciones y bonos funcionando.
Sistema calcula automáticamente según días de retraso
o anticipación. Bono de $500.000 aplicado al Backend API
por entrega 30 días anticipada.

## Nota importante Next.js 16
Los params son siempre Promise — usar await params en
todas las rutas dinámicas. Después de cambiar schema
de Prisma siempre correr npx prisma generate.


## Tablas que necesita la BD
- Usuario (id, nombre, email, rol, empresaId)
- Empresa (id, nombre, nit)
- Contrato (id, titulo, valorTotal, empresaId, contratistaId)
- Entregable (id, nombre, valor, fechaLimite, estado, contratoId)
- Evidencia (id, url, nombre, entregableId, subidoPorId)
- Acta (id, entregableId, firmaContratista, firmaAprobador, pdfUrl)
- Pago (id, entregableId, valor, estado, fecha)