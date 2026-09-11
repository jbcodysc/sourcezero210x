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
