export const menuEventTypes = [
  "session_start",
  "category_view",
  "product_view",
  "campaign_view",
  "search",
  "contact_click",
  "language_change",
] as const;

export type MenuEventType = (typeof menuEventTypes)[number];

export const menuContactActions = [
  "phone",
  "whatsapp",
  "directions",
  "instagram",
] as const;

export type MenuContactAction = (typeof menuContactActions)[number];

export type MenuInteractionEvent = {
  type: MenuEventType;
  categoryId?: string;
  itemId?: string;
  value?: string;
  resultCount?: number;
};

export type MenuEventBatch = {
  visitId: string;
  visitorId: string;
  events: MenuInteractionEvent[];
};
