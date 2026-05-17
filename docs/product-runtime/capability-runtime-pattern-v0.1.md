# Capability Runtime Pattern v0.1

> Date: 2026-05-17
> Baseline: v0.4.8-browser-runtime-poc
> Analysis: ANL-033
> Depends: ANL-030 (Ontology), ANL-031 (Asset Runtime), ANL-032 (Browser Runtime), POC v0.1
> Status: Frozen

---

## 1. Standard Capability Execution Flow

```
Task Runtime
  │
  ├─ 1. 声明意图（Timeline narrative）
  │     "Opening page…"
  │     "Generating image…"
  │
  ├─ 2. 调用 Capability Adapter
  │     browserRuntime.openUrl(url)
  │     providerRuntime.generate(prompt)
  │
  ├─ 3. 接收 Raw Response
  │     string / bytes / path / error
  │
  ├─ 4. 转换为 Runtime 产物
  │     Result（文本）/ Asset（文件）/ Timeline Event（状态转换）
  │
  └─ 5. Workspace Projection
        ResultItemProjection → ContextDetailPanel
```

### 1.1 各层职责

| 层 | 职责 | 不做 |
|----|------|------|
| **Task Runtime** | 声明意图、调用 adapter、转换产物、写 Timeline、投影 UI | 不执行底层操作 |
| **Capability Adapter** | 执行底层操作、返回 raw result | 不写 Timeline、不写 Store、不创建 projection |
| **Raw Response** | 无结构的执行结果 | 不包含 UI schema |
| **Task Runtime Transform** | 将 raw response 转为 Result/Asset/Timeline Event | 不执行底层操作 |
| **Workspace Projection** | 将 Runtime 产物投影为 UI DTO | 不直接操作底层 |

### 1.2 数据流方向

```
Task Runtime → Capability Adapter: 调用
Capability Adapter → Task Runtime: 返回 raw result
Task Runtime → TimelineStore: 写入事件
Task Runtime → RuntimeContext: 更新 output/asset
Workspace Projector → UI: 投影为 DTO
```

**单向数据流**。Capability Adapter 永远不反向调用 Task Runtime / TimelineStore / Workspace。

---

## 2. Capability Boundary Rules

### 2.1 Invariant（冻结）

| # | Rule | 原因 |
|---|------|------|
| 1 | **不直接写 Timeline** | Timeline 是 Task Runtime 的叙事层，Capability 只返回 raw result |
| 2 | **不直接写 RuntimeStore** | RuntimeStore 是 sole mutation authority，Capability 是 executor |
| 3 | **不直接创建 projection** | Projection 是 Workspace 层的职责 |
| 4 | **不暴露 internals** | Cookie / CDP / WebSocket / 实现细节永远不泄露 |
| 5 | **不直接控制 UI** | UI 渲染由 Workspace Projection 负责 |
| 6 | **不依赖 Task Runtime** | Adapter 是纯函数，无反向依赖 |
| 7 | **不做策略决策** | 批量/频率/自动化是 Task Runtime 层的决策 |

### 2.2 违反检测

如果一个 Capability Adapter 出现以下信号，说明正在越界：

- ❌ `import` 了 `stores/runtime`
- ❌ 调用了 `writeTimelineEvent`
- ❌ 创建了 `AssetReference`
- ❌ 返回了 `ResultItemProjection`
- ❌ 包含 UI 相关逻辑（modal / toast / confirm）
- ❌ 包含业务策略逻辑（retry / rate limit / batching）

---

## 3. Capability Adapter Pattern

### 3.1 统一接口

```typescript
/**
 * Capability Adapter — 统一接口
 *
 * 所有 adapter 遵循相同模式：
 * - input: 结构化参数
 * - output: raw result（string / bytes / path / error）
 * - timeout: 超时控制
 * - error: 错误返回
 * - safety: 安全校验
 */
interface CapabilityAdapter<TInput, TOutput> {
  /** 执行操作，返回 raw result */
  execute(input: TInput): Promise<TOutput>

  /** 超时（ms） */
  timeout: number

  /** 安全校验（在 execute 前调用） */
  validate?(input: TInput): Result<void, string>
}
```

### 3.2 已有 Adapter 实例

| Adapter | Input | Output | Timeout | 安全校验 |
|---------|-------|--------|---------|---------|
| `browserRuntime` | `{ url: string }` | `void` (open) / `string` (scan) / `string` (screenshot path) | 30s | URL scheme |
| `providerRuntime` | `{ prompt: string }` | `string` (generated text) | 120s | — |
| `uploadRuntime` | `{ filePath: string }` | `void` | 30s | file existence |

### 3.3 Adapter 内部结构

