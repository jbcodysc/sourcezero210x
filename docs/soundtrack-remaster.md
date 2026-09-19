# Soundtrack remaster — September 19, 2026

Logical track IDs, scene assignments, resume positions, volume settings and
battle timing are preserved. Six eligible music loops and two musical cues now
load quality-7 OGG Vorbis from `city/assets/music-remastered/`. SFX (sword, bash,
fountain, speech, doors, alarm and boosters) remain unchanged. The power-on
screen, lab and narration retain their intentional silence.

Old files remain in their original paths for rollback. A second original archive,
48 kHz/24-bit stereo WAV masters, bass stems where source parts exist, compressed
game files and editable sources are under the workspace's
`outputs/soundtrack-remaster/{original,masters,game,source}`. The approved Chapter
3 demo and its full 2:40 expansion are separate and are not routed into the game.

| Track / ID | Location/event | Original asset | New asset | Production / bass approach | Loop / browser check |
| --- | --- | --- | --- | --- | --- |
| Bellwether / town | Chapter 1 streets and interiors | `city/assets/town.wav` | `town.ogg` | Same 1,017 note events; dispersive plucked guitar/body model, flute breath, resonant drum kit; stronger articulated fingerstyle bass | PCM/OGG checked; town scene checked |
| Robot in the Reagent Room / battle | Normal encounters, Chapter 1 bosses, K.A.R.E.N. | `lab/assets/robot-in-the-reagent-room.wav` | `battle.ogg` | Same 1,517 note events; voiced EP, muted guitar, drum kit and picked bass | PCM/OGG checked; K.A.R.E.N. battle checked |
| Boop at the Name Desk / menu | File/chapter/name selection | `city/assets/name-select.wav` | `menu.ogg` | Original formant syllables and 463 score events; 96 kHz voice rendering, fuller plucked bass and refined keys/drums | PCM/OGG checked; save screen checked |
| Fairmont interior / fairmontTown | Homes, hotel, clinic, cafe and public interiors | `city/assets/fairmont-junction-industrial-town.wav` | `fairmont-interior.ogg` | Supplied MIDI's 1,437 events retained; FM/tine voices, pad and articulated bass with mapped metallic rhythm | PCM/OGG checked; clinic checked |
| The City Is a Machine / fairmontCity | Fairmont streets, transit, robotics store | `city/assets/fairmont-city-machine.wav` | `fairmont-city.ogg` | Original 84-bar horn/machine form; centered motor bass, improved keys/mallets and 48 kHz physical machinery | PCM/OGG checked; streets checked |
| Below the Intake / dungeon | Waterworks and Whole Robotics | `city/assets/below-the-intake-waterworks.mp3` | `waterworks.ogg` | Original recording retained; low resonance, low-mid clarity and restrained spatial treatment | PCM/OGG checked; Whole Robotics checked |
| Fanfare | 2.8-second battle transition | `city/assets/battle-start-guitar.wav` | `fanfare.ogg` | Recording retained; guitar presence and bass-body balance, softened sample edges | One-shot duration/decoding checked; transition checked |
| Victory | 2.5-second battle won cue | `city/assets/battle-victory.wav` | `victory.ogg` | Recording retained; final low hit, synth presence and stereo sparkle balance | One-shot duration/decoding checked; reward mode checked |

## Locked — not modified

- **Drone facility / factory:** `city/assets/ch2_drone_factory_theme.wav`.
- **A.R.G.U.S. battle / argus:** `city/assets/ch2_argus_battle_theme.wav`.

Both retain their exact bytes, paths, mix and loop points. SHA-256 checks protect
them and verify that all other original assets also remain unchanged.

## Limits and verification

No new sampled instrument library was available. New voices are explicitly
designed synthesis/physical models, not claimed recordings or a real orchestra.
Waterworks and the two short cues had no recoverable editable note/stem sources;
these received individual recording-based remasters, not instrument replacement.
The obsolete tuba fanfare, duplicate package exports, unused jungle demos and
test audio were excluded from the active soundtrack inventory.

Every master is stereo 48 kHz/24-bit. Decoded OGG frame counts match the masters.
Loops retain their original musical lengths and circular tails; a 1.5 ms residual
endpoint correction removes tiny waveform steps, never a fade to silence.
Short cues retain 2.8/2.5-second handoffs. Peaks remain below clipping, with
per-track balance rather than identical normalization. Masters are approximately
−16 to −20 dBFS RMS, depending on role; the locked tracks are not normalized.

169 automated game tests passed, including routing, pause/mute/visibility,
resume positions, scene progression, collision access and new locked-file hash
checks. Browser checks confirm asset decoding, track assignment and visible
scene/battle operation. These are **technical/playback checks, not subjective
audition**; perceptual instrument quality and emotional balance require listening.
Reports are in `tools/soundtrack-remaster-*.json`.
