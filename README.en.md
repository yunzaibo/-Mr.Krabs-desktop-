<div align="center">

**English** | [中文](README.md)

# Mr.Krabs Desktop

**Local-first AI-native Runtime Workspace**

[![CI](https://github.com/yunzaibo/-Mr.Krabs-desktop-/workflows/CI/badge.svg)](https://github.com/yunzaibo/-Mr.Krabs-desktop-/actions)
[![Release](https://img.shields.io/github/v/release/yunzaibo/-Mr.Krabs-desktop-?include_prereleases)](https://github.com/yunzaibo/-Mr.Krabs-desktop-/releases)
[![License](https://img.shields.io/github/license/yunzaibo/-Mr.Krabs-desktop-)](https://github.com/yunzaibo/-Mr.Krabs-desktop-/blob/main/LICENSE)
[![Downloads](https://img.shields.io/github/downloads/yunzaibo/-Mr.Krabs-desktop-/total)](https://github.com/yunzaibo/-Mr.Krabs-desktop-/releases)
[![Stars](https://img.shields.io/github/stars/yunzaibo/-Mr.Krabs-desktop-?style=social)](https://github.com/yunzaibo/-Mr.Krabs-desktop-)

[![Tauri](https://img.shields.io/badge/Tauri-v2-FFC131?logo=tauri&logoColor=white)](https://v2.tauri.app)
[![Vue](https://img.shields.io/badge/Vue-3-4FC08D?logo=vuedotjs&logoColor=white)](https://vuejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Rust](https://img.shields.io/badge/Rust-2021-DEA584?logo=rust&logoColor=white)](https://www.rust-lang.org)
[![Go](https://img.shields.io/badge/Go-1.25-00ADD8?logo=go&logoColor=white)](https://go.dev)

</div>

---

A desktop workspace where AI Agents run persistently via natural language. Fully private, zero cloud dependency, native cross-platform experience.

## What Problem Are We Solving

The current AI Agent ecosystem has a fundamental gap: **there is no real Runtime OS**.

- Chat UIs are just Q&A windows — they cannot carry the running state of real tasks
- Agents lack runtime observability — users have no idea what's executing, what's being reasoned, what tool results look like
- Context windows are fundamentally limited, but tasks and data are unbounded
- Long-term memory is prone to distortion, forgetting, and context eviction
- Workflow/BPMN systems become over-engineered, complex, and fragile
- Cloud-based agents raise data security and privacy concerns

**Mr.Krabs Desktop is not a chatbot, not a Workflow Builder — it is a Local-first AI Runtime Workspace.**

Users start tasks with natural language. The system runs persistently in a local Runtime. Context, assets, and execution state survive across sessions. All data stays under user control.

## Key Technical Capabilities

| Capability | Technical Approach | Why This Design |
| --- | --- | --- |
| **Sidecar Architecture** | Tauri (Rust) shell + Go engine, IPC proxy communication | Isolates WebView CORS limits; Go engine iterates and hot-restarts independently; proven pattern (Docker Desktop) |
| **Multi-Model Routing** | Unified Provider adapter for OpenAI / Anthropic / Gemini / Ollama and 6+ backends | Single chat UI covers commercial APIs + local models, zero vendor lock-in |
| **Agent Orchestration** | Handoff + Orchestrate + Spawn collaboration, 3D budget guardrails (token/time/cost) | Decompose complex tasks across agents; budget prevents runaway token consumption |
| **Skill System** | skill.json + SKILL.md + references/ package standard, NL trigger + @mention dual entry | Extensible skill ecosystem, community contributions and custom dev unified |
| **Security Gateway** | Prompt injection detection / tool output sanitization / PII filtering / RBAC / SSRF protection, 5-layer defense | Agents execute code and call tools; security boundary is a prerequisite for production use |
| **MCP Protocol** | Model Context Protocol tool integration (stdio/SSE/Streamable HTTP), OAuth 2.0+PKCE | Aligns with MCP ecosystem standard while ensuring auth security |
| **Knowledge Base RAG** | Document parsing → vector retrieval → Auto-RAG context injection | Let agents answer from user's private knowledge, not just training data |
| **Memory System** | Long-term + short-term memory, semantic search, cross-session persistence | Agents remember user preferences and history, improving over time |
| **Multimodal Generation** | Unified ChatInput routes to gpt-image-2 (image) / video-gen 2.0 by model capability; results stored locally with URL references | Single chat UI covers text, image, and video generation; generated assets persist in local Runtime, no cloud storage dependency |
| **Runtime Live Status** | TaskStatusIndicator pulse indicator + elapsed timer, Vue reactivity driven, CSS-only animations | Running tasks at a glance, 20+ concurrent tasks without frame drops |
| **Recovery Action UI** | RecoveryActionPanel retry/reset actions, confirmation dialog, isExecuting state lock | Failed tasks recoverable with one click, action loop without leaving Workspace |

## Engineering Challenges

### Context Explosion

LLM context windows are fundamentally limited, while user tasks are unbounded. Naive truncation or summary compression causes memory loss, task drift, hallucination, and unstable long-running agents.

Mr.Krabs explores:

| Strategy | Implementation |
| --- | --- |
| **Layered Memory** | Working memory (current task state) + short-term memory (conversation history) + long-term memory (persistent storage), managed by lifecycle |
| **RAG Retrieval** | Don't stuff everything into the window — retrieve relevant content from local vector store on demand |
| **Summary Compression** | Summarize conversation history, preserve key information, discard details |
| **Local-first Persistence** | State stored locally, no cloud dependency, survives across sessions |

### Cost Control

AI APIs charge per token. Multi-agent parallelism can cause costs to spiral.

Mr.Krabs approaches this with:

- **3D Budget System** (token / time / cost): per-Task limits, checked before every LLM call, auto-terminate + rollback on exceed
- **Checkpoint Mechanism**: long-task resume without re-computation
- **Local Inference**: Ollama and other local models for zero API cost

### Reliability & Fault Tolerance

LLM outputs are non-deterministic — the same question may yield different answers, wrong formats, or hallucinations. Building deterministic systems on top of non-deterministic components is the core engineering challenge of AI applications.

Mr.Krabs addresses this with:

- **Security Gateway**: 5-layer defense (prompt injection detection / tool output sanitization / PII filtering / RBAC / SSRF protection)
- **Agent Budget Guardrails**: prevent runaway agent consumption
- **Skill Sandbox**: `skill_sandbox.rs` restricted mode cleans env vars, limits directory access, enforces timeouts
- **Deterministic Engineering**: prefer rules and validation over hoping the model "guesses right"

### Runtime Observability

Most AI agents are black boxes — users cannot observe execution state, intermediate reasoning, tool calls, or asset lifecycles.

Mr.Krabs redesigns the interaction model:

```
Traditional:   Chat → Answer
Mr.Krabs:      Chat → Task → Runtime → Workspace
```

Each Task runs persistently in the Runtime. Execution state, intermediate results, and tool calls are fully observable.

### Skill Engineering

Most AI workflow systems eventually degrade into BPMN-like node orchestration platforms — visually complex, hard to maintain, and unnatural for conversational interaction.

Mr.Krabs believes skills should be:

- **Lightweight**: a folder + `SKILL.md` + optional runtime assets
- **Markdown-first**: define behavior in natural language, not drag-and-drop nodes
- **Portable**: standardized `skill.json` package structure, shareable across community
- **Runtime-oriented**: skills execute inside the Runtime, not as static configuration

## Design Philosophy

- **Chat is only the entry point** — the Runtime is where real work happens
- **Runtime is the real product** — not a Q&A window, but a persistent task engine
- **Explicit mutation over implicit magic** — state changes must be explicit, observable, auditable
- **Local-first over cloud dependency** — all data and state under user control
- **Skills over workflows** — lightweight, portable, Markdown-first, not node orchestration
- **Runtime visibility over black-box automation** — execution state fully observable
- **Deterministic engineering over prompt gambling** — rules and validation, not hoping the model "guesses right"
- **Simplicity over complexity** — if a simple solution works, don't introduce complex abstractions

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
│  Pinia Store · Vue Router · Tauri IPC                             │
├───────────────────────────────────────────────────────────────────┤
│  Tauri Commands (Rust → Go)                                       │
│  API Proxy · Streaming Chat · Sidecar Lifecycle · Platform Info   │
├───────────────────────────────────────────────────────────────────┤
│  HTTP / WebSocket  ←→  localhost:16060                            │
├───────────────────────────────────────────────────────────────────┤
│  hexclaw serve (Go Sidecar)                                       │
│  Agent Engine · LLM Routing · RAG · MCP · Security · Skill · Cron│
└───────────────────────────────────────────────────────────────────┘
```

### Design Decisions

**Why Sidecar instead of FFI?**
Go engine does heavy network I/O (LLM API calls, MCP communication). FFI would block Rust threads. Sidecar processes are naturally isolated, independently restartable, and crashes don't bring down the Tauri shell. Docker Desktop validated this pattern for desktop.

**Why Rust + Go instead of pure Rust?**
Tauri naturally pairs with Rust for window/tray/IPC. Go excels at concurrent networking and rapid iteration — ideal for the Agent engine. The two layers decouple via HTTP, each independently deployable and testable.

**Why not Electron?**
Tauri binary is ~5MB vs Electron's ~150MB, with 3-5x lower memory usage. Rust shell startup speed and native feel are unmatched. The tradeoff is Rust learning curve, but Tauri's plugin ecosystem covers most desktop capabilities.

## Tech Stack

| Layer | Technology | Rationale |
| --- | --- | --- |
| Desktop Framework | Tauri v2 | Lightweight, native, secure, Rust ecosystem |
| Frontend | Vue 3 + TypeScript + Pinia | Composition API for complex state management |
| UI | Naive UI + Tailwind CSS | Rich components + atomic styling |
| Markdown | markdown-it + Shiki | Extensible rendering + multi-language code highlighting |
| Backend | Go Sidecar | Concurrent networking advantage, rapid iteration |
| Rust Layer | Tauri Shell + plugins | Window/tray/IPC/auto-update |
| Testing | Vitest + @vue/test-utils | Vite-native integration, fast |
| Lint | ESLint + oxlint + Prettier | Complementary rules, oxlint for speed |

## Technical Challenges & Solutions

### 1. WebView CORS Bypass

**Problem**: Tauri WebView has cross-origin restrictions — frontend cannot call Go Sidecar's REST API directly.

**Solution**: Rust layer implements `proxy_api_request` command. All HTTP requests are proxied through Tauri IPC. Frontend is completely CORS-unaware, zero code intrusion.

### 2. Multi-Agent Collaboration & Budget Control

**Problem**: How to prevent token consumption from spiraling when multiple agents run in parallel?

**Solution**: 3D budget system (token / time / amount) with per-Task limits. Each agent checks budget before every LLM call; exceeds limit → auto-terminate + rollback. Checkpoint mechanism enables long-task resume.

### 3. Skill Security Sandbox

**Problem**: User-imported skills may contain malicious scripts. How to balance functionality and security?

**Solution**: `skill_sandbox.rs` implements restricted/full modes. Restricted mode cleans env vars, limits directory access, enforces timeouts. Output capped at 1 MiB to prevent memory exhaustion.

### 4. Cross-Platform Consistency

**Problem**: macOS / Windows / Linux have vastly different filesystems, permission models, and packaging formats.

**Solution**: Tauri abstraction layer handles platform differences. Go Sidecar cross-compiled to four platform binaries. Homebrew/NSIS/AppImage cover all distribution channels. CI automates build and release.

## Claude Code Development SOP

This repo is also a working log of **"building a shippable product with AI-assisted development."**

| Track | Core Practice |
| --- | --- |
| **Design-Driven** | Plan mode → multi-option comparison → ADR decisions, no "one-line-prompt-then-code" |
| **Test Loop** | No "should pass" / "probably OK" — tests pass, grep scans for residue, then it's done |
| **Multi-Agent Collab** | Claude codes / Codex reviews / Human decides — cross-review eliminates single-model blind spots |

## Runtime Architecture

```
Cloud Control Plane
├── License
├── Skill Registry
├── Analytics
└── API Gateway

Local Runtime Plane
├── Chat Workspace          ← Natural language entry
├── Task Runtime            ← Task execution engine
├── Skill Runtime           ← Skill sandbox execution
├── Context Runtime         ← Context management & RAG
├── Memory Runtime          ← Layered memory system
├── Asset Runtime           ← Asset generation & persistence
├── Browser Runtime         ← Browser automation
└── Security Gateway        ← 5-layer security defense
```

## Current Research Areas

Ongoing engineering directions this project explores:

- Context Engineering
- Long-term Memory Systems
- Runtime Observability
- Local-first AI Architecture
- Capability Runtime
- Skill Packaging Protocol
- Runtime Persistence & Recovery
- Browser Automation Runtime
- AI-native Workspace Interaction

## This Project Is NOT

- Not a chatbot wrapper
- Not a low-code workflow builder
- Not a BPMN orchestration system
- Not an AutoGPT clone
- Not a prompt collection tool

This project explores:

> **AI-native Runtime Systems** — building reliable deterministic systems on top of LLM non-determinism.

## Installation

### One-Click Install (macOS)

```bash
curl -fsSL https://raw.githubusercontent.com/yunzaibo/-Mr.Krabs-desktop-/main/install.sh | bash
```

### Homebrew (macOS)

```bash
brew tap hexagon-codes/tap
brew install --cask hexclaw
```

### GitHub Releases

Download platform installers from [Releases](https://github.com/yunzaibo/-Mr.Krabs-desktop-/releases).

| Platform | Format |
| --- | --- |
| macOS (Apple Silicon / Intel) | `.dmg` |
| Windows | `.msi` / `.exe` (NSIS) |
| Linux | `.deb` / `.AppImage` |

> macOS Gatekeeper block: `xattr -cr /Applications/HexClaw.app`

## Development

### Prerequisites

| Tool | Version |
| --- | --- |
| Node.js | >= 20.19 or >= 22.12 |
| pnpm | >= 9 |
| Rust | stable (2021 edition) |
| Go | >= 1.25 |

### Quick Start

```bash
git clone https://github.com/yunzaibo/-Mr.Krabs-desktop-.git
cd -Mr.Krabs-desktop-
make install
make sidecar    # Build Go sidecar (first time)
make dev        # Start dev mode
```

### Common Commands

| Command | Description |
| --- | --- |
| `make dev` | Dev mode (Vite HMR + Tauri) |
| `make build` | Production build |
| `make sidecar` | Build Go sidecar |
| `make lint` | Lint |
| `make test` | Run tests |
| `make type-check` | TypeScript type check |

## Contributing

1. Fork → branch `feat/xxx` → commit → PR
2. Code style: `make format` + `make lint`
3. Follow [Conventional Commits](https://www.conventionalcommits.org/)

## License

[Apache License 2.0](LICENSE)
