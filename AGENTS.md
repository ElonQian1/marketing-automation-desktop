# Project instructions

## Build and storage

Run `scripts/build-preflight.ps1 -Intent Inspect` before a local build. Windows Rust builds use this repository's `scripts/rust-cache.ps1` and its machine profile. Inspect the actual workspace, TEMP, output and packaging volumes. Keep mandatory shared jobs pending under their original ID while the share is offline.

Before requesting compute, check the original in-flight request and any artifact matching the complete source, configuration, toolchain and signed receipt. Use the project's existing build and release commands, locks and artifact checks. Archive old outputs through their owning workflow after checking active users, rollback references and the verified restore receipt.
