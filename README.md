# Smart Panel

A VSCode extension that intelligently manages the bottom panel (Terminal, Problems, Output, Debug Console) based on your editor state, maximizing your workspace efficiency.

## ✨ Features

### 🔄 Automatic Panel Management
- **Smart Auto-Maximize**: Automatically maximizes the bottom panel when no editor tabs are open
- **Intelligent Restoration**: Restores panel to normal size or hides it completely when you open files
- **Configurable Behavior**: Choose how the panel behaves when editors are opened

### ⚙️ Flexible Configuration
- **Toggle Auto-Maximize**: Enable or disable automatic panel management
- **Custom Panel Behavior**: Configure whether to restore to normal size or hide completely
- **Manual Controls**: Override automatic behavior with manual commands

## 🚀 Installation

### From VS Code Marketplace
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "Smart Panel"
4. Click Install

### From VSIX File
1. Download the latest `.vsix` file from releases
2. Open VS Code
3. Open Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
4. Run "Extensions: Install from VSIX..."
5. Select the downloaded `.vsix` file

## 📖 Usage

### Automatic Behavior
Once installed, Smart Panel works automatically:
- When you close the last editor tab, the bottom panel maximizes
- When you open a file, the panel behavior depends on your configuration

### Manual Commands
Access these commands via Command Palette (Ctrl+Shift+P / Cmd+Shift+P):

| Command | Description |
|---------|-------------|
| `Smart Panel: Maximize Panel` | Manually maximize the bottom panel |
| `Smart Panel: Restore Panel` | Manually restore panel to normal size |
| `Smart Panel: Toggle Auto-Maximize` | Enable/disable automatic panel management |

## ⚙️ Configuration

Configure Smart Panel in VS Code Settings (File → Preferences → Settings):

### `smartPanel.enableAutoMaximize`
- **Type**: `boolean`
- **Default**: `true`
- **Description**: Enable automatic panel maximization when no editors are open

### `smartPanel.editorOpenBehavior`
- **Type**: `string`
- **Options**: `"normal"` | `"hidden"`
- **Default**: `"normal"`
- **Description**: How to handle the panel when an editor tab is opened
  - `"normal"`: Restore the panel to its normal size
  - `"hidden"`: Hide the panel completely

## 🎯 Use Cases

### Perfect for:
- **Terminal-heavy workflows**: Maximize terminal space when not editing files
- **Debugging sessions**: Get more space for debug output when analyzing logs
- **Problem solving**: Focus on Problems panel when no code is open
- **Output monitoring**: Keep an eye on build outputs and logs

### Example Workflows:
1. **Web Development**: Close editor → Terminal maximizes → Run dev server → Open file → Terminal restores
2. **Data Analysis**: Close editor → Output panel maximizes → View logs → Open script → Panel hides
3. **Debugging**: Close editor → Debug console maximizes → Analyze output → Open source → Console restores

## 🛠️ Technical Details

### Requirements
- **VS Code Version**: 1.74.0 or higher
- **Platform**: Works on Windows, macOS, and Linux

### Extension Activation
- Activates on VS Code startup (`onStartupFinished`)
- Minimal performance impact - only monitors editor state changes

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests on GitHub.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.