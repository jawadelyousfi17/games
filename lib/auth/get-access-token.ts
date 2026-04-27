import prisma from "../prisma/prisma";
import { auth } from "./auth-provider";

export default async function getAccessToken() {
  const session = await auth();

  if (!session?.user?.id) return null;

  const userId = session?.user?.id;

  const account = await prisma.account.findFirst({
    where: {
      userId,
      provider: "42-school",
    },
  });
  if (!account || !account.access_token || !account.expires_at) {
    return null;
  }

  const expired = Math.floor(Date.now() / 1000) >= account.expires_at + 10; // even if still has 10 secs it will refresh

  if (!expired) return account.access_token;

  try {
    const res = await fetch(`https://api.intra.42.fr/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "refresh_token",
        client_id: process.env._42_CLIENT_ID!,
        client_secret: process.env._42_CLIENT_SECRET!,
        refresh_token: account.refresh_token,
      }),
    });
    if (!res.ok) throw 1337;
    const data = await res.json();

    const newExpireAt = Math.floor(Date.now() / 1000) + (data.expires_in - 10);

    await prisma.account.update({
      where: {
        provider_providerAccountId: {
          provider: "42-school",
          providerAccountId: account.providerAccountId,
        },
      },
      data: {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: newExpireAt,
      },
    });
    return data.access_token;
  } catch (error: any) {
    return null;
  }
}
