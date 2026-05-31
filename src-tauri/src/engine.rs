use std::collections::HashSet;
use std::sync::atomic::Ordering;

use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

use crate::injector;
use crate::models::Macro;
use crate::store::AppState;

#[derive(Clone, Serialize)]
struct MacroErrorPayload {
    id: String,
    message: String,
}

/// Re-register all triggers from the current macro set. Call after any change
/// to macros (save / delete / enable toggle) and once on startup.
pub fn refresh_triggers(app: &AppHandle) {
    let state = app.state::<AppState>();
    let macros = { state.data.lock().unwrap().macros.clone() };

    let shortcuts = app.global_shortcut();
    let _ = shortcuts.unregister_all();

    let mut mouse_buttons: HashSet<u32> = HashSet::new();
    let mut seen_keys: HashSet<String> = HashSet::new();

    for m in macros.iter().filter(|m| m.enabled) {
        match m.trigger.kind.as_str() {
            "keyboard" => {
                let value = m.trigger.value.trim();
                if value.is_empty() || !seen_keys.insert(value.to_string()) {
                    continue;
                }
                let id = m.id.clone();
                let app_handle = app.clone();
                let _ = shortcuts.on_shortcut(value, move |_app, _shortcut, event| {
                    if event.state == ShortcutState::Pressed {
                        fire_by_id(&app_handle, &id);
                    }
                });
            }
            "mouse" => match m.trigger.value.as_str() {
                "MouseX1" => {
                    mouse_buttons.insert(1);
                }
                "MouseX2" => {
                    mouse_buttons.insert(2);
                }
                _ => {}
            },
            _ => {}
        }
    }

    crate::mouse_hook::set_active_buttons(mouse_buttons);
}

/// Called from the mouse-hook worker thread when an intercepted X button fires.
pub fn dispatch_mouse(app: &AppHandle, button: u32) {
    let value = match button {
        1 => "MouseX1",
        2 => "MouseX2",
        _ => return,
    };
    let state = app.state::<AppState>();
    if !state.armed.load(Ordering::Relaxed) {
        return;
    }
    let target = {
        state
            .data
            .lock()
            .unwrap()
            .macros
            .iter()
            .find(|m| m.enabled && m.trigger.kind == "mouse" && m.trigger.value == value)
            .cloned()
    };
    if let Some(m) = target {
        fire(app, m);
    }
}

/// Resolve a macro id and fire it, respecting the master armed switch.
pub fn fire_by_id(app: &AppHandle, id: &str) {
    let state = app.state::<AppState>();
    if !state.armed.load(Ordering::Relaxed) {
        return;
    }
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
    if let Some(m) = target {
        if m.enabled {
            fire(app, m);
        }
    }
}

/// Execute a macro on a background thread so triggers never block the UI or hooks.
pub fn fire(app: &AppHandle, m: Macro) {
    let app = app.clone();
    std::thread::spawn(move || {
        let id = m.id.clone();
        match injector::run_macro(&m) {
            Ok(()) => {
                let _ = app.emit("macro-fired", id);
            }
            Err(message) => {
                let _ = app.emit("macro-error", MacroErrorPayload { id, message });
            }
        }
    });
}
