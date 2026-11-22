// Ember Court — the match state machine. Deterministic given a seed:
// the same seed deals the same hands, and the same plays settle the
// same way. The renderer and the input wiring only ever read this state
// and call these functions; they never mutate it themselves.

import { TOTAL_TRICKS } from './config.js';
import { cardName, dealMatch, followerWins } from './deck.js';
import { mulberry32 } from './rng.js';

// A fresh match, still on the title screen: trick 1, both hands dealt,
// an empty table, no tricks or points yet, and the Jester unseen.
export function createMatch(seed) {
  const random = mulberry32(seed);
  const dealt = dealMatch(random);
  return {
    seed,
    phase: 'title',
    trickNumber: 1,
    leader: 'player',
    playerHand: dealt.player,
    rookHand: dealt.rook,
    undealt: dealt.undealt,
    table: { lead: null, follow: null },
    tricks: { player: 0, rook: 0 },
    points: { player: 0, rook: 0 },
    captured: { player: [], rook: [] },
    seen: { jester: false, crowns: 0 },
    log: ['The court is set. Nine tricks will decide who takes it.'],
    thought: '',
    winner: null,
  };
}

// Open the match: leave the title screen and start trick 1.
export function startMatch(match) {
  if (match.phase !== 'title') return false;
  match.phase = 'playing';
  match.log.push('You lead the first trick. Play a card.');
  return true;
}

// Whose turn is it for the player: 'lead', 'follow', or 'none' — none
// while Rook is thinking, while a trick settles, or off the table.
export function turnForPlayer(match) {
  if (match.phase !== 'playing') return 'none';
  if (match.table.lead === null) {
    return match.leader === 'player' ? 'lead' : 'none';
  }
  if (match.table.follow === null) {
    return match.leader === 'rook' ? 'follow' : 'none';
  }
  return 'none';
}

// Play the player's card. Legal only on the player's turn and only with
// a card from the player's hand. Returns the played card, or null.
export function playPlayerCard(match, cardId) {
  const turn = turnForPlayer(match);
  if (turn === 'none') return null;
  const index = match.playerHand.findIndex((card) => card.id === cardId);
  if (index === -1) return null;
  const card = match.playerHand[index];
  match.playerHand.splice(index, 1);
  placeOnTable(match, 'player', card);
  return card;
}

// Rook plays a card into the lead or the follow slot, whichever is open
// for it. Returns the played card, or null when it is not Rook's turn.
export function playRookCard(match, card) {
  if (match.phase !== 'playing') return null;
  const index = match.rookHand.findIndex((held) => held.id === card.id);
  if (index === -1) return null;
  if (match.table.lead === null && match.leader === 'rook') {
    match.rookHand.splice(index, 1);
    placeOnTable(match, 'rook', card);
    return card;
  }
  if (match.table.lead !== null && match.table.follow === null && match.leader === 'player') {
    match.rookHand.splice(index, 1);
    placeOnTable(match, 'rook', card);
    return card;
  }
  return null;
}

// Put a card on the table, note a Jester or a Crown seen, and log it.
function placeOnTable(match, side, card) {
  if (card.rank === 1) match.seen.jester = true;
  if (card.rank === 9) match.seen.crowns += 1;
  if (match.table.lead === null) {
    match.table.lead = { card, side };
    match.log.push(`${side === 'player' ? 'You lead' : 'Rook leads'} with ${cardName(card)}.`);
  } else {
    match.table.follow = { card, side };
    match.log.push(`${side === 'player' ? 'You answer' : 'Rook answers'} with ${cardName(card)}.`);
  }
}

// Settle a finished trick: the winner banks both cards and their ranks
// as court points, and leads the next trick. After trick 9 the phase
// becomes over and the winner is decided. Returns the winner's side.
export function settleTrick(match) {
  if (match.table.lead === null || match.table.follow === null) return null;
  const { lead, follow } = match.table;
  const followerTook = followerWins(lead.card, follow.card);
  const winner = followerTook ? follow.side : lead.side;
  const points = lead.card.rank + follow.card.rank;
  match.tricks[winner] += 1;
  match.points[winner] += points;
  match.captured[winner].push(lead.card, follow.card);
  match.log.push(
    `${winner === 'player' ? 'You take' : 'Rook takes'} the trick (+${points} points).`,
  );
  match.table = { lead: null, follow: null };
  match.leader = winner;
  if (match.trickNumber >= TOTAL_TRICKS) {
    match.phase = 'over';
    match.winner = decideWinner(match);
    // The table goes quiet on the end screen: no thought behind the
    // overlay, and the banner and trick area are already empty.
    match.thought = '';
    match.log.push(verdictLine(match));
  } else {
    match.trickNumber += 1;
    match.log.push(
      match.leader === 'player' ? 'You lead the next trick.' : 'Rook leads the next trick.',
    );
  }
  return winner;
}

// The winner rule: most tricks; tied tricks go to the most court
// points; a tie on both is a dead heat and nobody takes the court.
export function decideWinner(match) {
  if (match.tricks.player !== match.tricks.rook) {
    return match.tricks.player > match.tricks.rook ? 'player' : 'rook';
  }
  if (match.points.player !== match.points.rook) {
    return match.points.player > match.points.rook ? 'player' : 'rook';
  }
  return 'draw';
}

// The verdict line, in words, for the end screen and the log.
export function verdictLine(match) {
  const you = `${match.tricks.player} tricks, ${match.points.player} points`;
  const rook = `${match.tricks.rook} tricks, ${match.points.rook} points`;
  if (match.winner === 'player') return `You take the court — ${you} to Rook's ${rook}.`;
  if (match.winner === 'rook') return `Rook takes the court — ${rook} to your ${you}.`;
  return `A dead heat — ${you} each. Nobody takes the court.`;
}

// How many cards each side still holds.
export function handCounts(match) {
  return { player: match.playerHand.length, rook: match.rookHand.length };
}
