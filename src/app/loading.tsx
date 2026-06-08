export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--ah-bg-deep)]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border border-violet-300/30 animate-ping" />
          <div className="absolute inset-2 rounded-full border border-white/10 bg-[radial-gradient(circle,rgba(124,58,237,0.18),transparent_70%)] animate-pulse" />
          <div className="absolute inset-5 rounded-full ah-gradient-bg shadow-[0_8px_24px_-8px_rgba(124,58,237,0.6)] flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
          </div>
        </div>
        <p className="text-white/55 text-sm">Loading…</p>
      </div>
    </div>
  );
}
