// --- LOGIC GHOSTS ---

// Các trạng thái của Ghost
const GHOST_STATE = {
  CHASE: "chase",
  SCATTER: "scatter",
  FRIGHTENED: "frightened",
};

/**
 * Class Ghost - Class cha cho tất cả các con ma
 * Triển khai bộ não chung (Core AI Logic) cho các con ma
 */
class Ghost {
  /**
   * @param {number} x - Tọa độ X ban đầu
   * @param {number} y - Tọa độ Y ban đầu
   * @param {string} color - Màu của ghost (red, pink, orange, blue)
   */
  constructor(x, y, color) {
    // Vị trí hiện tại
    this.x = x;
    this.y = y;

    // Hướng di chuyển hiện tại (dx, dy)
    this.dx = 0;
    this.dy = 0;

    // Vị trí trước đó (để chặn quay đầu)
    this.previousX = x;
    this.previousY = y;

    // Tốc độ di chuyển (số ô mỗi frame, mặc định 1)
    this.speed = 1;

    // Trạng thái hiện tại: Chase, Scatter, hoặc Frightened
    this.current_state = GHOST_STATE.CHASE;

    // Điểm đến hiện tại (target tile)
    this.target_tile = { x: x, y: y };

    // Màu của ghost
    this.color = color;
  }

  /**
   * Lấy vị trí hiện tại dưới dạng object
   * @returns {Object} {x: number, y: number}
   */
  get position() {
    return { x: this.x, y: this.y };
  }

  /**
   * Lấy hướng di chuyển hiện tại dưới dạng object
   * @returns {Object} {dx: number, dy: number}
   */
  get direction() {
    return { dx: this.dx, dy: this.dy };
  }

  /**
   * Kiểm tra có đang ở chế độ Frightened không
   * @returns {boolean}
   */
  isFrightened() {
    return this.current_state === GHOST_STATE.FRIGHTENED;
  }

  /**
   * Tính toán và trả về hướng di chuyển tiếp theo dựa trên target tile
   * Thuật toán: Chọn ô lân cận có khoảng cách nhỏ nhất đến target
   * @param {Object} target - Điểm đến {x: number, y: number}
   * @returns {Object|null} Hướng di chuyển {dx: number, dy: number} hoặc null nếu không tìm thấy
   */
  calculate_next_move(target) {
    // Cập nhật target_tile
    this.target_tile = target;

    // Lấy vị trí hiện tại và vị trí trước đó
    const current_tile = this.position;
    const previous_tile =
      this.previousX !== null && this.previousY !== null
        ? { x: this.previousX, y: this.previousY }
        : null;

    // Lấy danh sách các ô lân cận hợp lệ (không phải tường, không quay đầu trừ khi Frightened)
    const validNeighbors = get_valid_neighbors(
      current_tile,
      previous_tile,
      this.isFrightened()
    );

    // Nếu không có ô lân cận hợp lệ, trả về null
    if (validNeighbors.length === 0) {
      return null;
    }

    // Tính khoảng cách từ mỗi ô lân cận đến target
    let bestNeighbor = null;
    let minDistance = Infinity;

    for (let neighbor of validNeighbors) {
      const distance = get_euclidean_distance(neighbor, target);

      // Nếu khoảng cách nhỏ hơn, cập nhật lựa chọn tốt nhất
      if (distance < minDistance) {
        minDistance = distance;
        bestNeighbor = neighbor;
      }
    }

    // Trả về hướng di chuyển của ô tốt nhất
    if (bestNeighbor) {
      return {
        dx: bestNeighbor.dx,
        dy: bestNeighbor.dy,
      };
    }

    return null;
  }

  /**
   * Cập nhật hướng di chuyển dựa trên target
   * @param {Object} target - Điểm đến {x: number, y: number}
   */
  updateDirection(target) {
    const nextMove = this.calculate_next_move(target);
    if (nextMove) {
      this.dx = nextMove.dx;
      this.dy = nextMove.dy;
    }
  }

