# Chapter 3 — Solace: implementation and acceptance record

Scope ends at the hidden service elevator confirming that NR4 remains accessible. No NR4 interior, final Chapter 3 boss, future party member, or explanation of resonance is defined here.

## Story and persistence contract

`solace/story.mjs` uses the existing pure transition pattern: `transition(progress, event)` returns `{state, changed, effects}`. Flags follow the `CH3_` naming convention. `chapter3Sequence: {id, step}` saves cinematic progress; `resumeEvent` identifies an interrupted sequence or pending battle. Defeat clears the pending battle and enables a deliberate retry rather than immediately fighting again at the clinic. Lou's actual saved party record is created as he joins the targeted story battle; `CH3_LOU_JOINED` marks the subsequent permanent narrative commitment.

Scene scripts expose visual action tags for the bus disembarkation, contactor diagnosis and repair, refrigerator restart, Lou fetching his halberd, camera tracking, jammer activation, physical lockdown, cache access, and service elevator. The scene implementation owns animation, collisions, scene changes, sound, and input locks. No timer or renderer is embedded in the reducer.

The three initial leads are independent. Fingerprint payment costs eight credits once and awards one coffee; its diagnostic inspection is separate. Level 8 requires two wing inspections under local circuit power before energizing stair control. Level 14 requires the local relay before authorization. Level 21 requires shutters and ventilation to reach the remote control, then transfers power to traction and ventilation. Level 31 requires both opposite-wing overrides.

The medical investigation follows a guarded chain: dispatch code directory → human transport worker → vanished records → public rehabilitation receptionist → old electrical drawings → powered service route → hidden elevator. The receptionist identifies the separate contractor office; patient spaces remain private. The mission cache initially exposes only the transport code, alive condition, and medical route.

## Developer checkpoints

Developer entries are enabled only with `?dev=1`; the regular chapter menu must not list them. These starts use disposable save slots during QA.

| ID | Starting point | Level | Required evidence |
| --- | --- | --- | --- |
| `3-arrival` | Solace bus arrival | 26 | Arrival, phone, actual electrician cutaway, city exploration, reunion |
| `3-investigation` | Central district after reunion | 26 | Three leads in flexible order, targeted attack, two-member combat, jammer |
| `3-megacomplex` | Normal residential lobby | 27 | Concierge, meeting room, lockdown, every representative floor and puzzle, rooftop miniboss |
| `3-nr4` | Northern district after rooftop escape | 30 | Medical investigation, legitimate neuro center, physical power evidence, service elevator endpoint |

Checkpoints include 5,000 credits, ten of each food item, Chapter 1/2 equipment and history, and fully healed, level-matched Lou where joined. They do not mark any downstream NR4 investigation complete.

## Automated verification

Final local suite: `node --test tests/*.test.mjs` — **247 passed, 0 failed**. An independent combat review also checked the existing single-character behavior, party HP/turn persistence and reinforcements; SCRAP's flat 295-damage missile remains unchanged.

- Story tests cover required Chapter 2 completion, single-use arrival, saved line-index resume, flexible leads, fingerprint charge idempotence, party timing, interrupted-battle retries, all local puzzle prerequisites, medical lead order, scope endpoint, and hidden developer starts.
- Scene-contract tests exercise actual scene methods for world interaction IDs, circuit gates, pickups, fingerprint payments, empty saved dialogue tails, clinic retry safety, vendor catalogs and the bus return to Fairmont.
- Existing Fairmont story tests verify that archive text and the destination objective now identify Solace while preserving Chapter 2 progression.
- Automated checks do **not** substitute for the visual and interactive checklist below.

## Interactive acceptance checklist

Leave an item unchecked until observed in the launched Phaser game. Record any discovered defects and their retest beneath this checklist.

### Travel and Solace

- [x] Finish Chapter 2, return to Fairmont bus station, and see Bellwether and Solace destinations.
- [x] Travel to Bellwether and back using existing state; no earlier story resets.
- [x] Choose Solace, watch the protagonist get off the bus, then the phone call.
- [x] Watch the electrician cutaway: upstream sensor misreports normal, Lou repairs the downstream contactor, appliances work, AI repeats its line, Lou says “Now they are,” and the resident pays.
- [x] Return to the original arrival position with controls restored and no immediate combat.
- [x] Walk between the four districts; inspect daylight, clean architecture, cameras, biometric services, normal residents, and street/building collision footprints.
- [x] Verify meaningful travel separates Lou's south residential job from his northern apartment.
- [x] Enter shops and occupied homes; inspect actual doors, furnishings, and safe arrival positions.
- [x] Meet Lou; watch him fetch and return with the electro-halberd. Dialogue is enthusiastic, then skeptical and grounded; no magic explanation.

