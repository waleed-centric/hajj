import { fetchUsenusukPackages } from "../../../services/nusukPackages";
import { PackageDetailClient } from "../../../components/PackageDetailClient";
import Link from "next/link";

export const metadata = {
  title: "Package Details",
};

export const dynamic = "force-dynamic";

export default async function PackageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { packages } = await fetchUsenusukPackages();
  const p = packages.find(pkg => pkg.uuid === id);

  if (!p) {
    return (
      <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-10">
        <div className="w-full max-w-6xl text-center text-zinc-600">
          Package not found.
          <div className="mt-4">
            <Link href="/packages" className="text-emerald-600 hover:underline">
              Back to Packages
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-10 min-h-screen">
      <div className="w-full max-w-full xl:max-w-350 flex flex-col">
        <div className="mb-6 flex flex-col gap-1">
          <div className="mb-2">
            <Link href="/packages" className="text-sm text-zinc-500 hover:text-zinc-800 flex items-center gap-1">
              &larr; Back to Packages
            </Link>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Package Details
          </h1>
        </div>
        <PackageDetailClient pkg={p} />
      </div>
    </div>
  );
}
