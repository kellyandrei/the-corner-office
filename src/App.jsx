import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useAuth }     from "./hooks/useAuth";
import { useTasks }    from "./hooks/useTasks";
import { useSchedule } from "./hooks/useSchedule";
import { useTheme }    from "./hooks/useTheme";

// ─────────────────────────────────────────────
// Design tokens
// ─────────────────────────────────────────────
const T = {
  paper:  "var(--co-paper)",
  ink:    "var(--co-ink)",
  brass:  "var(--co-brass)",
  walnut: "var(--co-walnut)",
  serif:  "'EB Garamond', Georgia, serif",
  mono:   "'IBM Plex Mono', monospace",
};

// ─────────────────────────────────────────────
// Global styles — theme tokens + animations + responsive
// ─────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    :root, [data-theme="light"] {
      --co-paper:#F4F1EA; --co-ink:#2D2824; --co-brass:#8C7355; --co-walnut:#3E2723;
      --co-ink-05:rgba(45,40,36,0.05); --co-ink-07:rgba(45,40,36,0.07);
      --co-ink-10:rgba(45,40,36,0.1);  --co-ink-12:rgba(45,40,36,0.12);
      --co-ink-15:rgba(45,40,36,0.15); --co-ink-20:rgba(45,40,36,0.2);
      --co-ink-30:rgba(45,40,36,0.3);  --co-ink-40:rgba(45,40,36,0.4);
      --co-ink-50:rgba(45,40,36,0.5);  --co-ink-60:rgba(45,40,36,0.6);
      --co-ink-70:rgba(45,40,36,0.7);
      --co-brass-06:rgba(140,115,85,0.06); --co-brass-10:rgba(140,115,85,0.1);
      --co-brass-15:rgba(140,115,85,0.15); --co-brass-20:rgba(140,115,85,0.2);
      --co-brass-25:rgba(140,115,85,0.25); --co-brass-30:rgba(140,115,85,0.3);
      --co-surface:rgba(255,255,255,0.1); --co-dot:rgba(45,40,36,0.055);
      --co-overlay:rgba(45,40,36,0.55);
      --co-danger:#7a2020; --co-danger-bg:rgba(180,50,50,0.08); --co-danger-border:rgba(180,50,50,0.25);
      --co-green:rgba(50,120,50,0.4); --co-success:#2a6c2a;
    }
    [data-theme="dark"] {
      --co-paper:#1a1410; --co-ink:#E8E2D9; --co-brass:#A8895F; --co-walnut:#C4A882;
      --co-ink-05:rgba(232,226,217,0.05); --co-ink-07:rgba(232,226,217,0.07);
      --co-ink-10:rgba(232,226,217,0.1);  --co-ink-12:rgba(232,226,217,0.12);
      --co-ink-15:rgba(232,226,217,0.15); --co-ink-20:rgba(232,226,217,0.2);
      --co-ink-30:rgba(232,226,217,0.3);  --co-ink-40:rgba(232,226,217,0.4);
      --co-ink-50:rgba(232,226,217,0.5);  --co-ink-60:rgba(232,226,217,0.6);
      --co-ink-70:rgba(232,226,217,0.7);
      --co-brass-06:rgba(168,137,95,0.06); --co-brass-10:rgba(168,137,95,0.1);
      --co-brass-15:rgba(168,137,95,0.15); --co-brass-20:rgba(168,137,95,0.2);
      --co-brass-25:rgba(168,137,95,0.25); --co-brass-30:rgba(168,137,95,0.3);
      --co-surface:rgba(255,255,255,0.05); --co-dot:rgba(232,226,217,0.04);
      --co-overlay:rgba(10,8,6,0.75);
      --co-danger:#e87070; --co-danger-bg:rgba(220,80,80,0.08); --co-danger-border:rgba(220,80,80,0.25);
      --co-green:rgba(80,180,80,0.4); --co-success:#4caf50;
    }

    @keyframes co-spin  { to{transform:rotate(360deg)} }
    @keyframes co-pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
    @keyframes co-fade  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
    @keyframes co-slide { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
    @keyframes co-scale { from{opacity:0;transform:scale(0.97)} to{opacity:1;transform:scale(1)} }
    @keyframes co-reveal{ from{opacity:0;transform:translateY(32px)} to{opacity:1;transform:translateY(0)} }
    @keyframes co-reveal-left  { from{opacity:0;transform:translateX(-24px)} to{opacity:1;transform:translateX(0)} }
    @keyframes co-reveal-right { from{opacity:0;transform:translateX(24px)}  to{opacity:1;transform:translateX(0)} }
    @keyframes settings-slide-in { from{transform:translateX(100%);opacity:0} to{transform:translateX(0);opacity:1} }

    .co-fade  { animation:co-fade  0.5s ease forwards }
    .co-slide { animation:co-slide 0.35s ease forwards }
    .co-reveal { opacity:0 }
    .co-reveal.visible { animation:co-reveal 0.7s cubic-bezier(0.16,1,0.3,1) forwards }
    .co-reveal-left { opacity:0 }
    .co-reveal-left.visible { animation:co-reveal-left 0.7s cubic-bezier(0.16,1,0.3,1) forwards }
    .co-reveal-right { opacity:0 }
    .co-reveal-right.visible { animation:co-reveal-right 0.7s cubic-bezier(0.16,1,0.3,1) forwards }
    .co-scale { opacity:0 }
    .co-scale.visible { animation:co-scale 0.6s cubic-bezier(0.16,1,0.3,1) forwards }

    *  { box-sizing:border-box }
    ::selection { background:var(--co-brass);color:var(--co-paper) }
    input[type="time"]::-webkit-calendar-picker-indicator { opacity:0.3;cursor:pointer }
    html { scroll-behavior:smooth }

    .co-nav-text  { display:inline-flex;align-items:center;gap:4px }
    .co-nav-icon  { display:none }
    .co-nav-sub   { display:inline }
    @media(max-width:600px){
      .co-nav-text { display:none!important }
      .co-nav-icon { display:flex!important;align-items:center;justify-content:center }
      .co-nav-sub  { display:none!important }
    }
    @media(max-width:768px){
      .co-dump-header  { flex-direction:column!important;align-items:center!important;text-align:center!important }
      .co-dump-heading { font-size:clamp(26px,7vw,36px)!important;text-align:center!important }
      .co-dump-meta    { text-align:center!important }
      .co-dump-controls{ justify-content:center!important;flex-wrap:wrap!important;margin-top:12px }
    }
    @media(max-width:600px){
      .co-desk-top     { flex-direction:column!important;align-items:flex-start!important;gap:16px!important }
      .co-desk-actions { flex-wrap:wrap!important }
      .co-task-meta    { flex-wrap:wrap!important;gap:4px!important }
      .co-pillars      { grid-template-columns:1fr!important }
      .co-features     { grid-template-columns:1fr!important }
    }
  `}</style>
);

// ─────────────────────────────────────────────
// Scroll-reveal
// ─────────────────────────────────────────────
const useScrollReveal = () => {
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.style.animationDelay = (e.target.getAttribute("data-delay") || "0") + "ms";
          e.target.classList.add("visible");
        }
      }),
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".co-reveal,.co-reveal-left,.co-reveal-right,.co-scale")
      .forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);
};

// ─────────────────────────────────────────────
// Time-block utilities
// ─────────────────────────────────────────────
const toMinutes = (str) => {
  if (!str) return null;
  const s = str.trim().toUpperCase().replace(/\s+/g, " ");
  const isPM = s.includes("PM"), isAM = s.includes("AM");
  const clean = s.replace(/[APM\s]/gi, "");
  const [hStr, mStr] = clean.split(":");
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr || "0", 10);
  if (isNaN(h)) return null;
  if (isPM && h !== 12) h += 12;
  if (isAM && h === 12) h = 0;
  return h * 60 + (isNaN(m) ? 0 : m);
};

const parseTimeBlock = (block) => {
  if (!block || typeof block !== "string") return null;
  const norm = block.replace(/[–—]/g, "-");
  const match = norm.match(/^(.+?)\s*-\s*(.+)$/);
  if (!match) return null;
  let [, s, e] = match;
  s = s.trim(); e = e.trim();
  const endPM = /PM/i.test(e), endAM = /AM/i.test(e);
  if (!/[AP]M/i.test(s)) {
    if (endPM) {
      const sh = parseInt(s), eh = parseInt(e);
      s += (!isNaN(sh) && !isNaN(eh) && sh <= eh) ? " PM" : " AM";
    } else if (endAM) s += " AM";
  }
  const start = toMinutes(s), end = toMinutes(e);
  if (start === null || end === null) return null;
  return { start, end };
};

const blocksOverlap = (b1, b2) => {
  const t1 = parseTimeBlock(b1), t2 = parseTimeBlock(b2);
  if (!t1 || !t2) return false;
  return t1.start < t2.end && t2.start < t1.end;
};

const fmtMins = (mins) => {
  const h = Math.floor(mins / 60), m = mins % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
};

const formatTimeBlock = (s, e) => `${fmtMins(s)} – ${fmtMins(e)}`;

// Parse commitment text into blocked slots
const parseCommitmentSlots = (text) => {
  if (!text?.trim()) return [];
  const slots = [];
  const re = /(\d{1,2}(?::\d{2})?\s*(?:AM|PM)?)\s*(?:to|[-–—])\s*(\d{1,2}(?::\d{2})?\s*(?:AM|PM)?)/gi;
  for (const sentence of text.split(/[.;]/)) {
    for (const m of sentence.matchAll(re)) {
      let [, sStr, eStr] = m;
      sStr = sStr.trim(); eStr = eStr.trim();
      if (!/[AP]M/i.test(sStr)) {
        if (/PM/i.test(eStr)) {
          const sh = parseInt(sStr), eh = parseInt(eStr);
          sStr += (!isNaN(sh) && !isNaN(eh) && sh <= eh) ? " PM" : " AM";
        } else if (/AM/i.test(eStr)) sStr += " AM";
      }
      const start = toMinutes(sStr), end = toMinutes(eStr);
      if (start !== null && end !== null && end > start) {
        const label = sentence.trim().split(/\s+/).slice(0, 4).join(" ").replace(/[^a-zA-Z\s]/g, "").trim() || "commitment";
        slots.push({ label, start, end });
      }
    }
  }
  return slots;
};

// Auto-fix overlapping time blocks within the same day+section
const autoFixTimeBlocks = (parsedTasks) => {
  if (!parsedTasks?.length) return parsedTasks;
  const BOUNDS = { Morning: [8*60,12*60], Afternoon: [12*60,17*60], Evening: [17*60,22*60] };
  const groups = {};
  parsedTasks.forEach(t => {
    const k = `${t.scheduled_date}__${t.time_of_day}`;
    (groups[k] = groups[k] || []).push(t);
  });
  for (const group of Object.values(groups)) {
    if (group.length <= 1) continue;
    const [bStart, bEnd] = BOUNDS[group[0].time_of_day] || BOUNDS.Morning;
    group.sort((a, b) => {
      const pa = parseTimeBlock(a.suggested_time_block);
      const pb = parseTimeBlock(b.suggested_time_block);
      // FIX: skip auto-sort for tasks with unparseable blocks rather than silently placing at bStart
      if (!pa && !pb) return 0;
      if (!pa) return 1;
      if (!pb) return -1;
      return pa.start - pb.start;
    });
    let cursor = bStart;
    for (const task of group) {
      const blk = parseTimeBlock(task.suggested_time_block);
      // FIX: skip tasks with unparseable blocks entirely — don't clobber them
      if (!blk) continue;
      const dur = Math.max(blk.end - blk.start, 30);
      const end = Math.min(cursor + dur, bEnd);
      task.suggested_time_block = formatTimeBlock(cursor, end);
      cursor = end;
      if (cursor >= bEnd) break;
    }
  }
  return parsedTasks;
};

// Detect conflicts between parsed tasks and existing tasks / commitment slots
const detectConflicts = (parsedTasks, existingTasks, commitmentSlots) => {
  const conflicts = [];
  for (const parsed of parsedTasks) {
    if (conflicts.some(c => c.parsedTask === parsed)) continue;
    const pb = parseTimeBlock(parsed.suggested_time_block);
    const sameDay = existingTasks.filter(t => t.scheduled_date === parsed.scheduled_date && t.status !== "completed");
    for (const ex of sameDay) {
      if (blocksOverlap(parsed.suggested_time_block, ex.suggested_time_block)) {
        conflicts.push({ type: "task_overlap", parsedTask: parsed, conflictWith: ex, description: `overlaps with "${ex.title}" (${ex.suggested_time_block})` });
        break;
      }
    }
    if (!conflicts.some(c => c.parsedTask === parsed) && pb) {
      for (const slot of commitmentSlots) {
        if (pb.start < slot.end && slot.start < pb.end) {
          conflicts.push({ type: "commitment_conflict", parsedTask: parsed, conflictWith: slot, description: `falls during your "${slot.label}" (${formatTimeBlock(slot.start, slot.end)})` });
          break;
        }
      }
    }
  }
  return conflicts;
};

// ─────────────────────────────────────────────
// Quick Add — time block suggestion
// Looks at existing tasks for the selected date + time_of_day,
// finds the last occupied end time, and places the new task after it.
// Default duration: 60 minutes. Falls back to period start if no tasks exist.
// ─────────────────────────────────────────────
const PERIOD_BOUNDS = {
  Morning:   { start: 8  * 60, end: 12 * 60 },
  Afternoon: { start: 12 * 60, end: 17 * 60 },
  Evening:   { start: 17 * 60, end: 22 * 60 },
};
const DEFAULT_DURATION = 60; // minutes

const suggestTimeBlock = (tasks, scheduledDate, timeOfDay) => {
  const bounds = PERIOD_BOUNDS[timeOfDay] || PERIOD_BOUNDS.Morning;
  const samePeriod = tasks.filter(
    t => t.scheduled_date === scheduledDate &&
         t.time_of_day   === timeOfDay &&
         t.status        !== "completed"
  );

  let cursor = bounds.start;

  if (samePeriod.length > 0) {
    let latest = bounds.start;
    for (const t of samePeriod) {
      const blk = parseTimeBlock(t.suggested_time_block);
      if (blk && blk.end > latest) latest = blk.end;
    }
    cursor = latest;
  }

  const end = Math.min(cursor + DEFAULT_DURATION, bounds.end);

  if (cursor >= bounds.end) return formatTimeBlock(bounds.start, bounds.start + DEFAULT_DURATION);

  return formatTimeBlock(cursor, end);
};

// ─────────────────────────────────────────────
// Date helpers
// ─────────────────────────────────────────────
const getLocalDateISO = (tz) => {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year:"numeric", month:"2-digit", day:"2-digit" }).format(new Date());
  } catch { return new Date().toISOString().split("T")[0]; }
};
const getFormattedDate = (tz) => {
  try {
    return new Intl.DateTimeFormat("en-US", { weekday:"long", year:"numeric", month:"long", day:"numeric", timeZone: tz }).format(new Date());
  } catch { return new Date().toLocaleDateString("en-US", { weekday:"long", year:"numeric", month:"long", day:"numeric" }); }
};
const formatDisplayDate = (iso) => {
  try {
    const [y,m,d] = iso.split("-").map(Number);
    return new Intl.DateTimeFormat("en-US", { weekday:"long", year:"numeric", month:"long", day:"numeric" }).format(new Date(y,m-1,d));
  } catch { return iso; }
};
const offsetDate = (iso, days) => {
  try {
    const [y,m,d] = iso.split("-").map(Number);
    const dt = new Date(Date.UTC(y,m-1,d+days));
    return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth()+1).padStart(2,"0")}-${String(dt.getUTCDate()).padStart(2,"0")}`;
  } catch { return iso; }
};
const getTomorrow = (iso) => offsetDate(iso, 1);
const userTZ      = () => Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Manila";
const MONTHS      = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// ─────────────────────────────────────────────
// Legal texts
// ─────────────────────────────────────────────
const TOS_FULL = `Terms of Service — The Corner Office

Last updated: June 2026

By creating an account and using The Corner Office, you agree to these terms.

1. Use of Service
The Corner Office is a productivity tool for personal and professional use. You are responsible for all content you input.

2. Account Responsibility
You are responsible for maintaining the confidentiality of your credentials. Notify us immediately of any unauthorized use.

3. Data & Privacy
Your task data is stored securely and is accessible only to you. We do not sell, share, or monetize your personal data.

4. Acceptable Use
You agree not to use The Corner Office for any unlawful purpose, to distribute malware, or to attempt unauthorized access to our systems.

5. Availability
We strive for high availability but do not guarantee uninterrupted service. We may update the service at any time.

6. Limitation of Liability
The Corner Office is provided "as is" without warranties of any kind. We are not liable for any loss of data or business disruption.

7. Changes to Terms
We may update these terms from time to time. Continued use constitutes acceptance of updated terms.

8. Contact
For questions about these terms, use the Contact form available under Settings in the app.`;

const PRIVACY_FULL = `Privacy Policy — The Corner Office

Last updated: June 2026

1. Data We Collect
- Account information: email address and encrypted password
- Task data: titles, descriptions, schedules, and subtasks you create
- Preferences: workday rules, timezone, focus mode settings

2. How We Use Your Data
Your data is used solely to provide The Corner Office service:
- Supabase for secure database storage and authentication
- Google Gemini API to process task dumps (inputs are not stored by us)

3. Data Security
All data is protected by row-level security — only you can access your own records. Authentication is handled by Supabase, which is SOC 2 compliant.

4. Data Retention
Your data is retained as long as your account is active. You may delete your tasks at any time. Contact us for full account deletion.

5. Third-Party Services
- Supabase (database and authentication)
- Google Gemini (AI task parsing)
- Vercel (hosting and serverless functions)
- Brevo (transactional email)

6. Cookies
We use minimal session cookies for authentication only. No tracking or advertising cookies are used.

7. Contact
For privacy concerns, use the Contact form available under Settings in the app. Navigate to Settings → Contact to reach the support team directly.`;

