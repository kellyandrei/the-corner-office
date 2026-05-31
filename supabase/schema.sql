-- ============================================================
-- The Corner Office — Supabase Database Schema
-- ============================================================
-- Run this entire file in:
-- Supabase Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================================


-- ── 1. SCHEDULES ─────────────────────────────────────────────
-- Stores each user's workday preferences (one row per user).

CREATE TABLE IF NOT EXISTS public.schedules (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_start   text NOT NULL DEFAULT '08:00',
  day_end     text NOT NULL DEFAULT '18:00',
  peak_start  text NOT NULL DEFAULT '09:00',
  peak_end    text NOT NULL DEFAULT '11:30',
  commitments text NOT NULL DEFAULT '',
  timezone    text NOT NULL DEFAULT 'Asia/Manila',
  focus_mode  boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

-- Auto-update updated_at on every row change
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER schedules_updated_at
  BEFORE UPDATE ON public.schedules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS: users can only see and edit their own schedule
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "schedules: select own" ON public.schedules
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "schedules: insert own" ON public.schedules
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "schedules: update own" ON public.schedules
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "schedules: delete own" ON public.schedules
  FOR DELETE USING (auth.uid() = user_id);


-- ── 2. TASKS ─────────────────────────────────────────────────
-- One row per task. Scoped to a user via user_id.

CREATE TABLE IF NOT EXISTS public.tasks (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title                text NOT NULL,
  description          text NOT NULL DEFAULT '',
  urgency              text NOT NULL DEFAULT 'Medium' CHECK (urgency IN ('High','Medium','Low')),
  importance           text NOT NULL DEFAULT 'Medium' CHECK (importance IN ('High','Medium','Low')),
  suggested_time_block text NOT NULL DEFAULT 'As scheduled',
  time_of_day          text NOT NULL DEFAULT 'Morning' CHECK (time_of_day IN ('Morning','Afternoon','Evening')),
  scheduled_date       date NOT NULL,
  has_hard_deadline    boolean NOT NULL DEFAULT false,
  status               text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed')),
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Index for fast per-user, per-date queries
CREATE INDEX IF NOT EXISTS tasks_user_date_idx ON public.tasks (user_id, scheduled_date);

-- RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks: select own" ON public.tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "tasks: insert own" ON public.tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tasks: update own" ON public.tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "tasks: delete own" ON public.tasks
  FOR DELETE USING (auth.uid() = user_id);


-- ── 3. SUBTASKS ──────────────────────────────────────────────
-- Child rows linked to a task. Cascade-delete when task is deleted.

CREATE TABLE IF NOT EXISTS public.subtasks (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id    uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  title      text NOT NULL,
  status     text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER subtasks_updated_at
  BEFORE UPDATE ON public.subtasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS subtasks_task_idx ON public.subtasks (task_id);

-- RLS: users can access subtasks that belong to their own tasks
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subtasks: select own" ON public.subtasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = subtasks.task_id
        AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "subtasks: insert own" ON public.subtasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = subtasks.task_id
        AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "subtasks: update own" ON public.subtasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = subtasks.task_id
        AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "subtasks: delete own" ON public.subtasks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = subtasks.task_id
        AND tasks.user_id = auth.uid()
    )
  );
