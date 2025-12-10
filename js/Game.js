// --- GAME ENGINE & UTILS ---

function cloneMap(mapData) {
  return structuredClone(mapData);
}

/**
 * Thêm power pellets vào map (tùy chọn)
 * Power pellets sẽ được đặt ở 2 vị trí ngẫu nhiên trong các ô đường đi
 * @param {Array<Array<number>>} mapData - Dữ liệu map
 */
function addPowerPelletsToMap(mapData) {
  if (!mapData || mapData.length === 0) return;
  const rows = mapData.length;
  const cols = mapData[0].length;

  // Tìm tất cả các ô đường đi (cell = 0 hoặc 3)
  let validSpots = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      // Chỉ lấy đường đi (0 hoặc 3), tránh tường (1) và nhà ma (2)
      if (mapData[y][x] === 0 || mapData[y][x] === 3) {
        validSpots.push({ x: x, y: y });
      }
    }
  }

  // Đặt 2 power pellets ở vị trí ngẫu nhiên
  const numPellets = Math.min(2, validSpots.length);
  for (let i = 0; i < numPellets; i++) {
    if (validSpots.length === 0) break;

    const randomIndex = Math.floor(Math.random() * validSpots.length);
    const spot = validSpots[randomIndex];
    mapData[spot.y][spot.x] = POWER_PELLET_VALUE;

    // Xóa vị trí đã chọn để tránh trùng lặp
    validSpots.splice(randomIndex, 1);
  }
}

function findRandomSpawnPoint(mapData) {
  let validSpots = [];
  for (let y = 0; y < mapData.length; y++) {
    for (let x = 0; x < mapData[0].length; x++) {
      // Chỉ lấy đường đi (0), tránh tường (1) và nhà ma (2)
      if (mapData[y][x] === 0) {
        validSpots.push({ x: x, y: y });
      }
    }
  }
  if (validSpots.length === 0) return { x: 1, y: 1 };

  const randomIndex = Math.floor(Math.random() * validSpots.length);
  return validSpots[randomIndex];
}

function startGame() {
  // 1. Reset Loop
  if (gameInterval) clearInterval(gameInterval);

  // Ẩn màn hình game-over, victory và play button nếu đang hiển thị
  hideGameOverScreen();
  hideVictoryScreen();
  hidePlayButton();

  gameStarted = true;

  // 2. Chọn Map Ngẫu Nhiên (Logic cũ của bạn)
  const totalMaps = MAPS.length;
  let shown = [];
  try {
    shown = JSON.parse(localStorage.getItem("shownMaps") || "[]");
  } catch (e) {
    shown = [];
  }
  if (shown.length >= totalMaps) shown = [];

  const available = [];
  for (let i = 0; i < totalMaps; i++) {
    if (!shown.includes(i)) available.push(i);
  }
  const idx = available[Math.floor(Math.random() * available.length)];
  shown.push(idx);
  localStorage.setItem("shownMaps", JSON.stringify(shown));

  const selectedMap = MAPS[idx];
  currentMap = cloneMap(selectedMap.map);
  currentWallColor = selectedMap.wall_color || "#09f";

  // Thêm power pellets vào map (tùy chọn - có thể comment nếu không muốn)
  addPowerPelletsToMap(currentMap);

  // 3. Reset State
  score = 0;
  lives = 3; // Reset số mạng
  gameOver = false;
  document.getElementById("scoreDisplay").textContent = `Score: 0`;
  updateLivesDisplay(); // Cập nhật hiển thị mạng

  // Resize Canvas
  canvas.width = currentMap[0].length * TILE_SIZE;
  canvas.height = currentMap.length * TILE_SIZE;

  // 4. Spawn Pac-Man (Random + Xóa kẹo)
  const spawn = findRandomSpawnPoint(currentMap);
  pacMan.x = spawn.x;
  pacMan.y = spawn.y;
  pacMan.dx = 0;
  pacMan.dy = 0;
  pacMan.nextDx = 0;
  pacMan.nextDy = 0;
  pacMan.rotation = "right";
  currentMap[pacMan.y][pacMan.x] = 3; // Xóa kẹo để điểm là 0

  // 5. Spawn Ghosts
  ghosts = spawnGhosts(currentMap);

  // 6. Khởi tạo Ghost State Timer
  initGhostStateTimer();

  // 7. Reset Frightened Timer
  frightenedTimer = 0;

  // 8. Start Loop ( Chỉnh tốc độ ở đây)
  gameInterval = setInterval(gameLoop, 200);
}

function gameLoop() {
  if (gameOver || !gameStarted) return;
  update();
  draw();
}

