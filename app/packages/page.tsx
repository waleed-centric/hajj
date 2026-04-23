import { NusukPackagesView } from "../../components/NusukPackagesView";
import { fetchUsenusukPackages } from "../../services/nusukPackages";

export const metadata = {
  title: "Hajj Packages",
};

export const dynamic = "force-dynamic";

export default async function PackagesPage() {
  const { source, lastUpdated, packages } = await fetchUsenusukPackages();

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-10">
      <div className="w-full max-w-6xl">
        <NusukPackagesView
          source={source}
          lastUpdated={lastUpdated}
          packages={packages}
        />
      </div>
    </div>
  );
}

