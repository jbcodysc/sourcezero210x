# Speed, escape and recovery

Speed is derived from level: `level + 4`. Existing saves need no migration.
Level 12 has speed 16, matching the Floor Steward and Contract Security, close
to Compliance Scanner's 17. Ground haulers and fabricators are slower; pipe
rats (36), survey drones (48), and validation drones (52) are very fast.
All enemy speeds are authored in the existing enemy definitions.

Each round rolls a new initiative order after the player selects a command.
Every living participant gets one action. Initiative uses speed to the fourth
power in an exponential race, so ordering remains consistent with multiple
enemies. Against one opponent:

| Player : enemy speed | Player acts first | Escape chance |
| --- | --- | --- |
| 5 : 5 | 50% | 30% |
| 6 : 5 | 67.46% | 35.81% |
| 10 : 5 | 94.12% | 52.08% |
| 30 : 10 | 98.78% | 65% |

Escape uses `30% + 35% × log(speed ratio) / log(3)`, clamped to 5–75%,
against the fastest surviving enemy. Run takes its place in normal initiative:
fast enemies can act before the attempt. Failure consumes the player's turn.
Success awards no XP/credits, sets no victory flags, and leaves the overworld
patrol alive. HP and spent items persist. Returning starts the same existing
two-second post-battle immunity used by other battle exits; doors do not grant
immunity. Bosses, the courier tutorial and the scripted guard/two-drone ambush
remain mandatory, with Run visibly disabled.

Guard begins when the player takes that action and lasts until their next
action, so a slow guard is still useful against the next round's faster enemies.
Reinforcements begin acting next round; defeated enemies lose queued turns.
Charged enemies still release their attack on their next turn, independently
of silly-action and reinforcement rolls. Everyone retains the 5% attack miss rate.

Goods opens a consumable selector. Hearty field meals cost 200 credits and
restore up to 160 HP, sold at Fairmont food/retail services alongside sandwiches.
They stack in inventory and work in the field or in battle. Battle recovery
requires acknowledgement and cannot accidentally consume another item.

HP drains at 12 HP/sec (previously 24), and recovers at 24 HP/sec. The recovery
counter continues upward behind its confirmation; falling HP stays paused during
notices. Damage and healing continue to share the rolling HP target. Speed appears
in Status, the battle HUD, and the existing level-up gains window.

Level 20 is no longer a cap. Total XP thresholds remain `25 × (level − 1)²`,
so each next level requires more XP. Higher levels validate and round-trip through
the same save system. Normal growth remains +12 max HP, +3 attack, +2 defense,
and now +1 speed each level.

A.R.G.U.S. Sentinels now have 614 HP, 111 attack and 172 charged attack
(rounded 10% increases). They never call help, have a 5% silly-action chance,
and retain the separate 5% attack miss chance. Boss A.R.G.U.S. also uses a 5% silly-action chance. The Run command hides odds; the current command has a persistent highlighted cursor.

Validation includes seeded probability sampling, multi-enemy queue behavior,
charged attacks, guard duration, successful/failed escapes, mandatory encounters,
item purchases/consumption, rolling HP rates, level 100 and old/new save loading.
Browser checks covered the Chapter 2 meal purchase, animated recovery and its
acknowledgement, drone initiative and failed escape, successful escape and music
resumption, and level 21 with all four stat gains visible in the battle/menu UI.
