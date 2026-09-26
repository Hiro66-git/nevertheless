import type { EditorCommand } from '../commands/command'

export const pushCommand = (past: EditorCommand[], command: EditorCommand, limit = 100) => [...past, command].slice(-limit)
export const pushFutureCommand = (future: EditorCommand[], command: EditorCommand, limit = 100) => [command, ...future].slice(0, limit)

export class CommandHistory {
  readonly past: EditorCommand[] = []
  readonly future: EditorCommand[] = []
  constructor(private readonly limit = 100) {}
  push(command: EditorCommand) { if (this.past.length >= this.limit) this.past.shift(); this.past.push(command); this.future.length = 0 }
  takeUndo() { const command = this.past.pop(); if (command) this.future.unshift(command); return command }
  takeRedo() { const command = this.future.shift(); if (command) this.past.push(command); return command }
  clear() { this.past.length = 0; this.future.length = 0 }
}
