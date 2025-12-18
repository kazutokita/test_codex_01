const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const banner = document.getElementById('banner');
const hudCoins = document.getElementById('coins');
const hudTime = document.getElementById('time');

const world = {
  gravity: 0.5,
  friction: 0.86,
  groundHeight: 380,
  levelLength: 2600,
};

const player = {
  x: 120,
  y: 200,
  w: 26,
  h: 34,
  vx: 0,
  vy: 0,
  speed: 0.5,
  jump: 10.5,
  onGround: false,
};

const state = {
  coins: 0,
  startTime: performance.now(),
  finished: false,
  cameraX: 0,
};

const input = {
  left: false,
  right: false,
  jump: false,
};

const platforms = [
  { x: -200, y: world.groundHeight, w: 640, h: 40 },
  { x: 520, y: 340, w: 140, h: 26 },
  { x: 800, y: 300, w: 180, h: 26 },
  { x: 1090, y: 340, w: 120, h: 26 },
  { x: 1320, y: 310, w: 160, h: 26 },
  { x: 1600, y: 280, w: 160, h: 26 },
  { x: 1820, y: 320, w: 140, h: 26 },
  { x: 2020, y: 340, w: 120, h: 26 },
  { x: 2240, y: 300, w: 200, h: 26 },
];

const coinSpawns = [
  { x: 560, y: 300 },
  { x: 840, y: 260 },
  { x: 1160, y: 300 },
  { x: 1380, y: 270 },
  { x: 1620, y: 240 },
  { x: 1860, y: 280 },
  { x: 2060, y: 300 },
  { x: 2320, y: 260 },
];

const enemySpawns = [
  { x: 900, dir: 1, speed: 0.8, min: 820, max: 1040 },
  { x: 1720, dir: -1, speed: 0.7, min: 1640, max: 1860 },
];

let coins = [];
let enemies = [];

const goal = { x: world.levelLength - 140, y: world.groundHeight - 120, w: 24, h: 120 };

