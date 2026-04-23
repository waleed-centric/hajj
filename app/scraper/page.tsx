"use client";

import { useState, useEffect } from "react";

export default function ScraperPage() {
  const [cookie, setCookie] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    const savedCookie = localStorage.getItem("nusuk_cookie");
    if (savedCookie) {
      setCookie(savedCookie);
    }
  }, []);

  const handleScrape = async () => {
    setLoading(true);
    setResult(null);
    try {
      localStorage.setItem("nusuk_cookie", cookie);
      
      const res = await fetch("/api/scraper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cookie }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(`Success! ${data.message} (Count: ${data.count})`);
      } else {
        setResult(`Error: ${data.error}`);
      }
    } catch (err: any) {
      setResult(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-10 font-sans">
      <div className="w-full max-w-xl rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="mb-4 text-2xl font-semibold text-zinc-900">Nusuk Packages Scraper</h1>
        <p className="mb-6 text-sm text-zinc-600">
          Enter your cookie details to scrape the data. The API URL is now handled automatically.
        </p>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700">Cookie</label>
            <textarea 
              value={cookie} 
              onChange={e => setCookie(e.target.value)}
              placeholder="Paste the complete cookie string here (e.g. sessionId=...)"
              rows={6}
              className="mt-1 w-full rounded-md border border-zinc-300 p-2 text-sm text-zinc-900 outline-none focus:border-zinc-500"
            />
          </div>
          <button 
            onClick={handleScrape}
            disabled={loading || !cookie.trim()}
            className="mt-4 rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {loading ? "Scraping in progress..." : "Scrape Packages"}
          </button>
          
          {result && (
            <div className={`mt-4 rounded-md p-3 text-sm ${result.startsWith("Error") ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
              {result}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
