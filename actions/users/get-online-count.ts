"use server";

import { onlineUserIds } from "@/lib/chess/online-tracker";

/**
 * Returns the count of currently-online users (including the caller).
 * Cheap shorthand used by widgets that want the badge number without
 * pulling the full list.
 */
export async function getOnlineCount(): Promise<number> {
  return onlineUserIds().length;
}
