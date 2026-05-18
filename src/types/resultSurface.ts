/**
 * Result Surface is UI Projection, not Runtime Result Schema.
 * Do not modify TaskResult. This is a lightweight metadata layer
 * for ChatMessage.metadata.result_surface to hint UI rendering.
 */

/**
 * Result surface kind — maps skill output to rendering strategy.
 * 'text'    : default fallback (plain markdown)
 * 'summary' : structured summary layout (from summarize skill)
 * 'bullet'  : compact bullet-point layout (from bulletize skill)
 */
export type ResultSurfaceKind = 'text' | 'summary' | 'bullet' | 'asset'

/**
 * Infer result surface kind from skill ID.
 * Pure function — no side effects, deterministic mapping.
 * 优先读 meta.resultKind，回退到 skillId 硬编码映射。
 */
export function inferResultKind(
  skillId: string,
  meta?: { resultKind?: string },
): ResultSurfaceKind {
  if (meta?.resultKind && ['text', 'summary', 'bullet', 'asset'].includes(meta.resultKind)) {
    return meta.resultKind as ResultSurfaceKind
  }
  switch (skillId) {
    case 'summarize':
      return 'summary'
    case 'bulletize':
      return 'bullet'
    default:
      return 'text'
  }
}

/**
 * Lightweight UI hint carried on ChatMessage.metadata.result_surface.
 * Tells the renderer which layout strategy to use for skill output.
 */
export interface ResultSurfaceMetadata {
  resultKind: ResultSurfaceKind
}
