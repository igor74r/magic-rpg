# Overworld class sprite sheets

Source: **48px Animated Fantasy Characters by StewV (itch.io)**  
Original pack: https://stewv.itch.io/free-48px-animated-fantasy-characters

The three original 192×192 transparent PNG sprite sheets are preserved unchanged.
Each sheet contains 16 frames arranged as 4 columns × 4 directional rows (48×48 per frame).

## Existing game-class mapping

- `wizard.png` → Mage
- `knight.png` → Warrior
- `rogue.png` → Archer (visual substitute only; no new class is added)

The Archer keeps its existing game identity, stats, skills, and progression. Priest and other non-playable/legacy classes keep the procedural fallback. If a sheet fails to load, the previous Canvas renderer remains active.

## License

The author permits commercial and non-commercial use, cropping, modification, and re-skinning in games and media. Do not resell or redistribute the original PNGs as standalone assets, and do not claim authorship of the original pixel art. Attribution is optional; the recommended credit is:

> 48px Animated Fantasy Characters by StewV (itch.io)
