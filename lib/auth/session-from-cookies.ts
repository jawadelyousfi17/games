import { prisma } from "@/lib/prisma/prisma";

/**
 * Auth.js v5 session cookie names. Browser will set the `__Secure-` prefix
 * over HTTPS; localhost dev gets the unprefixed name. Older next-auth
 * deployments may still ship the legacy `next-auth` name.
 */
const SESSION_COOKIE_NAMES = [
  "__Secure-authjs.session-token",
  "authjs.session-token",
  "__Secure-next-auth.session-token",
  "next-auth.session-token",
];

/**
 * Resolves a userId from a raw cookie header (e.g. socket.handshake.headers
 * .cookie). Returns null when no valid session is found — callers should
 * treat that as "anonymous" and apply their own gating.
 *
 * The session is validated against the Prisma `Session` table since the
 * project uses the database session strategy.
 */
export async function userIdFromCookies(
  cookieHeader: string | undefined,
): Promise<string | null> {
  if (!cookieHeader) return null;
  const cookies = parseCookieHeader(cookieHeader);
  let token: string | undefined;
  for (const name of SESSION_COOKIE_NAMES) {
    if (cookies[name]) {
      token = cookies[name];
      break;
    }
  }
  if (!token) return null;

  try {
    const session = await prisma.session.findUnique({
      where: { sessionToken: token },
      select: { userId: true, expires: true },
    });
    if (!session) return null;
    if (session.expires.getTime() <= Date.now()) return null;
    return session.userId;
  } catch {
    return null;
  }
}

/** Minimal cookie header parser — avoids pulling in a dep just for this. */
function parseCookieHeader(header: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const pair of header.split(";")) {
    const eq = pair.indexOf("=");
    if (eq === -1) continue;
    const k = pair.slice(0, eq).trim();
    const v = pair.slice(eq + 1).trim();
    if (!k) continue;
    try {
      out[k] = decodeURIComponent(v);
    } catch {
      out[k] = v;
    }
  }
  return out;
}
