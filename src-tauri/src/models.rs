use serde::{Deserialize, Serialize};

/// What fires a macro: a keyboard combo or a mouse button.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Trigger {
    /// "keyboard" | "mouse"
    #[serde(rename = "type")]
    pub kind: String,
    /// e.g. "Ctrl+Y" for keyboard, "MouseX1" / "MouseX2" for mouse.
    #[serde(default)]
    pub value: String,
}

/// A single action inside a macro. Only `command` is used in the MVP, but the
/// shape leaves room for the future visual block editor (delays, loops, ...).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MacroStep {
    #[serde(rename = "type", default = "default_step_type")]
    pub kind: String,
    #[serde(default)]
    pub command: String,
    #[serde(default)]
    pub args: String,
    #[serde(default)]
    pub delay_ms: u64,
}

fn default_step_type() -> String {
    "command".to_string()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Macro {
    pub id: String,
    #[serde(default)]
    pub name: String,
    #[serde(default = "default_true")]
    pub enabled: bool,
    pub trigger: Trigger,
    #[serde(default = "default_target")]
    pub target: String,
    #[serde(default)]
    pub steps: Vec<MacroStep>,
    #[serde(default)]
    pub last_fired: Option<i64>,
}

fn default_true() -> bool {
    true
}

fn default_target() -> String {
    "any".to_string()
}

/// A command in the autocomplete library.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CadCommand {
    pub id: String,
    pub name: String,
    /// "autocad" | "bacad" | "custom"
    #[serde(default = "default_source")]
    pub source: String,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub aliases: Vec<String>,
}

fn default_source() -> String {
    "custom".to_string()
}