  /**
   * Di chuyển ghost đến vị trí tiếp theo
   */
  move() {
    // Lưu vị trí hiện tại trước khi di chuyển
    this.previousX = this.x;
    this.previousY = this.y;

    // Tính vị trí tiếp theo
    let nextX = this.x + this.dx;
    let nextY = this.y + this.dy;

    // Xử lý tunnel (wrap around) cho trục X
    const cols = currentMap[0].length;
    if (nextX < 0) nextX = cols - 1;
    else if (nextX >= cols) nextX = 0;

    // Kiểm tra có thể di chuyển không (không phải tường và trong biên)
    if (
      nextY >= 0 &&
      nextY < currentMap.length &&
      currentMap[nextY][nextX] !== 1
    ) {
      this.x = nextX;
      this.y = nextY;
    }
  }

  /**
   * Cập nhật trạng thái của ghost (sẽ được override bởi các class con)
   * Logic mặc định: Chase mode - đuổi theo PacMan
   */
  update() {
    // Logic mặc định: Chase mode - đuổi theo PacMan
    // Các class con sẽ override để có logic riêng cho từng trạng thái
    if (this.current_state === GHOST_STATE.CHASE) {
      this.target_tile = { x: pacMan.x, y: pacMan.y };
    } else if (this.current_state === GHOST_STATE.FRIGHTENED) {
      // Frightened mode: chạy trốn (sẽ được override bởi class con)
      // Tạm thời đuổi theo PacMan (logic này sẽ được thay thế)
      this.target_tile = { x: pacMan.x, y: pacMan.y };
    } else if (this.current_state === GHOST_STATE.SCATTER) {
      // Scatter mode: về góc (sẽ được override bởi class con)
      // Tạm thời đuổi theo PacMan (logic này sẽ được thay thế)
      this.target_tile = { x: pacMan.x, y: pacMan.y };
    }
  }
}

let ghosts = [];

function spawnGhosts(mapData) {
  let spawnedGhosts = [];
  let colors = ["red", "pink", "orange", "blue"];
  let houseTiles = [];

  // 1. Tìm tất cả ô nhà ma (số 2)
  for (let y = 0; y < mapData.length; y++) {
    for (let x = 0; x < mapData[0].length; x++) {
      if (mapData[y][x] === 2) {
        houseTiles.push({ x: x, y: y });
      }
    }
  }

  if (houseTiles.length === 0) return [];

  // 2. Lấy vị trí giữa danh sách
  let mid = Math.floor(houseTiles.length / 2);

  // 3. Đặt 4 con ma sử dụng class Ghost
  // Đỏ (Giữa)
  if (houseTiles[mid])
    spawnedGhosts.push(
      new Ghost(houseTiles[mid].x, houseTiles[mid].y, colors[0])
    );

  // Hồng (Trái Đỏ)
  if (houseTiles[mid - 1])
    spawnedGhosts.push(
      new Ghost(houseTiles[mid - 1].x, houseTiles[mid - 1].y, colors[1])
    );

  // Cam (Phải Đỏ)
  if (houseTiles[mid + 1])
    spawnedGhosts.push(
      new Ghost(houseTiles[mid + 1].x, houseTiles[mid + 1].y, colors[2])
    );

  // Xanh (Phải Cam)
  if (houseTiles[mid + 2])
    spawnedGhosts.push(
      new Ghost(houseTiles[mid + 2].x, houseTiles[mid + 2].y, colors[3])
    );

  return spawnedGhosts;
}

function updateGhosts() {
  if (!ghosts || ghosts.length === 0) return;

  for (let ghost of ghosts) {
    // Cập nhật trạng thái và tính target tile (sẽ được override bởi class con)
    ghost.update();

    // Sử dụng thuật toán Target Tile để tính hướng di chuyển
    ghost.updateDirection(ghost.target_tile);

    // Di chuyển ghost
    ghost.move();
  }
}

function drawGhosts() {
  if (!ghosts || ghosts.length === 0) return;

  for (let ghost of ghosts) {
    // Chọn hình ảnh dựa trên trạng thái
    let img;
    if (ghost.isFrightened()) {
      img = ghostImages.scared || ghostImages.red;
    } else {
      img = ghostImages[ghost.color] || ghostImages.red;
    }

    ctx.drawImage(
      img,
      ghost.x * TILE_SIZE,
      ghost.y * TILE_SIZE,
      TILE_SIZE,
      TILE_SIZE
    );
  }
}
