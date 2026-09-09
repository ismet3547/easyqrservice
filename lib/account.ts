import { db } from "@/lib/db";

export function deleteUserAccount(userId: string) {
  return db.transaction(() => {
    // Migrated databases may predate the foreign key on ai_cache, so this is
    // deliberately explicit even though fresh databases cascade it.
    db.prepare("DELETE FROM ai_cache WHERE user_id = ?").run(userId);
    return db.prepare("DELETE FROM users WHERE id = ?").run(userId).changes === 1;
  })();
}
