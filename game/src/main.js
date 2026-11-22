// Ember Court — the bootstrap: mount the stage, fit the 1280 by 800
// stage to the window on resize, read `?shot=` and `?seed=` from the
// URL, stage a screenshot scene when asked (and then set a
// `window.__shotReady` flag to true), otherwise start on the title
// screen; walk the turns (player move, Rook answers after a beat,
// trick settles, next leader); expose the live match as
// `window.__emberCourt.match` for testing.

import { STAGE_HEIGHT, STAGE_WIDTH, RIVAL_THINK_MS, TRICK_SETTLE_MS } from './config.js';
import { chooseAnswer, chooseLead } from './ai.js';
import {
  createMatch,
  playPlayerCard,
  playRookCard,
  settleTrick,
  startMatch,
} from './game.js';
import { firstSelectable, moveSelectionAcross, wireKeyboard, wireOverlays } from './input.js';
import { mountStage, render } from './render.js';
import { isMuted, primeAudio, setMuted, sounds } from './audio.js';
import { stageScene } from './shots.js';
import { mulberry32 } from './rng.js';

const params = new URLSearchParams(window.location.search);
const shotKind = params.get('shot');
const seed = Number.parseInt(params.get('seed') ?? '9', 10) || 9;

// The live match, and the small UI state the renderer reads.
let match = createMatch(seed);
let random = mulberry32(seed * 7919 + 13);
const ui = {
  selectedId: null,
  justDealt: false,
  showHelp: false,
  onCardClick,
};
let rookTimer = null;
let settleTimer = null;

const app = document.querySelector('#app');
mountStage(app);

// Fit the fixed stage to the window, keeping its aspect, on every
// resize. The stage itself stays 1280 by 800, so a screenshot of it
// is exact.
function fitStage() {
  const stage = document.querySelector('#stage');
  const scale = Math.min(window.innerWidth / STAGE_WIDTH, window.innerHeight / STAGE_HEIGHT);
  stage.style.transform = `translate(-50%, -50%) scale(${scale})`;
  stage.style.left = '50%';
  stage.style.top = '50%';
}
window.addEventListener('resize', fitStage);
fitStage();

// Draw the current state, and expose the match for testing.
function draw() {
  render(match, ui);
  window.__emberCourt = { match, ui };
}
window.__emberCourt = { match, ui };

function clearTimers() {
  if (rookTimer !== null) {
    clearTimeout(rookTimer);
    rookTimer = null;
  }
  if (settleTimer !== null) {
    clearTimeout(settleTimer);
    settleTimer = null;
  }
}

// Start a brand-new match from a fresh seed, and deal it in.
function newMatch() {
  clearTimers();
  const nextSeed = (match.seed + 1) % 2147483647;
  match = createMatch(nextSeed);
  random = mulberry32(nextSeed * 7919 + 13);
  ui.selectedId = null;
  ui.justDealt = true;
  startMatch(match);
  match.thought = '';
  draw();
  advance();
}

// Walk the turns after any change: if Rook must lead, it does so after
// a beat; if Rook must answer, it answers after a beat; if a trick is
// finished, it settles after a beat. The player is never rushed.
function advance() {
  if (match.phase !== 'playing') return;
  if (match.table.lead === null && match.table.follow === null) {
    if (match.leader === 'rook') {
      rookTimer = window.setTimeout(rookLeads, RIVAL_THINK_MS);
    }
    return;
  }
  if (match.table.lead !== null && match.table.follow === null) {
    if (match.leader === 'player') {
      rookTimer = window.setTimeout(rookAnswers, RIVAL_THINK_MS);
    }
    return;
  }
  if (match.table.lead !== null && match.table.follow !== null) {
    settleTimer = window.setTimeout(settle, TRICK_SETTLE_MS);
  }
}

// Rook leads a trick with its own brain, and says why.
function rookLeads() {
  rookTimer = null;
  const choice = chooseLead(match.rookHand, match.trickNumber, match.seen, random);
  playRookCard(match, choice.card);
  match.thought = choice.reason;
  sounds.play();
  draw();
  advance();
}

// Rook answers the player's lead, and says why.
function rookAnswers() {
  rookTimer = null;
  const choice = chooseAnswer(match.rookHand, match.table.lead.card, match.seen);
  playRookCard(match, choice.card);
  match.thought = choice.reason;
  sounds.play();
  draw();
  advance();
}

// Bank the finished trick, play the right sound, and move on.
function settle() {
  settleTimer = null;
  const winner = settleTrick(match);
  if (winner === 'player') sounds.trickWon();
  else if (winner === 'rook') sounds.trickLost();
  if (match.phase === 'over') {
    if (match.winner === 'player') sounds.matchWon();
    else if (match.winner === 'rook') sounds.matchLost();
  }
  ui.selectedId = null;
  draw();
  advance();
}

// The player plays a card: only on the player's turn, only from the
// hand. After the move, Rook answers and the trick settles by `advance`.
function onCardClick(cardId) {
  if (match.phase === 'title' || match.phase === 'over') return;
  const played = playPlayerCard(match, cardId);
  if (played === null) return;
  ui.selectedId = null;
  sounds.play();
  draw();
  advance();
}

// The keyboard actions, wired in input.js.
const actions = {
  playSelected() {
    if (match.phase === 'title') {
      ui.justDealt = true;
      startMatch(match);
      draw();
      advance();
      return;
    }
    if (match.phase === 'over') {
      newMatch();
      return;
    }
    if (ui.showHelp) {
      ui.showHelp = false;
      draw();
      return;
    }
    if (ui.selectedId === null) {
      ui.selectedId = firstSelectable(match.playerHand);
      draw();
      return;
    }
    onCardClick(ui.selectedId);
  },
  moveSelection(step) {
    if (match.phase !== 'playing') return;
    ui.selectedId = moveSelectionAcross(match.playerHand, ui.selectedId, step);
    draw();
  },
  newMatch() {
    newMatch();
  },
  toggleHelp() {
    ui.showHelp = !ui.showHelp;
    draw();
  },
  toggleMute() {
    setMuted(!isMuted());
    draw();
  },
};

wireKeyboard(actions);
wireOverlays(actions);
window.addEventListener('pointerdown', primeAudio, { once: true });

// A screenshot scene stages instantly and reports ready; a normal load
// opens on the title screen.
if (shotKind) {
  match = stageScene(shotKind, seed);
  draw();
  window.__shotReady = true;
} else {
  draw();
}
