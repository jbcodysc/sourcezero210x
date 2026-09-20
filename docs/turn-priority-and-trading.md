# Turn priority, trading, and late Chapter 2 balance

Healing goods and Guard act before every enemy, without changing the enemies’ relative speed order. Guard expires when that round ends. A help action first displays the caller’s announcement; only after that presentation does the helper appear, with its own arrival message. Calling and arriving each consume that character’s turn. The helper joins the next round’s initiative queue. Three living enemies give a flat 66% escape chance, subject to the existing story/boss escape restriction.

Caramel macchiato heals 15 HP and grants +30% speed for three full following combat rounds. The drinking round does not spend a boosted round because items already have priority. Another cup refreshes the duration without stacking. Remaining rounds persist across battles and saves; using coffee outside combat prepares three boosted rounds for the next encounter. Coffee can be used at full HP.

S.C.R.A.P.’s missile volley deals a fixed 295 damage, split across its existing three impacts. Guard reduces the total to 89; the existing miss chance is unchanged. Only the five words of his spoken designation use slower typing, italic metallic lettering, and shimmer.

## Shop behavior

Existing merchandise shops in both towns open Buy/Sell after their greeting. Buy preserves their original stock. Sell lists regular items, excludes key items, and pays half the item’s value rounded down. Equipped gear has a bold E and cannot be sold. Unequipped gear asks for confirmation, defaulting to No; cancellation returns to item selection. Each completed sale has an acknowledgement before another item can be sold.

Canonical purchase prices supply resale values. The found insulated work vest has a value of 100 credits and sells for 50. The insulated grip costs 85 and sells for 42. Gear ownership is now explicit in the inventory. Older saves migrate their formerly implicit weapon upgrades once, so selling an unequipped upgrade does not make it reappear after a reload.

## XP tuning

Levels through 22 retain their original thresholds. For `n = level - 22`, the cumulative threshold above level 22 is `11025 + 2688*n + 538*n*(n-1)`. There is no level cap.

| Level change | XP required |
| --- | ---: |
| 22 → 23 | 2,688 |
| 23 → 24 | 3,764 |
| 24 → 25 | 4,840 |
| 25 → 26 | 5,916 |

The first increase is approximately 2.5 times the former 1,075-XP requirement. Each subsequent level adds 1,076 XP to the requirement, increasing the number of fights needed as levels rise. Older saves preserve their level, stats, and fractional progress to the next level through a one-time versioned migration.

Drone-facility rewards rise about 25%: facility security 465, test drone 440, heavy drone 570, assembly arm 610, sentinel 675, and S.C.R.A.P. 1,200 XP. Whole Robotics, city, and the two scripted drones retain their rewards.

## Verification

Automated coverage verifies action priority, round-limited Guard, reinforcement timing, escape odds, coffee duration, fixed missile damage, XP requirements and save migration, gear ownership and resale, and designation typing. Browser checks exercised Fairmont and Bellwether shops, equipped-item rejection, Yes/No gear sales, buying, the styled introduction, a very slow hero acting first with Guard and coffee, and an announcement followed by a helper that waits until the next round to attack. The QA fixture uses separate disposable local saves and is not shipped with the game.
