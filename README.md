# CadMacro

A slick Windows desktop app for creating and running **macros for AutoCAD & BaCAD**.
Create a macro, pick a command from an autocomplete library, bind it to a keyboard
shortcut or an extra mouse button, and CadMacro types that command into the focused
CAD window for you. It runs in the background from the system tray and updates itself
straight from GitHub Releases.

Built with **Tauri v2** (Rust core) + **React + TypeScript + Tailwind CSS**.

## Features

- **Macros** that fire one or more CAD commands via keystroke injection (works with
  both AutoCAD and BaCAD).
- **Command library** with autocomplete, seeded with common AutoCAD commands and
  fully editable (add your own BaCAD/custom commands, import/export as JSON).
- **Triggers**: global keyboard shortcuts or the extra mouse buttons (X1 / X2).
- **Target focusing**: optionally bring an AutoCAD/BaCAD window to the front before
  typing, or just type into whatever is focused.
- **Runs in the tray** with a master on/off switch and optional launch-at-startup.
- **In-app auto-updater** wired to GitHub Releases.

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Rust](https://www.rust-lang.org/tools/install) (stable)
- Microsoft **WebView2** runtime (preinstalled on Windows 10/11)
- Tauri Windows prerequisites (MSVC build tools): see
  [tauri.app/start/prerequisites](https://tauri.app/start/prerequisites/)

## Getting started (development)

```bash
npm install
npm run tauri dev
```

The window opens with the dark UI. Frontend code lives in `src/`, the Rust core in
`src-tauri/src/`.

## Project structure

```
src/                     React + TypeScript UI
  components/            Title bar, modal, cards, command picker, toaster, UI kit
  views/                 Macros, Library, Settings screens
  lib/                   types, api (invoke wrappers), zustand store, utils
src-tauri/src/
  lib.rs                 Tauri builder, plugins, system tray, window behavior
  commands.rs            #[tauri::command] handlers (CRUD, import/export, settings)
  store.rs / models.rs   JSON persistence + data model
  seed.rs                Default command library (first-run)
  engine.rs              Trigger registration + dispatch
  mouse_hook.rs          Low-level WH_MOUSE_LL hook for X1/X2 buttons
  injector.rs            Keystroke injection (enigo) + window focusing
```

Data is stored as `macros.json` and `commands.json` in the app config directory
(`%APPDATA%/com.cadmacro.app`).

## Building an installer locally

```bash
npm run tauri build
```

This produces an NSIS installer under
`src-tauri/target/release/bundle/nsis/`.

> To produce signed updater artifacts locally, set the signing env vars first
> (see below).

## Auto-update setup (GitHub)

The app checks GitHub Releases for a `latest.json` manifest and can download +
install updates in-app (Settings -> Updates).

Updater signing keys were generated into `.keys/` (git-ignored, **never commit them**):

- `.keys/cadmacro_updater.key` - private key (secret)
- `.keys/cadmacro_updater.key.pub` - public key (already embedded in
  `src-tauri/tauri.conf.json` under `plugins.updater.pubkey`)
- `.keys/updater_password.txt` - the private key password (secret)

### One-time configuration

1. **Create the GitHub repo** and push this project.
2. **Set the update endpoint**: in `src-tauri/tauri.conf.json`, replace
   `YOUR_GITHUB_USERNAME` in `plugins.updater.endpoints` with your GitHub
   `owner/repo` (e.g. `https://github.com/alice/cadmacro/releases/latest/download/latest.json`).
3. **Add repository secrets** (Settings -> Secrets and variables -> Actions):
   - `TAURI_SIGNING_PRIVATE_KEY` - the full contents of `.keys/cadmacro_updater.key`
   - `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` - the password in `.keys/updater_password.txt`

### Cutting a release

```bash
# bump the version in package.json AND src-tauri/tauri.conf.json, then:
git tag v0.1.1
git push origin v0.1.1
```

The [`Release`](.github/workflows/release.yml) workflow builds the installer, signs
the update artifacts, creates the GitHub Release, and uploads `latest.json`.
Installed apps will then offer the update on next check.

### Code signing (optional)

The build is **not** Authenticode code-signed, so Windows SmartScreen may warn on
first install. This is optional for the MVP. The updater's minisign signature (set up
above) is separate and ensures updates are verified/trusted regardless.

## License

Private project.
