import type { SceneObject } from '../../types'
import { addEntity, entityFromSceneObject, getEntity, patchEntityFromSceneObject, removeEntitySubtree, restoreEntities, sceneObjectForEntity, setEntityParent } from '../document/document'
import type { EditorDocument, EditorEntity } from '../document/types'
import type { EditorCommand } from './command'

export class CreateEntityCommand implements EditorCommand {
  readonly label = 'Create entity'
  private readonly entity: EditorEntity
  constructor(entity: EditorEntity) { this.entity = JSON.parse(JSON.stringify(entity)) as EditorEntity }
  execute(document: EditorDocument) { addEntity(document, JSON.parse(JSON.stringify(this.entity)) as EditorEntity) }
  undo(document: EditorDocument) { removeEntitySubtree(document, this.entity.id) }
}

export class DeleteEntityCommand implements EditorCommand {
  readonly label = 'Delete entity'
  private removed: EditorEntity[] = []
  constructor(private readonly id: string) {}
  execute(document: EditorDocument) { this.removed = removeEntitySubtree(document, this.id) }
  undo(document: EditorDocument) { restoreEntities(document, this.removed) }
}

export class TransformEntityCommand implements EditorCommand {
  readonly label = 'Transform entity'
  constructor(private readonly id: string, private readonly before: Partial<SceneObject>, private readonly after: Partial<SceneObject>) {}
  execute(document: EditorDocument) { patchEntityFromSceneObject(document, this.id, this.after) }
  undo(document: EditorDocument) { patchEntityFromSceneObject(document, this.id, this.before) }
}

export class UpdateEntityCommand implements EditorCommand {
  constructor(readonly label: string, private readonly id: string, private readonly before: Partial<SceneObject>, private readonly after: Partial<SceneObject>) {}
  execute(document: EditorDocument) { patchEntityFromSceneObject(document, this.id, this.after) }
  undo(document: EditorDocument) { patchEntityFromSceneObject(document, this.id, this.before) }
}

export class ParentEntityCommand implements EditorCommand {
  readonly label = 'Parent entity'
  constructor(private readonly id: string, private readonly beforeParentId: string | null, private readonly afterParentId: string | null) {}
  execute(document: EditorDocument) { setEntityParent(document, this.id, this.afterParentId) }
  undo(document: EditorDocument) { setEntityParent(document, this.id, this.beforeParentId) }
}

export class DuplicateEntityCommand implements EditorCommand {
  readonly label = 'Duplicate entity'
  private readonly duplicate: EditorEntity
  constructor(document: EditorDocument, sourceId: string, duplicateId: string) {
    const source = getEntity(document, sourceId)
    if (!source) throw new Error('Cannot duplicate missing entity')
    this.duplicate = JSON.parse(JSON.stringify({ ...source, id: duplicateId, name: `${source.name} copy`, children: [] })) as EditorEntity
    this.duplicate.transform.position[0] += 0.45
    this.duplicate.transform.position[1] += 0.2
  }
  execute(document: EditorDocument) { addEntity(document, this.duplicate) }
  undo(document: EditorDocument) { removeEntitySubtree(document, this.duplicate.id) }
}

export const commandForScenePatch = (document: EditorDocument, id: string, patch: Partial<SceneObject>, label = 'Update entity') => {
  const current = sceneObjectForEntity(document, id)
  if (!current) throw new Error('Cannot update missing entity')
  const before: Partial<SceneObject> = {}
  for (const key of Object.keys(patch) as (keyof SceneObject)[]) before[key] = current[key] as never
  return new UpdateEntityCommand(label, id, before, patch)
}

export const commandForTransform = (document: EditorDocument, id: string, after: Partial<SceneObject>) => commandForScenePatch(document, id, after, 'Transform entity')

export const entityForCreate = (object: SceneObject) => entityFromSceneObject(object)
