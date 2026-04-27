import NextAuth, { DefaultSession } from "next-auth";
import FortyTwo from "next-auth/providers/42-school";
import { prisma } from "../prisma/prisma";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { User, Role, Campus } from "@/lib/generated/prisma";
import { redirect } from "next/navigation";
import { Adapter } from "@auth/core/adapters";

declare module "next-auth" {
  interface User {
    // These must match your Prisma User model exactly
    id: string;
    login: string;
    campus?: Campus | null;
    role?: Role | null;
    isEmailVerified?: boolean;
  }

  interface Session {
    user: {
      id: string;
      login: string;
      campus?: Campus | null;
      role?: Role | null;
      isEmailVerified: boolean;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/adapters" {
  interface AdapterUser {
    login: string;
    campus?: Campus | null;
    role?: Role | null;
    isEmailVerified?: boolean;
  }
}
function getCampus(name: string): Campus {
  switch (name) {
    case "Khouribga":
      return "KHOURIBGA";
    case "Benguerir":
      return "BEN_GUERIR";
    case "Tétouan":
      return "TETOUANE";
    case "Rabat":
      return "RABAT";
    default:
      return "KHOURIBGA";
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    FortyTwo({
      clientId: process.env._42_UID,
      clientSecret: process.env._42_SECRET,
      client: { token_endpoint_auth_method: "client_secret_post" },
      profile(profile) {
        return {
          id: profile.id.toString(),

          email: profile.email,
          login: profile.login,
          name: profile.usual_full_name || profile.displayname,
          image: profile.image?.link,
          campus: getCampus(profile.campus[0].name),
          role: profile.staff ? "ADMIN" : "STUDENT",
        };
      },
    }),
  ],
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async signIn({ profile }) {
      if (!profile) return false;
      const p = profile as any as { campus: { name: string }[] };
      const campus = p.campus?.[0]?.name;

      if (!["Khouribga", "Benguerir", "Tétouan", "Rabat"].includes(campus))
        return `/login/error?error=${campus} is not a moroccan campus`;
      return true;
    },
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
        session.user.login = user.login;
        session.user.campus = user.campus;
        session.user.role = user.role;
      }
      return session;
    },
  },
  debug: false,
  pages: {
    error: "/login/error",
  },
});
