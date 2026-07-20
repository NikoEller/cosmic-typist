import { pickWord } from './words.js';

const $ = (id) => document.getElementById(id);
const BROWSER_HIGHSCORE_KEY = 'cosmic-typist-highscores-v1';
const WPM_WINDOW_MS = 30_000;

const ui = {
  arena: $('arena'),
  enemyLayer: $('enemies'),
  effectLayer: $('effects'),
  ship: $('ship'),
  input: $('typingInput'),
  score: $('score'),
  wpm: $('wpm'),
  streak: $('streak'),
  health: $('health'),
  level: $('level'),
  targetWord: $('targetWord'),
  accuracy: $('accuracy'),
  status: $('statusMessage'),
  startScreen: $('startScreen'),
  gameOverScreen: $('gameOverScreen'),
  finalScore: $('finalScore'),
  missionNote: $('missionNote'),
  damageFlash: $('damageFlash'),
  highscoreList: $('highscoreList'),
  restartButton: $('restartButton'),
  menuButton: $('menuButton')
};

const state = {
  active: false,
  paused: false,
  mode: 'practice',
  score: 0,
  streak: 0,
  bestStreak: 0,
  shields: 3,
  typedCharacters: 0,
  mistakes: 0,
  correctKeyTimes: [],
  enemies: [],
  startedAt: 0,
  pausedAt: 0,
  pausedMilliseconds: 0,
  lastFrameAt: 0,
  lastSpawnAt: 0,
  lastInputValue: '',
  hasSubmittedScore: false,
  animationFrame: 0
};

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function elapsedMilliseconds() {
  if (!state.startedAt) return 0;
  const pauseTime = state.paused ? performance.now() - state.pausedAt : 0;
  return performance.now() - state.startedAt - state.pausedMilliseconds - pauseTime;
}

function getWpm() {
  const now = performance.now();
  const windowStart = now - WPM_WINDOW_MS;

  // Eine gleitende Messung zeigt die aktuelle Schreibgeschwindigkeit. Ein
  // langsamer Missionsstart kann die Anzeige damit nicht dauerhaft bremsen.
  state.correctKeyTimes = state.correctKeyTimes.filter((time) => time >= windowStart);
  const measuredMilliseconds = Math.min(WPM_WINDOW_MS, elapsedMilliseconds());

  return measuredMilliseconds > 0
    ? Math.round((state.correctKeyTimes.length / 5) / (measuredMilliseconds / 60_000))
    : 0;
}

function getAccuracy() {
  if (!state.typedCharacters) return 100;
  return Math.round(100 * (state.typedCharacters - state.mistakes) / state.typedCharacters);
}

function announce(message) {
  ui.status.textContent = message;
}

function updateHud() {
  ui.score.textContent = String(state.score).padStart(6, '0');
  ui.wpm.textContent = getWpm();
  ui.streak.textContent = '× ' + state.streak;
  ui.health.textContent = '♥ '.repeat(state.shields) + '♡ '.repeat(3 - state.shields);
  ui.accuracy.textContent = getAccuracy() + '%';
  ui.level.textContent = String(1 + Math.floor(state.score / 1_000)).padStart(2, '0');
}

function resetMission() {
  state.score = 0;
  state.streak = 0;
  state.bestStreak = 0;
  state.shields = 3;
  state.typedCharacters = 0;
  state.mistakes = 0;
  state.correctKeyTimes = [];
  state.enemies = [];
  state.lastInputValue = '';
  state.hasSubmittedScore = false;
  ui.enemyLayer.replaceChildren();
  ui.effectLayer.replaceChildren();
  ui.input.value = '';
  updateHud();
}

