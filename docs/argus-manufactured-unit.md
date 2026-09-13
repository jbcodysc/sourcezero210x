# A.R.G.U.S. manufactured unit

The user-supplied `ChatGPT Image Sep 12, 2026, 03_02_12 PM.png` is preserved unchanged at `fairmont/assets/argus-manufactured-unit-sheet.png`. No images were generated for this update.

`fairmont/argus-unit-sprites.mjs` measures the twelve supplied robot poses independently, excluding the four row labels and unused sheet space. At load time only the black matte connected to a pose's outer edges becomes transparent. Enclosed dark armor details remain opaque. All four directions animate through the three source poses; a uniform source scale and feet anchoring prevent size jumps. The high-detail front standing pose is also used for the stationary battle portrait. Phaser uses nearest-neighbor texture filtering.

The A.R.G.U.S. Sentinel has 558 HP, 101 attack, and a 156 charge attack, approximately 12% above the Tracked Fabricator. It remains a normal enemy with the existing miss, charge, silliness, reinforcement, and reward rules. Its reinforcement is an ordinary Validation Drone; no other enemy can summon a Sentinel.

The normal final-floor encounter pool includes Sentinels only after `CH2_ARGUS_UNITS_RELEASED`. Earlier facility floors, Whole Robotics, and city encounters never include them. Room spawn slots, density, and per-room chance are unchanged (the current rooms specify 72%; the shared fallback is 82%). A spawn remains a chance, and safe supply, rest, and boss rooms remain safe from patrol creation.