// ─────────────────────────────────────────────
// Changelog
// ─────────────────────────────────────────────
const CHANGELOG = [
  {
    version: "v3.3",
    date: "June 2026",
    title: "The Quick Add Update",
    notes: [
      "Quick Add — add a task directly to the desk without going through the AI parser",
      "Smart time block suggestion places new tasks after existing ones in the same period",
      "Editable time block field lets you override the suggested slot before saving",
      "Focus Mode deferred tasks now correctly persist their updated date to the database",
      "Resolved React StrictMode dependency warnings in routing and conflict review logic",
      "autoFixTimeBlocks now skips tasks with unparseable time blocks instead of clobbering them",
      "Fixed desk header button row shifting position between empty and populated states",
    ],
  },
  {
    version: "v3.2",
    date: "June 2026",
    title: "The Intelligence Update",
    notes: [
      "Smart conflict review wizard lets you decide how to handle scheduling overlaps",
      "Optimized AI scheduling engine to automatically align and separate daily time blocks",
      "Commitments are now treated as hard-blocked slots to shield your personal time",
      "Focus on This — new distraction-free mode to isolate a single priority task full screen",
      "Fully editable subtasks — add, rename, or remove items at any time",
      "Richer, context-aware preparation tasks automatically generated for major deadlines",
    ],
  },
  {
    version: "v3.1",
    date: "June 2026",
    title: "The Polish Update",
    notes: [
      "Light and dark display modes — toggle seamlessly from the Settings panel",
      "Fluid responsive layout optimizations tailored for mobile and tablet screens",
      "Collapsible navigation layout to maximize workspace on smaller displays",
      "Introducing Chief of Staff — your unified command center replacing the old Inbox",
      "Streamlined, cinematic app loading sequence",
      "Integrated direct contact support form within Settings",
      "Better task prioritization with dedicated Deferred and Upcoming drawers on the desk",
    ],
  },
  {
    version: "v3.0",
    date: "June 2026",
    title: "The Full Desk Update",
    notes: [
      "Immersive landing page featuring an executive video hero background",
      "Fluid day-to-day navigation to easily browse past or future dates",
      "Full on-the-fly task editing — reschedule and reprioritize anytime",
      "Customizable Workday Rules accessible directly from your main desk layout",
      "Interactive calendar overlay with click-to-navigate date selection",
      "Executive Three integration to automatically hide deferred tasks when focus is active",
    ],
  },
  {
    version: "v2.0",
    date: "May 2026",
    title: "The Structure Update",
    notes: [
      "Interactive calendar brief with responsive month and year navigation",
      "Secure desk locking mechanism to protect your workspace instantly",
      "Cognitive focus framing — dims peripheral distractions to protect your flow",
      "Polished brand styling, including custom desktop workspace iconography",
      "Fluid, cinematic layout transitions and micro-animations across the desk",
    ],
  },
  {
    version: "v1.0",
    date: "May 2026",
    title: "Initial Release",
    notes: [
      "AI-powered Executive Commander engine capable of parsing unstructured daily entries",
      "The Dump — an infinite canvas for raw, freeform thought downloads",
      "The Desk — automatic chronological clustering into Morning, Afternoon, and Evening blocks",
      "Executive Three priority protocol to enforce daily workload boundaries",
      "Secure, encrypted cloud authentication and localized personal data ledgers",
    ],
  },
];

// ─────────────────────────────────────────────
// Primitives
// ─────────────────────────────────────────────
const Label = ({ children }) => (
  <span style={{ fontFamily:T.mono, fontSize:9, letterSpacing:"0.25em", textTransform:"uppercase", color:T.brass, display:"block", marginBottom:6 }}>{children}</span>
);

const Btn = ({ children, onClick, variant="primary", disabled=false, style:sx={}, type="button" }) => {
  const base = { fontFamily:T.mono, fontSize:10, letterSpacing:"0.2em", textTransform:"uppercase", padding:"10px 20px", cursor:disabled?"not-allowed":"pointer", border:"1px solid", display:"inline-flex", alignItems:"center", gap:6, fontWeight:500, transition:"all 0.35s", borderRadius:0, opacity:disabled?0.35:1 };
  const variants = {
    primary:   { background:T.ink,         borderColor:T.ink,   color:T.paper },
    secondary: { background:"transparent", borderColor:T.brass, color:T.brass },
    ghost:     { background:"transparent", border:"none",       color:T.ink, opacity:disabled?0.35:0.65 },
  };
  return <button type={type} onClick={disabled?undefined:onClick} style={{...base,...variants[variant],...sx}}>{children}</button>;
};

const Toggle = ({ on, onToggle }) => (
  <button onClick={onToggle} type="button" style={{ width:40, height:20, borderRadius:999, border:"none", cursor:"pointer", background:on?T.brass:"var(--co-ink-20)", display:"flex", alignItems:"center", padding:2, transition:"background 0.3s", flexShrink:0 }}>
    <div style={{ width:14, height:14, borderRadius:"50%", background:T.paper, transform:on?"translateX(20px)":"translateX(0)", transition:"transform 0.3s" }} />
  </button>
);

