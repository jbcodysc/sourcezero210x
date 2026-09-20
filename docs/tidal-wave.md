# DELUGE tidal wave

Only the Chapter 1 water-regulator boss uses this move. On its first eligible
turn at or below 20% HP, it substitutes a tidal wave for its usual action.
An already charged attack releases first; the wave waits until the next eligible
turn. It is used once per encounter, resets on a fresh attempt, and never fires
after the boss dies. No text announces the threshold or narrates the animation.

The move has 150 raw power. Existing defense, Guard, the 1.3 enemy damage
multiplier and the 5% miss rate apply. A level-10 hero with the insulated work
vest takes 165 damage unguarded or 51 guarded (218 maximum HP). Damage changes
the rolling HP target only at impact. Ordinary attacks and rewards are unchanged.

## Assets and presentation

- `city/assets/effects/tidal_wave_fx_sheet.png`: exact supplied transparent PNG,
  byte-identical to the copy in `tidal_wave_fx_asset.zip`. No MP4 or captured
  battle image is used. 20 frames, 299×198, five columns, four rows, 18 FPS,
  one playback lasting approximately 1.11 seconds.
- `city/assets/tidal-wave-rush.wav`: original 44.1 kHz stereo water sound.
  `tools/render-tidal-wave.py` reproduces its pressure surge, filtered turbulence,
  bubbles and spray. Zero endpoint samples and soft envelopes avoid clicks.
  The user's explicit request for sound takes precedence over the attachment's
  earlier no-sound instruction. Uses the existing CityAudio mute/visibility and
  source-cleanup controls; the crest aligns with frame 16.

`city/screen-attacks.mjs` owns the reusable effect. Phaser loads the sheet and
registers the animation once. Water initially renders at depth 50, with battle
enemies at 100. At frame 9, the same frame transfers to a transparent screen
canvas above the HTML HUD, with identical cover geometry and nearest-neighbor
pixels. This bridge is necessary because Phaser depth cannot overlap HTML UI.
The battle, HP and background remain live throughout.

Frame 16 applies damage once, flashes pale cyan for 120 ms and shakes the
camera briefly. The `enemyAnimation` phase prevents commands, target changes
and turn advancement. Completion destroys the sprite/canvas/tween, stops the
sound and resumes the existing initiative queue. Defeat or scene shutdown
cancels the effect without a delayed hit. The short numerical damage/miss
result uses the existing battle reading pause after the animation clears.

## Validation

Automated coverage includes threshold boundaries, one use per fight, charged
attack priority, Guard, misses, delayed/idempotent impact, queue continuation,
shared animation registration, scene cancellation and repeated cleanup.
Browser checks cover transparency, behind/enemy/front/HUD ordering, impact
timing, live rolling HP, healing afterward and water-restoration victory flags.
Test-only frame holds and combat checkpoints are outside the repository.
