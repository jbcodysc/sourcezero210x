# Battle feedback

Player action text remains for 1.8 seconds after typing completes, including
misses, guarding and the finishing blow. Commands stay locked through this
reading pause; XP/rewards are applied after the finishing message completes.

Using a sandwich opens a small confirmation with the actual recovered HP,
capped by missing health. Combat waits for Enter (or the existing Z/touch
confirmation). Dismissal releases one enemy response and cannot use another
item. The confirmation also pauses rolling HP while it is open.

Battle-earned level increases show a large animated rainbow announcement,
followed by maximum HP, attack and defense increases with before/after values.
The second confirmation returns to exploration without another result prompt.
Multiple levels are summarized using the final level and total actual stat
gains. Equipment bonuses are preserved. Reduced-motion settings keep the
rainbow text static.

`playerStats` supplies both combat values and the level-up comparison, avoiding
separate display-only stat formulas. Existing XP and stat growth are unchanged.
Rewards remain guarded against duplicate application.

Tests in `tests/battle-feedback.test.mjs` execute the real battle scene handlers
to check reading duration, blocked duplicate actions, healing confirmation,
finishing-blow ordering, two-step dismissal, multi-level stat calculations and
rolling-HP defeat during a reading pause.