```
Adapter/
  ├─ validate(input)     // 安全校验（可选）
  ├─ execute(input)      // 核心执行
  │   ├─ 调用底层 API（HTTP / CLI / CDP）
  │   ├─ 处理响应
  │   └─ 返回 raw result
  └─ timeout             // 超时配置
```

**不包含**：
- Timeline 写入
- Store mutation
- Projection 创建
- UI 交互
- 业务策略

---

## 4. Runtime Narrative Responsibility

### 4.1 职责冻结

| 层 | 负责 Narrative | 不负责 |
|----|:---:|:---:|
| **Task Runtime** | ✅ "Opening page…" / "Generating image…" | 执行底层操作 |
| **Capability Adapter** | ❌ 只返回 raw result | 叙事 wording |
| **Workspace Projection** | ❌ 只投影已有事件 | 叙事 wording |

### 4.2 Narrative 示例

```typescript
// Task Runtime 负责 narrative
async function executeBrowserTask(url: string) {
  // 1. 声明意图
  writeTimelineEvent({
    type: 'execution.started',
    payload: { summary: 'Opening page…' },
  })

  // 2. 调用 adapter（无 narrative）
  await browserRuntime.openUrl(url)

  // 3. 声明下一阶段
  writeTimelineEvent({
    type: 'execution.started',
    payload: { summary: 'Reading page content…' },
  })

  // 4. 调用 adapter
  const text = await browserRuntime.scanText()

  // 5. 声明完成
  writeTimelineEvent({
    type: 'execution.completed',
    payload: { summary: `Page analysis completed (${text.length} chars)` },
  })
}
```

### 4.3 Narrative 风格规则

| 规则 | 说明 |
|------|------|
| 用户化措辞 | "Opening page…" 不是 "browser.open() executed" |
| 进行时态 | "Reading…" / "Capturing…" / "Generating…" |
| 不暴露实现 | 禁止 "CDP screenshot" / "reqwest POST" / "localhost:18767" |
| 完成态措辞 | "completed" / "saved" / "done" |

---

## 5. Result / Asset / Timeline 分层

### 5.1 分层定义

| 产物 | Capability Runtime 返回 | Task Runtime 转换 | Workspace 投影 |
|------|------------------------|------------------|----------------|
| **Result** | raw text / JSON | `RuntimeContext.execution.output` | `ResultItemProjection` |
| **Asset** | file path | `AssetReference` → `RuntimeContext.resources.asset` | L0/L1 placeholder |
| **Timeline Event** | 不负责 | `writeTimelineEvent()` | `TimelineItemProjection` |

### 5.2 转换规则

```
Capability 返回           Task Runtime 转换              Workspace 投影
─────────────────        ─────────────────              ──────────────
string (文本)      →     execution.output          →    ResultItemProjection
string (文件路径)   →     createAssetReference()    →    L0 metadata / L1 placeholder
error              →     execution.error + Timeline →    error display
void               →     Timeline Event only       →    timeline entry
```

### 5.3 禁止

- Capability Runtime 不得直接产生 `ResultItemProjection`
- Capability Runtime 不得直接产生 `TimelineItemProjection`
- Capability Runtime 不得直接操作 `RuntimeContext`

---

## 6. Future Runtime Matrix

### 6.1 预测 Capability

| Capability | 类型 | 产物 | 耗时 | 复杂度 |
|------------|------|------|------|--------|
| **Browser** | Result-producing | text / screenshot path | 中 | 中 |
| **Upload** | Asset-producing | file path | 短 | 低 |
| **Provider** (LLM) | Result-producing | text | 长 | 中 |
| **Asset** (file ops) | Asset-producing | file path | 短 | 低 |
| **Tool** (exec) | Result-producing | text / bytes | 动态 | 高 |
| **Knowledge** (RAG) | Result-producing | text | 中 | 高 |
| **OCR** | Result-producing | text | 中 | 中 |

### 6.2 分类维度

| 维度 | 说明 |
|------|------|
| **Result-producing** | 主要产出文本 → execution.output → ResultItemProjection |
| **Asset-producing** | 主要产出文件 → AssetReference → L0/L1 placeholder |
| **Timeline-heavy** | 产生多个状态转换事件（如 workflow step） |
| **Long-running** | 耗时 > 10s，需要中间状态更新（如 LLM streaming） |

### 6.3 Adapter 统一性

所有 capability 遵循相同的 adapter pattern：
- 验证输入
- 执行底层操作
- 返回 raw result
- 不写 Timeline / Store / Projection

差异仅在：
- input/output 类型
- timeout 配置
- 安全校验规则
- 底层 API 调用方式

---

## 7. Anti-patterns

