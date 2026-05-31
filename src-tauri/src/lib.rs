mod commands;
mod engine;
mod injector;
mod models;
mod mouse_hook;
mod seed;
mod store;

use std::sync::atomic::Ordering;

use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{Emitter, Manager};
use tauri_plugin_autostart::MacosLauncher;

use store::AppState;

fn show_main_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // single-instance must be registered first.
        .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            show_main_window(app);
        }))
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_autostart::init(MacosLauncher::LaunchAgent, None))
        .setup(|app| {
            // Load persisted data (seeds the command library on first run).
            let config_dir = app
                .path()
                .app_config_dir()
                .expect("failed to resolve app config dir");
            app.manage(AppState::load(config_dir));

            // System tray so the app keeps running (and triggers keep firing)
            // while the window is closed.
            let open_item = MenuItem::with_id(app, "open", "Open CadMacro", true, None::<&str>)?;
            let toggle_item =
                MenuItem::with_id(app, "toggle", "Pause triggers", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(
                app,
                &[
                    &open_item,
                    &PredefinedMenuItem::separator(app)?,
                    &toggle_item,
                    &PredefinedMenuItem::separator(app)?,
                    &quit_item,
                ],
            )?;

            let toggle_handle = toggle_item.clone();
            let _tray = TrayIconBuilder::with_id("main-tray")
                .tooltip("CadMacro")
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(move |app, event| match event.id().as_ref() {
                    "open" => show_main_window(app),
                    "quit" => app.exit(0),
                    "toggle" => {
                        let state = app.state::<AppState>();
                        let next = !state.armed.load(Ordering::Relaxed);
                        state.armed.store(next, Ordering::Relaxed);
                        let _ = toggle_handle
                            .set_text(if next { "Pause triggers" } else { "Resume triggers" });
                        let _ = app.emit("armed-changed", next);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        show_main_window(tray.app_handle());
                    }
                })
                .build(app)?;

            // Hide to tray instead of quitting when the window is closed.
            if let Some(window) = app.get_webview_window("main") {
                let win = window.clone();
                window.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        let _ = win.hide();
                    }
                });
            }

            // Start the global mouse-button hook and register all triggers.
            mouse_hook::start(app.handle().clone());
            engine::refresh_triggers(app.handle());

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::list_macros,
            commands::save_macro,
            commands::delete_macro,
            commands::set_macro_enabled,
            commands::run_macro_now,
            commands::list_commands,
            commands::upsert_command,
            commands::delete_command,
            commands::import_commands,
            commands::read_commands_file,
            commands::export_commands_file,
            commands::get_armed,
            commands::set_armed,
            commands::get_autostart,
            commands::set_autostart,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
