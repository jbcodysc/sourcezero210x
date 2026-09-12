# A.R.G.U.S. encounter

The final integration terminal now starts a scene-owned `ArgusEntrance` event.
Existing maps, doors, archive progression, encounter counts, battle rules and
the electric battle transition remain in place.

- 2.25 seconds of red/blue room tint and wall lamps, alternating every 300 ms.
- 1.55-second diagonal descent from above the viewport, with twin cyan/blue
  stepped exhaust effects attached to the chassis.
- A restrained stabilization sound, 160 ms camera shake, brief exhaust burst,
  then 550 ms before the normal dialogue takes over.
- The chassis is scenery during the event and dialogue, never a patrol or an
  interactable. Input uses the existing `arrival`, `locked`, dialogue and
  `transitioning` state. Effects, timers and tweens belong to this scene.

`fairmont/story.mjs` persists entrance start, flight and landing checkpoints;
each acknowledged dialogue line; and the existing pending battle flag. A reload
resumes the unfinished phase. A completed entrance is not replayed after a
clinic recovery. Old saves with a pending battle continue directly into combat.
Victory clears the active encounter and enables the original archive and lift.

Regular Chapter 2 enemies have approximately 12% more HP and attack/charge
damage. Bosses and the guard have approximately 10% more. The two scripted
survey drones retain their previous stats, and Chapter 1 is unchanged.

Audio assets, original score descriptions and reproduction instructions are in
[chapter-2-audio.md](chapter-2-audio.md).

## Verification

Run `node --test tests/*.test.mjs`. Tests cover timed flight/effect cleanup,
control locking, dialogue and battle ordering, real save-slot round trips at
each phase, legacy pending saves, clinic retries, archive/lift progression,
music exclusivity/resume, PCM loop continuity and existing Chapter 1/2 behavior.

Browser checks used disposable localhost saves and the actual Phaser game:

- Recorded red and blue frames, the chassis descending from above the screen,
  attached twin boosters, and clean shutdown before dialogue. Movement and
  notebook input during the alert did not move the hero or open a menu.
- Reloaded an interrupted flight and an acknowledged dialogue line; each
  recovered to one chassis and the correct dialogue without duplicate combat.
- Completed an actual A.R.G.U.S. fight at level 20 with upgraded equipment,
  then read the original archive through the Chapter 2 completion screen.
- Lost a low-health A.R.G.U.S. fight and recovered at Junction First Aid with
  no pending encounter. A terminal retry skipped the completed flight. The
  unlocked service elevator still returned to the receiving foyer.
- Completed a normal factory encounter. Browser Web Audio diagnostics recorded
  the factory loop stopping at the battle, regular battle music playing alone,
  and the factory loop resuming at offset 2.312 seconds afterward.
- Browser audio nodes confirmed the siren/boosters started and stopped during
  the entrance, all music stopped during dialogue, and the 68.571-second boss
  track began when the combat UI appeared. No browser errors were reported.

The QA fixture/capture page is outside the deployed repository. Production
save files were not used or altered by these checks.
