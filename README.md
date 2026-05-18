<div align="center">

[English](README.en.md) | **中文**

# Mr.Krabs Desktop

**Local-first AI-native Runtime Workspace**

[![CI](https://github.com/yunzaibo/-Mr.Krabs-desktop-/workflows/CI/badge.svg)](https://github.com/yunzaibo/-Mr.Krabs-desktop-/actions)
[![Release](https://img.shields.io/github/v/release/yunzaibo/-Mr.Krabs-desktop-?include_prereleases)](https://github.com/yunzaibo/-Mr.Krabs-desktop-/releases)
[![License](https://img.shields.io/github/license/yunzaibo/-Mr.Krabs-desktop-)](https://github.com/yunzaibo/-Mr.Krabs-desktop-/blob/main/LICENSE)
[![Downloads](https://img.shields.io/github/downloads/yunzaibo/-Mr.Krabs-desktop-/total)](https://github.com/yunzaibo/-Mr.Krabs-desktop-/releases)
[![Stars](https://img.shields.io/github/stars/yunzaibo/-Mr.Krabs-desktop-?style=social)](https://github.com/yunzaibo/-Mr.Krabs-desktop-)

[![Tauri](https://img.shields.io/badge/Tauri-v2-FFC131?logo=tauri&logoColor=white)](https://v2.tauri.app)
[![Vue](https://img.shields.io/badge/Vue-3-4FC08D?logo=vuedotjs&logoColor=white)](https://vuejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typesqlang.org)
[![Rust](https://img.shields.io/badge/Rust-2021-DEA584?logo=rust&logoColor=white)](https://www.rust-lang.org)
[![Go](https://img.shields.io/badge/Go-1.25-00ADD8?logo=go&logoColor=white)](https://go.dev)

</div>

---

一个用自然语言驱动本地 AI Agent 持续运行的桌面工作空间。数据完全私有，零云端依赖，跨平台原生体验。

核心理念：**Chat 只是入口，Workspace 才是真正的工作空间**。用户用自然语言启动任务，系统在本地 Runtime 中持续运行，上下文、资产、执行状态跨会话持久化。

## 核心技术亮点

| 能力 | 技术方案 | 为什么这么设计 |
| --- | --- | --- |
| **Sidecar 架构** | Tauri (Rust) 壳 + Go 引擎进程，IPC 代理通信 | 隔离 WebView CORS 限制；Go 引擎可独立迭代和热重启；借鉴 Docker Desktop 管理 Engine 的成熟模式 |
| **多模型路由** | 统一 Provider 适配层，支持 OpenAI / Anthropic / Gemini / Ollama 等 6+ 后端 | 一套对话界面覆盖商业 API + 本地模型，用户无需关心底层差异 |
| **Agent 编排** | Handoff + Orchestrate + Spawn 三种协作模式，三维预算兜底 (token/时间/金额) | 复杂任务拆解为多 Agent 协作，预算机制防止失控消耗 |
| **Skill 系统** | skill.json + SKILL.md + references/ 标准化包结构，NL 触发 + @mention 双入口 | 可扩展的技能生态，社区贡献与自定义开发统一范式 |
| **安全网关** | Prompt 注入检测 / 工具输出清洗 / PII 过滤 / RBAC / SSRF 防护，五层防御 | Agent 可执行代码和调用工具，安全边界是生产可用的前提 |
| **MCP 协议** | Model Context Protocol 工具集成 (stdio/SSE/Streamable HTTP)，OAuth 2.0+PKCE | 对接 MCP 生态标准，同时保证认证安全 |
| **知识库 RAG** | 文档解析 → 向量检索 → Auto-RAG 自动注入上下文 | 让 Agent 基于用户私有知识回答，而非仅依赖模型训练数据 |
| **记忆系统** | 长期 + 短期记忆，语义搜索，跨会话持久化 | Agent 记住用户偏好和历史上下文，越用越懂你 |

## 架构

```
Mr.Krabs.app
┌───────────────────────────────────────────────────────────────────┐
│  Tauri Shell (Rust)                                               │
│  窗口管理 · 系统托盘 · 原生菜单 · 全局快捷键 · 单实例 · 自动更新  │
│  API 代理 (CORS bypass) · Sidecar 进程管理                        │
├───────────────────────────────────────────────────────────────────┤
│  Vue 3 前端 (WebView)                                             │
│  Pinia Store · Vue Router · Tauri IPC                             │
├───────────────────────────────────────────────────────────────────┤
│  Tauri Commands (Rust → Go)                                       │
│  API 代理 · 流式聊天 · Sidecar 生命周期 · 平台信息                │
├───────────────────────────────────────────────────────────────────┤
│  HTTP / WebSocket  ←→  localhost:16060                            │
├───────────────────────────────────────────────────────────────────┤
│  hexclaw serve (Go Sidecar)                                       │
│  Agent 引擎 · LLM 路由 · RAG · MCP · 安全网关 · Skill · Cron     │
└───────────────────────────────────────────────────────────────────┘
```

### 设计决策

**为什么选 Sidecar 而不是 FFI？**
Go 引擎涉及大量网络 I/O（LLM API 调用、MCP 通信），FFI 会阻塞 Rust 线程。Sidecar 进程天然隔离，可独立重启，崩溃不影响 Tauri 壳。Docker Desktop 验证了这个模式在桌面场景的可靠性。

**为什么 Rust + Go 而不是全 Rust？**
Tauri 生态天然绑定 Rust，用 Rust 处理窗口/托盘/IPC 最合适。Go 在并发网络编程和快速迭代上有优势，Agent 引擎用 Go 开发效率更高。两层通过 HTTP 解耦，各自独立部署和测试。

**为什么前端不用 Electron？**
Tauri 二进制约 5MB（Electron 约 150MB），内存占用低 3-5 倍。Rust 壳的启动速度和原生感是 Electron 无法比拟的。代价是 Rust 学习曲线，但 Tauri 插件生态已经覆盖了大部分桌面能力。

## 技术栈

| 层 | 技术 | 选型理由 |
| --- | --- | --- |
| 桌面框架 | Tauri v2 | 轻量、原生、安全，Rust 生态 |
| 前端 | Vue 3 + TypeScript + Pinia | 组合式 API 适合复杂状态管理 |
| UI | Naive UI + Tailwind CSS | 组件丰富 + 原子化样式 |
| Markdown | markdown-it + Shiki | 可扩展渲染 + 多语言代码高亮 |
| 后端 | Go Sidecar | 并发网络编程优势，快速迭代 |
| Rust 层 | Tauri Shell + 插件 | 窗口/托盘/IPC/自动更新 |
| 测试 | Vitest + @vue/test-utils | Vite 原生集成，速度快 |
| Lint | ESLint + oxlint + Prettier | 规则互补，oxlint 负责速度 |

## 技术挑战与解决方案

### 1. WebView CORS 绕过

**问题**：Tauri WebView 有跨域限制，前端无法直接调用 Go Sidecar 的 REST API。

**方案**：Rust 层实现 `proxy_api_request` 命令，所有 HTTP 请求经 Tauri IPC 代理转发。前端完全感知不到 CORS，代码零侵入。

### 2. 多 Agent 协作与预算控制

**问题**：多个 Agent 并行执行时，如何防止 token 消耗失控？

**方案**：三维预算系统（token / 时间 / 金额），在 Task 粒度设置上限。Agent 每次调用 LLM 前检查预算，超限自动终止并回滚。Checkpoint 机制支持长任务断点恢复。

### 3. Skill 安全沙箱

**问题**：用户导入的 Skill 可能包含恶意脚本，如何在功能性和安全性之间平衡？

**方案**：`skill_sandbox.rs` 实现 restricted/full 两种模式。restricted 模式清理环境变量、限制目录访问、强制超时；full 模式继承父进程环境（用于 trusted skill）。输出大小上限 1 MiB，防止内存爆炸。

### 4. 跨平台一致性

**问题**：macOS / Windows / Linux 的文件系统、权限模型、打包格式差异巨大。

**方案**：Tauri 抽象层处理平台差异；Go Sidecar 用交叉编译输出四个平台二进制；Homebrew/NSIS/AppImage 覆盖各平台分发；CI 自动化构建和发布。

## Claude Code 开发实战 SOP

这个仓库同时是"**用 AI 辅助工具做出一个能跑的产品**"的工作流实录。

| 主线 | 核心做法 |
| --- | --- |
| **设计驱动** | Plan 模式 → 多方案对比 → ADR 决策，不做"一句话 + 秒出代码" |
| **测试闭环** | 不接受 "should pass" / "probably OK"——测试跑过、grep 扫过残留才算完成 |
| **多 Agent 协作** | Claude 写代码 / Codex 审代码 / 人类决策，交叉审查消除单模型盲区 |

## 安装

### 一键安装 (macOS)

```bash
curl -fsSL https://raw.githubusercontent.com/yunzaibo/-Mr.Krabs-desktop-/main/install.sh | bash
```

### Homebrew (macOS)

```bash
brew tap hexagon-codes/tap
brew install --cask hexclaw
```

### GitHub Releases

前往 [Releases](https://github.com/yunzaibo/-Mr.Krabs-desktop-/releases) 下载对应平台安装包。

| 平台 | 格式 |
| --- | --- |
| macOS (Apple Silicon / Intel) | `.dmg` |
| Windows | `.msi` / `.exe` (NSIS) |
| Linux | `.deb` / `.AppImage` |

> macOS 用户如果遇到 Gatekeeper 拦截：`xattr -cr /Applications/HexClaw.app`

## 开发

### 前置要求

| 工具 | 版本 |
| --- | --- |
| Node.js | >= 20.19 或 >= 22.12 |
| pnpm | >= 9 |
| Rust | stable (2021 edition) |
| Go | >= 1.25 |

### 快速开始

```bash
git clone https://github.com/yunzaibo/-Mr.Krabs-desktop-.git
cd -Mr.Krabs-desktop-
make install
make sidecar    # 首次编译 Go sidecar
make dev        # 启动开发模式
```

### 常用命令

| 命令 | 说明 |
| --- | --- |
| `make dev` | 开发模式 (Vite HMR + Tauri) |
| `make build` | 生产构建 |
| `make sidecar` | 编译 Go sidecar |
| `make lint` | 代码检查 |
| `make test` | 运行测试 |
| `make type-check` | TypeScript 类型检查 |

## 贡献指南

1. Fork → 创建分支 `feat/xxx` → 提交 → PR
2. 代码规范：`make format` + `make lint`
3. Commit 遵循 [Conventional Commits](https://www.conventionalcommits.org/)

## License

[Apache License 2.0](LICENSE)
