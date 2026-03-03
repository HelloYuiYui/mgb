import Link from "next/link";

/** Landing page — introduces MG Barbers and directs users to book. */
export default function Home() {
  return (
    <main>
      {/* Hero Section */}
      <section className="flex min-h-[calc(100vh-65px)] flex-col items-center justify-center px-4 py-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Your barber, at your door
        </h1>
        <p className="mt-4 max-w-lg text-lg text-gray-600">
          MG Barbers brings professional barbering straight to your home across
          Glasgow. No travel, no waiting, just a fresh cut on your schedule.
        </p>
        <Link
          href="/book"
          className="mt-8 rounded-lg bg-blue-600 px-8 py-4 text-lg font-semibold text-white
                     shadow-sm transition-colors hover:bg-blue-700 focus:outline-none
                     focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Book Now
        </Link>
      </section>

      {/* Services Section */}
      <section id="services" className="bg-gray-50 px-4 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Services
          </h2>
          <p className="mt-2 text-base text-gray-600">
            Professional cuts and grooming, delivered to your door.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-gray-900">Haircut</h3>
              <p className="mt-2 text-sm text-gray-600">
                Skin fades, tapers, scissor cuts and more — tailored to your
                style.
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Beard Trim
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Shape-ups, line-ups and full beard trims for a clean, sharp
                look.
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Hair & Beard
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                The full treatment — haircut and beard trim combined.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
