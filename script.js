const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const scale = 32;

const colors = {
  0: '#0b1221',
  I: '#06b6d4',
  J: '#3b82f6',
  L: '#f97316',
  O: '#facc15',
  S: '#22c55e',
  T: '#a855f7',
  Z: '#ef4444',
};

const arena = createMatrix(10, 20);
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let score = 0;
let linesCleared = 0;
let level = 1;

const player = {
  pos: { x: 0, y: 0 },
  matrix: createPiece(),
};

function createMatrix(w, h) {
  const matrix = [];
  while (h--) {
    matrix.push(new Array(w).fill(0));
  }
  return matrix;
}

function createPiece() {
  const pieces = 'TJLOSZI';
  const type = pieces[(pieces.length * Math.random()) | 0];
  switch (type) {
    case 'T':
      return [
        ['T', 'T', 'T'],
        [0, 'T', 0],
        [0, 0, 0],
      ];
    case 'O':
      return [
        ['O', 'O'],
        ['O', 'O'],
      ];
    case 'L':
      return [
        [0, 'L', 0],
        [0, 'L', 0],
        [0, 'L', 'L'],
      ];
    case 'J':
      return [
        [0, 'J', 0],
        [0, 'J', 0],
        ['J', 'J', 0],
      ];
    case 'I':
      return [
        [0, 0, 0, 0],
        ['I', 'I', 'I', 'I'],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];
    case 'S':
      return [
        [0, 'S', 'S'],
        ['S', 'S', 0],
        [0, 0, 0],
      ];
    case 'Z':
      return [
        ['Z', 'Z', 0],
        [0, 'Z', 'Z'],
        [0, 0, 0],
      ];
    default:
      return [[0]];
  }
}

function collide(arena, player) {
  const m = player.matrix;
  const o = player.pos;
  for (let y = 0; y < m.length; ++y) {
    for (let x = 0; x < m[y].length; ++x) {
      if (m[y][x] !== 0 && (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
        return true;
      }
    }
  }
  return false;
}

function merge(arena, player) {
  player.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        arena[y + player.pos.y][x + player.pos.x] = value;
      }
    });
  });
}

function arenaSweep() {
  let rows = 0;
  outer: for (let y = arena.length - 1; y >= 0; --y) {
    for (let x = 0; x < arena[y].length; ++x) {
      if (arena[y][x] === 0) {
        continue outer;
      }
    }
    const row = arena.splice(y, 1)[0].fill(0);
    arena.unshift(row);
    ++rows;
    ++y; // check same row index again after unshift
  }

  if (rows > 0) {
    linesCleared += rows;
    score += [0, 100, 300, 500, 800][rows];
    level = 1 + Math.floor(linesCleared / 10);
    dropInterval = Math.max(120, 1000 - (level - 1) * 80);
    updateHUD();
  }
}

function rotate(matrix, dir) {
  for (let y = 0; y < matrix.length; ++y) {
    for (let x = 0; x < y; ++x) {
      [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
    }
  }
  if (dir > 0) {
    matrix.forEach((row) => row.reverse());
  } else {
    matrix.reverse();
  }
}

function playerDrop() {
  player.pos.y++;
  if (collide(arena, player)) {
    player.pos.y--;
    merge(arena, player);
    resetPlayer();
    arenaSweep();
  }
  dropCounter = 0;
}

function playerMove(offset) {
  player.pos.x += offset;
  if (collide(arena, player)) {
    player.pos.x -= offset;
  }
}

function playerRotate(dir) {
  const pos = player.pos.x;
  let offset = 1;
  rotate(player.matrix, dir);
  while (collide(arena, player)) {
    player.pos.x += offset;
    offset = -(offset + (offset > 0 ? 1 : -1));
    if (offset > player.matrix[0].length) {
      rotate(player.matrix, -dir);
      player.pos.x = pos;
      return;
    }
  }
}

function resetPlayer() {
  player.matrix = createPiece();
  player.pos.y = 0;
  player.pos.x = ((arena[0].length / 2) | 0) - ((player.matrix[0].length / 2) | 0);
  if (collide(arena, player)) {
    arena.forEach((row) => row.fill(0));
    score = 0;
    linesCleared = 0;
    level = 1;
    dropInterval = 1000;
    updateHUD();
  }
}

function updateHUD() {
  document.getElementById('score').textContent = score;
  document.getElementById('lines').textContent = linesCleared;
  document.getElementById('level').textContent = level;
}

function drawMatrix(matrix, offset) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        ctx.fillStyle = colors[value];
        ctx.fillRect((x + offset.x) * scale, (y + offset.y) * scale, scale, scale);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.strokeRect((x + offset.x) * scale, (y + offset.y) * scale, scale, scale);
      }
    });
  });
}

function drawGrid() {
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  for (let y = 0; y < arena.length; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * scale);
    ctx.lineTo(canvas.width, y * scale);
    ctx.stroke();
  }
  for (let x = 0; x < arena[0].length; x++) {
    ctx.beginPath();
    ctx.moveTo(x * scale, 0);
    ctx.lineTo(x * scale, canvas.height);
    ctx.stroke();
  }
}

function draw() {
  ctx.fillStyle = colors[0];
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawGrid();
  drawMatrix(arena, { x: 0, y: 0 });
  drawMatrix(player.matrix, player.pos);
}

function update(time = 0) {
  const deltaTime = time - lastTime;
  lastTime = time;
  dropCounter += deltaTime;

  if (dropCounter > dropInterval) {
    playerDrop();
  }

  draw();
  requestAnimationFrame(update);
}

function handleAction(action) {
  switch (action) {
    case 'left':
      playerMove(-1);
      break;
    case 'right':
      playerMove(1);
      break;
    case 'rotate':
      playerRotate(1);
      break;
    case 'drop':
      playerDrop();
      break;
    default:
      break;
  }
}

document.addEventListener('keydown', (event) => {
  if (event.code === 'ArrowLeft') {
    handleAction('left');
  } else if (event.code === 'ArrowRight') {
    handleAction('right');
  } else if (event.code === 'ArrowUp') {
    handleAction('rotate');
  } else if (event.code === 'ArrowDown') {
    handleAction('drop');
  } else if (event.code === 'Space') {
    handleAction('drop');
  }
});

const buttons = document.querySelectorAll('.ctrl');
buttons.forEach((btn) => {
  btn.addEventListener('pointerdown', () => handleAction(btn.dataset.action));
});

document.getElementById('reset-btn').addEventListener('click', () => {
  arena.forEach((row) => row.fill(0));
  score = 0;
  linesCleared = 0;
  level = 1;
  dropInterval = 1000;
  updateHUD();
  resetPlayer();
});

resetPlayer();
updateHUD();
update();
