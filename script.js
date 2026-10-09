
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreText = document.getElementById("score");
const bestText = document.getElementById("best");
const overlay = document.getElementById("overlay");
const startBtn = document.getElementById("startBtn");
const panelIcon = document.getElementById("panelIcon");
const panelTitle = document.getElementById("panelTitle");
const panelText = document.getElementById("panelText");

// Your bus image is in the same folder as index.html.
const busImage = new Image();
busImage.src = "BRTC.png";

const W = canvas.width;
const H = canvas.height;

// Three highway lanes.
const lanes = [250, 480, 710];

let bus = {
  lane: 1,
  x: lanes[1],
  y: 350,
  width: 150,
  height: 75
};

let obstacles = [];
let score = 0;
let best = 0;
let speed = 260;
let roadOffset = 0;
let spawnTimer = 1;
let running = false;
let paused = false;
let lastTime = 0;
let animationId = 0;

try {
  best = Number(localStorage.getItem("brtcRunnerBest")) || 0;
} catch (error) {}

bestText.textContent = best;

function resetGame() {
  bus.lane = 1;
  bus.x = lanes[1];
  obstacles = [];
  score = 0;
  speed = 260;
  roadOffset = 0;
  spawnTimer = 1;

  scoreText.textContent = "0";
}

function startGame() {
  cancelAnimationFrame(animationId);
  resetGame();

  running = true;
  paused = false;

  overlay.classList.add("hidden");

  lastTime = performance.now();
  animationId = requestAnimationFrame(gameLoop);
}

function moveBus(direction) {
  if (!running || paused) return;

  bus.lane = Math.max(0, Math.min(2, bus.lane + direction));
}

function spawnObstacle() {
  const lane = Math.floor(Math.random() * 3);

  // Cars and roadblocks.
  const types = ["🚗", "🚙", "🚕", "🚧"];

  obstacles.push({
    lane,
    x: lanes[lane],
    y: -60,
    type: types[Math.floor(Math.random() * types.length)]
  });
}

function drawBackground() {
  // Sky.
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#65b8ee");
  sky.addColorStop(1, "#d4efff");

  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // Distant hills.
  ctx.fillStyle = "#75ad65";
  ctx.beginPath();
  ctx.moveTo(0, 210);

  for (let x = 0; x <= W; x += 50) {
    ctx.lineTo(
      x,
      175 + Math.sin(x * 0.015) * 24
    );
  }

  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();

  // Grass.
  ctx.fillStyle = "#31834a";
  ctx.fillRect(0, 260, W, H - 260);

  // Highway.
  ctx.fillStyle = "#303640";
  ctx.fillRect(125, 0, 710, H);

  // Road shoulders.
  ctx.fillStyle = "#f0eee6";
  ctx.fillRect(125, 0, 9, H);
  ctx.fillRect(826, 0, 9, H);

  // Lane markings.
  ctx.strokeStyle = "#f7f2d7";
  ctx.lineWidth = 5;
  ctx.setLineDash([30, 25]);
  ctx.lineDashOffset = -roadOffset;

  for (const x of [365, 595]) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }

  ctx.setLineDash([]);
}

