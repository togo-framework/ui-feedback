'use client'

import * as React from "react";
import { MessageSquarePlus } from "lucide-react";

import { cn } from "@togo-framework/ui-core";
import type { Language } from "../issues/meta";

/**
 * MotorFeedbackLauncher — the ONE shared feedback launcher for every Sentra
 * product dashboard (Sentra hub, Scout, Cortex, Fort, Axon).
 *
 * It loads the shared Motor feedback SDK (@sentra/motor-feedback, served as a
 * static bundle at `sdkSrc`, default /motor-feedback.js) and mounts its
 * FeedbackHub on this floating trigger. ALL feedback behaviour — the report
 * form, element anchor, client-side screenshot, attachments, and the POST to
 * Motor's /api/issues/v1 surface — lives in the Motor SDK. No product
 * reimplements the feedback form or transport (operator decision 2026-06-14:
 * "feedback must extend the Motor SDK, not be custom per product").
 *
 * The FAB is DRAGGABLE: press-and-drag moves it anywhere on screen and the
 * position is cached in localStorage (per project), so it survives reloads. A
 * drag is distinguished from a click by a small movement threshold — a real
 * click still opens the feedback panel; a drag does not.
 *
 * Why the SDK over a bespoke modal: the SDK renders its panel inside a Shadow
 * DOM mounted on <body>, so it sits on the top stacking layer — immune to the
 * host app's z-index / transformed ancestors (the old bespoke launcher rendered
 * *behind* the header). This trigger button also carries a very high z-index so
 * the FAB itself floats over all app UI.
 *
 * Product-agnostic (Rule 25): no app context, no fetch here — `project`,
 * `publishableKey` (Motor DSN public key), `apiBase`, and `language` all arrive
 * as props. Renders nothing when `project`/`publishableKey` are empty (Motor
 * optional → host stays standalone). Bilingual (Rule 8); token-clean (Rule 16).
 */

type SdkIssueType = "bug" | "change" | "question" | "discussion";
type FeedbackHubHandle = { open(): void; close(): void; refresh(): void; destroy(): void };
type MotorFeedbackSdk = {
  mountFeedbackHub(opts: {
    trigger: Element;
    project: string;
    publishableKey: string;
    apiBase: string;
    theme?: "light" | "dark" | "auto";
    defaultType?: SdkIssueType;
    title?: string;
    reporterEmail?: string;
    reporterName?: string;
  }): FeedbackHubHandle;
};

declare global {
  interface Window {
    MotorFeedback?: MotorFeedbackSdk;
  }
}

export type MotorFeedbackLauncherProps = {
  /** Motor project slug, e.g. "sentra" | "scout" | "cortex" | "fort" | "axon". */
  project: string;
  /** Motor DSN public key, e.g. "motor-sentra-dev-key" (NEXT_PUBLIC_MOTOR_DSN). */
  publishableKey: string;
  /** Motor issues API base, e.g. http://localhost:8215/api/issues/v1. */
  apiBase: string;
  language?: Language;
  /** Where the Motor SDK bundle is served. Default: /motor-feedback.js */
  sdkSrc?: string;
  theme?: "light" | "dark" | "auto";
  defaultType?: SdkIssueType;
  /** Pre-fill the reporter identity when the host knows the signed-in user. */
  reporterEmail?: string;
  reporterName?: string;
  /** Optional FAB label override (default: "Feedback" / "ملاحظات"). */
  label?: string;
};

type Pos = { left: number; top: number };

const FAB_W = 132; // approx FAB footprint for viewport clamping
const FAB_H = 48;
const DRAG_THRESHOLD = 5; // px of movement before a press counts as a drag

const clampToViewport = (left: number, top: number): Pos => {
  if (typeof window === "undefined") return { left, top };
  const maxLeft = Math.max(0, window.innerWidth - FAB_W);
  const maxTop = Math.max(0, window.innerHeight - FAB_H);
  return {
    left: Math.min(Math.max(0, left), maxLeft),
    top: Math.min(Math.max(0, top), maxTop),
  };
};

