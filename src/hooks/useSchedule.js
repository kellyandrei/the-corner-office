// src/hooks/useSchedule.js
// Persists the user's workday preferences (schedule context) in Supabase.
// Stored in the `schedules` table, one row per user.

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const DEFAULTS = {
  day_start:   "08:00",
  day_end:     "18:00",
  peak_start:  "09:00",
  peak_end:    "11:30",
  commitments: "Lunch from 12:00 to 1:00 PM.",
  timezone:    Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Manila",
  focus_mode:  false,
};

// Convert DB snake_case row → camelCase context object used by UI
const toCtx = (row) => ({
  dayStart:    row.day_start,
  dayEnd:      row.day_end,
  peakStart:   row.peak_start,
  peakEnd:     row.peak_end,
  commitments: row.commitments,
  timezone:    row.timezone,
  focusMode:   row.focus_mode,
});

// Convert UI camelCase context → DB snake_case
const toDB = (ctx, userId) => ({
  user_id:     userId,
  day_start:   ctx.dayStart,
  day_end:     ctx.dayEnd,
  peak_start:  ctx.peakStart,
  peak_end:    ctx.peakEnd,
  commitments: ctx.commitments,
  timezone:    ctx.timezone,
  focus_mode:  ctx.focusMode,
});

export function useSchedule(userId) {
  const [schedule,    setSchedule]    = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [isFirstTime, setIsFirstTime] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("schedules")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error || !data) {
        // No schedule yet — first-time user
        setIsFirstTime(true);
        setSchedule(toCtx({ ...DEFAULTS }));
      } else {
        setIsFirstTime(false);
        setSchedule(toCtx(data));
      }
      setLoading(false);
    };

    load();
  }, [userId]);

  // Save (upsert) schedule to DB
  const saveSchedule = async (ctx) => {
    setSchedule(ctx);
    setIsFirstTime(false);

    const { error } = await supabase
      .from("schedules")
      .upsert(toDB(ctx, userId), { onConflict: "user_id" });

    if (error) console.error("Save schedule error:", error);
  };

  // Update a single field (e.g. toggling focusMode from the Desk)
  const updateSchedule = async (ctx) => {
    setSchedule(ctx);
    await supabase
      .from("schedules")
      .upsert(toDB(ctx, userId), { onConflict: "user_id" });
  };

  return { schedule, loading, isFirstTime, saveSchedule, updateSchedule };
}
