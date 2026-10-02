import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED = ["/home", "/perfil", "/registro/activar", "/adopta", "/admin"];

const AUTH_ONLY = ["/", "/login", "/registro", "/recuperar-contrasena"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("mimanada_token")?.value;

  const isAuthOnly =
    pathname === "/" ||
    AUTH_ONLY.slice(1).some(
      (route) => pathname === route || pathname.startsWith(`${route}/`),
    );

  if (isAuthOnly && token) {
    // Permitir confirmar/activar registro aunque haya token residual
    if (
      pathname.startsWith("/registro/confirmar") ||
      pathname.startsWith("/registro/activar")
    ) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/home", request.url));
  }

  const isProtected = PROTECTED.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/home",
    "/home/:path*",
    "/perfil/:path*",
    "/registro",
    "/registro/:path*",
    "/adopta/:path*",
    "/admin",
    "/admin/:path*",
    "/login",
    "/login/:path*",
    "/recuperar-contrasena",
    "/recuperar-contrasena/:path*",
  ],
};