const MotorFeedbackLauncher: React.FC<MotorFeedbackLauncherProps> = ({
  project,
  publishableKey,
  apiBase,
  language = "en",
  sdkSrc = "/motor-feedback.js",
  theme = "auto",
  defaultType = "bug",
  reporterEmail,
  reporterName,
  label,
}) => {
  const ar = language === "ar";
  const text = label ?? (ar ? "ملاحظات" : "Feedback");
  const storageKey = `motor-feedback-fab:${project}`;

  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const handleRef = React.useRef<FeedbackHubHandle | null>(null);

  const [pos, setPos] = React.useState<Pos | null>(null);
  // Drag bookkeeping kept in a ref so handlers don't churn on every move.
  // startX/startY = press point (for the drag-vs-click threshold); dx/dy = grab
  // offset within the button.
  const drag = React.useRef<{ active: boolean; moved: boolean; startX: number; startY: number; dx: number; dy: number }>({
    active: false,
    moved: false,
    startX: 0,
    startY: 0,
    dx: 0,
    dy: 0,
  });

  const active = Boolean(project && publishableKey && apiBase);

  // Restore the cached position on mount (clamped to the current viewport).
  React.useEffect(() => {
    if (!active || typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Pos>;
        if (typeof parsed.left === "number" && typeof parsed.top === "number") {
          setPos(clampToViewport(parsed.left, parsed.top));
        }
      }
    } catch {
      /* ignore corrupt cache */
    }
  }, [active, storageKey]);

  // Mount the shared Motor SDK hub on this trigger once the bundle has loaded.
  React.useEffect(() => {
    if (!active) return;
    let cancelled = false;

    const mount = () => {
      if (cancelled || handleRef.current || !window.MotorFeedback || !triggerRef.current) return;
      handleRef.current = window.MotorFeedback.mountFeedbackHub({
        trigger: triggerRef.current,
        project,
        publishableKey,
        apiBase,
        theme,
        defaultType,
        title: text,
        reporterEmail,
        reporterName,
      });
    };

    if (window.MotorFeedback) {
      mount();
    } else {
      let script = document.querySelector<HTMLScriptElement>(`script[src="${sdkSrc}"]`);
      if (!script) {
        script = document.createElement("script");
        script.src = sdkSrc;
        script.async = true;
        document.body.appendChild(script);
      }
      script.addEventListener("load", mount);
    }

    return () => {
      cancelled = true;
      handleRef.current?.destroy();
      handleRef.current = null;
    };
  }, [active, project, publishableKey, apiBase, theme, defaultType, text, reporterEmail, reporterName, sdkSrc]);

  // ── Drag-to-move (pointer events: mouse + touch) ──────────────────────────
  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    drag.current = {
      active: true,
      moved: false,
      startX: e.clientX,
      startY: e.clientY,
      dx: e.clientX - rect.left,
      dy: e.clientY - rect.top,
    };
    try {
      triggerRef.current.setPointerCapture(e.pointerId);
    } catch {
      /* setPointerCapture may throw if the pointer is already released */
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d.active) return;
    // Only count as a drag once the pointer travels past the threshold from the
    // press point — a small jitter during a click stays a click.
    if (!d.moved) {
      if (Math.abs(e.clientX - d.startX) <= DRAG_THRESHOLD && Math.abs(e.clientY - d.startY) <= DRAG_THRESHOLD) {
        return;
      }
      d.moved = true;
    }
    setPos(clampToViewport(e.clientX - d.dx, e.clientY - d.dy));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;
    try {
      triggerRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    if (d.moved) {
      // Persist the new position so it survives reloads.
      setPos((cur) => {
        if (cur && typeof window !== "undefined") {
          try {
            window.localStorage.setItem(storageKey, JSON.stringify(cur));
          } catch {
            /* storage may be unavailable (private mode) */
          }
        }
        return cur;
      });
    }
  };

  // Swallow the click that follows a drag so the SDK's click→open doesn't fire.
  const handleClickCapture = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      // reset so the NEXT genuine click opens the panel
      drag.current.moved = false;
    }
  };

  if (!active) return null;

  // Default anchor (bottom-end) until the user drags; then switch to absolute
  // left/top from the cached/active position.
  const positioned = pos !== null;
  const style: React.CSSProperties = positioned
    ? { left: pos.left, top: pos.top, right: "auto", bottom: "auto", touchAction: "none" }
    : { touchAction: "none" };

  return (
    <button
      ref={triggerRef}
      type="button"
      aria-label={text}
      title={ar ? "اسحب لتحريك الزر" : "Drag to move"}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClickCapture={handleClickCapture}
      style={style}
      className={cn(
        "fixed z-[2147483000] inline-flex cursor-grab items-center gap-1.5 rounded-full",
        "bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-lg transition-colors duration-fast ease-standard",
        "hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "focus-visible:ring-offset-2 ring-offset-background active:cursor-grabbing select-none",
        !positioned && "bottom-5 end-5",
      )}
    >
      <MessageSquarePlus size={18} />
      <span>{text}</span>
    </button>
  );
};
MotorFeedbackLauncher.displayName = "MotorFeedbackLauncher";

export { MotorFeedbackLauncher };
