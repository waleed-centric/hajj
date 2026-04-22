import { NextResponse } from "next/server";
import { fetchUsenusukPackages } from "../../../services/nusukPackages";

export const runtime = "nodejs";
export const dynamic = "force-static";
export const revalidate = 1800;

export async function GET() {
  const { source, lastUpdated, packages } = await fetchUsenusukPackages({
    revalidateSeconds: revalidate,
  });

  return NextResponse.json(
    { source, lastUpdated, count: packages.length, packages },
    {
      headers: {
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
      },
    }
  );
}

