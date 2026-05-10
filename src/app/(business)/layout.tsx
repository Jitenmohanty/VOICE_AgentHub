import { Sidebar } from "@/components/shared/Sidebar";

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#050816]">
      <Sidebar />
      <main className="flex-1 pt-20 px-4 pb-6 md:pt-0 md:px-0 md:pb-0 overflow-auto">{children}</main>
    </div>
  );
}
