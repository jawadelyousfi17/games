"use client";

import { useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type MobileNavProps = {
  /** Server-rendered SidebarContent passed as children so the Sheet can
   *  display the same nav body without re-fetching the session client-side. */
  children: ReactNode;
};

/**
 * Hamburger button (top-left, mobile-only) that opens a Sheet containing the
 * sidebar nav. Renders nothing on md+ where the sidebar is permanent.
 */
export function MobileNav({ children }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            aria-label="Open menu"
            className="fixed left-3 top-3 z-30 flex h-10 w-10 items-center justify-center rounded-md bg-navy-900 text-white ring-1 ring-white/10 shadow-[inset_0_-2px_0_rgba(0,0,0,0.25)] transition hover:bg-navy-800 active:translate-y-px active:shadow-[inset_0_-1px_0_rgba(0,0,0,0.18)]"
          >
            <Menu className="h-5 w-5" strokeWidth={2.25} />
          </button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-[280px] border-r border-white/5 bg-navy-900 p-0 text-navy-100"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <div onClick={() => setOpen(false)} className="h-full">
            {children}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
