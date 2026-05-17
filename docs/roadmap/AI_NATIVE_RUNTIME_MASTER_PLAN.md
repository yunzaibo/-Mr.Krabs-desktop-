# HexClaw / Mr.Krabs AI-native Runtime 后续总计划

> 建议存放路径：`docs/roadmap/AI_NATIVE_RUNTIME_MASTER_PLAN.md`  
> 适用阶段：Chat Task Card P0 已完成并通过 Review 后  
> 开发方式：文档驱动 → 模块拆解 → 单模块执行 → Review → UAT → Freeze/Tag

---

## 0. 当前状态基线

当前项目已经完成的关键基线：

| 类别 | 状态 | 说明 |
|---|---|---|
| Runtime Constitution | 已完成 | ADR / Runtime Authority / Projection Purity / Skill Registry Boundary 已初步冻结 |
| Skill Runtime Pipeline | 已完成 | `@mention` → SkillRegistry → SkillLoader → RuntimeLLMExecutor 链路已建立 |
| SPE Archetype | 已完成 | summarize / bulletize 验证了 single-pass extraction 技能模板 |
| Runtime-native P0 | 已完成 | `type='skill'` 语义路由已修正 |
| Chat-Task Bridge | 已完成 | Chat 中已能显示 TaskBadge / TaskCard 方向 |
| Chat Task Card P0 | 已完成 | running placeholder → completed/failed 原地更新，Review PASS |
| 项目 Skill | 已完成 | `.claude/skills/project-hexclaw-runtime/` 已建立，用于新会话恢复与约束管理 |

当前进入阶段：

```txt
从 Runtime Kernel Stabilization
转向 Runtime Product Surface / Runtime Presence
```

---

## 1. 总体产品目标

最终目标不是做：

- Chatbot
- Prompt 工具箱
- Workflow Builder
- BPMN / 节点编排平台
- OpenClaw 换皮
- Multi-agent Playground

而是：

```txt
Local-first AI-native Runtime Workspace

Chat → Task → Runtime → Workspace
```

用户体验目标：

```txt
用户不是“问 AI 一个问题”
而是“启动了一个真实运行中的 Runtime Task”
```

---

## 2. 后续阶段总览

| Phase | 名称 | 目标 | 状态 | 优先级 |
|---|---|---|---|---|
| Phase 1 | Runtime Presence Layer | 让用户在 Chat 中感知任务正在运行 | Next | P0.5 |
| Phase 2 | Result Surface | Skill 结果从文本回复升级为结果卡片 | Planned | P1 |
| Phase 3 | Workspace Task Detail | Workspace 成为完整任务详情页 | Planned | P1 |
| Phase 4 | Runtime LLM Contract | 提取 MODE / prompt contract | Planned | P1 |
| Phase 5 | execMode Convergence | 收敛 WS / Runtime 双路径 | Planned | P1/P2 |
| Phase 6 | Asset Runtime Surface | 文件/图片/浏览器产物进入资产面板 | Deferred | P2 |
| Phase 7 | Capability Runtime Productization | capability 从技术字段变成用户可理解权限/能力 | Deferred | P2 |
| Phase 8 | Browser Runtime | 浏览器自动化接入 Runtime Task | Deferred | P3 |
| Phase 9 | Skill Studio / Skill Authoring | 用 AI 辅助创建 skill，但不做低代码编排 | Deferred | P3 |
| Phase 10 | Cloud Control Plane | 远程 registry / 更新 / analytics / license | Future | P4 |

---

# Phase 1: Runtime Presence Layer

## 目标

让 Chat 页面明显从“消息回复”变成“任务运行体验”。

当前 TaskCard 已出现，但下一步要强化：

```txt
Task queued
→ Runtime initializing
→ Skill loaded
→ Context prepared
→ Executing
→ Result projected
→ Completed
```

## 推荐文档路径

```txt
docs/refactor/modules/module-007-runtime-presence-layer.md
```