function update() {
  // === CẬP NHẬT TIMER ===
  updateGhostStateTimer(); // Cập nhật timer Scatter/Chase
  updateFrightenedTimer(); // Cập nhật timer Frightened

  // === CẬP NHẬT ENTITIES ===
  updatePacman(); // Logic Pacman nằm ở file Pacman.js
  updateGhosts(); // Logic Ma sử dụng Target Tile Algorithm

  // === KIỂM TRA VA CHẠM GIỮA PACMAN VÀ GHOSTS ===
  if (ghosts && ghosts.length > 0) {
    for (let ghost of ghosts) {
      // Kiểm tra va chạm tại vị trí hiện tại
      if (pacMan.x === ghost.x && pacMan.y === ghost.y) {
        // Va chạm xảy ra
        if (ghost.isFrightened()) {
          // === PACMAN ĂN GHOST (FRIGHTENED MODE) ===
          // Tăng điểm
          score += 200;
          document.getElementById(
            "scoreDisplay"
          ).textContent = `Score: ${score}`;

          // Reset ghost về nhà ma (tìm ô nhà ma gần nhất)
          let houseTiles = [];
          for (let y = 0; y < currentMap.length; y++) {
            for (let x = 0; x < currentMap[0].length; x++) {
              if (currentMap[y][x] === 2) {
                houseTiles.push({ x: x, y: y });
              }
            }
          }
          if (houseTiles.length > 0) {
            const mid = Math.floor(houseTiles.length / 2);
            ghost.x = houseTiles[mid].x;
            ghost.y = houseTiles[mid].y;
            ghost.dx = 0;
            ghost.dy = 0;
            ghost.current_state = GHOST_STATE.CHASE; // Reset về chế độ bình thường
          }
        } else {
          // === GHOST ĂN PACMAN (NORMAL MODE) ===
          lives--;
          if (lives <= 0) {
            gameOver = true;
            showGameOverScreen();
            return;
          } else {
            // Reset vị trí PacMan
            const spawn = findRandomSpawnPoint(currentMap);
            pacMan.x = spawn.x;
            pacMan.y = spawn.y;
            pacMan.dx = 0;
            pacMan.dy = 0;
            pacMan.nextDx = 0;
            pacMan.nextDy = 0;
            pacMan.rotation = "right";
            currentMap[pacMan.y][pacMan.x] = 3;

            // Reset vị trí Ghosts
            ghosts = spawnGhosts(currentMap);

            // Reset Timer
            initGhostStateTimer();
            frightenedTimer = 0;

            // Cập nhật hiển thị mạng
            updateLivesDisplay();
          }
        }
        break; // Chỉ xử lý 1 va chạm mỗi frame
      }
    }
  }

  // === KIỂM TRA ĐIỀU KIỆN THẮNG ===
  checkVictoryCondition();
}

/**
 * Kiểm tra điều kiện thắng: ăn hết tất cả kẹo (cell = 0) và power pellets (cell = 4)
 * Chỉ còn lại tường (1), nhà ma (2), và đường trống (3)
 */
function checkVictoryCondition() {
  if (!currentMap || currentMap.length === 0 || gameOver) return;

  const rows = currentMap.length;
  const cols = currentMap[0].length;

  // Kiểm tra xem còn kẹo hoặc power pellet nào không
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const cell = currentMap[y][x];
      // Nếu còn kẹo (0) hoặc power pellet (4) thì chưa thắng
      if (cell === 0 || cell === POWER_PELLET_VALUE) {
        return; // Còn kẹo, chưa thắng
      }
    }
  }

  // Nếu không còn kẹo nào, người chơi thắng
  gameOver = true;
  showVictoryScreen();
}

function draw() {
  // Kiểm tra map có dữ liệu không
  if (!currentMap || currentMap.length === 0 || !currentMap[0]) {
    return; // Không vẽ nếu map chưa được khởi tạo
  }

  // Xóa màn hình
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const rows = currentMap.length;
  const cols = currentMap[0].length;

  // Vẽ Map
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const cell = currentMap[y][x];
      // Vẽ nền đen
      if (cell !== 1) {
        ctx.fillStyle = "black";
        ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }

      if (cell === 1) {
        ctx.fillStyle = currentWallColor;
        ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      } else if (cell === 2) {
        ctx.fillStyle = "#444";
        ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      } else if (cell === 0) {
        // Vẽ kẹo thường (chấm trắng nhỏ)
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(
          x * TILE_SIZE + TILE_SIZE / 2,
          y * TILE_SIZE + TILE_SIZE / 2,
          2,
          0,
          Math.PI * 2
        );
        ctx.fill();
      } else if (cell === POWER_PELLET_VALUE) {
        // Vẽ power pellet bằng hình cherry
        if (cherryImage.complete && cherryImage.naturalWidth > 0) {
          ctx.drawImage(
            cherryImage,
            x * TILE_SIZE,
            y * TILE_SIZE,
            TILE_SIZE,
            TILE_SIZE
          );
        } else {
          // Fallback: vẽ hình tròn trắng nếu hình chưa load xong
          ctx.fillStyle = "white";
          ctx.beginPath();
          ctx.arc(
            x * TILE_SIZE + TILE_SIZE / 2,
            y * TILE_SIZE + TILE_SIZE / 2,
            6,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      }
    }
  }

  // Vẽ thực thể
  drawPacman();
  drawGhosts();

  // Cập nhật hiển thị mạng (lives) ở panel bên trái
  updateLivesDisplay();
}

