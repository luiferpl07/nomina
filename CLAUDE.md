# NóminaFlow — bitácora del proyecto

## Qué es este proyecto
Sistema de nómina por entregables. En lugar de pagar quincenas,
cada contrato se divide en entregables con valor individual.
El pago se libera solo cuando el entregable es aprobado con
firma digital doble (contratista + aprobador) y evidencia adjunta.

## Stack
- Framework: Next.js 14 con App Router
- Lenguaje: TypeScript
- Estilos: Tailwind CSS
- Base de datos: PostgreSQL + Prisma ORM
- Autenticación: NextAuth.js (roles: admin, aprobador, contratista)
- Archivos/PDFs: Cloudflare R2 + pdf-lib
- Emails: Resend
- Deploy: Railway

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
- ✅ Proyecto creado con Next.js 14 + TypeScript + Tailwind
- ✅ Estructura de carpetas y documentación inicial
- ✅ Dependencias instaladas (prisma, next-auth, pdf-lib, resend)
- ✅ Schema de base de datos creado y aplicado en PostgreSQL
- ✅ Autenticación con NextAuth.js (JWT + roles)
- ✅ Página de login creada
- ✅ Tipos de sesión personalizados (id, rol, nombre, empresaId)
- ✅ Middleware de protección de rutas por rol
- ✅ Dashboard admin y portal contratista básicos
- ✅ Usuarios de prueba (admin@demo.com / juan@demo.com)
- ✅ Cerrar sesión y navegación por roles
- ✅ API de contratos (GET y POST)
- ✅ Formulario de nuevo contrato con entregables
- ✅ Validación: suma de entregables debe ser igual al valor total

## Módulo en progreso
- Flujo de aprobación de entregables

## Próximo paso exacto
1. Crear src/app/api/entregables/[id]/route.ts (PATCH para cambiar estado)
2. Crear src/app/dashboard/contratos/[id]/page.tsx (detalle del contrato)
3. Permitir subir evidencia y cambiar estado a EN_REVISION

## Última sesión
21 Mar 2026 — CRUD de contratos funcionando. Formulario
con validación de suma de entregables. Contrato de prueba
creado con Juan Pérez por $10.000.000.
## Tablas que necesita la BD
- Usuario (id, nombre, email, rol, empresaId)
- Empresa (id, nombre, nit)
- Contrato (id, titulo, valorTotal, empresaId, contratistaId)
- Entregable (id, nombre, valor, fechaLimite, estado, contratoId)
- Evidencia (id, url, nombre, entregableId, subidoPorId)
- Acta (id, entregableId, firmaContratista, firmaAprobador, pdfUrl)
- Pago (id, entregableId, valor, estado, fecha)