import type { EditorDocument } from '../document/types'

export interface EditorCommand {
  readonly label: string
  execute(document: EditorDocument): void
  undo(document: EditorDocument): void
}

export class CompositeCommand implements EditorCommand {
  readonly label: string
  private readonly commands: EditorCommand[]

  constructor(label: string, commands: EditorCommand[]) {
    this.label = label
    this.commands = commands
  }

  execute(document: EditorDocument) {
    for (const command of this.commands) command.execute(document)
  }

  undo(document: EditorDocument) {
    for (const command of [...this.commands].reverse()) command.undo(document)
  }
}
