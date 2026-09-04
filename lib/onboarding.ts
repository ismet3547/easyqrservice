import type { StoredMenu } from "@/lib/menus";

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

export function getOnboardingProgress(menus: readonly StoredMenu[]): OnboardingProgress {
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
      description: "Hesabın ve çalışma alanın kullanıma hazır.",
      id: "account",
      label: "Hesap hazır",
    },
    {
      complete: hasMenu,
      description: hasMenu
        ? `${menus.length} menü çalışma alanına eklendi.`
        : "PDF veya fotoğraf yükle ya da örnek menüyle başla.",
      id: "menu",
      label: "Menünü oluştur",
    },
    {
      complete: hasPublishedMenu,
      description: hasPublishedMenu
        ? `${publishedMenus.length} menü müşterilere açık.`
        : "İçeriği kontrol et ve kalıcı menü bağlantını aç.",
      id: "publish",
      label: "Menünü yayınla",
    },
    {
      complete: hasFirstScan,
      description: hasFirstScan
        ? `${totalViews.toLocaleString("tr-TR")} menü görüntülenmesi alındı.`
        : "QR kodunu bir telefonla test et ve müşterilerinle paylaş.",
      id: "scan",
      label: "İlk taramayı al",
    },
  ];

  const completedSteps = steps.filter((step) => step.complete).length;
  let nextAction: OnboardingAction;

  if (!hasMenu) {
    nextAction = {
      description: "Mevcut menü dosyanı yükle; ürünleri ve fiyatları yapay zekâ ayırsın.",
      href: "/studio?new=1&onboarding=1",
      label: "İlk menünü oluştur",
      title: "Menünü içeri aktar",
    };
  } else if (!hasPublishedMenu) {
    nextAction = {
      description: "Seçili taslak Studio’da açılacak ve yayın öncesi kontrol doğrudan gösterilecek.",
      href: `/studio?menu=${firstMenu.id}&onboarding=1&publish=1`,
      label: "Yayınlama kontrolünü aç",
      title: `“${firstMenu.name}” taslağını yayınla`,
    };
  } else if (!hasFirstScan) {
    nextAction = {
      description: "QR kodunu indir, farklı bir telefonla okut ve masalarda kullanmaya başla.",
      href: `/dashboard/menus/${firstPublishedMenu.id}/qr?onboarding=1`,
      label: "QR Baskı Merkezi",
      title: "İlk taramayı yap",
    };
  } else {
    nextAction = {
      description: "Ziyaret kaynaklarını ve en çok görüntülenen menülerini takip et.",
      href: "/dashboard/analytics",
      label: "Analitiği görüntüle",
      title: "Menünü büyüt",
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
