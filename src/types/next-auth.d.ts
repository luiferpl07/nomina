import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      rol: string;
      nombre: string;
      empresaId: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    rol: string;
    nombre: string;
    empresaId: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    rol: string;
    nombre: string;
    empresaId: string;
  }
}