## 主要改动

| 模块 | 目标 |
|---|---|
| TaskCard.vue | 增加更清晰的运行阶段表现 |
| taskCard.ts | 扩展轻量状态字段，不引入完整 timeline |
| skillBridge.ts | 注入 lastEvent / previewEvents |
| chat-send-controller.ts | 普通 runtime task 也可显示轻量任务感 |

## 严格禁止

- 不展示完整 Timeline
- 不把 RuntimeStore 状态塞进 ChatStore
- 不做 mini Workspace
- 不做 workflow graph
- 不做 agent reasoning 展示

## 验收标准

| 验收项 | 标准 |
|---|---|
| 普通 chat | 不出现多余 task 噪声 |
| @summarize | 立即出现 Task Running |
| @bulletize | 立即出现 Task Running |
| 完成后 | Task Completed + result preview |
| 点击 | 能进入 Workspace task |
| UI 语义 | 不出现 “AI thinking / assistant working” |

## 建议 tag

```txt
runtime-presence-v0.1
```

---

# Phase 2: Result Surface

## 目标

把 Skill 执行结果从普通文本回复升级为“结果卡片”。

当前问题：

```txt
结果仍然像 assistant message
```

目标：

```txt
summarize → Summary Result Card
bulletize → Bullet Result Card
future image/browser/upload → Asset/Session Result Card
```

## 推荐文档路径

```txt
docs/refactor/modules/module-008-result-surface.md
```

## 主要改动

| 文件 | 目标 |
|---|---|
| `src/components/chat/SkillResultCard.vue` | 新增/增强结果卡片 |
| `src/components/chat/TaskCard.vue` | 嵌入 result surface preview |
| `src/views/ChatView.vue` | 条件渲染 Result Surface |
| `src/types/resultSurface.ts` | 定义轻量 ResultProjection 类型 |

## 边界

P1 可做：

- text result card
- summary card
- bullet card
- copy result
- open workspace

P1 禁止：

- image asset gallery
- browser session replay
- full file preview
- result repair loop
- validator engine

## 验收标准

| 验收项 | 标准 |
|---|---|
| summarize | 显示结构化 Summary Card |
| bulletize | 显示 Bullet Card |
| 普通 chat | 仍是普通消息 |
| TaskCard | 结果预览来自 result projection |
| Workspace | 完整结果仍在 Workspace 查看 |

## 建议 tag

```txt
result-surface-v0.1
```

---

# Phase 3: Workspace Task Detail

## 目标

Workspace 从“已有数据面板”升级为“完整任务详情页”。

它应该承载完整：

```txt
Task / Context / Skill / Execution / Timeline / Result / Assets
```

## 推荐文档路径

```txt
docs/refactor/modules/module-009-workspace-task-detail.md
```

## 主要改动

| 文件 | 目标 |
|---|---|
| `ContextDetailPanel.vue` | 展示 skill/context/execution/result |
| `TimelinePanel.vue` | 显示完整 timeline |
| `TaskListPanel.vue` | 更清晰 task 状态 |
| `useWorkspace.ts` | 只通过 projection 暴露数据 |

## 严格禁止

- Workspace 直接修改 RuntimeContext
- 绕过 projection 直接读 RuntimeStore
- 在 Chat 内复制完整 Workspace

## 验收标准

| 验收项 | 标准 |
|---|---|
| 从 TaskCard 跳转 | Workspace 自动定位 task |
| Skill section | 可查看 skill name/version/summary |
| Execution section | 可查看 stage/steps/status |
| Timeline | 展示完整任务事件 |
| Result | 展示完整输出 |

## 建议 tag

```txt
workspace-task-detail-v0.1
```

---

# Phase 4: Runtime LLM Contract

## 目标

把 `agentAdapter.ts` 中的 MODE / systemPrompt / skill prompt assembly 提取成独立 contract。

## 推荐文档路径

```txt
docs/refactor/modules/module-010-runtime-llm-contract.md
```

