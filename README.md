# SOURCE ZERO · 210X

A browser RPG built with Phaser 3.90.0. Explore Bellwether, investigate the courier incident, and restore the waterworks beneath the town.

## Play

Once GitHub Pages is enabled, play at https://jbcodysc.github.io/sourcezero210x/.

- Walk: WASD or arrow keys.
- Interact/confirm: Z, Enter, or Space.
- Notebook/back: Escape.
- Touch controls and sound toggle are included.

The game has three save slots stored in the browser. Saves from a different website address do not transfer automatically.

## Publishing

In repository Settings → Pages, select **GitHub Actions** as the source. The included workflow publishes the game after each push to main. No Node installation or build step is required for this exported game.

Keep the city and lab folders beside each other: they share the game engine, character art, and battle modules. The root page opens the game with relative paths so it also works beneath a GitHub project path.

## Local preview

Serve this folder with an HTTP server, for example python -m http.server 8080, then open http://localhost:8080/. JavaScript modules require HTTP rather than opening index.html directly from disk.

## Dependencies

Phaser is included locally; its license is in lab/vendor/PHASER-LICENSE.md. The interface uses Google Fonts with local fallback fonts.
