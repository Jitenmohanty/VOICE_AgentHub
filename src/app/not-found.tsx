import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0F] text-center px-4">
      <h1 className="text-8xl font-bold text-transparent bg-clip-text bg-linear-to-r from-[#00D4FF] to-[#6366F1] mb-4">
        404
      </h1>
      <p className="text-xl text-white mb-2 font-(family-name:--font-heading)">
        Page Not Found
      </p>
      <p className="text-[#8888AA] mb-8 max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="px-6 py-3 rounded-xl bg-linear-to-r from-[#00D4FF] to-[#6366F1] text-white font-medium hover:opacity-90 transition-opacity"
      >
        Back to Home
      </Link>
    </div>
  );
}
