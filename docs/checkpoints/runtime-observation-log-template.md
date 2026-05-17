# Runtime Observation Log

> 用于记录真实使用中的 Runtime feeling 观察。

---

## Log Entry Template

```markdown
### {日期} — {场景简述}

**用户行为**：
- （描述用户实际做了什么）

**Runtime Feeling**：
- [ ] P0: 等待 task completion
- [ ] P0: 查看 execution narrative
- [ ] P0: 回到 Chat 修改 instruction
- [ ] P0: 把 Workspace 当结果中心
- [ ] P1: 使用 "任务" 语言
- [ ] P1: 主动进入 Workspace
- [ ] P1: 把 Result 当 artifact
- [ ] P1: 理解 TaskCard 是运行态

**正面信号**：
- （列出观察到的正面信号）

**负面信号**：
- （列出观察到的负面信号）

**问题**：
- （描述发现的问题）

**Root Cause**：
- （分析问题根因）

**是否需要 ADR**：
- 是 / 否

**修复建议**：
- （最小修复建议，不进入开发）
```

---

## Log Entries

### 2026-05-18 00:40 — 首次真实使用观察

**用户行为**：
- 配置 DeepSeek API（经历了 provider 选错 → base_url 不对 → 模型名不对的排错过程）
- 发送关于量化交易的问题，收到回复
- 查看 Chat 视图的回复（格式异常）
- 切换到 Workspace 视图查看完整回复（格式正常）
- 在同一 session 发送第二条消息
- 打开技能市场查看
- 尝试导入 GitHub skill 链接

**Runtime Feeling**：
- [x] P0: 等待 task completion — 用户等待回复
- [ ] P0: 查看 execution narrative — Timeline 有显示但用户未主动关注
- [x] P0: 回到 Chat 修改 instruction — 用户在同一 session 追问
- [x] P0: 把 Workspace 当结果中心 — 用户主动切到 Workspace 查看完整内容
- [ ] P1: 使用 "任务" 语言 — 未观察到
- [x] P1: 主动进入 Workspace — 用户主动切换
- [ ] P1: 把 Result 当 artifact — 未明确
- [ ] P1: 理解 TaskCard 是运行态 — 显示 `taskCard.statusCompleted` 未翻译，可能不理解

**正面信号**：
- 用户主动切换到 Workspace 查看完整结果
- 用户在同一 session 追问（理解对话连续性）
- 用户尝试导入 skill（理解系统可扩展）

**负面信号**：
- Chat 视图 markdown 未渲染 → 体验像 debug 工具
- `taskCard.statusCompleted` 未翻译 → UI 不完整
- 时间戳显示 `13651.0s` → 不用户化
- 上下文断裂（同一 session 变两个对话）→ 破坏连续性
- 回复和技能市场页面加载慢 → 性能问题

**问题**：
1. Chat 视图 markdown 渲染失败：显示原始 `**加粗**`、`> 引用`、`### 标题`
2. i18n key 未翻译：`taskCard.statusCompleted`、`taskCard.openWorkspace`
3. 时间戳未本地化：`13651.0s` 应显示 "约 3 小时 47 分钟"
4. 上下文断裂：同一 session 发两条消息，点开 task 后变两个独立对话
5. GitHub skill 导入：需要 raw URL，不支持仓库 URL
6. 页面加载慢：回复页和技能市场都有性能问题
7. 机器人回复 UI 不符合原项目格式

**Root Cause**：
1. Chat 视图的 markdown 渲染器可能未正确初始化或与 Workspace 视图使用不同渲染器
2. i18n 翻译文件缺少 `taskCard.*` key 的翻译
3. 时间戳格式化函数直接输出秒数，未做本地化转换
4. Session 管理在 task 打开/关闭时未正确维护消息列表
5. skill_install 后端只支持 skill.md 文件路径，不支持 GitHub 仓库 URL
6. 可能是 sidecar 响应慢或前端渲染性能问题
7. Chat 视图的 message 组件样式与原项目设计不符

**是否需要 ADR**：
- 问题 4（上下文断裂）：是 — 影响核心体验
- 其他：否 — 属于 bug fix 范围

**修复建议**：
- 问题 1-3：最小修复（渲染器 / i18n / 时间格式），不涉及架构
- 问题 4：需要调查 session 管理逻辑，可能需要 ADR
- 问题 5：文档告知用户正确 URL 格式
- 问题 6-7：记录但暂不修复，观察是否持续

---

### 2026-05-18 01:30 — Layer 1-2 修复执行

**修复完成**：

1. **i18n key 翻译** (Task #43) ✅
   - 修复了 `TaskCard.vue` 中的 i18n key：`t('taskCard.xxx')` → `t('chat.taskCard.xxx')`
   - 状态标签、工作台按钮等现在正确显示中文

2. **时间戳本地化** (Task #42) ✅
   - 添加了 `formatElapsed()` 函数
   - `13651.0s` → `3h 47m`
   - `65.3s` → `65.3s`
   - `125s` → `2m 5s`

3. **Markdown 渲染修复** (Task #41) ✅
   - **根因确认**：TaskCard 组件的预览区域使用纯文本渲染 `{{ truncatedPreview }}`，没有使用 MarkdownRenderer
   - **对比**：SkillResultCard 已正确使用 `<MarkdownRenderer :content="content" />`
   - **修复**：在 TaskCard.vue 中引入 MarkdownRenderer，替换纯文本渲染
   - 用户现在能在 Chat 视图看到正确渲染的 markdown 格式

4. **UI 格式调查** (Task #44) ✅
   - **发现**：assistant 消息气泡被设计为透明无容器样式（"飞书风格"）
   - **对比**：用户消息有蓝色半透明背景 + 边框 + 圆角
   - **结论**：这是设计决策，不是 bug。但与 SkillResultCard 的完整卡片样式形成不一致
   - **建议**：记录但不修改，观察用户反馈

**待处理**：
- 问题 4（上下文断裂）：需要 ADR
- 问题 5（GitHub skill 导入）：已告知用户正确 URL 格式
- 问题 6（页面加载慢）：记录但暂不修复
