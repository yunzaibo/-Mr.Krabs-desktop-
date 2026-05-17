# Workspace Information Architecture Spec v0.1

> Status: Frozen
> Date: 2026-05-17
> Baseline: v0.4.4-workspace-visual (bb3e7cf)
> Source: ANL-026 Workspace Information Architecture Analysis
> Author: Mr.Krabs Runtime Team

---

## 1. Workspace 核心定位

**Workspace = Task Workbench**

用户在这里管理 AI 执行的任务结果，不是观察 Runtime 内部运转。

| 定位 | 是 | 不是 |
|------|-----|------|
| Workspace | Task workbench — 查看结果、修改指令、复制输出 | Debug console — 观察 state machine、step count、layer status |
| Workspace | 结果导向 — Result 是最重要的 surface | 过程导向 — Execution 不是主角 |
| Workspace | 操作中心 — Action Bar 提供下一步 | 信息展示 — 不只是只读详情页 |

**设计原则**: 用户心智模型是"我让 AI 做了一件事，现在看结果"，不是"我让 Runtime 执行了一个 task，现在观察 context projection"。

---

## 2. Progressive Disclosure Philosophy

### 核心理念

**默认只显示用户心智需要的信息。Runtime internals 默认折叠。**

```
Layer 1: User Surface (默认可见)
  → goal, status, elapsed, result, action buttons
  → 这是终端用户关心的全部

Layer 2: Advanced (点击展开)
  → taskId, inputSummary, skillName, stage, stepCount
  → 开发者/高级用户需要的调试信息

Layer 3: Runtime Internals (永远不暴露)
  → RuntimeContext, RuntimeEvent, ContextLayer, LayerState
  → 这是 projector 的职责，UI 不知道这些概念
```

### Advanced Toggle 规范

- 所有 section 使用统一的 `Advanced` 折叠模式
- 默认折叠（`advancedExpanded = false`）
- 点击展开，状态持久化到 localStorage
- 折叠时显示一行摘要（如 `skill-name v1.2 — loaded`）
- 展开时显示完整字段列表

### 为什么不用 "Show More" / "Details"

"Advanced" 比 "Show More" 更准确——它暗示"这是给高级用户看的"，而非"这只是更多内容"。用户不会好奇地点击 "Advanced"，但会点击 "Show More"。

---

## 3. Section Hierarchy

```
┌─────────────────────────────────────────┐
│ Action Bar          ← 操作层 (always top) │
├─────────────────────────────────────────┤
│ Task               ← 运行状态层          │
│   status + elapsed + health pill        │
├─────────────────────────────────────────┤
│ Result (hero)      ← 主产出区 (primary)  │
│   primaryContent + items                │
├─────────────────────────────────────────┤
│ Skill (summary)    ← Advanced layer     │
│   skill-name v1.2 — loaded              │
├─────────────────────────────────────────┤
│ Progress (summary) ← Advanced layer     │
│   state + elapsed                       │
├─────────────────────────────────────────┤
│ Timeline           ← 叙事层 (独立面板)   │
└─────────────────────────────────────────┘
```

### 视觉权重排序

1. **Result** — hero 区域，最大 padding，accent border，用户第一眼看到
2. **Action Bar** — 三级按钮，"下一步"引导
3. **Task** — goal 作为卡片标题，status + elapsed 一目了然
4. **Skill / Progress** — 单行摘要，不占垂直空间
5. **Timeline** — 独立面板，叙事层，不与详情争夺注意力

---

## 4. Default Visible Fields

### Task Section

| 字段 | 来源 | 可见条件 |
|------|------|----------|
| goal | `projection.task.goal` | 始终（卡片标题） |
| status | `projection.task.status` | 始终（带颜色） |
| elapsed | `resultProjection.duration` | 始终 |
| progress | `projection.task.progress` | `!== undefined` 时 |
| errorCode + errorMessage | `projection.task.error.*` | `errorCode` 存在时 |
| health pill | `projection.health` | 嵌入 Task 卡片底部 |

### Result Section (hero)

| 字段 | 来源 | 可见条件 |
|------|------|----------|
| primaryContent | `resultProjection.primaryContent` | 始终展开（hero） |
| items | `resultProjection.items` | 始终展开 |

### Skill Section (摘要)

| 字段 | 来源 | 可见条件 |
|------|------|----------|
| `{skillId} v{version}` | `projection.skill.*` | 卡片标题 |
| status pill | `projection.skill.status` | 标题右侧 |

