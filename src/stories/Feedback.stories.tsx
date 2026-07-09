import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { FeedbackButton, FeedbackHub } from "../components/feedback";

const meta: Meta<typeof FeedbackButton> = {
  title: "Components/Feedback",
  component: FeedbackButton,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "The reporter-facing feedback surface (from Motor): `FeedbackButton` (floating FAB or " +
          "inline button) opens `FeedbackHub`, a slide-over of the reporter's items. Presentational " +
          "+ bilingual + RTL — the host supplies issues and callbacks (no SDK/fetch).",
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof FeedbackButton>;

export const Inline: Story = {
  args: { variant: "inline", language: "en", count: 3 },
};

export const Floating: Story = {
  args: { variant: "floating", language: "en" },
  parameters: { layout: "fullscreen", fullBleed: true },
};

export const WithHub: Story = {
  name: "Button → Hub (slide-over)",
  parameters: { layout: "fullscreen", fullBleed: true, docs: { story: { inline: false, height: "520px" } } },
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <div className="min-h-[480px] p-6">
        <FeedbackButton variant="inline" language="en" count={2} onOpen={() => setOpen(true)} />
        <FeedbackHub
          open={open}
          onOpenChange={setOpen}
          issues={[]}
          language="en"
          onNewIssue={() => console.log("new issue")}
          onSelectIssue={(id) => console.log("select", id)}
        />
      </div>
    );
  },
};

export const FloatingRTL: Story = {
  args: { variant: "floating", language: "ar" },
  parameters: { layout: "fullscreen", fullBleed: true },
  decorators: [(S) => <div dir="rtl"><S /></div>],
};