### Investigation, party, and jammer

- [x] Complete transit, delivery, and vending in a non-default order. Each saves independently.
- [x] Fingerprint payment subtracts eight credits and grants one coffee exactly once; inspect the extra classification process with Lou.
- [x] Enter the plaza only after all three leads; see tracking camera and private Cenexis targeting rather than police or a public wanted state.
- [x] Fight with both protagonist and Lou; inspect both turns, individual HP, equipment/status, and absence of MP.
- [x] Lose/reload the scripted battle; recover at the clinic and deliberately return for a retry without duplicated Lou or immediate combat in the clinic.
- [x] Win; watch approaching drones lose control after Lou activates the device, fall, and remain inert.
- [x] Confirm no visible jammer ring, pulse, wave, or player toggle. Ordinary robots continue to function.
- [x] Confirm subsequent familiar Cenexis drones still approach but drop before engagement; inert drones survive room revisits/save-load as designed.

### Megacomplex

- [x] Inspect normal lobby, concierge, packages, seating, elevator lobby and private meeting room before lockdown.
- [x] Watch blackout followed by dim red emergency lighting; Lou releases the meeting door.
- [x] Inspect physical steel lobby barrier and disabled elevators. No normal entrance escape remains.
- [x] Use the service panel, actual stair landings, and transitions to Level 8.
- [x] Route two circuits; visit both apartments/inspection nodes, then stair power. Locked routes remain blocked until their conditions hold.
- [x] On Level 14, inspect distinct gym/lounge/garden/office spaces; restore relay then bypass in separate wings.
- [x] Ride through the elevator car to Level 21; inspect mechanical equipment and complete both routing stages at different consoles.
- [x] Ride to Level 31; inspect premium apartments/lounge, stronger ground units, and both roof overrides.
- [x] Inspect doors, walls, arrival positions and collisions along the complete floor-progression route and representative side rooms; verify ordinary enemy engagement separately. Automated geometry checks cover every defined doorway and approach.
- [x] Reach the roof, hear the full Security Combat Response Autonomous Pursuer / S.C.R.A.P. callback, then fight the containment unit.
- [x] Repeat actions to observe adaptation; vary actions to recover effectiveness. Verify capture-oriented attacks and party UI.
- [x] Win, inspect the damaged but intact unit, and recover mission cache with alive condition and SLC-NR4 medical transport.
- [x] Leave over the maintenance bridge and descend the neighboring annex, without mandatory dungeon backtracking.

### Medical investigation and endpoint

- [x] Drones outside still fall to Lou's jammer while normal residents continue their lives.
- [x] Speak with dispatch, the human transport technician, and rehabilitation staff; travel between them rather than receiving the whole answer from one terminal.
- [x] See restricted route code first, then supposedly closed NR4 that still requests supplies.
- [x] Return to dispatch; the previously available record is now unavailable without a public alarm or manhunt.
- [x] Inspect the legitimate public neuro center and positive ordinary rehabilitation dialogue.
- [x] Review electrical drawings with Lou; enter the service basement and follow the live feeder.
- [x] Inspect the older service controller; NR4 appears here but not on public elevators.
- [x] See the controller confirm a working route. Save and reload `CH3_NR4_ELEVATOR_FOUND` and `CH3_NR4_AVAILABLE`.
- [x] Confirm the elevator leads to no invented NR4 map, final boss, experiment, or premature magic reveal.

### Cross-cutting checks

- [x] Save/reload each major progression segment and at least one interrupted dialogue/cinematic.
- [x] Verify controls restore after every tested sequence and transition; no duplicate NPCs or repeated mandatory story fights.
- [x] Inspect representative maps and UI visually at desktop size; dialogue fits, party status stays readable, and no horizontal or vertical text scrolling is needed.
- [x] Test regular encounters and recovery independently of story encounters.
- [x] Verify new city music and dungeon/battle handling follow the shared music manager, with no competing simultaneous tracks.

## Interactive results

The records below describe observed browser playthroughs. Unchecked items still require verification; Node tests alone do not establish visual acceptance.

### Megacomplex playthrough — 20 September 2026

Started the disposable `QA Solace` save at the normal lobby checkpoint, spoke to the concierge, and physically walked through the meeting-room door. Observed the blackout, dim red emergency lighting and Lou's local release, then returned to the lobby and checked the visibly sealed street exit. Used the service panel and separate stair landings to reach Level 8. Routed west/east power, entered both apartments and checked their nodes, collected the supply, then switched to stair power. Continued through the released stairwell rather than teleporting between floors. Saved and resumed the Level 8 state successfully.

