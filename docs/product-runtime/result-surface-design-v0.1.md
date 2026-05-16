# Result Surface Design v0.1

> Module 008 — Runtime Result Visual Language for Chat UI
> Analysis Date: 2026-05-16 | Analysis ID: ANL-020

---

## 1. Executive Summary

Chat Task Card P0 is complete. The chat UI can now render a task execution card (running → completed/failed) using `TaskCard.vue` and `TaskCardMetadata`. However, the **result content** inside these cards still renders as a generic Markdown bubble (`msg.content`). This design document defines the Result Surface — the UI projection layer that presents Runtime Task Results in Chat with appropriate visual treatments for different result types.

**Key principle**: Result Surface is a **UI-only projection**. It does NOT extend `TaskResult` schema, does NOT change Runtime execution, and does NOT introduce a generic result engine. Source of truth remains `message.content`.

---

## 2. Result Surface Taxonomy

| Surface Kind | Description | Data Source | Visual Treatment |
|---|---|---|---|
| `text` | Plain text / Markdown from LLM (default) | `msg.content` as-is | MarkdownRenderer (existing bubble) |
| `summary` | Structured summary from `@summarize` | `msg.content` (Markdown) | SummaryResultCard: title + sections + copy button |
| `bullet` | Bullet point extraction from `@bulletize` | `msg.content` (Markdown) | BulletResultCard: bullet list + copy button |
| `image` | Generated image (future) | `metadata.attachments` | Inline image card with download |
| `video` | Generated video (future) | `metadata.attachments` | Inline video card with playback |
| `upload` | User-uploaded file processing (future) | `metadata.attachments` | File card with preview |

**Current P0 scope**: `text` + `summary` + `bullet` (3 surfaces). Future surfaces are documented but NOT implemented in Module 008.

---

## 3. Projection Boundary Definition

### What Result Surface IS

- A **UI rendering layer** that maps metadata hints to Vue components
- Purely additive — does not change `TaskResult`, `TaskOutput`, `RuntimeStore`, or `SkillBridge`
- Source of truth: `message.content` (always)
- Metadata hint: `metadata.resultKind` or `metadata.skillId` (for auto-inference)

### What Result Surface is NOT

- NOT a new `TaskResult` variant (`{ kind: 'summary' }` etc.)
- NOT a new schema type or API contract
- NOT a generic result engine or middleware
- NOT a Workspace concern (Module 009)

### Data Flow

```
Runtime → TaskResult { kind: 'text', content: '...' }
         ↓
skillBridge.ts → ChatMessage { content: '...', metadata: { skillId, skillName, ... } }
         ↓
ChatView.vue → if (metadata.skillId === 'summarize') → <SummaryResultCard :content />
              else if (metadata.skillId === 'bulletize') → <BulletResultCard :content />
              else → <MarkdownRenderer :content />
```

**No new data transformation. No new store. No new API.**

---

## 4. Chat vs Workspace Responsibility Matrix

| Aspect | Chat | Workspace |
|---|---|---|
| **Scope** | Lightweight preview | Full result |
| **Content** | First ~500 chars or full (if short) | Full content, scrollable |
| **Actions** | Copy, Open Workspace | Copy, Edit, Export, Re-run |
| **Timeline** | Summary status only | Full execution timeline |
| **Interactivity** | Minimal (read-only cards) | Interactive (refine, iterate) |
| **Result Detail** | Surface projection only | Runtime context inspection |

Chat's role: **show the result quickly and let user decide if they need Workspace**. Workspace's role: **full result context with tools for deeper interaction**.

---

## 5. Skill → Surface Mapping Rules

### Problem Statement

Direct `skillId → Surface` mapping is fragile:
- New skills require ChatView.vue template changes
- skill explosion drags down UI (50+ `v-if` branches)
- Skill author shouldn't need to know about UI rendering

### Proposed Mapping Strategy

Two-level mapping: `skillId → resultKind hint → Surface component`

#### Level 1: Metadata Hint (preferred)

When skillBridge builds the assistant message, it sets `metadata.resultKind`:

