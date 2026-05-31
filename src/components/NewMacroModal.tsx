import { useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle, X } from "lucide-react";
import { useStore } from "@/lib/store";
import type { CadTarget, Trigger } from "@/lib/types";
import { triggerLabel } from "@/lib/utils";
import { Button, Segmented } from "./ui";
import { CommandPicker } from "./CommandPicker";
import { TriggerCapture } from "./TriggerCapture";

const EMPTY_TRIGGER: Trigger = { type: "keyboard", value: "" };

export function NewMacroModal() {
  const open = useStore((s) => s.modalOpen);
  const editing = useStore((s) => s.editing);
  const commands = useStore((s) => s.commands);
  const macros = useStore((s) => s.macros);
  const closeModal = useStore((s) => s.closeModal);
  const saveMacro = useStore((s) => s.saveMacro);
  const toast = useStore((s) => s.toast);

  const [name, setName] = useState("");
  const [command, setCommand] = useState("");
  const [args, setArgs] = useState("");
  const [target, setTarget] = useState<CadTarget>("any");
  const [delayMs, setDelayMs] = useState(0);
  const [trigger, setTrigger] = useState<Trigger>(EMPTY_TRIGGER);

  useEffect(() => {
    if (!open) return;
    const step = editing?.steps?.[0];
    setName(editing?.name ?? "");
    setCommand(step?.command ?? "");
    setArgs(step?.args ?? "");
    setTarget(editing?.target ?? "any");
    setDelayMs(step?.delayMs ?? 0);
    setTrigger(editing?.trigger ?? EMPTY_TRIGGER);
  }, [open, editing]);

  const conflict = useMemo(() => {
    if (!trigger.value) return null;
    return macros.find(
      (m) =>
        m.id !== editing?.id &&
        m.enabled &&
        m.trigger.type === trigger.type &&
        m.trigger.value === trigger.value,
    );
  }, [macros, trigger, editing]);

  const canSave = command.trim().length > 0 && trigger.value.trim().length > 0;

  const submit = async () => {
    if (!canSave) return;
    const cmd = command.trim();
    await saveMacro({
      id: editing?.id ?? "",
      name: name.trim() || cmd.toUpperCase(),
      enabled: editing?.enabled ?? true,
      trigger,
      target,
      steps: [{ type: "command", command: cmd, args: args.trim(), delayMs }],
      lastFired: editing?.lastFired ?? null,
    });
    toast("success", editing ? "Macro updated" : "Macro created");
    closeModal();
  };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && closeModal()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-card border border-panel-border bg-panel p-5 shadow-card focus:outline-none"
          aria-describedby={undefined}
        >
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-base font-semibold text-txt">
              {editing ? "Edit Macro" : "New Macro"}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="icon-btn h-7 w-7" aria-label="Close">
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>

          <div className="space-y-4">
            <Field label="Command">
              <CommandPicker value={command} onChange={setCommand} commands={commands} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Name (optional)">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={command.trim().toUpperCase() || "My macro"}
                  className="field w-full"
                />
              </Field>
              <Field label="Arguments (optional)">
                <input
                  value={args}
                  onChange={(e) => setArgs(e.target.value)}
                  placeholder="e.g. 0,0"
                  className="field w-full"
                />
              </Field>
            </div>

            <Field label="Target application">
              <Segmented<CadTarget>
                options={[
                  { value: "any", label: "Any" },
                  { value: "autocad", label: "AutoCAD" },
                  { value: "bacad", label: "BaCAD" },
                ]}
                value={target}
                onChange={setTarget}
                className="w-full [&>button]:flex-1"
              />
            </Field>

            <Field label="Trigger">
              <TriggerCapture trigger={trigger} onChange={setTrigger} />
            </Field>

            {conflict && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-400/10 px-3 py-2 text-[12px] text-amber-300">
                <AlertTriangle size={14} className="shrink-0" />
                <span>
                  {triggerLabel(trigger)} is already used by{" "}
                  <strong>{conflict.name}</strong>.
                </span>
              </div>
            )}
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={closeModal}>
              Cancel
            </Button>
            <Button variant="primary" onClick={submit} disabled={!canSave}>
              {editing ? "Save changes" : "Create macro"}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[12px] font-medium text-txt-muted">{label}</span>
      {children}
    </label>
  );
}
