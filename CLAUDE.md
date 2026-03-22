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

## Módulo en progreso
- Penalizaciones y bonificaciones automáticas

## Próximo paso exacto
1. Crear src/app/api/penalizaciones/route.ts
2. Agregar campo penalizacion en modelo Entregable
3. Calcular automáticamente al aprobar según días de retraso

## Última sesión
21 Mar 2026 — PDF del acta generado con diseño profesional.
Flujo completo funcionando: contratista entrega, admin aprueba,
acta PDF descargable con firmas digitales de ambas partes.


## Tablas que necesita la BD
- Usuario (id, nombre, email, rol, empresaId)
- Empresa (id, nombre, nit)
- Contrato (id, titulo, valorTotal, empresaId, contratistaId)
- Entregable (id, nombre, valor, fechaLimite, estado, contratoId)
- Evidencia (id, url, nombre, entregableId, subidoPorId)
- Acta (id, entregableId, firmaContratista, firmaAprobador, pdfUrl)
- Pago (id, entregableId, valor, estado, fecha)