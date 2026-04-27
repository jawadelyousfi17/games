"use client";

import { Button } from "@/components/ui/button";

import Lottie from "lottie-react";
import animationData from "@/public/animations/user.json";
import { loginAction } from "@/actions/auth/login";
import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginContent() {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  async function handleLogin() {
    setLoading(true);
    await loginAction(callbackUrl || undefined);
    setLoading(false);
  }

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold">Welcome back</h1>
            <p className="text-balance text-muted-foreground">
              Login to your 1337 account using Intra
            </p>
          </div>
          <div className="grid gap-4">
            <Button
              disabled={loading}
              className="w-full flex items-center gap-2"
              variant="outline"
              onClick={handleLogin}
            >
              {loading ? (
                <Spinner className="mr-2 h-4 w-4" />
              ) : (
                <img
                  src="/icons/42_logo.png"
                  alt="42 Logo"
                  className="w-5 h-5"
                />
              )}
              Sign in with Intra
            </Button>
          </div>
          <div className="mt-4 text-center text-sm">
            <p className="text-muted-foreground">
              By clicking continue, you agree to our{" "}
              <a
                href="/terms"
                className="underline underline-offset-4 hover:text-primary"
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="/privacy"
                className="underline underline-offset-4 hover:text-primary"
              >
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
      </div>
      <div className="hidden bg-muted lg:block relative">
        <div className="h-full w-full flex items-center justify-center bg-zinc-900 p-10">
          <div className="max-w-md w-full">
            <Lottie animationData={animationData} loop={true} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen grid place-items-center">
          <Spinner />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
