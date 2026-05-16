/**
 * TaskCard is RuntimeTask's Chat Projection, NOT a new ChatMessage type.
 * P0: carried via ChatMessage.metadata as transitional projection.
 * P1+: should migrate to Task-first data model.
 */
export interface TaskCardMetadata {
  kind: 'task-card'
  taskId: string
  skillId: string
  skillName: string
  status: 'running' | 'completed' | 'failed' | 'cancelled'
  elapsed?: number
  resultKind?: 'text' | 'summary' | 'bullet'
  /** P0: from text result content; P1+: should come from Task Result Projection */
  resultPreview?: string
  lastEvent?: string
  previewEvents?: string[]
}