## 主要改动

| 文件 | 目标 |
|---|---|
| `src/services/llmContract.ts` | 新增 Runtime LLM Contract |
| `src/services/agentAdapter.ts` | 调用 contract helper |

## 原则

这不是 prompt tuning，而是 contract formalization。

## 严格禁止

- 不修改 SKILL.md
- 不修改 providerAdapter
- 不改 RuntimeStore
- 不新增 validator / repair loop

## 验收标准

| 验收项 | 标准 |
|---|---|
| normal chat | systemPrompt 仍 undefined |
| skill task | 有 MODE:DIRECT |
| buildPromptInput | 行为等价 |
| tsc | 通过 |

## 建议 tag

```txt
runtime-llm-contract-v0.1
```

---

# Phase 5: execMode Convergence

## 目标

收敛 WebSocket / Runtime 双路径漂移。

当前问题：

```txt
WS path 与 Runtime path 并存
execMode toggle 产品语义不清晰
```

## 推荐文档路径

```txt
docs/refactor/modules/module-011-execmode-convergence.md
```

## 主要改动

| 文件 | 目标 |
|---|---|
| `chat-send-controller.ts` | 收敛执行路径 |
| `settings.ts` | 移除或隐藏 execMode toggle |
| `chatService.ts` | 标记 legacy/deprecated |

## 风险

高于前几个模块。影响所有 chat 发送路径。

## 建议策略

先做分析，不直接执行：

```txt
analyze → plan → execute
```

## 验收标准

| 验收项 | 标准 |
|---|---|
| 普通 chat | 走 Runtime path |
| skill task | 正常 |
| TaskCard | 正常 |
| systemPrompt | 正常 |
| streaming | 明确保留/延后策略 |

## 建议 tag

```txt
execmode-convergence-v0.1
```

---

# Phase 6: Asset Runtime Surface

## 目标

让 Runtime Task 能产出、展示、管理资产。

## 推荐文档路径

```txt
docs/refactor/modules/module-012-asset-runtime-surface.md
```

## 适用未来能力

- 图片生成
- 文件处理
- 浏览器截图
- 上传任务
- 批量处理

## P2 可做

- Asset list
- 文件名/大小/mime/type
- open location
- copy path

## 禁止

- 不做复杂资产管理系统
- 不做云同步
- 不做素材市场

## 建议 tag

```txt
asset-runtime-surface-v0.1
```

---

# Phase 7: Capability Runtime Productization

## 目标

把 capability 从内部字段变成用户可理解的权限/能力提示。

## 推荐文档路径

```txt
docs/refactor/modules/module-013-capability-runtime-productization.md
```

## 示例

```txt
This task may use:
- LLM
- Filesystem Read
- Browser
```

## 禁止

- 不接 license/entitlement
- 不做 marketplace 权限体系
- 不做复杂权限中心

## 建议 tag

```txt
capability-runtime-product-v0.1
```

---

# Phase 8: Browser Runtime

## 目标

浏览器自动化作为 Runtime Task，而不是外挂脚本。

## 推荐文档路径

```txt
docs/refactor/modules/module-014-browser-runtime.md
```

## 原则

```txt
Browser action = Runtime Task step
Browser session = Runtime Asset / Execution Context
```

## 必须前置

- Result Surface
- Asset Runtime Surface
- Capability Runtime Productization

## 禁止

- 不做营销外挂
- 不做刷量/规避风控自动化
- 不做隐蔽操作

## 建议 tag

```txt
browser-runtime-alpha
```

---

# Phase 9: Skill Studio / Skill Authoring

## 目标

让用户/开发者通过 Markdown + files 创建 skill。

## 推荐文档路径

```txt
docs/refactor/modules/module-015-skill-studio.md
```

## 设计原则

Skill 不是：

- workflow
- node graph
- plugin marketplace
- prompt list

Skill 是：

```txt
Experience Package
= SKILL.md + metadata + references + optional scripts/templates
```

