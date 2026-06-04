# Changelog

All notable changes to this project will be documented in this file.

## [1.0.8] - 2026-06-04

### Added

- Added automatic parent-side iframe height resizing via `autoResize`.
- Added optional parent-side iframe width resizing via `resizeWidth`.
- Added initial forced resize event from the child after listener setup.
- Added README documentation for resize behavior, security, and new options.

### Changed

- Child initialization now waits until `document.body` is available before registering resize listeners.
- Child `ready` message is now sent after listener setup.
- Minified distribution files were regenerated from the updated source files.

### Fixed

- Parent now validates `event.origin` when `targetOrigin` is configured.
- Child now validates incoming `postMessage` payloads before destructuring them.
- Child now handles missing `ResizeObserver` support without crashing during initialization.

## [1.0.7] - 2025-04-29

### Changed

- Previous stable release.
