import { invoke } from "@tauri-apps/api/core";
import type { CadCommand, Macro } from "./types";

export const api = {
  listMacros: () => invoke<Macro[]>("list_macros"),
  saveMacro: (item: Macro) => invoke<Macro[]>("save_macro", { item }),
  deleteMacro: (id: string) => invoke<Macro[]>("delete_macro", { id }),
  setMacroEnabled: (id: string, enabled: boolean) =>
    invoke<Macro[]>("set_macro_enabled", { id, enabled }),
  runMacroNow: (id: string) => invoke<void>("run_macro_now", { id }),

  listCommands: () => invoke<CadCommand[]>("list_commands"),
  upsertCommand: (item: CadCommand) => invoke<CadCommand[]>("upsert_command", { item }),
  deleteCommand: (id: string) => invoke<CadCommand[]>("delete_command", { id }),
  importCommands: (items: CadCommand[], replace: boolean) =>
    invoke<CadCommand[]>("import_commands", { items, replace }),
  readCommandsFile: (path: string) => invoke<CadCommand[]>("read_commands_file", { path }),
  exportCommandsFile: (path: string) => invoke<void>("export_commands_file", { path }),

  getArmed: () => invoke<boolean>("get_armed"),
  setArmed: (value: boolean) => invoke<boolean>("set_armed", { value }),
  getAutostart: () => invoke<boolean>("get_autostart"),
  setAutostart: (value: boolean) => invoke<boolean>("set_autostart", { value }),
};