On Level 14, visited the separate gym, indoor garden, management office and residents' café; restored the relay before the authorization panel. Inspected their detailed exercise equipment, raised planting beds, desks, sofas/rugs and café furniture. Used the elevator lobby and car to reach Level 21, routed shutters/ventilation, walked to the remote traction room, and transferred traction/ventilation there. Continued through the second elevator car to Level 31 and visited opposite private suites for both roof overrides. All of these movements used the production collision system. Roaming enemies were temporarily paused in the test wrapper for this puzzle/navigation pass; combat was tested separately.

Visual testing found duplicate elevator-door artwork and a foreground door covering the protagonist. Removed the duplicate decoration and registered physical doors with the shared occlusion system. Reloaded and inspected the corrected second elevator car: one door at each end, with the party visible behind the foreground door. Rooftop dialogue also resumed correctly from saved line index 2, at the actual interaction position, with a single containment unit.

Played the full rooftop battle at level 27 using normal attacks, guard and three field meals, without changing combat HP or stats. Observed the full Security Combat Response Autonomous Pursuer / S.C.R.A.P. exchange, compliance pulses, slowing restraint foam and charged environmental capture fields. Repeated attacks displayed `BEHAVIOR MODEL UPDATED` and reduced damage; guarding reset the prediction and subsequent strikes returned to full effectiveness. Both guards resolved before the charged attack (51 guarded damage). Each meal restored 160 HP with one acknowledgement window and consumed one item. Lou remained active after the protagonist fell, and his final strike ended the 16-turn fight. The intact overworld unit then reported movement-system failure and exposed its local mission cache.

### Arrival, reunion, and civilian exploration — 20 September 2026

Used the isolated `QA World` save in the running production Phaser game on localhost:8144. The preceding travel pass verified the completed Fairmont bus destinations and Bellwether round trip, then Solace arrival. Continued arrival and the phone call into the actual electrician cutaway: Lou walked to the kitchen controller, diagnosed the upstream sensor/downstream contactor discrepancy, repaired it, and the appliance indicator activated. The assistant repeated its normal-parameters line, Lou replied “Now they are,” and the resident approved his invoice. The scene returned to the original transit position `(1030, 1410)` with controls unlocked and no combat.

Walked through the live movement/collision system from transit to residential, across residential into the north, and into Northline Apartments. These district routes required substantial travel (55 and 72 sampled path steps before the final building approach), separating the southern service call from Lou's northern home. Watched the full reunion, including the enthusiastic sword discussion and Lou's visible departure/return with an electro-halberd. Fixed a staging issue where the initial direct tween crossed the kitchen; reloaded a saved reunion step and verified the revised clear-aisle return with the weapon visible. `CH3_LOU_MEETING_COMPLETE` saved, and exploration resumed.

Entered Lou's separate electrical workshop, checked the workbench, returned through its actual door, then walked to The Second Cup. Inspected detailed kitchen, bed, sofa/rug, desk, electrical equipment, café tables and cups, service counter, staff and guest sprites. The café offered Buy/Sell and a food-only catalog; purchasing coffee changed credits from 5,000 to 4,992. Walked onward from the north to the central district and entered Atrium Residences. Added ordinary residents to the four civilian apartment maps, then reloaded and verified Maren's bounded wandering and kitchen-assistant dialogue in the furnished central apartment. Daylight streets, building bases, cameras, service robots and biometric kiosks remained visually distinct from the industrial Chapter 2 environment. No browser runtime errors were recorded. Four world geometry tests also passed after the resident additions; all four new resident spawn positions are walkable.

### Medical investigation browser walkthrough — 20 September 2026

Launched the production Phaser scenes in the disposable `QA Medical` save on localhost:8145, starting from `3-nr4`. The authored QA controls walked the player through the live collision/movement system, without teleporting between investigation points: North District → Medical Distribution → Marta outdoors → dispatch again → public rehabilitation reception → Northline Maintenance → utility basement → restricted service access. Each real doorway transitioned successfully, with safe player positions and Lou following. Read `SLC-NR4 — RESTRICTED`, Marta's closed fourth receiving area/supply-request explanation, and then `RECORD UNAVAILABLE` on returning to dispatch. The public receptionist described real recovery work and directed the party to separate contractor records; patient areas remained inaccessible. Inspected the rendered dispatch, clinical reception, contractor office, utility equipment and service elevator, with desktop dialogue fitting its box without scrolling.

