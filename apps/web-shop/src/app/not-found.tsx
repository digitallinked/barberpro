import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#111111] gap-4">
      <h1 className="text-6xl font-black text-white">404</h1>
      <p className="text-lg text-gray-400">Page not found</p>
      <Link
        href="/dashboard"
        className="mt-4 rounded-lg bg-[#D4AF37] px-6 py-2 text-sm font-bold text-[#111] shadow-lg shadow-[#D4AF37]/20 transition hover:brightness-110"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
