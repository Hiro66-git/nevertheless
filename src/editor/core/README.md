# Editor core boundary

The editor document is the persistent source of truth. Commands mutate cloned documents, history stores reversible command objects, and `SceneRuntime` synchronizes document projections with Three.js.

The React panels remain compatible with the existing `objects` projection during this incremental refactor. New editor features should target the document and command APIs instead of mutating Three.js or React components directly.
