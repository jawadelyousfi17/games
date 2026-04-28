import { SidebarContent } from "./sidebar-content";

/**
 * Desktop sidebar.
 *
 * Layout: a 64px placeholder aside reserves a stable slot in the page flex
 * row so the main column never reflows. The visual panel is a separate
 * `fixed` element pinned to the viewport's left edge with z-50, so it
 * overlays everything (board, right rail, mobile bars).
 *
 * Hover detection: the fixed panel is its own `group` so hovering anywhere
 * inside its current bounding box keeps the expand active. Once the cursor
 * leaves the expanded box, it collapses back to 64px.
 */
export async function Sidebar() {
  return (
    <>
      <aside
        aria-hidden="true"
        className="hidden h-screen w-16 flex-shrink-0 md:block"
      />
      <div className="group fixed inset-y-0 left-0 z-50 hidden w-16 overflow-hidden border-r border-white/5 bg-navy-900 transition-[width] duration-200 hover:w-[240px] hover:shadow-[0_0_60px_-10px_rgba(0,0,0,0.55)] md:block">
        <SidebarContent mode="responsive" />
      </div>
    </>
  );
}
