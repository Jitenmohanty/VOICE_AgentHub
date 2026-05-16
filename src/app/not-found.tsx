import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--ah-bg-deep)] text-center px-4">
      <h1 className="text-8xl font-bold ah-gradient-text mb-4 font-(family-name:--font-heading) tracking-[-0.02em]">
        404
      </h1>
      <p className="text-xl text-white mb-2 font-(family-name:--font-heading)">
        Page not found
      </p>
      <p className="text-white/55 mb-8 max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="px-6 py-3 rounded-2xl ah-gradient-bg text-white font-medium hover:opacity-90 transition-opacity shadow-[0_8px_24px_-8px_rgba(124,58,237,0.5)]"
      >
        Back to home
      </Link>
    </div>
  );
}
