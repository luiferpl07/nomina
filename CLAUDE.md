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

### Módulos completados
- ✅ Proyecto creado con Next.js 14 + TypeScript + Tailwind
- ✅ Estructura de carpetas y documentación inicial
- ✅ Dependencias instaladas (prisma, next-auth, pdf-lib, resend)
- ✅ Schema de base de datos creado y aplicado en PostgreSQL

## Módulo en progreso
- Autenticación con NextAuth.js (roles: admin, aprobador, contratista)

## Próximo paso exacto
Crear el sistema de autenticación:
1. src/app/api/auth/[...nextauth]/route.ts
2. src/lib/auth.ts con la configuración de NextAuth
3. src/app/login/page.tsx con el formulario

## Última sesión
21 Mar 2026 — Schema de BD creado con 7 tablas:
Empresa, Usuario, Contrato, Entregable, Evidencia, Acta, Pago.
PostgreSQL corriendo local. prisma db push exitoso.

## Tablas que necesita la BD
- Usuario (id, nombre, email, rol, empresaId)
- Empresa (id, nombre, nit)
- Contrato (id, titulo, valorTotal, empresaId, contratistaId)
- Entregable (id, nombre, valor, fechaLimite, estado, contratoId)
- Evidencia (id, url, nombre, entregableId, subidoPorId)
- Acta (id, entregableId, firmaContratista, firmaAprobador, pdfUrl)
- Pago (id, entregableId, valor, estado, fecha)