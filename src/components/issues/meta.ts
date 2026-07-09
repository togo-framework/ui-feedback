// issues/meta.ts — shared display metadata for the issue/feedback UI.
//
// Plain module (no "use client") so any component can import the label maps and
// tone helpers. Bilingual EN/AR + token-clean: the os-agents originals hardcoded
// `bg-amber-500/10`-style color literals; here every priority/status maps to a
// semantic StatusBadge tone (success/warning/danger/info/neutral) so colors stay
// centralised and theme-/RTL-safe (Rule 8, Rule 16).

import type { StatusBadgeTone } from "@togo-framework/ui-core";
import type {
  IssueStatus,
  IssueType,
  IssuePriority,
  IssueLinkType,
} from "./types";

export type Language = "en" | "ar";

/** Board columns, in order. Labels are bilingual. */
export const STATUS_COLUMNS: ReadonlyArray<{
  key: IssueStatus;
  en: string;
  ar: string;
}> = [
  { key: "todo", en: "To do", ar: "للتنفيذ" },
  { key: "in_progress", en: "In progress", ar: "قيد التنفيذ" },
  { key: "blocked", en: "Blocked", ar: "محظور" },
  { key: "ready_for_review", en: "Review", ar: "للمراجعة" },
  { key: "done", en: "Done", ar: "مكتمل" },
];

/** Pre-resolved status label for a given language. */
export const statusLabel = (s: IssueStatus, lang: Language): string => {
  const col = STATUS_COLUMNS.find((c) => c.key === s);
  if (!col) return s;
  return lang === "ar" ? col.ar : col.en;
};

/** Status → StatusBadge tone (token-driven; no hex literals). */
export const STATUS_TONE: Record<IssueStatus, StatusBadgeTone> = {
  todo: "neutral",
  in_progress: "info",
  blocked: "danger",
  ready_for_review: "warning",
  done: "success",
};

/** Issue-type labels (EN/AR). `change` is surfaced as "Feature". */
const TYPE_LABEL: Record<IssueType, { en: string; ar: string }> = {
  bug: { en: "Bug", ar: "خلل" },
  change: { en: "Feature", ar: "ميزة" },
  question: { en: "Question", ar: "سؤال" },
  discussion: { en: "Discussion", ar: "نقاش" },
};

export const typeLabel = (t: IssueType, lang: Language): string =>
  lang === "ar" ? TYPE_LABEL[t].ar : TYPE_LABEL[t].en;

/** Types offered in the hub create-flow. question/discussion are SDK-only. */
export const HUB_TYPES: IssueType[] = ["bug", "change"];

/** Priority labels (EN/AR) + a semantic tone (a11y: always text-labelled too). */
const PRIORITY_LABEL: Record<IssuePriority, { en: string; ar: string }> = {
  low: { en: "Low", ar: "منخفض" },
  normal: { en: "Normal", ar: "عادي" },
  high: { en: "High", ar: "مرتفع" },
  critical: { en: "Critical", ar: "حرج" },
};

export const priorityLabel = (p: IssuePriority, lang: Language): string =>
  lang === "ar" ? PRIORITY_LABEL[p].ar : PRIORITY_LABEL[p].en;

export const PRIORITY_TONE: Record<IssuePriority, StatusBadgeTone> = {
  low: "neutral",
  normal: "info",
  high: "warning",
  critical: "danger",
};

export const ALL_PRIORITIES: IssuePriority[] = ["low", "normal", "high", "critical"];

/** Cross-issue link labels (EN/AR). */
const LINK_LABEL: Record<IssueLinkType, { en: string; ar: string }> = {
  parent_of: { en: "Parent of", ar: "أصل لـ" },
  blocks: { en: "Blocks", ar: "يحظر" },
  duplicates: { en: "Duplicates", ar: "مكرر لـ" },
  relates: { en: "Relates to", ar: "مرتبط بـ" },
};

export const linkLabel = (l: IssueLinkType, lang: Language): string =>
  lang === "ar" ? LINK_LABEL[l].ar : LINK_LABEL[l].en;

/** Attachment UX constants (client mirror of the SDK's server-side caps). */
export const ATTACHMENT_ACCEPT =
  "image/png,image/jpeg,image/webp,image/gif,application/pdf";
export const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024; // 10 MB
export const ATTACHMENT_MAX_FILES = 5; // modal UX cap

/** Format a byte count for the attachment list. */
export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/** Format an ISO timestamp short + locale-aware (Arabic locale when lang=ar). */
export const formatTimestamp = (iso: string, lang: Language): string =>
  new Date(iso).toLocaleString(lang === "ar" ? "ar" : undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