### 7.1 绝对禁止

| Anti-pattern | 检测信号 | 后果 |
|--------------|---------|------|
| **Capability owns store** | adapter import RuntimeStore | 架构倒置 |
| **Capability owns timeline** | adapter 调用 writeTimelineEvent | 职责越界 |
| **Capability owns UI** | adapter 包含 modal/toast/confirm | 关注点混合 |
| **Capability owns projection** | adapter 返回 ResultItemProjection | 层级穿透 |
| **Capability becomes workflow engine** | adapter 包含 retry/rate limit/batching | 策略泄漏 |
| **Capability becomes autonomous agent** | adapter 包含自主决策逻辑 | 失控风险 |

### 7.2 边界守护

```
Task Runtime
  │
  ├─ ✅ 调用 adapter
  ├─ ✅ 写 Timeline
  ├─ ✅ 转换产物
  └─ ✅ 投影 UI

Capability Adapter
  ├─ ✅ 执行底层操作
  ├─ ✅ 返回 raw result
  ├─ ❌ 不写 Timeline
  ├─ ❌ 不写 Store
  ├─ ❌ 不创建 Projection
  └─ ❌ 不控制 UI
```

---

## 8. Capability Runtime Contract v0.1

### 8.1 Lifecycle

```
注册 → 验证 → 执行 → 返回 → 清理
 │      │      │      │      │
 │      │      │      │      └─ 资源释放（temp files / connections）
 │      │      │      └─ raw result 返回给 Task Runtime
 │      │      └─ 调用底层 API
 │      └─ validate(input) 安全校验
 └─ adapter 在系统启动时注册
```

### 8.2 Boundaries

| 维度 | Invariant |
|------|-----------|
| 写入 | 不写 Timeline / Store / Projection |
| 读取 | 不读 RuntimeContext（除非传入参数） |
| 依赖 | 不依赖 Task Runtime / Workspace / UI |
| 暴露 | 不暴露 internals（Cookie / CDP / 实现细节） |
| 控制 | 不控制 UI（modal / toast / navigate） |
| 策略 | 不做策略决策（retry / rate limit / batching） |

### 8.3 Responsibilities

| 职责 | 说明 |
|------|------|
| 验证输入 | 安全校验（URL scheme / file existence / 权限） |
| 执行操作 | 调用底层 API（HTTP / CLI / CDP / FFI） |
| 处理错误 | 超时 / 失败 → 返回 error，不 UI 交互 |
| 返回结果 | raw result（string / bytes / path / void） |

### 8.4 Execution Flow

```
Task Runtime 调用 adapter.execute(input)
  │
  ├─ adapter.validate(input) → 失败则返回 error
  │
  ├─ adapter.execute(input)
  │   ├─ 调用底层 API
  │   ├─ 处理响应
  │   └─ 返回 raw result
  │
  └─ Task Runtime 接收 raw result
      ├─ 转换为 Result / Asset / Timeline Event
      ├─ 写入 RuntimeContext
      └─ Workspace Projection 渲染
```

### 8.5 Safety

| 机制 | 说明 |
|------|------|
| 输入校验 | adapter.validate() 在 execute 前检查 |
| 超时控制 | adapter.timeout 限制执行时间 |
| 错误隔离 | adapter 错误不扩散到 Task Runtime |
| 内部不暴露 | Cookie / CDP / 实现细节封装在 adapter 内部 |

### 8.6 Anti-patterns（冻结）

见第 7 节。违反任何一条 = Architecture drift，需要正式 ADR 审查。

---

## 9. 不变性声明

本 spec 定义的边界是 **Architecture-level invariant**：

1. **Capability Adapter 是纯 executor**：只执行、只返回、不写入
2. **Task Runtime 是 orchestrator**：声明意图、调用 adapter、转换产物、写 Timeline
3. **单向数据流**：Task Runtime → Adapter → Task Runtime → Timeline → Workspace
4. **Narrative 归 Task Runtime**：Capability 不负责用户化措辞
5. **产物分层转换**：raw result → Runtime 产物 → UI DTO，逐层转换
6. **Anti-pattern 冻结**：禁止 capability owns store/timeline/UI/projection

违反任何一条 = Architecture drift，需要正式 ADR 审查。

---

## Appendix: Analysis Artifacts

| Artifact | Path |
|----------|------|
| Analysis | `.workflow/scratch/analyze-capability-runtime-20260517/analysis.md` |
| Conclusions | `.workflow/scratch/analyze-capability-runtime-20260517/conclusions.json` |
| Depends | ANL-030, ANL-031, ANL-032, POC v0.1 |
| Baseline | v0.4.8-browser-runtime-poc |
