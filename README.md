# SOURCE ZERO · 210X

A browser RPG built with Phaser 3.90.0. Explore Bellwether, investigate the courier incident, restore the waterworks, and follow the trail into Fairmont Junction.

## Play

Play at https://jbcodysc.github.io/sourcezero210x/.

Chapter 2 begins at Bellwether’s southern bus route after the water regulator is restored. You can also choose **Start at a chapter… → Fairmont Junction** in the main menu, select a save slot, and name your character. This creates a prepared level-15 save with 2,000 credits and Chapter 1 equipment; replacing an occupied file requires confirmation.

Fairmont is an industrial city with a partially demolished park in its northwest corner. Both dungeons have independent rooms entered through doors: 18 rooms across Whole Robotics' three floors and 32 across the five-zone Cenexis facility. Sparse encounters use stronger Chapter 2 machines, with separate map and battle art. The two drones in the scripted park attack retain their weaker stats.

The two-story Switchyard Hotel has a lobby, a guest corridor, and your private room 204. Inspect its bed to advance the nighttime story and again after the market to reach morning. A facility defeat sends you to the clinic; its return elevator unlocks beside the final boss only after victory. Bolt & Bracket sells a replacement weapon drive and upgraded vest.

The opening uses the supplied lab-coat character art, changes to the injured-arm poses after the courier fight, and switches to normal clothes after the week jump. Mira uses her supplied sheet. Ten additional supplied sheets animate Fairmont's townspeople and park protesters. Chapter 1 enemy artwork and combat balance are preserved.

- Walk: WASD or arrow keys.
- Interact: Z or Enter. Dialogue/menu confirm: Z, Enter, or Space.
- Status / Items menu and back: Escape. Left/right switches tabs only while focused on the tab row. Enter descends into a category/list; up/down selects items; left/right selects CHECK or USE. Escape returns one level.
- Quick pause/resume during exploration: Space.
- Touch controls and sound toggle are included.

The **Chapter 2 — Drone Facility** start creates a level-20 post-scan save beside the employee entrance, with the required keycard and all equipment available before A.R.G.U.S. Mandatory earlier events are complete; the optional Derek quest is unavailable and incomplete. The facility and boss remain unfinished.

The shared Status/Items menu and bottom party pause HUD read the current save model. MP stays completely hidden until `magicUnlocked`, `capabilities.magic`, or the equivalent story flag is true. Items separates ordinary items and Key Items, and marks equipped gear with a bold E. Items offers CHECK and USE; USE applies healing/equipment and requires acknowledging a result before another use. Pausing freezes world updates, scene timers, tweens, and physics without recreating the scene.

The Bellwether interlude starts with one two-second black title card, then player-paced dialogue. Its saved line resumes after reload. Floor 5 adds Sentinel assembly and diagnostics rooms before the unchanged boss-room ID; five probabilistic patrol slots use only A.R.G.U.S. Sentinels. Its healing bed is removed; the Floor 3 recovery bay remains. Facility glass doors are solid wall interactables: approach, face them, and confirm. The shared `city/doors.mjs` behavior supplies collision, approach direction, destination facing, and the existing audio manager's electronic-door cue.

The game has three save slots stored in the browser. Saves from a different website address do not transfer automatically.

## Publishing

In repository Settings → Pages, select **GitHub Actions** as the source. The included workflow publishes the game after each push to main. No Node installation or build step is required for this exported game.

For development, run `node --test tests/*.test.mjs`. The deployment workflow runs these checks before publishing. They cover saved story gates, optional quest expiry, combat rules, sprite bounds, and reachable map interactions.

Keep the city, lab and fairmont folders beside each other: they share the game engine, character art, and battle modules. The root page opens the game with relative paths so it also works beneath a GitHub project path.

## Local preview

Serve this folder with an HTTP server, for example python -m http.server 8080, then open http://localhost:8080/. JavaScript modules require HTTP rather than opening index.html directly from disk.

## Dependencies

Phaser is included locally; its license is in lab/vendor/PHASER-LICENSE.md. The interface uses Google Fonts with local fallback fonts.

Ordinary dialogue uses the original speaker-relative blue/gold boxes. Only the Bellwether cutaway uses the broad lower-screen box. The first facility unlock terminal gives A.R.G.U.S.’s unauthorized-access warning; the persistent `CH2_ARGUS_TERMINAL_WARNING_SEEN` flag suppresses repeats without changing the controls. The Sentinel has a separate compact battle portrait; its overworld sheet and combat stats are unchanged. See [Sentinel art notes](fairmont/SENTINEL_ART.md).
