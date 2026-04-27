"use server";

import getAccessToken from "@/lib/auth/get-access-token";

export type IntraUserResult =
  | { login: string; name: string; avatar: string }
  | { error: string };

export async function getUserByLogin(login: string): Promise<IntraUserResult> {
  if (!login?.trim()) return { error: "Login is required" };

  const token = await getAccessToken();
  if (!token) return { error: "Not authenticated – please log in again" };

  const res = await fetch(
    `https://api.intra.42.fr/v2/users/${encodeURIComponent(login.trim().toLowerCase())}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      // Don't cache – we always want fresh data in an admin tool
      cache: "no-store",
    },
  );

  if (res.status === 404) return { error: `No 42 user found for "${login}"` };
  if (!res.ok) return { error: `42 API error (${res.status})` };

  const data = await res.json();

  return {
    login: data.login,
    name: data.usual_full_name ?? data.displayname ?? data.login,
    avatar: data.image?.link ?? data.image?.versions?.medium ?? "",
  };
}
