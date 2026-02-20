"use client";

import { useState, useCallback } from "react";
import { api } from "@/lib/api";
import { Track } from "@/lib/types";
import { TrackList } from "@/components/shared/track-list";
import { Search as SearchIcon } from "lucide-react";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await api.get<Track[]>(
        `/tracks?q=${encodeURIComponent(query.trim())}`,
      );
      setResults(data);
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setLoading(false);
    }
  }, [query]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Search</h1>

      {/* Search input */}
      <div className="relative max-w-lg mb-8">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search for tracks, artists, or albums..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="w-full pl-10 pr-4 py-3 bg-secondary rounded-full border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Searching...</p>
        </div>
      ) : results.length > 0 ? (
        <div>
          <h2 className="text-lg font-semibold mb-4">
            Results ({results.length})
          </h2>
          <TrackList tracks={results} showIndex onTrackDeleted={handleSearch} />
        </div>
      ) : searched ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No results found for "{query}"</p>
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>Search your music library</p>
        </div>
      )}
    </div>
  );
}
