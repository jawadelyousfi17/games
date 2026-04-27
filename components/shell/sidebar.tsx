import Link from "next/link";
import {
  BrandIcon,
  PlayIcon,
  PuzzleIcon,
  LearnIcon,
  WatchIcon,
  CommunityIcon,
  MoreIcon,
  SearchIcon,
} from "./sidebar-icons";
import { SidebarLink } from "./sidebar-link";
import { auth } from "@/lib/auth/auth-provider";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactElement;
  disabled?: boolean;
};

const ICON_CLASS = "h-5 w-5";
const NAV_ITEMS: NavItem[] = [
  { label: "Play", href: "/games/chess", icon: <PlayIcon className={ICON_CLASS} /> },
  { label: "Puzzles", href: "#", icon: <PuzzleIcon className={ICON_CLASS} />, disabled: true },
  { label: "Learn", href: "#", icon: <LearnIcon className={ICON_CLASS} />, disabled: true },
  { label: "Watch", href: "#", icon: <WatchIcon className={ICON_CLASS} />, disabled: true },
  { label: "Community", href: "#", icon: <CommunityIcon className={ICON_CLASS} />, disabled: true },
  { label: "Other", href: "#", icon: <MoreIcon className={ICON_CLASS} />, disabled: true },
];

/**
 * Persistent left rail used across the site. chess.com-style: brand at the
 * top, vertical nav, search + auth chips at the bottom.
 *
 * Server component — reads the session synchronously to decide whether to
 * show "Sign in" or the user's avatar chip.
 */
export async function Sidebar() {
  const session = await auth();
  const user = session?.user;

  return (
    <aside className="sticky top-0 flex h-screen w-[240px] flex-shrink-0 flex-col border-r border-white/5 bg-navy-900 text-navy-100">
      <Link
        href="/"
        className="flex items-center gap-2.5 px-5 pb-5 pt-6 text-white"
      >
        <BrandIcon className="h-7 w-7 text-brand-lime" />
        <span className="text-[16px] font-extrabold tracking-tight">
          1337<span className="font-semibold text-navy-300">.games</span>
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {NAV_ITEMS.map((item) => (
          <SidebarLink
            key={item.label}
            href={item.href}
            label={item.label}
            icon={item.icon}
            disabled={item.disabled ?? false}
          />
        ))}
      </nav>

      <div className="border-t border-white/5 px-4 py-4">
        <div className="relative mb-3">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
          <input
            placeholder="Search"
            className="h-10 w-full rounded-md bg-navy-800 pl-9 pr-3 text-[14px] text-white ring-1 ring-white/5 placeholder:text-navy-400 focus:outline-none focus:ring-white/10"
          />
        </div>
        {user ? (
          <Link
            href="/games/chess"
            className="flex items-center gap-2.5 rounded-md bg-navy-800 px-3 py-2.5 text-[14px] font-semibold text-white ring-1 ring-white/5 shadow-[inset_0_-2px_0_rgba(0,0,0,0.25)] transition hover:bg-navy-700 active:translate-y-px active:shadow-[inset_0_-1px_0_rgba(0,0,0,0.18)]"
          >
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-navy-700 text-[12px] font-bold">
              {(user.login ?? user.name ?? "?").slice(0, 2).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1 truncate">
              {user.login ?? user.name}
            </span>
          </Link>
        ) : (
          <div className="space-y-2">
            <Link
              href="/login"
              className="flex h-11 items-center justify-center rounded-md bg-brand-lime text-[14px] font-bold text-navy-950 shadow-[inset_0_-3px_0_rgba(0,0,0,0.22)] transition hover:bg-brand-lime-light active:translate-y-px active:shadow-[inset_0_-1px_0_rgba(0,0,0,0.18)]"
            >
              Sign Up
            </Link>
            <Link
              href="/login"
              className="flex h-11 items-center justify-center rounded-md bg-navy-800 text-[14px] font-semibold text-white ring-1 ring-white/10 shadow-[inset_0_-2px_0_rgba(0,0,0,0.22)] transition hover:bg-navy-700 active:translate-y-px active:shadow-[inset_0_-1px_0_rgba(0,0,0,0.18)]"
            >
              Log In
            </Link>
          </div>
        )}
        <div className="mt-3 flex items-center justify-center gap-1 font-mono text-[11px] font-semibold text-navy-400">
          <span>EN</span>
        </div>
      </div>
    </aside>
  );
}
