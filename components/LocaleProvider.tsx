"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  defaultAppLocale,
  formatAppDate,
  formatAppNumber,
  getIntlLocale,
  type AppLocale,
} from "@/lib/i18n";

type LocaleContextValue = {
  date: (value: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  intlLocale: string;
  locale: AppLocale;
  number: (value: number, options?: Intl.NumberFormatOptions) => string;
};

const LocaleContext = createContext<LocaleContextValue>({
  date: (value, options) => formatAppDate(defaultAppLocale, value, options),
  intlLocale: getIntlLocale(defaultAppLocale),
  locale: defaultAppLocale,
  number: (value, options) => formatAppNumber(defaultAppLocale, value, options),
});

export function LocaleProvider({ children, locale }: { children: ReactNode; locale: AppLocale }) {
  return (
    <LocaleContext.Provider
      value={{
        date: (value, options) => formatAppDate(locale, value, options),
        intlLocale: getIntlLocale(locale),
        locale,
        number: (value, options) => formatAppNumber(locale, value, options),
      }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useAppLocale() {
  return useContext(LocaleContext);
}
