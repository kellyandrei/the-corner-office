// src/hooks/useTasks.js
// All database operations for tasks and subtasks.
// Tasks are scoped to the authenticated user via RLS (Row Level Security).

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

export function useTasks(userId) {
  const [tasks,   setTasks]   = useState([]);
  const [loading, setLoading] = useState(false);

  // ── Fetch all tasks (with nested subtasks) for this user ──────────────────
  const fetchTasks = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          subtasks (*)
        `)
        .eq("user_id", userId)
        .order("scheduled_date", { ascending: true })
        .order("created_at",     { ascending: true });

      if (error) throw error;

      // Sort subtasks by created_at within each task
      const normalized = (data || []).map(t => ({
        ...t,
        subtasks: (t.subtasks || []).sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        ),
      }));

      setTasks(normalized);
    } catch (err) {
      console.error("fetchTasks error:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // ── Insert a batch of parsed tasks + their subtasks ───────────────────────
  const addTasks = async (parsedTasks) => {
    if (!userId) return;

    for (const t of parsedTasks) {
      // Insert the parent task
      const { data: taskRow, error: taskErr } = await supabase
        .from("tasks")
        .insert({
          user_id:              userId,
          title:                t.title,
          description:          t.description,
          urgency:              t.urgency,
          importance:           t.importance,
          suggested_time_block: t.suggested_time_block,
          time_of_day:          t.time_of_day,
          scheduled_date:       t.scheduled_date,
          has_hard_deadline:    t.has_hard_deadline,
          status:               "pending",
        })
        .select()
        .single();

      if (taskErr) { console.error("Insert task error:", taskErr); continue; }

      // Insert subtasks linked to this task
      if (t.subtasks?.length) {
        const subRows = t.subtasks.map(title => ({
          task_id: taskRow.id,
          title,
          status: "pending",
        }));
        const { error: subErr } = await supabase.from("subtasks").insert(subRows);
        if (subErr) console.error("Insert subtasks error:", subErr);
      }
    }

    await fetchTasks(); // Refresh local state
  };

  // ── Toggle task complete / pending ────────────────────────────────────────
  const toggleComplete = async (taskId) => {
    const task    = tasks.find(t => t.id === taskId);
    if (!task) return;
    const next    = task.status === "completed" ? "pending" : "completed";

    // Optimistic update
    setTasks(prev => prev.map(t =>
      t.id === taskId
        ? { ...t, status: next, subtasks: t.subtasks.map(s => ({ ...s, status: next })) }
        : t
    ));

    // Persist task status
    await supabase.from("tasks").update({ status: next }).eq("id", taskId);

    // Persist all subtask statuses
    await supabase.from("subtasks").update({ status: next }).eq("task_id", taskId);
  };

  // ── Toggle individual subtask ─────────────────────────────────────────────
  const toggleSubtask = async (taskId, subtaskId) => {
    const task    = tasks.find(t => t.id === taskId);
    if (!task) return;
    const subtask = task.subtasks.find(s => s.id === subtaskId);
    if (!subtask) return;
    const next    = subtask.status === "completed" ? "pending" : "completed";

    // Optimistic update
    const updatedSubtasks = task.subtasks.map(s =>
      s.id === subtaskId ? { ...s, status: next } : s
    );
    const allDone = updatedSubtasks.every(s => s.status === "completed");

    setTasks(prev => prev.map(t =>
      t.id === taskId
        ? { ...t, status: allDone ? "completed" : "pending", subtasks: updatedSubtasks }
        : t
    ));

    // Persist subtask
    await supabase.from("subtasks").update({ status: next }).eq("id", subtaskId);

    // If all subtasks done, mark parent complete too
    if (allDone) {
      await supabase.from("tasks").update({ status: "completed" }).eq("id", taskId);
    } else if (task.status === "completed") {
      await supabase.from("tasks").update({ status: "pending" }).eq("id", taskId);
    }
  };

  // ── Delete a single task (subtasks cascade via DB foreign key) ────────────
  const deleteTask = async (taskId) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    await supabase.from("tasks").delete().eq("id", taskId);
  };

  // ── Clear all tasks for this user ─────────────────────────────────────────
  const clearAll = async () => {
    setTasks([]);
    await supabase.from("tasks").delete().eq("user_id", userId);
  };

  return { tasks, loading, addTasks, toggleComplete, toggleSubtask, deleteTask, clearAll, fetchTasks };
}
