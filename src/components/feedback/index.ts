// feedback/ — the reporter-facing feedback surface for @prism/ui.
//
// FeedbackButton (the trigger) + FeedbackHub (the reporter's slide-over). Pure,
// bilingual, RTL-safe, token-clean (Rules 8/16/25). The issue data model + the
// manager-facing board/drawer/modal/detail live in ../issues. Consumed by Motor's
// dashboard and the Motor feedback SDK.

export { FeedbackButton, feedbackButtonVariants } from "./FeedbackButton";
export type { FeedbackButtonProps } from "./FeedbackButton";

export { FeedbackHub } from "./FeedbackHub";
export type { FeedbackHubProps } from "./FeedbackHub";

// MotorFeedbackLauncher — the ONE shared floating launcher that loads the Motor
// feedback SDK + mounts its hub. Every product dashboard uses this (passing its
// own project/DSN) instead of a bespoke per-product feedback launcher.
export { MotorFeedbackLauncher } from "./MotorFeedbackLauncher";
export type { MotorFeedbackLauncherProps } from "./MotorFeedbackLauncher";

// FeedbackWidget — self-contained, working widget: floating trigger → panel with an
// on-page element picker + comment form + list. No external SDK (unlike MotorFeedbackLauncher).
export { FeedbackWidget } from "./FeedbackWidget";
export type { FeedbackWidgetProps, FeedbackItem, FeedbackKind, NewFeedback, PickedLocation, FeedbackAttachment } from "./FeedbackWidget";