const Modal = ({ children, onClose, maxWidth=480 }) => createPortal(
  <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{ position:"fixed", inset:0, background:"var(--co-overlay)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9000, padding:16, animation:"co-fade 0.25s ease" }}>
    <div style={{ background:T.paper, border:"1px solid var(--co-ink-20)", padding:32, maxWidth, width:"100%", position:"relative", animation:"co-slide 0.3s ease", maxHeight:"90vh", overflowY:"auto" }}>
      <button onClick={onClose} style={{ position:"absolute", top:12, right:12, background:"none", border:"none", cursor:"pointer", color:"var(--co-ink-40)", fontSize:20, lineHeight:1 }}
        onMouseEnter={e=>e.currentTarget.style.color=T.ink} onMouseLeave={e=>e.currentTarget.style.color="var(--co-ink-40)"}>×</button>
      {children}
    </div>
  </div>,
  document.body
);

const Toast = ({ msg }) => msg ? (
  <div style={{ position:"fixed", bottom:48, left:"50%", transform:"translateX(-50%)", background:T.ink, color:T.paper, padding:"12px 24px", fontFamily:T.mono, fontSize:10, letterSpacing:"0.2em", textTransform:"uppercase", border:"1px solid var(--co-brass-30)", zIndex:999, whiteSpace:"nowrap", pointerEvents:"none", animation:"co-slide 0.3s ease" }}>{msg}</div>
) : null;

// ─────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────
const CalendarIcon = ({ size=14, color="currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const ChiefOfStaffIcon = ({ size=17, color="currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="5" r="2.5"/><rect x="5" y="10" width="14" height="9" rx="1"/><line x1="3" y1="19" x2="21" y2="19"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="15.5" x2="13" y2="15.5"/>
  </svg>
);

const DeskNavIcon = ({ size=17, color="currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="13" rx="1"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="16" x2="12" y2="21"/><line x1="6" y1="8" x2="18" y2="8"/><line x1="6" y1="11" x2="13" y2="11"/>
  </svg>
);

const LockNavIcon = ({ size=15, color="currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

// Desk lamp — Focus on This
const FocusIcon = ({ size=13, color="currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 5l-3 7h12l-3-7z"/><line x1="12" y1="12" x2="12" y2="18"/><line x1="8" y1="18" x2="16" y2="18"/>
    <line x1="6" y1="12" x2="4" y2="15"/><line x1="18" y1="12" x2="20" y2="15"/>
  </svg>
);

// Plus icon — Quick Add button
const PlusIcon = ({ size=13, color="currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

// ─────────────────────────────────────────────
// Quick Add Modal
// Minimal form — no AI, no subtasks, no conflict detection on save.
// Time block is auto-suggested from existing tasks and editable.
// ─────────────────────────────────────────────
const QuickAddModal = ({ onClose, onSave, tasks, defaultDate }) => {
  const [title,      setTitle]      = useState("");
  const [date,       setDate]       = useState(defaultDate);
  const [timeOfDay,  setTimeOfDay]  = useState("Morning");
  const [urgency,    setUrgency]    = useState("Medium");
  const [timeBlock,  setTimeBlock]  = useState(() => suggestTimeBlock(tasks, defaultDate, "Morning"));
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState(null);
  const titleRef = useRef(null);

  useEffect(() => { titleRef.current?.focus(); }, []);

  // Re-suggest time block whenever date or time-of-day changes
  useEffect(() => {
    setTimeBlock(suggestTimeBlock(tasks, date, timeOfDay));
  }, [date, timeOfDay, tasks]);

  const handleSave = async () => {
    if (!title.trim()) { setError("A title is required."); return; }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        title:                title.trim(),
        description:          "",
        urgency,
        importance:           "Medium",
        suggested_time_block: timeBlock,
        time_of_day:          timeOfDay,
        scheduled_date:       date,
        has_hard_deadline:    false,
      });
      onClose();
    } catch {
      setError("Couldn't add the task. Please try again.");
      setSaving(false);
    }
  };

  const inputStyle  = { width:"100%", background:"transparent", border:"none", borderBottom:"1px solid var(--co-ink-20)", padding:"6px 0", fontFamily:T.serif, fontSize:15, color:T.ink, outline:"none" };
  const selectStyle = { width:"100%", background:"transparent", border:"none", borderBottom:"1px solid var(--co-ink-20)", padding:"6px 0", fontFamily:T.mono, fontSize:10, color:T.ink, outline:"none", textTransform:"uppercase" };

  return (
    <Modal onClose={onClose} maxWidth={480}>
      <div style={{ fontFamily:T.serif, fontSize:20, color:T.walnut, marginBottom:4 }}>Add to the desk.</div>
      <p style={{ fontFamily:T.mono, fontSize:9, color:T.brass, letterSpacing:"0.2em", textTransform:"uppercase", marginBottom:28 }}>
        No AI involved. Just you and the desk.
      </p>

      {error && (
        <div style={{ background:"var(--co-danger-bg)", border:"1px solid var(--co-danger-border)", color:"var(--co-danger)", padding:"10px 14px", fontFamily:T.mono, fontSize:9, marginBottom:20 }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom:20 }}>
        <Label>Task</Label>
        <input
          ref={titleRef}
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSave()}
          placeholder="What needs to get done?"
          style={inputStyle}
        />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
        <div>
          <Label>Date</Label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={{ ...inputStyle, fontFamily:T.mono, fontSize:12 }}
          />
        </div>
        <div>
          <Label>Time of Day</Label>
          <select value={timeOfDay} onChange={e => setTimeOfDay(e.target.value)} style={selectStyle}>
            {["Morning","Afternoon","Evening"].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
      </div>

      <div style={{ marginBottom:20 }}>
        <Label>Urgency</Label>
        <select value={urgency} onChange={e => setUrgency(e.target.value)} style={selectStyle}>
          {["High","Medium","Low"].map(v => <option key={v} value={v}>{v}</option>)}
        </select>
      </div>

      <div style={{ marginBottom:28 }}>
        <Label>Time Block</Label>
        <input
          value={timeBlock}
          onChange={e => setTimeBlock(e.target.value)}
          placeholder="e.g. 9:00 – 10:00 AM"
          style={inputStyle}
        />
        <p style={{ fontFamily:T.mono, fontSize:8, color:"var(--co-ink-40)", letterSpacing:"0.1em", marginTop:6 }}>
          Suggested based on your existing tasks. Edit freely.
        </p>
      </div>

      <div style={{ display:"flex", gap:10 }}>
        <Btn onClick={handleSave} disabled={saving || !title.trim()} style={{ flex:1, justifyContent:"center" }}>
          {saving ? "Adding..." : "Add to desk."}
        </Btn>
        <Btn variant="secondary" onClick={onClose} style={{ justifyContent:"center" }}>Cancel.</Btn>
      </div>
    </Modal>
  );
};

// ─────────────────────────────────────────────
// Task Focus Modal — read/check only, blurred backdrop
// ─────────────────────────────────────────────
const TaskFocusModal = ({ task, onClose, onToggleSubtask, subtasksEdited }) => {
  const subs      = task.subtasks || [];
  const doneSubs  = subs.filter(s => s.status === "completed").length;
  const progress  = subs.length > 0 ? (doneSubs / subs.length) * 100 : 0;
  const crucial   = task.urgency === "High" && task.importance === "High";
  const subsLabel = subtasksEdited ? "Subtasks" : "Suggested subtasks";

  return createPortal(
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position:"fixed", inset:0, background:"var(--co-overlay)", backdropFilter:"blur(28px)", WebkitBackdropFilter:"blur(28px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9500, padding:24, animation:"co-fade 0.3s ease" }}>
      <div style={{ background:T.paper, border:"1px solid var(--co-ink-20)", padding:"48px 52px", maxWidth:580, width:"100%", position:"relative", animation:"co-scale 0.35s cubic-bezier(0.16,1,0.3,1)" }}>
        <button onClick={onClose} style={{ position:"absolute", top:16, right:20, background:"none", border:"none", cursor:"pointer", color:"var(--co-ink-40)", fontSize:20, lineHeight:1, transition:"color 0.2s" }}
          onMouseEnter={e=>e.currentTarget.style.color=T.ink} onMouseLeave={e=>e.currentTarget.style.color="var(--co-ink-40)"}>×</button>

        <p style={{ fontFamily:T.mono, fontSize:8, letterSpacing:"0.3em", textTransform:"uppercase", color:T.brass, marginBottom:16 }}>
          {crucial ? "Crucial · " : ""}{task.time_of_day}
          {task.has_hard_deadline && " · Strict Deadline"}
        </p>

        <div style={{ fontFamily:T.serif, fontSize:"clamp(22px,3.5vw,32px)", color:T.walnut, lineHeight:1.25, marginBottom:16 }}>
          {task.title}
        </div>

        <div style={{ fontFamily:T.mono, fontSize:10, color:"var(--co-ink-50)", letterSpacing:"0.15em", marginBottom:task.description ? 24 : 32 }}>
          ⏱ {task.suggested_time_block} &nbsp;·&nbsp; {formatDisplayDate(task.scheduled_date)}
        </div>

        {task.description && (
          <p style={{ fontFamily:T.serif, fontSize:14, fontStyle:"italic", color:"var(--co-ink-70)", borderLeft:"2px solid var(--co-brass-20)", paddingLeft:16, lineHeight:1.7, marginBottom:32 }}>
            "{task.description}"
          </p>
        )}

        {subs.length > 0 && (
          <div>
            <div style={{ fontFamily:T.mono, fontSize:9, letterSpacing:"0.2em", textTransform:"uppercase", color:T.brass, marginBottom:14 }}>
              📎 {subsLabel}
            </div>
            {subs.map(sub => (
              <div key={sub.id} onClick={() => onToggleSubtask(task.id, sub.id)}
                style={{ display:"flex", alignItems:"flex-start", gap:12, cursor:"pointer", marginBottom:12, padding:"8px 0", borderBottom:"1px solid var(--co-ink-07)", transition:"color 0.2s" }}
                onMouseEnter={e=>e.currentTarget.style.color=T.brass} onMouseLeave={e=>e.currentTarget.style.color=T.ink}>
                <span style={{ color:sub.status==="completed"?T.brass:"var(--co-ink-40)", fontSize:16, lineHeight:1, flexShrink:0 }}>
                  {sub.status==="completed" ? "☑" : "☐"}
                </span>
                <span style={{ fontFamily:T.serif, fontSize:15, textDecoration:sub.status==="completed"?"line-through":"none", opacity:sub.status==="completed"?0.5:1 }}>
                  {sub.title}
                </span>
              </div>
            ))}
            <div style={{ marginTop:20, height:2, background:"var(--co-ink-10)", borderRadius:1 }}>
              <div style={{ height:"100%", background:T.brass, width:`${progress}%`, transition:"width 0.4s ease", borderRadius:1 }} />
            </div>
            <p style={{ fontFamily:T.mono, fontSize:8, color:"var(--co-ink-40)", letterSpacing:"0.15em", textTransform:"uppercase", marginTop:8 }}>
              {doneSubs} of {subs.length} complete
            </p>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

// ─────────────────────────────────────────────
// Conflict Review Modal — one conflict at a time
// FIX: onComplete moved to useCallback in App to avoid stale closure
// ─────────────────────────────────────────────
const ConflictReviewModal = ({ conflicts, onComplete }) => {
  const [index,    setIndex]    = useState(0);
  const [accepted, setAccepted] = useState([]);
  const [rejected, setRejected] = useState([]);

  useEffect(() => {
    if (index >= conflicts.length) onComplete(accepted, rejected);
  }, [index, onComplete]); // FIX: onComplete included in deps — wrap in useCallback in App

  if (index >= conflicts.length) return null;

  const current = conflicts[index];
  const total   = conflicts.length;

  const resolve = (include) => {
    if (include) setAccepted(p => [...p, current.parsedTask]);
    else         setRejected(p => [...p, current.parsedTask]);
    setIndex(i => i + 1);
  };

  return (
    <Modal onClose={() => onComplete(accepted, [...rejected, ...conflicts.slice(index).map(c => c.parsedTask)])} maxWidth={460}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <p style={{ fontFamily:T.mono, fontSize:9, letterSpacing:"0.2em", textTransform:"uppercase", color:T.brass }}>
          Scheduling Conflict
        </p>
        <span style={{ fontFamily:T.mono, fontSize:9, color:"var(--co-ink-40)" }}>{index+1} of {total}</span>
      </div>
      <div style={{ height:2, background:"var(--co-ink-10)", marginBottom:24, borderRadius:1 }}>
        <div style={{ height:"100%", background:T.brass, width:`${((index)/total)*100}%`, transition:"width 0.3s" }} />
      </div>
      <div style={{ padding:"16px 20px", background:"var(--co-ink-05)", border:"1px solid var(--co-ink-10)", marginBottom:16 }}>
        <div style={{ fontFamily:T.serif, fontSize:17, color:T.walnut, marginBottom:6 }}>{current.parsedTask.title}</div>
        <div style={{ fontFamily:T.mono, fontSize:9, color:"var(--co-ink-50)", letterSpacing:"0.1em" }}>
          {current.parsedTask.suggested_time_block} &nbsp;·&nbsp; {current.parsedTask.scheduled_date}
        </div>
      </div>
      <p style={{ fontFamily:T.serif, fontSize:13, color:"var(--co-ink-70)", lineHeight:1.7, fontStyle:"italic", marginBottom:28 }}>
        This task {current.description}.
      </p>
      <div style={{ display:"flex", gap:10 }}>
        <Btn onClick={() => resolve(true)}  style={{ flex:1, justifyContent:"center" }}>Include anyway.</Btn>
        <Btn onClick={() => resolve(false)} variant="secondary" style={{ flex:1, justifyContent:"center" }}>Skip this task.</Btn>
      </div>
      <button onClick={() => onComplete(accepted, [...rejected, ...conflicts.slice(index).map(c => c.parsedTask)])}
        style={{ display:"block", margin:"14px auto 0", background:"none", border:"none", cursor:"pointer", fontFamily:T.mono, fontSize:8, letterSpacing:"0.15em", textTransform:"uppercase", color:"var(--co-ink-30)", textDecoration:"underline", textUnderlineOffset:2 }}>
        Skip all remaining
      </button>
    </Modal>
  );
};

// ─────────────────────────────────────────────
// Commitment Conflict Warning Modal
// ─────────────────────────────────────────────
const CommitmentConflictModal = ({ conflicts, onClose, onEditTask }) => {
  const [rescheduleTask, setRescheduleTask] = useState(null);

  return (
    <>
      <Modal onClose={onClose} maxWidth={520}>
        <div style={{ fontFamily:T.serif, fontSize:20, color:T.walnut, marginBottom:4 }}>
          {conflicts.length} task{conflicts.length!==1?"s":""} may now conflict.
        </div>
        <p style={{ fontFamily:T.serif, fontSize:13, color:"var(--co-ink-60)", fontStyle:"italic", lineHeight:1.7, marginBottom:24 }}>
          Your updated commitments overlap with the following tasks. Review and reschedule as needed.
        </p>
        <div style={{ marginBottom:24 }}>
          {conflicts.map(({ task, commitment }, i) => (
            <div key={task.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 0", borderBottom:i<conflicts.length-1?"1px solid var(--co-ink-07)":"none", gap:12 }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:T.serif, fontSize:14, color:T.walnut, marginBottom:3 }}>{task.title}</div>
                <div style={{ fontFamily:T.mono, fontSize:8, color:"var(--co-ink-50)", letterSpacing:"0.1em" }}>
                  {task.suggested_time_block} · {formatDisplayDate(task.scheduled_date)}
                </div>
                <div style={{ fontFamily:T.mono, fontSize:8, color:"var(--co-danger)", letterSpacing:"0.1em", marginTop:2 }}>
                  Conflicts with: {commitment.label} ({formatTimeBlock(commitment.start, commitment.end)})
                </div>
              </div>
              <Btn variant="secondary" onClick={() => setRescheduleTask(task)} style={{ fontSize:8, padding:"6px 12px", flexShrink:0 }}>
                Reschedule
              </Btn>
            </div>
          ))}
        </div>
        <Btn onClick={onClose} style={{ width:"100%", justifyContent:"center" }}>Noted. Dismiss.</Btn>
      </Modal>
      {rescheduleTask && (
        <TaskEditModal
          task={rescheduleTask}
          allTasks={[]}
          onClose={() => setRescheduleTask(null)}
          onSave={async (updates, subtaskChanges) => {
            await onEditTask(rescheduleTask.id, updates, subtaskChanges);
            setRescheduleTask(null);
          }}
        />
      )}
    </>
  );
};

// ─────────────────────────────────────────────
// Calendar Overlay
// ─────────────────────────────────────────────
const CalendarOverlay = ({ tasks, onClose, tz, onSelectDate }) => {
  const userTimezone = tz || userTZ();
  const todayISO     = getLocalDateISO(userTimezone);
  const [tY, tM]     = todayISO.split("-").map(Number);
  const [viewMode,    setViewMode]    = useState("month");
  const [currentDate, setCurrentDate] = useState(new Date(tY, tM-1, 1));

  const year = currentDate.getFullYear(), month = currentDate.getMonth();

  const prev = () => setCurrentDate(d => viewMode==="month" ? new Date(d.getFullYear(),d.getMonth()-1,1) : new Date(d.getFullYear()-1,d.getMonth(),1));
  const next = () => setCurrentDate(d => viewMode==="month" ? new Date(d.getFullYear(),d.getMonth()+1,1) : new Date(d.getFullYear()+1,d.getMonth(),1));

  const getDotsForDay = (y,m,day) => {
    const iso = `${y}-${String(m+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    return tasks.filter(t=>t.scheduled_date===iso&&t.status!=="completed")
      .map(t=>t.urgency==="High"&&t.importance==="High"?"crucial":(t.urgency==="High"||t.importance==="High")?"important":"routine");
  };

  const daysInMonth = new Date(year,month+1,0).getDate();
  const startOffset = new Date(year,month,1).getDay();
  const daysGrid    = Array(startOffset).fill(null).concat(Array.from({length:daysInMonth},(_,i)=>i+1));
  const weekDays    = ["Su","Mo","Tu","We","Th","Fr","Sa"];
  const dotColor    = { crucial:T.walnut, important:T.brass, routine:"var(--co-ink-30)" };

  return createPortal(
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{ position:"fixed", inset:0, background:"var(--co-overlay)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9000, padding:16, animation:"co-fade 0.25s ease" }}>
      <div style={{ background:T.paper, border:"1px solid var(--co-ink-20)", padding:32, maxWidth:520, width:"100%", position:"relative", animation:"co-slide 0.3s ease" }}>
        <button onClick={onClose} style={{ position:"absolute", top:12, right:12, background:"none", border:"none", cursor:"pointer", color:"var(--co-ink-40)", fontSize:20 }}>×</button>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24, paddingBottom:16, borderBottom:"1px solid var(--co-ink-10)" }}>
          <div>
            <div style={{ fontFamily:T.serif, fontSize:20, color:T.walnut, display:"flex", alignItems:"center", gap:8 }}>
              <CalendarIcon size={18} color={T.brass} />
              {viewMode==="month" ? `${MONTHS[month]} ${year}` : `${year} — Annual View`}
            </div>
            <p style={{ fontFamily:T.mono, fontSize:9, letterSpacing:"0.2em", textTransform:"uppercase", color:T.brass, marginTop:4 }}>
              {viewMode==="month" ? "Visual Brief Ledger" : "Annual Desk View"}
            </p>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <button onClick={()=>setViewMode(v=>v==="month"?"year":"month")}
              style={{ fontFamily:T.mono, fontSize:9, textTransform:"uppercase", letterSpacing:"0.15em", border:"1px solid var(--co-ink-15)", background:"none", padding:"5px 10px", cursor:"pointer", color:T.brass }}>
              {viewMode==="month"?"Year":"Month"}
            </button>
            <div style={{ display:"flex", gap:2, borderLeft:"1px solid var(--co-ink-10)", paddingLeft:8 }}>
              {[prev,next].map((fn,i)=>(
                <button key={i} onClick={fn} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--co-ink-50)", padding:"4px 8px", fontSize:16, lineHeight:1 }}>{i===0?"‹":"›"}</button>
              ))}
            </div>
          </div>
        </div>
        {viewMode==="month" && (<>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", textAlign:"center", fontFamily:T.mono, fontSize:9, textTransform:"uppercase", color:"var(--co-ink-40)", letterSpacing:"0.1em", paddingBottom:8, borderBottom:"1px solid var(--co-ink-07)", marginBottom:8 }}>
            {weekDays.map(d=><span key={d}>{d}</span>)}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"2px 0", textAlign:"center", fontFamily:T.mono, fontSize:11 }}>
            {daysGrid.map((day,idx) => {
              if (!day) return <div key={`e-${idx}`}/>;
              const dots    = getDotsForDay(year,month,day);
              const isToday = day===parseInt(todayISO.split("-")[2])&&month===tM-1&&year===tY;
              return (
                <div key={day} onClick={()=>{if(onSelectDate){const iso=`${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;onSelectDate(iso);}}}
                  style={{ padding:"6px 0", display:"flex", flexDirection:"column", alignItems:"center", gap:2, cursor:onSelectDate?"pointer":"default", borderRadius:4, transition:"background 0.2s" }}
                  onMouseEnter={e=>{if(onSelectDate)e.currentTarget.style.background="var(--co-brass-06)"}}
                  onMouseLeave={e=>{e.currentTarget.style.background="none"}}>
                  <span style={{ width:22, height:22, display:"flex", alignItems:"center", justifyContent:"center", border:isToday?`1px solid ${T.ink}`:"none", color:dots.length>0?T.brass:"var(--co-ink-50)", fontWeight:isToday?600:400 }}>{day}</span>
                  {dots.length>0&&<div style={{ display:"flex", gap:2 }}>{dots.slice(0,3).map((p,di)=><span key={di} style={{ width:4, height:4, borderRadius:"50%", background:dotColor[p] }}/>)}</div>}
                </div>
              );
            })}
          </div>
        </>)}
        {viewMode==="year" && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
            {MONTHS.map((m,mi)=>{
              const active    = tasks.filter(t=>t.scheduled_date?.startsWith(`${year}-${String(mi+1).padStart(2,"0")}`)&&t.status!=="completed").length;
              const isCurrent = mi===tM-1&&year===tY;
              return (
                <button key={m} onClick={()=>{setCurrentDate(new Date(year,mi,1));setViewMode("month");}}
                  style={{ background:"none", border:`1px solid ${isCurrent?T.brass:"var(--co-ink-12)"}`, padding:"12px 8px", cursor:"pointer", textAlign:"center", transition:"all 0.25s" }}
                  onMouseEnter={e=>e.currentTarget.style.background="var(--co-ink-05)"}
                  onMouseLeave={e=>e.currentTarget.style.background="none"}>
                  <div style={{ fontFamily:T.serif, fontSize:13, color:isCurrent?T.brass:T.ink, marginBottom:4 }}>{m}</div>
                  <div style={{ fontFamily:T.mono, fontSize:8, textTransform:"uppercase", letterSpacing:"0.15em", color:"var(--co-ink-40)" }}>{active>0?`${active} active`:"Clear"}</div>
                </button>
              );
            })}
          </div>
        )}
        <div style={{ marginTop:20, paddingTop:14, borderTop:"1px solid var(--co-ink-07)", display:"flex", justifyContent:"space-between", alignItems:"center", fontFamily:T.mono, fontSize:9, textTransform:"uppercase", letterSpacing:"0.1em", color:"var(--co-ink-40)" }}>
          <div style={{ display:"flex", gap:16 }}>
            {[["crucial","Crucial"],["important","Important"],["routine","Routine"]].map(([k,label])=>(
              <span key={k} style={{ display:"flex", alignItems:"center", gap:5 }}>
                <span style={{ width:6, height:6, borderRadius:"50%", background:dotColor[k], display:"inline-block" }}/>
                {label}
              </span>
            ))}
          </div>
          <span>{userTimezone}</span>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─────────────────────────────────────────────
// Lock Confirm
// ─────────────────────────────────────────────
const LockConfirm = ({ onConfirm, onCancel }) => (
  <Modal onClose={onCancel}>
    <div style={{ textAlign:"center" }}>
      <div style={{ fontFamily:T.serif, fontSize:22, color:T.walnut, marginBottom:12 }}>Lock the office?</div>
      <p style={{ fontFamily:T.serif, fontSize:13, color:"var(--co-ink-70)", lineHeight:1.7, marginBottom:28 }}>
        You'll be signed out. Your desk will be exactly as you left it when you return.
      </p>
      <Btn onClick={onConfirm} style={{ width:"100%", justifyContent:"center", marginBottom:10 }}>Lock it.</Btn>
      <Btn variant="secondary" onClick={onCancel} style={{ width:"100%", justifyContent:"center" }}>Stay at the desk.</Btn>
    </div>
  </Modal>
);

// ─────────────────────────────────────────────
// Task Edit Modal — with subtask editing + conflict check
// ─────────────────────────────────────────────
const TaskEditModal = ({ task, onSave, onClose, allTasks = [] }) => {
  const [form, setForm] = useState({
    title:                task.title,
    description:          task.description || "",
    urgency:              task.urgency,
    importance:           task.importance,
    suggested_time_block: task.suggested_time_block,
    time_of_day:          task.time_of_day,
    scheduled_date:       task.scheduled_date,
    has_hard_deadline:    task.has_hard_deadline,
  });
  const [editedSubs, setEditedSubs] = useState(
    () => (task.subtasks || []).map(s => ({ ...s, _action: "keep" }))
  );
  const [conflictWarning, setConflictWarning] = useState(null);

  const set     = (k,v) => setForm(p => ({...p,[k]:v}));
  const activeSubs = editedSubs.filter(s => s._action !== "delete");

  const addSub = () => {
    if (activeSubs.length >= 10) return;
    setEditedSubs(p => [...p, { id:null, title:"", status:"pending", _action:"new" }]);
  };

  const removeSub = (idx) => {
    if (activeSubs.length <= 1) return;
    const actual = editedSubs[idx];
    if (actual._action === "new") {
      setEditedSubs(p => p.filter((_,i) => i !== idx));
    } else {
      setEditedSubs(p => p.map((s,i) => i===idx ? {...s, _action:"delete"} : s));
    }
  };

  const updateSubTitle = (idx, title) => {
    setEditedSubs(p => p.map((s,i) => i!==idx ? s : { ...s, title, _action: s._action==="new"?"new":"update" }));
  };

  const handleSave = () => {
    if (conflictWarning) { onSave(form, editedSubs); return; }
    const conflicts = allTasks.filter(t =>
      t.id !== task.id &&
      t.scheduled_date === form.scheduled_date &&
      t.status !== "completed" &&
      blocksOverlap(form.suggested_time_block, t.suggested_time_block)
    );
    if (conflicts.length > 0) { setConflictWarning(conflicts[0]); return; }
    onSave(form, editedSubs);
  };

  const inputStyle  = { width:"100%", background:"transparent", border:"none", borderBottom:"1px solid var(--co-ink-20)", padding:"6px 0", fontFamily:T.serif, fontSize:15, color:T.ink, outline:"none" };
  const selectStyle = { width:"100%", background:"transparent", border:"none", borderBottom:"1px solid var(--co-ink-20)", padding:"6px 0", fontFamily:T.mono, fontSize:10, color:T.ink, outline:"none", textTransform:"uppercase" };

  return (
    <Modal onClose={onClose} maxWidth={540}>
      <div style={{ fontFamily:T.serif, fontSize:20, color:T.walnut, marginBottom:4 }}>Edit task</div>
      <p style={{ fontFamily:T.mono, fontSize:9, color:T.brass, letterSpacing:"0.2em", textTransform:"uppercase", marginBottom:24 }}>Changes reflect immediately on the desk.</p>

      {conflictWarning && (
        <div style={{ background:"var(--co-danger-bg)", border:"1px solid var(--co-danger-border)", padding:"12px 16px", marginBottom:20 }}>
          <p style={{ fontFamily:T.mono, fontSize:9, color:"var(--co-danger)", letterSpacing:"0.1em", marginBottom:10 }}>
            This overlaps with "{conflictWarning.title}" ({conflictWarning.suggested_time_block}). Save anyway?
          </p>
          <div style={{ display:"flex", gap:8 }}>
            <Btn onClick={() => onSave(form, editedSubs)} style={{ fontSize:8, padding:"6px 14px" }}>Save anyway.</Btn>
            <Btn variant="secondary" onClick={() => setConflictWarning(null)} style={{ fontSize:8, padding:"6px 14px" }}>Cancel.</Btn>
          </div>
        </div>
      )}

      <div style={{ marginBottom:18 }}><Label>Title</Label><input value={form.title} onChange={e=>set("title",e.target.value)} style={inputStyle}/></div>
      <div style={{ marginBottom:18 }}>
        <Label>Description</Label>
        <textarea value={form.description} onChange={e=>set("description",e.target.value)}
          style={{ ...inputStyle, border:"1px solid var(--co-ink-15)", padding:10, resize:"none", height:72, lineHeight:1.6, fontFamily:T.serif, fontSize:13 }}/>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:18 }}>
        <div><Label>Urgency</Label><select value={form.urgency} onChange={e=>set("urgency",e.target.value)} style={selectStyle}>{["High","Medium","Low"].map(v=><option key={v} value={v}>{v}</option>)}</select></div>
        <div><Label>Importance</Label><select value={form.importance} onChange={e=>set("importance",e.target.value)} style={selectStyle}>{["High","Medium","Low"].map(v=><option key={v} value={v}>{v}</option>)}</select></div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:18 }}>
        <div><Label>Scheduled Date</Label><input type="date" value={form.scheduled_date} onChange={e=>set("scheduled_date",e.target.value)} style={{ ...inputStyle, fontFamily:T.mono, fontSize:12 }}/></div>
        <div><Label>Time of Day</Label><select value={form.time_of_day} onChange={e=>set("time_of_day",e.target.value)} style={selectStyle}>{["Morning","Afternoon","Evening"].map(v=><option key={v} value={v}>{v}</option>)}</select></div>
      </div>
      <div style={{ marginBottom:18 }}><Label>Time Block</Label><input value={form.suggested_time_block} onChange={e=>set("suggested_time_block",e.target.value)} style={inputStyle} placeholder="e.g. 9:00 – 10:00 AM"/></div>
      <div style={{ marginBottom:24, display:"flex", alignItems:"center", gap:12, cursor:"pointer" }} onClick={()=>set("has_hard_deadline",!form.has_hard_deadline)}>
        <Toggle on={form.has_hard_deadline} onToggle={()=>set("has_hard_deadline",!form.has_hard_deadline)}/>
        <div>
          <div style={{ fontFamily:T.mono, fontSize:9, textTransform:"uppercase", letterSpacing:"0.15em", color:T.brass }}>Strict Deadline</div>
          <div style={{ fontFamily:T.serif, fontSize:11, color:"var(--co-ink-60)" }}>Mark this as a hard, unmovable deadline.</div>
        </div>
      </div>

      <div style={{ borderTop:"1px solid var(--co-ink-10)", paddingTop:20, marginBottom:24 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <Label>Subtasks ({activeSubs.length}/10)</Label>
          {activeSubs.length < 10 && (
            <button onClick={addSub} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:T.mono, fontSize:8, letterSpacing:"0.15em", textTransform:"uppercase", color:T.brass, textDecoration:"underline", textUnderlineOffset:2 }}>
              + Add
            </button>
          )}
        </div>
        {editedSubs.map((sub, idx) => sub._action === "delete" ? null : (
          <div key={idx} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
            <span style={{ color:"var(--co-ink-30)", fontSize:11 }}>·</span>
            <input value={sub.title} onChange={e => updateSubTitle(idx, e.target.value)} placeholder="Subtask title"
              style={{ flex:1, background:"transparent", border:"none", borderBottom:"1px solid var(--co-ink-12)", padding:"4px 0", fontFamily:T.serif, fontSize:13, color:T.ink, outline:"none" }}/>
            <button onClick={() => removeSub(idx)} disabled={activeSubs.length <= 1}
              style={{ background:"none", border:"none", cursor:activeSubs.length<=1?"not-allowed":"pointer", color:activeSubs.length<=1?"var(--co-ink-15)":"var(--co-ink-30)", fontSize:14, lineHeight:1, flexShrink:0, transition:"color 0.2s" }}
              onMouseEnter={e=>{if(activeSubs.length>1)e.currentTarget.style.color="var(--co-danger)"}}
              onMouseLeave={e=>e.currentTarget.style.color=activeSubs.length<=1?"var(--co-ink-15)":"var(--co-ink-30)"}>×</button>
          </div>
        ))}
      </div>

      {!conflictWarning && (
        <div style={{ display:"flex", gap:10 }}>
          <Btn onClick={handleSave} style={{ flex:1, justifyContent:"center" }}>Save changes.</Btn>
          <Btn variant="secondary" onClick={onClose} style={{ justifyContent:"center" }}>Cancel.</Btn>
        </div>
      )}
    </Modal>
  );
};

