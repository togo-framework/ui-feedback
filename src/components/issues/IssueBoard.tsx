"use client";

// IssueBoard — the manager-facing kanban board (To do · In progress · Blocked ·
// Review · Done). Cards show #number, priority + type, title, label, vote/comment/
// attachment counts, assignee, and a per-card status <select>. Header carries a
// search box, assignee/reporter filters, and "New issue". Pure + product-agnostic
// (Rule 25): every row + all callbacks are host-supplied; no fetch here. Bilingual
// EN/AR via `language` + the shared meta label maps (Rule 8); token-clean via
// StatusBadge tones (Rule 16).

import * as React from "react";
import { Search, MessageSquare, Paperclip, ChevronUp, Plus } from "lucide-react";

import { cn } from "@togo-framework/ui-core";
import {
  STATUS_COLUMNS,
  statusLabel,
  STATUS_TONE,
  typeLabel,
  priorityLabel,
  PRIORITY_TONE,
  type Language,
} from "./meta";
import type { AssigneeOption, Issue, IssueStatus } from "./types";
import { Input, Button, NativeSelect, StatusBadge } from "@togo-framework/ui-core";

export interface IssueBoardProps {
  issues: Issue[];
  language?: Language;
  assignees?: AssigneeOption[];
  reporters?: AssigneeOption[];
  loading?: boolean;
  onSelectIssue?: (id: string) => void;
  onNewIssue?: () => void;
  onStatusChange?: (id: string, status: IssueStatus) => void;
  onVote?: (id: string) => void;
  className?: string;
  /** Extra buttons rendered in the toolbar (e.g. Roadmap / Cut release). */
  toolbar?: React.ReactNode;
}

const T = {
  en: { search: "Search issues…", allAssignees: "All assignees", allReporters: "All reporters", newIssue: "New issue", empty: "Nothing here", none: "No issues yet.", unassigned: "Unassigned" },
  ar: { search: "ابحث في المشكلات…", allAssignees: "كل المكلّفين", allReporters: "كل المُبلِّغين", newIssue: "مشكلة جديدة", empty: "لا شيء هنا", none: "لا مشكلات بعد.", unassigned: "غير مُعيَّن" },
};

