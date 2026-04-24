import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Package from "@/models/Package";

export async function POST(request: Request) {
  try {
    const { cookie } = await request.json();

    if (!cookie) {
      return NextResponse.json(
        { error: "Cookie is required." },
        { status: 400 }
      );
    }

    const baseHeaders: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      "Cookie": cookie.trim(),
    };

    // Step 1: Get the page HTML to extract the verification token
    const pageRes = await fetch("https://hajj.nusuk.sa/Packages", {
      method: "GET",
      headers: baseHeaders,
    });

    if (!pageRes.ok) {
      return NextResponse.json(
        { error: `Failed to fetch main page. Status: ${pageRes.status}` },
        { status: pageRes.status }
      );
    }

    const html = await pageRes.text();
    const match = html.match(/name="__RequestVerificationToken" type="hidden" value="([^"]+)"/);
    
    if (!match) {
      return NextResponse.json(
        { error: "Could not find __RequestVerificationToken in the page HTML. Cookie might be invalid or expired." },
        { status: 401 }
      );
    }
    
    const token = match[1];

    // Step 2: Fetch the actual packages data
    const apiUrl = "https://hajj.nusuk.sa/Packages?handler=FilterPackages";
    const fetchHeaders = {
      ...baseHeaders,
      "Content-Type": "application/json",
      "Accept": "application/json",
      "RequestVerificationToken": token,
      "X-XSRF-TOKEN": token,
    };

    const payload = {
      "__RequestVerificationToken": token,
      "PackageName": "",
      "AvailablePackagesOnly": false,
      "PreferredPackageOnly": false,
      "ApplicantCountryB2BFlightContractOnly": false
    };

    const res = await fetch(apiUrl, {
      method: "POST",
      headers: fetchHeaders,
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        { error: `Failed to fetch packages data. Status: ${res.status}. Response: ${errorText.substring(0, 200)}` },
        { status: res.status }
      );
    }

    const data = await res.json();

    // Save directly to MongoDB
    await connectToDatabase();

    // Upsert all packages
    const bulkOps = data.map((pkg: Record<string, unknown>) => ({
      updateOne: {
        filter: { uuid: pkg.uuid },
        update: { $set: pkg },
        upsert: true,
      },
    }));

    if (bulkOps.length > 0) {
      await Package.bulkWrite(bulkOps);
    }

    return NextResponse.json({
      message: "Data scraped and saved successfully to MongoDB",
      count: data.length || "Unknown",
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}