```typescript
// In skillBridge.ts handleSkillInvocation():
metadata: {
  kind: 'task-card',
  taskId,
  skillId: skillMeta.skillId,
  skillName: skillMeta.displayName,
  resultKind: inferResultKind(skillMeta),  // ← NEW: 'summary' | 'bullet' | 'text'
  // ...
}
```

`inferResultKind()` is a pure function:
- `skillId === 'summarize'` → `'summary'`
- `skillId === 'bulletize'` → `'bullet'`
- Default → `'text'`

#### Level 2: SkillId Fallback (fallback)

If `resultKind` is missing, ChatView falls back to skillId-based inference. This keeps backward compatibility with existing messages.

#### Future: Surface Registry

P1+ consideration: a `SurfaceRegistry` that maps `resultKind` → Vue component, similar to how `SkillRegistry` maps skillId → SkillMeta. But P0 scope uses a simple `switch` in ChatView.

---

## 6. File Scope Recommendations

### P0 Scope (Module 008)

| File | Action | Rationale |
|---|---|---|
| `src/types/resultSurface.ts` | **CREATE** | Define `ResultSurfaceKind` type and mapping interfaces |
| `src/components/chat/SummaryResultCard.vue` | **CREATE** | Summary surface component |
| `src/components/chat/BulletResultCard.vue` | **CREATE** | Bullet surface component |
| `src/views/ChatView.vue` | **MODIFY** | Add surface routing logic (small: ~20 lines) |
| `src/services/skillBridge.ts` | **MODIFY** | Add `resultKind` to metadata (small: ~5 lines) |

### NOT in P0 Scope

| File | Reason |
|---|---|
| `SkillResultCard.vue` | Keep existing; Summary/Bullet cards are *new* components, not replacements |
| `TaskCard.vue` | Task card handles task lifecycle; result surface is the content *inside* the bubble |
| `runtime.ts` | No runtime changes — this is UI-only |
| `task.ts` (TaskResult) | No schema changes — resultKind is a UI projection hint |

---

## 7. Future Extensibility Notes

### Image/Video/Upload Surfaces (NOT implemented in P0)

These are documented for architectural readiness:

- **Image**: Already handled by existing attachment rendering (`getMessageAttachments()` in ChatView). No new surface needed — inline `<img>` with preview modal.
- **Video**: Same pattern — existing `<video>` tag rendering. May want a surface for generated videos (auto-play, thumbnail).
- **Upload**: File card with name/size/type, click to open.

### Surface Registry Pattern (P1+)

When surface count exceeds 5, consider:

```typescript
// src/components/chat/surfaces/index.ts
export const surfaceMap: Record<ResultSurfaceKind, Component> = {
  text: MarkdownRenderer,
  summary: SummaryResultCard,
  bullet: BulletResultCard,
  // future: image, video, upload...
}
```

ChatView replaces `v-if/v-else-if` chain with dynamic component:
```vue
<component :is="surfaceFor(msg)" v-bind="surfaceProps(msg)" />
```

This is a **P1 optimization**, not P0 scope.

---

## 8. Risk Assessment

| Risk | Severity | Mitigation |
|---|---|---|
| Breaking existing SkillResultCard rendering | Medium | SkillResultCard is NOT modified; new cards are separate components |
| Metadata `resultKind` field not persisted | Low | resultKind is derived from skillId at write time; reconstructable on read |
| ChatView.vue template bloat | Low | Surface routing is a simple switch, not a growing if-chain (P0 has 3 cases) |
| Old messages without resultKind | Low | Fallback to skillId-based inference handles backward compatibility |

---

## 9. Decisions Summary

| # | Decision | Rationale |
|---|---|---|
| D1 | Result Surface is UI-only projection | No runtime schema changes; keeps boundary clean |
| D2 | `resultKind` in metadata as projection hint | Avoids skillId → UI coupling; extensible |
| D3 | Separate components per surface (not SkillResultCard variants) | Each surface has unique layout; composition > inheritance |
| D4 | P0 scope = 3 surfaces (text/summary/bullet) | Matches existing skills; avoids premature generalization |
| D5 | Workspace integration via "Open Workspace" button only | Chat stays lightweight; deep interaction deferred |
