use std::fs;
use std::path::{Path, PathBuf};
use std::sync::atomic::AtomicBool;
use std::sync::Mutex;

use crate::models::{CadCommand, Macro};

/// All persisted data, held in memory and mirrored to disk.
pub struct AppData {
    pub macros: Vec<Macro>,
    pub commands: Vec<CadCommand>,
}

/// Managed Tauri state shared across commands, the trigger engine and hooks.
pub struct AppState {
    pub dir: PathBuf,
    pub data: Mutex<AppData>,
    /// Master switch. When false, no trigger fires a macro.
    pub armed: AtomicBool,
}

impl AppState {
    pub fn load(dir: PathBuf) -> Self {
        let _ = fs::create_dir_all(&dir);

        let macros: Vec<Macro> = read_json(&dir.join("macros.json")).unwrap_or_default();

        let mut commands: Vec<CadCommand> =
            read_json(&dir.join("commands.json")).unwrap_or_default();
        if commands.is_empty() {
            commands = crate::seed::seed_commands();
            let _ = write_json(&dir.join("commands.json"), &commands);
        }

        AppState {
            dir,
            data: Mutex::new(AppData { macros, commands }),
            armed: AtomicBool::new(true),
        }
    }

    pub fn save_macros(&self) {
        let data = self.data.lock().unwrap();
        let _ = write_json(&self.dir.join("macros.json"), &data.macros);
    }

    pub fn save_commands(&self) {
        let data = self.data.lock().unwrap();
        let _ = write_json(&self.dir.join("commands.json"), &data.commands);
    }
}

fn read_json<T: serde::de::DeserializeOwned>(path: &Path) -> Option<T> {
    let txt = fs::read_to_string(path).ok()?;
    serde_json::from_str(&txt).ok()
}

fn write_json<T: serde::Serialize>(path: &Path, value: &T) -> std::io::Result<()> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    let txt = serde_json::to_string_pretty(value).unwrap_or_else(|_| "[]".to_string());
    fs::write(path, txt)
}
