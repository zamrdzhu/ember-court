// Ember Court — Rook's brain, and the two pilots the screenshot scenes
// use. Every choice comes back as { card, reason }: the card to play and
// a one-line reason in plain words, so the table can show what Rook was
// thinking. Rook's choices are meant to be readable and counterable.

import { CROWN_RANK, JESTER_RANK, SUIT_ORDER, TOTAL_TRICKS } from './config.js';
import { cardName, followerWins } from './deck.js';

// How much a card costs to spend on taking a trick. A plain same-suit
// win is cheapest, a trump win costs more, the Crown more still. The
// Jester costs nothing against a Crown — and is never spent to win any
// other way, however cheap the trump looks: it is saved for a Crown.
function winCost(card, lead) {
  if (card.rank === JESTER_RANK) {
    return lead.rank === CROWN_RANK ? 0 : Number.POSITIVE_INFINITY;
  }
  if (card.suit === lead.suit) return 1 + card.rank;
  if (card.rank === CROWN_RANK) return 100 + card.rank;
  return 50 + card.rank;
}

// The cheapest card in `hand` that takes the trick over `lead`, with the
// spend ordering above. The Jester is never offered as a winning card
// unless the lead is a Crown. Returns null when nothing in the hand wins.
function cheapestWin(hand, lead) {
  const winners = hand.filter(
    (card) =>
      followerWins(lead, card) &&
      !(card.rank === JESTER_RANK && lead.rank !== CROWN_RANK),
  );
  if (winners.length === 0) return null;
  winners.sort((a, b) => winCost(a, lead) - winCost(b, lead) || a.rank - b.rank);
  return winners[0];
}

// The lowest card in a hand, by rank first, then by suit round the cycle.
function lowestCard(hand) {
  return hand.slice().sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    return SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit];
  })[0];
}

// Has every Crown been seen on the table already? While one may still
// come, the Jester stays in the hand.
function allCrownsSeen(seenCrowns) {
  return seenCrowns >= 4;
}

// Rook answers a lead. It plays the cheapest card that takes the trick,
// preferring a plain same-suit win over a trump win, and a trump win over
// spending the Crown; the Jester comes out only against a Crown. When
// nothing wins it sheds its lowest card, but never throws the Jester
// away while a Crown may still come.
export function chooseAnswer(hand, lead, seen) {
  const win = cheapestWin(hand, lead);
  if (win) {
    if (win.rank === JESTER_RANK) {
      return { card: win, reason: 'Rook answers your Crown with the Jester — the one card that beats it.' };
    }
    if (win.suit === lead.suit) {
      return { card: win, reason: `Rook answers with the cheapest ${cardName(win)} that takes the trick.` };
    }
    if (win.rank === CROWN_RANK) {
      return { card: win, reason: 'Rook spends the Crown to take the trick — it must want this one badly.' };
    }
    return { card: win, reason: `Rook trumps with the cheapest trump that takes the trick, ${cardName(win)}.` };
  }
  const sheddable = hand.filter(
    (card) => !(card.rank === JESTER_RANK && !allCrownsSeen(seen.crowns)),
  );
  const shed = lowestCard(sheddable.length > 0 ? sheddable : hand);
  if (shed.rank === JESTER_RANK) {
    return { card: shed, reason: 'Every Crown has been seen, so Rook finally lets the Jester go.' };
  }
  return { card: shed, reason: 'Nothing in Rook\u2019s hand takes the trick, so it sheds its lowest card.' };
}

// Rook leads a trick. It usually leads its lowest card, but late in the
// match — the last three tricks — it will lead the Crown about three
// times in five once the Jester has been seen played, hoping to draw out
// a big answer.
export function chooseLead(hand, trickNumber, seen, random) {
  const crown = hand.find((card) => card.rank === CROWN_RANK);
  const late = trickNumber > TOTAL_TRICKS - 3;
  if (late && crown && seen.jester && random() < 0.6) {
    return { card: crown, reason: 'Late in the match, Rook leads the Crown — the Jester is already gone.' };
  }
  const low = lowestCard(hand);
  return { card: low, reason: `Rook leads low with ${cardName(low)}, keeping its strength back.` };
}

// The good pilot: Rook's own instincts, played from the player's seat.
// It answers with chooseAnswer and leads with chooseLead.
export function goodPilot(hand, lead, trickNumber, seen, random) {
  if (lead) return chooseAnswer(hand, lead, seen);
  return chooseLead(hand, trickNumber, seen, random);
}

// The weak pilot: it always plays its lowest card, whatever the table.
// The screenshot scenes use it as the losing side.
export function weakPilot(hand) {
  const card = lowestCard(hand);
  return { card, reason: 'The weak pilot plays its lowest card.' };
}
