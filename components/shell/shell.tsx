import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { SidebarContent } from "./sidebar-content";
import { IncomingChallengeBanner } from "@/components/chess/incoming-challenge-banner";

type ShellProps = {
  children: ReactNode;
};

/**
 * Standard page shell: persistent left sidebar on md+, mobile hamburger
 * Sheet on smaller viewports. Both surfaces share `SidebarContent` so the
 * nav stays consistent. Also mounts the global incoming-challenge banner
 * so notifications appear regardless of which page the user is on.
 */
export async function Shell({ children }: ShellProps) {
  return (
    <div className="flex min-h-screen bg-navy-950 text-navy-50">
      <Sidebar />
      <MobileNav>
        {/* Server-rendered nav body passed as children so the Sheet doesn't
         *  need to call auth() on the client. The sheet always shows full
         *  labels regardless of viewport width. */}
        <SidebarContent mode="full" />
      </MobileNav>
      <main className="flex-1 min-w-0">{children}</main>
      <IncomingChallengeBanner />
    </div>
  );
}
