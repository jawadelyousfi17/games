import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";

type ShellProps = {
  children: ReactNode;
};

/**
 * Standard page shell: persistent left sidebar + main content area.
 * Used by every page that should match the chess.com-style layout.
 */
export async function Shell({ children }: ShellProps) {
  return (
    <div className="flex min-h-screen bg-navy-950 text-navy-50">
      <Sidebar />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
