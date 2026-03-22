import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Crear empresa de prueba
  const empresa = await prisma.empresa.upsert({
    where: { nit: "900123456-7" },
    update: {},
    create: {
      nombre: "Empresa Demo SAS",
      nit: "900123456-7",
    },
  });

  // Crear usuario admin
  await prisma.usuario.upsert({
    where: { email: "admin@demo.com" },
    update: {},
    create: {
      nombre: "Administrador",
      email: "admin@demo.com",
      password: await bcrypt.hash("admin123", 10),
      rol: "ADMIN",
      empresaId: empresa.id,
    },
  });

  // Crear contratista de prueba
  await prisma.usuario.upsert({
    where: { email: "juan@demo.com" },
    update: {},
    create: {
      nombre: "Juan Pérez",
      email: "juan@demo.com",
      password: await bcrypt.hash("juan123", 10),
      rol: "CONTRATISTA",
      empresaId: empresa.id,
    },
  });

  console.log("Usuarios de prueba creados");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());