function drawBus() {
  // Smooth lane changes.
  bus.x += (lanes[bus.lane] - bus.x) *
    Math.min(1, 10 * (1 / 60));

  if (busImage.complete && busImage.naturalWidth > 0) {
    // Draw the complete photo.
    // The original scenery may remain visible around the bus.
    ctx.drawImage(
      busImage,
      bus.x - bus.width / 2,
      bus.y,
      bus.width,
      bus.height
    );
  } else {
    // Temporary bus until BRTC.png loads.
    ctx.fillStyle = "#ed2145";
    ctx.fillRect(bus.x - 65, bus.y + 8, 130, 45);

    ctx.fillStyle = "#087f70";
    ctx.fillRect(bus.x + 25, bus.y + 8, 40, 45);

    ctx.fillStyle = "#b8eaf5";
    ctx.fillRect(bus.x + 34, bus.y + 15, 22, 15);

    ctx.fillStyle = "#171b21";
    ctx.beginPath();
    ctx.arc(bus.x - 35, bus.y + 53, 11, 0, Math.PI * 2);
    ctx.arc(bus.x + 40, bus.y + 53, 11, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawObstacles() {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "42px sans-serif";

  for (const obstacle of obstacles) {
    ctx.fillText(obstacle.type, obstacle.x, obstacle.y);
  }
}

function update(dt) {
  score += dt * speed * 0.05;
  speed = Math.min(480, 260 + score * 0.12);

  roadOffset = (roadOffset + speed * dt) % 55;
  scoreText.textContent = Math.floor(score);

  spawnTimer -= dt;

  if (spawnTimer <= 0) {
    spawnObstacle();
    spawnTimer = Math.max(0.65, 1.35 - score / 2500)
      + Math.random() * 0.35;
  }

  for (const obstacle of obstacles) {
    obstacle.y += speed * dt;
  }

  obstacles = obstacles.filter(o => o.y < H + 60);

  // Bus collision box.
  const busLeft = bus.x - 52;
  const busRight = bus.x + 52;
  const busTop = bus.y + 17;
  const busBottom = bus.y + 65;

  for (const obstacle of obstacles) {
    const ox = obstacle.x;
    const oy = obstacle.y;

    if (
      busLeft < ox + 25 &&
      busRight > ox - 25 &&
      busTop < oy + 20 &&
      busBottom > oy - 20
    ) {
      endGame();
      return;
    }
  }
}

function draw() {
  drawBackground();
  drawObstacles();
  drawBus();
}

function endGame() {
  running = false;
  paused = false;

  if (Math.floor(score) > best) {
    best = Math.floor(score);
    bestText.textContent = best;

    try {
      localStorage.setItem("brtcRunnerBest", String(best));
    } catch (error) {}
  }

  panelIcon.textContent = "💥";
  panelTitle.textContent = "TRIP OVER!";
  panelText.textContent =
    `Distance: ${Math.floor(score)} metres. Can you beat your record?`;

  startBtn.textContent = "DRIVE AGAIN";
  overlay.classList.remove("hidden");
}

function togglePause() {
  if (!running) return;

  paused = !paused;

  if (paused) {
    panelIcon.textContent = "⏸️";
    panelTitle.textContent = "PAUSED";
    panelText.textContent = "Ready to get back on the highway?";
    startBtn.textContent = "RESUME";
    overlay.classList.remove("hidden");
  } else {
    overlay.classList.add("hidden");
    lastTime = performance.now();
    animationId = requestAnimationFrame(gameLoop);
  }
}

function gameLoop(now) {
  if (!running || paused) return;

  const dt = Math.min((now - lastTime) / 1000, 0.04);
  lastTime = now;

  update(dt);
  draw();

  if (running && !paused) {
    animationId = requestAnimationFrame(gameLoop);
  }
}

// Keyboard controls.
document.addEventListener("keydown", event => {
  const key = event.key.toLowerCase();

  if (["arrowleft", "arrowright", " "].includes(key)) {
    event.preventDefault();
  }

  if (key === "arrowleft" || key === "a") {
    moveBus(-1);
  }

  if (key === "arrowright" || key === "d") {
    moveBus(1);
  }

  if (key === "p") {
    togglePause();
  }

  if (key === "enter" && !running) {
    startGame();
  }
});

// Mobile controls.
document.getElementById("leftBtn").addEventListener("click", () => {
  moveBus(-1);
});

document.getElementById("rightBtn").addEventListener("click", () => {
  moveBus(1);
});

startBtn.addEventListener("click", () => {
  if (paused) {
    togglePause();
  } else {
    startGame();
  }
});

// Redraw after the bus image loads.
busImage.onload = () => {
  draw();
};

busImage.onerror = () => {
  console.error("Could not load BRTC.png. Check the filename and folder.");
};

// Initial screen.
draw();