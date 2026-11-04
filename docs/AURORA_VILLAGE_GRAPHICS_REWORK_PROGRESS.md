# Aurora village art integration — progress

## Imported source artwork
- Basic Village Tileset by Forchild, CC0 1.0.
- Source sheets are stored in assets/aurora/village-pack/.
- Aurora runtime variants are darkened with a flat color transform and retained as PNG pixel art.
- Original source sheets and the license note are preserved beside the adapted images.

## Runtime integration
- ui/overworld/aurora-village-pack.js loads the local nature and house sheets only.
- Oak, pine, bush, hedge and fence visuals use real sprite-sheet frames.
- Sampling is nearest-neighbour (imageSmoothingEnabled = false).
- If an image cannot load, the existing Aurora renderer remains as a fallback.
- Existing building geometry, map coordinates, interactions and collision rectangles are not changed.

## Validation
- check-aurora-village-pack.mjs: passed.
- check-village-layout.mjs: passed (38x28, 7 residents, 13 interaction points, 8 buildings, 24 wall segments, 947 reachable cells).
- check-imports.mjs: passed.
- check-offline.mjs: passed.
- Full check-*.mjs sweep: 66 passed, 2 failed because the local Desktop Commander package's expected dist/index.html and ui/inventory.js files are absent. These failures are unrelated to Aurora.
- browser-smoke-cdp.mjs did not complete: its prologue voice-control assertion failed before entering gameplay. A gameplay screenshot has therefore not yet been verified.

## Remaining work before calling Aurora complete
- Inspect the village in a running browser at desktop and mobile sizes.
- Confirm the new tree/fence sprites visually align with existing object anchors and depth sorting.
- Decide whether the house/ground sheets should replace or augment the existing custom building and terrain art after visual comparison.
- Do not merge this feature branch into main until visual review and all relevant checks pass.