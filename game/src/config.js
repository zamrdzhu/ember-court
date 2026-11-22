// Ember Court — configuration: the four houses, the ranks, the table.
// Every number and colour the rest of the game reads lives here, so a
// balance tweak never means hunting through the renderer or the AI.

// The four suits. Each one is told apart by colour AND by its pip shape,
// never by text alone. `beats` names the suit this suit trumps.
export const SUITS = {
  ember: {
    id: 'ember',
    name: 'Ember',
    color: '#E8492F',
    dark: '#9E2410',
    pip: 'flame',
    beats: 'thorn',
  },
  thorn: {
    id: 'thorn',
    name: 'Thorn',
    color: '#3D9E4D',
    dark: '#1E5C2A',
    pip: 'leaf',
    beats: 'tide',
  },
  tide: {
    id: 'tide',
    name: 'Tide',
    color: '#2E7DE1',
    dark: '#174A8F',
    pip: 'droplet',
    beats: 'gale',
  },
  gale: {
    id: 'gale',
    name: 'Gale',
    color: '#D9A521',
    dark: '#8A6408',
    pip: 'swirl',
    beats: 'ember',
  },
};

// The trump cycle, in order: each suit beats the next one, and the last
// beats the first again.
export const TRUMP_CYCLE = ['ember', 'thorn', 'tide', 'gale'];

// The same order as a lookup, for sorting hands and breaking ties.
export const SUIT_ORDER = { ember: 0, thorn: 1, tide: 2, gale: 3 };

export const TRUMP_SENTENCE = 'Each suit beats the next suit in the cycle.';

// The ranks in a suit: 1 is the Jester, 9 the Crown.
export const RANKS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
export const JESTER_RANK = 1;
export const CROWN_RANK = 9;

// A match: nine cards each, nine tricks, eighteen cards never dealt.
export const HAND_SIZE = 9;
export const TOTAL_TRICKS = 9;
export const DECK_SIZE = 36;

export const RIVAL_NAME = 'Rook';

// Card geometry, in CSS pixels, on the 1280 by 800 stage.
export const CARD_WIDTH = 96;
export const CARD_HEIGHT = 136;
export const BACK_WIDTH = 72;
export const BACK_HEIGHT = 102;

// The stage the table is drawn on; JavaScript scales it to the window.
export const STAGE_WIDTH = 1280;
export const STAGE_HEIGHT = 800;

// Timing: how long Rook thinks before answering, and how long a finished
// trick rests on the table before it is banked.
export const RIVAL_THINK_MS = 750;
export const TRICK_SETTLE_MS = 1100;

// One pip per suit, drawn as an inline SVG path on a 24 by 24 grid.
export const PIP_PATHS = {
  flame:
    'M12 2.5 C12 2.5 5.5 9.5 5.5 14.5 a6.5 6.5 0 0 0 13 0 C18.5 9.5 12 2.5 12 2.5 Z' +
    ' M12 11 C12 11 9.5 13.5 9.5 16 a2.5 2.5 0 0 0 5 0 C14.5 13.5 12 11 12 11 Z',
  leaf:
    'M12 3 C6.5 7.5 4.5 13 5.5 19.5 C11.5 21 17.5 17 18.5 10.5 C19.2 6 16 3 12 3 Z' +
    ' M12 5.5 C12 5.5 11 12 12.5 18.5',
  droplet:
    'M12 2.5 C12 2.5 5.5 12 5.5 15.8 a6.5 6.5 0 0 0 13 0 C18.5 12 12 2.5 12 2.5 Z',
  swirl:
    // A two-turn spiral, wound out from the centre: drawn as a stroke,
    // it reads as a swirl at any size. The points are a plain Archimedean
    // spiral round (12, 12); the arms sit about 3.5 units apart, wider
    // than the stroke, so they never merge into a blob.
    'M12.8 12 L12 13.7 L9.5 12 L12 8.6 L16.3 12 L12 17.1 L6 12 L12 5.2 L19.7 12',
};

// The three rules, in plain words, as the title screen shows them.
export const RULE_LINES = [
  'Each trick, the leader plays a card and the other answers. The follower takes the trick with a Jester against a Crown, a Crown against anything but a Jester, a trump of the led suit, or a higher card of the same suit.',
  'A Jester that is not facing a Crown is just a 1 of its suit, so a trump still beats it.',
  'The trick winner banks both cards, their ranks are court points, and leads the next trick. After nine tricks, most tricks wins; tied tricks go to the most court points.',
];
