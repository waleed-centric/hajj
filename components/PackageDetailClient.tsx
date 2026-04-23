"use client";

import { useState, useEffect } from "react";
import type { NusukPackage } from "../services/nusukPackages";

function formatMoney(value: number) {
  if (!Number.isFinite(value)) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export function PackageDetailClient({ pkg: p }: { pkg: NusukPackage }) {
  const [details, setDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDetails() {
      const cookie = localStorage.getItem("nusuk_cookie");
      if (!cookie) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await fetch("/api/package-details", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: p.uuid, cookie }),
        });
        if (res.ok) {
          const result = await res.json();
          if (result.success) {
            setDetails(result.data);
          } else {
            setDetails(result);
          }
        }
      } catch (err) {
        console.error("Failed to load details", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDetails();
  }, [p.uuid]);

  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white p-0 shadow-sm overflow-hidden flex flex-col md:flex-row">
      {p.image_url ? (
        <div className="w-full md:w-1/3 bg-zinc-100 shrink-0">
          <img 
            src={p.image_url} 
            alt={p.name} 
            className="h-full w-full object-cover max-h-64 md:max-h-full" 
          />
        </div>
      ) : null}
      
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-block rounded-md bg-[#fdf8f3] px-2.5 py-1 text-xs font-semibold text-[#b8860b] mb-3">
              {p.category_name}
            </div>
            <h3 className="text-xl font-bold text-zinc-900">{p.name}</h3>
            <div className="mt-1 flex items-center gap-2 text-sm text-zinc-600">
              <span className="font-medium text-zinc-800">{p.provider_name}</span>
              {p.makkah_rating ? (
                <span className="flex items-center text-[#b8860b]">
                  {'★'.repeat(p.makkah_rating)}
                </span>
              ) : null}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-zinc-900">{formatMoney(p.total_price)}</div>
            {p.available_seats !== undefined && (
              <div className="text-xs font-medium text-emerald-600 mt-1">
                {p.available_seats} seats left
              </div>
            )}
          </div>
        </div>

        {p.description && (
          <p className="mt-4 text-sm leading-relaxed text-zinc-600 border-b border-zinc-100 pb-4">
            {p.description}
          </p>
        )}

        <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Camps Section */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">Camps</h4>
            {p.camps && p.camps.length > 0 ? (
              <ul className="space-y-2">
                {p.camps.map(c => (
                  <li key={c.name} className="flex justify-between items-center text-sm">
                    <span className="text-zinc-800">{c.name}</span>
                    <span className="font-medium text-zinc-900">{formatMoney(c.price)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-zinc-500 italic">No camps listed</p>
            )}
          </div>

          {/* Hotels Section */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">Hotels</h4>
            {p.hotels && p.hotels.length > 0 ? (
              <ul className="space-y-3">
                {p.hotels.map(h => (
                  <li key={h.name} className="text-sm">
                    <div className="font-medium text-zinc-800">{h.name}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">{h.type} • {formatDate(h.check_in)} to {formatDate(h.check_out)}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-zinc-500 italic">No hotels listed</p>
            )}
          </div>
        </div>

        {/* Dynamic Details from API */}
        <div className="mt-6 pt-4 border-t border-zinc-100">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
            Live API Details
            {isLoading && <span className="animate-pulse bg-zinc-200 h-2 w-12 rounded-full inline-block"></span>}
          </h4>
          
          {!isLoading && details ? (
            details.isHtml && details.htmlContent ? (
              <div className="rounded-lg border border-zinc-200 bg-white overflow-hidden" style={{ height: "600px" }}>
                <iframe
                  srcDoc={details.htmlContent}
                  className="w-full h-full border-0"
                  title="Package Details"
                  sandbox="allow-same-origin allow-scripts"
                />
              </div>
            ) : details.isHtml || details.error ? (
              <div className="rounded-lg bg-zinc-50 p-4 overflow-auto max-h-64 text-xs text-zinc-600 border border-zinc-200">
                <p className="font-semibold text-red-600 mb-2">
                  Notice: {details.error || "API returned HTML (possible session expiration or login requirement)."}
                </p>
                <pre className="font-mono text-[10px] whitespace-pre-wrap">{details.snippet || JSON.stringify(details, null, 2)}</pre>
              </div>
            ) : (
              <div className="rounded-lg bg-zinc-50 p-4 overflow-auto max-h-64 text-xs font-mono text-zinc-600 border border-zinc-200">
                <pre>{JSON.stringify(details, null, 2)}</pre>
              </div>
            )
          ) : !isLoading ? (
            <p className="text-xs text-zinc-500 italic">API not available without a valid session cookie.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
