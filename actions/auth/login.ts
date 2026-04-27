"use server";

import { signIn } from "@/lib/auth/auth-provider";

export async function loginAction(callbackUrl?: string) {
  await signIn("42-school", { redirectTo: callbackUrl || "/" });
}
