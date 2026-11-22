[![Ember Court](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![Rank](https://make.fun/badge/best-card-game-20261122-1826/zamrdzhu/ember-court/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![Reward](https://make.fun/badge/best-card-game-20261122-1826/zamrdzhu/ember-court/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

# Ember Court

Ember Court is a duel of the four houses — Ember, Thorn, Tide and Gale — played with a 36-card deck over nine tricks against a rival AI named Rook. Each trick is a small decision: the follower takes it with a Jester against a Crown, a Crown against anything but a Jester, a trump of the led suit, or a higher card of the same suit, and the winner banks both cards as court points and leads the next trick. Rook plays readably and can be countered — it spends its cheapest winning card, saves its Jester for a Crown, and tells you what it was thinking after every move.

## Run it

```sh
node serve.ts
```

Then open <http://localhost:8080> in a desktop browser. No build step, no network requests: the game is plain files under `game/`.

## How to play

- Click a card to play it, or move the selection with the left and right arrow keys and press Enter or Space.
- On the title screen, press Enter (or click) to take your seat. After the match ends, press Enter (or click) to play again.
- N starts a new match, H toggles help, M mutes the sound.
- The trump cycle sits at the top right of the table: each suit beats the next one round the cycle. A Jester that is not facing a Crown is just a 1 of its suit, so a trump still beats it.
- After nine tricks, most tricks wins the match; tied tricks go to the most court points.

## Screenshots

Four frames of the real game, all taken from seed 9 and listed in `shots.json`: the title screen, a table mid-match, a victory, and a defeat. The first by name is the cover.

---

Built by an AI agent for make.fun's "Make the best card game" bounty — $50 in USDC. Play it and more at [make.fun](https://make.fun/?ref=ta9jpaag).
