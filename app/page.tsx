import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-10 font-sans">
      <main className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Hajj Packages Dashboard
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          Live packages list UI.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            className="inline-flex h-11 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-800"
            href="/packages"
          >
            View Packages
          </Link>
          <Link
            className="inline-flex h-11 items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
            href="/scraper"
          >
            Scrape Nusuk API
          </Link>
        </div>
      </main>
    </div>
  );
}
