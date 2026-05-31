import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { useStore, type ToastKind } from "@/lib/store";
import { cn } from "@/lib/utils";

const ICONS: Record<ToastKind, typeof Info> = {
  info: Info,
  success: CheckCircle2,
  error: XCircle,
};

const STYLES: Record<ToastKind, string> = {
  info: "text-txt-muted",
  success: "text-accent-green",
  error: "text-accent-red",
};

export function Toaster() {
  const toasts = useStore((s) => s.toasts);
  const dismiss = useStore((s) => s.dismissToast);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2">
      {toasts.map((t) => {
        const Icon = ICONS[t.kind];
        return (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start gap-2.5 rounded-lg border border-panel-border bg-panel-alt p-3 shadow-card"
          >
            <Icon size={16} className={cn("mt-0.5 shrink-0", STYLES[t.kind])} />
            <p className="flex-1 text-[13px] leading-snug text-txt">{t.message}</p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="icon-btn h-5 w-5 shrink-0"
              aria-label="Dismiss"
            >
              <X size={13} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
