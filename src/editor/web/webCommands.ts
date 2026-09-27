import type { EditorCommand } from '../commands/command'
import type { EditorDocument } from '../document/types'
import type { WebDocument } from './webDocumentTypes'

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T

export class UpdateWebDocumentCommand implements EditorCommand {
  readonly label = 'Commit web code'
  constructor(private readonly before: WebDocument, private readonly after: WebDocument) {}
  execute(document: EditorDocument) { document.web = clone(this.after) }
  undo(document: EditorDocument) { document.web = clone(this.before) }
}
