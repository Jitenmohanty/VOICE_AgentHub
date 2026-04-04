import { Sidebar } from "@/components/shared/Sidebar";

export default function BusinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#0A0A0F]">
      <Sidebar />
      <main className="flex-1 pt-20 px-6 pb-6 md:pt-8 md:px-8 md:pb-8 overflow-auto">{children}</main>
    </div>
  );
}
