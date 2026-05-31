import { Copy, Pencil, Play, Trash2 } from "lucide-react";
import type { Macro } from "@/lib/types";
import { TARGET_LABELS } from "@/lib/types";
import { useStore } from "@/lib/store";
import { cn, relativeTime, triggerLabel } from "@/lib/utils";
import { Toggle } from "./ui";

export function MacroCard({ macro }: { macro: Macro }) {
  const toggleMacro = useStore((s) => s.toggleMacro);
  const runMacro = useStore((s) => s.runMacro);
  const deleteMacro = useStore((s) => s.deleteMacro);
  const openModal = useStore((s) => s.openModal);
  const firedMap = useStore((s) => s.fired);

  const step = macro.steps[0];
  const commandText = step
    ? `${step.command}${step.args ? " " + step.args : ""}`
    : "(no command)";
  const lastFired = firedMap[macro.id] ?? macro.lastFired ?? null;

  return (
    <div
      className={cn(
        "panel flex items-center gap-4 p-3.5 transition-opacity",
        !macro.enabled && "opacity-60",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-txt">{macro.name}</span>
          <span className="rounded-md bg-seg px-1.5 py-0.5 text-[11px] font-medium text-txt-muted">
            {TARGET_LABELS[macro.target]}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-2 text-[12px] text-txt-muted">
          <code className="rounded bg-bg-soft px-1.5 py-0.5 font-mono uppercase text-txt">
            {commandText}
          </code>
          <span className="text-txt-dim">·</span>
          <kbd className="rounded border border-panel-border bg-bg-soft px-1.5 py-0.5 font-mono text-[11px] text-txt">
            {triggerLabel(macro.trigger)}
          </kbd>
        </div>
      </div>

      <span className="hidden shrink-0 text-[11px] text-txt-dim sm:block">
        {lastFired ? `fired ${relativeTime(lastFired)}` : "never fired"}
      </span>

      <div className="flex shrink-0 items-center gap-1">
        <IconAction title="Test run" onClick={() => runMacro(macro.id)}>
          <Play size={15} />
        </IconAction>
        <IconAction title="Edit" onClick={() => openModal(macro)}>
          <Pencil size={15} />
        </IconAction>
        <IconAction
          title="Duplicate"
          onClick={() => openModal({ ...macro, id: "", name: `${macro.name} copy` })}
        >
          <Copy size={15} />
        </IconAction>
        <IconAction title="Delete" danger onClick={() => deleteMacro(macro.id)}>
          <Trash2 size={15} />
        </IconAction>
      </div>

      <Toggle value={macro.enabled} onChange={(v) => toggleMacro(macro.id, v)} />
    </div>
  );
}

function IconAction({
  title,
  danger,
  onClick,
  children,
}: {
  title: string;
  danger?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn("icon-btn h-8 w-8", danger && "hover:bg-accent-red/20 hover:text-accent-red")}
    >
      {children}
    </button>
  );
}
