import Link from "next/link";

/** Site-wide navigation bar. */
export default function Navbar() {
  return (
    <nav className="w-full border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-bold tracking-tight text-gray-900">
          MG Barbers
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/#services"
            className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
          >
            Services
          </Link>
          <Link
            href="/book"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Book
          </Link>
        </div>
      </div>
    </nav>
  );
}
