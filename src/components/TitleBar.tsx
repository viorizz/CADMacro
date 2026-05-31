import { getCurrentWindow } from "@tauri-apps/api/window";
import { Layers, List, Minus, Settings, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore, type View } from "@/lib/store";

const NAV: { view: View; label: string; icon: typeof Layers }[] = [
  { view: "macros", label: "Macros", icon: Layers },
  { view: "library", label: "Library", icon: List },
  { view: "settings", label: "Settings", icon: Settings },
];

export function TitleBar() {
  const view = useStore((s) => s.view);
  const setView = useStore((s) => s.setView);
  const armed = useStore((s) => s.armed);
  const appWindow = getCurrentWindow();

  return (
    <header className="flex h-11 shrink-0 items-center gap-2 border-b border-panel-border bg-bg-soft px-2 select-none">
      <div className="flex items-center gap-2 pl-1 pr-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-green/20 text-accent-green">
          <Layers size={15} />
        </div>
        <span className="text-[13px] font-semibold tracking-wide text-txt">CadMacro</span>
      </div>

      <nav className="flex items-center gap-1">
        {NAV.map(({ view: v, label, icon: Icon }) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            data-active={view === v}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-txt-muted transition-colors hover:text-txt hover:bg-panel-hover",
              "data-[active=true]:bg-panel data-[active=true]:text-txt",
            )}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </nav>

      {/* Draggable spacer */}
      <div className="h-full flex-1" data-tauri-drag-region />

      <div
        className={cn(
          "mr-1 flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-medium",
          armed ? "text-accent-green" : "text-txt-dim",
        )}
        title={armed ? "Triggers are active" : "Triggers are paused"}
      >
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            armed ? "bg-accent-green" : "bg-txt-dim",
          )}
        />
        {armed ? "Active" : "Paused"}
      </div>

      <div className="flex items-center">
        <button
          type="button"
          onClick={() => appWindow.minimize()}
          className="icon-btn h-8 w-10"
          aria-label="Minimize"
        >
          <Minus size={16} />
        </button>
        <button
          type="button"
          onClick={() => appWindow.close()}
          className="icon-btn h-8 w-10 hover:bg-accent-red hover:text-white"
          aria-label="Close"
        >
          <X size={16} />
        </button>
      </div>
    </header>
  );
}
