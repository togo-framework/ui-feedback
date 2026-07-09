'use client'

import * as React from "react";
import { Plus, MessageSquarePlus } from "lucide-react";

import { cn } from "@togo-framework/ui-core";
import {
  type Language,
  statusLabel,
  typeLabel,
  STATUS_TONE,
  formatTimestamp,
} from "../issues/meta";
import type { Issue } from "../issues/types";
import { Button, Sheet, SheetContent, SheetHeader, SheetTitle, StatusBadge, EmptyState } from "@togo-framework/ui-core";

/**
 * FeedbackHub — the reporter's feedback slide-over: the list of issues they have
 * filed (optionally scoped to the current route) plus a "Report something new"
 * entry. This is the lightweight reporter surface (distinct from the full manager
 * IssueBoard): a reporter opens it from a FeedbackButton to see their open items
 * and file a new one.
 *
 * Pure + product-agnostic (Rule 25): `issues` + the current `route` arrive as
 * props; selecting an item or starting a new report just fires `onSelectIssue` /
 * `onNewIssue`. No fetch, no portal beyond the @prism/ui Sheet (which is
 * RTL-aware). Bilingual via `language` (Rule 8); token-clean (Rule 16).
 *
 * Props contract:
 *  - open / onOpenChange:  controlled visibility
 *  - issues:    Issue[] filed by this reporter (host-supplied)
 *  - language:  'en' | 'ar'
 *  - route:     optional current route — when set, shows a "this page" group first
 *  - loading:   host-driven loading flag → skeleton rows
 *  - onNewIssue():        start a new report
 *  - onSelectIssue(id):   open an existing issue's detail
 *  - title:     optional header override (default "Feedback")
 */
export type FeedbackHubProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  issues: Issue[];
  language?: Language;
  route?: string;
  loading?: boolean;
  onNewIssue?: () => void;
  onSelectIssue?: (id: string) => void;
  title?: string;
};

const FeedbackHub = ({
  open,
  onOpenChange,
  issues,
  language = "en",
  route,
  loading = false,
  onNewIssue,
  onSelectIssue,
  title,
}: FeedbackHubProps) => {
  const ar = language === "ar";
  const heading = title ?? (ar ? "ملاحظات" : "Feedback");

  // Split into "this page" vs "everything else" when a route is provided.
  const onThisPage = route ? issues.filter((i) => i.route === route) : [];
  const elsewhere = route ? issues.filter((i) => i.route !== route) : issues;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full max-w-md flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border/50 px-5 py-3 text-start">
          <SheetTitle className="text-sm font-semibold">{heading}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <Button size="sm" className="w-full" onClick={onNewIssue}>
            <Plus size={14} /> {ar ? "أبلغ عن شيء جديد" : "Report something new"}
          </Button>

          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((k) => (
                <div key={k} className="h-16 animate-pulse rounded-lg bg-secondary" />
              ))}
            </div>
          ) : issues.length === 0 ? (
            <EmptyState
              icon={<MessageSquarePlus />}
              title={ar ? "لا توجد ملاحظات بعد" : "No feedback yet"}
              description={
                ar
                  ? "لم تُبلِّغ عن أي شيء حتى الآن. ابدأ بالزر أعلاه."
                  : "You haven't reported anything yet. Start with the button above."
              }
            />
          ) : (
            <>
              {route && onThisPage.length > 0 ? (
                <FeedbackGroup
                  label={ar ? "في هذه الصفحة" : "On this page"}
                  items={onThisPage}
                  language={language}
                  onSelect={onSelectIssue}
                />
              ) : null}
              {elsewhere.length > 0 ? (
                <FeedbackGroup
                  label={route ? (ar ? "في أماكن أخرى" : "Elsewhere") : (ar ? "ملاحظاتك" : "Your reports")}
                  items={elsewhere}
                  language={language}
                  onSelect={onSelectIssue}
                />
              ) : null}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
FeedbackHub.displayName = "FeedbackHub";

const FeedbackGroup = ({
  label,
  items,
  language,
  onSelect,
}: {
  label: string;
  items: Issue[];
  language: Language;
  onSelect?: (id: string) => void;
}) => (
  <div>
    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
    <ul className="space-y-2">
      {items.map((issue) => (
        <li key={issue.id}>
          <button
            type="button"
            onClick={() => onSelect?.(issue.id)}
            className={cn(
              "block w-full rounded-lg border border-border/60 bg-card p-3 text-start transition",
              "hover:border-primary/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            <div className="mb-1 flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">#{issue.number}</span>
              <StatusBadge tone={STATUS_TONE[issue.status]} className="text-[10px]">
                {statusLabel(issue.status, language)}
              </StatusBadge>
              <span className="ms-auto text-[10px] uppercase tracking-wider text-muted-foreground">
                {typeLabel(issue.type, language)}
              </span>
            </div>
            <p className="line-clamp-2 text-sm font-medium text-foreground">{issue.title}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {formatTimestamp(issue.createdAt, language)}
            </p>
          </button>
        </li>
      ))}
    </ul>
  </div>
);
FeedbackGroup.displayName = "FeedbackHubGroup";

export { FeedbackHub };