function getPace() {
  if (state.mode === 'challenge') {
    const progression = clamp(state.score / 12_000, 0, 1.2);
    return {
      spawnInterval: Math.round(2_500 - 1_450 * progression),
      speed: 4.1 * (1 + progression),
      maximumEnemies: 7
    };
  }

  const wpm = getWpm();
  const needsRelief = state.shields < 2 || getAccuracy() < 88;
  return {
    // Die anfängliche Spawnrate muss genug Wörter liefern, damit schnelle
    // Spieler ihre tatsächliche WPM erreichen können. Fehler und wenige
    // Schilde verlangsamen nur behutsam, statt das Training zu blockieren.
    spawnInterval: Math.round(clamp(1_350 - wpm * 4.5 + (needsRelief ? 250 : 0), 850, 1_700)),
    speed: clamp(3.5 + wpm / 50 - (needsRelief ? .55 : 0), 3.0, 5.15),
    maximumEnemies: needsRelief ? 4 : 5
  };
}

function getDifficulty() {
  if (state.mode === 'challenge') {
    if (state.score > 7_000) return 'hard';
    if (state.score > 2_000) return 'medium';
    return 'easy';
  }

  const wpm = getWpm();
  if (wpm >= 65) return 'hard';
  if (wpm >= 30) return 'medium';
  return 'easy';
}

function findFreePosition() {
  const minimumX = 9;
  const maximumX = 80;
  const minimumDistance = 21;

  // Wortkarten sollen beim Eintritt ins Spielfeld nicht übereinanderliegen.
  for (let attempt = 0; attempt < 18; attempt += 1) {
    const candidate = minimumX + Math.random() * (maximumX - minimumX);
    const overlaps = state.enemies.some((enemy) => (
      // Erst bei weniger als neun Prozent Höhenabstand könnten sich zwei
      // Wortkarten sichtbar überlagern.
      enemy.y < -5 && Math.abs(enemy.x - candidate) < minimumDistance
    ));
    if (!overlaps) return candidate;
  }
  return null;
}

function createEnemy() {
  const x = findFreePosition();
  if (x === null) return false;

  const isComet = Math.random() > .56;
  const element = document.createElement('div');
  const wordLabel = document.createElement('span');
  const object = document.createElement('span');

  element.className = 'enemy' + (isComet ? ' enemy--comet' : '');
  wordLabel.className = 'enemy__word';
  wordLabel.textContent = pickWord(getDifficulty());
  object.className = 'enemy__object';
  object.textContent = isComet ? '☄' : '✦';
  element.append(wordLabel, object);

  const enemy = {
    element,
    word: wordLabel.textContent,
    x,
    y: -14,
    speed: getPace().speed * (.88 + Math.random() * .22),
    destroyed: false
  };

  element.style.left = x + '%';
  element.style.top = enemy.y + '%';
  ui.enemyLayer.append(element);
  state.enemies.push(enemy);
  return true;
}

function findTarget(input) {
  if (!input) return null;
  return state.enemies
    .filter((enemy) => !enemy.destroyed && enemy.word.startsWith(input))
    .sort((first, second) => second.y - first.y)[0] ?? null;
}

function updateTarget() {
  const input = ui.input.value.toLowerCase();
  const target = findTarget(input);
  state.enemies.forEach((enemy) => enemy.element.classList.remove('enemy--target'));

  if (target) {
    target.element.classList.add('enemy--target');
    ui.targetWord.textContent = target.word;
  } else {
    ui.targetWord.textContent = input ? 'Kein Ziel erfasst' : 'Ziel anvisieren …';
  }
  return target;
}

function removeEnemy(enemy) {
  enemy.element.remove();
  state.enemies = state.enemies.filter((current) => current !== enemy);
}

function destroyEnemy(enemy) {
  if (enemy.destroyed) return;

  enemy.destroyed = true;
  state.score += 100 + state.streak * 12;
  state.streak += 1;
  state.bestStreak = Math.max(state.bestStreak, state.streak);
  enemy.element.classList.add('enemy--destroyed');
  window.setTimeout(() => removeEnemy(enemy), 360);

  ui.input.value = '';
  state.lastInputValue = '';
  updateTarget();
  updateHud();
  announce('Ziel zerstört. Streak ' + state.streak + '.');
}

function addEffect(className, x, y, removeAfter) {
  const effect = document.createElement('span');
  effect.className = className;
  effect.style.left = x + 'px';
  effect.style.top = y + 'px';
  ui.effectLayer.append(effect);
  window.setTimeout(() => effect.remove(), removeAfter);
}