// ─────────────────────────────────────────────
// Workday Edit Modal
// ─────────────────────────────────────────────
const TZ_LIST = ["America/New_York","America/Chicago","America/Denver","America/Los_Angeles","Europe/London","Europe/Paris","Asia/Tokyo","Asia/Singapore","Asia/Manila","Australia/Sydney","Pacific/Auckland"];

const WorkdayEditModal = ({ current, onSave, onClose }) => {
  const [prefs, setPrefs] = useState({ ...current });
  const set = (k,v) => setPrefs(p=>({...p,[k]:v}));

  const timeInput = (label, key) => (
    <div>
      <Label>{label}</Label>
      <input type="time" value={prefs[key]} onChange={e=>set(key,e.target.value)}
        style={{ background:"transparent", border:"none", borderBottom:"1px solid var(--co-ink-20)", padding:"6px 0", fontFamily:T.mono, fontSize:12, color:T.ink, outline:"none", width:"100%" }}/>
    </div>
  );

  return (
    <Modal onClose={onClose} maxWidth={560}>
      <div style={{ fontFamily:T.serif, fontSize:22, color:T.walnut, marginBottom:4 }}>Workday Rules</div>
      <p style={{ fontFamily:T.mono, fontSize:9, color:T.brass, letterSpacing:"0.2em", textTransform:"uppercase", marginBottom:24 }}>Edit your preferences anytime.</p>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24, marginBottom:20 }}>
        {timeInput("When do you arrive?","dayStart")}
        {timeInput("When do you pack up?","dayEnd")}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24, marginBottom:20 }}>
        <div>
          <Label>Focus hours</Label>
          <div style={{ display:"flex", gap:8 }}>
            {["peakStart","peakEnd"].map(k=>(
              <input key={k} type="time" value={prefs[k]} onChange={e=>set(k,e.target.value)}
                style={{ background:"transparent", border:"none", borderBottom:"1px solid var(--co-ink-20)", padding:"4px 0", fontFamily:T.mono, fontSize:11, color:T.ink, outline:"none", flex:1 }}/>
            ))}
          </div>
        </div>
        <div>
          <Label>Timezone</Label>
          <select value={prefs.timezone} onChange={e=>set("timezone",e.target.value)}
            style={{ background:"transparent", border:"none", borderBottom:"1px solid var(--co-ink-20)", padding:"6px 0", fontFamily:T.mono, fontSize:10, color:T.ink, outline:"none", width:"100%", textTransform:"uppercase" }}>
            {!TZ_LIST.includes(prefs.timezone)&&<option value={prefs.timezone}>{prefs.timezone}</option>}
            {TZ_LIST.map(tz=><option key={tz} value={tz}>{tz}</option>)}
          </select>
        </div>
      </div>
      <div style={{ marginBottom:20 }}>
        <div onClick={()=>set("focusMode",!prefs.focusMode)} style={{ display:"flex", alignItems:"center", gap:12, cursor:"pointer" }}>
          <Toggle on={prefs.focusMode} onToggle={()=>set("focusMode",!prefs.focusMode)}/>
          <div>
            <div style={{ fontSize:13, fontWeight:500, color:T.walnut, marginBottom:2 }}>Focus Mode (Executive Three)</div>
            <p style={{ fontSize:11, fontFamily:T.serif, color:"var(--co-ink-60)" }}>Limit today to 3 balanced priorities.</p>
          </div>
        </div>
      </div>
      <div style={{ marginBottom:24 }}>
        <Label>Exceptions & commitments</Label>
        <textarea value={prefs.commitments} onChange={e=>set("commitments",e.target.value)}
          style={{ width:"100%", background:"transparent", border:"1px solid var(--co-ink-15)", padding:10, fontFamily:T.serif, fontSize:13, height:80, resize:"none", outline:"none", color:T.ink, lineHeight:1.6 }}/>
      </div>
      <div style={{ display:"flex", gap:10 }}>
        <Btn onClick={()=>onSave(prefs)} style={{ flex:1, justifyContent:"center" }}>Save rules.</Btn>
        <Btn variant="secondary" onClick={onClose} style={{ justifyContent:"center" }}>Cancel.</Btn>
      </div>
    </Modal>
  );
};

