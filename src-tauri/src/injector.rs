use std::thread::sleep;
use std::time::Duration;

use enigo::{Direction, Enigo, Key, Keyboard, Settings};

use crate::models::Macro;

/// Type each step's command (plus optional args) into the focused window,
/// pressing Enter after each one. Optionally focuses a target CAD window first.
pub fn run_macro(m: &Macro) -> Result<(), String> {
    // A keyboard-triggered macro fires while the user is usually still holding
    // the hotkey's modifier keys (Ctrl/Shift/Alt/Win). Those held modifiers get
    // combined with the Enter we inject below, turning it into e.g. Ctrl+Enter,
    // so CAD apps never receive a plain Enter and the command stays unsubmitted.
    // Release the modifiers first to guarantee a clean Enter. (Mouse triggers
    // hold nothing, which is why they already worked.)
    #[cfg(windows)]
    if m.trigger.kind == "keyboard" {
        release_modifiers();
        sleep(Duration::from_millis(40));
    }

    #[cfg(windows)]
    if m.target != "any" {
        if focus_target(&m.target) {
            // Give the target window a moment to take focus.
            sleep(Duration::from_millis(120));
        }
    }

    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;

    for step in &m.steps {
        if step.kind != "command" {
            continue;
        }
        if step.delay_ms > 0 {
            sleep(Duration::from_millis(step.delay_ms));
        }

        let command = step.command.trim();
        if command.is_empty() {
            continue;
        }

        let mut text = command.to_string();
        let args = step.args.trim();
        if !args.is_empty() {
            text.push(' ');
            text.push_str(args);
        }

        enigo.text(&text).map_err(|e| e.to_string())?;
        enigo
            .key(Key::Return, Direction::Click)
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}

/// Release any modifier keys (Ctrl/Shift/Alt/Win) that may still be physically
/// held from the triggering keyboard shortcut, so injected keystrokes — most
/// importantly Enter — are not silently combined with a stuck modifier.
#[cfg(windows)]
fn release_modifiers() {
    use windows::Win32::UI::Input::KeyboardAndMouse::{
        SendInput, INPUT, INPUT_0, INPUT_KEYBOARD, KEYBDINPUT, KEYEVENTF_KEYUP, VK_CONTROL,
        VK_LCONTROL, VK_LMENU, VK_LSHIFT, VK_LWIN, VK_MENU, VK_RCONTROL, VK_RMENU, VK_RSHIFT,
        VK_RWIN, VK_SHIFT,
    };

    // Send key-up for both the generic and left/right variants of every modifier
    // so a stuck Ctrl/Shift/Alt/Win is cleared regardless of which side was used.
    let modifiers = [
        VK_CONTROL, VK_LCONTROL, VK_RCONTROL, VK_SHIFT, VK_LSHIFT, VK_RSHIFT, VK_MENU, VK_LMENU,
        VK_RMENU, VK_LWIN, VK_RWIN,
    ];

    let inputs: Vec<INPUT> = modifiers
        .iter()
        .map(|&vk| INPUT {
            r#type: INPUT_KEYBOARD,
            Anonymous: INPUT_0 {
                ki: KEYBDINPUT {
                    wVk: vk,
                    wScan: 0,
                    dwFlags: KEYEVENTF_KEYUP,
                    time: 0,
                    dwExtraInfo: 0,
                },
            },
        })
        .collect();

    // SAFETY: `inputs` is a valid, non-empty slice of INPUT for the call's duration.
    unsafe {
        SendInput(&inputs, std::mem::size_of::<INPUT>() as i32);
    }
}

/// Best-effort: bring a window whose title matches the target to the foreground.
/// Returns true if a matching window was found and focused.
#[cfg(windows)]
fn focus_target(target: &str) -> bool {
    use windows::core::BOOL;
    use windows::Win32::Foundation::{HWND, LPARAM};
    use windows::Win32::UI::WindowsAndMessaging::{
        EnumWindows, GetWindowTextLengthW, GetWindowTextW, IsWindowVisible, SetForegroundWindow,
        ShowWindow, SW_RESTORE,
    };

    struct FocusCtx {
        needles: Vec<String>,
        found: HWND,
    }

    unsafe extern "system" fn enum_proc(hwnd: HWND, lparam: LPARAM) -> BOOL {
        let ctx = &mut *(lparam.0 as *mut FocusCtx);
        if !IsWindowVisible(hwnd).as_bool() {
            return BOOL(1);
        }
        let len = GetWindowTextLengthW(hwnd);
        if len <= 0 {
            return BOOL(1);
        }
        let mut buf = vec![0u16; (len + 1) as usize];
        let read = GetWindowTextW(hwnd, &mut buf);
        if read <= 0 {
            return BOOL(1);
        }
        let title = String::from_utf16_lossy(&buf[..read as usize]).to_lowercase();
        for needle in &ctx.needles {
            if title.contains(needle.as_str()) {
                ctx.found = hwnd;
                return BOOL(0); // stop enumerating
            }
        }
        BOOL(1)
    }

    let needles: Vec<String> = match target {
        // BaCAD runs on top of AutoCAD/IntelliCAD, so accept either title.
        "bacad" => vec!["bacad".into(), "autocad".into(), "intellicad".into()],
        "autocad" => vec!["autocad".into()],
        _ => return false,
    };

    let mut ctx = FocusCtx {
        needles,
        found: HWND(std::ptr::null_mut()),
    };

    unsafe {
        let _ = EnumWindows(Some(enum_proc), LPARAM(&mut ctx as *mut _ as isize));
        if !ctx.found.0.is_null() {
            let _ = ShowWindow(ctx.found, SW_RESTORE);
            return SetForegroundWindow(ctx.found).as_bool();
        }
    }

    false
}
