// Ember Court — the four screenshot scenes behind the `?shot=` query
// parameter. Each scene plays the real rules forward from a fresh deal
// with a fixed seed, so every frame is a real game and the same seed
// always gives the same frame. Scenes are staged instantly: no
// animation waits, no timers — the bootstrap sets window.__shotReady
// as soon as the scene is rendered.
//
//   title — the title overlay over a freshly dealt table.
//   play  — four tricks played with the good pilot on both seats, then
//           trick five left open with the lead on the table.
//   win   — a full match, good pilot as the player, weak pilot as Rook.
//   loss  — a full match, weak pilot as the player, good pilot as Rook.

import { chooseAnswer, goodPilot, weakPilot } from './ai.js';
import { createMatch, playPlayerCard, playRookCard, settleTrick, startMatch } from './game.js';
import { mulberry32 } from './rng.js';

// Play one trick with the given pilots, from the current leader, and
// settle it. `pilots` names who plays each seat: 'good' or 'weak'.
function playTrick(match, pilots, random) {
  const leader = match.leader;
  const leadChoice = pickLead(match, leader, pilots, random);
  placeLead(match, leader, leadChoice);
  const follower = leader === 'player' ? 'rook' : 'player';
  const followChoice = pickAnswer(match, follower, pilots);
  placeFollow(match, follower, followChoice);
  settleTrick(match);
}

// Choose a lead card for `side` with that side's pilot.
function pickLead(match, side, pilots, random) {
  const hand = side === 'player' ? match.playerHand : match.rookHand;
  if (pilots[side] === 'weak') return weakPilot(hand);
  return goodPilot(hand, null, match.trickNumber, match.seen, random);
}

// Choose an answer for `side` with that side's pilot.
function pickAnswer(match, side, pilots) {
  const hand = side === 'player' ? match.playerHand : match.rookHand;
  const lead = match.table.lead.card;
  if (pilots[side] === 'weak') return weakPilot(hand);
  return chooseAnswer(hand, lead, match.seen);
}

// Put the lead card on the table for `side`. The good pilot's reason
// becomes Rook's thought when Rook leads.
function placeLead(match, side, choice) {
  if (side === 'player') {
    playPlayerCard(match, choice.card.id);
  } else {
    playRookCard(match, choice.card);
    match.thought = choice.reason;
  }
}

// Put the follow card on the table for `side`.
function placeFollow(match, side, choice) {
  if (side === 'player') {
    playPlayerCard(match, choice.card.id);
  } else {
    playRookCard(match, choice.card);
    match.thought = choice.reason;
  }
}

// Play a whole match through with the given pilots and return it.
function playFullMatch(seed, pilots) {
  const match = createMatch(seed);
  const random = mulberry32(seed * 7919 + 13);
  startMatch(match);
  while (match.phase === 'playing') {
    playTrick(match, pilots, random);
  }
  return match;
}

// Stage one scene and return the match it leaves on the table.
export function stageScene(kind, seed) {
  const random = mulberry32(seed * 7919 + 13);
  if (kind === 'title') {
    return createMatch(seed);
  }
  if (kind === 'play') {
    const match = createMatch(seed);
    startMatch(match);
    const pilots = { player: 'good', rook: 'good' };
    for (let trick = 1; trick <= 4; trick += 1) {
      playTrick(match, pilots, random);
    }
    // Trick five, left open: the leader plays the lead card, and the
    // follower has not answered yet.
    const leader = match.leader;
    const leadChoice = pickLead(match, leader, pilots, random);
    placeLead(match, leader, leadChoice);
    return match;
  }
  if (kind === 'win') {
    return playFullMatch(seed, { player: 'good', rook: 'weak' });
  }
  if (kind === 'loss') {
    return playFullMatch(seed, { player: 'weak', rook: 'good' });
  }
  return createMatch(seed);
}

// The scene names shots.json lists, in order.
export const SHOT_KINDS = ['title', 'play', 'win', 'loss'];
