# @lcken/session-sidebar-oc

Session sidebar plugin for OpenCode TUI. Displays a list of sessions in the sidebar with real-time status indicators.

## Features

- **Real-time status indicators**:
  - `?` (yellow) - Needs interaction (pending permission/question)
  - `●` (green) - Busy (task running)
  - `✓` (blue) - Completed (task finished, awaiting user acknowledgment)
  - `○` (gray) - Idle
- **Current session highlight** - Yellow background
- **Click to switch sessions**
- **Relative time display** - Shows `now`, `5m`, `2h`, `3d` etc.

## Screenshot

```
Sessions
 ● my-feature-dev        2m
 ? bugfix-session        5m   ← needs interaction
 ✓ completed-task        1h   ← just completed
 ○ old-session           3d
```

## Installation

### Quick Install (Recommended)

```bash
bunx @lcken/session-sidebar-oc install
```

This will automatically configure both TUI and server plugins.

### Manual Install

#### Via Bun

```bash
bun add @lcken/session-sidebar-oc
```

#### Via NPM

```bash
npm install @lcken/session-sidebar-oc
```

Then configure manually (see below).

## Configuration

Only needed if you installed manually.

### 1. TUI Plugin (`~/.config/opencode/tui.json`)

```json
{
  "plugins": {
    "session-sidebar": {
      "source": "node_modules/@lcken/session-sidebar-oc/dist/tui.js"
    }
  }
}
```

### 2. Server Plugin (`~/.config/opencode/opencode.json`)

```json
{
  "plugins": {
    "session-sidebar-events": {
      "source": "node_modules/@lcken/session-sidebar-oc/dist/index.js"
    }
  }
}
```

## Development

```bash
# Install dependencies
bun install

# Build
bun run build

# Development mode (watch)
bun run dev

# Type check
bun run typecheck
```

## How It Works

### TUI Plugin (`src/tui.tsx`)

- Renders session list in sidebar
- Subscribes to session events for real-time updates
- Tracks completed sessions (shows blue `✓` until clicked)

### Server Plugin (`src/index.ts`)

- Forwards session-related events to TUI
- Events tracked: `permission.asked`, `permission.replied`, `question.asked`, `question.replied`, `session.status`, `session.idle`

## API

### Status Priority

1. **Needs Interaction** - Permission or question pending
2. **Busy** - Task running
3. **Completed** - Task just finished
4. **Idle** - No activity

### Theme Colors

Uses OpenCode theme colors:
- `theme().warning` - Yellow (needs interaction)
- `theme().success` - Green (busy)
- `theme().info` - Blue (completed)
- `theme().textMuted` - Gray (idle)

## License

MIT
