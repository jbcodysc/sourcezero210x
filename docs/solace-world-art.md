# Solace world and original art

Created with the built-in image-generation tool on 2026-09-20. The original transparent PNGs are preserved in the repository; runtime atlas frames trim only transparent margins. No external image hosts or generated-image cache paths are required by the game.

- `solace/assets/solace-buildings.png`: eight original Solace facades. Clean ivory, teal glass, graphite and brass architecture; transit terminal, café, residential tower, megacomplex, component shop, clinic, medical logistics and rehabilitation center.
- `solace/assets/solace-amenities.png`: twelve original amenity sprites: concierge, biometric vending, service kiosk, kitchen, gym, raised garden, lounge, package lockers, electrical distribution cabinet, HVAC, stairs and elevator.
- `solace/assets/lou-walk.png`: sixteen original walking/idle poses for Lou, in four directions, with a teal work jacket, tools, radio and work boots.
- `solace/assets/residential-enemies.png`: original floor steward, luggage porter, maintenance robot and slender Series 8 containment machine, each with separate map and battle artwork.

Generation prompts specified isolated transparent sprites with gutters, no labels or scenery, crisp detailed illustrated pixel art, consistent daylight and a front/top three-quarter JRPG view. Lou's prompt specified an adult early-20s electrician, sturdy build, dark-blond hair, expressive pixel eyes, consistent clothing and four walking poses per direction. The atlas framing is measured independently of output resolution.

The equipped electro-halberd is a small code-native pixel sprite: metallic pole, insulated grip, forked cutting head and cyan electrodes. It is not a repurposed scenery object.

`solace/world.mjs` defines four connected 2400×1680 districts plus separate furnished interiors. The megacomplex has real corridor, stairwell, elevator-lobby, elevator-car, apartment and amenity maps for floors 1, 8, 14, 21, 31 and the roof. The roof bridge exits through a neighboring service structure. The route ends at the NR4 service elevator and contains no NR4 dungeon.

Movement uses alpha-fitted building bases, furnishing footprints, boundary walls and the game's shared physical door collision geometry. Visual depth and shared occlusion preserve walk-behind buildings and readable characters. `tests/solace-world.test.mjs` checks all arrivals, all door destination positions, full collision-free access to every door and story interaction, building-base geometry and gated vertical routes.

## Soundtrack

`city/assets/ch3_solace_theme.ogg` is the user's previously approved full “Everything, Almost” composition, copied from the Chapter 3 full-theme output. It uses the existing shared audio manager, preserves its playback position through encounters, and plays in Solace's districts and civilian interiors. Lockdown exploration uses the existing rendered dungeon track; battles retain the existing combat music. No new retro hardware restriction or separate audio engine was introduced.
