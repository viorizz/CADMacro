import { useState } from "react";
import { Command } from "cmdk";
import { Check, ChevronDown } from "lucide-react";
import type { CadCommand } from "@/lib/types";
import { SourceBadge } from "./ui";

export function CommandPicker({
  value,
  onChange,
  commands,
}: {
  value: string;
  onChange: (v: string) => void;
  commands: CadCommand[];
}) {
  const [open, setOpen] = useState(false);

  const select = (name: string) => {
    onChange(name);
    setOpen(false);
  };

  return (
    <Command
      label="Command"
      className="relative"
      filter={(itemValue, search) =>
        itemValue.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
      }
    >
      <div className="relative">
        <Command.Input
          value={value}
          onValueChange={(v) => {
            onChange(v);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search or type a command..."
          className="field w-full pr-9 uppercase placeholder:normal-case placeholder:text-txt-dim"
        />
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-txt-dim"
        />
      </div>

      {open && (
        <Command.List className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-panel-border bg-panel-alt p-1 shadow-card">
          <Command.Empty className="px-3 py-2 text-[13px] text-txt-muted">
            {value.trim()
              ? `Use custom command "${value.trim().toUpperCase()}"`
              : "Type to search commands"}
          </Command.Empty>
          {commands.map((c) => (
            <Command.Item
              key={c.id}
              value={`${c.name} ${c.aliases.join(" ")}`}
              onSelect={() => select(c.name)}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-[13px] text-txt aria-selected:bg-panel-hover"
            >
              <span className="font-medium uppercase">{c.name}</span>
              {c.description && (
                <span className="truncate text-txt-dim">{c.description}</span>
              )}
              <span className="ml-auto flex items-center gap-2">
                <SourceBadge source={c.source} />
                {value.toUpperCase() === c.name.toUpperCase() && (
                  <Check size={14} className="text-accent-green" />
                )}
              </span>
            </Command.Item>
          ))}
        </Command.List>
      )}
    </Command>
  );
}
