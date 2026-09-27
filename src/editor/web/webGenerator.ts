import { documentToSceneObjects } from '../document/document'
import type { EditorDocument } from '../document/types'
import { buildAssetUrlMap } from './exportPaths'
import { generatedRegion } from './generatedRegions'
import { createDefaultWebDocument } from './webDocument'
import type { GeneratedWebFiles, WebDocument, WebElementNode, WebGenerationSettings } from './webDocumentTypes'

const THREE_MODULE_URL = 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js'
const GLTF_LOADER_URL = 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/GLTFLoader.js'
const USER_HTML_START = '<!-- webforge:user:html:start -->'
const USER_HTML_END = '<!-- webforge:user:html:end -->'
const USER_CSS_START = '/* webforge:user:css:start */'
const USER_CSS_END = '/* webforge:user:css:end */'

export const escapeHtml = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;')
export const escapeScriptData = (value: string) => value.replaceAll('</script', '<\\/script').replaceAll('<!--', '<\\!--').replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029')

const serializeNode = (node: WebElementNode): string => {
  const attributes = Object.entries(node.attributes).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => ` ${key}="${escapeHtml(value)}"`).join('')
  const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'])
  if (voidTags.has(node.tag)) return `<${node.tag}${attributes}>`
  const content = `${node.text === undefined ? '' : escapeHtml(node.text)}${node.children.map(serializeNode).join('')}`
  return `<${node.tag}${attributes}>${content}</${node.tag}>`
}

const normalizedWeb = (document: EditorDocument): WebDocument => document.web ?? createDefaultWebDocument(document.project.name)

const generatedCss = `.webforge-scene{position:relative;min-height:22rem;overflow:hidden;background:#0d1115}.webforge-scene canvas{display:block;width:100%;height:100%;min-height:22rem}.webforge-error{max-width:48rem;margin:2rem auto;padding:1rem;border:1px solid #9b4d4d;border-radius:.5rem;background:#291719;color:#ffd9d9;font:14px/1.5 ui-monospace,monospace}.webforge-hero{min-height:100vh;display:grid;place-items:center;align-content:center;gap:.75rem;padding:4rem;box-sizing:border-box;background:radial-gradient(circle at 50% 42%,#173b3c,#0d1115 55%);color:#eef3f1;font:16px system-ui,sans-serif}.webforge-eyebrow{color:#91a29f;letter-spacing:.14em;text-transform:uppercase;font-size:11px;text-align:center}.webforge-title{margin:0;font-weight:500;letter-spacing:-.04em;font-size:clamp(42px,8vw,120px);text-align:center}`

const makeSceneData = (document: EditorDocument, assetUrls: Record<string, string>) => ({
  entities: documentToSceneObjects(document).map((object) => ({
    id: object.id,
    name: object.name,
    kind: object.kind,
    shape: object.shape ?? null,
    parentId: object.parentId ?? null,
    position: object.position,
    rotation: object.rotation,
    scale: object.scale,
    color: object.color,
    metalness: object.metalness,
    roughness: object.roughness,
    opacity: object.opacity,
    visible: object.visible,
    locked: object.locked,
    assetId: object.assetId ?? null,
  })),
  materials: document.materials,
  assets: assetUrls,
  animations: document.animations,
  assetTypes: Object.fromEntries(Object.values(document.assets).sort((a, b) => a.id.localeCompare(b.id)).map((asset) => [asset.id, asset.type])),
})

