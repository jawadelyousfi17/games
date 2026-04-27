"use server";

import { auth } from "@/lib/auth/auth-provider";
import prisma from "@/lib/prisma/prisma";

export async function getUserData() {
  const session = await auth();

  if (!session || !session.user || !session.user.login) {
    return null;
  }

  const intraUser = await prisma.user.findUnique({
    where: {
      login: session.user.login,
    },
  });

  return intraUser;
}
