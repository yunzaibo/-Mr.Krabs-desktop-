# Workspace Runtime Design v0.1

> Module 009 — Workspace Task Detail for AI-native Runtime
> Analysis Date: 2026-05-16 | Analysis ID: ANL-021

---

## 1. Executive Summary

Module 008 Result Surface P1 is complete. Chat now shows task lifecycle (TaskCard) and result preview (SummaryResultCard/BulletResultCard). The next step is defining Workspace's Runtime role.

**Key principle**: Workspace is a **Runtime Task Observatory** — a task-centric management surface where users monitor, inspect, and navigate AI task execution. It consumes Projection DTOs exclusively (never RuntimeContext/RuntimeEvent).

---

## 2. Workspace Responsibility Boundary

| Aspect | Chat | Workspace |
|--------|------|-----------|
| **Primary mode** | Conversation | Task management |
| **Result** | Preview (≤500 chars) | Full content (expanded, interactive) |
| **Timeline** | Hidden (status badge only) | Full execution timeline (narrative + raw) |
| **Context** | Hidden | 5-section projection |
| **Assets** | Hidden | Visible (file list, metadata, path) |
| **Interactivity** | Read-only | Interactive (select, expand, navigate) |
| **Scope** | Single session | All tasks (active + completed) |

**Designation**: Workspace is NOT a debug console, NOT an IDE, NOT a generic task detail page. It is the user-facing Runtime observatory.

---

## 3. Workspace Topology

Current 3-panel layout is correct:

```
┌─────────────┬──────────────────────┬─────────────┐
│  TaskList   │   ContextDetail      │  Timeline   │
│  280px      │   flex-1 (primary)   │  320px      │
│  navigation │   content            │  temporal   │
└─────────────┴──────────────────────┴─────────────┘
```

**Primary pane**: Center (ContextDetail) — highest information density, changes on selection, 5 sections covering the full task lifecycle.

Pattern matches **Linear-style** (List → Detail → Sidebar), which is appropriate for task management.

---

## 4. ResultSurface Integration

**Do NOT duplicate SummaryResultCard/BulletResultCard in Workspace.** Rationale:

- Chat uses these for preview rendering (embedded in message)
- Workspace shows **all results** from multiple sources (primary text, generated files, artifacts)
- `ResultItemProjection` metadata list (icon + title + size + path) is appropriate for Workspace
- Primary text results already render via `execution.outputContent` through MarkdownRenderer

---

## 5. Context Visibility Strategy

**5 sections projected, correctly bounded:**

| Section | Source | User Purpose |
|---------|--------|-------------|
| Task | `ctx.task` | What the task is doing |
| Skill | `ctx.skill` | What knowledge is loaded |
| Execution | `ctx.execution` | How execution is progressing |
| Outputs | `ctx.resources.asset` | What was produced |
| Health | `ctx.resources.recovery` | Whether something went wrong |

**Hidden (correctly):** System Layer, Memory Layer, layerStates, skill.capabilities, execution valid transitions, full AssetCollection refs, full RecoveryLayer details.

---

## 6. Timeline Narrative Boundary

**Narrative-first, raw as safety valve.** Evidence:

- 20 RuntimeEventTypes → 5 UX categories (task/skill/system/warning/output)
- `NarrativePhase` groups into story beats (creation → preparation → execution → completion)
- Significance-based grouping: milestone/failure = solo, major = solo, minor = aggregated with collapse
- Raw mode shows projected `TimelineItemProjection`, not raw `RuntimeEvent`

---

## 7. Existing Component Audit

| Component | Status | Assessment |
|-----------|--------|------------|
| WorkspaceView.vue | Keep | Clean shell, delegates to `useWorkspace` |
| TaskListPanel.vue | Keep | Focused navigation, appropriate for selection |
| ContextDetailPanel.vue | Keep + Enhance (future) | Primary content pane, well-structured |
| TimelinePanel.vue | Keep | Narrative-first approach is correct |
| workspaceProjector.ts | Keep | Formal boundary, clean pure functions |
| useWorkspace.ts | Keep | Correct read-only access pattern |

---

## 8. Design Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| D1 | Workspace = Runtime Task Observatory | Not debug console, not IDE, not generic detail page |
| D2 | Three-panel Linear-style layout | Appropriate for task management pattern |
| D3 | 5-section ContextDetail boundary | Right abstraction level for user visibility |
| D4 | Narrative-first Timeline | User-friendly with raw mode as safety valve |
| D5 | No duplicate result components | Chat and Workspace use different projection strategies |
| D6 | Projection DTO is formal boundary | UI never touches Runtime types directly |

---

## 9. Future Extensibility

### P1 Scope (Module 009)

- Enhance ContextDetailPanel result rendering
- Add status badge counts to TaskListPanel
- Ensure Workspace integrates with Module 008 ResultSurface (no duplication)

### P2+ Considerations

- Asset management surface (Module 012)
- Browser Runtime integration (Module 014)
- Memory/Context Continuity (P3)

---

## 10. Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Context abstraction drift | Medium | Maintain 5-section boundary as hard constraint |
| ResultSurface duplication | Low | Design decision: no duplicate components |
| Timeline narrative too simplified | Low | Raw mode provides escape hatch |

---

## 11. Decisions Summary

| # | Decision | Rationale |
|---|----------|-----------|
| D1 | Workspace = Runtime Task Observatory | User-facing, not developer-facing |
| D2 | Three-panel Linear-style | Proven pattern for task management |
| D3 | 5-section ContextDetail | Right abstraction level |
| D4 | Narrative-first Timeline | User-friendly with safety valve |
| D5 | No duplicate result components | Clean separation of concerns |
| D6 | Projection DTO boundary | Formal contract between Runtime and UI |