### Progress Section (摘要)

| 字段 | 来源 | 可见条件 |
|------|------|----------|
| state | `projection.execution.state` | 卡片标题（带颜色） |
| elapsed | `projection.execution.elapsed` | 标题下方 |

### Action Bar

| 按钮 | 样式 | 可见条件 |
|------|------|----------|
| Modify Instruction | filled primary | 始终 |
| Copy Result | outlined secondary | `hasResult` 时 |
| Back to Chat | ghost tertiary | `chatSessionId` 存在时 |

---

## 5. Advanced-only Fields

### Task Advanced

| 字段 | 来源 | 说明 |
|------|------|------|
| taskId | `projection.taskId` | 内部 ID，用户不需要 |
| skillName | `projection.task.skillName` | 与 Skill section 重复 |
| inputSummary | `projection.task.inputSummary` | JSON 截断，对用户无意义 |
| outputSummary | `projection.task.outputSummary` | 与 Result 重复 |

### Skill Advanced

| 字段 | 来源 | 说明 |
|------|------|------|
| loadedSections.markdown | `projection.skill.loadedSections` | 开发者信息 |
| loadedSections.references | `projection.skill.loadedSections` | 开发者信息 |
| status detail | `projection.skill.status` | 已在摘要 pill 显示 |
| SKILL.md content | `projection.skill.markdown` | 可选展开查看 |

### Progress Advanced

| 字段 | 来源 | 说明 |
|------|------|------|
| stage | `projection.execution.stage` | Runtime ontology |
| stepCount | `projection.execution.stepCount` | Runtime ontology |
| outputContent | `projection.execution.outputContent` | 与 Result primaryContent 重复 |

### Health Advanced

| 字段 | 来源 | 说明 |
|------|------|------|
| hasIssues | `projection.health.hasIssues` | 已在 pill 颜色体现 |
| severity | `projection.health.severity` | 仅 hasIssues 时展开 |

---

## 6. User-facing Terminology Rules

| Runtime Term | User Term | Context |
|-------------|-----------|---------|
| Execution | Progress | Section eyebrow |
| Health | Status | Section eyebrow (when embedded) |
| state: running | 运行中 / Working... | Status display |
| state: failed | 出错了 / Something went wrong | Status display |
| severity: critical | 出错了 / Something went wrong | Health pill |
| noIssues | 一切正常 / All good | Health pill |
| hasIssues | 有问题 / Has issues | Health pill |
| stage: executing | （不显示） | Advanced only |
| stepCount | （不显示） | Advanced only |
| layerStatus | （不显示） | 永远不暴露 |

### 规则

1. **不用 Runtime ontology 命名 section** — "Execution" → "Progress"
2. **不用 DevOps 语言** — "Critical" → "Something went wrong"
3. **不用内部 ID** — taskId 不在默认视图显示
4. **不用 JSON 截断** — inputSummary/outputSummary 不在默认视图显示
5. **不用技术指标** — stage/stepCount/mimeType 不在默认视图显示

---

## 7. Forbidden Debug Leakage Examples

### ❌ 不允许

```
┌─ Task: abc-123 ────────────────┐
│ 任务 ID: task-2026-05-17-abc   │  ← 用户不需要
│ 输入: {"goal":"summarize","lang":"zh"} │  ← JSON 噪音
│ 输出: 文章总结完成，共提取...    │  ← 与 Result 重复
└────────────────────────────────┘

┌─ Execution ────────────────────┐
│ 阶段: executing                │  ← Runtime ontology
│ 步骤数: 3                      │  ← 用户不关心
│ 输出: (折叠)                    │  ← 与 Result 重复
└────────────────────────────────┘

┌─ Health ───────────────────────┐
│ 严重度: critical               │  ← DevOps 语言
│ 异常: Yes                      │  ← 废话
└────────────────────────────────┘
```

### ✅ 应该

```
┌─ Task: 完成文章总结 ───────────┐
│ 状态: 运行中 ●                  │
│ 耗时: 12s                      │
│ 一切正常                       │  ← 嵌入 health pill
└────────────────────────────────┘

┌─ Progress ─────────────────────┐
│ 运行中                         │  ← state 作为标题
└────────────────────────────────┘

┌─ Result (hero) ────────────────┐
│ 本文主要讨论了...               │  ← primaryContent
│ [Markdown 完整渲染]             │
└────────────────────────────────┘
```

