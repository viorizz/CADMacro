import { useEffect, useState } from "react";
import { Keyboard, Mouse, X } from "lucide-react";
import type { Trigger, TriggerKind } from "@/lib/types";
import { cn, prettyCombo } from "@/lib/utils";
import { Segmented } from "./ui";

const MODIFIER_CODES = ["ControlLeft", "ControlRight", "AltLeft", "AltRight", "ShiftLeft", "ShiftRight", "MetaLeft", "MetaRight"];

function comboFromEvent(e: KeyboardEvent): string | null {
  if (MODIFIER_CODES.includes(e.code)) return null; // wait for a real key
  const mods: string[] = [];
  if (e.ctrlKey) mods.push("Ctrl");
  if (e.altKey) mods.push("Alt");
  if (e.shiftKey) mods.push("Shift");
  if (e.metaKey) mods.push("Super");
  if (!e.code) return null;
  return [...mods, e.code].join("+");
}

export function TriggerCapture({
  trigger,
  onChange,
}: {
  trigger: Trigger;
  onChange: (t: Trigger) => void;
}) {
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    if (!recording) return;
    const onKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === "Escape") {
        setRecording(false);
        return;
      }
      const combo = comboFromEvent(e);
      if (combo) {
        onChange({ type: "keyboard", value: combo });
        setRecording(false);
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [recording, onChange]);

  const setKind = (kind: TriggerKind) => {
    if (kind === trigger.type) return;
    setRecording(false);
    onChange({ type: kind, value: kind === "mouse" ? "MouseX1" : "" });
  };

  return (
    <div className="space-y-2.5">
      <Segmented<TriggerKind>
        options={[
          { value: "keyboard", label: "Keyboard" },
          { value: "mouse", label: "Mouse" },
        ]}
        value={trigger.type}
        onChange={setKind}
      />

      {trigger.type === "keyboard" ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setRecording((r) => !r)}
            className={cn(
              "flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border text-sm font-medium transition-colors",
              recording
                ? "border-accent-green/60 bg-accent-green/10 text-accent-green animate-pulse"
                : "border-panel-border bg-panel-input text-txt hover:bg-panel-hover",
            )}
          >
            <Keyboard size={15} />
            {recording
              ? "Press a key combination..."
              : trigger.value
                ? prettyCombo(trigger.value)
                : "Click to record a hotkey"}
          </button>
          {trigger.value && !recording && (
            <button
              type="button"
              onClick={() => onChange({ type: "keyboard", value: "" })}
              className="icon-btn h-10 w-10 border border-panel-border"
              aria-label="Clear hotkey"
            >
              <X size={15} />
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <Segmented
            options={[
              { value: "MouseX1", label: "Side Button 4 (X1)" },
              { value: "MouseX2", label: "Side Button 5 (X2)" },
            ]}
            value={trigger.value === "MouseX2" ? "MouseX2" : "MouseX1"}
            onChange={(v) => onChange({ type: "mouse", value: v })}
            className="w-full [&>button]:flex-1"
          />
          <div
            onMouseDown={(e) => {
              if (e.button === 3) {
                e.preventDefault();
                onChange({ type: "mouse", value: "MouseX1" });
              } else if (e.button === 4) {
                e.preventDefault();
                onChange({ type: "mouse", value: "MouseX2" });
              }
            }}
            className="flex h-10 items-center justify-center gap-2 rounded-lg border border-dashed border-panel-border bg-panel-input/50 text-[13px] text-txt-dim"
          >
            <Mouse size={15} />
            Or click here with a side button to detect it
          </div>
        </div>
      )}
    </div>
  );
}
