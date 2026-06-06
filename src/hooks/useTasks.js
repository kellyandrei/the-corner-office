import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

// V4: extend task schema with visibility, assignee_id, team_id for connections/teams
export function useTasks(userId) {
  const [tasks,   setTasks]   = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTasks = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select(`*, subtasks (*)`)
        .eq("user_id", userId)
        .order("scheduled_date", { ascending: true })
        .order("created_at",     { ascending: true });

      if (error) throw error;

      const normalized = (data || []).map(t => ({
        ...t,
        subtasks: (t.subtasks || []).sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        ),
      }));
      setTasks(normalized);
    } catch (err) {
      console.error("fetchTasks:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // ── Insert batch of parsed tasks ──
  const addTasks = async (parsedTasks) => {
    if (!userId) return;
    for (const t of parsedTasks) {
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

      if (taskErr) { console.error("addTasks insert:", taskErr); continue; }

      if (t.subtasks?.length) {
        const subRows = t.subtasks.map(title => ({
          task_id: taskRow.id, title, status: "pending",
        }));
        const { error: subErr } = await supabase.from("subtasks").insert(subRows);
        if (subErr) console.error("addTasks subtasks:", subErr);
      }
    }
    await fetchTasks();
  };

  // ── Edit task fields ──
  const editTask = async (taskId, updates) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
    const { error } = await supabase
      .from("tasks")
      .update({
        title:                updates.title,
        description:          updates.description,
        urgency:              updates.urgency,
        importance:           updates.importance,
        suggested_time_block: updates.suggested_time_block,
        time_of_day:          updates.time_of_day,
        scheduled_date:       updates.scheduled_date,
        has_hard_deadline:    updates.has_hard_deadline,
      })
      .eq("id", taskId);

    if (error) { console.error("editTask:", error); await fetchTasks(); }
  };

  // ── Batch update subtasks (add / rename / delete) ──
  // Each entry: { id?, title, status, _action: 'keep'|'update'|'delete'|'new' }
  const updateSubtasks = async (taskId, subtaskChanges) => {
    for (const sub of subtaskChanges) {
      if (sub._action === "keep") continue;

      if (sub._action === "new") {
        await supabase.from("subtasks").insert({
          task_id: taskId,
          title:   sub.title.trim(),
          status:  "pending",
        });
      } else if (sub._action === "update" && sub.id) {
        await supabase.from("subtasks")
          .update({ title: sub.title.trim() })
          .eq("id", sub.id);
      } else if (sub._action === "delete" && sub.id) {
        await supabase.from("subtasks").delete().eq("id", sub.id);
      }
    }
    await fetchTasks();
  };

  // ── Toggle task complete/pending ──
  const toggleComplete = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const next = task.status === "completed" ? "pending" : "completed";

    setTasks(prev => prev.map(t =>
      t.id === taskId
        ? { ...t, status: next, subtasks: t.subtasks.map(s => ({ ...s, status: next })) }
        : t
    ));

    await supabase.from("tasks").update({ status: next }).eq("id", taskId);
    await supabase.from("subtasks").update({ status: next }).eq("task_id", taskId);
  };

  // ── Toggle subtask complete/pending ──
  const toggleSubtask = async (taskId, subtaskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const subtask = task.subtasks.find(s => s.id === subtaskId);
    if (!subtask) return;
    const next = subtask.status === "completed" ? "pending" : "completed";

    const updatedSubtasks = task.subtasks.map(s =>
      s.id === subtaskId ? { ...s, status: next } : s
    );
    const allDone = updatedSubtasks.every(s => s.status === "completed");

    setTasks(prev => prev.map(t =>
      t.id === taskId
        ? { ...t, status: allDone ? "completed" : "pending", subtasks: updatedSubtasks }
        : t
    ));

    await supabase.from("subtasks").update({ status: next }).eq("id", subtaskId);
    if (allDone) {
      await supabase.from("tasks").update({ status: "completed" }).eq("id", taskId);
    } else if (task.status === "completed") {
      await supabase.from("tasks").update({ status: "pending" }).eq("id", taskId);
    }
  };

  // ── Delete single task ──
  const deleteTask = async (taskId) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    await supabase.from("tasks").delete().eq("id", taskId);
  };

  // ── Delete all tasks for user ──
  const clearAll = async () => {
    setTasks([]);
    await supabase.from("tasks").delete().eq("user_id", userId);
  };

  return {
    tasks, loading,
    addTasks, editTask, updateSubtasks,
    toggleComplete, toggleSubtask,
    deleteTask, clearAll, fetchTasks,
  };
}
