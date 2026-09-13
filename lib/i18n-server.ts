import { cookies, headers } from "next/headers";
import {
  appLocaleCookieName,
  isAppLocale,
  resolveAcceptLanguage,
  type AppLocale,
} from "@/lib/i18n";

export async function getRequestLocale(): Promise<AppLocale> {
  const requestHeaders = await headers();
  const routeLocale = requestHeaders.get("x-easyqr-route-locale");
  if (isAppLocale(routeLocale)) return routeLocale;

  const cookieLocale = (await cookies()).get(appLocaleCookieName)?.value;
  if (isAppLocale(cookieLocale)) return cookieLocale;

  return resolveAcceptLanguage(requestHeaders.get("accept-language"));
}
