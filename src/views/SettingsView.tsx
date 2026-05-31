import { useState } from "react";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { Download, Power, RefreshCw, Rocket, Zap } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button, Panel, PanelTitle, Spinner, Toggle } from "@/components/ui";

type UpdateState =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "uptodate" }
  | { kind: "available"; update: Update }
  | { kind: "downloading"; percent: number }
  | { kind: "ready" }
  | { kind: "error"; message: string };

export function SettingsView() {
  const armed = useStore((s) => s.armed);
  const setArmed = useStore((s) => s.setArmed);
  const autostart = useStore((s) => s.autostart);
  const setAutostart = useStore((s) => s.setAutostart);
  const appVersion = useStore((s) => s.appVersion);

  const [update, setUpdate] = useState<UpdateState>({ kind: "idle" });

  const checkForUpdates = async () => {
    setUpdate({ kind: "checking" });
    try {
      const result = await check();
      if (result) setUpdate({ kind: "available", update: result });
      else setUpdate({ kind: "uptodate" });
    } catch (e) {
      setUpdate({ kind: "error", message: String(e) });
    }
  };

  const installUpdate = async (u: Update) => {
    try {
      let downloaded = 0;
      let total = 0;
      setUpdate({ kind: "downloading", percent: 0 });
      await u.downloadAndInstall((event) => {
        if (event.event === "Started") {
          total = event.data.contentLength ?? 0;
        } else if (event.event === "Progress") {
          downloaded += event.data.chunkLength;
          const percent = total ? Math.round((downloaded / total) * 100) : 0;
          setUpdate({ kind: "downloading", percent });
        } else if (event.event === "Finished") {
          setUpdate({ kind: "ready" });
        }
      });
      setUpdate({ kind: "ready" });
      await relaunch();
    } catch (e) {
      setUpdate({ kind: "error", message: String(e) });
    }
  };

  return (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-col gap-4 overflow-y-auto">
      <Panel className="space-y-4 p-4">
        <PanelTitle>Updates</PanelTitle>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] text-txt">
              Current version <span className="font-mono text-txt-muted">v{appVersion}</span>
            </p>
            <UpdateStatusLine state={update} />
          </div>
          {update.kind === "available" ? (
            <Button variant="primary" onClick={() => installUpdate(update.update)}>
              <Download size={15} />
              Update to v{update.update.version}
            </Button>
          ) : (
            <Button
              variant="default"
              onClick={checkForUpdates}
              disabled={update.kind === "checking" || update.kind === "downloading"}
            >
              {update.kind === "checking" ? (
                <Spinner />
              ) : (
                <RefreshCw size={15} />
              )}
              Check for updates
            </Button>
          )}
        </div>
        {update.kind === "available" && update.update.body && (
          <div className="rounded-lg border border-panel-border bg-bg-soft p-3">
            <p className="mb-1 text-[12px] font-semibold text-txt-muted">What's new</p>
            <pre className="whitespace-pre-wrap font-sans text-[12px] text-txt">
              {update.update.body}
            </pre>
          </div>
        )}
      </Panel>

      <Panel className="space-y-4 p-4">
        <PanelTitle>General</PanelTitle>
        <Row
          icon={<Zap size={15} />}
          title="Triggers"
          subtitle="Master switch for all hotkeys and mouse buttons"
        >
          <Toggle value={armed} onChange={setArmed} />
        </Row>
        <Row
          icon={<Power size={15} />}
          title="Launch at startup"
          subtitle="Start CadMacro automatically when you sign in"
        >
          <Toggle value={autostart} onChange={setAutostart} />
        </Row>
      </Panel>

      <Panel className="space-y-3 p-4">
        <PanelTitle>About</PanelTitle>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-green/15 text-accent-green">
            <Rocket size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-txt">CadMacro</p>
            <p className="text-[12px] text-txt-muted">
              Macros for AutoCAD &amp; BaCAD · v{appVersion}
            </p>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function UpdateStatusLine({ state }: { state: UpdateState }) {
  const text: Record<UpdateState["kind"], string> = {
    idle: "",
    checking: "Checking for updates...",
    uptodate: "You're on the latest version.",
    available: "An update is available.",
    downloading: "Downloading update...",
    ready: "Installed. Restarting...",
    error: "",
  };
  if (state.kind === "error") {
    return <p className="mt-0.5 text-[12px] text-accent-red">{state.message}</p>;
  }
  if (state.kind === "downloading") {
    return (
      <p className="mt-0.5 text-[12px] text-txt-muted">
        Downloading update... {state.percent}%
      </p>
    );
  }
  const t = text[state.kind];
  return t ? <p className="mt-0.5 text-[12px] text-txt-muted">{t}</p> : null;
}

function Row({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-panel-input text-txt-muted">
          {icon}
        </div>
        <div>
          <p className="text-[13px] font-medium text-txt">{title}</p>
          <p className="text-[12px] text-txt-muted">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
