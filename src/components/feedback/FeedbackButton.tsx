'use client'

import * as React from "react";
import { MessageSquarePlus } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@togo-framework/ui-core";
import type { Language } from "../issues/meta";

/**
 * FeedbackButton — the trigger that opens the feedback hub / new-issue flow.
 *
 * Pure + product-agnostic (Rule 25): it renders a button and calls `onOpen` (or
 * `onClick`) — it owns no modal, no portal, no fetch. The host decides what
 * opening means (mount a FeedbackHub, open a NewIssueModal, etc.). Two layouts:
 * `variant="floating"` (a fixed FAB pinned to the inline-end / bottom corner,
 * RTL-aware) and `variant="inline"` (a compact toolbar/nav button). Bilingual
 * via `language` (Rule 8); token-clean (Rule 16).
 *
 * Props contract:
 *  - onOpen() | onClick(): fired when pressed (onOpen preferred; onClick alias)
 *  - language: 'en' | 'ar' — picks the "Feedback" label
 *  - variant:  'floating' (default) | 'inline'
 *  - count:    optional unread/open badge count
 *  - label:    optional override of the default "Feedback" text
 */
const feedbackButtonVariants = cva(
  "inline-flex items-center gap-1.5 font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
  {
    variants: {
      variant: {
        floating:
          "fixed bottom-5 end-5 z-40 rounded-full bg-primary px-4 py-3 text-sm text-primary-foreground shadow-lg hover:bg-primary/90",
        inline:
          "rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
      },
    },
    defaultVariants: { variant: "floating" },
  },
);

export type FeedbackButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof feedbackButtonVariants> & {
    onOpen?: () => void;
    language?: Language;
    /** Optional open/unread count rendered as a small badge. */
    count?: number;
    /** Optional label override (default: "Feedback" / "ملاحظات"). */
    label?: string;
  };

const FeedbackButton = React.forwardRef<HTMLButtonElement, FeedbackButtonProps>(
  ({ variant, language = "en", count, label, onOpen, onClick, className, ...props }, ref) => {
    const ar = language === "ar";
    const text = label ?? (ar ? "ملاحظات" : "Feedback");
    const handleClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
      onClick?.(e);
      onOpen?.();
    };
    return (
      <button
        ref={ref}
        type="button"
        onClick={handleClick}
        aria-label={text}
        className={cn(feedbackButtonVariants({ variant }), "relative", className)}
        {...props}
      >
        <MessageSquarePlus size={variant === "inline" ? 15 : 18} />
        <span className={cn(variant === "inline" && "hidden sm:inline")}>{text}</span>
        {count && count > 0 ? (
          <span className="ms-1 inline-flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
            {count > 99 ? "99+" : count}
          </span>
        ) : null}
      </button>
    );
  },
);
FeedbackButton.displayName = "FeedbackButton";

export { FeedbackButton, feedbackButtonVariants };
