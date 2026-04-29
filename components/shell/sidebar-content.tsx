import Link from "next/link";
import {
  Swords,
  Puzzle,
  GraduationCap,
  Tv,
  Users,
  Trophy,
  Search,
  LogIn,
  LogOut,
  UserPlus,
  Crown,
} from "lucide-react";
import { SidebarLink } from "./sidebar-link";
import { auth, signOut } from "@/lib/auth/auth-provider";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactElement;
  disabled?: boolean;
};

const ICON_CLASS = "h-5 w-5 shrink-0";
const NAV_ITEMS: NavItem[] = [
  { label: "Play", href: "/games/chess", icon: <Swords className={ICON_CLASS} strokeWidth={2} /> },
  { label: "Leaderboard", href: "/games/chess/leaderboard", icon: <Trophy className={ICON_CLASS} strokeWidth={2} /> },
  { label: "Puzzles", href: "/puzzles", icon: <Puzzle className={ICON_CLASS} strokeWidth={2} /> },
  { label: "Learn", href: "/learn", icon: <GraduationCap className={ICON_CLASS} strokeWidth={2} /> },
  { label: "Watch", href: "#", icon: <Tv className={ICON_CLASS} strokeWidth={2} />, disabled: true },
  { label: "Community", href: "#", icon: <Users className={ICON_CLASS} strokeWidth={2} />, disabled: true },
];

type SidebarContentProps = {
  /** "responsive" reveals labels on parent group hover, "full" always shows. */
  mode?: "responsive" | "full";
};

/**
 * Inner content for the sidebar — brand mark, nav list, search, auth chip.
 * Shared by the desktop Sidebar (responsive, hover-to-expand) and the
 * mobile Sheet (full, always expanded).
 *
 * Responsive mode relies on a parent element carrying the `group` class so
 * `group-hover:` Tailwind variants apply when the user hovers the rail.
 */
export async function SidebarContent({
  mode = "responsive",
}: SidebarContentProps) {
  const session = await auth();
  const user = session?.user;

  const isResponsive = mode === "responsive";
  const labelClass = isResponsive ? "hidden group-hover:inline" : "inline";
  const showOnExpand = isResponsive ? "hidden group-hover:flex" : "flex";
  const iconOnCollapse = isResponsive ? "group-hover:hidden" : "hidden";
  const itemPad = isResponsive
    ? "px-3 group-hover:px-3.5"
    : "px-3.5";

  return (
    <div className="flex h-full w-full flex-col bg-navy-900 text-navy-100">
      <Link
        href="/"
        className={`flex items-center gap-2.5 pb-5 pt-6 text-white ${itemPad}`}
      >
        <Crown className="h-7 w-7 shrink-0 text-brand-lime" strokeWidth={2.25} />
        <span
          className={`whitespace-nowrap text-[18px] font-extrabold tracking-tight ${labelClass}`}
        >
          Chess
        </span>
      </Link>

      <nav className={`flex flex-1 flex-col gap-1 ${isResponsive ? "px-2" : "px-3"}`}>
        {NAV_ITEMS.map((item) => (
          <SidebarLink
            key={item.label}
            href={item.href}
            label={item.label}
            icon={item.icon}
            disabled={item.disabled ?? false}
            mode={mode}
          />
        ))}
      </nav>

      <div className={`border-t border-white/5 py-4 ${isResponsive ? "px-2" : "px-4"}`}>
        <div className={`relative mb-3 ${showOnExpand}`}>
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400"
            strokeWidth={2}
          />
          <input
            placeholder="Search"
            className="h-10 w-full rounded-md bg-navy-800 pl-9 pr-3 text-[14px] text-white ring-1 ring-white/5 placeholder:text-navy-400 focus:outline-none focus:ring-white/10"
          />
        </div>

        {user ? (
          <div className={isResponsive ? "flex flex-col items-center gap-2 group-hover:items-stretch" : "flex flex-col gap-2"}>
            <Link
              href="/games/chess"
              title={user.login ?? user.name ?? ""}
              className={
                isResponsive
                  ? "btn-3d-dark flex h-10 w-10 items-center justify-center gap-2.5 rounded-md text-[14px] font-semibold text-white ring-1 ring-white/5 group-hover:h-auto group-hover:w-full group-hover:justify-start group-hover:px-3 group-hover:py-2.5"
                  : "btn-3d-dark flex items-center gap-2.5 rounded-md px-3 py-2.5 text-[14px] font-semibold text-white ring-1 ring-white/5"
              }
            >
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-navy-700 text-[12px] font-bold">
                {(user.login ?? user.name ?? "?").slice(0, 2).toUpperCase()}
              </span>
              <span
                className={`min-w-0 flex-1 truncate whitespace-nowrap ${labelClass}`}
              >
                {user.login ?? user.name}
              </span>
            </Link>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
              className={isResponsive ? "w-10 group-hover:w-full" : "w-full"}
            >
              <button
                type="submit"
                title="Log out"
                className={
                  isResponsive
                    ? "btn-3d-dark flex h-10 w-10 items-center justify-center gap-2 rounded-md text-[13px] font-semibold text-navy-200 ring-1 ring-white/10 group-hover:w-full group-hover:px-3"
                    : "btn-3d-dark flex h-10 w-full items-center justify-center gap-2 rounded-md px-3 text-[13px] font-semibold text-navy-200 ring-1 ring-white/10"
                }
              >
                <LogOut className="h-4 w-4 shrink-0" strokeWidth={2.25} />
                <span className={`whitespace-nowrap ${labelClass}`}>
                  Log out
                </span>
              </button>
            </form>
          </div>
        ) : (
          <div className={isResponsive ? "flex flex-col items-center gap-2 group-hover:items-stretch" : "flex flex-col gap-2"}>
            <Link
              href="/login"
              title="Sign Up"
              className={
                isResponsive
                  ? "btn-3d-lime flex h-10 w-10 items-center justify-center gap-2 rounded-md font-bold text-navy-950 group-hover:h-11 group-hover:w-full group-hover:px-4"
                  : "btn-3d-lime flex h-11 w-full items-center justify-center gap-2 rounded-md px-4 font-bold text-navy-950"
              }
            >
              <UserPlus
                className={`h-4 w-4 ${iconOnCollapse}`}
                strokeWidth={2.25}
              />
              <span className={`whitespace-nowrap text-[14px] ${labelClass}`}>
                Sign Up
              </span>
            </Link>
            <Link
              href="/login"
              title="Log In"
              className={
                isResponsive
                  ? "btn-3d-dark flex h-10 w-10 items-center justify-center gap-2 rounded-md font-semibold text-white ring-1 ring-white/10 group-hover:h-11 group-hover:w-full group-hover:px-4"
                  : "btn-3d-dark flex h-11 w-full items-center justify-center gap-2 rounded-md px-4 font-semibold text-white ring-1 ring-white/10"
              }
            >
              <LogIn
                className={`h-4 w-4 ${iconOnCollapse}`}
                strokeWidth={2.25}
              />
              <span className={`whitespace-nowrap text-[14px] ${labelClass}`}>
                Log In
              </span>
            </Link>
          </div>
        )}

        <div
          className={`mt-3 items-center justify-center gap-1 text-[11px] font-semibold text-navy-400 ${showOnExpand}`}
        >
          <span>EN</span>
        </div>
      </div>
    </div>
  );
}

