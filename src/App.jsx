import { useState, useEffect } from "react";
import { useAuth }     from "./hooks/useAuth";
import { useTasks }    from "./hooks/useTasks";
import { useSchedule } from "./hooks/useSchedule";

// ─────────────────────────────────────────────
// Design tokens
// ─────────────────────────────────────────────
const T = {
  paper:  "#F4F1EA",
  ink:    "#2D2824",
  brass:  "#8C7355",
  walnut: "#3E2723",
  serif:  "'EB Garamond', Georgia, serif",
  mono:   "'IBM Plex Mono', monospace",
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const getLocalDateISO = (tz) => {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
    }).format(new Date());
  } catch { return new Date().toISOString().split("T")[0]; }
};

const getFormattedDate = (tz) => {
  try {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: tz,
    }).format(new Date());
  } catch {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
  }
};

const getTomorrow = (iso) => {
  try {
    const d = new Date(iso + "T00:00:00");
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  } catch { return iso; }
};

const userTZ = () => Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Manila";

// ─────────────────────────────────────────────
// Primitives
// ─────────────────────────────────────────────
const Label = ({ children }) => (
  <span style={{
    fontFamily: T.mono, fontSize: 9, letterSpacing: "0.25em",
    textTransform: "uppercase", color: T.brass, display: "block", marginBottom: 6,
  }}>{children}</span>
);

const Btn = ({ children, onClick, variant = "primary", disabled = false, style: sx = {}, type = "button" }) => {
  const base = {
    fontFamily: T.mono, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase",
    padding: "10px 20px", cursor: disabled ? "not-allowed" : "pointer",
    border: "1px solid", display: "inline-flex", alignItems: "center",
    gap: 6, fontWeight: 500, transition: "all 0.35s", borderRadius: 0,
    opacity: disabled ? 0.35 : 1,
  };
  const variants = {
    primary:   { background: T.ink,         borderColor: T.ink,   color: T.paper },
    secondary: { background: "transparent", borderColor: T.brass, color: T.brass },
    ghost:     { background: "transparent", border: "none",       color: T.ink, opacity: 0.65 },
  };
  return (
    <button type={type} onClick={disabled ? undefined : onClick}
      style={{ ...base, ...variants[variant], ...sx }}>
      {children}
    </button>
  );
};

const Toggle = ({ on, onToggle }) => (
  <button onClick={onToggle} type="button" style={{
    width: 40, height: 20, borderRadius: 999, border: "none", cursor: "pointer",
    background: on ? T.brass : "rgba(45,40,36,0.2)",
    display: "flex", alignItems: "center", padding: 2,
    transition: "background 0.3s", flexShrink: 0,
  }}>
    <div style={{
      width: 14, height: 14, borderRadius: "50%", background: T.paper,
      transform: on ? "translateX(20px)" : "translateX(0)",
      transition: "transform 0.3s",
    }} />
  </button>
);

const Modal = ({ children, onClose }) => (
  <div onClick={e => e.target === e.currentTarget && onClose()} style={{
    position: "fixed", inset: 0, background: "rgba(45,40,36,0.45)",
    backdropFilter: "blur(12px)", display: "flex", alignItems: "center",
    justifyContent: "center", zIndex: 200, padding: 16,
  }}>
    <div style={{
      background: T.paper, border: `1px solid rgba(45,40,36,0.2)`,
      padding: 32, maxWidth: 480, width: "100%", position: "relative",
    }}>
      <button onClick={onClose} style={{
        position: "absolute", top: 12, right: 12, background: "none", border: "none",
        cursor: "pointer", color: "rgba(45,40,36,0.4)", fontSize: 20, lineHeight: 1,
      }}>×</button>
      {children}
    </div>
  </div>
);

const Toast = ({ msg }) => msg ? (
  <div style={{
    position: "fixed", bottom: 48, left: "50%", transform: "translateX(-50%)",
    background: T.ink, color: T.paper, padding: "12px 24px",
    fontFamily: T.mono, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase",
    border: `1px solid rgba(140,115,85,0.3)`, zIndex: 999, whiteSpace: "nowrap",
    pointerEvents: "none",
  }}>{msg}</div>
) : null;

