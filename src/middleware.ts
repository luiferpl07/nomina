import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Si es admin intentando entrar a ruta de contratista
    if (path.startsWith("/portal") && token?.rol !== "CONTRATISTA") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Si es contratista intentando entrar al dashboard admin
    if (path.startsWith("/dashboard") && token?.rol === "CONTRATISTA") {
      return NextResponse.redirect(new URL("/portal", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/portal/:path*"],
};