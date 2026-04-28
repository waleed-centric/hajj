"use client";

import { useMemo, useState, useEffect } from "react";
import type { NusukPackage } from "../services/nusukPackages";

import Link from "next/link";

function formatMoney(value: number) {
  if (!Number.isFinite(value)) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 2,
  }).format(value);
}

export function NusukPackagesView(props: {
  source: string;
  lastUpdated: string | null;
  packages: NusukPackage[];
}) {
  const [isFiltersOpen, setIsFiltersOpen] = useState(true);
  const [viewType, setViewType] = useState<'table' | 'card'>('table');
  const [routeType, setRouteType] = useState("all");
  const [shifting, setShifting] = useState("all");
  const [packageName, setPackageName] = useState("");
  const [camp, setCamp] = useState("");
  const [serviceProvider, setServiceProvider] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [flightCity, setFlightCity] = useState("");
  const [sortBy, setSortBy] = useState("none");
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of props.packages) {
      if (p.category_name) set.add(p.category_name);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [props.packages]);

  const camps = useMemo(() => {
    const set = new Set<string>();
    for (const p of props.packages) {
      p.camps?.forEach(c => set.add(c.name));
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [props.packages]);

  const providers = useMemo(() => {
    const set = new Set<string>();
    for (const p of props.packages) {
      if (p.provider_name) set.add(p.provider_name);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [props.packages]);

  function clearAllFilters() {
    setRouteType("all");
    setShifting("all");
    setPackageName("");
    setCamp("");
    setServiceProvider("");
    setCategoryName("");
    setFlightCity("");
    setSortBy("none");
  }

  const filtered = useMemo(() => {
    let result = props.packages.filter((p) => {
      // Package Name
      if (packageName) {
        const q = packageName.toLowerCase();
        if (!p.name.toLowerCase().includes(q)) return false;
      }
      // Category
      if (categoryName && p.category_name !== categoryName) return false;
      // Service Provider
      if (serviceProvider && p.provider_name !== serviceProvider) return false;
      // Camp
      if (camp && (!p.camps || !p.camps.some(c => c.name === camp))) return false;
      
      // Shifting
      if (shifting === 'shifting' && !p.shifting) return false;
      if (shifting === 'non-shifting' && p.shifting) return false;

      // Route Type (Approximation based on first hotel or zone, if data permits)
      if (routeType === 'madinah') {
         // Assuming checking if "madinah" is in zone_name or first hotel
         const isMadinah = p.zone_name?.toLowerCase().includes('madinah') || 
                           p.hotels?.[0]?.name.toLowerCase().includes('madinah');
         if (!isMadinah) return false;
      }
      if (routeType === 'makkah') {
         const isMakkah = p.zone_name?.toLowerCase().includes('makkah') || 
                          p.hotels?.[0]?.name.toLowerCase().includes('makkah');
         if (!isMakkah) return false;
      }

      return true;
    });

    if (sortBy === "price_asc") {
      result.sort((a, b) => a.total_price - b.total_price);
    } else if (sortBy === "price_desc") {
      result.sort((a, b) => b.total_price - a.total_price);
    } else if (sortBy === "duration_asc") {
      result.sort((a, b) => a.duration - b.duration);
    } else if (sortBy === "duration_desc") {
      result.sort((a, b) => b.duration - a.duration);
    }

    return result;
  }, [props.packages, packageName, categoryName, serviceProvider, camp, shifting, routeType, sortBy]);

  // Reset page to 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [packageName, categoryName, serviceProvider, camp, shifting, routeType, sortBy]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  const startItem = filtered.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, filtered.length);

  function getPageNumbers() {
    const items: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) items.push(i);
    } else {
      if (currentPage <= 3) {
        items.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        items.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        items.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return items;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Hajj Packages
          </h1>
          <div className="text-sm text-zinc-600">
            Source: <span className="font-medium">{props.source}</span>
            {props.lastUpdated ? (
              <>
                {" "}
                • Last updated:{" "}
                <span className="font-medium">{props.lastUpdated}</span>
              </>
            ) : null}
            {" "}
            • Count: <span className="font-medium">{filtered.length}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-zinc-100 p-1 self-start sm:self-auto">
          <button
            onClick={() => setViewType('table')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
              viewType === 'table'
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            Table View
          </button>
          <button
            onClick={() => setViewType('card')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
              viewType === 'card'
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Card View
          </button>
        </div>
      </div>

        <div className="rounded-xl border border-zinc-200 bg-white mb-6 shadow-sm">
          {/* Header */}
          <div 
            className="flex items-center justify-between px-4 py-3 cursor-pointer border-b border-zinc-200"
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          >
            <div className="flex items-center gap-2 font-medium text-zinc-900">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-5 w-5 transition-transform duration-200 ${isFiltersOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 text-emerald-600" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                clearAllFilters();
              }}
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900 flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear All
            </button>
          </div>
          
          {/* Body */}
          {isFiltersOpen && (
            <div className="p-4 flex flex-col md:flex-row gap-6">
              {/* Left Column (Radios) */}
              <div className="flex flex-col gap-6 min-w-37.5">
                {/* Route Type */}
                {/* <div className="flex flex-col gap-3">
                  <div className="text-sm font-semibold text-zinc-900 border-l-2 border-emerald-600 pl-2">Route Type</div>
                  <label className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
                    <input type="radio" name="routeType" checked={routeType === 'all'} onChange={() => setRouteType('all')} className="text-emerald-600 focus:ring-emerald-600 h-4 w-4" /> All
                  </label>
                  <label className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
                    <input type="radio" name="routeType" checked={routeType === 'madinah'} onChange={() => setRouteType('madinah')} className="text-emerald-600 focus:ring-emerald-600 h-4 w-4" /> Madinah First
                  </label>
                  <label className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
                    <input type="radio" name="routeType" checked={routeType === 'makkah'} onChange={() => setRouteType('makkah')} className="text-emerald-600 focus:ring-emerald-600 h-4 w-4" /> Makkah First
                  </label>
                </div> */}

                {/* Shifting */}
                <div className="flex flex-col gap-3">
                  <div className="text-sm font-semibold text-zinc-900 border-l-2 border-emerald-600 pl-2">Shifting</div>
                  <label className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
                    <input type="radio" name="shifting" checked={shifting === 'all'} onChange={() => setShifting('all')} className="text-emerald-600 focus:ring-emerald-600 h-4 w-4" /> All
                  </label>
                  <label className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
                    <input type="radio" name="shifting" checked={shifting === 'shifting'} onChange={() => setShifting('shifting')} className="text-emerald-600 focus:ring-emerald-600 h-4 w-4" /> Shifting
                  </label>
                  <label className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
                    <input type="radio" name="shifting" checked={shifting === 'non-shifting'} onChange={() => setShifting('non-shifting')} className="text-emerald-600 focus:ring-emerald-600 h-4 w-4" /> Non-Shifting
                  </label>
                </div>
              </div>

              {/* Right Column (Grid) */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 content-start">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-zinc-900">Package Name</label>
                  <input 
                    placeholder="Search packages..." 
                    value={packageName}
                    onChange={(e) => setPackageName(e.target.value)}
                    className="h-10 w-full rounded-md border border-zinc-200 px-3 text-sm outline-none focus:border-emerald-600 bg-white"
                  />
                </div>
                {/* <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-zinc-900">Camp</label>
                  <select value={camp} onChange={e => setCamp(e.target.value)} className="h-10 w-full rounded-md border border-zinc-200 px-3 text-sm outline-none focus:border-emerald-600 bg-white">
                    <option value="">Select Camps</option>
                    {camps.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div> */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-zinc-900">Service Provider</label>
                  <select value={serviceProvider} onChange={e => setServiceProvider(e.target.value)} className="h-10 w-full rounded-md border border-zinc-200 px-3 text-sm outline-none focus:border-emerald-600 bg-white">
                    <option value="">Select Providers</option>
                    {providers.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-zinc-900">Category Name</label>
                  <select value={categoryName} onChange={e => setCategoryName(e.target.value)} className="h-10 w-full rounded-md border border-zinc-200 px-3 text-sm outline-none focus:border-emerald-600 bg-white">
                    <option value="">Select Categories</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-zinc-900">Flight Departure City</label>
                  <select value={flightCity} onChange={e => setFlightCity(e.target.value)} className="h-10 w-full rounded-md border border-zinc-200 px-3 text-sm outline-none focus:border-emerald-600 bg-white">
                    <option value="">Select Cities</option>
                    {/* Assuming we don't have this data readily available, just a placeholder or could map if available */}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-zinc-900">Sort By</label>
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="h-10 w-full rounded-md border border-zinc-200 px-3 text-sm outline-none focus:border-emerald-600 bg-white">
                    <option value="none">No sorting</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="duration_asc">Duration: Short to Long</option>
                    <option value="duration_desc">Duration: Long to Short</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

      {viewType === 'table' ? (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <div className="hidden grid-cols-[1.5fr_1fr_1fr_0.5fr_0.5fr_0.8fr_0.6fr] gap-4 border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-600 xl:grid">
            <div>Package Info</div>
            <div>Makkah Hotel</div>
            <div>Madinah Hotel</div>
            <div>Days</div>
            <div>Shifting</div>
            <div className="text-right">Total Price</div>
            <div className="text-right">Status</div>
          </div>

          <ul className="divide-y divide-zinc-200">
            {paginated.map((p) => {
              const makkahHotelName = p.extracted_makkah_hotel || p.hotels?.find(h => h.name.toLowerCase().includes('makkah') || h.type.toLowerCase().includes('makkah'))?.name;
              const madinahHotelName = p.extracted_madinah_hotel || p.hotels?.find(h => h.name.toLowerCase().includes('madinah') || h.type.toLowerCase().includes('madinah'))?.name;
              
              return (
                <li key={p.uuid} className="px-4 py-4 transition-colors hover:bg-zinc-50/50">
                  <Link
                    href={`/packages/${p.uuid}`}
                    target="_blank"
                    className="w-full text-left block"
                  >
                    <div className="grid grid-cols-1 gap-2 xl:grid-cols-[1.5fr_1fr_1fr_0.5fr_0.5fr_0.8fr_0.6fr] xl:items-center xl:gap-4">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-zinc-900">
                          {p.name}
                        </div>
                        <div className="truncate text-xs text-zinc-600">
                          {p.provider_name || "-"}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm text-zinc-800">
                          {makkahHotelName || "-"}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm text-zinc-800">
                          {madinahHotelName || "-"}
                        </div>
                      </div>
                      <div className="text-sm text-zinc-800">
                        {p.duration ? `${p.duration} Days` : "-"}
                      </div>
                      <div className="text-sm text-zinc-800">
                        {p.shifting ? "Yes" : "No"}
                      </div>
                      <div className="text-right text-sm font-semibold text-zinc-900">
                        {formatMoney(p.total_price)}
                      </div>
                      <div className="text-right text-sm">
                        <span
                          className={
                            p.isSoldOut
                              ? "rounded-full bg-red-50 px-2 py-1 text-red-700"
                              : p.available
                              ? "rounded-full bg-emerald-50 px-2 py-1 text-emerald-700"
                              : "rounded-full bg-zinc-100 px-2 py-1 text-zinc-700"
                          }
                        >
                          {p.isSoldOut ? "Sold Out" : p.available ? "Available" : "Full"}
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginated.map((p) => {
            const makkahHotelName = p.extracted_makkah_hotel || p.hotels?.find(h => h.name.toLowerCase().includes('makkah') || h.type.toLowerCase().includes('makkah'))?.name;
            const madinahHotelName = p.extracted_madinah_hotel || p.hotels?.find(h => h.name.toLowerCase().includes('madinah') || h.type.toLowerCase().includes('madinah'))?.name;
            
            return (
              <Link key={p.uuid} href={`/packages/${p.uuid}`} target="_blank" className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white hover:shadow-md transition-shadow group">
                <div className="flex flex-col p-5 gap-4 h-full">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-semibold text-zinc-900 text-lg leading-tight group-hover:text-emerald-600 transition-colors line-clamp-2">{p.name}</h3>
                    <span className={`shrink-0 whitespace-nowrap text-xs px-2.5 py-1 rounded-full ${p.isSoldOut ? "bg-red-50 text-red-700" : p.available ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-700"}`}>
                      {p.isSoldOut ? "Sold Out" : p.available ? "Available" : "Full"}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 text-xs font-medium text-zinc-600">
                    {p.duration && <span className="bg-zinc-100 px-2 py-1 rounded">{p.duration} Days</span>}
                    <span className="bg-zinc-100 px-2 py-1 rounded">{p.shifting ? "Shifting" : "Non-Shifting"}</span>
                    {p.category_name && <span className="bg-zinc-100 px-2 py-1 rounded truncate max-w-37.5">{p.category_name}</span>}
                  </div>

                  <div className="flex flex-col gap-2 mt-2 text-sm text-zinc-700">
                    <div className="flex gap-2 items-start">
                      <svg className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                      <div className="flex flex-col">
                        <span className="font-medium text-zinc-900 text-xs">Makkah Hotel</span>
                        <span className="truncate max-w-37.5" title={makkahHotelName || "-"}>{makkahHotelName || "-"}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 items-start">
                      <svg className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                      <div className="flex flex-col">
                        <span className="font-medium text-zinc-900 text-xs">Madinah Hotel</span>
                        <span className="truncate max-w-37.5" title={madinahHotelName || "-"}>{madinahHotelName || "-"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-zinc-100 flex items-center justify-between">
                    <span className="text-xs text-zinc-500 truncate max-w-37.5">{p.provider_name || "-"}</span>
                    <span className="text-lg font-bold text-zinc-900">{formatMoney(p.total_price)}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {!filtered.length ? (
        <div className="px-4 py-12 text-center text-sm text-zinc-600 border border-zinc-200 rounded-xl bg-white mt-4">
          No packages found.
        </div>
      ) : (
        <div className="flex flex-col items-center justify-between gap-4 border border-zinc-200 rounded-xl bg-white px-4 py-4 sm:flex-row mt-4">
            <div className="text-sm text-zinc-500">
              {startItem} - {endItem} of {filtered.length} items
            </div>
            
            {totalPages > 1 && (
              <div className="flex items-center gap-1 text-sm">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="flex h-8 w-8 items-center justify-center rounded text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-50 disabled:hover:bg-transparent"
                >
                  &lt;&lt;
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex h-8 w-8 items-center justify-center rounded text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-50 disabled:hover:bg-transparent"
                >
                  &lt;
                </button>

                {getPageNumbers().map((pageNum, idx) => {
                  if (pageNum === "...") {
                    return (
                      <span key={`ellipsis-${idx}`} className="px-1 text-zinc-400">
                        ...
                      </span>
                    );
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum as number)}
                      className={`flex h-8 w-8 items-center justify-center rounded ${
                        currentPage === pageNum
                          ? "bg-zinc-100 font-semibold text-zinc-900"
                          : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-50 disabled:hover:bg-transparent"
                >
                  &gt;
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-50 disabled:hover:bg-transparent"
                >
                  &gt;&gt;
                </button>
              </div>
            )}
          </div>
        )}
    </div>
  );
}
