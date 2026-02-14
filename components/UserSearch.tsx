"use client";

import { useState, useEffect, useRef } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import Image from "next/image";

interface SearchResult {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
}

interface UserSearchProps {
  onSelect: (user: SearchResult) => void;
}

export function UserSearch({ onSelect }: UserSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.length < 2) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { token } = await sdk.quickAuth.getToken();
        const res = await fetch(
          `/api/user-search?q=${encodeURIComponent(query)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        setResults(data.users ?? []);
      } catch (err) {
        console.warn("User search failed:", err);
        setResults([]);
      }
      setLoading(false);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  return (
    <div>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by username..."
          className="w-full px-4 py-3 rounded-xl bg-black/60 border border-orange-900/30 text-orange-100 placeholder-orange-200/30 focus:outline-none focus:border-orange-600/60 transition-colors"
          autoFocus
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-orange-600/40 border-t-orange-400 rounded-full animate-spin" />
          </div>
        )}
      </div>

      <div aria-live="polite" className="sr-only">
        {loading ? "Searching..." : results.length > 0 ? `${results.length} users found` : query.length >= 2 ? "No users found" : ""}
      </div>

      {results.length > 0 && (
        <div className="mt-2 space-y-1.5 max-h-64 overflow-y-auto" role="listbox" aria-label="Search results">
          {results.map((user) => (
            <button
              key={user.fid}
              onClick={() => onSelect(user)}
              role="option"
              aria-label={`Select ${user.displayName || user.username}`}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-orange-900/20 hover:border-orange-700/40 hover:bg-orange-900/10 transition-all text-left"
            >
              {user.pfpUrl ? (
                <Image
                  src={user.pfpUrl}
                  alt={user.username}
                  width={40}
                  height={40}
                  className="rounded-full border border-orange-800/40"
                  unoptimized
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-600 to-red-700 flex items-center justify-center text-sm font-bold">
                  {user.username[0]?.toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-orange-100">
                  {user.displayName || user.username}
                </p>
                <p className="text-xs text-orange-200/50">@{user.username}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {query.length >= 2 && !loading && results.length === 0 && (
        <p className="mt-3 text-center text-sm text-orange-200/40">
          No users found
        </p>
      )}
    </div>
  );
}
