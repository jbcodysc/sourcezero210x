# Fairmont Junction supplied interior music

Runtime update: the [September remaster](soundtrack-remaster.md) now plays
`city/assets/music-remastered/fairmont-interior.ogg`. The original MIDI and WAV
remain unchanged; the implementation below documents that preserved original.

The supplied `Fairmont_Junction_Industrial_Town_Theme.mid` is preserved unchanged
in `city/assets/`. The original implementation README is preserved alongside this
document as `Fairmont_Junction_Industrial_Town_Theme_README.txt`.

Browser playback uses `city/assets/fairmont-junction-industrial-town.wav`: a
44.1 kHz, 16-bit stereo render of all seven MIDI parts, preserving pitches,
velocities, note timing, volume/pan, the 82 BPM tempo, and the full 52-bar
LOOP_START–LOOP_END range (152.195 seconds). The final-bar instrument tails and
room reflections wrap into the beginning rather than adding silence or padding.

`tools/render-fairmont-town.py` regenerates the WAV using Python and NumPy.
Its mechanical percussion follows the README mapping: piston press, steel
strike, pipe clank, relay/gear clicks, pneumatic release, soft low reinforcement,
distant metallic resonance, and occasional pipe strikes. The MIDI also contains
closed hi-hats, retained as muted metallic hi-hats. Sounds are synthesized;
no third-party samples or soundfonts are required. The machine-readable render
report is `tools/fairmont-town-verification.json`.

The existing CityAudio manager owns this `fairmontTown` track. Following the
subsequent city-machine soundtrack request, it is retained in Fairmont's homes,
coffee shop, diner, clinic, bookstore, radio shop, and hotel lobby, hallway, and
bedroom. The street, transit terminal, and robotics workshop/store instead use
the new original industrial-city score described in `fairmont-machine-audio.md`.
Each score retains its own playback position when changing places or entering
battle. Mute and tab visibility continue to use the existing controls.

Whole Robotics and the drone facility retain their existing dungeon themes.
The A.R.G.U.S. entrance and boss battle keep their existing audio. Chapter 1's
town track is unchanged. Tests cover every Fairmont location and source isolation.
