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
- **Combat pause menu:** Save button persists runtime + schedules autosave without leaving map
- **Map exit autosave:** pause Return Home and EXIT zone both persist runtime + flush to IndexedDB

## Remaining

None for save-anywhere MVP path.

## Verification

- Save survives page reload
- Corrupt saves rejected and regenerated
