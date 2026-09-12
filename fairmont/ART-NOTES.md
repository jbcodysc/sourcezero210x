# Fairmont artwork

Original artwork generated with the built-in image-generation tool, using the supplied room illustration for warm pixel-art direction and the supplied normal protagonist sheet for citizen scale. Existing enemy artwork was not modified.

Runtime assets:

- `assets/fairmont-buildings.png`: eight complete isolated facades; hotel, electronics shop, robotics market, cafe, apartment, warehouse, drone facility, bus terminal.
- `assets/fairmont-props.png`: sixteen separate trees, park/camp props, interior furnishings, retail shelves, and industrial equipment.
- `assets/fairmont-citizens.png`: six independent citizens; shopkeeper, guard, technician, older woman, Derek, protester.
- `assets/fairmont-bosses.png`: K.A.R.E.N. in a compact wearable security exosuit and A.R.G.U.S. in a dedicated security chassis.

The PNGs retain the generated chroma-key matte. `prepareFairmontArt` removes that matte once into Phaser canvas textures and trims the silhouettes, preserving crisp contours. No terrain or collisions are baked into the images.

Generation prompt set: detailed warm hand-painted pixel clusters with deep navy contours, amber lighting, tactile brick/wood/metal, teal technology; original 210X human-scale industrial city; isolated sprites with front faces horizontal and visible roofs/tops; complete nonoverlapping silhouettes, no labels, no floor, no checkerboard, flat magenta for chroma key. Facades occupy a four-by-two atlas. Props occupy a four-by-four atlas. Citizens are six full-body figures in one row, dressed for their individual roles. Bosses are two detailed full-body still portraits; K.A.R.E.N. is human-sized rather than a giant mech. The initial facade generation's checkerboard was replaced in a built-in image edit while preserving the buildings.

Renderer contracts: building `x,y` is top-left of its allocated rectangle and `w,h` its maximum size; the facade uses uniform scale and stands at `(x+w/2,y+h)`. Props and citizens use bottom-center world anchors and y sorting. The map owns all collision geometry. New boss textures are `fairmont-karen` and `fairmont-argus`, each also exposing a `portrait` frame.

## Chapter 2 revision: supplied citizens and new machine enemies

The ten `assets/citizen-sheet-01.png` through `assets/citizen-sheet-10.png` files are byte-identical copies of James's `ChatGPT Image Sep 11, 2026, 04_59_06 PM (1).png` through `(10).png`. No source pixels were changed. `citizen-sheets.mjs` measures 160 individual front/left/right/back poses from their actual transparent outlines. Sheets 1–5 are placard-carrying protesters, and 6–10 are ordinary townspeople. The renderer corrects the handful of left-row poses drawn facing right by flipping those frames at runtime. Sign holders keep the same body scale as ordinary citizens, with additional height for the sign.

New original artwork was produced with the **built-in image-generation tool**, not the CLI:

- `assets/fairmont-enemies-v2.png`: 1024 × 1536 atlas. Six machine designs, each with a small overworld sprite and an independently composed, more detailed battle image. Rows: commercial scrubber, stockroom hauler, compliance scanner, precision test drone, armored interceptor drone, tracked welding arm. Texture keys are `fairmont-enemy-{cleaner,stock-hauler,compliance,test-drone,heavy-drone,assembly-arm}-{map,battle}`, all also exposing a `portrait` frame. The original bosses and Chapter 1 security art remain available.
- `assets/fairmont-park-details.png`: 1536 × 1024 transparent atlas. Eight separated props: excavated dirt mound, uprooted stump/roots, fallen tree, excavator, broken path, intact flowerbed, wood-and-iron bench and two-tier splashing fountain. These are individual objects with clear depth; the world map supplies the division between intact park and active demolition.
- `assets/fairmont-hotel-two-storey.png`: 1536 × 1024 source with one complete two-story hotel facade: ground lobby and entrance plus exactly one bedroom floor, flat roof, no dormers or third story. Only building `id: 'hotel'` uses this facade, preserving the clinic's existing art.

All three final assets were visually inspected. The enemy atlas was rearranged once to provide sufficient transparent gutters between the bottom two machines, and its generated checkerboard backing was replaced by a uniform magenta matte in a second built-in edit. `keyedTexture` removes this matte in the game; the PNG itself is retained unchanged. The park PNG has genuine alpha transparency, which is preserved. The measured park crops exclude all neighboring objects and do not cut through opaque edges.

Daytime facade textures use scene-lighting color lifts generated at runtime; outside ground materials are similarly raised to sunlit values. The original source files remain intact. The new hotel is painted for daylight directly.

### Final prompt set

**Enemy atlas generation:** “Original 2D pixel-art RPG enemy sprite atlas for SOURCE ZERO 210X, Fairmont industrial city. Six rows, two columns; left column compact simple overworld sprite, right column more detailed full-silhouette static battle portrait of the same machine. Rows: teal bulldog-shaped commercial floor scrubber with rotating brushes and detergent tank; mustard stockroom forklift with load basket; white/red telescoping compliance scanner with optical rings and triangular tread base; silver/cyan four-wing precision test drone; bulky crimson/black six-rotor armored interceptor; orange three-joint welding arm with cable coil on tank treads. Rich clean hand-painted pixel clusters, navy outlines, material detail and neutral daylight. No labels or people, isolated full silhouettes.”

**Enemy layout edit:** “Reorganize the exact six pairs into a tall 1024 × 1536 portrait sheet, two columns and six evenly spaced rows. Preserve the designs, add large empty gutters between every row and column, keep sparks and wings completely within each rectangle. No overlaps or labels.”

**Enemy backing edit:** “Keep exact robots, positions, sizes and spacing unchanged. Replace every gray checkerboard area behind, between and inside silhouettes with one perfectly uniform #FF00FF backdrop. No checkerboard, texture, shadow, wrinkle or gradient in the backing. Retain red scanner wedges and blue/yellow sparks.”

**Park atlas:** “Exactly four columns by two rows of isolated detailed pixel-art scenery objects: fresh irregular dirt mound with rocks/torn sod/roots; uprooted stump with tangled roots and soil; fallen leafy mature tree with broken branches; compact yellow tracked excavator; ripped-up footpath slabs exposing roots; intact oval brick-edged flowerbed; wood-and-black-iron park bench; round two-tier stone fountain with spouting and splashing turquoise water. Front-three-quarter overhead JRPG view, fine pixel clusters, navy outlines, tactile materials, bright neutral daylight. Separate complete silhouettes, no labels, people, floors or buildings. Genuinely transparent background.”

**Hotel facade:** “Use the existing building atlas only as style/material reference. One new isolated hotel with exactly two floors total: ground floor with centered double entrance and broad common-room windows, plus a single upper row of four bedroom windows. No third floor, attic, dormer or roof windows. Low flat slate roof with parapet and a small ventilation unit. Red brick, cream stone trim, teal awning, blank hotel sign between floors. Straight horizontal front view from slightly above, warm detailed pixel art, navy outlines. Clear bright daylight, pale sky reflected in curtained windows, no lit lamps. Whole complete building on uniform #FF00FF; no text or checkerboard.”
