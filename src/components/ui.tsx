import { type ReactNode } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CommandSource } from "@/lib/types";
import { SOURCE_LABELS } from "@/lib/types";

export function Panel({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <section className={cn("panel", className)}>{children}</section>;
}

export function PanelTitle({
  icon = true,
  children,
  right,
}: {
  icon?: boolean;
  children: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        {icon && <Info size={15} className="text-txt-dim" />}
        <h3 className="text-[15px] font-semibold text-txt">{children}</h3>
      </div>
      {right}
    </div>
  );
}

/** The red OFF / green ON pill from the reference design. */
export function Toggle({
  value,
  onChange,
  disabled,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className={cn("seg-group", disabled && "opacity-50 pointer-events-none")}>
      <button
        type="button"
        data-active={!value}
        onClick={() => onChange(false)}
        className="seg-btn data-[active=true]:text-accent-red data-[active=true]:bg-seg-active"
      >
        OFF
      </button>
      <button
        type="button"
        data-active={value}
        onClick={() => onChange(true)}
        className="seg-btn data-[active=true]:bg-accent-green data-[active=true]:text-white"
      >
        ON
      </button>
    </div>
  );
}

export interface SegOption<T extends string> {
  value: T;
  label: string;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: SegOption<T>[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("seg-group", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          data-active={o.value === value}
          onClick={() => onChange(o.value)}
          className="seg-btn"
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const SOURCE_STYLES: Record<CommandSource, string> = {
  autocad: "bg-accent-blue/15 text-accent-blue",
  bacad: "bg-amber-400/15 text-amber-300",
  custom: "bg-panel-border/60 text-txt-muted",
};

export function SourceBadge({ source }: { source: CommandSource }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        SOURCE_STYLES[source],
      )}
    >
      {SOURCE_LABELS[source]}
    </span>
  );
}

export function Button({
  variant = "default",
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "primary" | "ghost" | "danger";
}) {
  const variants: Record<string, string> = {
    default:
      "bg-panel-input border border-panel-border text-txt hover:bg-panel-hover",
    primary: "bg-accent-green text-white hover:brightness-110",
    ghost: "text-txt-muted hover:text-txt hover:bg-panel-hover",
    danger: "bg-accent-red/15 text-accent-red hover:bg-accent-red/25",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "h-4 w-4 animate-spin rounded-full border-2 border-txt-dim border-t-txt",
        className,
      )}
    />
  );
}