const sceneScript = (document: EditorDocument, web: WebDocument, assetUrls: Record<string, string>) => {
  const data = escapeScriptData(JSON.stringify(makeSceneData(document, assetUrls)))
  const userScript = web.scripts.userSource
  const sceneDataRegion = generatedRegion('scene-data', `const sceneData = ${data};`, 'js')
  return `${sceneDataRegion}
const WEBFORGE_PROTOCOL = 'webforge-preview';
const WEBFORGE_PROTOCOL_VERSION = 1;
const report = (kind, error, extra = {}) => {
  const value = error instanceof Error ? error : new Error(String(error));
  window.parent.postMessage({ protocol: WEBFORGE_PROTOCOL, version: WEBFORGE_PROTOCOL_VERSION, previewId: globalThis.__WEBFORGE_PREVIEW_ID__ || '', type: kind, error: { message: value.message, stack: value.stack || '', line: extra.line || null, column: extra.column || null, source: extra.source || 'scene.js' } }, '*');
};
window.addEventListener('error', (event) => report('runtime-error', event.error || event.message, { line: event.lineno, column: event.colno, source: event.filename || 'scene.js' }));
window.addEventListener('unhandledrejection', (event) => report('runtime-error', event.reason, { source: 'promise' }));

(async () => {
  try {
    const THREE = await import('${THREE_MODULE_URL}');
    const mount = document.getElementById(${JSON.stringify(web.html.body.sceneMountId)});
  if (!mount) throw new Error('Generated scene mount is missing');
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0d1115');
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(5.6, 3.3, 6.8);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(Math.max(mount.clientWidth, 1), Math.max(mount.clientHeight, 1), false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  mount.replaceChildren(renderer.domElement);
  scene.add(new THREE.HemisphereLight('#d9ecff', '#12151f', 1.45));
  const fill = new THREE.DirectionalLight('#9ea9ff', 2.2); fill.position.set(-4, 4, 4); scene.add(fill);
  const stage = new THREE.Group(); scene.add(stage);
  const geometryFor = (shape) => shape === 'torus' ? new THREE.TorusGeometry(1.15, .035, 16, 96) : shape === 'plane' ? new THREE.PlaneGeometry(2, 2) : shape === 'cone' ? new THREE.ConeGeometry(.85, 1.6, 48) : shape === 'box' ? new THREE.BoxGeometry(1.3, 1.3, 1.3, 3, 3, 3) : new THREE.SphereGeometry(.95, 32, 20);
  const objects = new Map();
  const modelItems = sceneData.entities.filter((item) => item.kind === 'mesh' && item.assetId && sceneData.assetTypes[item.assetId] === 'model');
  const modelLoaderModule = modelItems.length ? await import('${GLTF_LOADER_URL}') : null;
  const modelLoader = modelLoaderModule ? new modelLoaderModule.GLTFLoader() : null;
  for (const item of sceneData.entities) {
    if (item.kind === 'light') { const light = new THREE.PointLight(item.color, 3.2, 5, 2); light.position.set(...item.position); stage.add(light); objects.set(item.id, light); continue; }
    if (item.kind !== 'mesh') continue;
    const material = new THREE.MeshPhysicalMaterial({ color: item.color, metalness: item.metalness, roughness: item.roughness, transparent: item.opacity < 1, opacity: item.opacity });
    const mesh = new THREE.Mesh(geometryFor(item.shape), material);
    mesh.name = item.name; mesh.position.set(...item.position); mesh.rotation.set(...item.rotation); mesh.scale.set(...item.scale); mesh.visible = item.visible; stage.add(mesh); objects.set(item.id, mesh);
    const assetUrl = item.assetId ? sceneData.assets[item.assetId] : null;
    const assetType = item.assetId ? sceneData.assetTypes[item.assetId] : null;
    if (assetUrl && assetType === 'image') new THREE.TextureLoader().load(assetUrl, (texture) => { material.map = texture; material.transparent = true; material.needsUpdate = true; }, undefined, (error) => report('runtime-error', error, { source: 'asset' }));
    if (assetUrl && assetType === 'model' && modelLoader) modelLoader.load(assetUrl, (gltf) => { mesh.visible = false; mesh.parent?.add(gltf.scene); gltf.scene.position.copy(mesh.position); gltf.scene.rotation.copy(mesh.rotation); gltf.scene.scale.copy(mesh.scale); }, undefined, (error) => report('runtime-error', error, { source: 'asset' }));
  }
  const resize = () => { const width = Math.max(mount.clientWidth, 1); const height = Math.max(mount.clientHeight, 1); camera.aspect = width / height; camera.updateProjectionMatrix(); renderer.setSize(width, height, false); };
  window.addEventListener('resize', resize);
  resize();
  const frame = () => { renderer.render(scene, camera); window.requestAnimationFrame(frame); };
  frame();
  window.parent.postMessage({ protocol: WEBFORGE_PROTOCOL, version: WEBFORGE_PROTOCOL_VERSION, previewId: globalThis.__WEBFORGE_PREVIEW_ID__ || '', type: 'ready' }, '*');
  try { ${userScript} } catch (error) { report('runtime-error', error, { source: 'project.js' }); }
  } catch (error) { report('runtime-error', error, { source: 'scene.js' }); }
})();
`
}

export const generateWebOutput = (document: EditorDocument, settings: WebGenerationSettings = {}): GeneratedWebFiles => {
  const web = normalizedWeb(document)
  const assetUrls = settings.assetUrls ?? buildAssetUrlMap(document.assets)
  const sections = web.html.body.sections.map(serializeNode).join('\n')
  const indexHtml = `<!doctype html>\n<html lang="${escapeHtml(web.metadata.lang)}">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<meta http-equiv="Content-Security-Policy" content="default-src 'self' data: blob:; script-src 'self' 'unsafe-inline' blob: https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' blob:; img-src 'self' data: blob:; connect-src 'none'">\n<meta name="description" content="${escapeHtml(web.metadata.description)}">\n<title>${escapeHtml(web.metadata.title)}</title>\n${web.html.headSource}\n<link rel="stylesheet" href="./styles.css">\n</head>\n<body>\n${sections}\n${USER_HTML_START}\n${web.html.body.userSource}\n${USER_HTML_END}\n${generatedRegion('scene-mount', `<div id="${escapeHtml(web.html.body.sceneMountId)}" class="webforge-scene" data-webforge-scene="${escapeHtml(web.html.body.sceneMountId)}"></div>`, 'html')}\n<script type="importmap">${JSON.stringify({ imports: { three: THREE_MODULE_URL } })}</script>\n<script type="module" src="./scene.js"></script>\n</body>\n</html>\n`
  const stylesCss = `${generatedRegion('styles', generatedCss, 'css')}\n${USER_CSS_START}\n${web.css.userSource}\n${USER_CSS_END}\n`
  const sceneJs = sceneScript(document, web, assetUrls)
  const assetFiles = Object.values(document.assets).sort((a, b) => a.id.localeCompare(b.id)).map((asset) => ({ path: assetUrls[asset.id] ?? '', source: asset.source, name: asset.name })).filter((asset) => asset.path.startsWith('assets/'))
  return { indexHtml, stylesCss, sceneJs, assetFiles }
}
