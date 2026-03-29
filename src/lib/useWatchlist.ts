"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export function useWatchlist(userId: string | undefined) {
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWatchlist = useCallback(async () => {
    if (!userId || !supabase) {
      setWatchlist([]);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("watchlist")
      .select("country")
      .eq("user_id", userId);
    setWatchlist((data || []).map((d) => d.country));
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  const addCountry = useCallback(
    async (country: string) => {
      if (!userId || !supabase) return;
      await supabase
        .from("watchlist")
        .upsert(
          { user_id: userId, country },
          { onConflict: "user_id,country" },
        );
      setWatchlist((prev) => [...new Set([...prev, country])]);
    },
    [userId],
  );

  const removeCountry = useCallback(
    async (country: string) => {
      if (!userId || !supabase) return;
      await supabase
        .from("watchlist")
        .delete()
        .eq("user_id", userId)
        .eq("country", country);
      setWatchlist((prev) => prev.filter((c) => c !== country));
    },
    [userId],
  );

  const isWatching = useCallback(
    (country: string) => {
      return watchlist.includes(country);
    },
    [watchlist],
  );

  return { watchlist, loading, addCountry, removeCountry, isWatching };
}
