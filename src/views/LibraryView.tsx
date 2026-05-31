import { useMemo, useState } from "react";
import { open, save } from "@tauri-apps/plugin-dialog";
import { Download, Pencil, Plus, Search, Trash2, Upload, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api";
import type { CadCommand, CommandSource } from "@/lib/types";
import { Button, Panel, Segmented, SourceBadge } from "@/components/ui";
import { cn } from "@/lib/utils";

type Draft = Pick<CadCommand, "id" | "name" | "source" | "description">;

const BLANK: Draft = { id: "", name: "", source: "custom", description: "" };

export function LibraryView() {
  const commands = useStore((s) => s.commands);
  const upsertCommand = useStore((s) => s.upsertCommand);
  const deleteCommand = useStore((s) => s.deleteCommand);
  const importCommands = useStore((s) => s.importCommands);
  const toast = useStore((s) => s.toast);

  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.source.includes(q),
    );
  }, [commands, query]);

  const saveDraft = async () => {
    if (!draft || !draft.name.trim()) return;
    await upsertCommand({
      id: draft.id,
      name: draft.name.trim(),
      source: draft.source,
      description: draft.description.trim(),
      aliases: [],
    });
    setDraft(null);
  };

  const doImport = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: "JSON", extensions: ["json"] }],
      });
      if (typeof selected !== "string") return;
      const items = await api.readCommandsFile(selected);
      await importCommands(items, false);
    } catch (e) {
      toast("error", `Import failed: ${String(e)}`);
    }
  };

  const doExport = async () => {
    try {
      const path = await save({
        defaultPath: "cadmacro-commands.json",
        filters: [{ name: "JSON", extensions: ["json"] }],
      });
      if (!path) return;
      await api.exportCommandsFile(path);
      toast("success", "Command library exported");
    } catch (e) {
      toast("error", `Export failed: ${String(e)}`);
    }
  };

  return (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-txt-dim"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands..."
            className="field w-full pl-9"
          />
        </div>
        <Button variant="default" onClick={doImport} title="Import from JSON">
          <Upload size={15} />
          Import
        </Button>
        <Button variant="default" onClick={doExport} title="Export to JSON">
          <Download size={15} />
          Export
        </Button>
        <Button variant="primary" onClick={() => setDraft({ ...BLANK })}>
          <Plus size={16} />
          Add
        </Button>
      </div>

      {draft && (
        <Panel className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-txt">
              {draft.id ? "Edit command" : "New command"}
            </h3>
            <button className="icon-btn h-6 w-6" onClick={() => setDraft(null)}>
              <X size={14} />
            </button>
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <input
              autoFocus
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="Command name (e.g. LINE)"
              className="field w-full uppercase placeholder:normal-case"
            />
            <Segmented<CommandSource>
              options={[
                { value: "autocad", label: "AutoCAD" },
                { value: "bacad", label: "BaCAD" },
                { value: "custom", label: "Custom" },
              ]}
              value={draft.source}
              onChange={(source) => setDraft({ ...draft, source })}
            />
          </div>
          <input
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            placeholder="Description (optional)"
            className="field w-full"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={saveDraft} disabled={!draft.name.trim()}>
              Save
            </Button>
          </div>
        </Panel>
      )}

      <Panel className="flex-1 overflow-hidden p-0">
        <div className="max-h-full overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-4 py-10 text-center text-[13px] text-txt-muted">
              No commands match "{query}".
            </p>
          ) : (
            filtered.map((c, i) => (
              <div
                key={c.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5",
                  i !== 0 && "border-t border-panel-border/60",
                )}
              >
                <span className="w-36 shrink-0 truncate font-mono text-[13px] font-medium uppercase text-txt">
                  {c.name}
                </span>
                <span className="flex-1 truncate text-[13px] text-txt-muted">
                  {c.description}
                </span>
                <SourceBadge source={c.source} />
                <div className="flex items-center gap-1">
                  <button
                    className="icon-btn h-7 w-7"
                    title="Edit"
                    onClick={() =>
                      setDraft({
                        id: c.id,
                        name: c.name,
                        source: c.source,
                        description: c.description,
                      })
                    }
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    className="icon-btn h-7 w-7 hover:bg-accent-red/20 hover:text-accent-red"
                    title="Delete"
                    onClick={() => deleteCommand(c.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </Panel>
    </div>
  );
}
