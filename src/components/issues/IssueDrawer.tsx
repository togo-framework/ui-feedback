"use client";

// IssueDrawer — the manager's issue detail slide-over (opened from a board card).
// Editable Status/Priority/Type/Assignee, a "Human only" guard (agents skip it),
// description, comments thread with an author kind, and an add-comment box. Pure +
// product-agnostic: the issue + assignee options + all callbacks are host-supplied
// (Rule 25). Bilingual EN/AR (Rule 8); token-clean (Rule 16).

import * as React from "react";
import { ExternalLink, X } from "lucide-react";

import { cn } from "@togo-framework/ui-core";
import {
  STATUS_COLUMNS, statusLabel, typeLabel, priorityLabel, ALL_PRIORITIES,
  type Language,
} from "./meta";
import type { AssigneeOption, Issue, IssuePatch, IssueStatus, IssuePriority, IssueType } from "./types";
import { Sheet, SheetContent, Input, Textarea, Button, NativeSelect, StatusBadge } from "@togo-framework/ui-core";

const TYPES: IssueType[] = ["bug", "change", "question", "discussion"];

export interface IssueDrawerProps {
  issue: Issue | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language?: Language;
  assignees?: AssigneeOption[];
  /** Whether this issue is flagged human-only (agents skip it). */
  humanOnly?: boolean;
  onPatch?: (patch: IssuePatch) => void;
  onHumanOnlyChange?: (v: boolean) => void;
  onComment?: (body: string) => void;
  onOpenFull?: () => void;
}

const T = {
  en: { status: "Status", priority: "Priority", type: "Type", assignee: "Assignee", unassigned: "Unassigned",
    humanOnly: "Human only", humanOnlyHint: "Agents won't touch this issue.", reportedBy: "Reported by",
    description: "Description", comments: "Comments", noComments: "No comments yet.", addComment: "Add a comment…", comment: "Comment", agent: "agent", human: "human" },
  ar: { status: "الحالة", priority: "الأولوية", type: "النوع", assignee: "المكلّف", unassigned: "غير مُعيَّن",
    humanOnly: "بشري فقط", humanOnlyHint: "لن تلمس الوكلاء هذه المشكلة.", reportedBy: "أبلغ عنها",
    description: "الوصف", comments: "التعليقات", noComments: "لا تعليقات بعد.", addComment: "أضف تعليقًا…", comment: "تعليق", agent: "وكيل", human: "بشري" },
};

export function IssueDrawer({
  issue, open, onOpenChange, language = "en", assignees = [],
  humanOnly, onPatch, onHumanOnlyChange, onComment, onOpenFull,
}: IssueDrawerProps) {
  const t = T[language];
  const isRTL = language === "ar";
  const [draft, setDraft] = React.useState("");
  React.useEffect(() => { setDraft(""); }, [issue?.id]);
  if (!issue) return null;

  const field = "mt-1 block text-xs font-medium text-muted-foreground";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={isRTL ? "left" : "right"} className="w-full overflow-y-auto p-0 sm:max-w-[540px]" data-feedback-ui>
        <div dir={isRTL ? "rtl" : "ltr"} className="flex flex-col">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <span className="font-mono text-xs text-muted-foreground">#{issue.number}</span>
            <span className="flex-1" />
            {onOpenFull && <button onClick={onOpenFull} className="text-muted-foreground hover:text-foreground" title="Open full"><ExternalLink className="h-4 w-4" /></button>}
            <button onClick={() => onOpenChange(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
          </div>

          <div className="space-y-4 p-4">
            <Input value={issue.title} onChange={(e) => onPatch?.({ title: e.target.value })} className="text-base font-semibold" />

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className={field}>{t.status}</span>
                <NativeSelect value={issue.status} onChange={(e) => onPatch?.({ status: e.target.value as IssueStatus })}>
                  {STATUS_COLUMNS.map((s) => <option key={s.key} value={s.key}>{statusLabel(s.key, language)}</option>)}
                </NativeSelect>
              </label>
              <label className="block">
                <span className={field}>{t.priority}</span>
                <NativeSelect value={issue.priority} onChange={(e) => onPatch?.({ priority: e.target.value as IssuePriority })}>
                  {ALL_PRIORITIES.map((p) => <option key={p} value={p}>{priorityLabel(p, language)}</option>)}
                </NativeSelect>
              </label>
              <label className="block">
                <span className={field}>{t.type}</span>
                <NativeSelect value={issue.type} onChange={(e) => onPatch?.({ type: e.target.value as IssueType })}>
                  {TYPES.map((ty) => <option key={ty} value={ty}>{typeLabel(ty, language)}</option>)}
                </NativeSelect>
              </label>
              <label className="block">
                <span className={field}>{t.assignee}</span>
                <NativeSelect value={issue.assignee?.id || ""} onChange={(e) => onPatch?.({ assigneeId: e.target.value || null })}>
                  <option value="">{t.unassigned}</option>
                  {assignees.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </NativeSelect>
              </label>
            </div>

            <label className="flex items-start gap-2 rounded-lg border border-border p-2.5">
              <input type="checkbox" checked={!!humanOnly} onChange={(e) => onHumanOnlyChange?.(e.target.checked)} className="mt-0.5" />
              <span className="text-xs"><b>{t.humanOnly}</b> — <span className="text-muted-foreground">{t.humanOnlyHint}</span></span>
            </label>

            {issue.reporter && <p className="text-xs text-muted-foreground">{t.reportedBy} <b className="text-foreground">{issue.reporter.name}</b></p>}

            <div>
              <span className={field}>{t.description}</span>
              <Textarea rows={4} value={issue.description || ""} onChange={(e) => onPatch?.({ description: e.target.value })} />
            </div>

            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.comments}</div>
              <div className="space-y-2">
                {(issue.comments || []).length === 0
                  ? <p className="text-xs text-muted-foreground">{t.noComments}</p>
                  : (issue.comments || []).map((c) => (
                    <div key={c.id} className={cn("rounded-lg border p-2.5", c.author?.kind === "external" ? "border-border" : "border-primary/30")}>
                      <div className="mb-1 text-[11px] text-muted-foreground"><b className="text-foreground">{c.author?.name || t.human}</b> · {c.author?.kind === "user" ? t.human : t.agent}</div>
                      <div className="whitespace-pre-wrap text-sm">{c.body}</div>
                    </div>
                  ))}
              </div>
              <Textarea rows={2} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={t.addComment} className="mt-2" />
              <div className="mt-2 flex justify-end">
                <Button size="sm" disabled={!draft.trim()} onClick={() => { onComment?.(draft.trim()); setDraft(""); }}>{t.comment}</Button>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
