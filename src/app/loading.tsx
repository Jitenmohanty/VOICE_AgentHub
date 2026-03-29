export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-[#00D4FF]/30 animate-ping" />
          <div className="absolute inset-2 rounded-full border-2 border-[#00D4FF]/50 animate-pulse" />
          <div className="absolute inset-4 rounded-full bg-[#00D4FF]/20 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-[#00D4FF]" />
          </div>
        </div>
        <p className="text-[#8888AA] text-sm">Loading...</p>
      </div>
    </div>
  );
}