function resizeCanvas() {
  const maxWidth = 1080;
  const ratio = canvas.height / canvas.width;
  canvas.width = Math.min(window.innerWidth - 24, maxWidth);
  canvas.height = canvas.width * ratio;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function rectsCollide(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function resetCoins() {
  coins = coinSpawns.map((c) => ({ ...c, taken: false }));
  hudCoins.textContent = '0';
  state.coins = 0;
}

function resetEnemies() {
  enemies = enemySpawns.map((e) => ({
    x: e.x,
    y: world.groundHeight - 22,
    w: 26,
    h: 22,
    dir: e.dir,
    speed: e.speed,
    min: e.min,
    max: e.max,
  }));
}

function resetPlayer() {
  player.x = 120;
  player.y = 200;
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;
  state.cameraX = 0;
  state.finished = false;
  state.startTime = performance.now();
  banner.classList.remove('show');
  resetCoins();
  resetEnemies();
}

function handleInput() {
  if (input.left && !input.right) player.vx -= player.speed;
  if (input.right && !input.left) player.vx += player.speed;
  player.vx *= world.friction;

  if (input.jump && player.onGround) {
    player.vy = -player.jump;
    player.onGround = false;
  }
}

function applyPhysics() {
  player.vy += world.gravity;
  player.x += player.vx;
  resolveCollisions('x');
  player.y += player.vy;
  resolveCollisions('y');

  if (player.y > canvas.height + 200) {
    resetPlayer();
  }
}

function resolveCollisions(axis) {
  const groundRect = { x: -Infinity, y: world.groundHeight, w: Infinity, h: 200 };
  checkCollisionAgainst(groundRect, axis);
  platforms.forEach((p) => checkCollisionAgainst(p, axis));
}

function checkCollisionAgainst(obj, axis) {
  const playerRect = { x: player.x, y: player.y, w: player.w, h: player.h };
  if (!rectsCollide(playerRect, obj)) return;

  if (axis === 'x') {
    if (player.vx > 0) player.x = obj.x - player.w;
    if (player.vx < 0) player.x = obj.x + obj.w;
    player.vx = 0;
  }

  if (axis === 'y') {
    if (player.vy > 0) {
      player.y = obj.y - player.h;
      player.onGround = true;
    }
    if (player.vy < 0) {
      player.y = obj.y + obj.h;
    }
    player.vy = 0;
  }
}

function updateCoins() {
  coins.forEach((coin) => {
    if (coin.taken) return;
    const cRect = { x: coin.x - 12, y: coin.y - 12, w: 24, h: 24 };
    const pRect = { x: player.x, y: player.y, w: player.w, h: player.h };
    if (rectsCollide(cRect, pRect)) {
      coin.taken = true;
      state.coins += 1;
      hudCoins.textContent = state.coins;
    }
  });
}

function updateEnemies() {
  enemies.forEach((e) => {
    e.x += e.dir * e.speed * 4;
    if (e.x < e.min) e.dir = 1;
    if (e.x > e.max) e.dir = -1;

    const pRect = { x: player.x, y: player.y, w: player.w, h: player.h };
    const eRect = { x: e.x, y: e.y, w: e.w, h: e.h };
    if (rectsCollide(pRect, eRect)) {
      if (player.vy > 1) {
        e.y = 1000; // defeated
        player.vy = -player.jump * 0.6;
      } else {
        resetPlayer();
      }
    }
  });
}

function checkGoal() {
  const goalRect = { ...goal };
  const pRect = { x: player.x, y: player.y, w: player.w, h: player.h };
  if (rectsCollide(goalRect, pRect) && !state.finished) {
    state.finished = true;
    banner.textContent = 'GOAL!';
    banner.classList.add('show');
  }
}

function updateHUD(time) {
  const elapsed = Math.max(0, (time - state.startTime) / 1000);
  hudTime.textContent = `${elapsed.toFixed(1)}s`;
  hudCoins.textContent = state.coins;
}

function drawBackground(cameraX) {
  ctx.fillStyle = '#0b1730';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(-cameraX * 0.4, 0);
  ctx.fillStyle = '#142850';
  for (let i = -1; i < 10; i++) {
    const baseX = i * 320;
    ctx.fillRect(baseX, canvas.height - 140, 260, 140);
  }
  ctx.restore();

  ctx.save();
  ctx.translate(-cameraX * 0.2, 0);
  ctx.fillStyle = '#1f3b72';
  for (let i = -1; i < 8; i++) {
    const baseX = i * 380 + 80;
    ctx.beginPath();
    ctx.arc(baseX + 50, canvas.height - 180, 80, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawGround(cameraX) {
  ctx.save();
  ctx.translate(-cameraX, 0);
  ctx.fillStyle = '#2f6f3e';
  ctx.fillRect(cameraX - 60, world.groundHeight, canvas.width + cameraX + 240, 120);
  ctx.fillStyle = '#184225';
  ctx.fillRect(cameraX - 60, world.groundHeight + 48, canvas.width + cameraX + 240, 120);
  ctx.restore();
}

function drawPlatforms(cameraX) {
  ctx.save();
  ctx.translate(-cameraX, 0);
  platforms.forEach((p) => {
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = '#1d4ed8';
    ctx.fillRect(p.x, p.y + p.h - 8, p.w, 8);
  });
  ctx.restore();
}

function drawCoins(cameraX, time) {
  ctx.save();
  ctx.translate(-cameraX, 0);
  coins.forEach((coin) => {
    if (coin.taken) return;
    const bob = Math.sin(time / 200 + coin.x) * 4;
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(coin.x, coin.y + bob, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.stroke();
  });
  ctx.restore();
}

function drawEnemies(cameraX) {
  ctx.save();
  ctx.translate(-cameraX, 0);
  enemies.forEach((e) => {
    ctx.fillStyle = '#f87171';
    ctx.fillRect(e.x, e.y, e.w, e.h);
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(e.x, e.y + e.h - 6, e.w, 6);
  });
  ctx.restore();
}

function drawGoal(cameraX) {
  ctx.save();
  ctx.translate(-cameraX, 0);
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(goal.x, goal.y, goal.w, goal.h);
  ctx.fillStyle = '#22d3ee';
  ctx.beginPath();
  ctx.moveTo(goal.x + goal.w, goal.y + 10);
  ctx.lineTo(goal.x + goal.w + 34, goal.y + 26);
  ctx.lineTo(goal.x + goal.w, goal.y + 42);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawPlayer(cameraX) {
  ctx.save();
  ctx.translate(-cameraX, 0);
  ctx.fillStyle = '#f97316';
  ctx.fillRect(player.x, player.y, player.w, player.h);
  ctx.fillStyle = '#fff7ed';
  ctx.fillRect(player.x + 6, player.y + 8, 14, 12);
  ctx.restore();
}

let lastTime = performance.now();
function loop(time) {
  const delta = time - lastTime;
  lastTime = time;

  handleInput();
  applyPhysics();
  updateCoins();
  updateEnemies();
  checkGoal();
  updateHUD(time);

  state.cameraX = Math.max(0, Math.min(player.x - canvas.width / 2, world.levelLength - canvas.width));

  drawBackground(state.cameraX);
  drawGround(state.cameraX);
  drawPlatforms(state.cameraX);
  drawCoins(state.cameraX, time);
  drawEnemies(state.cameraX);
  drawGoal(state.cameraX);
  drawPlayer(state.cameraX);

  requestAnimationFrame(loop);
}

function attachControls() {
  const keyMap = {
    ArrowLeft: 'left',
    ArrowRight: 'right',
    ArrowUp: 'jump',
    Space: 'jump',
    KeyA: 'left',
    KeyD: 'right',
    KeyW: 'jump',
  };

  document.addEventListener('keydown', (e) => {
    const action = keyMap[e.code];
    if (action) {
      input[action] = true;
      e.preventDefault();
    }
  });
  document.addEventListener('keyup', (e) => {
    const action = keyMap[e.code];
    if (action) {
      input[action] = false;
      e.preventDefault();
    }
  });

  document.querySelectorAll('.ctrl').forEach((btn) => {
    const action = btn.dataset.action;
    const setState = (value) => {
      input[action] = value;
      btn.classList.toggle('active', value);
    };
    btn.addEventListener('pointerdown', (e) => {
      setState(true);
      e.preventDefault();
    });
    btn.addEventListener('pointerup', () => setState(false));
    btn.addEventListener('pointerleave', () => setState(false));
    btn.addEventListener('pointercancel', () => setState(false));
  });
}

attachControls();
resetPlayer();
requestAnimationFrame(loop);
