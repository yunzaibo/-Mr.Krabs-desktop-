# Result Items Rendering v0.1

> Date: 2026-05-17
> Baseline: v0.4.6-timeline-presence (33567e5)
> Analysis: ANL-029
> Plan: PLN-023A
> Status: Plan Complete

---

## 1. 目标

增强 Workspace ContextDetailPanel 中 Result Items 的实际内容呈现能力，验证 multi-type result 的最小路径。

---

## 2. 范围

### 本轮实现

| ID | Enhancement | 说明 |
|----|------------|------|
| RS-002 | Code block rendering | kind='code' 时用 MarkdownRenderer 渲染代码 |
| RS-001 | Image placeholder | kind='image' 时显示 placeholder + dims/size |

### 本轮不涉及

- RS-003 Asset path resolution（Phase 3）
- RS-004 Type unification（后续）
- Tauri convertFileSrc
- 音频/视频播放
- Mermaid/LaTeX
- ResultSurfaceRegistry

---

## 3. 架构位置

```
ContextDetailPanel.vue
  └─ Result Items section (lines 303-357)
       └─ v-for item in resultProjection.items
            ├─ [UNTOUCHED] header (icon + title + desc + group + status)
            ├─ [NEW] code block / image placeholder (kind 分支)
            ├─ [UNTOUCHED] metadata row (size + mimeType + dims)
            └─ [UNTOUCHED] path-row (path + copy)
```

改动局限在 ContextDetailPanel.vue 的 template + script + style 三个部分。

---

## 4. Code Item 渲染

### 数据来源

- `item.description` — 代码内容（markdown-it 消费）
- `item.title` — 文件名，用于推断语言扩展名
- `item.kind === 'code'` — 触发条件

### 包装策略

纯代码文本 → 用 ``` 包装为 fenced code block → MarkdownRenderer 消费。

### Fallback

- description 为空 → metadata 卡片（现有行为）
- description 超 2000 字符 → 截断 + truncated 提示

---

## 5. Image Placeholder

### 数据来源

- `item.kind === 'image'` — 触发条件
- `item.dimensions` — 尺寸信息
- `item.sizeBytes` — 文件大小

### 不做的事

不做真实图片渲染，只显示 placeholder 容器。真实图片渲染依赖 Asset Runtime（Phase 3）。

---

## 6. Fallback 矩阵

| kind | PLN-023A 行为 |
|------|-------------|
| text | metadata 卡片（不变） |
| code | MarkdownRenderer 代码块 |
| image | placeholder + dims/size |
| audio | metadata 卡片（不变） |
| video | metadata 卡片（不变） |
| file | metadata 卡片（不变） |
| tool_call | metadata 卡片（不变） |

---

## 7. 不变的部分

- workspaceProjector — 不改
- useWorkspace — 不改
- RuntimeStore — 不改
- ResultKind / ResultItemProjection 类型 — 不改
- Chat TaskCard — 不改
- MarkdownRenderer — 只消费不修改

---

## 8. 关联

| 关联项 | 关系 |
|--------|------|
| ANL-029 | 本次增强的分析基础 |
| PLN-023A | 本次实现计划 |
| v0.4.6-timeline-presence | 当前 baseline |
| v0.4.7-result-items-rendering | 目标 tag |
