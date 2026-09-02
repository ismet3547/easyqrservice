import {
  menuCardStyles,
  menuCategoryStyles,
  menuCornerStyles,
  menuDensities,
  menuHeroStyles,
  menuImageRatios,
  menuPriceStyles,
  type MenuTheme,
} from "@/lib/menu";

const themeFonts = ["modern", "editorial", "friendly"] as const;
const themeLayouts = ["cards", "compact", "tiles", "showcase"] as const;
const minimumContrastRatio = 4.5;

export type GeneratedThemeDesign = {
  name: string;
  summary: string;
  theme: MenuTheme;
};

export const themeDesignSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: { type: "string" },
    summary: { type: "string" },
    theme: {
      type: "object",
      additionalProperties: false,
      properties: {
        accent: { type: "string" },
        background: { type: "string" },
        cardStyle: { type: "string", enum: [...menuCardStyles] },
        categoryStyle: { type: "string", enum: [...menuCategoryStyles] },
        cornerStyle: { type: "string", enum: [...menuCornerStyles] },
        density: { type: "string", enum: [...menuDensities] },
        surface: { type: "string" },
        text: { type: "string" },
        font: { type: "string", enum: [...themeFonts] },
        heroStyle: { type: "string", enum: [...menuHeroStyles] },
        imageRatio: { type: "string", enum: [...menuImageRatios] },
        layout: { type: "string", enum: [...themeLayouts] },
        priceStyle: { type: "string", enum: [...menuPriceStyles] },
        showDescriptions: { type: "boolean" },
        stylePreset: { type: "string", enum: ["custom"] },
      },
      required: [
        "accent",
        "background",
        "cardStyle",
        "categoryStyle",
        "cornerStyle",
        "density",
        "surface",
        "text",
        "font",
        "heroStyle",
        "imageRatio",
        "layout",
        "priceStyle",
        "showDescriptions",
        "stylePreset",
      ],
    },
  },
  required: ["name", "summary", "theme"],
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, keys: readonly string[]) {
  const actualKeys = Object.keys(value);
  return actualKeys.length === keys.length && keys.every((key) => actualKeys.includes(key));
}

function isDisplayText(value: unknown, minimumLength: number, maximumLength: number) {
  return (
    typeof value === "string" &&
    value === value.trim() &&
    value.length >= minimumLength &&
    value.length <= maximumLength &&
    !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)
  );
}

function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
}

function isOneOf<Value extends string>(value: unknown, options: readonly Value[]): value is Value {
  return typeof value === "string" && options.includes(value as Value);
}

