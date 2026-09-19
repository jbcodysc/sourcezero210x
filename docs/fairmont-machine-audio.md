# Fairmont Junction — The City Is a Machine

`city/assets/fairmont-city-machine.wav` is a finished original composition:
108 BPM, 4/4, 84 bars, 3:06.667, 44.1 kHz 16-bit stereo PCM. It uses entirely
original procedural physical/modal sound design, without external recordings,
soundfonts, borrowed melodies, guitars, conventional drum loops, or sirens.

The main quarter-note pattern alternates hydraulic presses on beats 1/3 with
steel strikes and freight-container locking on 2/4. Separate conveyor, relay,
chain-drive, clamp, air-release, sheet-metal, and loading-carriage parts operate
between those beats. Tiny authored offsets give individual mechanisms weight
without shifting the moderate musical tempo. Pitched metal and short FM/key
phrases sit inside the machinery. Root/fifth motor bass, generator/fan layers,
and distant factory/freight horns maintain the D-modal harmonic cycle.

The arrangement begins immediately with operating machines, introduces the
fragmented motif at 0:18, increases concurrent production around 0:44, opens
out into more distant-scale machinery around 1:16, and returns to the busiest
intersection at 1:40. Maximum production runs from 2:20 to 2:47 before layers
return toward the opening machine cycle. The tempo never accelerates. Horns
serve as infrequent routine freight/shift signals, not emergency alarms.

Releases and short street reflections wrap around the loop. The asset has no
encoder padding, trailing silence, or whole-track fade. Quantized first/last
samples match in both channels; the mix has headroom, and the stereo signal is
not dual mono. `tools/compose-fairmont-machine.py` regenerates the exact asset
with Python + NumPy. `tools/fairmont-machine-verification.json` records duration,
level, seam, stereo, sections, and event counts.

The existing CityAudio manager selects these tracks:

| Place | Music |
| --- | --- |
| Fairmont streets and park | New city-machine theme |
| Transit terminal and Bolt & Bracket robotics workshop/store | New city-machine theme |
| Homes, hotel lobby/hall/bedroom, cafe, diner, clinic, books, radio shop | Supplied 82 BPM theme, preserved unchanged |
| Whole Robotics dungeon rooms | Existing dungeon track |
| Drone-factory dungeon rooms | Existing guitar-led factory track |
| Ordinary battles, A.R.G.U.S., victory, entrance cutscene | Existing combat/cutscene routing |

Street and interior scores retain separate positions and resume after regular
battles. Dungeon and battle sources are stopped before another source starts.
Chapter 1 retains its existing town/interior soundtrack. All routes continue
through the game's music manager, including visibility and mute controls.

The fountain's initial crack came from starting its looping source at the
music player's 55% default gain before applying the proximity fade. Only the
fountain now starts with zero gain and rises through the existing 120 ms
distance response. The same silent startup also applies after mute/visibility
recovery. Other music volumes and battle effects are unchanged.

`tests/fairmont-town-audio.test.mjs` checks every Fairmont location, independent
resume positions, source isolation, fountain startup/mute/re-entry, original
score duration and PCM seam, and preservation of the supplied MIDI render.
# Current runtime revision

The [September soundtrack remaster](soundtrack-remaster.md) now plays
`city/assets/music-remastered/fairmont-city.ogg`. The original WAV and score
remain unchanged. The notes below describe that preserved source composition.
