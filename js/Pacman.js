// --- LOGIC PAC-MAN ---

let pacMan = {
  x: 1,
  y: 1,
  dx: 0,
  dy: 0,
  nextDx: 0,
  nextDy: 0,
  rotation: "right",
};

function updatePacman() {
  const rows = currentMap.length;
  const cols = currentMap[0].length;

  // 1. Xử lý hướng dự kiến (Turning)
  let checkX = pacMan.x + pacMan.nextDx;
  let checkY = pacMan.y + pacMan.nextDy;

  // -- Xử lý Tunnel khi check hướng rẽ --
  if (checkX < 0) checkX = cols - 1;
  else if (checkX >= cols) checkX = 0;

  if (currentMap[checkY][checkX] !== 1) {
    pacMan.dx = pacMan.nextDx;
    pacMan.dy = pacMan.nextDy;
  }

  // Cập nhật hướng quay mặt để vẽ ảnh
  if (pacMan.dx === 1) pacMan.rotation = "right";
  else if (pacMan.dx === -1) pacMan.rotation = "left";
  else if (pacMan.dy === -1) pacMan.rotation = "up";
  else if (pacMan.dy === 1) pacMan.rotation = "down";

  // 2. Tính vị trí tiếp theo
  let nextX = pacMan.x + pacMan.dx;
  let nextY = pacMan.y + pacMan.dy;

  // -- Xử lý Tunnel khi di chuyển thật (Logic bạn cần) --
  if (nextX < 0) nextX = cols - 1; // Đi quá bên trái -> Về bên phải
  else if (nextX >= cols) nextX = 0; // Đi quá bên phải -> Về bên trái

  // 3. Di chuyển nếu không đụng tường
  if (currentMap[nextY][nextX] !== 1) {
    pacMan.x = nextX;
    pacMan.y = nextY;
  }

  // 4. Ăn điểm và power pellet
  const currentCell = currentMap[pacMan.y][pacMan.x];
  if (currentCell === 0) {
    // Ăn kẹo thường
    currentMap[pacMan.y][pacMan.x] = 3;
    score += 10;
    document.getElementById("scoreDisplay").textContent = `Score: ${score}`;
  } else if (currentCell === POWER_PELLET_VALUE) {
    // Ăn power pellet (kẹo lớn)
    currentMap[pacMan.y][pacMan.x] = 3;
    score += 50;
    document.getElementById("scoreDisplay").textContent = `Score: ${score}`;
    
    // Kích hoạt Frightened mode cho tất cả ghosts
    activateFrightenedMode();
  }
}

function drawPacman() {
  let img = pacImages[pacMan.rotation] || pacImages.right;
  ctx.drawImage(
    img,
    pacMan.x * TILE_SIZE,
    pacMan.y * TILE_SIZE,
    TILE_SIZE,
    TILE_SIZE
  );
}
