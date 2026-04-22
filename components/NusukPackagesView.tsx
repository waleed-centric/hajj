"use client";

import { useMemo, useState } from "react";
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

export function NusukPackagesView(props: {
  source: string;
  lastUpdated: string | null;
  packages: NusukPackage[];
}) {
  const [query, setQuery] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [category, setCategory] = useState<string>("all");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of props.packages) {
      if (p.category_name) set.add(p.category_name);
    }
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [props.packages]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return props.packages.filter((p) => {
      if (availableOnly && !p.available) return false;
      if (category !== "all" && p.category_name !== category) return false;
      if (!q) return true;
      const hay = `${p.name} ${p.provider_name} ${p.category_name} ${p.zone_name ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [props.packages, query, availableOnly, category]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
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

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, provider, category..."
            className="h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400 sm:w-90"
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400 sm:w-55"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "all" ? "All categories" : c}
              </option>
            ))}
          </select>

          <label className="flex h-11 select-none items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 sm:w-auto">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(e) => setAvailableOnly(e.target.checked)}
              className="h-4 w-4"
            />
            Available only
          </label>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <div className="hidden grid-cols-[1.3fr_1fr_0.7fr_0.8fr_0.7fr_0.6fr] gap-4 border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-600 md:grid">
          <div>Name</div>
          <div>Provider</div>
          <div>Category</div>
          <div>Dates</div>
          <div className="text-right">Total</div>
          <div className="text-right">Status</div>
        </div>

        <ul className="divide-y divide-zinc-200">
          {filtered.map((p) => {
            const isOpen = expanded.has(p.uuid);
            return (
              <li key={p.uuid} className="px-4 py-4">
                <button
                  type="button"
                  onClick={() => {
                    const next = new Set(expanded);
                    if (next.has(p.uuid)) next.delete(p.uuid);
                    else next.add(p.uuid);
                    setExpanded(next);
                  }}
                  className="w-full text-left"
                >
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-[1.3fr_1fr_0.7fr_0.8fr_0.7fr_0.6fr] md:items-center md:gap-4">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-zinc-900">
                        {p.name}
                      </div>
                      <div className="truncate text-xs text-zinc-600">
                        {p.zone_name ? `${p.zone_name} • ` : ""}
                        {p.duration ? `${p.duration} days` : ""}
                        {p.shifting ? " • Shifting" : ""}
                      </div>
                    </div>
                    <div className="min-w-0 truncate text-sm text-zinc-800">
                      {p.provider_name || "-"}
                    </div>
                    <div className="min-w-0 truncate text-sm text-zinc-800">
                      {p.category_name || "-"}
                    </div>
                    <div className="text-sm text-zinc-800">
                      {formatDate(p.start_date)} - {formatDate(p.end_date)}
                    </div>
                    <div className="text-right text-sm font-semibold text-zinc-900">
                      {formatMoney(p.total_price)}
                    </div>
                    <div className="text-right text-sm">
                      <span
                        className={
                          p.available
                            ? "rounded-full bg-emerald-50 px-2 py-1 text-emerald-700"
                            : "rounded-full bg-zinc-100 px-2 py-1 text-zinc-700"
                        }
                      >
                        {p.available ? "Available" : "Full"}
                      </span>
                    </div>
                  </div>
                </button>

                {isOpen ? (
                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-zinc-600">
                        Camps
                      </div>
                      <ul className="mt-2 space-y-1 text-sm text-zinc-900">
                        {p.camps.length ? (
                          p.camps.map((c) => (
                            <li
                              key={`${p.uuid}-${c.name}`}
                              className="flex items-center justify-between gap-3"
                            >
                              <span className="min-w-0 truncate">{c.name}</span>
                              <span className="shrink-0 text-zinc-700">
                                {formatMoney(c.price)}
                                {c.available ? "" : " • Full"}
                              </span>
                            </li>
                          ))
                        ) : (
                          <li className="text-zinc-600">-</li>
                        )}
                      </ul>
                    </div>

                    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-zinc-600">
                        Hotels
                      </div>
                      <ul className="mt-2 space-y-1 text-sm text-zinc-900">
                        {p.hotels.length ? (
                          p.hotels.map((h) => (
                            <li
                              key={`${p.uuid}-${h.type}-${h.name}`}
                              className="flex flex-col gap-0.5"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <span className="min-w-0 truncate font-medium">
                                  {h.name}
                                </span>
                                <span className="shrink-0 text-xs text-zinc-600">
                                  {h.type}
                                </span>
                              </div>
                              <div className="text-xs text-zinc-600">
                                {formatDate(h.check_in)} - {formatDate(h.check_out)}
                              </div>
                            </li>
                          ))
                        ) : (
                          <li className="text-zinc-600">-</li>
                        )}
                      </ul>
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>

        {!filtered.length ? (
          <div className="px-4 py-12 text-center text-sm text-zinc-600">
            No packages found.
          </div>
        ) : null}
      </div>
    </div>
  );
}

