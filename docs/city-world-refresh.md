# City collision, interiors, and exploration update

Both chapters use full rendered character rectangles for encounter contact,
including head-to-feet and edge contact. A relative swept-box check also catches
contact crossed between frames. Movement still uses ground footprints. Scripted
dialogue/cutscenes retain their input locks and boss triggers.

Returning from any completed battle grants exactly 2,000 ms of encounter immunity.
The deadline starts after the exploration scene creates its player. Doors,
dialogue, menus, first aid, and loading a save never grant or refresh immunity.
Travel during the existing recovery period preserves its deadline. The timer is
transient and is not stored in saves.

Bellwether and Fairmont buildings now block their shallow ground bases. Fairmont
base widths use the same measured, aspect-fitted image dimensions as rendering.
Upper floors and roofs do not block movement. Buildings become translucent when
an actor walks behind them; overlapping tree canopies also render below affected
characters so the player and NPCs remain visible.

Whole Robotics and the drone factory have drawn rear doorways, thresholds, and
card readers immediately behind their bases. Interior exits return to those same
positions. Existing credentials and story gates are retained.

Fairmont Commons is about 19% larger, with five solid flower beds and physical
construction fencing. The story characters retain reachable positions. Whole
Robotics has 19 independent encounter positions instead of 11 (the nearest whole
number to a 75% increase), each retaining its 72% roll. Supply rooms and foyers
remain safe; the drone facility's encounter count is unchanged.

`fairmont/interior-design.mjs` supplies themed furniture, equipment, and physical
obstacles to both rendering and movement/pathfinding. Cafés have espresso service,
pastries, employees, tables, and patrons; the hotel has reception, lounge, luggage,
and guests. Homes, shops, clinic, transit, offices, storage, assembly, and test rooms
have distinct plans. Existing room instances, doors, stairs, supplies, terminals,
story flags, and save data remain in use. Stale save positions recover to clear
floor away from new furniture and NPCs.

See `fairmont-machine-audio.md` for the new original outdoor score, retained public
interior music, unchanged dungeon music, and the fountain startup fix.

Validation includes full-box and swept contact, postbattle recovery boundaries,
all building perimeters in both chapters, canopy/roof visibility, every Fairmont
room's reachable objectives and encounters, and actual rendered audio files.