function initials(name?: string) {
  if (!name) return "?";
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

export function IssueBoard({
  issues, language = "en", assignees = [], reporters = [], loading,
  onSelectIssue, onNewIssue, onStatusChange, onVote, className, toolbar,
}: IssueBoardProps) {
  const t = T[language];
  const isRTL = language === "ar";
  const [q, setQ] = React.useState("");
  const [assignee, setAssignee] = React.useState("");
  const [reporter, setReporter] = React.useState("");
  // drag-and-drop: dragId is the issue being dragged; overCol highlights the drop target
  const [dragId, setDragId] = React.useState<string | null>(null);
  const [overCol, setOverCol] = React.useState<IssueStatus | null>(null);
  const drop = (col: IssueStatus) => {
    if (dragId) {
      const it = issues.find((i) => i.id === dragId);
      if (it && it.status !== col) onStatusChange?.(dragId, col);
    }
    setDragId(null);
    setOverCol(null);
  };

  const filtered = React.useMemo(() => {
    const ql = q.trim().toLowerCase();
    return issues.filter((i) => {
      if (ql && !(`#${i.number} ${i.title}`.toLowerCase().includes(ql))) return false;
      if (assignee && i.assignee?.id !== assignee) return false;
      if (reporter && i.reporter?.id !== reporter) return false;
      return true;
    });
  }, [issues, q, assignee, reporter]);

  const byStatus = (s: IssueStatus) =>
    filtered.filter((i) => i.status === s).sort((a, b) => (a.boardRank || "").localeCompare(b.boardRank || ""));

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className={cn("flex h-full flex-col", className)}>
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2 pb-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute inset-y-0 my-auto h-4 w-4 text-muted-foreground ltr:left-3 rtl:right-3" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.search} className="ltr:pl-9 rtl:pr-9" />
        </div>
        <NativeSelect value={assignee} onChange={(e) => setAssignee(e.target.value)} className="w-auto min-w-[150px]">
          <option value="">{t.allAssignees}</option>
          {assignees.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </NativeSelect>
        <NativeSelect value={reporter} onChange={(e) => setReporter(e.target.value)} className="w-auto min-w-[150px]">
          <option value="">{t.allReporters}</option>
          {reporters.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </NativeSelect>
        {toolbar}
        <Button onClick={onNewIssue} className="gap-1.5"><Plus className="h-4 w-4" />{t.newIssue}</Button>
      </div>

      {/* columns */}
      <div className="flex flex-1 gap-3 overflow-x-auto pb-2">
        {STATUS_COLUMNS.map((col) => {
          const items = byStatus(col.key);
          return (
            <div key={col.key}
              onDragOver={(e) => { e.preventDefault(); if (overCol !== col.key) setOverCol(col.key); }}
              onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverCol((c) => (c === col.key ? null : c)); }}
              onDrop={(e) => { e.preventDefault(); drop(col.key); }}
              className={cn(
                "flex w-[280px] shrink-0 flex-col rounded-xl border bg-muted/30 transition-colors",
                overCol === col.key ? "border-primary bg-primary/5" : "border-border",
              )}>
              <div className="flex items-center justify-between px-3 py-2.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{statusLabel(col.key, language)}</span>
                <span className="text-xs text-muted-foreground/60">{items.length}</span>
              </div>
              <div className="flex-1 space-y-2 px-2 pb-2">
                {items.length === 0 ? (
                  <p className="px-2 py-6 text-center text-xs text-muted-foreground/50">{overCol === col.key ? "" : t.empty}</p>
                ) : items.map((i) => (
                  <IssueCard key={i.id} issue={i} language={language} unassignedLabel={t.unassigned}
                    dragging={dragId === i.id}
                    onDragStart={() => setDragId(i.id)} onDragEnd={() => { setDragId(null); setOverCol(null); }}
                    onOpen={() => onSelectIssue?.(i.id)} onVote={() => onVote?.(i.id)}
                    onStatus={(s) => onStatusChange?.(i.id, s)} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function IssueCard({ issue, language, unassignedLabel, dragging, onDragStart, onDragEnd, onOpen, onVote, onStatus }: {
  issue: Issue; language: Language; unassignedLabel: string; dragging?: boolean;
  onDragStart: () => void; onDragEnd: () => void;
  onOpen: () => void; onVote: () => void; onStatus: (s: IssueStatus) => void;
}) {
  const c = issue.counts || {};
  return (
    <div onClick={onOpen}
      draggable
      onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", issue.id); onDragStart(); }}
      onDragEnd={onDragEnd}
      className={cn(
        "cursor-grab rounded-lg border border-border bg-background p-2.5 transition-colors hover:border-primary/60 active:cursor-grabbing",
        dragging && "opacity-40",
      )}>
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className="text-[11px] text-muted-foreground">#{issue.number}</span>
        <StatusBadge tone={PRIORITY_TONE[issue.priority]}>{priorityLabel(issue.priority, language)}</StatusBadge>
        <span className="ms-auto text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70">{typeLabel(issue.type, language)}</span>
      </div>
      <div className="text-sm font-semibold leading-snug text-foreground">{issue.title}</div>
      {issue.area && <div className="mt-1.5"><span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{issue.area}</span></div>}
      <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
        <button onClick={(e) => { e.stopPropagation(); onVote(); }} className={cn("flex items-center gap-1 hover:text-foreground", issue.votedByMe && "text-primary")}>
          <ChevronUp className="h-3.5 w-3.5" />{issue.voteCount || 0}
        </button>
        <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" />{c.comments || 0}</span>
        {!!c.attachments && <span className="flex items-center gap-1"><Paperclip className="h-3.5 w-3.5" />{c.attachments}</span>}
        <span className="ms-auto flex items-center gap-1.5">
          {issue.assignee ? (
            <span title={issue.assignee.name} className="grid h-5 w-5 place-items-center rounded-full bg-primary/20 text-[10px] font-semibold text-primary">{initials(issue.assignee.name)}</span>
          ) : <span className="italic text-muted-foreground/60">{unassignedLabel}</span>}
        </span>
      </div>
      <div className="mt-2" onClick={(e) => e.stopPropagation()}>
        <NativeSelect value={issue.status} onChange={(e) => onStatus(e.target.value as IssueStatus)} className="h-8 text-xs">
          {STATUS_COLUMNS.map((s) => <option key={s.key} value={s.key}>{statusLabel(s.key, language)}</option>)}
        </NativeSelect>
      </div>
    </div>
  );
}