// ─────────────────────────────────────────────
// Shell / Layout
// ─────────────────────────────────────────────
const Shell = ({ view, setView, taskCount, toastMsg, onSignOut, children }) => (
  <div style={{
    minHeight: "100vh", background: T.paper, color: T.ink, fontFamily: T.mono,
    display: "flex", flexDirection: "column", alignItems: "center",
    padding: "32px 24px",
    backgroundImage: "radial-gradient(rgba(45,40,36,0.055) 1px, transparent 1px)",
    backgroundSize: "24px 24px",
  }}>
    {(view === "dump" || view === "desk") && (
      <nav style={{
        width: "100%", maxWidth: 720,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        paddingBottom: 20, borderBottom: `1px solid rgba(45,40,36,0.1)`,
        marginBottom: 48,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            fontFamily: T.serif, fontSize: 17, fontWeight: 600, letterSpacing: "0.15em",
            border: `1px solid rgba(45,40,36,0.15)`, padding: "3px 8px", color: T.walnut,
          }}>C/O</span>
          <span style={{ fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase", color: T.brass }}>
            The Corner Office
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Btn variant="ghost" onClick={() => setView("dump")}
            style={{ color: view === "dump" ? T.brass : T.ink, opacity: view === "dump" ? 1 : 0.6 }}>
            Inbox
          </Btn>
          <Btn variant="ghost" onClick={() => setView("desk")}
            style={{ color: view === "desk" ? T.brass : T.ink, opacity: view === "desk" ? 1 : 0.6 }}>
            The Desk
            {taskCount > 0 && (
              <span style={{
                background: T.brass, color: T.paper, fontSize: 8,
                padding: "1px 5px", fontFamily: T.mono, marginLeft: 4,
              }}>{taskCount}</span>
            )}
          </Btn>
          <Btn variant="ghost" onClick={onSignOut} style={{
            color: T.brass, opacity: 1,
            borderLeft: `1px solid rgba(140,115,85,0.25)`,
            paddingLeft: 14, marginLeft: 4,
          }}>
            Lock
          </Btn>
        </div>
      </nav>
    )}

    <main style={{ width: "100%", maxWidth: 720, flex: 1 }}>
      {children}
    </main>

    <footer style={{
      width: "100%", maxWidth: 720, textAlign: "center", marginTop: 64,
      paddingTop: 20, borderTop: `1px solid rgba(45,40,36,0.05)`,
      fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase",
      color: "rgba(45,40,36,0.3)", userSelect: "none",
    }}>
      The Corner Office · Confidentially Guarded
    </footer>

    <Toast msg={toastMsg} />
  </div>
);

// ─────────────────────────────────────────────
// Lobby (real Supabase auth)
// ─────────────────────────────────────────────
const Lobby = ({ onSignIn, onSignUp }) => {
  const [isSignUp,  setIsSignUp]  = useState(false);
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [error,     setError]     = useState(null);
  const [working,   setWorking]   = useState(false);
  const [confirmed, setConfirmed] = useState(false); // email confirmation pending

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setWorking(true);
    try {
      if (isSignUp) {
        await onSignUp(email, password);
        setConfirmed(true); // Supabase sends a confirmation email by default
      } else {
        await onSignIn(email, password);
        // onSignIn success triggers useAuth listener → App re-renders automatically
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Try again.");
    } finally {
      setWorking(false);
    }
  };

  if (confirmed) {
    return (
      <div style={{ maxWidth: 400, margin: "auto", paddingTop: 48, textAlign: "center" }}>
        <div style={{ fontFamily: T.serif, fontSize: 88, fontWeight: 300, letterSpacing: "0.2em", color: T.walnut, lineHeight: 1 }}>C/O</div>
        <div style={{ marginTop: 40, padding: 32, border: `1px solid rgba(45,40,36,0.12)`, background: "rgba(255,255,255,0.12)" }}>
          <div style={{ fontFamily: T.serif, fontSize: 20, color: T.walnut, marginBottom: 12 }}>Check your inbox.</div>
          <p style={{ fontFamily: T.serif, fontSize: 13, color: "rgba(45,40,36,0.7)", lineHeight: 1.6, marginBottom: 20 }}>
            A confirmation link has been sent to <strong>{email}</strong>. Click it to activate your desk.
          </p>
          <button onClick={() => { setConfirmed(false); setIsSignUp(false); }}
            style={{ fontFamily: T.mono, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.2em", background: "none", border: "none", cursor: "pointer", color: T.brass, textDecoration: "underline" }}>
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 400, margin: "auto", paddingTop: 48, textAlign: "center" }}>
      <div style={{ fontFamily: T.serif, fontSize: 88, fontWeight: 300, letterSpacing: "0.2em", color: T.walnut, lineHeight: 1 }}>C/O</div>
      <p style={{ fontSize: 9, letterSpacing: "0.4em", textTransform: "uppercase", color: T.brass, marginTop: 8, marginBottom: 40, fontFamily: T.mono }}>
        A quiet place for your focus.
      </p>

      <form onSubmit={handleSubmit} style={{
        background: "rgba(255,255,255,0.12)", border: `1px solid rgba(45,40,36,0.12)`,
        padding: 32, textAlign: "left",
      }}>
        <div style={{ fontFamily: T.serif, fontSize: 18, textAlign: "center", marginBottom: 24, paddingBottom: 16, borderBottom: `1px solid rgba(45,40,36,0.07)` }}>
          {isSignUp ? "Let's set up your office." : "Credentials, please."}
        </div>

        {error && (
          <div style={{ background: "rgba(180,50,50,0.08)", border: `1px solid rgba(180,50,50,0.25)`, color: "#7a2020", padding: "10px 14px", fontFamily: T.mono, fontSize: 9, letterSpacing: "0.1em", marginBottom: 20 }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: 20 }}>
          <Label>Identity (Email)</Label>
          <input required type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder={isSignUp ? "executive@domain.co" : "executive@corneroffice.co"}
            style={{ width: "100%", background: "transparent", border: "none", borderBottom: `1px solid rgba(45,40,36,0.2)`, padding: "6px 0", fontFamily: T.serif, fontSize: 16, color: T.ink, outline: "none" }} />
        </div>

        <div style={{ marginBottom: 24 }}>
          <Label>Security Token</Label>
          <input required type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••" minLength={6}
            style={{ width: "100%", background: "transparent", border: "none", borderBottom: `1px solid rgba(45,40,36,0.2)`, padding: "6px 0", fontFamily: T.serif, fontSize: 16, color: T.ink, outline: "none" }} />
        </div>

        <Btn type="submit" disabled={working} style={{ width: "100%", justifyContent: "center" }}>
          {working ? "One moment..." : isSignUp ? "Register." : "Enter."}
        </Btn>

        <div style={{ textAlign: "center", marginTop: 20, paddingTop: 16, borderTop: `1px solid rgba(45,40,36,0.05)` }}>
          <button type="button" onClick={() => { setIsSignUp(!isSignUp); setError(null); setEmail(""); setPassword(""); }}
            style={{ background: "none", border: "none", cursor: "pointer", fontFamily: T.mono, fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: T.brass, textDecoration: "underline", textUnderlineOffset: 3 }}>
            {isSignUp ? "Already registered? Log in." : "First day here? Register a desk."}
          </button>
        </div>
      </form>
    </div>
  );
};

// ─────────────────────────────────────────────
// Interview (Onboarding)
// ─────────────────────────────────────────────
const TZ_LIST = [
  "America/New_York","America/Chicago","America/Denver","America/Los_Angeles",
  "Europe/London","Europe/Paris","Asia/Tokyo","Asia/Singapore",
  "Asia/Manila","Australia/Sydney","Pacific/Auckland",
];

const Interview = ({ onComplete, initial }) => {
  const [prefs, setPrefs] = useState(initial || {
    dayStart: "08:00", dayEnd: "18:00", peakStart: "09:00", peakEnd: "11:30",
    commitments: "Lunch from 12:00 to 1:00 PM. Board updates on Tuesdays.",
    timezone: userTZ(), focusMode: false,
  });
  const set = (k, v) => setPrefs(p => ({ ...p, [k]: v }));

  const timeInput = (label, key) => (
    <div>
      <Label>{label}</Label>
      <input type="time" value={prefs[key]} onChange={e => set(key, e.target.value)}
        style={{ background: "transparent", border: "none", borderBottom: `1px solid rgba(45,40,36,0.2)`, padding: "6px 0", fontFamily: T.mono, fontSize: 12, color: T.ink, outline: "none", width: "100%" }} />
    </div>
  );

  return (
    <div style={{ maxWidth: 560, margin: "auto", paddingBottom: 48 }}>
      <div style={{ borderBottom: `1px solid rgba(45,40,36,0.1)`, paddingBottom: 24, marginBottom: 32 }}>
        <div style={{ fontFamily: T.serif, fontSize: 28, color: T.walnut }}>
          Before we sort the desk, tell us how you work.
        </div>
        <p style={{ fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(45,40,36,0.5)", marginTop: 10, fontFamily: T.mono }}>
          Ground rules & preferences
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 28 }}>
        {timeInput("When do you arrive?", "dayStart")}
        {timeInput("When do you pack up?", "dayEnd")}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 28 }}>
        <div>
          <Label>Your quiet focus hours</Label>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {["peakStart","peakEnd"].map(k => (
              <input key={k} type="time" value={prefs[k]} onChange={e => set(k, e.target.value)}
                style={{ background: "transparent", border: "none", borderBottom: `1px solid rgba(45,40,36,0.2)`, padding: "4px 0", fontFamily: T.mono, fontSize: 11, color: T.ink, outline: "none", flex: 1 }} />
            ))}
          </div>
        </div>
        <div>
          <Label>Office Timezone</Label>
          <select value={prefs.timezone} onChange={e => set("timezone", e.target.value)}
            style={{ background: "transparent", border: "none", borderBottom: `1px solid rgba(45,40,36,0.2)`, padding: "6px 0", fontFamily: T.mono, fontSize: 10, color: T.ink, outline: "none", width: "100%", textTransform: "uppercase" }}>
            {!TZ_LIST.includes(prefs.timezone) && <option value={prefs.timezone}>{prefs.timezone}</option>}
            {TZ_LIST.map(tz => <option key={tz} value={tz}>{tz}</option>)}
          </select>
        </div>
      </div>

      <div style={{ borderTop: `1px solid rgba(45,40,36,0.1)`, paddingTop: 24, marginBottom: 28 }}>
        <div onClick={() => set("focusMode", !prefs.focusMode)}
          style={{ display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}>
          <Toggle on={prefs.focusMode} onToggle={() => set("focusMode", !prefs.focusMode)} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: T.walnut, marginBottom: 3 }}>Focus Mode</div>
            <p style={{ fontSize: 11, fontFamily: T.serif, color: "rgba(45,40,36,0.6)" }}>
              Strictly limit today's desk to 3 balanced priorities.
            </p>
          </div>
        </div>
      </div>

      <div style={{ borderTop: `1px solid rgba(45,40,36,0.1)`, paddingTop: 24, marginBottom: 32 }}>
        <Label>Exceptions & commitments</Label>
        <textarea value={prefs.commitments} onChange={e => set("commitments", e.target.value)}
          placeholder="Lunch with team at 12:00. Board syncs on Tuesday mornings."
          style={{ width: "100%", background: "transparent", border: `1px solid rgba(45,40,36,0.15)`, padding: 12, fontFamily: T.serif, fontSize: 13, height: 80, resize: "none", outline: "none", color: T.ink, lineHeight: 1.6 }} />
      </div>

      <Btn onClick={() => onComplete(prefs)} style={{ width: "100%", justifyContent: "center" }}>
        That'll do.
      </Btn>
    </div>
  );
};

// ─────────────────────────────────────────────
// Dump
// ─────────────────────────────────────────────
const EXAMPLE_DUMP =
  `Check draft for Wednesday board deck.\n` +
  `Sign off on junior hire contract before tonight.\n` +
  `Sort through Q3 balance sheet audit — lock into focus hours if possible.\n` +
  `Reserve table for Friday lunch client sync.`;

const Dump = ({ onSubmit, prevInput, ctx, apiError, clearError }) => {
  const [text, setText] = useState(prevInput || "");
  const tz = ctx?.timezone || userTZ();

  return (
    <div style={{ maxWidth: 680, margin: "auto", paddingBottom: 32 }}>
      {apiError && (
        <div style={{ border: `1px solid rgba(180,50,50,0.3)`, background: "rgba(45,40,36,0.04)", color: "#7a2020", padding: "12px 16px", fontFamily: T.mono, fontSize: 10, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, gap: 12 }}>
          <span>{apiError}</span>
          <button onClick={clearError} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: T.mono, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.15em", color: "#7a2020", textDecoration: "underline" }}>Dismiss</button>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: T.serif, fontSize: 36, color: T.walnut }}>What's on your mind?</div>
          <p style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: T.brass, marginTop: 6 }}>
            {getFormattedDate(tz)}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setText(EXAMPLE_DUMP)}
            style={{ fontFamily: T.mono, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.2em", border: `1px solid rgba(140,115,85,0.4)`, color: T.brass, background: "none", padding: "6px 12px", cursor: "pointer" }}>
            Example
          </button>
          {text.trim() && (
            <button onClick={() => setText("")}
              style={{ fontFamily: T.mono, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.2em", background: "none", border: "none", color: "rgba(45,40,36,0.5)", cursor: "pointer" }}>
              Clear
            </button>
          )}
        </div>
      </div>

      <div style={{ borderLeft: `2px solid rgba(140,115,85,0.35)`, background: "rgba(255,255,255,0.08)", marginBottom: 28 }}>
        <textarea autoFocus value={text} onChange={e => setText(e.target.value)}
          placeholder="Unload here. Chaotic lists, raw notes, meeting transcripts... I'll organize it."
          style={{ width: "100%", background: "transparent", border: "none", padding: "16px 20px", fontFamily: T.serif, fontSize: 18, resize: "none", height: "35vh", outline: "none", color: T.ink, lineHeight: 1.7 }} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: T.mono, fontSize: 9, color: "rgba(45,40,36,0.4)" }}>
          Strict sorting criteria will apply.{ctx?.focusMode ? " Focus Mode is active." : ""}
        </span>
        <Btn onClick={() => onSubmit(text)} disabled={!text.trim()}>Sort it.</Btn>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Loading
// ─────────────────────────────────────────────
const LOADING_STEPS = [
  "I'll take it from here.",
  "Look away from the screen.",
  "Have a glass of water.",
  "Take a breath.",
  "Laying out the desk...",
];

const Loading = () => {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep(p => Math.min(p + 1, LOADING_STEPS.length - 1)), 2500);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "50vh", gap: 28 }}>
      <style>{`@keyframes co-spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 28, height: 28, border: `1.5px solid rgba(140,115,85,0.3)`, borderTop: `1.5px solid ${T.brass}`, borderRadius: "50%", animation: "co-spin 1s linear infinite" }} />
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: T.serif, fontSize: 22, color: "rgba(45,40,36,0.8)", marginBottom: 10 }}>Sorting the brief...</div>
        <p style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: T.brass }}>{LOADING_STEPS[step]}</p>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// TaskCard
// ─────────────────────────────────────────────
const TaskCard = ({ task, onToggleComplete, onToggleSubtask, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const done     = task.status === "completed";
  const subs     = task.subtasks || [];
  const doneSubs = subs.filter(s => s.status === "completed").length;
  const crucial  = task.urgency === "High" && task.importance === "High";

  return (
    <div style={{ borderBottom: `1px solid rgba(45,40,36,0.1)`, padding: "20px 0", opacity: done ? 0.4 : 1, transition: "opacity 0.5s" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, cursor: "pointer" }}
        onClick={() => setExpanded(x => !x)}>

        <button type="button"
          onClick={e => { e.stopPropagation(); onToggleComplete(task.id); }}
          style={{ background: "none", border: done ? `1px solid rgba(50,120,50,0.4)` : "none", cursor: "pointer", color: done ? "#2a6c2a" : T.brass, marginTop: 2, flexShrink: 0, padding: done ? "2px 6px" : 0, fontFamily: T.mono, fontSize: 8, letterSpacing: "0.15em", textTransform: "uppercase", transition: "all 0.3s" }}>
          {done ? "Done" : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ display: "block", opacity: 0.6 }}>
              <rect x="3" y="3" width="18" height="18" rx="1" />
            </svg>
          )}
        </button>

        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: T.serif, fontSize: 17, color: done ? "rgba(45,40,36,0.6)" : T.walnut, textDecoration: done ? "line-through" : "none", marginBottom: 6 }}>
            {task.title}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 10px", fontFamily: T.mono, fontSize: 9, color: "rgba(45,40,36,0.5)", alignItems: "center" }}>
            <span>⏱ {task.suggested_time_block}</span>
            <span>·</span>
            <span style={{ textTransform: "uppercase", letterSpacing: "0.1em" }}>{crucial ? "Crucial" : "Normal"}</span>
            {task.has_hard_deadline && (<><span>·</span><span style={{ color: T.brass, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.15em" }}>Strict Deadline</span></>)}
            {subs.length > 0 && (<><span>·</span><span>{doneSubs}/{subs.length} checked</span></>)}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button type="button"
            onClick={e => { e.stopPropagation(); onDelete(task.id); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(45,40,36,0.3)", padding: 4, transition: "color 0.3s" }}
            onMouseEnter={e => e.currentTarget.style.color = "#7a2020"}
            onMouseLeave={e => e.currentTarget.style.color = "rgba(45,40,36,0.3)"}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
          <span style={{ color: "rgba(45,40,36,0.3)", fontSize: 10 }}>{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {expanded && (
        <div style={{ paddingLeft: 36, paddingTop: 14, display: "flex", flexDirection: "column", gap: 14 }}>
          {task.description && (
            <p style={{ fontFamily: T.serif, fontSize: 13, fontStyle: "italic", color: "rgba(45,40,36,0.75)", borderLeft: `2px solid rgba(140,115,85,0.2)`, paddingLeft: 12, lineHeight: 1.6 }}>
              "{task.description}"
            </p>
          )}
          {subs.length > 0 && (
            <div>
              <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: T.brass, marginBottom: 8 }}>
                📎 Suggested subtasks
              </div>
              {subs.map(sub => (
                <div key={sub.id}
                  onClick={() => onToggleSubtask(task.id, sub.id)}
                  style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 6, fontSize: 12, color: T.ink, transition: "color 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.color = T.brass}
                  onMouseLeave={e => e.currentTarget.style.color = T.ink}>
                  <span style={{ color: sub.status === "completed" ? T.brass : "rgba(45,40,36,0.4)" }}>
                    {sub.status === "completed" ? "☑" : "☐"}
                  </span>
                  <span style={{ fontFamily: T.serif, textDecoration: sub.status === "completed" ? "line-through" : "none", opacity: sub.status === "completed" ? 0.5 : 1 }}>
                    {sub.title}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// TaskGroup
// ─────────────────────────────────────────────
const TaskGroup = ({ title, tasks, isCurrent, isPast, onToggleComplete, onToggleSubtask, onDelete }) => {
  if (!tasks?.length) return null;
  return (
    <div style={{ paddingTop: 20, opacity: isPast ? 0.45 : 1, transition: "opacity 0.5s" }}
      onMouseEnter={e => { if (isPast) e.currentTarget.style.opacity = 1; }}
      onMouseLeave={e => { if (isPast) e.currentTarget.style.opacity = 0.45; }}>
      <style>{`@keyframes co-pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
      <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 8 }}>
        <span style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 500, color: isCurrent ? T.brass : "rgba(45,40,36,0.6)" }}>
          {title}
        </span>
        {isCurrent && <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.brass, display: "inline-block", animation: "co-pulse 2s infinite" }} />}
      </div>
      <div style={{ borderTop: `1px solid rgba(45,40,36,0.1)` }}>
        {tasks.map(t => (
          <TaskCard key={t.id} task={t} onToggleComplete={onToggleComplete} onToggleSubtask={onToggleSubtask} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Desk
// ─────────────────────────────────────────────
const Desk = ({ tasks, ctx, onToggleComplete, onToggleSubtask, onDelete, onClearAll, onUpdateCtx }) => {
  const [showConfig,   setShowConfig]   = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);

  const tz          = ctx?.timezone || userTZ();
  const today       = getLocalDateISO(tz);
  const currentHour = new Date(new Date().toLocaleString("en-US", { timeZone: tz })).getHours();
  const currentBlock = currentHour >= 18 ? "Evening" : currentHour >= 12 ? "Afternoon" : "Morning";

  let active    = tasks.filter(t => t.status !== "completed");
  let completed = tasks.filter(t => t.status === "completed");
  let todayT    = active.filter(t => t.scheduled_date === today);
  let futureT   = active.filter(t => t.scheduled_date !== today);
  let focusOverridden = false;

  if (ctx?.focusMode && todayT.length > 3) {
    const score = t => t.urgency === "High" && t.importance === "High" ? 3 : (t.urgency === "High" || t.importance === "High" ? 2 : 1);
    const hard = todayT.filter(t => t.has_hard_deadline);
    const flex = todayT.filter(t => !t.has_hard_deadline);
    if (hard.length > 3) {
      focusOverridden = true;
      todayT  = hard;
      futureT = [...futureT, ...flex.map(t => ({ ...t, scheduled_date: getTomorrow(today) }))];
    } else {
      const left   = 3 - hard.length;
      const sorted = [...flex].sort((a, b) => score(b) - score(a));
      todayT  = [...hard, ...sorted.slice(0, left)];
      futureT = [...futureT, ...sorted.slice(left).map(t => ({ ...t, scheduled_date: getTomorrow(today) }))];
    }
  }

  const morning   = todayT.filter(t => t.time_of_day === "Morning");
  const afternoon = todayT.filter(t => t.time_of_day === "Afternoon");
  const evening   = todayT.filter(t => t.time_of_day === "Evening");
  const unsorted  = todayT.filter(t => !["Morning","Afternoon","Evening"].includes(t.time_of_day));

  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: `1px solid rgba(45,40,36,0.1)`, paddingBottom: 24, marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontFamily: T.serif, fontSize: 32, color: T.walnut }}>Your brief is ready.</div>
          <p style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: T.brass, marginTop: 6 }}>
            {todayT.length > 0 ? `${todayT.length} pending item${todayT.length !== 1 ? "s" : ""} on the desk today` : "The desk is clear for today"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <button onClick={() => setShowConfig(x => !x)}
            style={{ fontFamily: T.mono, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.2em", border: `1px solid rgba(45,40,36,0.15)`, background: "none", padding: "8px 12px", cursor: "pointer", color: T.ink }}>
            ⚙ Workday Rules
          </button>
          {tasks.length > 0 && (
            <button onClick={() => setClearConfirm(true)}
              style={{ fontFamily: T.mono, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.2em", background: "none", border: "none", color: "#7a2020", cursor: "pointer", padding: "8px 12px" }}>
              Clear Desk
            </button>
          )}
        </div>
      </div>

      {showConfig && ctx && (
        <div style={{ padding: 16, background: "rgba(45,40,36,0.04)", border: `1px solid rgba(45,40,36,0.1)`, fontFamily: T.mono, fontSize: 10, marginBottom: 24 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 20, marginBottom: 12, color: "rgba(45,40,36,0.8)" }}>
            <span>Hours: {ctx.dayStart} – {ctx.dayEnd}</span>
            <span>Focus: {ctx.peakStart} – {ctx.peakEnd}</span>
            <span>Zone: {ctx.timezone}</span>
          </div>
          <div style={{ borderTop: `1px solid rgba(45,40,36,0.1)`, paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div>
              <div style={{ color: T.brass, fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 4 }}>
                The Executive Three {focusOverridden && "(overridden by deadlines)"}
              </div>
              <p style={{ fontSize: 9, color: "rgba(45,40,36,0.55)" }}>Limit today to 3 balanced priorities. Defers flexible items.</p>
            </div>
            <Toggle on={ctx.focusMode} onToggle={() => onUpdateCtx({ ...ctx, focusMode: !ctx.focusMode })} />
          </div>
          <p style={{ fontSize: 9, fontStyle: "italic", color: "rgba(45,40,36,0.5)", borderTop: `1px solid rgba(45,40,36,0.05)`, paddingTop: 8, marginTop: 10 }}>
            "{ctx.commitments}"
          </p>
        </div>
      )}

      {tasks.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 32px", background: "rgba(45,40,36,0.03)", border: `1px dashed rgba(45,40,36,0.1)` }}>
          <p style={{ fontFamily: T.serif, fontSize: 20, color: "rgba(45,40,36,0.5)", fontStyle: "italic", marginBottom: 10 }}>"The desk is clear."</p>
          <p style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(45,40,36,0.35)" }}>Enjoy it while it lasts.</p>
        </div>
      ) : (
        <div>
          <TaskGroup title="This Morning"        tasks={morning}   isCurrent={currentBlock === "Morning"}   isPast={currentHour >= 12} onToggleComplete={onToggleComplete} onToggleSubtask={onToggleSubtask} onDelete={onDelete} />
          <TaskGroup title="This Afternoon"      tasks={afternoon} isCurrent={currentBlock === "Afternoon"} isPast={currentHour >= 18} onToggleComplete={onToggleComplete} onToggleSubtask={onToggleSubtask} onDelete={onDelete} />
          <TaskGroup title="Tonight"             tasks={evening}   isCurrent={currentBlock === "Evening"}   isPast={false}             onToggleComplete={onToggleComplete} onToggleSubtask={onToggleSubtask} onDelete={onDelete} />
          <TaskGroup title="Active Briefs"       tasks={unsorted}  isCurrent={false}                        isPast={false}             onToggleComplete={onToggleComplete} onToggleSubtask={onToggleSubtask} onDelete={onDelete} />
          {futureT.length  > 0 && <TaskGroup title="Upcoming / Deferred" tasks={futureT}   isCurrent={false} isPast={false} onToggleComplete={onToggleComplete} onToggleSubtask={onToggleSubtask} onDelete={onDelete} />}
          {completed.length > 0 && <TaskGroup title="Filed"              tasks={completed} isCurrent={false} isPast={false} onToggleComplete={onToggleComplete} onToggleSubtask={onToggleSubtask} onDelete={onDelete} />}
        </div>
      )}

      {clearConfirm && (
        <Modal onClose={() => setClearConfirm(false)}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: T.serif, fontSize: 22, marginBottom: 12 }}>Are you certain?</div>
            <p style={{ fontFamily: T.serif, fontSize: 13, color: "rgba(45,40,36,0.7)", lineHeight: 1.6, marginBottom: 24 }}>
              This will sweep everything off the desk. Any parsed items will be cleared completely.
            </p>
            <Btn onClick={() => { setClearConfirm(false); onClearAll(); }}
              style={{ width: "100%", justifyContent: "center", marginBottom: 10, background: T.brass, borderColor: T.brass }}>
              Clear it.
            </Btn>
            <Btn variant="secondary" onClick={() => setClearConfirm(false)} style={{ width: "100%", justifyContent: "center" }}>
              Keep the files.
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// AI Parser — calls /api/parse (Gemini via proxy)
// ─────────────────────────────────────────────
async function parseDump(text, ctx) {
  const tz     = ctx?.timezone || userTZ();
  const today  = getLocalDateISO(tz);
  const todayF = getFormattedDate(tz);

  const system = `You are a calm, strategic, dry executive Chief of Staff (C/O).
Take chaotic brain-dumps and structure them into neat, strategic actions.
Current date in user timezone (${tz}): ${todayF} (${today}).
Assign each task a scheduled_date (YYYY-MM-DD) from today onwards.
Classify time_of_day as EXACTLY "Morning", "Afternoon", or "Evening".
has_hard_deadline: true ONLY if the user explicitly states a strict deadline.
Create 2-4 quiet, direct subtasks per task.
Output ONLY a valid JSON array. No markdown. No preamble. No trailing text.`;

  const user = `Process this task dump:
"${text}"

Constraints:
- Available hours: ${ctx?.dayStart || "08:00"} to ${ctx?.dayEnd || "18:00"}
- Avoid scheduling during: "${ctx?.commitments || "None"}"
- Peak focus hours: ${ctx?.peakStart || "09:00"} to ${ctx?.peakEnd || "11:30"}

Return a JSON array. Each object must have:
  title, description, urgency ("High"|"Medium"|"Low"),
  importance ("High"|"Medium"|"Low"), suggested_time_block,
  scheduled_date (YYYY-MM-DD), time_of_day ("Morning"|"Afternoon"|"Evening"),
  has_hard_deadline (boolean), subtasks (string[])`;

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
// Root App — wires auth + db + UI together
// ─────────────────────────────────────────────
export default function App() {
  const { user, loading: authLoading, signIn, signUp, signOut } = useAuth();
  const { tasks, addTasks, toggleComplete, toggleSubtask, deleteTask, clearAll } = useTasks(user?.id);
  const { schedule, loading: schedLoading, isFirstTime, saveSchedule, updateSchedule } = useSchedule(user?.id);

  const [view,      setView]      = useState("lobby");
  const [prevInput, setPrevInput] = useState("");
  const [apiError,  setApiError]  = useState(null);
  const [toastMsg,  setToastMsg]  = useState(null);

  const toast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Route user based on auth state
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setView("lobby");
      return;
    }
    // User is logged in — wait for schedule to load
    if (schedLoading) return;
    if (isFirstTime) {
      setView("interview");
    } else {
      // Returning user — go straight to desk if they have tasks, else dump
      setView(tasks.length > 0 ? "desk" : "dump");
    }
  }, [user, authLoading, schedLoading, isFirstTime]);

  const handleSignOut = async () => {
    toast("The office is locked. See you tomorrow.");
    setTimeout(async () => {
      await signOut();
      setView("lobby");
    }, 1500);
  };

  const handleDumpSubmit = async (text) => {
    setPrevInput(text);
    setApiError(null);
    setView("loading");
    try {
      const parsed = await parseDump(text, schedule);
      await addTasks(parsed);
      setPrevInput("");
      setView("desk");
      toast("Your brief is ready.");
    } catch {
      setApiError("Something interrupted the brief. Your notes are safe — try again.");
      setView("dump");
    }
  };

  const handleToggleComplete = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    if (task.status !== "completed") toast("Noted. What's next?");
    await toggleComplete(taskId);
  };

  const handleToggleSubtask = async (taskId, subId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const sub = task.subtasks.find(s => s.id === subId);
    if (!sub) return;
    const updatedSubs = task.subtasks.map(s => s.id === subId ? { ...s, status: s.status === "completed" ? "pending" : "completed" } : s);
    if (updatedSubs.every(s => s.status === "completed")) toast("That file is closed.");
    await toggleSubtask(taskId, subId);
  };

  const handleDelete = async (taskId) => {
    await deleteTask(taskId);
    toast("Cleared from the desk.");
  };

  const handleClearAll = async () => {
    await clearAll();
    toast("Cleared from the desk.");
  };

  const handleUpdateCtx = async (newCtx) => {
    await updateSchedule(newCtx);
  };

  // Full-screen loading while checking auth session
  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", background: T.paper, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{`@keyframes co-spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ width: 24, height: 24, border: `1.5px solid rgba(140,115,85,0.3)`, borderTop: `1.5px solid ${T.brass}`, borderRadius: "50%", animation: "co-spin 1s linear infinite" }} />
      </div>
    );
  }

  const activeCount = tasks.filter(t => t.status !== "completed").length;

  return (
    <Shell view={view} setView={setView} taskCount={activeCount} toastMsg={toastMsg} onSignOut={handleSignOut}>
      {view === "lobby" && (
        <Lobby onSignIn={signIn} onSignUp={signUp} />
      )}
      {view === "interview" && (
        <Interview
          initial={schedule}
          onComplete={async (prefs) => {
            await saveSchedule(prefs);
            toast("Understood.");
            setTimeout(() => setView("dump"), 1200);
          }}
        />
      )}
      {view === "dump" && (
        <Dump
          onSubmit={handleDumpSubmit}
          prevInput={prevInput}
          ctx={schedule}
          apiError={apiError}
          clearError={() => setApiError(null)}
        />
      )}
      {view === "loading" && <Loading />}
      {view === "desk" && (
        <Desk
          tasks={tasks}
          ctx={schedule}
          onToggleComplete={handleToggleComplete}
          onToggleSubtask={handleToggleSubtask}
          onDelete={handleDelete}
          onClearAll={handleClearAll}
          onUpdateCtx={handleUpdateCtx}
        />
      )}
    </Shell>
  );
}