function updateLivesDisplay() {
  const livesCountEl = document.getElementById("livesCount");
  const heartsContainer = document.getElementById("heartsContainer");

  // Cập nhật số mạng
  if (livesCountEl) {
    livesCountEl.textContent = lives;
  }

  // Cập nhật hình tim
  if (heartsContainer) {
    heartsContainer.innerHTML = "";
    for (let i = 0; i < lives; i++) {
      const heartImg = document.createElement("img");
      heartImg.src = heartImage.src;
      heartImg.className = "heart-icon";
      heartImg.alt = "Heart";
      heartsContainer.appendChild(heartImg);
    }
  }
}

// --- SỰ KIỆN INPUT ---
document.addEventListener("keydown", (e) => {
  if (gameOver) return;
  switch (e.key) {
    case "ArrowLeft":
      pacMan.nextDx = -1;
      pacMan.nextDy = 0;
      break;
    case "ArrowRight":
      pacMan.nextDx = 1;
      pacMan.nextDy = 0;
      break;
    case "ArrowUp":
      pacMan.nextDx = 0;
      pacMan.nextDy = -1;
      break;
    case "ArrowDown":
      pacMan.nextDx = 0;
      pacMan.nextDy = 1;
      break;
  }
});

// --- MÀN HÌNH GAME OVER ---
function showGameOverScreen() {
  const gameOverScreen = document.getElementById("gameOverScreen");
  const finalScoreEl = document.getElementById("finalScore");
  finalScoreEl.textContent = score;
  gameOverScreen.classList.add("show");
  gameStarted = false; // Dừng game loop
}

function hideGameOverScreen() {
  const gameOverScreen = document.getElementById("gameOverScreen");
  gameOverScreen.classList.remove("show");
}

function showPlayButton() {
  const playButton = document.getElementById("playButton");
  if (playButton) {
    playButton.classList.add("show");
  }
}

function hidePlayButton() {
  const playButton = document.getElementById("playButton");
  if (playButton) {
    playButton.classList.remove("show");
  }
}

// --- MÀN HÌNH CHIẾN THẮNG ---
function showVictoryScreen() {
  const victoryScreen = document.getElementById("victoryScreen");
  const victoryScoreEl = document.getElementById("victoryScore");
  if (victoryScoreEl) {
    victoryScoreEl.textContent = score;
  }
  if (victoryScreen) {
    victoryScreen.classList.add("show");
  }
  gameStarted = false; // Dừng game loop
}

function hideVictoryScreen() {
  const victoryScreen = document.getElementById("victoryScreen");
  if (victoryScreen) {
    victoryScreen.classList.remove("show");
  }
}

// Khởi chạy khi DOM load xong
document.addEventListener("DOMContentLoaded", () => {
  canvas = document.getElementById("gameCanvas");
  ctx = canvas.getContext("2d");
  scoreEl = document.getElementById("scoreDisplay");

  // Event listener cho nút restart (Game Over)
  const restartButton = document.getElementById("restartButton");
  restartButton.addEventListener("click", () => {
    hideGameOverScreen();
    // Hiển thị play button thay vì tự động start game
    showPlayButton();
  });

  // Event listener cho nút restart (Victory)
  const victoryRestartButton = document.getElementById("victoryRestartButton");
  victoryRestartButton.addEventListener("click", () => {
    hideVictoryScreen();
    // Hiển thị play button thay vì tự động start game
    showPlayButton();
  });

  // Event listener cho nút start
  const startButton = document.getElementById("startButton");
  if (startButton) {
    startButton.addEventListener("click", () => {
      hidePlayButton();
      startGame();
    });
  }

  // Khởi tạo hiển thị mạng
  updateLivesDisplay();

  // Hiển thị nút Play thay vì tự động start game
  showPlayButton();
});
