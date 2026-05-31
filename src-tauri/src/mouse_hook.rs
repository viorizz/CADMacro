//! Global low-level mouse hook (Windows) used to capture the extra mouse
//! buttons (X1 / X2) that the keyboard-oriented global-shortcut plugin cannot.

#[cfg(windows)]
mod imp {
    use std::collections::HashSet;
    use std::sync::mpsc::{self, Sender};
    use std::sync::{Mutex, OnceLock};

    use tauri::AppHandle;
    use windows::Win32::Foundation::{HINSTANCE, LPARAM, LRESULT, WPARAM};
    use windows::Win32::System::LibraryLoader::GetModuleHandleW;
    use windows::Win32::UI::WindowsAndMessaging::{
        CallNextHookEx, DispatchMessageW, GetMessageW, SetWindowsHookExW, TranslateMessage,
        UnhookWindowsHookEx, HC_ACTION, MSG, MSLLHOOKSTRUCT, WH_MOUSE_LL, WM_XBUTTONDOWN,
    };

    static SENDER: OnceLock<Sender<u32>> = OnceLock::new();
    static ACTIVE: OnceLock<Mutex<HashSet<u32>>> = OnceLock::new();

    /// Update which X buttons (1 or 2) should be intercepted as macro triggers.
    pub fn set_active_buttons(buttons: HashSet<u32>) {
        let active = ACTIVE.get_or_init(|| Mutex::new(HashSet::new()));
        if let Ok(mut guard) = active.lock() {
            *guard = buttons;
        }
    }

    unsafe extern "system" fn hook_proc(code: i32, wparam: WPARAM, lparam: LPARAM) -> LRESULT {
        if code == HC_ACTION as i32 && wparam.0 as u32 == WM_XBUTTONDOWN {
            let info = &*(lparam.0 as *const MSLLHOOKSTRUCT);
            // The pressed X button is encoded in the high word of mouseData.
            let button = ((info.mouseData >> 16) & 0xFFFF) as u32;
            let intercept = ACTIVE
                .get()
                .map(|m| m.lock().map(|s| s.contains(&button)).unwrap_or(false))
                .unwrap_or(false);
            if intercept {
                if let Some(tx) = SENDER.get() {
                    let _ = tx.send(button);
                }
                // Swallow the event so it does not also trigger browser-style
                // back/forward navigation in the focused app.
                return LRESULT(1);
            }
        }
        CallNextHookEx(None, code, wparam, lparam)
    }

    pub fn start(app: AppHandle) {
        let (tx, rx) = mpsc::channel::<u32>();
        let _ = SENDER.set(tx);
        let _ = ACTIVE.get_or_init(|| Mutex::new(HashSet::new()));

        // Worker thread: run the matched macro off the hook thread.
        std::thread::spawn(move || {
            while let Ok(button) = rx.recv() {
                crate::engine::dispatch_mouse(&app, button);
            }
        });

        // Hook thread: install the hook and pump messages (required for WH_MOUSE_LL).
        std::thread::spawn(|| unsafe {
            let hmod = GetModuleHandleW(None).unwrap_or_default();
            let hook = match SetWindowsHookExW(
                WH_MOUSE_LL,
                Some(hook_proc),
                Some(HINSTANCE(hmod.0)),
                0,
            ) {
                Ok(h) => h,
                Err(_) => return,
            };

            let mut msg = MSG::default();
            while GetMessageW(&mut msg, None, 0, 0).0 > 0 {
                let _ = TranslateMessage(&msg);
                DispatchMessageW(&msg);
            }

            let _ = UnhookWindowsHookEx(hook);
        });
    }
}

#[cfg(not(windows))]
mod imp {
    use std::collections::HashSet;
    use tauri::AppHandle;

    pub fn set_active_buttons(_buttons: HashSet<u32>) {}
    pub fn start(_app: AppHandle) {}
}

pub use imp::*;
