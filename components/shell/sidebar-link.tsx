"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactElement } from "react";

type SidebarLinkProps = {
  href: string;
  label: string;
  icon: ReactElement;
  disabled?: boolean;
  /** "responsive" hides the label until parent group is hovered, "full"
   *  always shows it. */
  mode?: "responsive" | "full";
};

/**
 * Single nav entry. In responsive mode the label collapses by default and
 * appears when the user hovers the sidebar — relies on the parent carrying
 * the `group` Tailwind class. The mobile Sheet always uses `full` mode.
 */
export function SidebarLink({
  href,
  label,
  icon,
  disabled,
  mode = "responsive",
}: SidebarLinkProps) {
  const pathname = usePathname();
  // Exact match OR pathname extends `href` past a "/" boundary, so a more
  // specific link like `/games/chess/leaderboard` doesn't also light up the
  // less-specific `/games/chess` entry.
  const active =
    !disabled &&
    href !== "#" &&
    (pathname === href || pathname.startsWith(`${href}/`));

  const labelClass =
    mode === "responsive"
      ? "hidden group-hover:inline whitespace-nowrap"
      : "inline whitespace-nowrap";

  const className = `flex h-12 items-center gap-3 rounded-md px-3.5 text-[14px] font-semibold transition-all ${
    disabled
      ? "cursor-not-allowed text-navy-500"
      : active
        ? "bg-white/[0.07] text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.25)] ring-1 ring-white/5"
        : "text-navy-200 hover:bg-white/[0.04] hover:text-white hover:shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)]"
  }`;

  if (disabled) {
    return (
      <span className={className} aria-disabled title={label}>
        {icon}
        <span className={labelClass}>{label}</span>
      </span>
    );
  }

  return (
    <Link href={href} className={className} title={label}>
      {icon}
      <span className={labelClass}>{label}</span>
    </Link>
  );
}
