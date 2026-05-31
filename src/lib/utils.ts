import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function uid(): string {
  return crypto.randomUUID();
}

export function relativeTime(ts?: number | null): string {
  if (!ts) return "never";
  const diff = Date.now() - ts;
  if (diff < 1500) return "just now";
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

const KEY_MAP: Record<string, string> = {
  Space: "Space",
  Enter: "Enter",
  Escape: "Esc",
  Tab: "Tab",
  Backspace: "Bksp",
  Delete: "Del",
  Minus: "-",
  Equal: "=",
  Comma: ",",
  Period: ".",
  Slash: "/",
  Backslash: "\\",
  Semicolon: ";",
  Quote: "'",
  BracketLeft: "[",
  BracketRight: "]",
  Backquote: "`",
};

/** Turn a w3c key code (KeyY, Digit1, ArrowUp, ...) into a readable label. */
export function prettyKey(code: string): string {
  if (code.startsWith("Key")) return code.slice(3);
  if (code.startsWith("Digit")) return code.slice(5);
  if (code.startsWith("Numpad")) return `Num${code.slice(6)}`;
  if (code.startsWith("Arrow")) return code.slice(5);
  return KEY_MAP[code] ?? code;
}

/** Turn a stored accelerator ("Ctrl+KeyY") into a readable label ("Ctrl + Y"). */
export function prettyCombo(value: string): string {
  if (!value) return "";
  const parts = value.split("+");
  const key = parts.pop() ?? "";
  return [...parts, prettyKey(key)].join(" + ");
}

/** Human-readable label for any trigger. */
export function triggerLabel(trigger: { type: string; value: string }): string {
  if (trigger.type === "mouse") {
    if (trigger.value === "MouseX1") return "Mouse 4 (X1)";
    if (trigger.value === "MouseX2") return "Mouse 5 (X2)";
    return trigger.value || "Unset";
  }
  return prettyCombo(trigger.value) || "Unset";
}
