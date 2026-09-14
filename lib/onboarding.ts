import type { StoredMenu } from "@/lib/menus";
import { formatAppNumber, type AppLocale } from "@/lib/i18n";

export type OnboardingStepId = "account" | "menu" | "publish" | "scan";

export type OnboardingStep = {
  complete: boolean;
  description: string;
  id: OnboardingStepId;
  label: string;
};

export type OnboardingAction = {
  description: string;
  href: string;
  label: string;
  title: string;
};

export type OnboardingProgress = {
  completedSteps: number;
  isComplete: boolean;
  nextAction: OnboardingAction;
  percentage: number;
  steps: OnboardingStep[];
  totalSteps: number;
};

export function getStudioMenuPath(menuId: string, onboarding = false) {
  return `/studio?menu=${encodeURIComponent(menuId)}${onboarding ? "&onboarding=1" : ""}`;
}

export function getQrCenterPath(menuId: string, onboarding = false) {
  return `/dashboard/menus/${encodeURIComponent(menuId)}/qr${onboarding ? "?onboarding=1" : ""}`;
}

export function getOnboardingProgress(
  menus: readonly StoredMenu[],
  locale: AppLocale = "en",
): OnboardingProgress {
  const t = (english: string, turkish: string) => locale === "tr" ? turkish : english;
  const publishedMenus = menus.filter((menu) => menu.status === "published");
  const firstMenu = menus[0];
  const firstPublishedMenu = publishedMenus[0];
  const totalViews = menus.reduce((sum, menu) => sum + menu.viewCount, 0);
  const hasMenu = menus.length > 0;
  const hasPublishedMenu = publishedMenus.length > 0;
  const hasFirstScan = totalViews > 0;

  const steps: OnboardingStep[] = [
    {
      complete: true,
      description: t("Your account and workspace are ready.", "Hesabın ve çalışma alanın kullanıma hazır."),
      id: "account",
      label: t("Account ready", "Hesap hazır"),
    },
    {
      complete: hasMenu,
      description: hasMenu
        ? t(`${menus.length} menu${menus.length === 1 ? "" : "s"} added to your workspace.`, `${menus.length} menü çalışma alanına eklendi.`)
        : t("Upload a PDF or photo, or start with a template.", "PDF veya fotoğraf yükle ya da örnek menüyle başla."),
      id: "menu",
      label: t("Create your menu", "Menünü oluştur"),
    },
    {
      complete: hasPublishedMenu,
      description: hasPublishedMenu
        ? t(`${publishedMenus.length} menu${publishedMenus.length === 1 ? " is" : "s are"} live for guests.`, `${publishedMenus.length} menü müşterilere açık.`)
        : t("Review the content and publish your permanent menu link.", "İçeriği kontrol et ve kalıcı menü bağlantını aç."),
      id: "publish",
      label: t("Publish your menu", "Menünü yayınla"),
    },
    {
      complete: hasFirstScan,
      description: hasFirstScan
        ? t(`${formatAppNumber(locale, totalViews)} menu views received.`, `${formatAppNumber(locale, totalViews)} menü görüntülenmesi alındı.`)
        : t("Test the QR code on a phone and share it with your guests.", "QR kodunu bir telefonla test et ve müşterilerinle paylaş."),
      id: "scan",
      label: t("Get your first scan", "İlk taramayı al"),
    },
  ];

  const completedSteps = steps.filter((step) => step.complete).length;
  let nextAction: OnboardingAction;

  if (!hasMenu) {
    nextAction = {
      description: t("Upload your current menu and let AI extract the items and prices.", "Mevcut menü dosyanı yükle; ürünleri ve fiyatları yapay zekâ ayırsın."),
      href: "/studio?new=1&onboarding=1",
      label: t("Create your first menu", "İlk menünü oluştur"),
      title: t("Import your menu", "Menünü içeri aktar"),
    };
  } else if (!hasPublishedMenu) {
    nextAction = {
      description: t("Open the draft in Studio and review it before publishing.", "Seçili taslak Studio’da açılacak ve yayın öncesi kontrol doğrudan gösterilecek."),
      href: `${getStudioMenuPath(firstMenu.id, true)}&publish=1`,
      label: t("Open publish review", "Yayınlama kontrolünü aç"),
      title: t(`Publish “${firstMenu.name}”`, `“${firstMenu.name}” taslağını yayınla`),
    };
  } else if (!hasFirstScan) {
    nextAction = {
      description: t("Download the QR code, scan it on another phone, and place it at your venue.", "QR kodunu indir, farklı bir telefonla okut ve masalarda kullanmaya başla."),
      href: getQrCenterPath(firstPublishedMenu.id, true),
      label: t("Open QR Print Center", "QR Baskı Merkezi"),
      title: t("Make the first scan", "İlk taramayı yap"),
    };
  } else {
    nextAction = {
      description: t("Track traffic sources and your most-viewed menus.", "Ziyaret kaynaklarını ve en çok görüntülenen menülerini takip et."),
      href: "/dashboard/analytics",
      label: t("View analytics", "Analitiği görüntüle"),
      title: t("Grow your menu", "Menünü büyüt"),
    };
  }

  return {
    completedSteps,
    isComplete: completedSteps === steps.length,
    nextAction,
    percentage: Math.round((completedSteps / steps.length) * 100),
    steps,
    totalSteps: steps.length,
  };
}
