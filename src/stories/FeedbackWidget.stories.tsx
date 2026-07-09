import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { FeedbackWidget, type FeedbackItem } from "../components/feedback";
import { Card, CardTitle } from "@togo-framework/ui-core";
import { Button } from "@togo-framework/ui-core";

const meta: Meta<typeof FeedbackWidget> = {
  title: "Components/Feedback Widget",
  component: FeedbackWidget,
  parameters: {
    layout: "fullscreen",
    fullBleed: true,
    docs: {
      story: { inline: false, height: "640px" },
      description: {
        component:
          "FeedbackWidget — the Motor-style feedback surface, self-contained (no external SDK). " +
          "A side panel lists issues on the page + a **Report an issue** modal (Type pills · Title · " +
          "Details · Page URL · **Pin location** to select any element on the current page · Attachments). " +
          "Bilingual EN/AR, token-themed.",
      },
    },
  },
};
export default meta;

const SEED: FeedbackItem[] = [
  { id: "106", kind: "bug", title: "Navigation Overload" },
  { id: "79", kind: "bug", title: "Github doc linking" },
  { id: "61", kind: "feature", title: "Opportunity Matcher" },
  { id: "48", kind: "feature", title: "online" },
  { id: "12", kind: "feature", title: "Portfolio" },
];

function Demo({ language }: { language: "en" | "ar" }) {
  const [items, setItems] = useState<FeedbackItem[]>(SEED);
  const ar = language === "ar";
  return (
    <div dir={ar ? "rtl" : "ltr"} className="min-h-screen bg-background p-8 text-foreground">
      <h1 className="mb-1 text-2xl font-semibold">{ar ? "صفحة تجريبية" : "Sample page"}</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {ar
          ? "افتح زر الملاحظات ← «أبلغ عن مشكلة» ← «تثبيت موقع» ← انقر أي عنصر في الصفحة لإرفاقه."
          : 'Open the feedback button → "Report an issue" → "Pin location" → click any element on this page to attach it.'}
      </p>
      <div className="grid max-w-3xl gap-4 sm:grid-cols-2">
        <Card padded><CardTitle>{ar ? "الإيرادات" : "Revenue"}</CardTitle><p className="mt-2 text-3xl font-bold">$24,500</p></Card>
        <Card padded><CardTitle>{ar ? "المستخدمون" : "Users"}</CardTitle><p className="mt-2 text-3xl font-bold">1,284</p></Card>
      </div>
      <div className="mt-4 flex gap-2">
        <Button>{ar ? "إجراء رئيسي" : "Primary action"}</Button>
        <Button variant="outline">{ar ? "ثانوي" : "Secondary"}</Button>
      </div>

      <FeedbackWidget
        language={language}
        items={items}
        pageUrl="https://myapp.example.com/dashboard"
        onSubmit={(i) => setItems((p) => [{ ...i, id: String(100 + p.length), createdAt: "now" }, ...p])}
        onScreenshot={() => "screenshot.png"}
      />
    </div>
  );
}

export const Default: StoryObj = { render: () => <Demo language="en" /> };
export const ArabicRTL: StoryObj = { name: "Arabic / RTL", render: () => <Demo language="ar" /> };
