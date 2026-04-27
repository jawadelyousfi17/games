import { auth } from "@/lib/auth/auth-provider";

export const getUserId = async () => {
  const session = await auth();

  if (session) return session.user?.id;
  return null;
};
