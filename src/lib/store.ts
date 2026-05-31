import { create } from "zustand";
import { listen } from "@tauri-apps/api/event";
import { getVersion } from "@tauri-apps/api/app";
import { api } from "./api";
import type { CadCommand, Macro } from "./types";

export type View = "macros" | "library" | "settings";
export type ToastKind = "info" | "success" | "error";

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface AppStore {
  view: View;
  macros: Macro[];
  commands: CadCommand[];
  armed: boolean;
  autostart: boolean;
  appVersion: string;
  loaded: boolean;
  /** id -> last fired timestamp (live, from the Rust engine). */
  fired: Record<string, number>;
  toasts: Toast[];
  modalOpen: boolean;
  editing: Macro | null;

  setView: (view: View) => void;
  init: () => Promise<void>;

  saveMacro: (m: Macro) => Promise<void>;
  deleteMacro: (id: string) => Promise<void>;
  toggleMacro: (id: string, enabled: boolean) => Promise<void>;
  runMacro: (id: string) => Promise<void>;

  setArmed: (value: boolean) => Promise<void>;
  setAutostart: (value: boolean) => Promise<void>;

  upsertCommand: (c: CadCommand) => Promise<void>;
  deleteCommand: (id: string) => Promise<void>;
  importCommands: (items: CadCommand[], replace: boolean) => Promise<void>;

  openModal: (m?: Macro | null) => void;
  closeModal: () => void;

  toast: (kind: ToastKind, message: string) => void;
  dismissToast: (id: number) => void;
}

let toastSeq = 1;

export const useStore = create<AppStore>((set, get) => ({
  view: "macros",
  macros: [],
  commands: [],
  armed: true,
  autostart: false,
  appVersion: "",
  loaded: false,
  fired: {},
  toasts: [],
  modalOpen: false,
  editing: null,

  setView: (view) => set({ view }),

  init: async () => {
    try {
      const [macros, commands, armed, autostart, appVersion] = await Promise.all([
        api.listMacros(),
        api.listCommands(),
        api.getArmed(),
        api.getAutostart(),
        getVersion(),
      ]);
      set({ macros, commands, armed, autostart, appVersion, loaded: true });
    } catch (e) {
      set({ loaded: true });
      get().toast("error", `Failed to load: ${String(e)}`);
    }

    await listen<string>("macro-fired", (event) => {
      const id = event.payload;
      set((s) => ({ fired: { ...s.fired, [id]: Date.now() } }));
    });
    await listen<{ id: string; message: string }>("macro-error", (event) => {
      get().toast("error", `Macro failed: ${event.payload.message}`);
    });
    await listen<boolean>("armed-changed", (event) => {
      set({ armed: event.payload });
    });
  },

  saveMacro: async (m) => {
    const macros = await api.saveMacro(m);
    set({ macros });
  },

  deleteMacro: async (id) => {
    const macros = await api.deleteMacro(id);
    set({ macros });
    get().toast("info", "Macro deleted");
  },

  toggleMacro: async (id, enabled) => {
    const macros = await api.setMacroEnabled(id, enabled);
    set({ macros });
  },

  runMacro: async (id) => {
    try {
      await api.runMacroNow(id);
    } catch (e) {
      get().toast("error", String(e));
    }
  },

  setArmed: async (value) => {
    const armed = await api.setArmed(value);
    set({ armed });
  },

  setAutostart: async (value) => {
    try {
      const autostart = await api.setAutostart(value);
      set({ autostart });
    } catch (e) {
      get().toast("error", `Could not change startup setting: ${String(e)}`);
    }
  },

  upsertCommand: async (c) => {
    const commands = await api.upsertCommand(c);
    set({ commands });
  },

  deleteCommand: async (id) => {
    const commands = await api.deleteCommand(id);
    set({ commands });
  },

  importCommands: async (items, replace) => {
    const commands = await api.importCommands(items, replace);
    set({ commands });
    get().toast("success", `Imported ${items.length} command(s)`);
  },

  openModal: (m = null) => set({ modalOpen: true, editing: m }),
  closeModal: () => set({ modalOpen: false, editing: null }),

  toast: (kind, message) => {
    const id = toastSeq++;
    set((s) => ({ toasts: [...s.toasts, { id, kind, message }] }));
    setTimeout(() => get().dismissToast(id), 4000);
  },

  dismissToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
