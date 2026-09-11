import type { MenuData, MenuTheme } from "@/lib/menu";
import type { StoredMenu } from "@/lib/menus";

type SaveInput = { id: string; menu: MenuData; theme: MenuTheme; publish?: boolean };

// All studio writes share one queue. Versions are read when a request starts,
// not when it is enqueued, so slow responses cannot revert newer edits.
export function createMenuSaveQueue(send: typeof fetch = fetch) {
  let tail: Promise<unknown> = Promise.resolve();
  const versions = new Map<string, string>();
  const blocked = new Set<string>();

  return {
    acknowledge(menu: Pick<StoredMenu, "id" | "updatedAt">) {
      versions.set(menu.id, menu.updatedAt);
      blocked.delete(menu.id);
    },
    save(input: SaveInput): Promise<StoredMenu> {
      const request = tail.then(async () => {
        if (blocked.has(input.id)) {
          throw new Error("Menü başka bir sekmede değişti. Taslağını indirip sayfayı yenile.");
        }
        const version = versions.get(input.id);
        if (!version) throw new Error("Menü sürümü alınamadı. Taslağını indirip sayfayı yenile.");
        const response = await send(`/api/menus/${input.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "If-Match": `"${version}"` },
          body: JSON.stringify({ menu: input.menu, theme: input.theme, publish: input.publish }),
        });
        const result = await response.json().catch(() => null) as
          { menu?: StoredMenu; message?: string } | null;
        if (response.status === 409) blocked.add(input.id);
        if (!response.ok || !result?.menu) {
          throw new Error(result?.message || "Menü kaydedilemedi. Bağlantını kontrol edip yeniden dene.");
        }
        versions.set(input.id, result.menu.updatedAt);
        return result.menu;
      });
      tail = request.catch(() => undefined);
      return request;
    },
  };
}
