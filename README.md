<div align="center">
  <h1>🚀 LaunchPad</h1>
  <p><strong>The ultimate visual configuration manager for VS Code</strong></p>
  <p>
    Stop wrestling with JSON. Create, manage, and run your debug configurations and tasks through a beautiful, feature-rich UI.
  </p>
</div>

---

## ✨ Features

LaunchPad replaces the manual editing of `launch.json` and `tasks.json` with a premium visual experience:

- ⚡ **Sidebar Manager**: A beautiful dedicated view in the Debug panel to see all your configs and tasks at a glance.
- 🎨 **Visual Editor**: Full-tab form-based editor. No more syntax errors or missing commas.
- 🧙‍♂️ **Creation Wizard**: Step-by-step wizard to create configurations for Node.js, Python, C++, Go, Java, Chrome, and more.
- 🤖 **Auto-Detection**: Instantly recommends debug configurations based on your project's files (e.g., auto-detects Jest, Django, Go modules).
- 🔄 **Live Sync**: Two-way synchronization. Edit the JSON manually, and the UI updates instantly. Edit in the UI, and the JSON is updated while preserving all your comments and formatting!
- 🔍 **Search & Filter**: Find that one specific task or config instantly.

## 🚀 Getting Started

1. Open the **Run and Debug** view in the Activity Bar.
2. Look for the **LaunchPad** section.
3. Click **+ Config** or **+ Task** to open the visual editor!
4. If your workspace is empty, click a **Quick Start** button to instantly generate a config based on your project.

## 🛠 Supported Debuggers (Templates)

LaunchPad comes with built-in templates and language-aware icons for:
- Node.js (Launch, Attach, Mocha, Jest, ts-node)
- Python (Django, Flask, FastAPI, Pytest)
- Chrome / Edge
- C/C++ (GDB, LLDB)
- Go (Package, File, Test)
- .NET (CoreCLR)
- Java
- VS Code Extension Development

## ⌨️ Commands

- `LaunchPad: New Configuration`: Open the wizard to create a new `launch.json` entry.
- `LaunchPad: New Task`: Open the visual editor to create a new `tasks.json` entry.