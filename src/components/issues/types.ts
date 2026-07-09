// issues/types.ts — the shared feedback/issue data model for @prism/ui.
//
// This is a PLAIN type module (no "use client", no React) so it can be imported
// by both the components here and the Motor feedback SDK — they share ONE shape.
// It mirrors the os-agents issue SDK data model (lib/issues/context.ts +
// components/issues/meta.ts) so a host can pass `/api/issues/v1` rows straight
// into these components.
//
// Rule 25: pure + product-agnostic. No data fetching, no app context — these are
// just the prop shapes the host fills in.

/** Issue lifecycle status. Lowercase string values mirror the SDK / DB enum. */
export type IssueStatus =
  | "todo"
  | "in_progress"
  | "blocked"
  | "ready_for_review"
  | "done";

/** Issue kind. `change` doubles as a feature request (carries the upvotes). */
export type IssueType = "bug" | "change" | "question" | "discussion";

/** Issue priority. Color-coded AND text-labelled (a11y: never color-only). */
export type IssuePriority = "low" | "normal" | "high" | "critical";

/** Cross-issue relationship kind. */
export type IssueLinkType = "parent_of" | "blocks" | "duplicates" | "relates";

/** Who reported the issue — an authed hub user or an external/anonymous SDK reporter. */
export type IssueReporterKind = "user" | "external";

/** A person reference (reporter / assignee / comment author). */
export interface IssuePerson {
  id: string;
  /** Pre-resolved display name (the host chooses EN/AR before passing it). */
  name: string;
  avatarUrl?: string | null;
  kind?: IssueReporterKind;
  /** Only set for external reporters. */
  email?: string | null;
}

/** An option for the assignee <select> (id + pre-resolved name). */
export interface AssigneeOption {
  id: string;
  name: string;
}

/** A stored attachment on an issue (image / pdf). URL is host-provided. */
export interface IssueAttachment {
  /** Download URL (https) supplied by the host's upload endpoint. */
  url: string;
  /** Original file name. */
  name: string;
  /** MIME type. */
  contentType: string;
  /** Size in bytes. */
  size?: number;
  /** Pixel dimensions (images only). */
  width?: number;
  height?: number;
}

/** A comment on an issue. `body` is markdown/plain text (host decides rendering). */
export interface IssueComment {
  id: string;
  author: IssuePerson | null;
  /** Comment body (markdown). Components render it as plain text by default; a
   *  host may pass a `renderBody` prop to plug in its own markdown renderer. */
  body: string;
  createdAt: string;
}

/** Where on the page an issue was pinned by the reporter's element picker.
 *  Mirrors the SDK anchor shape exactly so Motor's SDK + these components agree. */
export interface IssueAnchor {
  /** CSS selector of the pinned element (primary anchor). */
  selector?: string;
  /** window scroll offset at pin time (fallback when the selector no longer matches). */
  scrollY: number;
  /** First ~80 chars of the pinned element's text, for human context. */
  hint?: string;
  /** Full URL at pin time (incl. query/hash) — restores tab/panel state. */
  href?: string;
}

/** Lightweight per-card aggregate counts (drives the card footer icons). */
export interface IssueCounts {
  comments?: number;
  attachments?: number;
  children?: number;
}

/** The full issue shape consumed by the board / card / drawer / detail view.
 *  A host maps its `/api/issues/v1` rows onto this; every field the components
 *  read is here, so there is no hidden data dependency. */
export interface Issue {
  id: string;
  /** Human-facing sequential number (#123). */
  number: number;
  title: string;
  description?: string | null;
  type: IssueType;
  status: IssueStatus;
  priority: IssuePriority;
  /** Optional area/component tag (e.g. "auth", "billing"). */
  area?: string | null;
  /** Route the issue was filed against (normalized pathname). */
  route?: string | null;
  /** Page-pin anchor (from the SDK element picker). */
  anchor?: IssueAnchor | null;
  reporter?: IssuePerson | null;
  assignee?: IssuePerson | null;
  /** Board ordering rank (lexicographic). Used to sort within a status column. */
  boardRank?: string;
  voteCount?: number;
  votedByMe?: boolean;
  counts?: IssueCounts;
  comments?: IssueComment[];
  attachments?: IssueAttachment[];
  createdAt: string;
  updatedAt?: string;
}

/** Payload emitted by NewIssueModal.onSubmit — the host turns it into a POST. */
export interface NewIssuePayload {
  title: string;
  description: string;
  type: IssueType;
  priority: IssuePriority;
  area?: string;
  assigneeId?: string;
  /** Files the user attached in the modal (raw File objects). */
  files: File[];
  /** Route + anchor context, when the host supplies them (SDK reporter). */
  route?: string;
  anchor?: IssueAnchor | null;
}

/** Patch emitted by the drawer / detail view when a manager edits an issue. */
export interface IssuePatch {
  title?: string;
  description?: string;
  status?: IssueStatus;
  priority?: IssuePriority;
  type?: IssueType;
  assigneeId?: string | null;
}
