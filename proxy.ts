import { NextResponse, type NextRequest } from "next/server";
import { appLocaleCookieName, getAppLocaleFromPathname } from "@/lib/i18n";

export function proxy(request: NextRequest) {
  const routeLocale = getAppLocaleFromPathname(request.nextUrl.pathname);
  if (!routeLocale) return NextResponse.next();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-easyqr-route-locale", routeLocale);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.cookies.set(appLocaleCookieName, routeLocale, {
    httpOnly: true,
    maxAge: 365 * 24 * 60 * 60,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}

export const config = {
  matcher: [
    "/cookies",
    "/cerez-politikasi",
    "/forgot-password",
    "/giris",
    "/gizlilik",
    "/kayit",
    "/kullanim-kosullari",
    "/login",
    "/ornek-menu",
    "/privacy",
    "/register",
    "/reset-password",
    "/sample-menu",
    "/sifre-sifirla",
    "/sifremi-unuttum",
    "/terms",
  ],
};
