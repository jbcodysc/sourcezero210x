# SOURCE ZERO · 210X

A browser RPG built with Phaser 3.90.0. Explore Bellwether, investigate the courier incident, restore the waterworks, and follow the trail into Fairmont Junction.

## Play

Play at https://jbcodysc.github.io/sourcezero210x/.

Chapter 2 begins at Bellwether’s southern bus route after the water regulator is restored. Existing Chapter 1 saves continue normally. Fairmont includes an explorable city, an optional coffee favor, a three-floor retail dungeon, and a five-zone active robotics facility. Its day/night changes are driven by the story and the hotel.

The opening uses the supplied lab-coat character art, changes to the injured-arm poses after the courier fight, and switches to normal clothes after the week jump. Mira uses her supplied sheet. Existing enemy artwork is preserved.

- Walk: WASD or arrow keys.
- Interact/confirm: Z, Enter, or Space.
- Notebook/back: Escape.
- Touch controls and sound toggle are included.

The game has three save slots stored in the browser. Saves from a different website address do not transfer automatically.

## Publishing

In repository Settings → Pages, select **GitHub Actions** as the source. The included workflow publishes the game after each push to main. No Node installation or build step is required for this exported game.

For development, run `node --test tests/*.test.mjs`. The deployment workflow runs these checks before publishing. They cover saved story gates, optional quest expiry, combat rules, sprite bounds, and reachable map interactions.

Keep the city and lab folders beside each other: they share the game engine, character art, and battle modules. The root page opens the game with relative paths so it also works beneath a GitHub project path.

## Local preview

Serve this folder with an HTTP server, for example python -m http.server 8080, then open http://localhost:8080/. JavaScript modules require HTTP rather than opening index.html directly from disk.

## Dependencies

Phaser is included locally; its license is in lab/vendor/PHASER-LICENSE.md. The interface uses Google Fonts with local fallback fonts.
