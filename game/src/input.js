// Ember Court — keyboard and mouse wiring. Clicks on cards go through
// the callbacks the bootstrap hands in; this module only decides which
// keys mean what, and keeps the selection moving across the hand.

import { sortHand } from './deck.js';

// Wire the keyboard. `actions` is what the bootstrap does for each key:
// start (from the title or an end screen), playSelected, moveSelection,
// newMatch, toggleHelp, toggleMute.
export function wireKeyboard(actions) {
  window.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      actions.moveSelection(event.key === 'ArrowRight' ? 1 : -1);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      actions.playSelected();
      return;
    }
    const key = event.key.toLowerCase();
    if (key === 'n') actions.newMatch();
    else if (key === 'h') actions.toggleHelp();
    else if (key === 'm') actions.toggleMute();
  });
}

// Wire clicks on the overlays: a click on the title overlay takes the
// seat, a click on an end overlay starts a new match, a click on the
// help overlay closes it.
export function wireOverlays(actions) {
  const overlay = document.querySelector('#overlay');
  overlay.addEventListener('click', () => actions.playSelected());
  const help = document.querySelector('#help-overlay');
  help.addEventListener('click', () => actions.toggleHelp());
}

// Move the selection across the player's sorted hand, wrapping around.
// Returns the newly selected card id, or null when the hand is empty.
export function moveSelectionAcross(hand, selectedId, step) {
  const cards = sortHand(hand);
  if (cards.length === 0) return null;
  let index = cards.findIndex((card) => card.id === selectedId);
  if (index === -1) index = step > 0 ? -1 : 0;
  const next = (index + step + cards.length) % cards.length;
  return cards[next].id;
}

// The first card a fresh selection should land on: the lowest card in
// the sorted hand.
export function firstSelectable(hand) {
  const cards = sortHand(hand);
  return cards.length > 0 ? cards[0].id : null;
}
