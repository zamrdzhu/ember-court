// Ember Court — the deck, the deal, and the trick-taking rule.
// A card is { suit, rank, id }: the id is "<suit>-<rank>", unique across
// the deck, and is what the state machine and the renderer pass around.

import { HAND_SIZE, JESTER_RANK, CROWN_RANK, RANKS, SUITS, TRUMP_CYCLE } from './config.js';import { seededShuffle } from './rng.js';

// Build the full 36-card deck: ranks 1 to 9 in each of the four suits.
export function buildDeck() {
  const deck = [];
  for (const suitId of TRUMP_CYCLE) {
    for (const rank of RANKS) {
      deck.push({ suit: suitId, rank, id: `${suitId}-${rank}` });
    }
  }
  return deck;
}

// Deal a match from a seeded shuffle: nine cards to the player, nine to
// Rook, and the other eighteen stay undealt in the box.
export function dealMatch(random) {
  const shuffled = seededShuffle(buildDeck(), random);
  return {
    player: shuffled.slice(0, HAND_SIZE),
    rook: shuffled.slice(HAND_SIZE, HAND_SIZE * 2),
    undealt: shuffled.slice(HAND_SIZE * 2),
  };
}

// The suit that trumps a given suit: the next one round the cycle.
export function trumpSuitOf(suitId) {
  return SUITS[suitId].beats;
}

// Does suit `a` trump suit `b`?
export function suitTrumps(a, b) {
  return SUITS[a].beats === b;
}

// Does `follower` take the trick over `lead`? The checks run in the
// order the rules give them: Jester over Crown, Crown over anything but
// a Jester, trump over the led suit, then a higher card of the same suit.
// A Jester that is not facing a Crown is just a 1 of its suit.
export function followerWins(lead, follower) {
  if (follower.rank === JESTER_RANK && lead.rank === CROWN_RANK) return true;
  if (follower.rank === CROWN_RANK && lead.rank !== JESTER_RANK) return true;
  if (suitTrumps(follower.suit, lead.suit)) return true;
  if (follower.suit === lead.suit && follower.rank > lead.rank) return true;
  return false;
}

// Name a card in words, for the log and for Rook's thoughts.
export function cardName(card) {
  if (card.rank === JESTER_RANK) return `Jester of ${SUITS[card.suit].name}`;
  if (card.rank === CROWN_RANK) return `Crown of ${SUITS[card.suit].name}`;
  return `${SUITS[card.suit].name} ${card.rank}`;
}

// The short label a card corner carries: JESTER, CROWN, or the number.
export function cornerLabel(card) {
  if (card.rank === JESTER_RANK) return 'JESTER';
  if (card.rank === CROWN_RANK) return 'CROWN';
  return String(card.rank);
}

// Sort a hand for display: by suit round the cycle, then by rank.
export function sortHand(hand) {
  const order = {};
  TRUMP_CYCLE.forEach((suitId, index) => {
    order[suitId] = index;
  });
  return hand.slice().sort((a, b) => {
    if (order[a.suit] !== order[b.suit]) return order[a.suit] - order[b.suit];
    return a.rank - b.rank;
  });
}
