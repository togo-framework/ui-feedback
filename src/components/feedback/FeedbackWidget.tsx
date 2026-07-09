"use client";

import * as React from "react";
import { MessageSquarePlus, X, MapPin, Paperclip, Camera, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@togo-framework/ui-core";
import { Button, Input, Textarea, Label } from "@togo-framework/ui-core";

export type FeedbackKind = "bug" | "feature" | "question" | "discussion";

export interface PickedLocation {
  selector: string;
  tag: string;
  label?: string;
}
export interface FeedbackAttachment {
  name: string;
  kind: "file" | "screenshot";
}
export interface FeedbackItem {
  id: string;
  kind: FeedbackKind;
  title: string;
  details?: string;
  pageUrl?: string;
  location?: PickedLocation;
  attachments?: FeedbackAttachment[];
  createdAt?: string;
}
export type NewFeedback = Omit<FeedbackItem, "id" | "createdAt">;

export interface FeedbackWidgetProps {
  /** Issues already reported on this page (rendered in the panel list). */
  items?: FeedbackItem[];
  /** Current page URL (defaults to window.location.href). */
  pageUrl?: string;
  onSubmit?: (issue: NewFeedback) => void;
  onSelectIssue?: (id: string) => void;
  /** Host-provided screenshot capture (the kit is presentational). Returns a name. */
  onScreenshot?: () => Promise<string | null> | string | null;
  language?: "en" | "ar";
  /** Control the panel externally (otherwise a floating button is shown). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  pageSize?: number;
  /** Text shown next to the icon on the floating button (a description/label). */
  fabLabel?: string;
  /** Let the user drag the floating button to reposition it (persisted). Default true. */
  fabDraggable?: boolean;
  /** localStorage key for the dragged position (scope per app/project). */
  fabStorageKey?: string;
}

const KINDS: { key: FeedbackKind; en: string; ar: string; cls: string; sel: string }[] = [
  { key: "bug",        en: "Bug",        ar: "خطأ",    cls: "text-red-500",    sel: "border-red-500 bg-red-500/10 text-red-500" },
  { key: "feature",    en: "Feature",    ar: "ميزة",   cls: "text-blue-500",   sel: "border-blue-500 bg-blue-500/10 text-blue-500" },
  { key: "question",   en: "Question",   ar: "سؤال",   cls: "text-amber-500",  sel: "border-amber-500 bg-amber-500/10 text-amber-500" },
  { key: "discussion", en: "Discussion", ar: "نقاش",   cls: "text-purple-500", sel: "border-purple-500 bg-purple-500/10 text-purple-500" },
];
const kindOf = (k: FeedbackKind) => KINDS.find((x) => x.key === k)!;

const T = {
  en: { title: "Feedback", intro: "Found a bug, have an idea, or want to ask something about this page? It's attached to the page you are on.",
    report: "Report an issue", onPage: "On this page", issues: (n: number) => `${n} issue${n === 1 ? "" : "s"} on this page`,
    type: "Type", titleL: "Title", brief: "Brief description", details: "Details", detailsPh: "Steps to reproduce, expected vs actual, etc.",
    url: "Page URL", location: "Location", pin: "Pin location", attach: "Attachments", addFile: "Add file", screenshot: "Screenshot", submit: "Submit",
    picking: "Click any element to pin it · Esc to cancel", empty: "No issues yet on this page.", repin: "Re-pin", clear: "Clear" },
  ar: { title: "الملاحظات", intro: "وجدت خطأ أو لديك فكرة أو سؤال حول هذه الصفحة؟ سيُرفق بالصفحة الحالية.",
    report: "أبلغ عن مشكلة", onPage: "على هذه الصفحة", issues: (n: number) => `${n} مشكلة على هذه الصفحة`,
    type: "النوع", titleL: "العنوان", brief: "وصف مختصر", details: "التفاصيل", detailsPh: "خطوات إعادة الإنتاج، المتوقع مقابل الفعلي…",
    url: "رابط الصفحة", location: "الموقع", pin: "تثبيت موقع", attach: "المرفقات", addFile: "إضافة ملف", screenshot: "لقطة شاشة", submit: "إرسال",
    picking: "انقر أي عنصر لتثبيته · Esc للإلغاء", empty: "لا مشكلات على هذه الصفحة بعد.", repin: "إعادة التثبيت", clear: "مسح" },
};

function cssPath(el: Element): string {
  const parts: string[] = [];
  let node: Element | null = el;
  while (node && node.nodeType === 1 && parts.length < 5 && node !== document.body) {
    let part = node.tagName.toLowerCase();
    if ((node as HTMLElement).id) { part += `#${(node as HTMLElement).id}`; parts.unshift(part); break; }
    const cls = (node.getAttribute("class") || "").trim().split(/\s+/).filter(Boolean).slice(0, 2);
    if (cls.length) part += "." + cls.join(".");
    parts.unshift(part);
    node = node.parentElement;
  }
  return parts.join(" > ");
}

export function FeedbackWidget({
  items = [], pageUrl, onSubmit, onSelectIssue, onScreenshot, language = "en",
  open: openProp, onOpenChange, className, pageSize = 5,
  fabLabel, fabDraggable = true, fabStorageKey = "feedback-widget",
}: FeedbackWidgetProps) {
  const t = T[language];
  const isRTL = language === "ar";
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = (v: boolean) => { setInternalOpen(v); onOpenChange?.(v); };

  const [reporting, setReporting] = React.useState(false);
  const [kind, setKind] = React.useState<FeedbackKind>("bug");
  const [title, setTitle] = React.useState("");
  const [details, setDetails] = React.useState("");
  const [location, setLocation] = React.useState<PickedLocation | null>(null);
  const [attachments, setAttachments] = React.useState<FeedbackAttachment[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(items[0]?.id ?? null);
  const [page, setPage] = React.useState(0);

  const [picking, setPicking] = React.useState(false);
  const [hl, setHl] = React.useState<DOMRect | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const url = pageUrl ?? (typeof window !== "undefined" ? window.location.href : "");

  React.useEffect(() => {
    if (!picking) return;
    const ignore = (el: Element | null) => !el || el.closest("[data-feedback-ui]");
    const move = (e: MouseEvent) => { const el = document.elementFromPoint(e.clientX, e.clientY); setHl(ignore(el) ? null : el!.getBoundingClientRect()); };
    const click = (e: MouseEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (ignore(el)) return;
      e.preventDefault(); e.stopPropagation();
      setLocation({ selector: cssPath(el!), tag: el!.tagName.toLowerCase(), label: (el!.textContent || "").trim().slice(0, 40) || undefined });
      setPicking(false); setHl(null); setReporting(true);
    };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") { setPicking(false); setHl(null); setReporting(true); } };
    document.addEventListener("mousemove", move, true);
    document.addEventListener("click", click, true);
    document.addEventListener("keydown", key, true);
    const prev = document.body.style.cursor; document.body.style.cursor = "crosshair";
    return () => {
      document.removeEventListener("mousemove", move, true);
      document.removeEventListener("click", click, true);
      document.removeEventListener("keydown", key, true);
      document.body.style.cursor = prev;
    };
  }, [picking]);

  function startPin() { setReporting(false); setPicking(true); }
  async function takeScreenshot() {
    const name = (await onScreenshot?.()) ?? "screenshot.png";
    if (name) setAttachments((a) => [...a, { name, kind: "screenshot" }]);
  }
  function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setAttachments((a) => [...a, ...files.map((f) => ({ name: f.name, kind: "file" as const }))]);
    e.target.value = "";
  }
  function submit() {
    if (!title.trim()) return;
    onSubmit?.({ kind, title: title.trim(), details: details.trim() || undefined, pageUrl: url, location: location ?? undefined, attachments });
    setTitle(""); setDetails(""); setLocation(null); setAttachments([]); setKind("bug"); setReporting(false);
  }

  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  const shown = items.slice(page * pageSize, page * pageSize + pageSize);

  return (
    <div data-feedback-ui dir={isRTL ? "rtl" : "ltr"} className={className}>
      {/* element-pin overlay */}
      {picking && (
        <>
          <div className="fixed inset-x-0 top-0 z-[10001] bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground">
            <MapPin className="me-2 inline h-4 w-4" />{t.picking}
          </div>
          {hl && <div className="pointer-events-none fixed z-[10000] rounded border-2 border-primary bg-primary/10" style={{ top: hl.top, left: hl.left, width: hl.width, height: hl.height }} />}
        </>
      )}

      {/* floating trigger — draggable + optionally labeled */}
      {openProp === undefined && !open && !picking && (
        <DraggableFab draggable={fabDraggable} storageKey={fabStorageKey} label={fabLabel}
          title={t.title} isRTL={isRTL} onOpen={() => setOpen(true)} />
      )}

      {/* ── Feedback side panel ── */}
      {open && !picking && (
        <>
          <div className="fixed inset-0 z-[9991] bg-black/40" onClick={() => setOpen(false)} />
          <aside className="fixed inset-y-0 end-0 z-[9992] flex w-[380px] max-w-[90vw] flex-col border-s border-border bg-card text-card-foreground shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
              <span className="text-lg font-semibold">{t.title}</span>
              <button onClick={() => setOpen(false)} className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <p className="mb-4 text-sm text-muted-foreground">{t.intro}</p>
              <Button className="w-full" onClick={() => setReporting(true)}>{t.report}</Button>

              <p className="mb-2 mt-6 text-xs font-medium uppercase tracking-wide text-muted-foreground">{t.onPage}</p>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t.issues(items.length)}</span>
                {pages > 1 && (
                  <span className="flex items-center gap-1">
                    <Button size="sm" variant="outline" className="h-6 w-6 p-0" disabled={page === 0} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="h-3.5 w-3.5 rtl:rotate-180" /></Button>
                    <span className="text-xs text-muted-foreground">{page + 1}/{pages}</span>
                    <Button size="sm" variant="outline" className="h-6 w-6 p-0" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}><ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" /></Button>
                  </span>
                )}
              </div>
              <div className="space-y-1.5">
                {shown.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">{t.empty}</p> : shown.map((it) => {
                  const k = kindOf(it.kind);
                  return (
                    <button key={it.id} onClick={() => { setSelectedId(it.id); onSelectIssue?.(it.id); }}
                      className={cn("flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-start transition hover:bg-accent",
                        selectedId === it.id ? "border-primary bg-primary/5" : "border-border")}>
                      <span className="font-mono text-[11px] text-muted-foreground">#{it.id}</span>
                      <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold", k.cls, "bg-current/10")} style={{ backgroundColor: "transparent" }}>
                        <span className={k.cls}>{isRTL ? k.ar : k.en}</span>
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm">{it.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>
        </>
      )}

      {/* ── Report an issue modal ── */}
      {reporting && !picking && (
        <div className="fixed inset-0 z-[9995] flex items-center justify-center p-4" onClick={() => setReporting(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
              <span className="text-lg font-semibold">{t.report}</span>
              <button onClick={() => setReporting(false)} className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4 overflow-y-auto px-5 py-4">
              <div>
                <Label className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">{t.type}</Label>
                <div className="flex flex-wrap gap-2">
                  {KINDS.map((k) => (
                    <button key={k.key} onClick={() => setKind(k.key)}
                      className={cn("rounded-full border px-3 py-1 text-sm font-medium transition", kind === k.key ? k.sel : cn("border-border", k.cls, "opacity-80 hover:opacity-100"))}>
                      {isRTL ? k.ar : k.en}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="fb-title" className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">{t.titleL} *</Label>
                <Input id="fb-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t.brief} />
              </div>
              <div>
                <Label htmlFor="fb-details" className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">{t.details}</Label>
                <Textarea id="fb-details" rows={4} value={details} onChange={(e) => setDetails(e.target.value)} placeholder={t.detailsPh} />
              </div>
              <div>
                <Label className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">{t.url}</Label>
                <Input value={url} readOnly className="font-mono text-xs text-muted-foreground" />
              </div>
              <div>
                <Label className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">{t.location}</Label>
                {location ? (
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <MapPin className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{location.label || `<${location.tag}>`}</span>
                      <span className="block truncate font-mono text-[10px] text-muted-foreground">{location.tag} · {location.selector}</span>
                    </span>
                    <Button variant="ghost" size="sm" className="h-7 shrink-0 px-2 text-xs" onClick={startPin}>{t.repin}</Button>
                    <button onClick={() => setLocation(null)} aria-label={t.clear}
                      className="shrink-0 rounded p-1 text-muted-foreground hover:bg-accent hover:text-destructive">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={startPin}>
                    <MapPin className="h-3.5 w-3.5" />{t.pin}
                  </Button>
                )}
              </div>
              <div>
                <Label className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">{t.attach}</Label>
                <div className="flex flex-wrap items-center gap-2">
                  <input ref={fileRef} type="file" multiple className="hidden" onChange={onFiles} />
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => fileRef.current?.click()}><Paperclip className="h-3.5 w-3.5" />{t.addFile}</Button>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={takeScreenshot}><Camera className="h-3.5 w-3.5" />{t.screenshot}</Button>
                  {attachments.map((a, i) => <span key={i} className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">{a.name}</span>)}
                </div>
              </div>
            </div>
            <div className="border-t border-border p-4">
              <Button className="w-full" disabled={!title.trim()} onClick={submit}>{t.submit}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** DraggableFab — the floating trigger: draggable (5px threshold, position persisted
 *  to localStorage, clamped to the viewport) and optionally labeled. A plain click
 *  (no drag) opens the panel. */
function DraggableFab({ draggable, storageKey, label, title, onOpen }: {
  draggable: boolean; storageKey: string; label?: string; title: string; isRTL: boolean; onOpen: () => void;
}) {
  const KEY = "feedback-fab:" + storageKey;
  const ref = React.useRef<HTMLButtonElement>(null);
  const [pos, setPos] = React.useState<{ left: number; top: number } | null>(null);
  // posRef mirrors pos synchronously so pointerup persists the latest value (React
  // state in the handler closure is stale during a same-tick drag).
  const posRef = React.useRef<{ left: number; top: number } | null>(null);
  React.useEffect(() => {
    if (!draggable) return;
    try { const p = JSON.parse(localStorage.getItem(KEY) || "null"); if (p) { posRef.current = p; setPos(p); } } catch { /* ignore */ }
  }, [KEY, draggable]);
  const down = React.useRef<{ x: number; y: number; l: number; t: number } | null>(null);
  const moved = React.useRef(false);
  const onPointerDown = (e: React.PointerEvent) => {
    if (!draggable) return;
    const r = ref.current!.getBoundingClientRect();
    down.current = { x: e.clientX, y: e.clientY, l: r.left, t: r.top }; moved.current = false;
    ref.current!.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!down.current) return;
    const dx = e.clientX - down.current.x, dy = e.clientY - down.current.y;
    if (Math.abs(dx) + Math.abs(dy) > 5) moved.current = true;
    if (moved.current) {
      const el = ref.current!;
      const left = Math.min(Math.max(4, down.current.l + dx), window.innerWidth - el.offsetWidth - 4);
      const top = Math.min(Math.max(4, down.current.t + dy), window.innerHeight - el.offsetHeight - 4);
      posRef.current = { left, top };
      setPos(posRef.current);
    }
  };
  const onPointerUp = () => {
    if (down.current && moved.current) { try { localStorage.setItem(KEY, JSON.stringify(posRef.current)); } catch { /* ignore */ } }
    else if (down.current && !moved.current) onOpen();
    down.current = null;
  };
  const style = pos ? ({ left: pos.left, top: pos.top, right: "auto", bottom: "auto" } as React.CSSProperties) : undefined;
  return (
    <button ref={ref} aria-label={title} title={title}
      onClick={() => { if (!draggable) onOpen(); }}
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
      style={style}
      className={"fixed bottom-5 end-5 z-[9990] flex touch-none select-none items-center gap-2 rounded-full bg-primary text-primary-foreground shadow-lg transition hover:opacity-90 " +
        (draggable ? "cursor-grab active:cursor-grabbing " : "cursor-pointer ") +
        (label ? "px-4 py-3" : "h-12 w-12 justify-center")}>
      <MessageSquarePlus className="h-5 w-5 shrink-0" />
      {label && <span className="whitespace-nowrap text-sm font-semibold">{label}</span>}
    </button>
  );
}
