import { Sidebar } from "@/components/shared/Sidebar";

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[var(--ah-bg-deep)]">
      <Sidebar />
      {/* Each business page owns its own horizontal padding (px-2 on mobile,
          p-10 on desktop). The layout only adds the mobile-only top offset so
          content clears the fixed top-bar, plus a touch of bottom breathing
          room. No px on either breakpoint — that would double-count. */}
      <main className="flex-1 pt-16 pb-4 md:pt-0 md:pb-0 overflow-auto">{children}</main>
    </div>
  );
}