// ─────────────────────────────────────────────
// Settings Panel
// ─────────────────────────────────────────────
const SettingsPanel = ({ user, theme, toggleTheme, onClose }) => {
  const [activeSection,  setActiveSection]  = useState("profile");
  const [legalView,      setLegalView]      = useState(null);
  const [contactName,    setContactName]    = useState(user?.email?.split("@")[0] || "");
  const [contactEmail,   setContactEmail]   = useState(user?.email || "");
  const [contactSubject, setContactSubject] = useState("General Inquiry");
  const [contactMessage, setContactMessage] = useState("");
  const [contactStatus,  setContactStatus]  = useState(null);
  const [contactError,   setContactError]   = useState(null);

  const handleContactSubmit = async () => {
    if (!contactName.trim() || !contactMessage.trim()) { setContactError("Please fill in your name and message."); return; }
    setContactStatus("sending"); setContactError(null);
    try {
      const res = await fetch("/api/contact", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ name:contactName, email:contactEmail, subject:contactSubject, message:contactMessage }) });
      if (!res.ok) throw new Error();
      setContactStatus("sent");
    } catch {
      setContactStatus(null); setContactError("Couldn't send your message. Please try again.");
    }
  };

  const sections = [
    { id:"profile",    label:"Profile" },
    { id:"appearance", label:"Appearance" },
    { id:"contact",    label:"Contact" },
    { id:"legal",      label:"Legal" },
    { id:"changelog",  label:"What's New" },
  ];

  const rowStyle   = { padding:"14px 0", borderBottom:"1px solid var(--co-ink-07)", display:"flex", justifyContent:"space-between", alignItems:"center" };
  const inputStyle = { width:"100%", background:"transparent", border:"none", borderBottom:"1px solid var(--co-ink-20)", padding:"6px 0", fontFamily:T.serif, fontSize:14, color:T.ink, outline:"none" };

  return createPortal(
    <>
      <div onClick={onClose} style={{ position:"fixed", inset:0, background:"var(--co-overlay)", zIndex:9000, animation:"co-fade 0.2s ease" }}/>
      <div style={{ position:"fixed", top:0, right:0, bottom:0, width:"min(400px,92vw)", background:T.paper, borderLeft:"1px solid var(--co-ink-12)", zIndex:9001, display:"flex", flexDirection:"column", animation:"settings-slide-in 0.35s cubic-bezier(0.16,1,0.3,1) forwards", boxShadow:"-8px 0 32px var(--co-ink-07)" }}>
        <div style={{ padding:"24px 28px 20px", borderBottom:"1px solid var(--co-ink-10)", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
          <div>
            <div style={{ fontFamily:T.serif, fontSize:20, color:T.walnut }}>Settings</div>
            <p style={{ fontFamily:T.mono, fontSize:8, letterSpacing:"0.2em", textTransform:"uppercase", color:T.brass, marginTop:2 }}>Your corner office preferences</p>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--co-ink-40)", fontSize:20, lineHeight:1, padding:4, transition:"color 0.2s" }}
            onMouseEnter={e=>e.currentTarget.style.color=T.ink} onMouseLeave={e=>e.currentTarget.style.color="var(--co-ink-40)"}>×</button>
        </div>
        <div style={{ display:"flex", borderBottom:"1px solid var(--co-ink-10)", flexShrink:0, overflowX:"auto" }}>
          {sections.map(s=>(
            <button key={s.id} onClick={()=>{setActiveSection(s.id);setLegalView(null);}}
              style={{ flex:1, padding:"12px 0", background:"none", border:"none", borderBottom:activeSection===s.id?`2px solid ${T.brass}`:"2px solid transparent", cursor:"pointer", fontFamily:T.mono, fontSize:7, letterSpacing:"0.15em", textTransform:"uppercase", color:activeSection===s.id?T.brass:"var(--co-ink-50)", transition:"all 0.25s", marginBottom:-1, whiteSpace:"nowrap" }}>
              {s.label}
            </button>
          ))}
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"24px 28px" }}>
          {activeSection==="profile" && (
            <div className="co-slide">
              <p style={{ fontFamily:T.mono, fontSize:9, letterSpacing:"0.2em", textTransform:"uppercase", color:T.brass, marginBottom:16 }}>Account</p>
              <div style={rowStyle}><span style={{ fontFamily:T.mono, fontSize:9, color:"var(--co-ink-50)", textTransform:"uppercase", letterSpacing:"0.15em" }}>Email</span><span style={{ fontFamily:T.serif, fontSize:14, color:T.ink }}>{user?.email||"—"}</span></div>
              <div style={rowStyle}><span style={{ fontFamily:T.mono, fontSize:9, color:"var(--co-ink-50)", textTransform:"uppercase", letterSpacing:"0.15em" }}>Account ID</span><span style={{ fontFamily:T.mono, fontSize:9, color:"var(--co-ink-40)" }}>{user?.id?.slice(0,8)+"..."||"—"}</span></div>
              <div style={{ ...rowStyle, borderBottom:"none" }}><span style={{ fontFamily:T.mono, fontSize:9, color:"var(--co-ink-50)", textTransform:"uppercase", letterSpacing:"0.15em" }}>Member Since</span><span style={{ fontFamily:T.serif, fontSize:13, color:"var(--co-ink-70)" }}>{user?.created_at?new Date(user.created_at).toLocaleDateString("en-US",{month:"long",year:"numeric"}):"—"}</span></div>
              <div style={{ padding:"14px 16px", background:"var(--co-brass-06)", border:"1px solid var(--co-brass-15)", marginTop:16 }}>
                <p style={{ fontFamily:T.mono, fontSize:8, letterSpacing:"0.15em", textTransform:"uppercase", color:T.brass, marginBottom:6 }}>Note</p>
                <p style={{ fontFamily:T.serif, fontSize:12, color:"var(--co-ink-60)", lineHeight:1.7, fontStyle:"italic" }}>Email and password changes are not available at this time. Use the Contact tab for account assistance.</p>
              </div>
            </div>
          )}
          {activeSection==="appearance" && (
            <div className="co-slide">
              <p style={{ fontFamily:T.mono, fontSize:9, letterSpacing:"0.2em", textTransform:"uppercase", color:T.brass, marginBottom:16 }}>Display Mode</p>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"20px 0", borderBottom:"1px solid var(--co-ink-07)" }}>
                <div>
                  <div style={{ fontFamily:T.serif, fontSize:15, color:T.walnut, marginBottom:4 }}>{theme==="dark"?"Dark Mode":"Light Mode"}</div>
                  <p style={{ fontFamily:T.serif, fontSize:12, color:"var(--co-ink-50)", fontStyle:"italic" }}>{theme==="dark"?"The desk by lamplight.":"A brighter workspace."}</p>
                </div>
                <Toggle on={theme==="dark"} onToggle={toggleTheme}/>
              </div>
              <p style={{ fontFamily:T.serif, fontSize:12, color:"var(--co-ink-40)", fontStyle:"italic", marginTop:20, lineHeight:1.7 }}>Your preference is saved and persists across sessions.</p>
            </div>
          )}
          {activeSection==="contact" && (
            <div className="co-slide">
              {contactStatus==="sent" ? (
                <div style={{ textAlign:"center", padding:"32px 0" }}>
                  <div style={{ fontFamily:T.serif, fontSize:20, color:T.walnut, marginBottom:12 }}>Message received.</div>
                  <p style={{ fontFamily:T.serif, fontSize:13, color:"var(--co-ink-60)", lineHeight:1.7, fontStyle:"italic", marginBottom:24 }}>Your message has been received. We'll be in touch.</p>
                  <Btn variant="secondary" onClick={()=>{setContactStatus(null);setContactMessage("");}} style={{ margin:"0 auto" }}>Send another.</Btn>
                </div>
              ) : (
                <>
                  <p style={{ fontFamily:T.mono, fontSize:9, letterSpacing:"0.2em", textTransform:"uppercase", color:T.brass, marginBottom:20 }}>Get in Touch</p>
                  <div style={{ marginBottom:18 }}><Label>Name</Label><input value={contactName} onChange={e=>setContactName(e.target.value)} style={inputStyle} placeholder="Your name"/></div>
                  <div style={{ marginBottom:18 }}><Label>Email</Label><input value={contactEmail} readOnly style={{ ...inputStyle, opacity:0.65, cursor:"default" }}/></div>
                  <div style={{ marginBottom:18 }}>
                    <Label>Subject</Label>
                    <select value={contactSubject} onChange={e=>setContactSubject(e.target.value)} style={{ width:"100%", background:T.paper, border:"none", borderBottom:"1px solid var(--co-ink-20)", padding:"6px 0", fontFamily:T.mono, fontSize:10, color:T.ink, outline:"none" }}>
                      {["General Inquiry","Bug Report","Feature Request","Account Issue"].map(s=><option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom:24 }}>
                    <Label>Message</Label>
                    <textarea value={contactMessage} onChange={e=>setContactMessage(e.target.value)} placeholder="Write your message here..."
                      style={{ width:"100%", background:"transparent", border:"1px solid var(--co-ink-15)", padding:10, fontFamily:T.serif, fontSize:13, height:120, resize:"none", outline:"none", color:T.ink, lineHeight:1.6 }}/>
                  </div>
                  {contactError&&<div style={{ background:"var(--co-danger-bg)", border:"1px solid var(--co-danger-border)", color:"var(--co-danger)", padding:"10px 14px", fontFamily:T.mono, fontSize:9, marginBottom:16 }}>{contactError}</div>}
                  <Btn onClick={handleContactSubmit} disabled={contactStatus==="sending"} style={{ width:"100%", justifyContent:"center" }}>
                    {contactStatus==="sending"?"Sending...":"Send message."}
                  </Btn>
                </>
              )}
            </div>
          )}
          {activeSection==="legal" && !legalView && (
            <div className="co-slide">
              <p style={{ fontFamily:T.mono, fontSize:9, letterSpacing:"0.2em", textTransform:"uppercase", color:T.brass, marginBottom:16 }}>Legal Documents</p>
              {[{id:"tos",label:"Terms of Service",desc:"Your rights and responsibilities when using The Corner Office."},{id:"privacy",label:"Privacy Policy",desc:"How we collect, store, and protect your personal data."}].map(doc=>(
                <button key={doc.id} onClick={()=>setLegalView(doc.id)}
                  style={{ display:"flex", justifyContent:"space-between", alignItems:"center", width:"100%", padding:"16px 0", background:"none", border:"none", borderBottom:"1px solid var(--co-ink-07)", cursor:"pointer", textAlign:"left", transition:"padding-left 0.2s" }}
                  onMouseEnter={e=>e.currentTarget.style.paddingLeft="4px"} onMouseLeave={e=>e.currentTarget.style.paddingLeft="0"}>
                  <div>
                    <div style={{ fontFamily:T.serif, fontSize:15, color:T.walnut, marginBottom:3 }}>{doc.label}</div>
                    <div style={{ fontFamily:T.serif, fontSize:11, color:"var(--co-ink-50)", fontStyle:"italic" }}>{doc.desc}</div>
                  </div>
                  <span style={{ fontFamily:T.mono, fontSize:12, color:"var(--co-ink-30)", flexShrink:0, marginLeft:12 }}>›</span>
                </button>
              ))}
            </div>
          )}
          {activeSection==="legal" && legalView && (
            <div className="co-slide">
              <button onClick={()=>setLegalView(null)} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:T.mono, fontSize:8, letterSpacing:"0.2em", textTransform:"uppercase", color:T.brass, textDecoration:"underline", textUnderlineOffset:2, marginBottom:20, padding:0 }}>← Back</button>
              <div style={{ fontFamily:T.serif, fontSize:17, color:T.walnut, marginBottom:16 }}>{legalView==="tos"?"Terms of Service":"Privacy Policy"}</div>
              <div style={{ fontFamily:T.serif, fontSize:12, color:"var(--co-ink-70)", lineHeight:1.85, whiteSpace:"pre-line" }}>{legalView==="tos"?TOS_FULL:PRIVACY_FULL}</div>
            </div>
          )}
          {activeSection==="changelog" && (
            <div className="co-slide">
              <p style={{ fontFamily:T.mono, fontSize:9, letterSpacing:"0.2em", textTransform:"uppercase", color:T.brass, marginBottom:20 }}>Release History</p>
              {CHANGELOG.map((release,ri)=>(
                <div key={release.version} style={{ marginBottom:28, paddingBottom:28, borderBottom:ri<CHANGELOG.length-1?"1px solid var(--co-ink-07)":"none" }}>
                  <div style={{ display:"flex", alignItems:"baseline", gap:10, marginBottom:4 }}>
                    <span style={{ fontFamily:T.mono, fontSize:9, letterSpacing:"0.15em", background:ri===0?T.brass:"var(--co-ink-07)", color:ri===0?T.paper:"var(--co-ink-50)", padding:"2px 8px" }}>{release.version}</span>
                    <span style={{ fontFamily:T.mono, fontSize:8, color:"var(--co-ink-30)", letterSpacing:"0.1em" }}>{release.date}</span>
                  </div>
                  <div style={{ fontFamily:T.serif, fontSize:15, color:T.walnut, marginBottom:10, fontWeight:500 }}>{release.title}</div>
                  <ul style={{ listStyle:"none", padding:0, margin:0 }}>
                    {release.notes.map((note,ni)=>(
                      <li key={ni} style={{ fontFamily:T.serif, fontSize:12, color:"var(--co-ink-60)", lineHeight:1.7, fontStyle:"italic", paddingLeft:12, position:"relative", marginBottom:2 }}>
                        <span style={{ position:"absolute", left:0, color:T.brass, fontStyle:"normal" }}>·</span>{note}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ padding:"16px 28px", borderTop:"1px solid var(--co-ink-07)", flexShrink:0 }}>
          <p style={{ fontFamily:T.mono, fontSize:8, letterSpacing:"0.15em", textTransform:"uppercase", color:"var(--co-ink-30)", textAlign:"center" }}>
            The Corner Office · v3.3 · All Rights Reserved 2026
          </p>
        </div>
      </div>
    </>,
    document.body
  );
};

// ─────────────────────────────────────────────
// Shell
// ─────────────────────────────────────────────
const Shell = ({ view, setView, taskCount, toastMsg, onSignOut, tasks, schedule, onUpdateSchedule, user, theme, toggleTheme, children }) => {
  const [showLockConfirm, setShowLockConfirm] = useState(false);
  const [showSettings,    setShowSettings]    = useState(false);

  const navBase = { background:"none", border:"none", cursor:"pointer", fontFamily:T.mono, fontSize:10, letterSpacing:"0.2em", textTransform:"uppercase", padding:"6px 10px", transition:"color 0.25s" };

  return (
    <div style={{ minHeight:"100vh", background:T.paper, color:T.ink, fontFamily:T.mono, display:"flex", flexDirection:"column", alignItems:"center", padding:"32px 24px", backgroundImage:"radial-gradient(var(--co-dot) 1px, transparent 1px)", backgroundSize:"24px 24px" }}>
      <GlobalStyles/>

      {(view==="dump"||view==="desk") && (
        <nav className="co-fade" style={{ width:"100%", maxWidth:720, display:"flex", justifyContent:"space-between", alignItems:"center", paddingBottom:20, borderBottom:"1px solid var(--co-ink-10)", marginBottom:48 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontFamily:T.serif, fontSize:17, fontWeight:600, letterSpacing:"0.15em", border:"1px solid var(--co-ink-20)", padding:"3px 8px", color:T.walnut }}>C/O</span>
            <span className="co-nav-sub" style={{ fontSize:9, letterSpacing:"0.25em", textTransform:"uppercase", color:T.brass }}>The Corner Office</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:2 }}>
            <button className="co-nav-text" onClick={()=>setView("dump")} style={{ ...navBase, color:view==="dump"?T.brass:"var(--co-ink-60)" }}>Chief of Staff</button>
            <button className="co-nav-icon" onClick={()=>setView("dump")} title="Chief of Staff" style={{ ...navBase, color:view==="dump"?T.brass:"var(--co-ink-50)", padding:"6px 8px" }}><ChiefOfStaffIcon size={18}/></button>

            <button className="co-nav-text" onClick={()=>setView("desk")} style={{ ...navBase, color:view==="desk"?T.brass:"var(--co-ink-60)", display:"inline-flex", alignItems:"center", gap:4 }}>
              The Desk
              {taskCount>0&&<span style={{ background:T.brass, color:T.paper, fontSize:8, padding:"1px 5px" }}>{taskCount}</span>}
            </button>
            <button className="co-nav-icon" onClick={()=>setView("desk")} title="The Desk" style={{ ...navBase, color:view==="desk"?T.brass:"var(--co-ink-50)", padding:"6px 8px", position:"relative" }}>
              <DeskNavIcon size={18}/>
              {taskCount>0&&<span style={{ position:"absolute", top:2, right:2, background:T.brass, color:T.paper, fontSize:7, padding:"1px 4px", borderRadius:2, lineHeight:1.4 }}>{taskCount}</span>}
            </button>

            <button onClick={()=>setShowSettings(true)} title="Settings" style={{ ...navBase, color:"var(--co-ink-50)", padding:"6px 8px", display:"flex", alignItems:"center" }}
              onMouseEnter={e=>e.currentTarget.style.color=T.brass} onMouseLeave={e=>e.currentTarget.style.color="var(--co-ink-50)"}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>

            <button className="co-nav-text" onClick={()=>setShowLockConfirm(true)} style={{ ...navBase, color:T.brass, borderLeft:"1px solid var(--co-brass-20)", paddingLeft:14, marginLeft:4 }}>Lock</button>
            <button className="co-nav-icon" onClick={()=>setShowLockConfirm(true)} title="Lock" style={{ ...navBase, color:T.brass, padding:"6px 8px", borderLeft:"1px solid var(--co-brass-20)", marginLeft:4 }}><LockNavIcon size={15}/></button>
          </div>
        </nav>
      )}

      <main style={{ width:"100%", maxWidth:720, flex:1 }}>{children}</main>

      <footer style={{ width:"100%", maxWidth:720, textAlign:"center", marginTop:48, paddingTop:20, borderTop:"1px solid var(--co-ink-05)", fontSize:9, letterSpacing:"0.25em", textTransform:"uppercase", color:"var(--co-ink-30)", userSelect:"none" }}>
        The Corner Office · All Rights Reserved 2026
      </footer>

      <Toast msg={toastMsg}/>
      {showLockConfirm && <LockConfirm onConfirm={()=>{setShowLockConfirm(false);onSignOut();}} onCancel={()=>setShowLockConfirm(false)}/>}
      {showSettings    && <SettingsPanel user={user} theme={theme} toggleTheme={toggleTheme} onClose={()=>setShowSettings(false)}/>}
    </div>
  );
};

// ─────────────────────────────────────────────
// Splash
// ─────────────────────────────────────────────
const Splash = ({ onComplete }) => {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const timers = [
      setTimeout(()=>setPhase(1), 400),
      setTimeout(()=>setPhase(2), 1200),
      setTimeout(()=>setPhase(3), 3000),
      setTimeout(()=>onComplete(), 3800),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div style={{ position:"fixed", inset:0, background:"#0e0b08", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", zIndex:99999, opacity:phase===3?0:1, transition:phase===3?"opacity 0.8s ease":"none", userSelect:"none" }}>
      <style>{`
        @keyframes co-logo-in { from{opacity:0;transform:scale(0.92) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes co-sub-in  { from{opacity:0;letter-spacing:0.6em} to{opacity:1;letter-spacing:0.5em} }
        @keyframes co-line-draw { from{width:0} to{width:48px} }
      `}</style>
      <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(rgba(140,115,85,0.04) 1px, transparent 1px)", backgroundSize:"32px 32px", pointerEvents:"none" }}/>
      <div style={{ opacity:phase>=1?1:0, animation:phase>=1?"co-logo-in 0.9s cubic-bezier(0.16,1,0.3,1) forwards":"none", textAlign:"center" }}>
        <div style={{ height:1, background:"linear-gradient(to right, transparent, #8C7355, transparent)", opacity:phase>=2?1:0, animation:phase>=2?"co-line-draw 0.6s ease forwards":"none", margin:"0 auto 28px", transition:"opacity 0.3s" }}/>
        <div style={{ fontFamily:"'EB Garamond', Georgia, serif", fontSize:"clamp(64px,14vw,108px)", fontWeight:300, color:"#F4F1EA", letterSpacing:"0.15em", lineHeight:1, marginBottom:20 }}>C/O</div>
        <div style={{ opacity:phase>=2?1:0, animation:phase>=2?"co-sub-in 0.8s cubic-bezier(0.16,1,0.3,1) forwards":"none" }}>
          <p style={{ fontFamily:"'IBM Plex Mono', monospace", fontSize:9, letterSpacing:"0.5em", textTransform:"uppercase", color:"#8C7355", marginBottom:24 }}>The Corner Office</p>
        </div>
        <div style={{ height:1, background:"linear-gradient(to right, transparent, #8C7355, transparent)", opacity:phase>=2?1:0, animation:phase>=2?"co-line-draw 0.6s ease forwards":"none", margin:"0 auto", transition:"opacity 0.3s" }}/>
      </div>
      {phase>=2&&<p style={{ position:"absolute", bottom:48, fontFamily:"'IBM Plex Mono', monospace", fontSize:8, letterSpacing:"0.25em", textTransform:"uppercase", color:"rgba(244,241,234,0.2)", animation:"co-sub-in 1s ease forwards" }}>A quiet place for your focus.</p>}
    </div>
  );
};

// ─────────────────────────────────────────────
// Landing
// ─────────────────────────────────────────────
const Landing = ({ onEnter }) => {
  const VIDEO_URL = "https://videos.pexels.com/video-files/31804129/13550134_1440_2560_30fps.mp4";
  useScrollReveal();

  return (
    <div style={{ width:"100%", minHeight:"100vh", position:"relative", overflow:"hidden" }}>
      <GlobalStyles/>
      <div style={{ position:"fixed", inset:0, zIndex:0, background:"#1a1410" }}>
        <video autoPlay muted loop playsInline style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", opacity:0.45 }}><source src={VIDEO_URL} type="video/mp4"/></video>
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(160deg, rgba(26,14,8,0.72) 0%, rgba(45,20,10,0.55) 40%, rgba(26,14,8,0.80) 100%)" }}/>
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"35vh", background:"linear-gradient(to bottom, transparent, rgba(26,14,8,0.95))" }}/>
      </div>

      <div style={{ position:"relative", zIndex:1, minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"80px 32px 120px", textAlign:"center" }}>
        <div style={{ position:"absolute", top:0, left:0, right:0, padding:"28px 48px", display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"1px solid rgba(244,241,234,0.08)" }}>
          <span style={{ fontFamily:"'EB Garamond', Georgia, serif", fontSize:15, fontWeight:600, letterSpacing:"0.2em", border:"1px solid rgba(244,241,234,0.25)", padding:"4px 10px", color:"#F4F1EA" }}>C/O</span>
          <button onClick={onEnter} style={{ fontFamily:"'IBM Plex Mono', monospace", fontSize:9, letterSpacing:"0.25em", textTransform:"uppercase", background:"transparent", border:"1px solid rgba(244,241,234,0.3)", color:"rgba(244,241,234,0.75)", padding:"8px 18px", cursor:"pointer", transition:"all 0.35s" }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="#8C7355";e.currentTarget.style.color="#8C7355";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(244,241,234,0.3)";e.currentTarget.style.color="rgba(244,241,234,0.75)";}}>Sign In</button>
        </div>

        <div className="co-fade" style={{ maxWidth:640 }}>
          <p style={{ fontFamily:"'IBM Plex Mono', monospace", fontSize:9, letterSpacing:"0.45em", textTransform:"uppercase", color:"#8C7355", marginBottom:28 }}>Executive Productivity · AI-Powered</p>
          <div style={{ fontFamily:"'EB Garamond', Georgia, serif", fontSize:"clamp(72px,12vw,120px)", fontWeight:300, letterSpacing:"0.12em", color:"#F4F1EA", lineHeight:1, marginBottom:8 }}>C/O</div>
          <div style={{ fontFamily:"'IBM Plex Mono', monospace", fontSize:9, letterSpacing:"0.5em", textTransform:"uppercase", color:"rgba(244,241,234,0.45)", marginBottom:48 }}>The Corner Office</div>
          <div style={{ fontFamily:"'EB Garamond', Georgia, serif", fontSize:"clamp(22px,3.5vw,34px)", fontWeight:400, color:"#F4F1EA", lineHeight:1.35, marginBottom:20, letterSpacing:"-0.01em" }}>The desk where executives<br/>think without distraction.</div>
          <p style={{ fontFamily:"'EB Garamond', Georgia, serif", fontSize:17, color:"rgba(244,241,234,0.55)", lineHeight:1.75, marginBottom:56, fontStyle:"italic", maxWidth:480, margin:"0 auto 56px" }}>Dump everything on your mind. Your Chief of Staff sorts, schedules, and hands back a clean brief — one task at a time.</p>
          <div style={{ display:"flex", gap:12, justifyContent:"center", alignItems:"center", flexWrap:"wrap" }}>
            <button onClick={onEnter} style={{ fontFamily:"'IBM Plex Mono', monospace", fontSize:10, letterSpacing:"0.25em", textTransform:"uppercase", background:"#8C7355", border:"1px solid #8C7355", color:"#F4F1EA", padding:"14px 36px", cursor:"pointer", transition:"all 0.35s" }}
              onMouseEnter={e=>{e.currentTarget.style.background="#F4F1EA";e.currentTarget.style.color="#2D2824";e.currentTarget.style.borderColor="#F4F1EA";}}
              onMouseLeave={e=>{e.currentTarget.style.background="#8C7355";e.currentTarget.style.color="#F4F1EA";e.currentTarget.style.borderColor="#8C7355";}}>Enter the Office</button>
            <span style={{ fontFamily:"'IBM Plex Mono', monospace", fontSize:8, letterSpacing:"0.2em", textTransform:"uppercase", color:"rgba(244,241,234,0.3)" }}>Free · No credit card</span>
          </div>
        </div>

        <div style={{ position:"absolute", bottom:40, left:"50%", transform:"translateX(-50%)", display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
          <span style={{ fontFamily:"'IBM Plex Mono', monospace", fontSize:7, letterSpacing:"0.3em", textTransform:"uppercase", color:"rgba(244,241,234,0.25)" }}>Scroll</span>
          <div style={{ width:1, height:32, background:"linear-gradient(to bottom, rgba(244,241,234,0.25), transparent)" }}/>
        </div>
      </div>

      <div style={{ position:"relative", zIndex:1, background:"#F4F1EA", padding:"96px 32px" }}>
        <div style={{ maxWidth:720, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:64 }}>
            <p className="co-reveal" style={{ fontFamily:"'IBM Plex Mono', monospace", fontSize:9, letterSpacing:"0.35em", textTransform:"uppercase", color:"#8C7355", marginBottom:16 }}>How it works</p>
            <div className="co-reveal" data-delay="100" style={{ fontFamily:"'EB Garamond', Georgia, serif", fontSize:"clamp(24px,3vw,36px)", color:"#3E2723", fontWeight:400, lineHeight:1.3 }}>From chaos to clarity<br/>in three quiet steps.</div>
          </div>
          <div className="co-pillars" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:40, marginBottom:80 }}>
            {[
              { num:"01", title:"The Dump",   body:"Write anything. Meeting notes, scattered thoughts, half-formed ideas. Nothing is too messy for the inbox.", delay:0 },
              { num:"02", title:"AI Sorting", body:"Your Chief of Staff parses urgency, importance, and deadlines. You receive a structured, prioritized brief.", delay:120 },
              { num:"03", title:"The Desk",   body:"One cognitive load at a time. Morning, Afternoon, Evening — your day laid out with precision.", delay:240 },
            ].map(p=>(
              <div key={p.num} className="co-reveal" data-delay={p.delay} style={{ paddingTop:24, borderTop:"1px solid rgba(45,40,36,0.12)" }}>
                <div style={{ fontFamily:"'IBM Plex Mono', monospace", fontSize:9, letterSpacing:"0.3em", color:"#8C7355", marginBottom:16 }}>{p.num}</div>
                <div style={{ fontFamily:"'EB Garamond', Georgia, serif", fontSize:20, color:"#3E2723", marginBottom:12, fontWeight:500 }}>{p.title}</div>
                <p style={{ fontFamily:"'EB Garamond', Georgia, serif", fontSize:13, color:"rgba(45,40,36,0.6)", lineHeight:1.75, fontStyle:"italic" }}>{p.body}</p>
              </div>
            ))}
          </div>
          <div className="co-scale" style={{ textAlign:"center", padding:"56px 32px", background:"#3E2723", marginBottom:80 }}>
            <p style={{ fontFamily:"'EB Garamond', Georgia, serif", fontSize:"clamp(18px,2.5vw,26px)", color:"#F4F1EA", fontStyle:"italic", lineHeight:1.5, marginBottom:16 }}>"A clear desk is a clear mind."</p>
            <p style={{ fontFamily:"'IBM Plex Mono', monospace", fontSize:8, letterSpacing:"0.3em", textTransform:"uppercase", color:"#8C7355" }}>— Your Chief of Staff</p>
          </div>
          <div className="co-features" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:2, marginBottom:80 }}>
            {[
              { icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8C7355" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>, label:"Executive Three", desc:"Focus Mode limits today to 3 balanced priorities. Deadlines are never deferred." },
              { icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8C7355" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, label:"Calendar Ledger", desc:"Month and year views with ambient priority dots. Timezone-aware, always accurate." },
              { icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8C7355" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>, label:"Editable Briefs", desc:"Reschedule, reprioritize, or rename any task at any time. The desk adapts to you." },
              { icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8C7355" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>, label:"Secure by Default", desc:"Each desk is private. Row-level security ensures your briefs stay yours alone." },
            ].map(f=>(
              <div key={f.label} style={{ padding:"28px 24px", background:"rgba(45,40,36,0.03)", border:"1px solid rgba(45,40,36,0.07)", transition:"background 0.3s, border-color 0.3s" }}
                onMouseEnter={e=>{e.currentTarget.style.background="rgba(140,115,85,0.05)";e.currentTarget.style.borderColor="rgba(140,115,85,0.2)";}}
                onMouseLeave={e=>{e.currentTarget.style.background="rgba(45,40,36,0.03)";e.currentTarget.style.borderColor="rgba(45,40,36,0.07)";}}>
                <div style={{ marginBottom:12 }}>{f.icon}</div>
                <div style={{ fontFamily:"'EB Garamond', Georgia, serif", fontSize:16, color:"#3E2723", marginBottom:6, fontWeight:500 }}>{f.label}</div>
                <p style={{ fontFamily:"'EB Garamond', Georgia, serif", fontSize:12, color:"rgba(45,40,36,0.55)", lineHeight:1.7, fontStyle:"italic" }}>{f.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign:"center", paddingTop:16 }}>
            <p style={{ fontFamily:"'EB Garamond', Georgia, serif", fontSize:15, color:"rgba(45,40,36,0.5)", fontStyle:"italic", marginBottom:28 }}>No setup. No subscriptions. Just a clear desk.</p>
            <button onClick={onEnter} style={{ fontFamily:"'IBM Plex Mono', monospace", fontSize:10, letterSpacing:"0.25em", textTransform:"uppercase", background:"#2D2824", border:"1px solid #2D2824", color:"#F4F1EA", padding:"14px 40px", cursor:"pointer", transition:"all 0.35s" }}
              onMouseEnter={e=>{e.currentTarget.style.background="#8C7355";e.currentTarget.style.borderColor="#8C7355";}}
              onMouseLeave={e=>{e.currentTarget.style.background="#2D2824";e.currentTarget.style.borderColor="#2D2824";}}>Open Your Desk</button>
          </div>
          <div style={{ textAlign:"center", paddingTop:48, marginTop:48, borderTop:"1px solid rgba(45,40,36,0.08)", fontSize:9, letterSpacing:"0.25em", textTransform:"uppercase", color:"rgba(45,40,36,0.3)", fontFamily:"'IBM Plex Mono', monospace", userSelect:"none" }}>
            The Corner Office · All Rights Reserved 2026
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Lobby
// ─────────────────────────────────────────────
const Lobby = ({ onSignIn, onSignUp }) => {
  const [isSignUp,  setIsSignUp]  = useState(false);
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [error,     setError]     = useState(null);
  const [working,   setWorking]   = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [agreedToS, setAgreedToS] = useState(false);
  const [showLegal, setShowLegal] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (isSignUp && !agreedToS) { setError("Please agree to the Terms of Service and Privacy Policy to continue."); return; }
    setWorking(true);
    try {
      if (isSignUp) { await onSignUp(email, password); setConfirmed(true); }
      else          { await onSignIn(email, password); }
    } catch (err) {
      setError(err.message || "Something went wrong. Try again.");
    } finally { setWorking(false); }
  };

  if (confirmed) return (
    <div className="co-fade" style={{ maxWidth:400, margin:"auto", paddingTop:48, textAlign:"center" }}>
      <div style={{ fontFamily:T.serif, fontSize:88, fontWeight:300, letterSpacing:"0.2em", color:T.walnut, lineHeight:1 }}>C/O</div>
      <div style={{ marginTop:40, padding:32, border:"1px solid var(--co-ink-12)", background:"var(--co-surface)" }}>
        <div style={{ fontFamily:T.serif, fontSize:20, color:T.walnut, marginBottom:12 }}>Check your inbox.</div>
        <p style={{ fontFamily:T.serif, fontSize:13, color:"var(--co-ink-70)", lineHeight:1.7, marginBottom:8 }}>A confirmation link has been sent to <strong>{email}</strong>.</p>
        <p style={{ fontFamily:T.mono, fontSize:9, color:T.brass, letterSpacing:"0.15em", textTransform:"uppercase", lineHeight:1.8, marginBottom:20, padding:"10px 12px", border:"1px solid var(--co-brass-25)", background:"var(--co-brass-06)" }}>⚠ Can't find it? Check your spam or junk folder.</p>
        <button onClick={()=>{setConfirmed(false);setIsSignUp(false);}} style={{ fontFamily:T.mono, fontSize:9, textTransform:"uppercase", letterSpacing:"0.2em", background:"none", border:"none", cursor:"pointer", color:T.brass, textDecoration:"underline" }}>Back to sign in</button>
      </div>
    </div>
  );

  return (
    <div className="co-fade" style={{ maxWidth:400, margin:"auto", paddingTop:48, textAlign:"center" }}>
      <div style={{ fontFamily:T.serif, fontSize:88, fontWeight:300, letterSpacing:"0.2em", color:T.walnut, lineHeight:1 }}>C/O</div>
      <p style={{ fontSize:9, letterSpacing:"0.4em", textTransform:"uppercase", color:T.brass, marginTop:8, marginBottom:40, fontFamily:T.mono }}>A quiet place for your focus.</p>
      <form onSubmit={handleSubmit} style={{ background:"var(--co-surface)", border:"1px solid var(--co-ink-12)", padding:32, textAlign:"left" }}>
        <div style={{ fontFamily:T.serif, fontSize:18, textAlign:"center", marginBottom:24, paddingBottom:16, borderBottom:"1px solid var(--co-ink-07)" }}>
          {isSignUp ? "Let's set up your office." : "Credentials, please."}
        </div>
        {error&&<div style={{ background:"var(--co-danger-bg)", border:"1px solid var(--co-danger-border)", color:"var(--co-danger)", padding:"10px 14px", fontFamily:T.mono, fontSize:9, marginBottom:20 }}>{error}</div>}
        <div style={{ marginBottom:20 }}>
          <Label>Identity (Email)</Label>
          <input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder={isSignUp?"executive@domain.co":"executive@corneroffice.co"}
            style={{ width:"100%", background:"transparent", border:"none", borderBottom:"1px solid var(--co-ink-20)", padding:"6px 0", fontFamily:T.serif, fontSize:16, color:T.ink, outline:"none" }}/>
        </div>
        <div style={{ marginBottom:24 }}>
          <Label>Security Token</Label>
          <input required type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" minLength={6}
            style={{ width:"100%", background:"transparent", border:"none", borderBottom:"1px solid var(--co-ink-20)", padding:"6px 0", fontFamily:T.serif, fontSize:16, color:T.ink, outline:"none" }}/>
        </div>
        {isSignUp&&(
          <div style={{ marginBottom:20, display:"flex", alignItems:"flex-start", gap:10 }}>
            <input type="checkbox" id="tos-agree" checked={agreedToS} onChange={e=>setAgreedToS(e.target.checked)} style={{ marginTop:3, accentColor:T.brass, cursor:"pointer", flexShrink:0, width:13, height:13 }}/>
            <label htmlFor="tos-agree" style={{ fontFamily:T.mono, fontSize:9, letterSpacing:"0.1em", color:"var(--co-ink-60)", lineHeight:1.8, cursor:"pointer" }}>
              I agree to the{" "}
              <button type="button" onClick={()=>setShowLegal("tos")} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:T.mono, fontSize:9, color:T.brass, textDecoration:"underline", textUnderlineOffset:2, padding:0 }}>Terms of Service</button>
              {" "}and{" "}
              <button type="button" onClick={()=>setShowLegal("privacy")} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:T.mono, fontSize:9, color:T.brass, textDecoration:"underline", textUnderlineOffset:2, padding:0 }}>Privacy Policy</button>
            </label>
          </div>
        )}
        {showLegal&&(
          <Modal onClose={()=>setShowLegal(null)} maxWidth={520}>
            <div style={{ fontFamily:T.serif, fontSize:20, color:T.walnut, marginBottom:16 }}>{showLegal==="tos"?"Terms of Service":"Privacy Policy"}</div>
            <div style={{ fontFamily:T.serif, fontSize:12, color:"var(--co-ink-70)", lineHeight:1.85, whiteSpace:"pre-line", maxHeight:"55vh", overflowY:"auto", paddingRight:8 }}>
              {showLegal==="tos"?TOS_FULL:PRIVACY_FULL}
            </div>
            <div style={{ marginTop:20 }}><Btn onClick={()=>{setAgreedToS(true);setShowLegal(null);}} style={{ width:"100%", justifyContent:"center" }}>I agree. Close.</Btn></div>
          </Modal>
        )}
        <Btn type="submit" disabled={working||(isSignUp&&!agreedToS)} style={{ width:"100%", justifyContent:"center" }}>
          {working?"One moment...":isSignUp?"Register.":"Enter."}
        </Btn>
        <div style={{ textAlign:"center", marginTop:20, paddingTop:16, borderTop:"1px solid var(--co-ink-05)" }}>
          <button type="button" onClick={()=>{setIsSignUp(!isSignUp);setError(null);setEmail("");setPassword("");setAgreedToS(false);}}
            style={{ background:"none", border:"none", cursor:"pointer", fontFamily:T.mono, fontSize:9, letterSpacing:"0.2em", textTransform:"uppercase", color:T.brass, textDecoration:"underline", textUnderlineOffset:3 }}>
            {isSignUp?"Already registered? Log in.":"First day here? Register a desk."}
          </button>
        </div>
      </form>
    </div>
  );
};

// ─────────────────────────────────────────────
// Interview
// ─────────────────────────────────────────────
const Interview = ({ onComplete, initial }) => {
  const [prefs, setPrefs] = useState(initial || { dayStart:"08:00", dayEnd:"18:00", peakStart:"09:00", peakEnd:"11:30", commitments:"Lunch from 12:00 to 1:00 PM. Board updates on Tuesdays.", timezone:userTZ(), focusMode:false });
  const set = (k,v) => setPrefs(p=>({...p,[k]:v}));

  return (
    <div className="co-fade" style={{ maxWidth:560, margin:"auto", paddingBottom:48 }}>
      <div style={{ borderBottom:"1px solid var(--co-ink-10)", paddingBottom:24, marginBottom:32 }}>
        <div style={{ fontFamily:T.serif, fontSize:28, color:T.walnut }}>Before we sort the desk, tell us how you work.</div>
        <p style={{ fontSize:9, letterSpacing:"0.25em", textTransform:"uppercase", color:"var(--co-ink-50)", marginTop:10, fontFamily:T.mono }}>Ground rules & preferences</p>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:32, marginBottom:28 }}>
        {[["When do you arrive?","dayStart"],["When do you pack up?","dayEnd"]].map(([label,key])=>(
          <div key={key}><Label>{label}</Label><input type="time" value={prefs[key]} onChange={e=>set(key,e.target.value)} style={{ background:"transparent", border:"none", borderBottom:"1px solid var(--co-ink-20)", padding:"6px 0", fontFamily:T.mono, fontSize:12, color:T.ink, outline:"none", width:"100%" }}/></div>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:32, marginBottom:28 }}>
        <div>
          <Label>Your quiet focus hours</Label>
          <div style={{ display:"flex", gap:8 }}>
            {["peakStart","peakEnd"].map(k=>(
              <input key={k} type="time" value={prefs[k]} onChange={e=>set(k,e.target.value)} style={{ background:"transparent", border:"none", borderBottom:"1px solid var(--co-ink-20)", padding:"4px 0", fontFamily:T.mono, fontSize:11, color:T.ink, outline:"none", flex:1 }}/>
            ))}
          </div>
        </div>
        <div>
          <Label>Office Timezone</Label>
          <select value={prefs.timezone} onChange={e=>set("timezone",e.target.value)} style={{ background:"transparent", border:"none", borderBottom:"1px solid var(--co-ink-20)", padding:"6px 0", fontFamily:T.mono, fontSize:10, color:T.ink, outline:"none", width:"100%", textTransform:"uppercase" }}>
            {!TZ_LIST.includes(prefs.timezone)&&<option value={prefs.timezone}>{prefs.timezone}</option>}
            {TZ_LIST.map(tz=><option key={tz} value={tz}>{tz}</option>)}
          </select>
        </div>
      </div>
      <div style={{ borderTop:"1px solid var(--co-ink-10)", paddingTop:24, marginBottom:28 }}>
        <div onClick={()=>set("focusMode",!prefs.focusMode)} style={{ display:"flex", alignItems:"center", gap:14, cursor:"pointer" }}>
          <Toggle on={prefs.focusMode} onToggle={()=>set("focusMode",!prefs.focusMode)}/>
          <div>
            <div style={{ fontSize:13, fontWeight:500, color:T.walnut, marginBottom:3 }}>Focus Mode</div>
            <p style={{ fontSize:11, fontFamily:T.serif, color:"var(--co-ink-60)" }}>Strictly limit today's desk to 3 balanced priorities.</p>
          </div>
        </div>
      </div>
      <div style={{ borderTop:"1px solid var(--co-ink-10)", paddingTop:24, marginBottom:32 }}>
        <Label>Exceptions & commitments</Label>
        <textarea value={prefs.commitments} onChange={e=>set("commitments",e.target.value)} style={{ width:"100%", background:"transparent", border:"1px solid var(--co-ink-15)", padding:12, fontFamily:T.serif, fontSize:13, height:80, resize:"none", outline:"none", color:T.ink, lineHeight:1.6 }}/>
      </div>
      <Btn onClick={()=>onComplete(prefs)} style={{ width:"100%", justifyContent:"center" }}>That'll do.</Btn>
    </div>
  );
};

// ─────────────────────────────────────────────
// Dump
// ─────────────────────────────────────────────
const EXAMPLE_DUMP = `Check draft for Wednesday board deck.\nSign off on junior hire contract before tonight.\nSort through Q3 balance sheet audit — lock into focus hours if possible.\nReserve table for Friday lunch client sync.`;

const Dump = ({ onSubmit, prevInput, ctx, apiError, clearError }) => {
  const [text,       setText]       = useState(prevInput || "");
  const [listening,  setListening]  = useState(false);
  const [voiceError, setVoiceError] = useState(null);
  const recognitionRef     = useRef(null);
  const finalTranscriptRef = useRef("");
  const tz = ctx?.timezone || userTZ();

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setVoiceError("Voice input is not supported in this browser. Try Chrome or Edge."); return; }
    setVoiceError(null);
    finalTranscriptRef.current = text;
    const rec = new SR();
    rec.continuous = true; rec.interimResults = true; rec.lang = "en-US";
    recognitionRef.current = rec;
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const phrase = e.results[i][0].transcript;
        if (e.results[i].isFinal) { finalTranscriptRef.current = finalTranscriptRef.current ? finalTranscriptRef.current + "\n" + phrase.trim() : phrase.trim(); }
        else { interim = phrase; }
      }
      setText(finalTranscriptRef.current + (interim ? " " + interim : ""));
    };
    rec.onerror = (e) => { if (e.error !== "aborted") setVoiceError("Voice input stopped. " + e.error); setListening(false); };
    rec.onend   = () => setListening(false);
    rec.start();
    setListening(true);
  };
  const stopVoice = () => { recognitionRef.current?.stop(); setListening(false); };

  return (
    <div className="co-fade" style={{ maxWidth:680, margin:"auto", paddingBottom:32 }}>
      {apiError&&(
        <div style={{ border:"1px solid var(--co-danger-border)", background:"var(--co-danger-bg)", color:"var(--co-danger)", padding:"12px 16px", fontFamily:T.mono, fontSize:10, display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:28, gap:12 }}>
          <span>{apiError}</span>
          <button onClick={clearError} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:T.mono, fontSize:9, textTransform:"uppercase", color:"var(--co-danger)", textDecoration:"underline" }}>Dismiss</button>
        </div>
      )}
      <div className="co-dump-header" style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:20 }}>
        <div>
          <div className="co-dump-heading" style={{ fontFamily:T.serif, fontSize:36, color:T.walnut }}>What's on your mind?</div>
          <p className="co-dump-meta" style={{ fontFamily:T.mono, fontSize:9, letterSpacing:"0.2em", textTransform:"uppercase", color:T.brass, marginTop:6 }}>{getFormattedDate(tz)}</p>
        </div>
        <div className="co-dump-controls" style={{ display:"flex", gap:8, alignItems:"center" }}>
          <button onClick={listening?stopVoice:startVoice}
            style={{ background:listening?T.brass:"none", border:`1px solid ${listening?T.brass:"var(--co-brass-30)"}`, color:listening?T.paper:T.brass, padding:"5px 9px", cursor:"pointer", display:"flex", alignItems:"center", gap:5, transition:"all 0.3s" }}>
            {listening ? (
              <><span style={{ width:7, height:7, borderRadius:"50%", background:T.paper, animation:"co-pulse 1s infinite", display:"inline-block" }}/><span style={{ fontFamily:T.mono, fontSize:8, letterSpacing:"0.15em", textTransform:"uppercase" }}>Stop</span></>
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            )}
          </button>
          <button onClick={()=>setText(EXAMPLE_DUMP)} style={{ fontFamily:T.mono, fontSize:9, textTransform:"uppercase", letterSpacing:"0.2em", border:"1px solid var(--co-brass-30)", color:T.brass, background:"none", padding:"6px 12px", cursor:"pointer" }}>Example</button>
          {text.trim()&&<button onClick={()=>setText("")} style={{ fontFamily:T.mono, fontSize:9, textTransform:"uppercase", background:"none", border:"none", color:"var(--co-ink-50)", cursor:"pointer" }}>Clear</button>}
        </div>
      </div>
      <div style={{ borderLeft:`2px solid ${listening?T.brass:"var(--co-brass-30)"}`, background:listening?"var(--co-brass-06)":"var(--co-surface)", marginBottom:voiceError?8:28, transition:"all 0.3s" }}>
        <textarea autoFocus value={text} onChange={e=>setText(e.target.value)}
          placeholder={listening?"Listening... speak your tasks.":"Unload here. Chaotic lists, raw notes, meeting transcripts... I'll organize it."}
          style={{ width:"100%", background:"transparent", border:"none", padding:"16px 20px", fontFamily:T.serif, fontSize:18, resize:"none", height:"35vh", outline:"none", color:T.ink, lineHeight:1.7 }}/>
      </div>
      {voiceError&&<p style={{ fontFamily:T.mono, fontSize:9, color:"var(--co-danger)", letterSpacing:"0.1em", marginBottom:16 }}>{voiceError}</p>}
      {listening&&<p style={{ fontFamily:T.mono, fontSize:9, color:T.brass, marginBottom:10, letterSpacing:"0.15em", textTransform:"uppercase", display:"flex", alignItems:"center", gap:6 }}><span style={{ width:5, height:5, borderRadius:"50%", background:T.brass, animation:"co-pulse 1s infinite", display:"inline-block" }}/>Listening... speak freely.</p>}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontFamily:T.mono, fontSize:9, color:"var(--co-ink-40)" }}>Strict sorting criteria will apply.{ctx?.focusMode?" Focus Mode is active.":""}</span>
        <Btn onClick={()=>onSubmit(text)} disabled={!text.trim()}>Sort it.</Btn>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Loading