function fireLaser(target) {
  const arenaBox = ui.arena.getBoundingClientRect();
  const shipBox = ui.ship.getBoundingClientRect();
  const targetBox = target.element.getBoundingClientRect();
  const startX = shipBox.left + shipBox.width / 2 - arenaBox.left;
  const startY = shipBox.top + 12 - arenaBox.top;
  const targetX = targetBox.left + targetBox.width / 2 - arenaBox.left;
  const targetY = targetBox.top + targetBox.height / 2 - arenaBox.top;
  const laser = document.createElement('span');

  laser.className = 'laser-shot';
  laser.style.left = startX + 'px';
  laser.style.top = startY + 'px';
  laser.style.setProperty('--flight-x', (targetX - startX) + 'px');
  laser.style.setProperty('--flight-y', (targetY - startY) + 'px');
  ui.effectLayer.append(laser);

  addEffect('muzzle-flash', startX - 7, startY - 7, 190);
  window.setTimeout(() => addEffect('laser-impact', targetX - 6, targetY - 6, 340), 190);
  window.setTimeout(() => laser.remove(), 260);
}

function damageShip() {
  state.shields -= 1;
  state.streak = 0;
  ui.damageFlash.classList.remove('is-active');
  void ui.damageFlash.offsetWidth;
  ui.damageFlash.classList.add('is-active');
  updateHud();

  if (state.shields <= 0) endGame();
  else announce('Treffer am Schiff. Noch ' + state.shields + ' Schilde.');
}

function moveEnemies(deltaMilliseconds) {
  state.enemies.slice().forEach((enemy) => {
    if (!state.active || enemy.destroyed) return;
    enemy.y += enemy.speed * (deltaMilliseconds / 1_000);
    enemy.element.style.top = enemy.y + '%';

    if (enemy.y > 87) {
      removeEnemy(enemy);
      damageShip();
    }
  });
}

function loop(timestamp) {
  if (!state.active) return;

  const deltaMilliseconds = Math.min(50, timestamp - state.lastFrameAt);
  state.lastFrameAt = timestamp;

  if (!state.paused) {
    const pace = getPace();
    if (
      state.enemies.length < pace.maximumEnemies
      && timestamp - state.lastSpawnAt >= pace.spawnInterval
      && createEnemy()
    ) {
      state.lastSpawnAt = timestamp;
    }
    moveEnemies(deltaMilliseconds);
    updateHud();
  }

  state.animationFrame = requestAnimationFrame(loop);
}

function startGame(mode) {
  resetMission();
  state.mode = mode;
  state.active = true;
  state.paused = false;
  state.startedAt = performance.now();
  state.pausedMilliseconds = 0;
  state.lastFrameAt = state.startedAt;
  state.lastSpawnAt = state.startedAt;

  ui.startScreen.classList.add('is-hidden');
  ui.gameOverScreen.classList.add('is-hidden');
  ui.input.disabled = false;
  ui.input.focus();
  ui.targetWord.textContent = 'Ziel anvisieren …';
  announce(mode === 'practice' ? 'Endlos-Training gestartet.' : 'Challenge gestartet.');

  cancelAnimationFrame(state.animationFrame);
  state.animationFrame = requestAnimationFrame(loop);
}

function endGame() {
  if (!state.active) return;

  state.active = false;
  ui.input.disabled = true;
  ui.finalScore.textContent = state.score;
  ui.missionNote.textContent =
    getAccuracy() + '% Genauigkeit · ' + getWpm() + ' WPM · bester Streak: ' + state.bestStreak;
  ui.gameOverScreen.classList.remove('is-hidden');
  announce('Mission beendet. Score ' + state.score + '.');
  saveHighscore();
}

function togglePause() {
  if (!state.active) return;
  state.paused = !state.paused;

  if (state.paused) {
    state.pausedAt = performance.now();
    ui.input.disabled = true;
    ui.targetWord.textContent = 'Pausiert – Esc zum Fortsetzen';
    announce('Mission pausiert.');
  } else {
    state.pausedMilliseconds += performance.now() - state.pausedAt;
    state.lastFrameAt = performance.now();
    ui.input.disabled = false;
    ui.input.focus();
    updateTarget();
    announce('Mission fortgesetzt.');
  }
}

