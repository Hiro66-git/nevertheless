import type { SceneObject } from '../../types'
import { documentToSceneObjects } from '../document/document'
import type { AnimationKeyframe, AnimationTrack, EditorDocument, Vec3 } from '../document/types'

const cloneValue = (value: AnimationKeyframe['value']): AnimationKeyframe['value'] => Array.isArray(value) ? [...value] as Vec3 : value

export const evaluateTrack = (track: AnimationTrack, time: number): AnimationKeyframe['value'] | undefined => {
  if (!track.keyframes.length) return undefined
  const frames = [...track.keyframes].sort((a, b) => a.time - b.time)
  if (time <= frames[0].time) return cloneValue(frames[0].value)
  if (time >= frames[frames.length - 1].time) return cloneValue(frames[frames.length - 1].value)
  const nextIndex = frames.findIndex((frame) => frame.time >= time)
  const previous = frames[nextIndex - 1]
  const next = frames[nextIndex]
  const amount = (time - previous.time) / (next.time - previous.time)
  if (Array.isArray(previous.value) && Array.isArray(next.value)) return previous.value.map((value, index) => value + (next.value as Vec3)[index] * amount - value * amount) as Vec3
  if (typeof previous.value === 'number' && typeof next.value === 'number') return previous.value + (next.value - previous.value) * amount
  return cloneValue(previous.value)
}

export const evaluateDocumentAtTime = (document: EditorDocument, time: number): SceneObject[] => {
  const objects = documentToSceneObjects(document).map((object) => ({ ...object, position: [...object.position] as Vec3, rotation: [...object.rotation] as Vec3, scale: [...object.scale] as Vec3 }))
  const byId = new Map(objects.map((object) => [object.id, object]))
  for (const track of Object.values(document.animations)) {
    const target = byId.get(track.entityId)
    const value = evaluateTrack(track, time)
    if (!target || value === undefined) continue
    if (track.property === 'opacity' && typeof value === 'number') target.opacity = value
    if (track.property === 'position' && Array.isArray(value)) target.position = [...value] as Vec3
    if (track.property === 'rotation' && Array.isArray(value)) target.rotation = [...value] as Vec3
    if (track.property === 'scale' && Array.isArray(value)) target.scale = [...value] as Vec3
  }
  return objects
}
