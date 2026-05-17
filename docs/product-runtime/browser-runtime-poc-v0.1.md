# Browser Runtime POC v0.1

> Date: 2026-05-17
> Baseline: v0.4.7-result-items-rendering (6436e1f)
> Depends: ANL-030 (Ontology), ANL-031 (Asset Runtime), ANL-032 (Browser Runtime Analysis)
> Status: Implementation Complete

---

## 1. POC 目标

验证**第一个 Runtime capability 闭环**：

1. Browser action 能触发真实外部世界变化
2. Result 能进入 Workspace
3. Timeline 有 runtime feeling

不是建立 Browser Runtime 子系统。

---

## 2. 约束

| 约束 | 原因 |
|------|------|
| 不建 reactive subsystem (composable) | POC 验证 capability chain，不是 UI 层 |
| Browser Runtime 不依赖 RuntimeStore | 它是 capability executor，不是 orchestrator |
| 不走 AssetReference 正式流 | 停在 L1 placeholder，不进 Asset Runtime |
| 不修改 DEFAULT_ALLOWED_CAPABILITIES | browser capability 必须显式声明 |
| 不建 skill package | POC 用 internal test harness |
| 不修改 CSP | Rust reqwest 调 localhost，前端不直连 |
| health check 不写 Timeline | infra concern，不是 user narrative |
| 不暴露 browser/runtime 实现词汇 | Timeline narrative 必须用户化 |

---

## 3. 架构

```
Task Runtime (调用方)
  │
  ├─ "Opening page…"
  │   writeTimelineEvent({ type: 'execution.started', payload: { summary: 'Opening page…' } })
  │
  ├─ browserRuntime.openUrl(url)
  │   → invoke('browser_open_url')
  │   → Rust: reqwest POST localhost:18767/open
  │   → agent-browser-cli → Chrome 导航
  │
  ├─ "Reading page content…"
  │   writeTimelineEvent({ type: 'execution.started', payload: { summary: 'Reading page content…' } })
  │
  ├─ browserRuntime.scanText()
  │   → invoke('browser_scan_text')
  │   → Rust: reqwest GET localhost:18767/scan?text-only=true
  │   → 返回页面文本
  │
  ├─ "Page analysis completed"
  │   writeTimelineEvent({ type: 'execution.completed', payload: { summary: 'Page analysis completed' } })
  │
  └─ Result → RuntimeContext.execution.output → Workspace
```

**关键**：Browser Runtime 是纯能力层。Timeline 写入由调用方完成。

---

## 4. API

### 4.1 Rust Commands

| 命令 | 参数 | 返回 | agent-browser-cli 端点 |
|------|------|------|----------------------|
| `browser_open_url` | `{ url: string }` | `Result<(), String>` | POST /open |
| `browser_scan_text` | `{}` | `Result<String, String>` | GET /scan?text-only=true |
| `browser_screenshot` | `{ app: AppHandle }` | `Result<String, String>` | POST /exec (CDP screenshot) |

### 4.2 Frontend Service

```typescript
import { invoke } from '@tauri-apps/api/core'

export async function openUrl(url: string): Promise<void>
export async function scanText(): Promise<string>
export async function screenshot(): Promise<string>  // 返回 temp 文件路径
```

---

## 5. 数据流

### 5.1 openUrl

```
调用方 → openUrl(url)
  → invoke('browser_open_url', { url })
  → Rust: validate_url(url) → 校验 http/https
  → Rust: reqwest POST http://localhost:18767/open { url }
  → agent-browser-cli → Chrome tabs.create / navigation
  → 返回 Ok(())
```

### 5.2 scanText

```
调用方 → scanText()
  → invoke('browser_scan_text')
  → Rust: reqwest GET http://localhost:18767/scan?text-only=true
  → agent-browser-cli → 页面文本提取
  → 返回 Ok(text)
```

### 5.3 screenshot

```
调用方 → screenshot()
  → invoke('browser_screenshot')
  → Rust: reqwest POST http://localhost:18767/exec { cmd: "cdp", method: "Page.captureScreenshot" }
  → agent-browser-cli → CDP screenshot → base64
  → Rust: base64 decode → 写入 temp dir
  → 返回 Ok(temp_path)
```

---

## 6. Timeline Narrative

调用方在调用 browserRuntime 前后写入用户化叙事：

| 时机 | 叙事 |
|------|------|
| openUrl 前 | "Opening page…" |
| openUrl 后 | "Page opened" |
| scanText 前 | "Reading page content…" |
| scanText 后 | "Page analysis completed ({N} chars)" |
| screenshot 前 | "Capturing page snapshot…" |
| screenshot 后 | "Snapshot saved" |

