FAIRMONT JUNCTION — INDUSTRIAL TOWN THEME
=========================================

File:
  Fairmont_Junction_Industrial_Town_Theme.mid

Purpose:
  Seamlessly looping Chapter 2 town/exploration theme for Fairmont Junction.

Musical spec:
  Tempo: 82 BPM
  Meter: 4/4
  Key center: D minor / modal mixture
  Length: 52 bars
  Approx. duration: 152.20 seconds (2:32)
  Loop markers: LOOP_START at bar 1, LOOP_END after bar 52

MIDI tracks:
  1. Warm Synth Pad
  2. Soft Electric Piano
  3. Bell / Mallet Lead
  4. Subdued Synth Bass
  5. Mechanical Arpeggio
  6. Atmospheric Machine Hum
  7. Industrial Percussion (GM channel 10)

Arrangement:
  Bars 1–6   : Industrial ambience / gradual harmonic introduction
  Bars 7–18  : Main melody
  Bars 19–28 : Variation + quiet mechanical arpeggio
  Bars 29–36 : Breakdown / breathing space
  Bars 37–48 : Main melody return with variation
  Bars 49–52 : Simplified outro returning naturally to loop start

Important implementation note:
  Standard MIDI cannot carry custom factory samples. The percussion track uses
  General MIDI percussion notes (low floor tom, ride bell, low agogo,
  woodblocks, vibraslap, etc.) as placeholders for the intended industrial
  sounds. For the final game mix, Codex/audio tooling can remap these notes to
  custom steel impacts, pipe hits, hydraulic thumps, relay clicks, steam
  releases, and machine samples while preserving the rhythm.

Recommended sample mapping:
  GM 41 Low Floor Tom -> deep machine press / piston impact
  GM 53 Ride Bell     -> light steel strike
  GM 68 Low Agogo     -> pipe / metal clank
  GM 76/77 Woodblock  -> relay / gear click
  GM 58 Vibraslap     -> pneumatic pressure release
  GM 36 Bass Drum 1   -> very soft low mechanical reinforcement
  GM 51 Ride Cymbal   -> distant metallic resonance
  GM 56 Cowbell       -> occasional pipe strike

The final bar is intentionally sparse so a loop back to bar 1 feels natural.
