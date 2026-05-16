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
export type ResultSurfaceKind = 'text' | 'summary' | 'bullet'

/**
 * Infer result surface kind from skill ID.
 * Pure function — no side effects, deterministic mapping.
 */
export function inferResultKind(skillId: string): ResultSurfaceKind {
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