function handleInput() {
  if (!state.active || state.paused) return;

  const value = ui.input.value.toLowerCase();
  const typedNewCharacter = value.length > state.lastInputValue.length;
  state.lastInputValue = value;
  const target = findTarget(value);

  if (typedNewCharacter) {
    state.typedCharacters += 1;
    if (!target) {
      state.mistakes += 1;
      ui.input.classList.add('is-invalid');
      window.setTimeout(() => ui.input.classList.remove('is-invalid'), 180);
    } else {
      state.correctKeyTimes.push(performance.now());
      fireLaser(target);
    }
  }

  if (target && value === target.word) destroyEnemy(target);
  updateTarget();
  updateHud();
}

function renderHighscores(scores) {
  ui.highscoreList.replaceChildren();
  if (!scores.length) {
    const empty = document.createElement('li');
    empty.textContent = 'Noch keine Mission abgeschlossen.';
    ui.highscoreList.append(empty);
    return;
  }

  scores.slice(0, 5).forEach((entry, index) => {
    const item = document.createElement('li');
    const description = document.createElement('span');
    const score = document.createElement('span');
    const mode = entry.mode === 'challenge' ? 'Challenge' : 'Training';
    description.textContent = (index + 1) + '. ' + mode + ' · ' + entry.wpm + ' WPM';
    score.textContent = entry.score + ' Pkt.';
    item.append(description, score);
    ui.highscoreList.append(item);
  });
}

function isValidHighscore(entry) {
  return (
    entry
    && Number.isInteger(entry.score) && entry.score >= 0
    && Number.isInteger(entry.wpm) && entry.wpm >= 0
    && ['practice', 'challenge'].includes(entry.mode)
  );
}

function sortHighscores(scores) {
  return scores
    .filter(isValidHighscore)
    .sort((first, second) => second.score - first.score)
    .slice(0, 10);
}

function loadBrowserHighscores() {
  try {
    return sortHighscores(JSON.parse(localStorage.getItem(BROWSER_HIGHSCORE_KEY) || '[]'));
  } catch {
    return [];
  }
}

function saveBrowserHighscores(entry) {
  const scores = sortHighscores([...loadBrowserHighscores(), entry]);
  try {
    localStorage.setItem(BROWSER_HIGHSCORE_KEY, JSON.stringify(scores));
  } catch {
    // Ein deaktivierter Browser-Speicher beeinträchtigt das Spiel nicht.
  }
  return scores;
}

async function loadHighscores() {
  try {
    const response = await fetch('/api/highscores');
    if (!response.ok) throw new Error('Highscores konnten nicht geladen werden.');
    renderHighscores(sortHighscores(await response.json()));
  } catch {
    // GitHub Pages kann kein Python ausführen. Dort ist localStorage die
    // passende, datensparsame Alternative zur lokalen JSON-Datei.
    renderHighscores(loadBrowserHighscores());
  }
}

async function saveHighscore() {
  if (state.hasSubmittedScore || state.score <= 0) return;
  state.hasSubmittedScore = true;

  try {
    const response = await fetch('/api/highscores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score: state.score, wpm: getWpm(), mode: state.mode })
    });
    if (!response.ok) throw new Error('Highscore konnte nicht gespeichert werden.');
    renderHighscores(sortHighscores(await response.json()));
  } catch {
    renderHighscores(saveBrowserHighscores({
      score: state.score,
      wpm: getWpm(),
      mode: state.mode
    }));
  }
}

document.querySelectorAll('.mode-button').forEach((button) => {
  button.addEventListener('click', () => startGame(button.dataset.mode));
});
ui.restartButton.addEventListener('click', () => startGame(state.mode));
ui.menuButton.addEventListener('click', () => {
  ui.gameOverScreen.classList.add('is-hidden');
  ui.startScreen.classList.remove('is-hidden');
  loadHighscores();
});
ui.input.addEventListener('input', handleInput);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') togglePause();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && state.active && !state.paused) togglePause();
});

updateHud();
loadHighscores();
