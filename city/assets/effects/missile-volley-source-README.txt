A.R.G.U.S. Missile Volley FX Asset

Files:
- argus_missile_volley_fx_sheet.png  (sprite sheet)
- missile_volley_00.png .. missile_volley_35.png (individual transparent frames)

Specs:
- total frames: 36
- frame size: 1196x790
- layout: 6 columns x 6 rows
- fps: 18
- duration: 2.00 seconds
- transparency: yes

Recommended implementation:
- play the sprite animation as a full-screen overlay
- keep screen shake and flash as engine-side Phaser effects, not baked into the sprites
- lock battle input during playback
- apply damage on the explosion impacts, not at launch
