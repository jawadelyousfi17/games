"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactElement } from "react";

type SidebarLinkProps = {
  href: string;
  label: string;
  /** Pre-rendered icon element. Server-rendered so this client component
   *  doesn't need a function-component prop crossing the boundary. */
  icon: ReactElement;
  /** Disabled items render as muted text without a link target. */
  disabled?: boolean;
};

/**
 * Single nav entry. Matches the chess.com pattern: flat by default, raised
 * with an inset bottom shadow on hover/active to give the sidebar a touch of
 * depth.
 */
export function SidebarLink({
  href,
  label,
  icon,
  disabled,
}: SidebarLinkProps) {
  const pathname = usePathname();
  const active = !disabled && href !== "#" && pathname.startsWith(href);

  const className = `flex h-12 items-center gap-3 rounded-md px-3.5 text-[14px] font-semibold transition-all ${
    disabled
      ? "cursor-not-allowed text-navy-500"
      : active
        ? "bg-white/[0.07] text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.25)] ring-1 ring-white/5"
        : "text-navy-200 hover:bg-white/[0.04] hover:text-white hover:shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)]"
  }`;

  if (disabled) {
    return (
      <span className={className} aria-disabled>
        {icon}
        {label}
      </span>
    );
  }

  return (
    <Link href={href} className={className}>
      {icon}
      {label}
    </Link>
  );
}
