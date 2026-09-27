import * as THREE from 'three'
import type { SceneObject } from '../../types'

export const materialKeyForObject = (object: SceneObject) => `${object.materialId ?? `${object.id}-material`}${object.materialOverride ? `:override:${JSON.stringify(object.materialOverride)}` : ''}`

type ManagedMaterial = {
  material: THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial
  refs: number
}

export class MaterialManager {
  private readonly materials = new Map<string, ManagedMaterial>()

  acquire(object: SceneObject) {
    const id = materialKeyForObject(object)
    const current = this.materials.get(id)
    if (current) {
      current.refs += 1
      this.updateMaterial(current.material, object)
      return { id, material: current.material }
    }
    const materialOptions = {
      color: object.color,
      metalness: object.metalness,
      roughness: object.roughness,
      transparent: object.opacity < 1,
      opacity: object.opacity,
      clearcoat: object.shape === 'sphere' ? 0.6 : 0.15,
      emissive: object.emissive ?? (object.shape === 'sphere' ? new THREE.Color(object.color).multiplyScalar(0.08) : '#000000'),
      emissiveIntensity: object.emissiveIntensity ?? (object.shape === 'sphere' ? 0.08 : 0),
    }
    const material = object.materialType === 'MeshStandardMaterial'
      ? new THREE.MeshStandardMaterial(materialOptions)
      : new THREE.MeshPhysicalMaterial(materialOptions)
    material.userData.webforgeMaterialId = id
    this.materials.set(id, { material, refs: 1 })
    return { id, material }
  }

  update(object: SceneObject) {
    const id = materialKeyForObject(object)
    const entry = this.materials.get(id)
    if (!entry) return this.acquire(object).material
    this.updateMaterial(entry.material, object)
    return entry.material
  }

  release(id: string | undefined) {
    if (!id) return
    const entry = this.materials.get(id)
    if (!entry) return
    entry.refs -= 1
    if (entry.refs > 0) return
    this.disposeMaterial(entry.material)
    this.materials.delete(id)
  }

  dispose() {
    for (const entry of this.materials.values()) this.disposeMaterial(entry.material)
    this.materials.clear()
  }

  private disposeMaterial(material: THREE.Material) {
    const withMap = material as THREE.Material & { map?: THREE.Texture | null }
    withMap.map?.dispose()
    material.dispose()
  }

  private updateMaterial(material: THREE.Material, object: SceneObject) {
    const physical = material as THREE.MeshPhysicalMaterial
    physical.color.set(object.color)
    physical.roughness = object.roughness
    physical.metalness = object.metalness
    physical.opacity = object.opacity
    physical.transparent = object.opacity < 1
    if ('emissive' in physical) {
      physical.emissive.set(object.emissive ?? (object.shape === 'sphere' ? object.color : '#000000'))
      physical.emissiveIntensity = object.emissiveIntensity ?? (object.shape === 'sphere' ? 0.08 : 0)
    }
    physical.needsUpdate = true
  }
}