// ─────────────────────────────────────────────
const LOADING_STEPS = ["I'll take it from here.","Look away from the screen.","Have a glass of water.","Take a breath.","Laying out the desk..."];

const Loading = () => {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(()=>setStep(p=>Math.min(p+1,LOADING_STEPS.length-1)), 2500);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"50vh", gap:28 }}>
      <div style={{ width:28, height:28, border:"1.5px solid var(--co-brass-30)", borderTop:`1.5px solid ${T.brass}`, borderRadius:"50%", animation:"co-spin 1s linear infinite" }}/>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontFamily:T.serif, fontSize:22, color:"var(--co-ink-70)", marginBottom:10 }}>Sorting the brief...</div>
        <p style={{ fontFamily:T.mono, fontSize:9, letterSpacing:"0.2em", textTransform:"uppercase", color:T.brass }}>{LOADING_STEPS[step]}</p>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// TaskCard
// ─────────────────────────────────────────────
const TaskCard = ({ task, onToggleComplete, onToggleSubtask, onDelete, onEdit, onFocus, isBlurred, isExpanded, onToggleExpand, subtasksEdited }) => {
  const done     = task.status === "completed";
  const subs     = task.subtasks || [];
  const doneSubs = subs.filter(s => s.status === "completed").length;
  const crucial  = task.urgency === "High" && task.importance === "High";
  const subsLabel = subtasksEdited ? "Subtasks" : "Suggested subtasks";

  return (
    <div style={{ borderBottom:"1px solid var(--co-ink-10)", padding:"20px 0", opacity:done?0.4:isBlurred?0.15:1, filter:isBlurred?"blur(1.5px)":"none", transition:"opacity 0.4s, filter 0.4s", pointerEvents:isBlurred?"none":"auto" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12, cursor:"pointer" }} onClick={onToggleExpand}>
        <button type="button" onClick={e=>{e.stopPropagation();onToggleComplete(task.id);}}
          style={{ background:"none", border:done?"1px solid var(--co-green)":"none", cursor:"pointer", color:done?"var(--co-success)":T.brass, marginTop:2, flexShrink:0, padding:done?"2px 6px":0, fontFamily:T.mono, fontSize:8, letterSpacing:"0.15em", textTransform:"uppercase", transition:"all 0.3s" }}>
          {done?"Done":<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ display:"block", opacity:0.6 }}><rect x="3" y="3" width="18" height="18" rx="1"/></svg>}
        </button>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:T.serif, fontSize:17, color:done?"var(--co-ink-60)":T.walnut, textDecoration:done?"line-through":"none", marginBottom:6 }}>{task.title}</div>
          <div className="co-task-meta" style={{ display:"flex", flexWrap:"wrap", gap:"4px 10px", fontFamily:T.mono, fontSize:9, color:"var(--co-ink-50)", alignItems:"center" }}>
            <span>⏱ {task.suggested_time_block}</span>
            <span>·</span>
            <span style={{ textTransform:"uppercase", letterSpacing:"0.1em" }}>{crucial?"Crucial":"Normal"}</span>
            {task.has_hard_deadline&&(<><span>·</span><span style={{ color:T.brass, fontWeight:500, textTransform:"uppercase", letterSpacing:"0.15em" }}>Strict Deadline</span></>)}
            {subs.length>0&&(<><span>·</span><span>{doneSubs}/{subs.length} checked</span></>)}
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:4, flexShrink:0 }}>
          <button type="button" onClick={e=>{e.stopPropagation();onFocus(task);}} title="Focus on this task"
            style={{ background:"none", border:"none", cursor:"pointer", color:"var(--co-ink-30)", padding:4, transition:"color 0.3s" }}
            onMouseEnter={e=>e.currentTarget.style.color=T.brass} onMouseLeave={e=>e.currentTarget.style.color="var(--co-ink-30)"}>
            <FocusIcon size={13}/>
          </button>
          <button type="button" onClick={e=>{e.stopPropagation();onEdit(task);}} title="Edit task"
            style={{ background:"none", border:"none", cursor:"pointer", color:"var(--co-ink-30)", padding:4, transition:"color 0.3s" }}
            onMouseEnter={e=>e.currentTarget.style.color=T.brass} onMouseLeave={e=>e.currentTarget.style.color="var(--co-ink-30)"}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button type="button" onClick={e=>{e.stopPropagation();onDelete(task.id);}}
            style={{ background:"none", border:"none", cursor:"pointer", color:"var(--co-ink-30)", padding:4, transition:"color 0.3s" }}
            onMouseEnter={e=>e.currentTarget.style.color="var(--co-danger)"} onMouseLeave={e=>e.currentTarget.style.color="var(--co-ink-30)"}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
          <span style={{ color:"var(--co-ink-30)", fontSize:10, display:"inline-block", transform:isExpanded?"rotate(180deg)":"rotate(0deg)", transition:"transform 0.3s" }}>▼</span>
        </div>
      </div>
      {isExpanded && (
        <div className="co-slide" style={{ paddingLeft:36, paddingTop:14, display:"flex", flexDirection:"column", gap:14 }}>
          {task.description&&(
            <p style={{ fontFamily:T.serif, fontSize:13, fontStyle:"italic", color:"var(--co-ink-70)", borderLeft:"2px solid var(--co-brass-20)", paddingLeft:12, lineHeight:1.6 }}>"{task.description}"</p>
          )}
          {subs.length>0&&(
            <div>
              <div style={{ fontFamily:T.mono, fontSize:9, letterSpacing:"0.2em", textTransform:"uppercase", color:T.brass, marginBottom:8 }}>📎 {subsLabel}</div>
              {subs.map(sub=>(
                <div key={sub.id} onClick={()=>onToggleSubtask(task.id,sub.id)}
                  style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", marginBottom:6, fontSize:12, color:T.ink, transition:"color 0.2s" }}
                  onMouseEnter={e=>e.currentTarget.style.color=T.brass} onMouseLeave={e=>e.currentTarget.style.color=T.ink}>
                  <span style={{ color:sub.status==="completed"?T.brass:"var(--co-ink-40)" }}>{sub.status==="completed"?"☑":"☐"}</span>
                  <span style={{ fontFamily:T.serif, textDecoration:sub.status==="completed"?"line-through":"none", opacity:sub.status==="completed"?0.5:1 }}>{sub.title}</span>
                </div>
              ))}
            </div>
          )}
          <button onClick={e=>{e.stopPropagation();onToggleExpand();}}
            style={{ alignSelf:"flex-start", background:"none", border:"none", cursor:"pointer", fontFamily:T.mono, fontSize:8, textTransform:"uppercase", letterSpacing:"0.2em", color:"var(--co-ink-30)", padding:0 }}
            onMouseEnter={e=>e.currentTarget.style.color=T.brass} onMouseLeave={e=>e.currentTarget.style.color="var(--co-ink-30)"}>
            Close ↑
          </button>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// TaskGroup
// ─────────────────────────────────────────────
const TaskGroup = ({ title, tasks, isCurrent, isPast, onToggleComplete, onToggleSubtask, onDelete, onEdit, onFocus, expandedId, setExpandedId, editedSubtaskTasks }) => {
  if (!tasks?.length) return null;
  return (
    <div style={{ paddingTop:20, opacity:isPast?0.45:1, transition:"opacity 0.5s" }}
      onMouseEnter={e=>{if(isPast)e.currentTarget.style.opacity=1}} onMouseLeave={e=>{if(isPast)e.currentTarget.style.opacity=0.45}}>
      <div style={{ display:"flex", alignItems:"center", gap:8, paddingBottom:8 }}>
        <span style={{ fontFamily:T.mono, fontSize:9, letterSpacing:"0.2em", textTransform:"uppercase", fontWeight:500, color:isCurrent?T.brass:"var(--co-ink-60)" }}>{title}</span>
        {isCurrent&&<span style={{ width:6, height:6, borderRadius:"50%", background:T.brass, display:"inline-block", animation:"co-pulse 2s infinite" }}/>}
      </div>
      <div style={{ borderTop:"1px solid var(--co-ink-10)" }}>
        {tasks.map(t=>(
          <TaskCard key={t.id} task={t}
            isBlurred={expandedId!==null&&expandedId!==t.id}
            isExpanded={expandedId===t.id}
            onToggleExpand={()=>setExpandedId(id=>id===t.id?null:t.id)}
            onToggleComplete={onToggleComplete}
            onToggleSubtask={onToggleSubtask}
            onDelete={onDelete}
            onEdit={onEdit}
            onFocus={onFocus}
            subtasksEdited={editedSubtaskTasks?.has(t.id) || false}
          />
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Desk
// ─────────────────────────────────────────────
const Desk = ({ tasks, ctx, onToggleComplete, onToggleSubtask, onDelete, onClearAll, onClearFiled, onEditTask, onUpdateSchedule, viewDate, setViewDate, editedSubtaskTasks, onQuickAdd }) => {
  const [clearConfirm,        setClearConfirm]        = useState(false);
  const [clearFiledConfirm,   setClearFiledConfirm]   = useState(false);
  const [editingTask,         setEditingTask]         = useState(null);
  const [showWorkdayEdit,     setShowWorkdayEdit]     = useState(false);
  const [showCalendar,        setShowCalendar]        = useState(false);
  const [showQuickAdd,        setShowQuickAdd]        = useState(false);
  const [expandedId,          setExpandedId]          = useState(null);
  const [deferredOpen,        setDeferredOpen]        = useState(false);
  const [upcomingOpen,        setUpcomingOpen]        = useState(false);
  const [focusTask,           setFocusTask]           = useState(null);
  const [commitmentConflicts, setCommitmentConflicts] = useState([]);
  const [showCommitmentWarn,  setShowCommitmentWarn]  = useState(false);

  const tz            = ctx?.timezone || userTZ();
  const today         = getLocalDateISO(tz);
  const currentHour   = new Date(new Date().toLocaleString("en-US",{timeZone:tz})).getHours();
  const currentBlock  = currentHour >= 18 ? "Evening" : currentHour >= 12 ? "Afternoon" : "Morning";
  const effectiveDate = viewDate || today;
  const isToday       = effectiveDate === today;

  let active    = tasks.filter(t => t.status !== "completed");
  let completed = tasks.filter(t => t.status === "completed");
  let viewTasks   = active.filter(t => t.scheduled_date === effectiveDate);
  let futureTasks = active.filter(t => t.scheduled_date !== effectiveDate);

  // ── Focus Mode ──
  // FIX: deferred tasks are written back to Supabase via onEditTask
  // to persist the new scheduled_date rather than only applying at render time.
  if (isToday && ctx?.focusMode && viewTasks.length > 3) {
    const score = t => (t.urgency==="High"&&t.importance==="High")?3:(t.urgency==="High"||t.importance==="High")?2:1;
    const hard  = viewTasks.filter(t =>  t.has_hard_deadline);
    const flex  = viewTasks.filter(t => !t.has_hard_deadline);
    const tomorrow = getTomorrow(today);
    if (hard.length > 3) {
      viewTasks   = hard;
      const toPersist = flex;
      futureTasks = [...futureTasks, ...toPersist.map(t => ({...t, scheduled_date: tomorrow, _focusBumped:true}))];
      toPersist.forEach(t => {
        if (t.scheduled_date !== tomorrow) {
          onEditTask(t.id, { ...t, scheduled_date: tomorrow }, null);
        }
      });
    } else {
      const left   = 3 - hard.length;
      const sorted = [...flex].sort((a,b)=>score(b)-score(a));
      const kept   = sorted.slice(0, left);
      const deferred = sorted.slice(left);
      viewTasks   = [...hard, ...kept];
      futureTasks = [...futureTasks, ...deferred.map(t => ({...t, scheduled_date: tomorrow, _focusBumped:true}))];
      deferred.forEach(t => {
        if (t.scheduled_date !== tomorrow) {
          onEditTask(t.id, { ...t, scheduled_date: tomorrow }, null);
        }
      });
    }
  }

  const deferredTasks = futureTasks.filter(t => t._focusBumped || t.scheduled_date <= today);
  const upcomingTasks = futureTasks.filter(t => !t._focusBumped && t.scheduled_date > today);

  const morning   = viewTasks.filter(t => t.time_of_day==="Morning");
  const afternoon = viewTasks.filter(t => t.time_of_day==="Afternoon");
  const evening   = viewTasks.filter(t => t.time_of_day==="Evening");
  const unsorted  = viewTasks.filter(t => !["Morning","Afternoon","Evening"].includes(t.time_of_day));

  const groupProps = {
    onToggleComplete: (id)=>{setExpandedId(null);onToggleComplete(id);},
    onToggleSubtask,
    onDelete: (id)=>{setExpandedId(null);onDelete(id);},
    onEdit: setEditingTask,
    onFocus: setFocusTask,
    expandedId, setExpandedId,
    editedSubtaskTasks,
  };

  const handleWorkdaySave = async (prefs) => {
    await onUpdateSchedule(prefs);
    setShowWorkdayEdit(false);
    const newSlots = parseCommitmentSlots(prefs.commitments || "");
    if (newSlots.length > 0) {
      const conflicting = active
        .map(task => {
          const block = parseTimeBlock(task.suggested_time_block);
          if (!block) return null;
          const slot = newSlots.find(s => block.start < s.end && s.start < block.end);
          return slot ? { task, commitment: slot } : null;
        })
        .filter(Boolean);
      if (conflicting.length > 0) { setCommitmentConflicts(conflicting); setShowCommitmentWarn(true); }
    }
  };

  const navBtnStyle = { background:"none", border:"1px solid var(--co-ink-15)", cursor:"pointer", color:"var(--co-ink-60)", padding:"6px 12px", fontFamily:T.mono, fontSize:14, transition:"all 0.25s", lineHeight:1 };
  const pendingCount = viewTasks.length;
  const pendingText  = pendingCount > 0 ? `${pendingCount} pending item${pendingCount!==1?"s":""} on the desk ${isToday?"today":"this day"}` : isToday ? "No tasks scheduled for today." : "Nothing scheduled for this day.";

  const collapsibleSection = (label, count, isOpen, setOpen, taskList) =>
    taskList.length > 0 && (
      <div style={{ marginTop:8 }}>
        <button onClick={()=>setOpen(o=>!o)} style={{ display:"flex", alignItems:"center", gap:8, width:"100%", background:"none", border:"none", cursor:"pointer", padding:"12px 0", borderTop:"1px solid var(--co-ink-10)" }}>
          <span style={{ fontFamily:T.mono, fontSize:9, letterSpacing:"0.2em", textTransform:"uppercase", fontWeight:500, color:"var(--co-ink-50)" }}>{label}</span>
          <span style={{ fontFamily:T.mono, fontSize:9, color:T.brass }}>({count})</span>
          <span style={{ marginLeft:"auto", fontFamily:T.mono, fontSize:10, color:"var(--co-ink-40)", display:"inline-block", transform:isOpen?"rotate(180deg)":"rotate(0deg)", transition:"transform 0.3s" }}>▼</span>
        </button>
        {isOpen&&(
          <div className="co-slide">
            {taskList.map(t=>(
              <TaskCard key={t.id} task={t}
                isBlurred={expandedId!==null&&expandedId!==t.id}
                isExpanded={expandedId===t.id}
                onToggleExpand={()=>setExpandedId(id=>id===t.id?null:t.id)}
                onToggleComplete={(id)=>{setExpandedId(null);onToggleComplete(id);}}
                onToggleSubtask={onToggleSubtask}
                onDelete={(id)=>{setExpandedId(null);onDelete(id);}}
                onEdit={setEditingTask}
                onFocus={setFocusTask}
                subtasksEdited={editedSubtaskTasks?.has(t.id)||false}
              />
            ))}
          </div>
        )}
      </div>
    );

  return (
    <div className="co-fade" style={{ width:"100%" }}>
      {/* Header */}
      <div className="co-desk-top" style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", borderBottom:"1px solid var(--co-ink-10)", paddingBottom:24, marginBottom:24, gap:16 }}>
        <div>
          <div style={{ fontFamily:T.serif, fontSize:32, color:T.walnut }}>Your desk is ready.</div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:10 }}>
            <button style={navBtnStyle} onClick={()=>setViewDate(prev=>offsetDate(prev||today,-1))}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=T.brass;e.currentTarget.style.color=T.brass;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--co-ink-15)";e.currentTarget.style.color="var(--co-ink-60)";}}>‹</button>
            <div style={{ textAlign:"center", minWidth:180 }}>
              <p style={{ fontFamily:T.mono, fontSize:9, letterSpacing:"0.2em", textTransform:"uppercase", color:isToday?T.brass:"var(--co-ink-70)", marginBottom:2 }}>
                {isToday?`Today — ${formatDisplayDate(effectiveDate)}`:formatDisplayDate(effectiveDate)}
              </p>
              <p style={{ fontFamily:T.mono, fontSize:9, letterSpacing:"0.15em", color:"var(--co-ink-50)" }}>{pendingText}</p>
              {!isToday&&<button onClick={()=>setViewDate(today)} style={{ fontFamily:T.mono, fontSize:8, textTransform:"uppercase", letterSpacing:"0.15em", background:"none", border:"none", cursor:"pointer", color:T.brass, textDecoration:"underline", textUnderlineOffset:2, marginTop:2 }}>Back to today</button>}
            </div>
            <button style={navBtnStyle} onClick={()=>setViewDate(prev=>offsetDate(prev||today,1))}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=T.brass;e.currentTarget.style.color=T.brass;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--co-ink-15)";e.currentTarget.style.color="var(--co-ink-60)";}}>›</button>
          </div>
        </div>

        {/* Desk action buttons — Calendar, Quick Add, Workday Rules, Clear Day */}
        <div className="co-desk-actions" style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
          <button onClick={()=>setShowCalendar(true)} title="Desk Calendar"
            style={{ background:"none", border:"1px solid var(--co-ink-15)", cursor:"pointer", color:"var(--co-ink-60)", padding:"7px 9px", display:"flex", alignItems:"center", transition:"all 0.25s" }}
            onMouseEnter={e=>{e.currentTarget.style.color=T.brass;e.currentTarget.style.borderColor=T.brass;}}
            onMouseLeave={e=>{e.currentTarget.style.color="var(--co-ink-60)";e.currentTarget.style.borderColor="var(--co-ink-15)";}}>
            <CalendarIcon size={14}/>
          </button>

          <button onClick={()=>setShowQuickAdd(true)} title="Add a task directly to the desk"
            style={{ background:"none", border:"1px solid var(--co-ink-15)", cursor:"pointer", color:"var(--co-ink-60)", padding:"7px 9px", display:"flex", alignItems:"center", gap:5, transition:"all 0.25s", fontFamily:T.mono, fontSize:9, letterSpacing:"0.15em", textTransform:"uppercase" }}
            onMouseEnter={e=>{e.currentTarget.style.color=T.brass;e.currentTarget.style.borderColor=T.brass;}}
            onMouseLeave={e=>{e.currentTarget.style.color="var(--co-ink-60)";e.currentTarget.style.borderColor="var(--co-ink-15)";}}>
            <PlusIcon size={13}/>
            <span className="co-nav-sub">Quick Add</span>
          </button>

          <button onClick={()=>setShowWorkdayEdit(true)}
            style={{ fontFamily:T.mono, fontSize:9, textTransform:"uppercase", letterSpacing:"0.2em", border:"1px solid var(--co-ink-15)", background:"none", padding:"8px 12px", cursor:"pointer", color:T.ink, transition:"all 0.25s" }}
            onMouseEnter={e=>e.currentTarget.style.borderColor=T.brass} onMouseLeave={e=>e.currentTarget.style.borderColor="var(--co-ink-15)"}>
            ⚙ Workday Rules
          </button>
          <button
            onClick={()=>viewTasks.length>0 && setClearConfirm(true)}
            disabled={viewTasks.length===0}
            style={{
              fontFamily:T.mono, fontSize:9, textTransform:"uppercase", letterSpacing:"0.2em",
              background:"none", border:"1px solid transparent", cursor:viewTasks.length>0?"pointer":"default",
              padding:"8px 12px", alignSelf:"center",
              color: viewTasks.length>0 ? "var(--co-danger)" : "transparent",
              pointerEvents: viewTasks.length>0 ? "auto" : "none",
            }}>
            Clear Day
          </button>
        </div>
      </div>

      {/* Day's tasks */}
      {viewTasks.length===0 ? (
        <div style={{ textAlign:"center", padding:"48px 32px", background:"var(--co-ink-05)", border:"1px dashed var(--co-ink-10)", marginBottom:24 }}>
          <p style={{ fontFamily:T.serif, fontSize:18, color:"var(--co-ink-40)", fontStyle:"italic", marginBottom:8 }}>
            {isToday?'"A clear desk is a clear mind."':"Nothing on the books for this day."}
          </p>
          {isToday&&<p style={{ fontFamily:T.mono, fontSize:9, letterSpacing:"0.25em", textTransform:"uppercase", color:"var(--co-ink-30)" }}>Exactly where you want to be.</p>}
        </div>
      ) : (
        <div>
          <TaskGroup title="This Morning"   tasks={morning}   isCurrent={isToday&&currentBlock==="Morning"}   isPast={isToday&&currentHour>=12} {...groupProps}/>
          <TaskGroup title="This Afternoon" tasks={afternoon} isCurrent={isToday&&currentBlock==="Afternoon"} isPast={isToday&&currentHour>=18} {...groupProps}/>
          <TaskGroup title="Tonight"        tasks={evening}   isCurrent={isToday&&currentBlock==="Evening"}   isPast={false}                    {...groupProps}/>
          <TaskGroup title="Active Briefs"  tasks={unsorted}  isCurrent={false}                               isPast={false}                    {...groupProps}/>
        </div>
      )}

      {collapsibleSection("Deferred",  deferredTasks.length, deferredOpen,  setDeferredOpen,  deferredTasks)}
      {collapsibleSection("Upcoming",  upcomingTasks.length, upcomingOpen,  setUpcomingOpen,  upcomingTasks)}

      {/* Filed */}
      {completed.length>0&&(
        <div style={{ marginTop:24 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingBottom:4 }}>
            <span style={{ fontFamily:T.mono, fontSize:9, letterSpacing:"0.2em", textTransform:"uppercase", color:"var(--co-ink-50)", fontWeight:500 }}>Filed ({completed.length})</span>
            <button onClick={()=>setClearFiledConfirm(true)}
              style={{ fontFamily:T.mono, fontSize:8, textTransform:"uppercase", letterSpacing:"0.15em", background:"none", border:"none", color:"var(--co-ink-40)", cursor:"pointer", textDecoration:"underline", textUnderlineOffset:2, transition:"color 0.2s" }}
              onMouseEnter={e=>e.currentTarget.style.color="var(--co-danger)"} onMouseLeave={e=>e.currentTarget.style.color="var(--co-ink-40)"}>
              Clear filed
            </button>
          </div>
          <div style={{ borderTop:"1px solid var(--co-ink-10)" }}>
            {completed.map(t=>(
              <TaskCard key={t.id} task={t} isBlurred={false} isExpanded={false} onToggleExpand={()=>{}}
                onToggleComplete={onToggleComplete} onToggleSubtask={onToggleSubtask} onDelete={onDelete}
                onEdit={setEditingTask} onFocus={setFocusTask} subtasksEdited={editedSubtaskTasks?.has(t.id)||false}/>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {clearConfirm&&(
        <Modal onClose={()=>setClearConfirm(false)}>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontFamily:T.serif, fontSize:22, marginBottom:12, color:T.walnut }}>Clear this day?</div>
            <p style={{ fontFamily:T.serif, fontSize:13, color:"var(--co-ink-70)", lineHeight:1.6, marginBottom:24 }}>This will remove all tasks for <strong>{isToday?"today":formatDisplayDate(effectiveDate)}</strong>. Other days are untouched.</p>
            <Btn onClick={()=>{setClearConfirm(false);onClearAll(effectiveDate);}} style={{ width:"100%", justifyContent:"center", marginBottom:10, background:T.brass, borderColor:T.brass }}>Clear it.</Btn>
            <Btn variant="secondary" onClick={()=>setClearConfirm(false)} style={{ width:"100%", justifyContent:"center" }}>Keep the files.</Btn>
          </div>
        </Modal>
      )}

      {clearFiledConfirm&&(
        <Modal onClose={()=>setClearFiledConfirm(false)}>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontFamily:T.serif, fontSize:22, marginBottom:12, color:T.walnut }}>Clear all filed tasks?</div>
            <p style={{ fontFamily:T.serif, fontSize:13, color:"var(--co-ink-70)", lineHeight:1.6, marginBottom:24 }}>This will permanently remove all completed tasks.</p>
            <Btn onClick={()=>{setClearFiledConfirm(false);onClearFiled();}} style={{ width:"100%", justifyContent:"center", marginBottom:10, background:T.brass, borderColor:T.brass }}>Clear filed.</Btn>
            <Btn variant="secondary" onClick={()=>setClearFiledConfirm(false)} style={{ width:"100%", justifyContent:"center" }}>Keep them.</Btn>
          </div>
        </Modal>
      )}

      {editingTask&&(
        <TaskEditModal task={editingTask} allTasks={tasks} onClose={()=>setEditingTask(null)}
          onSave={async (updates, subtaskChanges) => { await onEditTask(editingTask.id, updates, subtaskChanges); setEditingTask(null); }}/>
      )}

      {showWorkdayEdit&&ctx&&(
        <WorkdayEditModal current={ctx} onClose={()=>setShowWorkdayEdit(false)} onSave={handleWorkdaySave}/>
      )}

      {showCalendar&&(
        <CalendarOverlay tasks={tasks} onClose={()=>setShowCalendar(false)} tz={ctx?.timezone} onSelectDate={(iso)=>{setViewDate(iso);setShowCalendar(false);}}/>
      )}

      {showQuickAdd&&(
        <QuickAddModal
          tasks={tasks}
          defaultDate={effectiveDate}
          onClose={()=>setShowQuickAdd(false)}
          onSave={onQuickAdd}
        />
      )}

      {focusTask&&(
        <TaskFocusModal
          task={focusTask}
          onClose={()=>setFocusTask(null)}
          onToggleSubtask={onToggleSubtask}
          subtasksEdited={editedSubtaskTasks?.has(focusTask.id)||false}
        />
      )}

      {showCommitmentWarn&&(
        <CommitmentConflictModal
          conflicts={commitmentConflicts}
          onClose={()=>setShowCommitmentWarn(false)}
          onEditTask={onEditTask}
        />
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// AI task parser
// ─────────────────────────────────────────────
async function parseDump(text, ctx) {
  const tz      = ctx?.timezone || userTZ();
  const today   = getLocalDateISO(tz);
  const todayF  = getFormattedDate(tz);
  const dayName = new Intl.DateTimeFormat("en-US", { weekday:"long", timeZone:tz }).format(new Date());

  const slots   = parseCommitmentSlots(ctx?.commitments || "");
  const blocked = slots.length > 0
    ? slots.map(s => `${formatTimeBlock(s.start, s.end)} (${s.label})`).join(", ")
    : "None";

  const system = `You are a calm, strategic Chief of Staff (C/O) for an executive.
Parse brain dumps into structured, actionable task lists.

TODAY: ${dayName}, ${todayF} (ISO: ${today}). Timezone: ${tz}.

SCHEDULING RULES:
- scheduled_date must be ${today} or later.
- RECURRING TASKS: Start from TODAY (${dayName}, ${today}). Do NOT start from Monday. Label each instance with its actual day name in the title.
- has_hard_deadline: true ONLY when user explicitly names a deadline.
- BLOCKED TIME SLOTS — HARD RESTRICTION — DO NOT SCHEDULE ANY TASK DURING THESE TIMES: ${blocked}. These are non-negotiable. Schedule every task completely outside these windows.

PREPARATION TASK GENERATION — REQUIRED FOR ALL DEADLINE AND COMPLEX TASKS:
For every task with has_hard_deadline: true, OR that involves a major deliverable (presentation, report, launch, review, deployment, meeting, proposal, interview, exam):
1. Generate 2-3 SEPARATE preparation task objects in the JSON array, scheduled on the DAYS BEFORE the deadline.
2. Preparation task titles must be SPECIFIC and reference the actual work — name the real actions needed:
   WRONG: "Prepare for board deck review"
   RIGHT: "Pull Q3 revenue data and variance analysis for board deck"
   RIGHT: "Draft executive summary and slide narrative for board presentation"
   RIGHT: "Final proofread and run-through of board deck slides"
3. Spread prep tasks: research/gathering 2+ days before, review/finalization the day before.
4. Schedule prep tasks in morning or peak focus hours.
5. Each prep task: urgency="High", importance="High", has_hard_deadline=false.
6. Each prep task gets 2-4 specific subtasks — concrete micro-actions that advance that prep work.
7. Day-before prep task title should always be a final review or checklist.

TIME BLOCK RULES:
- Morning slot: ${ctx?.dayStart||"08:00"} – 12:00. Assign sequential, non-overlapping blocks.
- Afternoon slot: 12:00 – 17:00. Sequential, non-overlapping.
- Evening slot: 17:00 – ${ctx?.dayEnd||"18:00"}. Sequential, non-overlapping.
- Duration estimate: simple = 30-45 min, moderate = 60-90 min, complex = 90-120 min.
- Stack blocks back-to-back — no gaps, no overlaps.
- Schedule highest urgency+importance tasks during peak hours ${ctx?.peakStart||"09:00"} – ${ctx?.peakEnd||"11:30"}.
- Format: "9:00 – 10:30 AM" (en-dash, always AM/PM).

Keep all text concise: descriptions ≤ 15 words, subtask titles ≤ 8 words.
OUTPUT: Valid JSON array only. No markdown, no preamble, no trailing text.`;

  const user = `Process this brain dump:
"${text}"

Each task object must include:
  title, description, urgency ("High"|"Medium"|"Low"),
  importance ("High"|"Medium"|"Low"), suggested_time_block,
  scheduled_date (YYYY-MM-DD), time_of_day ("Morning"|"Afternoon"|"Evening"),
  has_hard_deadline (boolean), subtasks (string[2-4])`;

  const res = await fetch("/api/parse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, user }),
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  const data = await res.json();
  return data.tasks;
}

// ─────────────────────────────────────────────
// Root App
// ─────────────────────────────────────────────
export default function App() {
  const { user, loading:authLoading, signIn, signUp, signOut } = useAuth();
  const { tasks, addTasks, addSingleTask, editTask, updateSubtasks, toggleComplete, toggleSubtask, deleteTask, clearAll } = useTasks(user?.id);
  const { schedule, loading:schedLoading, isFirstTime, saveSchedule, updateSchedule } = useSchedule(user?.id);
  const { theme, toggleTheme } = useTheme();

  const [view,               setView]               = useState("splash");
  const [prevInput,          setPrevInput]          = useState("");
  const [apiError,           setApiError]           = useState(null);
  const [toastMsg,           setToastMsg]           = useState(null);
  const [deskViewDate,       setDeskViewDate]       = useState(null);
  const [editedSubtaskTasks, setEditedSubtaskTasks] = useState(new Set());

  const [showConflictReview,       setShowConflictReview]       = useState(false);
  const [pendingConflicts,         setPendingConflicts]         = useState([]);
  const [pendingTasksNoConflict,   setPendingTasksNoConflict]   = useState([]);

  const toast = (msg) => { setToastMsg(msg); setTimeout(()=>setToastMsg(null), 3500); };

  // FIX: useEffect dependency array — include tasks.length so the routing
  // logic re-evaluates when the task list changes after initial load.
  useEffect(() => {
    if (authLoading) return;
    if (!user) { if (view!=="lobby"&&view!=="splash") setView("landing"); return; }
    if (schedLoading) return;
    if (isFirstTime) { setView("interview"); }
    else             { setView(tasks.length>0?"desk":"dump"); }
  }, [user, authLoading, schedLoading, isFirstTime, tasks.length]); // FIX: tasks.length added

  const handleClearDay = async (dateISO) => {
    const dayTasks = tasks.filter(t=>t.scheduled_date===dateISO&&t.status!=="completed");
    for (const t of dayTasks) await deleteTask(t.id);
    toast("Day cleared from the desk.");
  };

  const handleClearFiled = async () => {
    const filed = tasks.filter(t=>t.status==="completed");
    for (const t of filed) await deleteTask(t.id);
    toast("Filed tasks cleared.");
  };

  const handleSignOut = async () => {
    toast("The office is locked. See you tomorrow.");
    setTimeout(async()=>{ await signOut(); setView("landing"); }, 1500);
  };

  const handleDumpSubmit = async (text) => {
    setPrevInput(text);
    setApiError(null);
    setView("loading");
    try {
      let parsed = await parseDump(text, schedule);
      parsed = autoFixTimeBlocks(parsed);
      const commitmentSlots = parseCommitmentSlots(schedule?.commitments || "");
      const conflicts       = detectConflicts(parsed, tasks, commitmentSlots);

      if (conflicts.length > 0) {
        const conflictedSet = new Set(conflicts.map(c => c.parsedTask));
        const noConflict    = parsed.filter(t => !conflictedSet.has(t));
        setPendingConflicts(conflicts);
        setPendingTasksNoConflict(noConflict);
        setShowConflictReview(true);
        setView("desk");
      } else {
        await addTasks(parsed);
        setPrevInput("");
        setView("desk");
        toast("Your brief is ready.");
      }
    } catch {
      setApiError("Something interrupted the brief. Your notes are safe — try again.");
      setView("dump");
    }
  };

  // FIX: wrapped in useCallback so ConflictReviewModal's useEffect dep array is stable
  const handleConflictComplete = useCallback(async (accepted, rejected) => {
    setShowConflictReview(false);
    const toSave = [...pendingTasksNoConflict, ...accepted];
    if (toSave.length > 0) {
      await addTasks(toSave);
      const skipped = rejected.length;
      toast(skipped > 0 ? `Brief ready. ${skipped} task${skipped>1?"s":""} skipped.` : "Your brief is ready.");
    } else {
      toast("All tasks were skipped. The desk is clear.");
    }
    setPrevInput("");
    setPendingConflicts([]);
    setPendingTasksNoConflict([]);
  }, [pendingTasksNoConflict, addTasks]);

  const handleToggleComplete = async (taskId) => {
    const task = tasks.find(t=>t.id===taskId);
    if (task&&task.status!=="completed") toast("Noted. What's next?");
    await toggleComplete(taskId);
  };

  const handleToggleSubtask = async (taskId, subId) => {
    const task = tasks.find(t=>t.id===taskId);
    if (!task) return;
    const updatedSubs = task.subtasks.map(s=>s.id===subId?{...s,status:s.status==="completed"?"pending":"completed"}:s);
    if (updatedSubs.every(s=>s.status==="completed")) toast("That file is closed.");
    await toggleSubtask(taskId, subId);
  };

  const handleEditTask = async (taskId, updates, subtaskChanges) => {
    await editTask(taskId, updates);
    if (subtaskChanges) {
      const hasChanges = subtaskChanges.some(s => s._action !== "keep");
      if (hasChanges) {
        await updateSubtasks(taskId, subtaskChanges);
        setEditedSubtaskTasks(prev => new Set([...prev, taskId]));
      }
    }
    toast("Changes saved.");
  };

  const handleQuickAdd = async (task) => {
    await addSingleTask(task);
    toast("Added to the desk.");
  };

  const handleDelete = async (id) => { await deleteTask(id); toast("Cleared from the desk."); };

  if (authLoading) return (
    <div style={{ minHeight:"100vh", background:T.paper, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <GlobalStyles/>
      <div style={{ width:24, height:24, border:"1.5px solid var(--co-brass-30)", borderTop:`1.5px solid ${T.brass}`, borderRadius:"50%", animation:"co-spin 1s linear infinite" }}/>
    </div>
  );

  const activeCount = tasks.filter(t=>t.status!=="completed").length;
  const barePageStyle = { minHeight:"100vh", background:T.paper, color:T.ink, fontFamily:T.mono, display:"flex", flexDirection:"column", alignItems:"center", padding:"32px 24px", backgroundImage:"radial-gradient(var(--co-dot) 1px, transparent 1px)", backgroundSize:"24px 24px" };

  if (view==="splash") return (<><GlobalStyles/><Splash onComplete={()=>setView("landing")}/></>);

  if (view==="landing") return (
    <div style={{ minHeight:"100vh", background:"#1a1410" }}>
      <GlobalStyles/><Landing onEnter={()=>setView("lobby")}/><Toast msg={toastMsg}/>
    </div>
  );

  if (view==="lobby") return (
    <div style={barePageStyle}>
      <GlobalStyles/>
      <div style={{ width:"100%", maxWidth:720, flex:1 }}><Lobby onSignIn={signIn} onSignUp={signUp}/></div>
      <footer style={{ width:"100%", maxWidth:720, textAlign:"center", marginTop:64, paddingTop:20, borderTop:"1px solid var(--co-ink-05)", fontSize:9, letterSpacing:"0.25em", textTransform:"uppercase", color:"var(--co-ink-30)", userSelect:"none" }}>
        The Corner Office · All Rights Reserved 2026
      </footer>
      <Toast msg={toastMsg}/>
    </div>
  );

  return (
    <Shell view={view} setView={setView} taskCount={activeCount} toastMsg={toastMsg}
      onSignOut={handleSignOut} tasks={tasks} schedule={schedule} onUpdateSchedule={updateSchedule}
      user={user} theme={theme} toggleTheme={toggleTheme}>

      {view==="interview" && (
        <Interview initial={schedule} onComplete={async(prefs)=>{ await saveSchedule(prefs); toast("Understood."); setTimeout(()=>setView("dump"),1200); }}/>
      )}
      {view==="dump"    && <Dump onSubmit={handleDumpSubmit} prevInput={prevInput} ctx={schedule} apiError={apiError} clearError={()=>setApiError(null)}/>}
      {view==="loading" && <Loading/>}
      {view==="desk"    && (
        <Desk tasks={tasks} ctx={schedule}
          onToggleComplete={handleToggleComplete}
          onToggleSubtask={handleToggleSubtask}
          onDelete={handleDelete}
          onClearAll={handleClearDay}
          onClearFiled={handleClearFiled}
          onEditTask={handleEditTask}
          onUpdateSchedule={updateSchedule}
          onQuickAdd={handleQuickAdd}
          viewDate={deskViewDate}
          setViewDate={setDeskViewDate}
          editedSubtaskTasks={editedSubtaskTasks}
        />
      )}

      {showConflictReview && (
        <ConflictReviewModal conflicts={pendingConflicts} onComplete={handleConflictComplete}/>
      )}
    </Shell>
  );
}
