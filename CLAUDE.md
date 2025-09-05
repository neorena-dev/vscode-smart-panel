# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build and Development
```bash
npm install          # Install dependencies
npm run compile      # Compile TypeScript to JavaScript
npm run watch        # Watch mode for development
```

### Testing the Extension
- Press `F5` to launch a new Extension Development Host window
- Or use "Run Extension" configuration in VS Code debugger
- The extension will automatically activate when VS Code starts

## Architecture Overview

This is a VSCode extension that automatically manages the bottom panel (Terminal/Problems/Output) based on editor state:

### Core Functionality
- **Auto-maximize**: When no editor tabs are open, the bottom panel automatically maximizes
- **Auto-restore**: When editor tabs are opened, the panel restores to normal size or hides completely (configurable)
- **Manual commands**: Users can manually control panel state via command palette

### Key Components

**Main Extension Logic** (`src/extension.ts`):
- `activate()`: Sets up event listeners and initializes the extension
- `onDidChangeVisibleTextEditors`: Primary event handler that monitors editor changes
- `onDidChangeActiveTextEditor`: Secondary handler for edge cases
- State tracking with `isPanelMaximized` variable

**Configuration Options** (in `package.json`):
- `smartPanel.enableAutoMaximize`: Enable/disable auto-maximize feature
- `smartPanel.autoHideWhenEditorOpens`: Hide panel completely when editors open (vs just restore size)

**Available Commands**:
- `smartPanel.maximizePanel`: Manually maximize panel
- `smartPanel.restorePanel`: Manually restore panel  
- `smartPanel.toggleAutoMaximize`: Toggle auto-maximize feature on/off

### Event Handling Strategy
The extension uses a dual-listener approach:
1. Primary listener on `onDidChangeVisibleTextEditors` for main functionality
2. Secondary listener on `onDidChangeActiveTextEditor` with timeout for edge cases
3. State management prevents redundant panel operations

### Project Structure
```
src/
  extension.ts          # Main extension logic
out/                    # Compiled JavaScript (generated)
.vscode/
  launch.json          # Debug configuration
  tasks.json           # Build tasks
package.json           # Extension manifest and configuration
tsconfig.json          # TypeScript configuration
```

## Development Notes

- The extension activates on `onStartupFinished` to minimize impact on VS Code startup time
- State initialization includes a 500ms delay to ensure workspace is fully loaded
- Console logging is included for debugging during development
- All user-facing strings and commands use English as per project conventions