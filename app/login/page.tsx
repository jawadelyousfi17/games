"use client";

import Link from "next/link";
import { useTransition, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Crown, ArrowLeft } from "lucide-react";
import { loginAction } from "@/actions/auth/login";
import { Spinner } from "@/components/ui/spinner";
import { LobbyBoardPreview } from "@/components/chess/lobby-board-preview";

function LoginContent() {
  // useTransition flips `isPending` synchronously and React paints the
  // loading UI before the server action runs — plain setState was racing
  // with the redirect response and never made it to the screen.
  const [isPending, startTransition] = useTransition();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  function handleLogin() {
    startTransition(async () => {
      await loginAction(callbackUrl || undefined);
    });
  }
  const loading = isPending;

  return (
    <div className="relative grid min-h-screen bg-navy-950 text-navy-50 lg:grid-cols-[1fr_minmax(0,1.1fr)]">
      {/* Left: form */}
      <div className="flex flex-col px-6 py-10 sm:px-12 lg:px-16">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2 text-[13px] font-semibold text-navy-300 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.25} />
          Back to home
        </Link>

        <div className="m-auto w-full max-w-[400px]">
          <div className="mb-10 flex items-center gap-3 text-white">
            <Crown
              className="h-8 w-8 shrink-0 text-brand-lime"
              strokeWidth={2.25}
            />
            <span className="text-[20px] font-extrabold tracking-tight">
              Chess
            </span>
          </div>

          <div className="text-[11px] uppercase tracking-[0.18em] text-navy-300">
            Welcome back
          </div>
          <h1 className="mt-2 text-[clamp(32px,4vw,44px)] font-extrabold leading-[1.05] tracking-tight text-white">
            Sign in with your intra
          </h1>
          <p className="mt-3 max-w-[360px] text-[14px] leading-relaxed text-navy-200">
            One click. Your 1337 identity is your only account — no password, no
            email confirmation.
          </p>

          <button
            type="button"
            onClick={handleLogin}
            disabled={loading}
            aria-busy={loading}
            className="btn-3d-lime mt-8 flex h-14 w-full items-center justify-center gap-3 rounded-md text-[15px] font-bold text-navy-950 disabled:cursor-progress"
          >
            {loading ? (
              <>
                <Spinner className="h-5 w-5" />
                Redirecting to intra…
              </>
            ) : (
              <>
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-navy-950 text-[12px] font-extrabold text-brand-lime">
                  42
                </span>
                Continue with intra
              </>
            )}
          </button>

          <p className="mt-6 text-[12px] leading-relaxed text-navy-400">
            By continuing you agree to our{" "}
            <Link
              href="/terms"
              className="text-navy-200 underline underline-offset-4 hover:text-white"
            >
              Terms
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="text-navy-200 underline underline-offset-4 hover:text-white"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>

        <div className="mt-10 text-[11px] uppercase tracking-wider text-navy-500">
          1337 students only · Khouribga · Benguerir · Rabat · Tétouan
        </div>
      </div>

      {/* Right: dark stage with chessboard preview */}
      <div className="relative hidden overflow-hidden border-l border-white/5 bg-navy-900 lg:block">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 left-1/2 h-[600px] w-[800px] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
          style={{
            background:
              "radial-gradient(circle at center, rgba(129,182,76,0.35), transparent 60%)",
          }}
        />
        <div className="relative flex h-full items-center justify-center p-12">
          <div className="aspect-square w-full max-w-[480px] overflow-hidden rounded-2xl ring-1 ring-white/10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]">
            <LobbyBoardPreview />
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
          <div className="text-[20px] font-extrabold tracking-tight text-white">
            A small games club
          </div>
          <div className="mt-1 text-[13px] text-navy-300">
            between two pushes.
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
        <div className="grid min-h-screen place-items-center bg-navy-950 text-white">
          <Spinner />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
