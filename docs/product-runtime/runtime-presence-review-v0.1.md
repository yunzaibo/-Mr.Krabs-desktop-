# Runtime Presence Review v0.1

> ANL-022 — 产品感知层分析

**日期**: 2026-05-16
**作者**: ANL-022 Runtime Presence Review
**状态**: Final

---

## 1. 背景

在完成 Chat Task Card P0、Result Surface P1、Workspace Task Detail P1 三个模块后，项目第一次形成了 Chat → Task → Workspace 闭环。

但架构正确 ≠ 体验正确。技术上我们已经做到了：
- Task-first 数据模型
- Projection boundary
- Result Surface
- Workspace 三面板
- Timeline narrative

但用户是否真的感觉自己在使用 Runtime，还是只是在用一个更漂亮的 AI 聊天机器人？

这就是 ANL-022 要回答的问题。

---

## 2. 核心发现

### 2.1 用户感知评估

| 维度 | 当前状态 | 目标状态 | 差距 |
|------|----------|----------|------|
| Chat 页面 | 经典 AI 聊天机器人 | Runtime 任务流 | **大** |
| TaskCard | Linear/Cursor 风格任务卡片 | 任务状态控制面板 | **中** |
| Workspace | 三面板只读详情页 | 任务运行控制台 | **中** |
| Timeline | Narrative-first 框架 | Runtime 进程叙事 | **小-中** |
| ResultSurface | 结构化文本块 | Object-like 产出物 | **小** |

### 2.2 关键洞察

**最大的 chat residue 不在任何单个组件里，而在 ChatView 的整体架构上。**

消息列表作为主要组织方式本身就是 chat 语义。要真正让 Runtime 感成立，需要让 TaskCard / Task 状态成为 ChatView 的视觉主角，而不是被消息流淹没。

---

## 3. Chat Residue 清单

### P0 — 直接破坏 Runtime 感的（5 项）

1. **消息列表作为主要组织方式** — `hc-chat__thread` 结构本身就是 chat 语义
2. **assistant avatar + name** — "小蟹" 暗示 chat assistant
3. **streaming typing dots** — ChatGPT 标志性 UI
4. **thinking block（"思考过程"）** — ChatGPT 联想
5. **`startChat` / `startChatDesc`** — 纯 chat 语言

### P1 — 削弱 Runtime 感的（7 项）

6. `inputPlaceholder: 'Type a message...'`
7. MessageActions（retry/edit）措辞
8. `hc-msg__bubble` 气泡结构
9. `botName: 'Mr.Krabs'`
10. `thoughtFor` / `thoughtProcess` i18n
11. Knowledge/Memory hits 展示
12. Tool calls 展示

### P2 — 可以延后的（4 项）

13. SessionList
14. ChatSearchDialog
15. ChatExportMenu
16. Message feedback（like/dislike）

---

## 4. Runtime Presence Engineering 建议

### 4.1 术语收敛（Phase 1 — 低成本高影响）

| 当前术语 | Runtime 术语 |
|----------|-------------|
| 开始对话 | 等待任务输入 |
| 选择一个 Agent 或直接发送消息 | 输入指令或选择任务模板 |
| Type a message... | 输入任务指令... |
| 思考过程 | 推理过程 |
| Thought for Xs | 推理 Xs |
| 重新发送 | 重新执行 |
| 编辑消息 | 修改指令 |
| Start Chat | 开始任务 |

### 4.2 视觉层级调整（Phase 2 — 中成本中影响）

- 弱化 assistant avatar + name，改为 agent badge
- 强化 TaskCard 在消息列表中的视觉权重
- Workspace 增加控制感元素（暂停/取消/重试按钮）

### 4.3 交互暗示重构（Phase 3 — 中成本高影响）

- Streaming 指示器从 typing 改为 runtime-style（"正在执行…"）
- MessageActions 措辞调整
- Timeline narrative 强化步骤推进感

### 4.4 结构性重构（Phase 4 — 高成本高影响）

- 让 TaskCard 成为 ChatView 的视觉主角
- Workspace 从只读升级为可操作
- 考虑 "任务中心" 模式（Chat 和 Task 并列而非嵌套）

---

## 5. 产品气质收敛方向

### Runtime 的核心气质

- **任务驱动**：一切都是 "任务"，不是 "对话"
- **状态可观测**：用户能感知到任务在运行、在推进、在完成
- **产出物导向**：最终价值是产出物，不是聊天记录
- **控制感**：用户能暂停、取消、重试、监控任务

### 应该抛弃的 Chat 气质

- **对话感**："你一条我一条" 的消息流
- **打字感**：typing dots 暗示 "AI 正在打字"
- **回复感**：assistant 的输出不是 "回复"，是 "任务产出"
- **会话感**：聊天会话不是 Runtime 的核心概念

### 不加功能强化 Runtime 感的方法

1. **改术语**：全面替换 chat 术语为 runtime 术语
2. **改视觉层级**：弱化 assistant，强化 task metadata
3. **改组织方式**：让 TaskCard 在消息列表中更突出
4. **改交互暗示**：typing → 进度指示器；retry → 重新执行
5. **改空态语言**：从 "开始对话" 改为 "等待任务输入"

---

## 6. 下一步

基于 ANL-022 分析，建议：

1. **PLN-016 Runtime Presence Refinement** — 基于分析结果创建执行计划
2. 优先执行 Phase 1（术语收敛）— 低成本高影响
3. Phase 2-4 根据 Phase 1 的效果决定是否继续
