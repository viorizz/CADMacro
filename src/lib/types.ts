export type TriggerKind = "keyboard" | "mouse";

export interface Trigger {
  type: TriggerKind;
  /** "Ctrl+Y" for keyboard, "MouseX1" / "MouseX2" for mouse. */
  value: string;
}

export type CadTarget = "any" | "autocad" | "bacad";

export interface MacroStep {
  type: "command";
  command: string;
  args: string;
  delayMs: number;
}

export interface Macro {
  id: string;
  name: string;
  enabled: boolean;
  trigger: Trigger;
  target: CadTarget;
  steps: MacroStep[];
  lastFired?: number | null;
}

export type CommandSource = "autocad" | "bacad" | "custom";

export interface CadCommand {
  id: string;
  name: string;
  source: CommandSource;
  description: string;
  aliases: string[];
}

export const TARGET_LABELS: Record<CadTarget, string> = {
  any: "Any",
  autocad: "AutoCAD",
  bacad: "BaCAD",
};

export const SOURCE_LABELS: Record<CommandSource, string> = {
  autocad: "AutoCAD",
  bacad: "BaCAD",
  custom: "Custom",
};