---

## 8. Deferred-to-Phase3 Boundaries

以下能力**必须** deferred 到 Phase 3，因为需要 Runtime 状态机：

| 能力 | 原因 | 当前替代 |
|------|------|----------|
| Dynamic Action Bar 位置 | 需要 runtime state transition | 固定顶部 |
| Pause / Cancel / Retry | 需要 Runtime mutation API | 无 |
| Real re-run | 需要 Runtime task replay | 导航到 Chat |
| Real-time progress | 需要 event subscription | 静态 snapshot |
| Runtime health monitoring | 需要 RecoveryLayer expansion | 静态 hasIssues |
| Execution state machine | 需要 lifecycle transitions | 静态 state 展示 |

### 判断标准

**可以做 (P1)**: 纯 UI 层变更，不涉及 store/projector/DTO/状态机
**必须 Deferred**: 需要 Runtime store mutation、新 API、事件订阅、状态机

---

## 9. Workspace vs Chat Boundary

| 维度 | Chat | Workspace |
|------|------|-----------|
| **定位** | 任务创建入口 + 轻量预览 | 任务详情 + 操作中心 |
| **用户心智** | "告诉 AI 做什么" | "管理 AI 做的结果" |
| **信息密度** | 低（消息流 + TaskCard） | 高（详情 + 操作） |
| **操作** | 发送消息 | Modify / Copy / Back |
| **数据源** | ChatMessage.content | RuntimeContext projection |
| **Result** | 轻量预览（ResultSurface） | 完整渲染（MarkdownRenderer） |
| **状态** | 消息级（streaming dots） | 任务级（status + timeline） |

### 数据流

```
Chat (创建)                    Workspace (管理)
    │                              │
    ├─ @skill 触发                 ├─ 读取 RuntimeContext projection
    ├─ TaskCard 摘要               ├─ 读取 TaskResultProjection
    ├─ ResultSurface 预览          ├─ MarkdownRenderer 完整渲染
    └─ 路由跳转 ──────────────────→└─ Action Bar 操作
```

### 边界规则

1. **Chat 不展示 Workspace 级详情** — Chat 只有 TaskCard 摘要
2. **Workspace 不展示 Chat 消息流** — Workspace 只有 Timeline 事件
3. **Result 两条路径** — Chat 用 ResultSurface（轻量），Workspace 用 MarkdownRenderer（完整）
4. **Action Bar 只在 Workspace** — Chat 不提供 Modify/Copy 操作

---

## 10. Why This Is AI-Native Runtime (Not Chat + Workflow)

### 传统模式: Chat + Workflow

```
用户 → Chat → Workflow Editor → Runtime → 结果
                 ↑
            用户需要理解 workflow 概念
```

**问题**: 用户需要理解 "workflow"、"node"、"edge"、"step" 等概念。这是工具导向的。

### AI-native 模式: Chat + Workspace

```
用户 → Chat (自然语言) → Runtime → Workspace (结果 + 操作)
                    ↑                    ↑
              用户说人话           用户看结果、改指令
```

**关键差异**:

1. **没有 Workflow Editor** — 用户不编排步骤，只说目标
2. **没有 Node/Edge 概念** — Runtime 内部状态对用户透明
3. **Workspace 不是 Dashboard** — 不展示 "系统健康"、"吞吐量"、"延迟"
4. **Workspace 是 Task Workbench** — 展示 "你让 AI 做的事做完了，这是结果"
5. **Progressive Disclosure** — 用户看到 goal + result，Runtime internals 折叠到 Advanced
6. **操作导向** — Action Bar 引导 "下一步做什么"，而非 "观察系统状态"

### 与传统 Runtime Dashboard 的区别

| 维度 | Traditional Dashboard | AI-native Workspace |
|------|----------------------|---------------------|
| 目标 | 监控系统健康 | 管理任务结果 |
| 用户 | DevOps / SRE | 终端用户 |
| 信息 | metrics, logs, traces | goal, status, result |
| 操作 | pause, cancel, retry | modify, copy, back |
| 术语 | critical, warning, severity | 出错了, 有问题, 一切正常 |
| 布局 | 多面板 dashboard | 三面板 workbench |

---

## Appendix: Version History

| Version | Date | Change |
|---------|------|--------|
| v0.1 | 2026-05-17 | Initial spec freeze from ANL-026 |
