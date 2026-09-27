import type { SceneObject } from '../../types'
import { addEntity, entityFromSceneObject, getEntity, patchEntityFromSceneObject, removeEntitySubtree, restoreEntities, sceneObjectForEntity, setEntityParent } from '../document/document'
import type { AssetDefinition, EditorDocument, EditorEntity } from '../document/types'
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

export class SetAnimationTrackCommand implements EditorCommand {
  readonly label = 'Update animation track'
  constructor(private readonly trackId: string, private readonly before: import('../document/types').AnimationTrack | undefined, private readonly after: import('../document/types').AnimationTrack | undefined) {}
  execute(document: EditorDocument) { if (this.after) document.animations[this.trackId] = JSON.parse(JSON.stringify(this.after)); else delete document.animations[this.trackId] }
  undo(document: EditorDocument) { if (this.before) document.animations[this.trackId] = JSON.parse(JSON.stringify(this.before)); else delete document.animations[this.trackId] }
}

export class RegisterAssetCommand implements EditorCommand {
  readonly label = 'Import asset'
  constructor(private readonly asset: AssetDefinition) {}
  execute(document: EditorDocument) { document.assets[this.asset.id] = JSON.parse(JSON.stringify(this.asset)) as AssetDefinition }
  undo(document: EditorDocument) { delete document.assets[this.asset.id] }
}

export class DuplicateEntityCommand implements EditorCommand {
  readonly label = 'Duplicate entity'
  private readonly duplicates: EditorEntity[]
  private readonly rootId: string
  constructor(document: EditorDocument, sourceId: string, duplicateId: string) {
    const source = getEntity(document, sourceId)
    if (!source) throw new Error('Cannot duplicate missing entity')
    this.rootId = duplicateId
    const idMap = new Map<string, string>([[sourceId, duplicateId]])
    const sourceEntities: EditorEntity[] = []
    const collect = (id: string) => {
      const entity = getEntity(document, id)
      if (!entity) return
      sourceEntities.push(entity)
      for (const childId of entity.children) {
        idMap.set(childId, `${duplicateId}-${childId}`)
        collect(childId)
      }
    }
    collect(sourceId)
    this.duplicates = sourceEntities.map((entity, index) => {
      const clone = JSON.parse(JSON.stringify(entity)) as EditorEntity
      clone.id = idMap.get(entity.id)!
      clone.name = index === 0 ? `${entity.name} copy` : entity.name
      clone.parentId = entity.id === sourceId ? entity.parentId : idMap.get(entity.parentId ?? '') ?? duplicateId
      clone.children = entity.children.map((childId) => idMap.get(childId)!).filter(Boolean)
      if (index === 0) {
        clone.transform.position[0] += 0.45
        clone.transform.position[1] += 0.2
      }
      return clone
    })
  }
  execute(document: EditorDocument) { for (const entity of this.duplicates) addEntity(document, entity) }
  undo(document: EditorDocument) { removeEntitySubtree(document, this.rootId) }
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