function colorChannelToLinear(channel: number) {
  const normalized = channel / 255;
  return normalized <= 0.04045
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(color: string) {
  const red = Number.parseInt(color.slice(1, 3), 16);
  const green = Number.parseInt(color.slice(3, 5), 16);
  const blue = Number.parseInt(color.slice(5, 7), 16);
  return (
    0.2126 * colorChannelToLinear(red) +
    0.7152 * colorChannelToLinear(green) +
    0.0722 * colorChannelToLinear(blue)
  );
}

type RgbColor = {
  blue: number;
  green: number;
  red: number;
};

function hexToRgb(color: string): RgbColor {
  return {
    red: Number.parseInt(color.slice(1, 3), 16),
    green: Number.parseInt(color.slice(3, 5), 16),
    blue: Number.parseInt(color.slice(5, 7), 16),
  };
}

function rgbToHex(color: RgbColor) {
  const channel = (value: number) => Math.round(value).toString(16).padStart(2, "0");
  return `#${channel(color.red)}${channel(color.green)}${channel(color.blue)}`;
}

function mixColors(from: string, to: string, amount: number) {
  const fromRgb = hexToRgb(from);
  const toRgb = hexToRgb(to);
  return rgbToHex({
    red: fromRgb.red + (toRgb.red - fromRgb.red) * amount,
    green: fromRgb.green + (toRgb.green - fromRgb.green) * amount,
    blue: fromRgb.blue + (toRgb.blue - fromRgb.blue) * amount,
  });
}

function colorDistance(first: string, second: string) {
  const firstRgb = hexToRgb(first);
  const secondRgb = hexToRgb(second);
  return (
    (firstRgb.red - secondRgb.red) ** 2 +
    (firstRgb.green - secondRgb.green) ** 2 +
    (firstRgb.blue - secondRgb.blue) ** 2
  );
}

function hasRequiredContrast(foreground: string, backgrounds: readonly string[]) {
  return backgrounds.every(
    (background) => getColorContrastRatio(foreground, background) >= minimumContrastRatio,
  );
}

function findClosestAccessibleColor(color: string, backgrounds: readonly string[]) {
  const normalizedColor = color.toLowerCase();
  const candidates = new Set<string>([normalizedColor, "#000000", "#ffffff"]);

  for (const target of ["#000000", "#ffffff"] as const) {
    for (let step = 1; step < 100; step += 1) {
      candidates.add(mixColors(normalizedColor, target, step / 100));
    }
  }

  return [...candidates]
    .filter((candidate) => hasRequiredContrast(candidate, backgrounds))
    .sort(
      (first, second) =>
        colorDistance(normalizedColor, first) - colorDistance(normalizedColor, second),
    )[0] ?? normalizedColor;
}

function findCompatibleSurface(surface: string, background: string, foreground: string) {
  const normalizedSurface = surface.toLowerCase();
  if (hasRequiredContrast(foreground, [normalizedSurface])) return normalizedSurface;

  for (let step = 1; step <= 100; step += 1) {
    const candidate = mixColors(normalizedSurface, background, step / 100);
    if (hasRequiredContrast(foreground, [candidate])) return candidate;
  }

  return background;
}

function repairThemeAccessibility(theme: MenuTheme): MenuTheme {
  const background = theme.background.toLowerCase();
  const preferredForeground = getColorContrastRatio("#000000", background) >=
    getColorContrastRatio("#ffffff", background)
    ? "#000000"
    : "#ffffff";
  const surface = findCompatibleSurface(theme.surface, background, preferredForeground);
  const readableSurfaces = [background, surface] as const;

  return {
    ...theme,
    accent: findClosestAccessibleColor(theme.accent, readableSurfaces),
    background,
    surface,
    text: findClosestAccessibleColor(theme.text, readableSurfaces),
  };
}

export function getColorContrastRatio(first: string, second: string) {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

export function getThemeAccessibilityIssues(theme: MenuTheme) {
  const requiredPairs: Array<[string, string, string]> = [
    [theme.text, theme.background, "Metin ve arka plan kontrastı yetersiz."],
    [theme.text, theme.surface, "Metin ve kart kontrastı yetersiz."],
    [theme.accent, theme.background, "Vurgu ve arka plan kontrastı yetersiz."],
    [theme.accent, theme.surface, "Vurgu ve kart kontrastı yetersiz."],
  ];

  return requiredPairs
    .filter(
      ([foreground, background]) =>
        getColorContrastRatio(foreground, background) < minimumContrastRatio,
    )
    .map(([, , message]) => message);
}

function hasValidGeneratedThemeDesignStructure(value: unknown): value is GeneratedThemeDesign {
  if (!isRecord(value) || !hasOnlyKeys(value, ["name", "summary", "theme"])) return false;
  if (!isDisplayText(value.name, 2, 48) || !isDisplayText(value.summary, 8, 220)) return false;
  if (!isRecord(value.theme)) return false;

  const themeKeys = [
    "accent",
    "background",
    "cardStyle",
    "categoryStyle",
    "cornerStyle",
    "density",
    "surface",
    "text",
    "font",
    "heroStyle",
    "imageRatio",
    "layout",
    "priceStyle",
    "showDescriptions",
    "stylePreset",
  ] as const;
  if (!hasOnlyKeys(value.theme, themeKeys)) return false;

  const theme = value.theme;
  if (
    !isHexColor(theme.accent) ||
    !isHexColor(theme.background) ||
    !isHexColor(theme.surface) ||
    !isHexColor(theme.text) ||
    !isOneOf(theme.cardStyle, menuCardStyles) ||
    !isOneOf(theme.categoryStyle, menuCategoryStyles) ||
    !isOneOf(theme.cornerStyle, menuCornerStyles) ||
    !isOneOf(theme.density, menuDensities) ||
    !isOneOf(theme.font, themeFonts) ||
    !isOneOf(theme.heroStyle, menuHeroStyles) ||
    !isOneOf(theme.imageRatio, menuImageRatios) ||
    !isOneOf(theme.layout, themeLayouts) ||
    !isOneOf(theme.priceStyle, menuPriceStyles) ||
    typeof theme.showDescriptions !== "boolean" ||
    theme.stylePreset !== "custom"
  ) return false;

  return true;
}

export function normalizeGeneratedThemeDesign(value: unknown) {
  if (!hasValidGeneratedThemeDesignStructure(value)) return null;

  const accessibilityIssues = getThemeAccessibilityIssues(value.theme);
  const theme = accessibilityIssues.length > 0
    ? repairThemeAccessibility(value.theme)
    : {
        ...value.theme,
        accent: value.theme.accent.toLowerCase(),
        background: value.theme.background.toLowerCase(),
        surface: value.theme.surface.toLowerCase(),
        text: value.theme.text.toLowerCase(),
      };

  if (getThemeAccessibilityIssues(theme).length > 0) return null;

  return {
    design: {
      ...value,
      theme,
    } satisfies GeneratedThemeDesign,
    adjustedForAccessibility: accessibilityIssues.length > 0,
    accessibilityIssues,
  };
}

export function isValidGeneratedThemeDesign(value: unknown): value is GeneratedThemeDesign {
  return (
    hasValidGeneratedThemeDesignStructure(value) &&
    getThemeAccessibilityIssues(value.theme).length === 0
  );
}
