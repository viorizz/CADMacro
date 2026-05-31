import { Plus, Zap } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button, Panel, Toggle } from "@/components/ui";
import { MacroCard } from "@/components/MacroCard";

export function MacrosView() {
  const macros = useStore((s) => s.macros);
  const armed = useStore((s) => s.armed);
  const setArmed = useStore((s) => s.setArmed);
  const openModal = useStore((s) => s.openModal);

  return (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col gap-4">
      <Panel className="flex items-center justify-between p-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-green/15 text-accent-green">
            <Zap size={16} />
          </div>
          <div>
            <p className="text-sm font-semibold text-txt">Triggers</p>
            <p className="text-[12px] text-txt-muted">
              {armed ? "Listening for hotkeys and mouse buttons" : "All triggers paused"}
            </p>
          </div>
        </div>
        <Toggle value={armed} onChange={setArmed} />
      </Panel>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-txt-muted">
          {macros.length} macro{macros.length === 1 ? "" : "s"}
        </h2>
        <Button variant="primary" onClick={() => openModal(null)}>
          <Plus size={16} />
          New Macro
        </Button>
      </div>

      {macros.length === 0 ? (
        <EmptyState onCreate={() => openModal(null)} />
      ) : (
        <div className="flex flex-col gap-2.5">
          {macros.map((m) => (
            <MacroCard key={m.id} macro={m} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <Panel className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-panel-input text-txt-dim">
        <Zap size={22} />
      </div>
      <div>
        <p className="text-sm font-semibold text-txt">No macros yet</p>
        <p className="mt-1 text-[13px] text-txt-muted">
          Create your first macro to fire an AutoCAD or BaCAD command with a hotkey.
        </p>
      </div>
      <Button variant="primary" onClick={onCreate}>
        <Plus size={16} />
        New Macro
      </Button>
    </Panel>
  );
}
