# Chapter 2 facility and A.R.G.U.S. audio

## Standing direction for future soundtrack work (September 18, 2026)

“Retro JRPG” describes composition, not hardware restrictions. Use modern,
high-quality rendered instruments, samples, or well-developed sound design;
do not impose SNES channel, sample-rate, bit-depth, or synthesis limitations
unless authentic retro synthesis is explicitly requested.

Bass must be a prominent, meaningful part of every new or revised track unless
explicitly requested otherwise: an identifiable sound, intentional musical part,
clear note definition, substantial mix presence, and appropriate rhythmic or
melodic interest. This does not require distortion, exaggerated sub-bass, or solos.
These standing rules do not authorize remixing previously approved music.

The Chapter 3 “Everything, Almost” 30-second approval demo is a separate local
production under `outputs/chapter3-city-demo` in the parent workspace. It is not
integrated with the game or a replacement for any current track.

## Existing Chapter 2 implementation

These are finished original rendered compositions, not placeholder tracks. All
instruments are synthesized from authored note/rhythm events and seeded noise;
there are no imported recordings, soundfonts, vocals, or borrowed musical phrases.
The guitar uses a plucked string harmonic model, saturation and speaker filtering.
The files are stereo 44.1 kHz, 16-bit PCM WAV. PCM avoids compressed encoder delay
at the loop boundary. Both scores wrap their releases and room reflections into
the opening rather than fading out at the end.

| Asset in `city/assets/` | Music / role |
| --- | --- |
| `ch2_drone_factory_theme.wav` | “Assembly Pressure”: 126 BPM, 32 bars, 60.95 seconds. Low palm-muted guitar hook, bass pedal, metallic machinery, active hats/cymbals, restrained electronic support. Exploration loop. |
| `ch2_argus_battle_theme.wav` | “Coordinated Resistance”: 168 BPM, 48 bars, 68.57 seconds. Immediate original guitar hook, driving section, higher refrain, lower bridge, hook return. Distorted rhythm/lead guitar, bass, rock drums, crashes and tom fills. Instrumental boss loop. |
| `argus-security-alarm.wav` | 2.2-second looping electronic security siren. |
| `argus-blue-boosters.wav` | 1.2-second looping turbine/exhaust effect with electronic whine. |
| `argus-stabilize.wav` | 0.62-second restrained low impact and short servo lock. |

`CityAudio` uses the existing shared Web Audio context and `BattleMusic` manager:

- `factory` selects the factory loop with position preserved across interruptions.
- `battle` remains the regular encounter track.
- `argus-entrance` stops every music source so the alarm dominates.
- `argus-battle` selects the boss loop from its beginning. The battle scene sets
  this only when the existing transition finishes and combat UI opens.
- Muting or hiding the page immediately stops its effect sources. Active alarm
  and booster loops resume when visible and enabled, only while the entrance is
  still in progress. Leaving entrance mode or explicitly stopping an effect
  clears its intent, so completing the scene while hidden cannot revive a siren.
  Entrance effects cannot play in another mode.

The entrance calls `effect('security-alarm')`, `effect('argus-boosters')`, and
`effect('argus-stabilize')`. The first two loop until `stopEffects(key)`; the last
is a one-shot. Repeated loop requests never create duplicate sources. An asset
that finishes downloading after its effect was stopped cannot start late.

To re-render, run `python tools/compose-ch2-audio.py` with NumPy installed. The
script writes the assets above and `tools/ch2-audio-verification.json` (tempo,
bar count, sample rate, duration, peak, RMS and loop boundary measurements).
`node --test tests/ch2-audio.test.mjs` checks actual audio files and source lifetime,
resume position, music exclusivity and effect cleanup with the production manager.

If replacing a rendered mix with a studio performance later, replace the two
exact WAV paths above with seamless full-length loops; no game code changes are
needed. Keep `city/audio.mjs` pointing to those files rather than the Chapter 1
waterworks track. The old waterworks track remains in use for its own dungeon.
