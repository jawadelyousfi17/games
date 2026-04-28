import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowIcon } from "./icons";
import { t } from "@/lib/i18n";

type IntraButtonProps = {
  /** "lg" matches the hero CTA, "md" is a denser variant for cards. */
  size?: "lg" | "md";
  /** Optional override; defaults to the localized "Sign in with intra" string. */
  label?: string;
  /** Where the button lands users. Defaults to the existing /login route. */
  href?: string;
};

/**
 * Bespoke 42 / intra sign-in button. Wraps the shadcn Button with the lime
 * intra variant + the inset "42" badge from the design system.
 */
export function IntraButton({
  size = "lg",
  label,
  href = "/login",
}: IntraButtonProps) {
  const buttonSize = size === "lg" ? "intra-lg" : "intra-md";
  return (
    <Button
      asChild
      variant="intra"
      size={buttonSize}
      className="group inline-flex"
    >
      <Link href={href}>
        <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-lg bg-navy-950/85 text-[11px] font-bold text-brand-lime">
          42
        </span>
        <span>{label ?? t("intra.signIn")}</span>
        <ArrowIcon className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
      </Link>
    </Button>
  );
}
