# Change Log

All notable changes to the "dsrv-vscode" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]


[0.2.0] - 2026-03-17
### Added
- Added support for code completion in the language server
- Added Code running capabilities in the language server
- Added the ICAPL License and the ICA-USAGE-MODE to the project 

### Changed
- Changed all mentions of "DynSRV" to "dsrv" in the extension and language server
- Restructured the server folder to be more organized and easier to navigate

### Removed
- Removed the old typescript based language server and all related files and dependencies


[0.1.0] - 2026-02-23
### Added
- Implemented a rust based language server
- Added syntax error checking in the language server
- Added a seperate output channel for the language server in vscode

### Changed
- Changed license from MIT to GPL-3.0 
- Started to update the extension.ts file to communicate with the language server and include less junk


[0.0.1] - 2026-01-30

### Added
- Implemented the basic syntax highlighting for the "dsrv" language.
- Added support for recognizing keywords, variables, and comments in "dsrv" files.
- Created a simple extension structure to integrate with Visual Studio Code.

### Changed
- Initial release of the "dsrv-vscode" extension with basic functionality.
- Set up the extension to activate on opening files with the ".dsrv" extension.

