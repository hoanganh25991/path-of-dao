# 05 — Save system foundation

**Status:** `[x]` Done  
**Plan:** [plans/05-save-system-foundation.md](../plans/05-save-system-foundation.md)  
**Last updated:** 2026-07-03

## Summary

Persistent player save in the browser with checksum, migration, and export/import.

## Done

- IndexedDB storage with integrity checksum
- Save version migration when schema changes
- Global game store for reactive UI updates
- Autosave when leaving a scene
- Export and import save as JSON backup
- Default new-game save template

## Remaining

- **Tiên Nghịch gap:** new game still equips a starter wood sword; should start with no weapon (see [tien-nghich-alignment.md](./tien-nghich-alignment.md) T4)

## Verification

- Save survives page reload
- Corrupt saves rejected and regenerated
