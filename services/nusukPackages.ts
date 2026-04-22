export type NusukPackageCamp = {
  name: string;
  price: number;
  available: boolean;
};

export type NusukPackageHotel = {
  name: string;
  type: string;
  check_in: string;
  check_out: string;
};

export type NusukPackage = {
  uuid: string;
  name: string;
  provider_name: string;
  provider_website?: string | null;
  category_name: string;
  start_date: string;
  end_date: string;
  duration: number;
  total_price: number;
  available: boolean;
  shifting?: boolean;
  zone_name?: string | null;
  camps: NusukPackageCamp[];
  hotels: NusukPackageHotel[];
};

type UsenusukPackagesResponse = {
  data: unknown;
  last_updated?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeString(value: unknown): string {
  if (typeof value === "string") return value;
  return "";
}

function normalizeNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

function normalizeBoolean(value: unknown): boolean {
  return value === true;
}

function normalizeCamps(value: unknown): NusukPackageCamp[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((c) => {
      if (!isRecord(c)) return null;
      return {
        name: normalizeString(c.name),
        price: normalizeNumber(c.price),
        available: normalizeBoolean(c.available),
      } satisfies NusukPackageCamp;
    })
    .filter((c): c is NusukPackageCamp => c !== null && c.name.length > 0);
}

function normalizeHotels(value: unknown): NusukPackageHotel[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((h) => {
      if (!isRecord(h)) return null;
      return {
        name: normalizeString(h.name),
        type: normalizeString(h.type),
        check_in: normalizeString(h.check_in),
        check_out: normalizeString(h.check_out),
      } satisfies NusukPackageHotel;
    })
    .filter((h): h is NusukPackageHotel => h !== null && h.name.length > 0);
}

function normalizePackages(value: unknown): NusukPackage[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((p) => {
      if (!isRecord(p)) return null;
      const uuid = normalizeString(p.uuid);
      const name = normalizeString(p.name);
      const provider_name = normalizeString(p.provider_name);
      const category_name = normalizeString(p.category_name);
      const start_date = normalizeString(p.start_date);
      const end_date = normalizeString(p.end_date);
      const duration = normalizeNumber(p.duration);
      const total_price = normalizeNumber(p.total_price);
      const available = normalizeBoolean(p.available);

      if (!uuid || !name) return null;

      return {
        uuid,
        name,
        provider_name,
        provider_website: isRecord(p) ? (p.provider_website as string | null | undefined) : undefined,
        category_name,
        start_date,
        end_date,
        duration,
        total_price,
        available,
        shifting: normalizeBoolean(p.shifting),
        zone_name: normalizeString(p.zone_name),
        camps: normalizeCamps(p.camps),
        hotels: normalizeHotels(p.hotels),
      } as NusukPackage;
    })
    .filter((p): p is NusukPackage => p !== null);
}

export async function fetchUsenusukPackages(options?: {
  revalidateSeconds?: number;
}) {
  const revalidateSeconds = options?.revalidateSeconds ?? 1800;
  const res = await fetch("https://packages.usenusuk.com/packages.json", {
    cache: "force-cache",
    next: { revalidate: revalidateSeconds },
  });

  if (!res.ok) {
    throw new Error(`packages.usenusuk.com failed: ${res.status}`);
  }

  const json = (await res.json()) as UsenusukPackagesResponse;
  const lastUpdated =
    typeof json.last_updated === "string" ? json.last_updated : null;
  const packages = normalizePackages(json.data);

  return {
    source: "packages.usenusuk.com",
    lastUpdated,
    packages,
  };
}

