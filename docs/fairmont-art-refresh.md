# Fairmont interior and city refresh

## Implemented

- Thirteen standalone illustrated RGBA furniture and equipment sprites in
  `fairmont/assets/interior-v2/`, registered by `fairmont/interior-art.mjs`.
  Original files are preserved; runtime texture frames exclude transparent margins.
- The clinic has examination beds, diagnostic carts, a glazed medicine cabinet,
  privacy screens, padded indoor seating, pale mint walls, and ceramic flooring.
- Hotel reception, luggage amenities, woven rugs, and cafe table settings replace
  crude furniture shapes. Existing detailed domestic furnishings remain in bedrooms.
- Whole Robotics uses consumer robot displays and stocked retail shelving.
  Manufacturing rooms use robotic assembly cells; testing rooms use enclosed drone rigs.
  Offices and storage retain illustrated desks, consoles, servers, shelving, and crates.
- Fairmont measures 4,190 by 3,770 pixels, approximately 27% less area than before.
  Two noninteractive infill buildings tighten the streetscape. Nine cross-block
  passages remain available, and roof-to-street gaps are about 45–55 pixels.
- Old outdoor save coordinates migrate once to the compact layout. Interior saves,
  subsequent travel, shallow building footprints, and rear service entrances remain valid.
- Harlan's initial/repeated bargain and its journal objective imply help after
  Whole Robotics suffers misfortune, without hotel or entrance directions.
- Chapter 2 selection starts at level 15 with 2,000 credits, the insulated grip,
  insulated work vest, and two sandwiches. Ordinary playthroughs are unaffected.

## Art sources and exact prompts

Generation stopped when the user requested that no further pictures be generated.
The already completed assets were sufficient to finish this pass.

- [Clinic and textile assets](clinic-interior-art.md), with
  [five exact prompts](clinic-interior-prompts.json).
- [Four public interior assets and exact prompts](public-interior-art.md).
- [Four robotics assets and exact prompts](robotics-interior-art.md).

## Validation

`node --test tests/*.test.mjs`: **131 passed**, no failures.
Coverage includes door/objective reachability, furniture footprints, all city
entrances and shortcuts, one-time save migration, chapter-start stats, dialogue,
and existing combat, audio, progression, and cutscene behavior.

Local browser inspection covered the clinic, dense city block, hotel lobby,
coffee shop, Whole Robotics showroom, manufacturing room, and drone testing room.
No browser errors or warnings were reported.
