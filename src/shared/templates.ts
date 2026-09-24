import type { DebugTypeInfo } from '../../shared/protocol';

/**
 * Pre-built debug configuration templates organized by language/debugger type.
 * These power the creation wizard and auto-detection suggestions.
 */
export const DEBUG_TYPES: DebugTypeInfo[] = [
  {
    type: 'node',
    label: 'Node.js',
    icon: '🟢',
    color: '#68a063',
    templates: [
      {
        name: 'Launch Program',
        description: 'Launch a Node.js program',
        icon: '▶️',
        config: {
          name: 'Launch Program',
          type: 'node',
          request: 'launch',
          program: '${workspaceFolder}/index.js',
          console: 'integratedTerminal',
          skipFiles: ['<node_internals>/**'],
        },
      },
      {
        name: 'Launch via NPM',
        description: 'Run an npm script with debugging',
        icon: '📦',
        config: {
          name: 'Launch via NPM',
          type: 'node',
          request: 'launch',
          runtimeExecutable: 'npm',
          runtimeArgs: ['run-script', 'start'],
          console: 'integratedTerminal',
          skipFiles: ['<node_internals>/**'],
        },
      },
      {
        name: 'Attach to Process',
        description: 'Attach to a running Node.js process',
        icon: '🔗',
        config: {
          name: 'Attach to Process',
          type: 'node',
          request: 'attach',
          processId: '${command:PickProcess}',
          skipFiles: ['<node_internals>/**'],
        },
      },
      {
        name: 'Attach to Port',
        description: 'Attach to a process on a specific port',
        icon: '🔌',
        config: {
          name: 'Attach to Port',
          type: 'node',
          request: 'attach',
          port: 9229,
          skipFiles: ['<node_internals>/**'],
        },
      },
      {
        name: 'Mocha Tests',
        description: 'Debug Mocha tests',
        icon: '🧪',
        config: {
          name: 'Mocha Tests',
          type: 'node',
          request: 'launch',
          program: '${workspaceFolder}/node_modules/.bin/mocha',
          args: ['--recursive', '--timeout', '10000'],
          console: 'integratedTerminal',
          skipFiles: ['<node_internals>/**'],
        },
      },
      {
        name: 'Jest Tests',
        description: 'Debug Jest tests',
        icon: '🃏',
        config: {
          name: 'Jest Tests',
          type: 'node',
          request: 'launch',
          program: '${workspaceFolder}/node_modules/.bin/jest',
          args: ['--runInBand'],
          console: 'integratedTerminal',
          skipFiles: ['<node_internals>/**'],
        },
      },
      {
        name: 'TypeScript (ts-node)',
        description: 'Launch TypeScript with ts-node',
        icon: '🔷',
        config: {
          name: 'Launch TypeScript',
          type: 'node',
          request: 'launch',
          runtimeArgs: ['-r', 'ts-node/register'],
          program: '${workspaceFolder}/src/index.ts',
          console: 'integratedTerminal',
          skipFiles: ['<node_internals>/**'],
        },
      },
    ],
  },
  {
    type: 'python',
    label: 'Python',
    icon: '🐍',
    color: '#3776ab',
    templates: [
      {
        name: 'Python File',
        description: 'Launch the current Python file',
        icon: '▶️',
        config: {
          name: 'Python: Current File',
          type: 'debugpy',
          request: 'launch',
          program: '${file}',
          console: 'integratedTerminal',
        },
      },
      {
        name: 'Django',
        description: 'Launch Django server',
        icon: '🌿',
        config: {
          name: 'Python: Django',
          type: 'debugpy',
          request: 'launch',
          program: '${workspaceFolder}/manage.py',
          args: ['runserver', '--noreload'],
          django: true,
          console: 'integratedTerminal',
        },
      },
      {
        name: 'Flask',
        description: 'Launch Flask server',
        icon: '🧪',
        config: {
          name: 'Python: Flask',
          type: 'debugpy',
          request: 'launch',
          module: 'flask',
          env: { FLASK_APP: 'app.py', FLASK_DEBUG: '1' },
          args: ['run', '--no-debugger'],
          console: 'integratedTerminal',
        },
      },
      {
        name: 'FastAPI',
        description: 'Launch FastAPI with uvicorn',
        icon: '⚡',
        config: {
          name: 'Python: FastAPI',
          type: 'debugpy',
          request: 'launch',
          module: 'uvicorn',
          args: ['main:app', '--reload'],
          console: 'integratedTerminal',
        },
      },
      {
        name: 'Remote Attach',
        description: 'Attach to a remote Python process',
        icon: '🔗',
        config: {
          name: 'Python: Remote Attach',
          type: 'debugpy',
          request: 'attach',
          connect: { host: 'localhost', port: 5678 },
          pathMappings: [
            { localRoot: '${workspaceFolder}', remoteRoot: '.' },
          ],
        },
      },
      {
        name: 'Pytest',
        description: 'Debug pytest tests',
        icon: '🧪',
        config: {
          name: 'Python: Pytest',
          type: 'debugpy',
          request: 'launch',
          module: 'pytest',
          args: ['-v'],
          console: 'integratedTerminal',
        },
      },
    ],
  },
  {
    type: 'chrome',
    label: 'Chrome',
    icon: '🌐',
    color: '#4285F4',
    templates: [
      {
        name: 'Launch Chrome',
        description: 'Launch Chrome against a URL',
        icon: '▶️',
        config: {
          name: 'Launch Chrome',
          type: 'chrome',
          request: 'launch',
          url: 'http://localhost:3000',
          webRoot: '${workspaceFolder}',
        },
      },
      {
        name: 'Attach to Chrome',
        description: 'Attach to a running Chrome instance',
        icon: '🔗',
        config: {
          name: 'Attach to Chrome',
          type: 'chrome',
          request: 'attach',
          port: 9222,
          webRoot: '${workspaceFolder}',
        },
      },
    ],
  },
  {
    type: 'cppdbg',
    label: 'C/C++ (GDB)',
    icon: '⚙️',
    color: '#00599C',
    templates: [
      {
        name: 'GDB Launch',
        description: 'Launch with GDB debugger',
        icon: '▶️',
        config: {
          name: 'C/C++: GDB Launch',
          type: 'cppdbg',
          request: 'launch',
          program: '${workspaceFolder}/a.out',
          args: [],
          stopAtEntry: false,
          cwd: '${workspaceFolder}',
          environment: [],
          MIMode: 'gdb',
          setupCommands: [
            { description: 'Enable pretty-printing for gdb', text: '-enable-pretty-printing', ignoreFailures: true },
          ],
        },
      },
      {
        name: 'LLDB Launch',
        description: 'Launch with LLDB debugger',
        icon: '🔧',
        config: {
          name: 'C/C++: LLDB Launch',
          type: 'cppdbg',
          request: 'launch',
          program: '${workspaceFolder}/a.out',
          args: [],
          stopAtEntry: false,
          cwd: '${workspaceFolder}',
          environment: [],
          MIMode: 'lldb',
        },
      },
    ],
  },
  {
    type: 'go',
    label: 'Go',
    icon: '🔵',
    color: '#00ADD8',
    templates: [
      {
        name: 'Launch Package',
        description: 'Launch the current Go package',
        icon: '▶️',
        config: {
          name: 'Go: Launch Package',
          type: 'go',
          request: 'launch',
          mode: 'auto',
          program: '${workspaceFolder}',
        },
      },
      {
        name: 'Launch File',
        description: 'Launch the current Go file',
        icon: '📄',
        config: {
          name: 'Go: Launch File',
          type: 'go',
          request: 'launch',
          mode: 'auto',
          program: '${file}',
        },
      },
      {
        name: 'Debug Test',
        description: 'Debug Go tests',
        icon: '🧪',
        config: {
          name: 'Go: Debug Test',
          type: 'go',
          request: 'launch',
          mode: 'test',
          program: '${workspaceFolder}',
        },
      },
      {
        name: 'Attach to Process',
        description: 'Attach to a running Go process',
        icon: '🔗',
        config: {
          name: 'Go: Attach',
          type: 'go',
          request: 'attach',
          mode: 'local',
          processId: 0,
        },
      },
    ],
  },
  {
    type: 'coreclr',
    label: '.NET',
    icon: '🟣',
    color: '#512BD4',
    templates: [
      {
        name: '.NET Launch',
        description: 'Launch a .NET application',
        icon: '▶️',
        config: {
          name: '.NET: Launch',
          type: 'coreclr',
          request: 'launch',
          program: '${workspaceFolder}/bin/Debug/net8.0/MyApp.dll',
          args: [],
          cwd: '${workspaceFolder}',
          console: 'integratedTerminal',
          stopAtEntry: false,
        },
      },
      {
        name: '.NET Attach',
        description: 'Attach to a running .NET process',
        icon: '🔗',
        config: {
          name: '.NET: Attach',
          type: 'coreclr',
          request: 'attach',
          processId: '${command:pickProcess}',
        },
      },
    ],
  },
  {
    type: 'java',
    label: 'Java',
    icon: '☕',
    color: '#ED8B00',
    templates: [
      {
        name: 'Launch Current File',
        description: 'Launch the current Java file',
        icon: '▶️',
        config: {
          name: 'Java: Launch Current File',
          type: 'java',
          request: 'launch',
          mainClass: '${file}',
        },
      },
      {
        name: 'Attach to Process',
        description: 'Attach to a running JVM',
        icon: '🔗',
        config: {
          name: 'Java: Attach',
          type: 'java',
          request: 'attach',
          hostName: 'localhost',
          port: 5005,
        },
      },
    ],
  },
  {
    type: 'extensionHost',
    label: 'VS Code Extension',
    icon: '🧩',
    color: '#007ACC',
    templates: [
      {
        name: 'Run Extension',
        description: 'Launch the extension in development mode',
        icon: '▶️',
        config: {
          name: 'Run Extension',
          type: 'extensionHost',
          request: 'launch',
          args: ['--extensionDevelopmentPath=${workspaceFolder}'],
          outFiles: ['${workspaceFolder}/dist/**/*.js'],
        },
      },
    ],
  },
];

/** Get templates for a specific debug type */
export function getTemplatesForType(type: string): DebugTypeInfo | undefined {
  return DEBUG_TYPES.find((d) => d.type === type);
}

/** Get all available debug type identifiers */
export function getAllDebugTypes(): string[] {
  return DEBUG_TYPES.map((d) => d.type);
}
