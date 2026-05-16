<div align="center">

**English** | [中文](README.md)

# Mr.Krabs Desktop

**Enterprise-grade Secure Personal AI Agent Desktop Client**

[![CI](https://github.com/yunzaibo/Mr.Krabs-desktop/workflows/CI/badge.svg)](https://github.com/yunzaibo/Mr.Krabs-desktop/actions)
[![Release](https://img.shields.io/github/v/release/yunzaibo/Mr.Krabs-desktop?include_prereleases)](https://github.com/yunzaibo/Mr.Krabs-desktop/releases)
[![License](https://img.shields.io/github/license/yunzaibo/Mr.Krabs-desktop)](https://github.com/yunzaibo/Mr.Krabs-desktop/blob/main/LICENSE)
[![Downloads](https://img.shields.io/github/downloads/yunzaibo/Mr.Krabs-desktop/total)](https://github.com/yunzaibo/Mr.Krabs-desktop/releases)
[![Stars](https://img.shields.io/github/stars/yunzaibo/Mr.Krabs-desktop?style=social)](https://github.com/yunzaibo/Mr.Krabs-desktop)

**Built with**

[![Tauri](https://img.shields.io/badge/Tauri-v2-FFC131?logo=tauri\&logoColor=white)](https://v2.tauri.app)
[![Vue](https://img.shields.io/badge/Vue-3-4FC08D?logo=vuedotjs\&logoColor=white)](https://vuejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript\&logoColor=white)](https://www.typescriptlang.org)
[![Rust](https://img.shields.io/badge/Rust-2021-DEA584?logo=rust\&logoColor=white)](https://www.rust-lang.org)
[![Go](https://img.shields.io/badge/Go-1.25-00ADD8?logo=go\&logoColor=white)](https://go.dev)

Native on macOS / Windows / Linux · Sidecar architecture · Zero cloud dependency · Fully private data

</div>

***

<!-- TODO: Add app screenshots
<p align="center">
  <img src=".github/assets/screenshots/chat.png" alt="Chat interface" width="800" />
</p>
-->

## Features

| Feature | Description |
| ------- | ----------- |
| **AI Chat** | Multi-model support: OpenAI / DeepSeek / Anthropic / Gemini / Qwen / Ollama, streaming output, Markdown rendering, code highlighting, deep thinking |
| **Image/Video Generation** | Zhipu CogView-4 image generation + CogVideoX-2 video generation, unified text dialog entry (no standalone mode button), generated results saved to `{DataDir}/generated/` and referenced via `/api/v1/files/generated/...` URLs (never expire, won't bloat SQLite), inline preview in chat bubbles + persistent download button |
| **Local Models (Ollama)** | One-click detection/linking of local Ollama, auto-discover downloaded models, state machine management (detect → run → link), LM Studio/llama.cpp via OpenAI-compatible API |
| **Agent Orchestration** | Custom Agent roles/goals/backgrounds, multi-Agent collaboration (Handoff + Orchestrate + Spawn), Agent conference mode, role template library |
| **Autonomous Agents** | 3D budget guardrails (token/time/cost), code execution sandbox (macOS Seatbelt / Linux Namespace / Windows 5-layer isolation), Checkpoint long-task recovery |
| **Tool Approval** | Real-time WebSocket tool approval (ToolApprovalCard), safe/sensitive/dangerous risk classification, "Always Allow" memory |
| **Skill System** | Skill marketplace + custom skills + LLM-powered Skill creation (SkillWriter + security scan), Skill Chain invocation, dependency management, Tool registration & per-tool permissions |
| **MCP Protocol** | Model Context Protocol tool integration (stdio/SSE/Streamable HTTP), OAuth 2.0+PKCE authentication, command allowlist security validation, one-click install + persistence, tool annotation parsing |
| **Workflow Canvas** | Visual drag-and-drop Agent workflow orchestration, DAG execution engine |
| **Knowledge Base (RAG)** | Document upload/parsing/vector retrieval, supports PDF / Markdown / TXT formats; Auto-RAG auto-retrieves knowledge base and injects context (score >= 0.35) |
| **Memory System** | Long-term memory + short-term memory + semantic search, cross-session memory persistence, VectorMemory vector-based semantic recall |
| **Tool Intelligence** | Tool result caching (LRU+TTL), per-tool timeout + exponential backoff retry, tool execution metrics collection (JSONL), MCP structured logging + rotation |
| **Security Gateway** | Prompt injection detection / tool output sanitization (HTML/Unicode/LLM delimiters) / PII filtering / content filtering / RBAC access control / SSRF protection |
| **File Operations** | Agent can read/write/edit workspace files (ReadSkill/WriteSkill/EditSkill), path validation + symlink protection |
| **Scheduled Tasks** | Cron scheduling, periodic Agent task execution |
| **IM Channels** | Feishu / DingTalk / WeCom / WeChat / Slack / Discord / Telegram, remote AI conversations via IM |
| **Deep Research** | 4-stage autonomous research (search → analysis → synthesis → report), based on Hexagon Plan-and-Execute engine |
| **Document Parsing** | Upload PDF / Word / Excel / CSV directly in chat, auto-extract text as context |
| **Webhook Notifications** | WeCom / Feishu / DingTalk bot Webhook push, auto-notify on task completion |
| **ClawHub Skill Marketplace** | Browse, semantic search (TF-IDF), install community Skills/MCPs, automatic Hub dependency resolution |
| **First-run Wizard** | 3-step Welcome guide (Select Provider → Select Model → Test Connection), zero-config onboarding |
| **Real-time Logs** | WebSocket streaming logs, full Agent execution chain tracing |
| **Multi-language** | Chinese / English, vue-i18n internationalization |
| **System Tray** | Minimize to tray, tray menu quick actions |
| **Global Shortcut** | `⌘+Shift+H` to summon Quick Chat window anytime |
| **Auto Update** | Tauri Updater, in-app one-click upgrade |

## Ecosystem

| Role | Language |
| ---- | -------- |
| General Toolkit — Infrastructure library (logging/config/HTTP/concurrency/error chain) | Go |
| AI Capability Layer — LLM Provider/Embedding/Vector/Memory | Go |
| Full-stack AI Agent Framework — ReAct/Plan-and-Execute/Tool dispatch | Go |
| Mr.Krabs Backend — Sidecar service (RESTful API/RAG/Cron/Security Gateway) | Go |
| Skill Marketplace Data — Online skill catalog (`index.json` + Markdown skills) | Data Warehouse |
| **Mr.Krabs Desktop (this repo)** | **Rust + Vue 3** |
| Mr.Krabs Web — Web client (also serves as desktop UI rendering layer) | Vue 3 |
| Agent Observatory — Observability dashboard (tracing/replay/profiling) | Vue 3 |

## Architecture

```
Mr.Krabs.app
┌───────────────────────────────────────────────────────────────────┐
│  Tauri Shell (Rust)                                               │
│  Window Mgmt · System Tray · Native Menu · Global Shortcut ·     │
│  Single Instance · Auto Update                                     │
│  API Proxy (CORS bypass) · Sidecar Process Management             │
├───────────────────────────────────────────────────────────────────┤
│  Vue 3 Frontend (WebView)                                         │
│  ┌────────┬────────┬────────┬────────┬────────┬────────┬───────┐ │
│  │Overview│  Chat  │ Agents │Knowledge│Automation│Integration│Logs │ │
│  │        │        │        │Docs|Mem │Tasks|Canvas│Skills|MCP │   │ │
│  │        │        │        │        │        │IM|Diag │      │ │
│  └───┬────┴───┬────┴───┬────┴───┬────┴───┬────┴───┬────┴───────┘ │
│      │  Pinia Store    │  Vue Router      │  Tauri invoke (IPC)   │
├──────┴─────────────────┴──────────────────┴───────────────────────┤
│  Tauri Commands (Rust → Go)                                       │
│  check_engine_health · proxy_api_request · get_sidecar_status     │
│  backend_chat · stream_chat · restart_sidecar · get_platform_info │
├───────────────────────────────────────────────────────────────────┤
│  HTTP / WebSocket  ←→  localhost:16060                            │
├───────────────────────────────────────────────────────────────────┤
│  hexclaw serve (Go Sidecar)                                       │
│  Agent Engine · LLM Routing · RAG · MCP · CORS · Security · Cron │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  Hexagon Framework  ←  ai-core (LLM/Tool/Memory)          │   │
│  │                     ←  toolkit (Log/Config/HTTP/Concurrency)│   │
│  └────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────┘
```

Design pattern mirrors **Docker Desktop managing Docker Engine** — Tauri shell manages the Go Sidecar process.
Frontend and backend communicate via **Tauri IPC proxy** (bypassing WebView CORS restrictions), fully decoupled.

> Go Sidecar listens on `localhost:16060` by default, configurable via hexclaw config file.

## Claude Code Development SOP

This repository also serves as a **"build a production product with Claude Code"** workflow record. Off-hours × solo developer × 6 core repositories × 680K lines of code — the complete SOP behind it all, fully open-sourced.

Three main pillars:

| Pillar | Core Approach |
| ------ | ------------- |
| ✏️ **Design-Driven** | Plan mode → multi-option comparison → ADR decisions, no "one-line prompt + instant code" |
| ✅ **Test Loop** | No accepting "should pass" / "probably OK" — tests must pass, grep must find no remnants before it's done |
| 🤖 **Multi-Agent Collaboration** | Claude writes code / Codex reviews code / human makes decisions, cross-review eliminates single-model blind spots |

```bash
# Install the entire SOP into Claude Code in one go
mkdir -p ~/.claude/commands ~/.claude/data ~/.claude/skills ~/.claude/hooks
cp docs/claude-code-practices/command/*.md ~/.claude/commands/
cp docs/claude-code-practices/data/*.md ~/.claude/data/
cp -r docs/claude-code-practices/skill/devtestops ~/.claude/skills/
cp docs/claude-code-practices/hooks/*.sh ~/.claude/hooks/ && chmod +x ~/.claude/hooks/*.sh
```

## Tech Stack

| Layer | Technology | Version |
| ----- | ---------- | ------- |
| Desktop Framework | Tauri | v2 |
| Frontend Framework | Vue 3 (Composition API) | 3.5+ |
| Language | TypeScript | 5.9+ |
| State Management | Pinia | 3.x |
| UI Components | Naive UI + custom design system | - |
| Styling | Tailwind CSS | 4.x |
| Routing | Vue Router | 5.x |
| Internationalization | vue-i18n | 11.x |
| Icons | Lucide Vue | - |
| Markdown | markdown-it + Shiki (code highlighting) | - |
| Document Parsing | pdfjs-dist + mammoth + xlsx | - |
| Data Storage | SQLite (tauri-plugin-sql) + Tauri Store | - |
| HTTP Client | ofetch (frontend) / reqwest (Rust proxy) | - |
| Build Tool | Vite | 7.x |
| Testing | Vitest + @vue/test-utils | - |
| Lint | ESLint + oxlint + Prettier | - |
| Backend Sidecar | hexclaw serve (Go) | Go 1.25+ |
| Agent Framework | Hexagon | - |
| Rust Layer | Tauri Shell + plugin ecosystem | Rust 2021 edition |

## Installation

### One-Click Install (macOS)

```bash
curl -fsSL https://raw.githubusercontent.com/yunzaibo/Mr.Krabs-desktop/main/install.sh | bash
```

Auto-detects CPU architecture (Apple Silicon / Intel), downloads the latest version and installs to `/Applications`, no manual Gatekeeper handling needed.

### Homebrew (macOS)

```bash
brew tap hexagon-codes/tap
brew install --cask hexclaw
```

Upgrade later: `brew upgrade --cask hexclaw`

### GitHub Releases

Go to [Releases](https://github.com/yunzaibo/Mr.Krabs-desktop/releases) to download the installer for your platform:

| Platform | Format |
| -------- | ------ |
| macOS (Apple Silicon) | `.dmg` |
| macOS (Intel) | `.dmg` |
| Windows | `.msi` / `.exe` (NSIS) |
| Linux | `.deb` / `.AppImage` |

> **Note for macOS users**: `.dmg` files downloaded directly from a browser may be blocked by Gatekeeper. It's recommended to use the one-click install script or Homebrew above, which handle Gatekeeper automatically.
> If you've already downloaded manually, run `xattr -cr /Applications/Mr.Krabs.app` in Terminal to bypass the block.

### CI / Packaging / Release Flow

- `push / PR → CI`: Automatically runs lint, type-check, test, web build
- `Actions → Package → Run workflow`: Manually build platform-specific test installers, artifacts saved in workflow artifacts
- `git tag vX.Y.Z && git push origin vX.Y.Z → Release`: Build and publish official GitHub Release installers
- After official release, auto-updates [Homebrew Tap](https://github.com/hexagon-codes/homebrew-tap) (computes DMG SHA256 → pushes Cask update)

Prerequisites for official release:

- Version numbers in `package.json` and `src-tauri/tauri.conf.json` must match the tag
- Tauri updater public key `plugins.updater.pubkey` must be set in `src-tauri/tauri.conf.json`
- GitHub Actions secret `TAURI_SIGNING_PRIVATE_KEY` must be configured (optional, for Tauri auto-update signing)

> macOS artifacts are unsigned DMGs; users install via the `curl | bash` one-click script or Homebrew, which handle Gatekeeper automatically.

For detailed usage instructions, see the [User Guide](docs/guide.md) ([English Guide](docs/guide.en.md)).

## Development

### Prerequisites

| Tool | Version Requirement | Description |
| ---- | ------------------- | ----------- |
| Node.js | >= 20.19 or >= 22.12 | JavaScript runtime |
| pnpm | >= 9 | Package manager |
| Rust | stable (2021 edition) | Tauri compilation |
| Go | >= 1.25 | Sidecar compilation |

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/yunzaibo/Mr.Krabs-desktop.git
cd hexclaw-desktop

# 2. Install dependencies
make install
# Equivalent to: pnpm install && cd src-tauri && cargo fetch

# 3. Build Go sidecar (first time only, pulls remote GitHub hexclaw v0.4.0 by default)
make sidecar

# 4. Start development mode
make dev
```

### Make Commands

| Command | Description |
| ------- | ----------- |
| `make dev` | Development mode (Vite HMR + Tauri window) |
| `make build` | Production build |
| `make build-web` | Build frontend only |
| `make sidecar` | Build Go sidecar (current platform) |
| `make sidecar-all` | Cross-compile sidecar for all platforms |
| `make lint` | Lint (oxlint + ESLint) |
| `make lint-fix` | Lint with auto-fix |
| `make format` | Format code (Prettier) |
| `make type-check` | TypeScript type checking |
| `make test` | Run unit tests |
| `make clean` | Clean build artifacts |
| `make install` | Install all dependencies |

### Project Structure

```
hexclaw-desktop/
├── src/                          # Vue 3 frontend source
│   ├── api/                      # API clients (Tauri IPC + HTTP fallback)
│   │   ├── client.ts             # HTTP/WS/IPC base client
│   │   ├── chat.ts               # Chat API (WebSocket + HTTP fallback)
│   │   ├── agents.ts             # Agent management API
│   │   ├── skills.ts             # Skill + ClawHub marketplace API
│   │   ├── canvas.ts             # Workflow canvas API
│   │   ├── mcp.ts                # MCP protocol API
│   │   ├── knowledge.ts          # Knowledge base API
│   │   ├── memory.ts             # Memory system API
│   │   ├── tasks.ts              # Scheduled tasks API
│   │   ├── config.ts             # LLM config API (Tauri proxy)
│   │   ├── desktop.ts            # Desktop features API (notifications/clipboard)
│   │   ├── im-channels.ts        # IM channel API (Feishu/DingTalk/WeCom etc.)
│   │   ├── team.ts               # Team collaboration API
│   │   ├── voice.ts              # Voice API (TTS/STT)
│   │   ├── webhook.ts            # Webhook notification API
│   │   ├── websocket.ts          # Chat WebSocket client
│   │   ├── logs.ts               # Log API + WebSocket stream
│   │   ├── settings.ts           # Settings API
│   │   └── system.ts             # System info API
│   ├── components/               # Components
│   │   ├── layout/               # Layout (AppLayout/Sidebar/TitleBar/ContextBar/DetailPanel)
│   │   ├── chat/                 # Chat (ChatInput/SessionList/MarkdownRenderer/ToolApprovalCard/BudgetPanel/ToolCallBubble/AgentBadge etc.)
│   │   ├── settings/             # Settings components (OllamaCard local LLM management)
│   │   ├── agent/                # Agent (AgentCard/AgentForm/AgentStatus/AgentConference)
│   │   ├── agents/               # Multi-Agent collaboration (AgentConference)
│   │   ├── artifacts/            # Artifacts (ArtifactsPanel/ArtifactPreview/ArtifactCodeView/ArtifactDiffView)
│   │   ├── inspector/            # Right-side details (InspectorContext/ContextCard/KeyValueRow/TimelineItem)
│   │   ├── canvas/               # Canvas (TemplateGallery)
│   │   ├── settings/             # Settings (SettingsNotification/SettingsSecurity)
│   │   ├── logs/                 # Logs (LogEntry/LogFilter/LogStats)
│   │   └── common/               # Common (CommandPalette/ConfirmDialog/Toast/ErrorBoundary etc.)
│   ├── views/                    # Page views
│   │   ├── DashboardView.vue     # Dashboard (overview stats + recent activity)
│   │   ├── ChatView.vue          # AI Chat (sessions/attachments/Artifacts/model switch)
│   │   ├── AgentsView.vue        # Agent management (templates/running/rules/conference)
│   │   ├── KnowledgeCenterView.vue # Knowledge center (docs + memory tabs)
│   │   ├── KnowledgeView.vue     # Knowledge base (doc CRUD/upload/search)
│   │   ├── MemoryView.vue        # Memory management (edit/search/clear)
│   │   ├── AutomationView.vue    # Automation (tasks + canvas tabs)
│   │   ├── TasksView.vue         # Scheduled tasks (Cron management)
│   │   ├── CanvasView.vue        # Workflow canvas (DAG orchestration)
│   │   ├── IntegrationView.vue   # Integration (skills + MCP + IM + diagnostics tabs)
│   │   ├── SkillsView.vue        # Skill management + ClawHub marketplace
│   │   ├── McpView.vue           # MCP management (servers/tools/testing)
│   │   ├── IMChannelsView.vue    # IM channel management (Feishu/DingTalk/WeCom etc.)
│   │   ├── LogsView.vue          # Log viewer (real-time stream/filter/stats)
│   │   ├── SettingsView.vue      # Settings (LLM/security/notifications/Webhook/themes/language)
│   │   ├── AboutView.vue         # About (standalone window)
│   │   ├── QuickChatView.vue     # Quick Chat (standalone window)
│   │   └── WelcomeView.vue       # First-run wizard (Provider → Model → Test)
│   ├── stores/                   # Pinia state management (thin stores, business logic delegated to services/)
│   │   ├── app.ts                # Global state (connection/sidebar/detail panel)
│   │   ├── chat.ts               # Chat (sessions/messages/streaming/Artifacts, SQLite persistence)
│   │   ├── agents.ts             # Agent roles
│   │   ├── canvas.ts             # Canvas (nodes/edges/workflows/runs)
│   │   ├── logs.ts               # Logs (WebSocket stream/filter/stats)
│   │   └── settings.ts           # Settings (LLM + security + notifications, Tauri Store persistence)
│   ├── composables/              # Composition functions
│   │   ├── useHexclaw.ts         # hexclaw connection state + health check polling
│   │   ├── useWebSocket.ts       # WebSocket wrapper (auto-reconnect)
│   │   ├── useSSE.ts             # SSE streaming requests
│   │   ├── useShortcuts.ts       # In-app shortcuts (⌘1~7 page switching)
│   │   ├── useTheme.ts           # Theme (dark/light/follow system)
│   │   ├── useAutoStart.ts       # Auto-start on boot (Tauri autostart)
│   │   ├── useAutoUpdate.ts      # Auto update (Tauri updater)
│   │   ├── useValidation.ts      # Form validation
│   │   ├── useKeyboardNav.ts     # Keyboard navigation + focus trap
│   │   ├── usePlatform.ts        # Platform detection (macOS/Windows/Linux)
│   │   ├── useChatSend.ts        # Send messages + Auto-RAG knowledge base retrieval
│   │   ├── useChatActions.ts     # Chat actions (resend/edit/delete etc.)
│   │   └── useConversationAutomation.ts # Conversation automation (auto-title etc.)
│   ├── services/                 # Business logic service layer
│   │   ├── chatService.ts        # Chat service (WebSocket/HTTP send)
│   │   └── messageService.ts     # Message service (message construction/persistence)
│   ├── i18n/                     # Internationalization (Chinese/English)
│   ├── router/                   # Routing (dynamically generated from navigation.ts)
│   ├── types/                    # TypeScript type definitions
│   ├── utils/                    # Utility functions
│   │   └── file-parser.ts        # Document parser (PDF/Word/Excel/CSV)
│   ├── db/                       # Local database (SQLite: chat/artifacts/knowledge/templates/outbox)
│   ├── config/                   # Frontend configuration
│   │   ├── env.ts                # Environment config
│   │   ├── navigation.ts         # Navigation registry (3-tier grouping: core/integration/system)
│   │   └── providers.ts          # LLM Provider configuration
│   └── assets/                   # Static assets (Logo/icons/IM logos)
├── src-tauri/                    # Tauri (Rust) layer
│   ├── src/
│   │   ├── main.rs               # Entry point
│   │   ├── lib.rs                # App initialization & plugin registration
│   │   ├── commands.rs           # Tauri IPC commands (health check/API proxy/streaming chat)
│   │   ├── sidecar.rs            # Go Sidecar process management
│   │   ├── tray.rs               # System tray
│   │   ├── menu.rs               # macOS native menu
│   │   └── window.rs             # Window management & global shortcuts
│   ├── binaries/                 # Go sidecar binaries (build output)
│   ├── icons/                    # App icons
│   ├── capabilities/             # Tauri v2 permission config
│   ├── tauri.conf.json           # Tauri config
│   ├── build.rs                  # Rust build script
│   └── Cargo.toml                # Rust dependencies
├── docs/                         # Documentation
│   ├── guide.md                  # User guide (Chinese)
│   ├── guide.en.md               # User guide (English)
│   ├── updates.md                # Auto-update release notes (Chinese)
│   ├── updates.en.md             # Auto-update release notes (English)
│   ├── overview.md               # Product overview (Chinese)
│   ├── overview.en.md            # Product overview (English)
│   └── claude-code-practices/    # Claude Code Development SOP (4 handbooks + 7 commands + Hooks + DevTestOps Skill + templates)
├── homebrew/                     # Homebrew Cask definitions + update scripts
├── install.sh                    # macOS one-click install script
├── scripts/                      # CI/build scripts
├── .github/                      # GitHub CI/CD
├── Makefile                      # Dev commands
├── vite.config.ts                # Vite config
├── vitest.config.ts              # Vitest test config
├── eslint.config.ts              # ESLint config
├── tsconfig.json                 # TypeScript config
├── package.json                  # Node dependencies
├── LICENSE                       # Apache 2.0 License
└── README.md
```

## Build

### Production Build

```bash
# Full build (frontend + Tauri packaging)
make build

# Output locations:
#   macOS: src-tauri/target/release/bundle/macos/Mr.Krabs.app
#   DMG:   src-tauri/target/release/bundle/dmg/Mr.Krabs_*.dmg
```

### Platform-Specific Build

```bash
# macOS Intel
npx @tauri-apps/cli build --target x86_64-apple-darwin

# macOS Apple Silicon
npx @tauri-apps/cli build --target aarch64-apple-darwin
```

### Sidecar Cross-Compilation

```bash
# Build for all platforms
make sidecar-all

# Or build for a specific platform
make sidecar-darwin-arm64    # macOS Apple Silicon
make sidecar-darwin-amd64    # macOS Intel
make sidecar-linux-amd64     # Linux x86_64
make sidecar-windows-amd64   # Windows x86_64
```

Sidecar binaries are output to the `src-tauri/binaries/` directory and automatically embedded by Tauri during packaging. Real tag / commit / build time are injected at build time for backend version verification in the installed app.

## Testing

```bash
# Run unit tests
pnpm test:unit

# Or use Make
make test
```

Test file conventions:

- Test files are co-located with source files, named `*.test.ts` or `*.spec.ts`
- Store tests go in `src/stores/__tests__/`
- Uses Vitest + @vue/test-utils

## FAQ

### macOS says "cannot open" or "is damaged"

It's recommended to use the one-click install script or Homebrew (automatically handles Gatekeeper):

```bash
# Option 1: One-click install
curl -fsSL https://raw.githubusercontent.com/yunzaibo/Mr.Krabs-desktop/main/install.sh | bash

# Option 2: Homebrew
brew tap hexagon-codes/tap && brew install --cask hexclaw
```

If you've already downloaded the DMG manually, run in Terminal:

```bash
xattr -cr /Applications/Mr.Krabs.app
```

### Sidebar shows "Engine stopped" but the backend is running

1. Verify the hexclaw process is running: `ps aux | grep hexclaw`
2. Verify the port is listening: `curl http://localhost:16060/health`
3. If curl succeeds but the frontend still shows stopped, check if you're on an older app version (re-run `make build` and install the latest version)

### `make sidecar` build fails

1. Verify Go >= 1.23 is installed: `go version`
2. Verify GitHub access and remote source fetch: `git ls-remote --tags https://github.com/hexagon-codes/hexclaw.git v0.4.0`
3. Verify Rust toolchain is installed (for platform triple detection): `rustc -vV`

### White screen after `make dev`

Sidecar may not be compiled or there's a port conflict. Check:

1. Ensure you've run `make sidecar`
2. Verify port `16060` is not in use: `lsof -i :16060`

### hexclaw backend fails to start

1. Check error logs: `~/.hexclaw/hexclaw.log`
2. Run sidecar directly to see output: `./src-tauri/binaries/hexclaw-$(rustc -vV | grep host | awk '{print $2}') serve --desktop`
3. Even without an LLM API key configured, hexclaw should start normally (LLM features degraded, basic API still available)

## Contributing

### Workflow

1. Fork this repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit changes: `git commit -m "feat: add new feature"`
4. Push branch: `git push origin feat/your-feature`
5. Create a Pull Request

### Code Standards

- **Formatting**: `make format` (Prettier)
- **Linting**: `make lint` (ESLint + oxlint, checks only, no file modifications)
- **Type Checking**: `make type-check` (vue-tsc)

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new feature
fix: fix bug
docs: documentation update
style: code formatting
refactor: refactoring
test: add/modify tests
chore: build/toolchain
```


## License

[Apache License 2.0](LICENSE)
