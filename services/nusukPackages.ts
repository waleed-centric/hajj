import connectToDatabase from "@/lib/mongodb";
import Package from "@/models/Package";

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
  description?: string;
  image_url?: string;
  available_seats?: number;
  makkah_rating?: number;
  detailed_html?: string;
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
      const name = normalizeString(p.nameEn || p.nameAr || p.name);
      const provider_name = normalizeString(p.serviceProviderNameEn || p.serviceProviderNameAr || p.provider_name);
      const category_name = normalizeString(p.packageCategoryName || p.category_name);
      const start_date = normalizeString(p.startDate || p.start_date);
      const end_date = normalizeString(p.endDate || p.end_date);
      const duration = normalizeNumber(p.packageDurationDays || p.duration);
      const total_price = normalizeNumber(p.totalPrice || p.total_price);
      
      let available = normalizeBoolean(p.available);
      if (p.availableSeats !== undefined) {
        available = normalizeNumber(p.availableSeats) > 0;
      } else if (p.availabilityStatus !== undefined) {
        available = normalizeNumber(p.availabilityStatus) === 1;
      }

      if (!uuid || !name) return null;

      return {
        uuid,
        name,
        provider_name,
        provider_website: isRecord(p) ? (p.serviceProviderWebsite || p.provider_website as string | null | undefined) : undefined,
        category_name,
        start_date,
        end_date,
        duration,
        total_price,
        available,
        shifting: normalizeBoolean(p.shifting) || category_name.toLowerCase().includes("shifting"),
        zone_name: normalizeString(p.housingZoneNameEn || p.zoneNameEn || p.zone_name),
        camps: normalizeCamps(p.camps),
        hotels: normalizeHotels(p.hotels),
        description: normalizeString(p.descriptionEn || p.descriptionAr || p.description),
        image_url: normalizeString(p.imageUrl || p.image_url),
        available_seats: p.availableSeats !== undefined ? normalizeNumber(p.availableSeats) : undefined,
        makkah_rating: p.makkahRating !== undefined ? normalizeNumber(p.makkahRating) : undefined,
        detailed_html: p.detailed_html ? normalizeString(p.detailed_html) : undefined,
      } as NusukPackage;
    })
    .filter((p): p is NusukPackage => p !== null);
}

export async function fetchUsenusukPackages() {
  try {
    await connectToDatabase();
    
    // Fetch all packages from MongoDB
    const dbPackages = await Package.find({}).lean();
    
    // In MongoDB, the result is the array itself
    const rawPackages = Array.isArray(dbPackages) ? dbPackages : [];
    
    // Get the most recent update time or fallback
    const latestDoc = await Package.findOne({}).sort({ updatedAt: -1 }).lean() as { updatedAt?: string | Date } | null;
    const lastUpdated = latestDoc?.updatedAt ? new Date(latestDoc.updatedAt).toISOString() : new Date().toISOString();
    
    const packages = normalizePackages(rawPackages);

    return {
      source: "MongoDB Atlas",
      lastUpdated,
      packages,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Error reading scraped packages from MongoDB:", msg);
    return {
      source: "MongoDB Atlas (Error or no data, please scrape first)",
      lastUpdated: null,
      packages: [],
    };
  }
}

