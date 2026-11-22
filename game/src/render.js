// Ember Court — the renderer. It builds the stage skeleton once, then
// rebuilds every visible part from the match state after each play and
// settle (never on hover): the score, the trump-cycle chips, Rook's
// backs, the player's hand with selection and disabled states, the
// trick area, the turn banner, the log, Rook's thought, and the
// title/win/loss/draw overlays. The card factory and the card-back
// factory live here, with the inline SVG pip helper.

import {
  CARD_HEIGHT,
  CARD_WIDTH,
  JESTER_RANK,
  CROWN_RANK,
  PIP_PATHS,
  RULE_LINES,
  SUITS,
  TOTAL_TRICKS,
  TRUMP_CYCLE,
  TRUMP_SENTENCE,
} from './config.js';
import { cardName, cornerLabel, sortHand } from './deck.js';
import { turnForPlayer, verdictLine } from './game.js';

// An inline SVG pip for a suit, at `size` pixels, in the suit's colour.
// The paths live in config.js, on a 24 by 24 grid. The swirl is drawn
// as a stroke, not a fill: a filled spiral closes into a blob, while a
// stroked one reads as a curl at any size.
export function pipSvg(suitId, size) {
  const suit = SUITS[suitId];
  if (suit.pip === 'swirl') {
    return (
      `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">` +
      `<path d="${PIP_PATHS[suit.pip]}" fill="none" stroke="${suit.color}" ` +
      `stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
    );
  }
  return (
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">` +
    `<path d="${PIP_PATHS[suit.pip]}" fill="${suit.color}"/></svg>`
  );
}

// One face-up card. Corners carry the rank and a small pip, the centre
// a large pip with the suit name under it. Ranks 6 and 9 carry an
// underline in both corners, so a 6 upside down never reads as a 9.
export function cardElement(card, options = {}) {
  const suit = SUITS[card.suit];
  const el = document.createElement('div');
  el.className = 'card' + (options.extraClass ? ` ${options.extraClass}` : '');
  el.dataset.cardId = card.id;
  el.style.width = `${CARD_WIDTH}px`;
  el.style.height = `${CARD_HEIGHT}px`;
  const label = cornerLabel(card);
  const underline = card.rank === 6 || card.rank === 9;
  const rankWord =
    card.rank === JESTER_RANK ? 'JESTER' : card.rank === CROWN_RANK ? 'CROWN' : '';
  el.innerHTML =
    `<div class="corner tl" style="color:${suit.dark}">` +
    `<span class="rank${underline ? ' underline' : ''}">${label}</span>` +
    pipSvg(card.suit, 18) +
    `</div>` +
    `<div class="card-centre">${pipSvg(card.suit, 46)}` +
    `<div class="suit-name" style="color:${suit.dark}">${suit.name}</div>` +
    (rankWord ? `<div class="rank-word">${rankWord}</div>` : '') +
    `</div>` +
    `<div class="corner br" style="color:${suit.dark}">` +
    `<span class="rank${underline ? ' underline' : ''}">${label}</span>` +
    pipSvg(card.suit, 18) +
    `</div>`;
  return el;
}

// One face-down card back: deep red with a gold ring and an "E" emblem.
export function cardBackElement() {
  const el = document.createElement('div');
  el.className = 'card-back';
  el.innerHTML = '<div class="back-ring"><span class="back-emblem">E</span></div>';
  return el;
}

// The skeleton: every region the render pass fills in. Built once.
export function mountStage(root) {
  root.innerHTML =
    `<div class="stage" id="stage">` +
    `<div class="felt-oval"></div>` +
    `<div class="topbar">` +
    `<div class="score" id="score"></div>` +
    `<div class="trump" id="trump"></div>` +
    `</div>` +
    `<div class="rook-label" id="rook-label"></div>` +
    `<div class="rook-hand" id="rook-hand"></div>` +
    `<div class="turn-banner" id="turn-banner"></div>` +
    `<div class="mid-row">` +
    `<div class="log" id="log"></div>` +
    `<div class="trick-area" id="trick-area"></div>` +
    `<div class="thought" id="thought"></div>` +
    `</div>` +
    `<div class="hand-label" id="hand-label">Your hand &mdash; click a card to play it</div>` +
    `<div class="player-hand" id="player-hand"></div>` +
    `<div class="keys-hint">Arrows move &middot; Enter plays &middot; N new match &middot; H help &middot; M mute</div>` +
    `<div class="overlay" id="overlay"></div>` +
    `<div class="help-overlay" id="help-overlay" hidden></div>` +
    `</div>`;
  return root.querySelector('#stage');
}

// Rebuild every visible part from the match state. `ui` carries the
// selection, the mute state and the just-dealt flag for the deal-in.
export function render(match, ui) {
  renderScore(match);
  renderTrump();
  renderRook(match);
  renderBanner(match);
  renderTrick(match);
  renderLog(match);
  renderThought(match);
  renderHand(match, ui);
  renderOverlay(match);
  renderHelp(ui);
}

function renderScore(match) {
  const score = document.querySelector('#score');
  const over = match.phase === 'over';
  score.innerHTML =
    `<div class="score-row"><span class="score-name">YOU</span>` +
    `<span>${match.tricks.player} tricks &middot; ${match.points.player} pts</span></div>` +
    `<div class="score-row"><span class="score-name">ROOK</span>` +
    `<span>${match.tricks.rook} tricks &middot; ${match.points.rook} pts</span></div>` +
    `<div class="score-trick">TRICK ${over ? TOTAL_TRICKS : match.trickNumber} / ${TOTAL_TRICKS}</div>`;
}

function renderTrump() {
  const trump = document.querySelector('#trump');
  const chips = TRUMP_CYCLE.map((suitId, index) => {
    const next = TRUMP_CYCLE[(index + 1) % TRUMP_CYCLE.length];
    const arrow = index < TRUMP_CYCLE.length - 1 ? '<span class="chip-arrow">&rsaquo;</span>' : '<span class="chip-arrow">&orarr;</span>';
    return `<span class="chip" style="border-color:${SUITS[suitId].color}">${pipSvg(suitId, 16)}${SUITS[suitId].name}</span>${arrow}`;
  }).join('');
  trump.innerHTML = `<div class="chips">${chips}</div><div class="trump-note">${TRUMP_SENTENCE}</div>`;
}

function renderRook(match) {
  const label = document.querySelector('#rook-label');
  label.textContent = `ROOK \u2014 rival \u00b7 ${match.rookHand.length} cards`;
  const hand = document.querySelector('#rook-hand');
  hand.innerHTML = '';
  const count = match.rookHand.length;
  for (let i = 0; i < count; i += 1) {
    const back = cardBackElement();
    const spread = count > 1 ? (i - (count - 1) / 2) * 5 : 0;
    back.style.transform = `rotate(${spread}deg)`;
    hand.appendChild(back);
  }
}

function renderBanner(match) {
  const banner = document.querySelector('#turn-banner');
  if (match.phase !== 'playing') {
    banner.textContent = '';
    return;
  }
  if (match.table.lead !== null && match.table.follow !== null) {
    banner.textContent = 'The trick settles\u2026';
    return;
  }
  const turn = turnForPlayer(match);
  if (turn === 'lead') banner.textContent = 'Your lead \u2014 click a card to play it';
  else if (turn === 'follow') banner.textContent = 'Your answer \u2014 click a card to play it';
  else banner.textContent = 'Rook is thinking\u2026';
}

function renderTrick(match) {
  const area = document.querySelector('#trick-area');
  area.innerHTML = '';
  const lead = match.table.lead;
  const follow = match.table.follow;
  area.appendChild(trickSlot(lead, 'Lead', 'lead'));
  const vs = document.createElement('div');
  vs.className = 'vs';
  vs.textContent = 'VS';
  area.appendChild(vs);
  area.appendChild(trickSlot(follow, 'Answer', 'follow'));
}

function trickSlot(entry, label, slot) {
  const holder = document.createElement('div');
  holder.className = 'trick-slot';
  if (entry === null) {
    holder.innerHTML = `<div class="slot-empty"><span>${label}</span></div>`;
    return holder;
  }
  const card = cardElement(entry.card, {
    extraClass: entry.side === 'rook' ? 'flip-in' : 'snap-in',
  });
  card.setAttribute('aria-label', cardName(entry.card));
  holder.appendChild(card);
  const tag = document.createElement('div');
  tag.className = 'slot-tag';
  tag.textContent = entry.side === 'player' ? 'You' : 'Rook';
  holder.appendChild(tag);
  return holder;
}

function renderLog(match) {
  const log = document.querySelector('#log');
  const lines = match.log.slice(-3);
  log.innerHTML = lines.map((line) => `<div class="log-line">${line}</div>`).join('');
}

function renderThought(match) {
  const thought = document.querySelector('#thought');
  thought.innerHTML = match.thought
    ? `<div class="thought-label">Rook thinks</div><div class="thought-text">&ldquo;${match.thought}&rdquo;</div>`
    : '';
}

function renderHand(match, ui) {
  const hand = document.querySelector('#player-hand');
  hand.innerHTML = '';
  const cards = sortHand(match.playerHand);
  const playable = turnForPlayer(match) !== 'none';
  cards.forEach((card, index) => {
    const fan = cards.length > 1 ? (index - (cards.length - 1) / 2) * 3 : 0;
    const lift = Math.abs(index - (cards.length - 1) / 2) * 2;
    const el = cardElement(card, {
      extraClass:
        (ui.selectedId === card.id ? 'selected ' : '') +
        (!playable ? 'disabled ' : '') +
        (ui.justDealt ? 'deal-in' : ''),
    });
    el.style.setProperty('--fan', `${fan}deg`);
    el.style.setProperty('--lift', `${lift}px`);
    if (ui.justDealt) el.style.animationDelay = `${index * 60}ms`;
    el.addEventListener('click', () => ui.onCardClick(card.id));
    hand.appendChild(el);
  });
  ui.justDealt = false;
}

function renderOverlay(match) {
  const overlay = document.querySelector('#overlay');
  if (match.phase === 'title') {
    const emblems = TRUMP_CYCLE.map(
      (suitId) =>
        `<span class="emblem">${pipSvg(suitId, 40)}<span>${SUITS[suitId].name}</span></span>`,
    ).join('');
    overlay.classList.add('show');
    overlay.innerHTML =
      `<div class="overlay-card">` +
      `<div class="emblems">${emblems}</div>` +
      `<h1 class="title">EMBER COURT</h1>` +
      `<p class="tagline">A duel of the four houses. Nine tricks. One court.</p>` +
      `<div class="rules">${RULE_LINES.map((line) => `<p>${line}</p>`).join('')}</div>` +
      `<p class="cta">Click a card, or press Enter, to take your seat</p>` +
      `<p class="hint">Arrows move &middot; Enter plays &middot; N new match &middot; H help &middot; M mute</p>` +
      `</div>`;
    return;
  }
  if (match.phase === 'over') {
    const win = match.winner === 'player';
    const draw = match.winner === 'draw';
    const heading = draw ? 'A DEAD HEAT' : win ? 'VICTORY' : 'DEFEAT';
    const embers = win
      ? Array.from({ length: 12 }, (_, i) => {
          const left = 8 + ((i * 37) % 84);
          const delay = (i % 6) * 0.35;
          return `<span class="ember" style="left:${left}%;animation-delay:${delay}s"></span>`;
        }).join('')
      : '';
    overlay.classList.add('show');
    overlay.innerHTML =
      `<div class="overlay-card ${draw ? 'draw' : win ? 'win' : 'loss'}">${embers}` +
      `<h1 class="title ${draw ? 'draw' : win ? 'win' : 'loss'}">${heading}</h1>` +
      `<p class="tagline">${verdictLine(match)}</p>` +
      `<div class="breakdown">` +
      `<div class="break-row"><span>Tricks</span><span>${match.tricks.player} &ndash; ${match.tricks.rook}</span></div>` +
      `<div class="break-row"><span>Court points</span><span>${match.points.player} &ndash; ${match.points.rook}</span></div>` +
      `<div class="break-row"><span>Cards taken</span><span>${match.captured.player.length} &ndash; ${match.captured.rook.length}</span></div>` +
      `</div>` +
      `<p class="cta">Press Enter or click to play again</p>` +
      `</div>`;
    return;
  }
  overlay.classList.remove('show');
  overlay.innerHTML = '';
}

function renderHelp(ui) {
  const help = document.querySelector('#help-overlay');
  if (!ui.showHelp) {
    help.hidden = true;
    help.innerHTML = '';
    return;
  }
  help.hidden = false;
  help.innerHTML =
    `<div class="overlay-card">` +
    `<h1 class="title">HOW TO PLAY</h1>` +
    `<div class="rules">${RULE_LINES.map((line) => `<p>${line}</p>`).join('')}</div>` +
    `<p class="tagline">${TRUMP_SENTENCE}</p>` +
    `<p class="cta">Press H or click to close</p>` +
    `</div>`;
}