禁止暴露：browser.scan complete / execution.completed / metadata.source / 任何实现词汇

---

## 7. 安全

| 机制 | 说明 |
|------|------|
| URL 校验 | Rust 侧只允许 http/https scheme |
| Cookie 不暴露 | browser.cookie.read 不在 POC 能力清单中 |
| 无 shell 权限 | Rust reqwest 直接调 HTTP API，不走 shell:allow-execute |
| 无 CSP 修改 | 前端不直连 localhost:18767 |

---

## 8. 文件清单

| 文件 | 操作 |
|------|------|
| `src-tauri/src/browser_runtime.rs` | 新建 |
| `src-tauri/src/lib.rs` | 修改（注册 3 个命令 + mod 声明） |
| `src/services/browserRuntime.ts` | 新建 |

---

## 9. 验收标准

| # | 验收项 | 标准 |
|---|--------|------|
| 1 | Browser action 触发真实变化 | openUrl 后浏览器真的导航到目标 URL |
| 2 | Result 进入 Workspace | scanText 返回文本，可通过 ResultItemProjection 显示 |
| 3 | Timeline 有 runtime feeling | Workspace 显示 "Opening page…" 等自然叙事 |

---

## 10. Known Limitations

| 限制 | 说明 |
|------|------|
| agent-browser-cli 必须运行 | Rust 命令依赖 localhost:18767 HTTP API，服务未启动则失败 |
| Chrome 必须打开 | agent-browser-cli 依赖 Chrome 扩展，无浏览器则无标签页 |
| 无用户确认弹窗 | POC 简化，通过 Capability Gate 保证安全 |
| 截图无精确尺寸 | 返回 temp path，不走 AssetReference（L0 metadata） |
| 无并发支持 | POC 单任务场景，多标签页协调待后续迭代 |

---

## 11. Build Status

| 检查项 | 结果 |
|--------|------|
| `npx vue-tsc --noEmit` | ✅ PASS (exit 0) |
| `npx vite build` | ✅ PASS (11.58s) |
| `cargo check` | ⚠️ Pre-existing environment issue |

**cargo check 说明**：

构建失败原因是 Tauri build script 在 `D:\Study2\hexclaw-desktop\` 路径下查找 plugin permissions，但项目实际位于 `D:\Study2\Mr.Krabs-desktop\`。这是**预先存在的环境路径问题**，与本次 Browser Runtime POC 改动无关。

错误信息：
```
failed to read plugin permissions: failed to read file
'\\?\D:\Study2\hexclaw-desktop\src-tauri\target\debug\build\tauri-566d2a277c5e73b0\out\permissions\app\autogenerated\commands\app_hide.toml'
: 系统找不到指定的路径。 (os error 3)
```

---

## 12. What NOT to Build

| 不构建 | 原因 |
|--------|------|
| useBrowserRuntime composable | POC 不建 reactive subsystem |
| browser.cookie.read | Runtime internal，不暴露 |
| browser.form.fill | P1 |
| browser.file.upload | P1 |
| browser.select.choose | P1 |
| browser.monitor.waitChange | P1 |
| @scan-page skill package | POC 用 internal test harness |
| AssetReference 正式流 | 停在 L1 placeholder |
| CSP 修改 | Rust reqwest 调 localhost |
| 新增 RuntimeEventType | 复用 execution.* |

---

## 13. Next Steps (Not in POC)

| 方向 | 说明 |
|------|------|
| AssetReference 正式流 | screenshot → createAssetReference → AssetCollection |
| composable 层 | useBrowserRuntime reactive state |
| 扩展 API | tabs / execJs / form.fill / upload / monitor |
| CSP 修改 | connect-src 添加 localhost:18767 |
| 用户确认弹窗 | open / upload / form 操作前确认 |
| Skill package | @scan-page 等正式 skill |
| 新增 RuntimeEventType | browser.page.opened / browser.page.scanned |

---

## Appendix: Analysis Artifacts

| Artifact | Path |
|----------|------|
| ANL-032 Analysis | `.workflow/scratch/analyze-browser-runtime-20260517/analysis.md` |
| ANL-032 Conclusions | `.workflow/scratch/analyze-browser-runtime-20260517/conclusions.json` |
| POC Plan | `.claude/plans/dreamy-splashing-emerson.md` |
| Baseline | v0.4.7-result-items-rendering (6436e1f) |
