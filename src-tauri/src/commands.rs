use std::sync::atomic::Ordering;

use tauri::{AppHandle, State};
use tauri_plugin_autostart::ManagerExt;

use crate::engine;
use crate::models::{CadCommand, Macro};
use crate::store::AppState;

// ---------------------------------------------------------------------------
// Macros
// ---------------------------------------------------------------------------

#[tauri::command]
pub fn list_macros(state: State<AppState>) -> Vec<Macro> {
    state.data.lock().unwrap().macros.clone()
}

#[tauri::command]
pub fn save_macro(app: AppHandle, state: State<AppState>, mut item: Macro) -> Vec<Macro> {
    if item.id.trim().is_empty() {
        item.id = uuid::Uuid::new_v4().to_string();
    }
    {
        let mut data = state.data.lock().unwrap();
        if let Some(existing) = data.macros.iter_mut().find(|m| m.id == item.id) {
            *existing = item;
        } else {
            data.macros.push(item);
        }
    }
    state.save_macros();
    engine::refresh_triggers(&app);
    state.data.lock().unwrap().macros.clone()
}

#[tauri::command]
pub fn delete_macro(app: AppHandle, state: State<AppState>, id: String) -> Vec<Macro> {
    {
        state.data.lock().unwrap().macros.retain(|m| m.id != id);
    }
    state.save_macros();
    engine::refresh_triggers(&app);
    state.data.lock().unwrap().macros.clone()
}

#[tauri::command]
pub fn set_macro_enabled(
    app: AppHandle,
    state: State<AppState>,
    id: String,
    enabled: bool,
) -> Vec<Macro> {
    {
        let mut data = state.data.lock().unwrap();
        if let Some(m) = data.macros.iter_mut().find(|m| m.id == id) {
            m.enabled = enabled;
        }
    }
    state.save_macros();
    engine::refresh_triggers(&app);
    state.data.lock().unwrap().macros.clone()
}

/// Manually fire a macro (the "test" button). Ignores the armed switch.
#[tauri::command]
pub fn run_macro_now(app: AppHandle, state: State<AppState>, id: String) -> Result<(), String> {
    let target = {
        state
            .data
            .lock()
            .unwrap()
            .macros
            .iter()
            .find(|m| m.id == id)
            .cloned()
    };
    match target {
        Some(m) => {
            engine::fire(&app, m);
            Ok(())
        }
        None => Err("Macro not found".to_string()),
    }
}

// ---------------------------------------------------------------------------
// Command library
// ---------------------------------------------------------------------------

#[tauri::command]
pub fn list_commands(state: State<AppState>) -> Vec<CadCommand> {
    state.data.lock().unwrap().commands.clone()
}

#[tauri::command]
pub fn upsert_command(state: State<AppState>, mut item: CadCommand) -> Vec<CadCommand> {
    if item.id.trim().is_empty() {
        item.id = uuid::Uuid::new_v4().to_string();
    }
    {
        let mut data = state.data.lock().unwrap();
        if let Some(existing) = data.commands.iter_mut().find(|c| c.id == item.id) {
            *existing = item;
        } else {
            data.commands.push(item);
        }
        sort_commands(&mut data.commands);
    }
    state.save_commands();
    state.data.lock().unwrap().commands.clone()
}

#[tauri::command]
pub fn delete_command(state: State<AppState>, id: String) -> Vec<CadCommand> {
    {
        state.data.lock().unwrap().commands.retain(|c| c.id != id);
    }
    state.save_commands();
    state.data.lock().unwrap().commands.clone()
}

/// Replace or merge the library with an imported set of commands.
#[tauri::command]
pub fn import_commands(
    state: State<AppState>,
    items: Vec<CadCommand>,
    replace: bool,
) -> Vec<CadCommand> {
    {
        let mut data = state.data.lock().unwrap();
        if replace {
            data.commands.clear();
        }
        for mut incoming in items {
            if incoming.id.trim().is_empty() {
                incoming.id = uuid::Uuid::new_v4().to_string();
            }
            let dup = data
                .commands
                .iter_mut()
                .find(|c| c.name.eq_ignore_ascii_case(&incoming.name) && c.source == incoming.source);
            match dup {
                Some(existing) => *existing = incoming,
                None => data.commands.push(incoming),
            }
        }
        sort_commands(&mut data.commands);
    }
    state.save_commands();
    state.data.lock().unwrap().commands.clone()
}

/// Read and parse a commands JSON file chosen via the open dialog.
#[tauri::command]
pub fn read_commands_file(path: String) -> Result<Vec<CadCommand>, String> {
    let text = std::fs::read_to_string(&path).map_err(|e| e.to_string())?;
    serde_json::from_str::<Vec<CadCommand>>(&text).map_err(|e| e.to_string())
}

/// Write the current library to a JSON file chosen via the save dialog.
#[tauri::command]
pub fn export_commands_file(state: State<AppState>, path: String) -> Result<(), String> {
    let commands = state.data.lock().unwrap().commands.clone();
    let text = serde_json::to_string_pretty(&commands).map_err(|e| e.to_string())?;
    std::fs::write(&path, text).map_err(|e| e.to_string())
}

fn sort_commands(commands: &mut [CadCommand]) {
    commands.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
}

// ---------------------------------------------------------------------------
// Master switch + autostart
// ---------------------------------------------------------------------------

#[tauri::command]
pub fn get_armed(state: State<AppState>) -> bool {
    state.armed.load(Ordering::Relaxed)
}

#[tauri::command]
pub fn set_armed(app: AppHandle, state: State<AppState>, value: bool) -> bool {
    state.armed.store(value, Ordering::Relaxed);
    let _ = tauri::Emitter::emit(&app, "armed-changed", value);
    value
}

#[tauri::command]
pub fn get_autostart(app: AppHandle) -> bool {
    app.autolaunch().is_enabled().unwrap_or(false)
}

#[tauri::command]
pub fn set_autostart(app: AppHandle, value: bool) -> Result<bool, String> {
    let manager = app.autolaunch();
    if value {
        manager.enable().map_err(|e| e.to_string())?;
    } else {
        manager.disable().map_err(|e| e.to_string())?;
    }
    Ok(manager.is_enabled().unwrap_or(value))
}
