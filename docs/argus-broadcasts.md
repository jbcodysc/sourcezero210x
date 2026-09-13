# A.R.G.U.S. facility broadcasts

The existing drone-facility rooms, gates, encounter slots, physical boss entrance, battle transition, and clinic recovery remain in place. Three new public-address beats play automatically when the hero first reaches floors **2, 3, and 5**. A saved game already inside another room on one of those floors receives that floor's announcement; it does not play a backlog of earlier announcements.

- **Floor 2 / assembly:** A.R.G.U.S. recognizes the hero's abilities and is unsurprised by the progress.
- **Floor 3 / flight validation:** It expects the security bots to finish containment and promises to intervene personally if they fail.
- **Floor 5 / integration:** It complains about the speed of the hero's arrival and employee laziness, anticipates full AI integration, and releases its own manufactured units.

All pages use `speaker: 'A.R.G.U.S.'`, `presentation: 'argus'`, and a `channel` label. The shared dialogue system supplies the dedicated top-of-screen interface and electronic typing voice. Other facility-control replies from A.R.G.U.S. also use this interface. Terminal transcripts identify themselves as recorded system logs.

The existing physical entrance leads into seven short direct-link pages. A.R.G.U.S. knows the saved player name and Bellwether identity, acknowledges the player's resonance and destruction of the robots, realizes that Cenexis has restricted that information, asserts its superiority, and issues the original recovery order before combat. The previous unresolved-identity line is removed.

## Persistence and control behavior

`fairmont/story.mjs` exposes `ARGUS_BROADCASTS`, `facilityBroadcast`, and `argusBroadcastFlag`. The normal story reducer accepts `argus-broadcast-start`, `argus-broadcast-step`, and `argus-broadcast-complete` events.

The active transmission uses `CH2_ARGUS_BROADCAST_PENDING`, `chapter2ArgusBroadcastFloor`, and `chapter2ArgusBroadcastStep`. Each acknowledged page saves the index of the next unread page through the existing save-slot system. Completion sets `CH2_ARGUS_BROADCAST_2_SEEN`, `CH2_ARGUS_BROADCAST_3_SEEN`, or `CH2_ARGUS_BROADCAST_5_SEEN`. Reloading after the final page acknowledgment safely finalizes the broadcast without showing an empty window.

Floor 5 completion sets `CH2_ARGUS_UNITS_RELEASED`. Only then may the final floor's existing random encounter slots choose `argusSentinel`. Rooms retain their previous spawn probability and enemy count; this is an additional eligible type, not a guaranteed encounter or boss.

The scene locks before its delayed story-resume callback, then uses the ordinary dialogue movement lock. Closing the broadcast restores input and clears held movement keys. It grants no immunity. The existing two-second post-battle immunity is unchanged.

Pending boss entrances/dialogue/combat take priority. Once A.R.G.U.S. has physically appeared, no belated floor broadcasts run during a rematch. Defeated A.R.G.U.S. cannot announce again. A save or defeat recovery in the clinic never teleports the player back to a transmission. Existing boss defeat, archive, elevator, and Chapter 2 completion events remain unchanged.

## Panel artwork and voice

`city/argus-dialogue.mjs` and `city/argus-dialogue.css` reuse the first frame of
the supplied `Text box.png`, stored unchanged as
`fairmont/assets/argus-panel-reference.png`. The original decorative frame,
cyan conduits, gold emblem, and dark display are retained. SVG clipping and
opaque text wells replace the sample label and message with live A.R.G.U.S.
dialogue. It spans 98% of the game width and roughly the upper quarter to third
of the screen, with larger proportional text on narrow displays.

White block-style type uses cyan and gold emphasis for selected whole words.
Text reveals through the existing typewriter and advances with Enter, Z, or the
panel button. The `argus` voice uses short stepped square/sine tones through
`CityAudio`; it honors mute and visibility, tapers each syllable to avoid clicks,
and cleans up its oscillators. The regular NPC/player dialogue remains unchanged.
No new images or music were generated for this update.

## Validation

`node --test tests/*.test.mjs`: **155 passed**, no failures.

Browser checks verified the actual floor-two broadcast, Enter acknowledgement,
save/reload onto the next unread page, restored notebook controls on completion,
the final-floor release flag, narrow-screen layout, and the terminal-to-entrance
transition followed by all seven confrontation pages and combat. A separate
Phaser preview verified all twelve Sentinel poses, walking animations, and the
standing battle portrait using the production texture preparation code.

Battle narration now uses a smaller font and fits the entire reserved message
inside one box without scrolling or truncation. The layout is measured before
typing and after window/font changes, leaving the original action timing intact.
The actual A.R.G.U.S. battle introduction and Guard feedback were checked in the
browser; the introduction's scroll height equaled its visible height. Desktop
presentation is the priority for subsequent work; phone-specific optimization
is not required.

`tests/fairmont-broadcasts.test.mjs` checks all floor/room trigger combinations, actual save-slot round trips, one-time completion, invalid and backward page indices, release timing, enemy-pool restrictions, scene movement locking, interrupted/resumed dialogue, last-page reload, encounter priority, clinic recovery, post-victory silence, and the requested dialogue content. Existing story and scene-integration tests also validate the longer direct-link conversation and unchanged boss progression.