The electrical plans set `CH3_POWER_TRACE`; the older controller listed NR4 as disabled before Lou restored its service input. Completed the endpoint, observed objective `Enter NR4`, and reloaded both final flags with controls unlocked and no repeated sequence. Re-examining the controller produced only the in-world endpoint acknowledgement; no NR4 interior or future reveal was created. Browser diagnostics reported no runtime errors throughout.

Found and fixed one persistence issue: saving a story event previously retained the room's arrival position. `SolaceScene.applyEvent` now records the live location and coordinates. Retested by reloading during the service-elevator sequence at line index 1: the same controller-side position `(728, 518)` and correct dialogue line resumed, then the sequence finished normally. A scene-contract regression test covers this interrupted-sequence position capture; the 16 scene/story tests passed.


Investigation/party/jammer browser pass: the first-investigation checkpoint was played in vending → delivery → transit order using collision-walking routes and normal conversations. A separate clean payment run showed 5,000 → 4,992 credits and 10 → 11 coffees; revisiting displayed the stored classification diagnostic without charging or adding another coffee. The recovery officer/drone battle was won with both members without stat or HP cheats. Battle commands and the Status menu showed separate hero/Lou HP, stats and equipment with no MP. The commercial district, dialogue placement, security battle, drone approach/drop and party Status UI were inspected visually.

Two integration defects were found and retested: the targeted attack previously triggered across the lower half of Commercial, so it now waits within 245 world units of the central plaza camera. With all clues, the player remained free at the west-side attendant and triggered the sequence only after walking into the plaza. Resuming the join scene after the drones had approached previously recreated them too far away; resumed steps now stage them in their approached positions. A full browser reload at step 6 resumed correctly and both drones fell at the scripted cue. The inert drones survived Commercial → Transit → Commercial and save/load without duplication. A chance-spawned recovery drone subsequently approached and fell without battle; a simultaneous QA drone/ordinary-cleaner probe disabled only the drone, while the cleaner initiated normal combat. Civilian robots remained active, and no jammer ring or toggle appeared.

Developer menu and music checks: the normal chapter-start menu exposed only the three existing Chapter 1/2 starts. The same page with `?dev=1` additionally exposed all four named Solace checkpoints. Live shared-audio diagnostics showed only `ch3_solace_theme.ogg` running in the city; the regular-battle transition stopped it at offset 13.95 seconds, then only `battle.ogg` ran. After victory, only the Solace source resumed, preserving the same 13.95-second offset. Browser error diagnostics stayed empty throughout these tests.

Scripted defeat/retry check: after triggering the targeted plaza battle, an isolated QA knockout set both current party HP values to zero to exercise the loss branch. The normal Continue action recovered the party at Solace Community Clinic with `CH3_ATTACK_RETRY` and without `CH3_ATTACK_PENDING`. Reloading the page and saved game kept the clinic peaceful, controls available, and exactly one saved Lou record at full HP. The player then walked the clinic doorway → North District → Central District → plaza route through real collisions and transitions. The rematch began only on entering the plaza, with exactly the hero and Lou, and replaced the retry flag with the pending flag. A retained developer walk path discovered during this test is now cleared in scene initialization; the complete return route was retested after a page reload.

Final escape check: reloaded the saved post-victory state, returned from the bridge to the rooftop and examined the intact unit. It remained disabled and did not restart the battle. Walked the complete bridge into the service annex, then used its street door to emerge in Residential at (1720, 1262), with both escape/investigation flags saved, normal daylight and controls. Added recessed deck grating, bolted cross-members and exposed trusses to the bridge; inspected the updated structure in Phaser. The annex's electrical cabinets, HVAC and service equipment were also inspected. No mandatory dungeon backtracking or runtime errors occurred.

Final source review corrected a stale Fairmont departure-board name and removed an unintended shortcut through Theo's outdoor conversation. His positive rehabilitation dialogue now stays ordinary civilian dialogue; only the actual public receptionist supplies the contractor-office referral. A regression covers that gate. Final full suite: 247 passed, 0 failed.



Upper-floor follow-up: inspected the Level 31 premium residents' lounge, furnished private suite and corridor in the live game. With ordinary random spawns active, a Cenexis Containment Specialist approached and initiated combat. Both party members selected and resolved independent turns. The specialist called for help before a Building Maintenance Unit appeared; its new battle artwork rendered correctly, and the helper waited until the next round to attack. No runtime errors or clipped battle text were observed.