## P3 可做

- Skill preview
- SKILL.md editor
- local custom skill validation
- official/custom visible separation

## 禁止

- 不做低代码编排
- 不做 DAG 编辑器
- 不做流程节点

## 建议 tag

```txt
skill-studio-alpha
```

---

# Phase 10: Cloud Control Plane

## 目标

远期云控：更新、分发、配置、统计。

## 推荐文档路径

```txt
docs/refactor/modules/module-016-cloud-control-plane.md
```

## 远期能力

- Skill update manifest
- Official skill registry
- License / entitlement
- Analytics
- API gateway config

## 当前状态

Deferred。

## 禁止

- 当前阶段不接复杂账号系统
- 当前阶段不做 marketplace
- 当前阶段不做云端强依赖

---

## 3. 推荐执行顺序

```txt
Step 1: Module 001 Skill Directory Alignment
Step 2: Module 002 Chat-Task Bridge / TaskCard Tauri UAT
Step 3: Module 007 Runtime Presence Layer
Step 4: Module 008 Result Surface
Step 5: Module 009 Workspace Task Detail
Step 6: Module 010 Runtime LLM Contract
Step 7: Module 011 execMode Convergence
Step 8: Module 012 Asset Runtime Surface
```

当前最优先：

```txt
Module 001 → Module 002 → Module 007
```

不要跳过 Module 001，因为当前真实 skill path 仍依赖目录对齐。

---

## 4. 每个模块固定执行流程

每个 module 必须走完整闭环：

```txt
1. 读取 docs/PROJECT_INDEX.md
2. 读取 docs/system/*
3. 读取目标 module 文档
4. maestro-plan
5. 人工确认 plan
6. maestro-execute
7. quality-review / codex review
8. Tauri Desktop UAT（如涉及 UI / Runtime）
9. 更新 module 文档
10. 更新 MODULE_STATUS.md
11. commit + tag
```

---

## 5. 禁止跨模块合并执行

禁止一次性执行：

- Result Surface + Workspace Detail
- LLM Contract + execMode Convergence
- Asset Runtime + Browser Runtime
- Skill Studio + Marketplace

原因：

```txt
这些模块分别触及 UI / Runtime / Transport / Skill / Asset 边界，
混在一起会导致 architecture drift。
```

---

## 6. 当前立即下一步

建议从：

```txt
Module 001: Skill Directory Alignment
```

开始。

原因：

- 0 行代码改动
- 解锁真实 `@summarize/@bulletize`
- 让 TaskCard / TaskBadge 真正变成 Runtime skill 入口
- 是后续 Runtime Presence 的前置条件

执行前读取：

```txt
docs/refactor/modules/module-001-skill-directory-alignment.md
docs/current/skill-directory-contract.md
docs/system/MODULE_STATUS.md
```

---

## 7. 推荐提交策略

每个模块一个 commit + tag：

| Module | Commit message | Tag |
|---|---|---|
| Module 001 | `fix: align skill directory with registry contract` | `skill-directory-alignment-p0` |
| Module 002 | `test: validate chat task bridge in desktop runtime` | `chat-task-bridge-uat-p0` |
| Module 007 | `feat: add runtime presence layer to chat task cards` | `runtime-presence-v0.1` |
| Module 008 | `feat: add skill result surface cards` | `result-surface-v0.1` |
| Module 009 | `feat: enhance workspace task detail projection` | `workspace-task-detail-v0.1` |
| Module 010 | `refactor: extract runtime llm contract` | `runtime-llm-contract-v0.1` |

---

## 8. 总原则

```txt
Chat 不消失，但 Chat 不再只是消息流。
Skill 不扩张，但 Skill 必须进入 Runtime。
Workspace 不替代 Chat，但 Workspace 承载完整任务详情。
Runtime 不理解业务，但 Runtime 管理任务生命周期。
UI 不显示内部实现，但 UI 必须让用户感知任务正在运行。
```

