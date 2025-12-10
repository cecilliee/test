// ============================================================================
// GHOSTS - LOGIC QUẢN LÝ VÀ TÍNH CÁCH CỦA CÁC CON MA
// ============================================================================
// File này chứa:
// - Các subclass với tính cách riêng (Blinky, Pinky, Clyde, Inky)
// - Hàm spawn, update, draw ghosts
// ============================================================================

// ============================================================================
// GHOST SUBCLASSES - CÁC LOẠI MA VỚI TÍNH CÁCH RIÊNG
// ============================================================================

/**
 * Blinky (Red Ghost) - "The Shadow"
 *
 * Tính cách: Đuổi trực tiếp, hung dữ nhất
 * - Luôn đuổi theo vị trí hiện tại của PacMan
 * - Không có chiến thuật đặc biệt, đơn giản và hiệu quả
 * - Được coi là con ma nguy hiểm nhất
 */
class Blinky extends Ghost {
  /**
   * Constructor
   * @param {number} x - Tọa độ X ban đầu
   * @param {number} y - Tọa độ Y ban đầu
   */
  constructor(x, y) {
    super(x, y, "red");
    // Scatter corner: Góc trên phải
    this.scatter_corner = { x: 0, y: 0 };
  }

  /**
   * Cập nhật scatter corner (góc trên phải)
   */
  updateScatterCorner() {
    if (!currentMap || currentMap.length === 0) return;
    const rows = currentMap.length;
    const cols = currentMap[0].length;
    // Góc trên phải: x = cols - 2 (tránh tường biên), y = 1 (tránh tường trên)
    this.scatter_corner = { x: cols - 2, y: 1 };
  }

  /**
   * Luôn đuổi trực tiếp vị trí PacMan
   * Không có tính toán phức tạp, chỉ cần biết vị trí PacMan
   *
   * @returns {Object} {x: number, y: number} - Vị trí PacMan
   */
  get_target() {
    // Cập nhật scatter corner
    this.updateScatterCorner();
    return { x: pacMan.x, y: pacMan.y };
  }
}

/**
 * Pinky (Pink Ghost) - "The Speedy"
 *
 * Tính cách: Đuổi 4 ô phía trước PacMan (ambush strategy)
 * - Cố gắng chặn đường phía trước PacMan
 * - Tạo bẫy bằng cách dự đoán hướng di chuyển của PacMan
 * - Hiệu quả khi PacMan di chuyển theo một hướng cố định
 */
class Pinky extends Ghost {
  /**
   * Constructor
   * @param {number} x - Tọa độ X ban đầu
   * @param {number} y - Tọa độ Y ban đầu
   */
  constructor(x, y) {
    super(x, y, "pink");
    // Scatter corner: Góc trên trái
    this.scatter_corner = { x: 0, y: 0 };
  }

  /**
   * Cập nhật scatter corner (góc trên trái)
   */
  updateScatterCorner() {
    if (!currentMap || currentMap.length === 0) return;
    // Góc trên trái: x = 1 (tránh tường biên), y = 1 (tránh tường trên)
    this.scatter_corner = { x: 1, y: 1 };
  }

  /**
   * Đuổi 4 ô phía trước hướng PacMan đang nhìn
   *
   * Logic:
   * 1. Lấy hướng PacMan đang di chuyển (dx, dy)
   * 2. Nếu PacMan đứng yên, sử dụng hướng dự kiến (nextDx, nextDy)
   * 3. Tính vị trí: PacMan + 4 ô theo hướng
   * 4. Xử lý biên: Giới hạn trong phạm vi map
   *
   * @returns {Object} {x: number, y: number} - Vị trí 4 ô phía trước PacMan
   */
  get_target() {
    // Cập nhật scatter corner
    this.updateScatterCorner();
    // Lấy hướng PacMan đang di chuyển
    let dx = pacMan.dx;
    let dy = pacMan.dy;

    // Nếu PacMan đang đứng yên, sử dụng hướng dự kiến (nextDx, nextDy)
    // Điều này giúp Pinky dự đoán hướng di chuyển tiếp theo
    if (dx === 0 && dy === 0) {
      dx = pacMan.nextDx;
      dy = pacMan.nextDy;
    }

    // Tính vị trí 4 ô phía trước
    let targetX = pacMan.x + dx * 4;
    let targetY = pacMan.y + dy * 4;

    // Xử lý trường hợp vượt quá biên map
    const rows = currentMap.length;
    const cols = currentMap[0].length;

    // Xử lý tunnel cho trục X (giới hạn trong phạm vi map)
    if (targetX < 0) {
      targetX = 0;
    } else if (targetX >= cols) {
      targetX = cols - 1;
    }

    // Giới hạn trục Y
    if (targetY < 0) {
      targetY = 0;
    } else if (targetY >= rows) {
      targetY = rows - 1;
    }

    return { x: targetX, y: targetY };
  }
}

/**
 * Clyde (Orange Ghost) - "The Pokey"
 *
 * Tính cách: Đuổi khi xa (>8 ô), về góc khi gần (<=8 ô)
 * - Thận trọng, không dám đến quá gần PacMan
 * - Khi gần sẽ chạy về góc nhà (scatter corner)
 * - Tạo cảm giác "nhút nhát" và khó đoán
 */
class Clyde extends Ghost {
  /**
   * Constructor
   * @param {number} x - Tọa độ X ban đầu
   * @param {number} y - Tọa độ Y ban đầu
   */
  constructor(x, y) {
    super(x, y, "orange");
    // Scatter corner: Góc dưới trái
    this.scatter_corner = { x: 0, y: 0 };
  }

  /**
   * Cập nhật scatter corner (góc dưới trái)
   * Góc nhà là nơi Clyde sẽ chạy về khi quá gần PacMan hoặc ở Scatter mode
   */
  updateScatterCorner() {
    if (!currentMap || currentMap.length === 0) return;
    const rows = currentMap.length;
    // Góc dưới trái: x = 1 (tránh tường biên), y = rows - 2 (tránh tường dưới)
    this.scatter_corner = { x: 1, y: rows - 2 };
  }

  /**
   * Đuổi khi xa (>8 ô), về góc khi gần (<=8 ô)
   *
   * Logic:
   * 1. Tính khoảng cách Euclidean đến PacMan
   * 2. Nếu distance > 8: Đuổi theo PacMan (như Blinky)
   * 3. Nếu distance <= 8: Về góc nhà (scatter corner)
   *
   * @returns {Object} {x: number, y: number} - Vị trí mục tiêu
   */
  get_target() {
    // Cập nhật scatter corner dựa trên map hiện tại
    this.updateScatterCorner();

    // Tính khoảng cách Euclidean đến PacMan
    const distance = get_euclidean_distance(this.position, {
      x: pacMan.x,
      y: pacMan.y,
    });

    // Nếu khoảng cách > 8: đuổi theo PacMan (như Blinky)
    if (distance > 8) {
      return { x: pacMan.x, y: pacMan.y };
    } else {
      // Nếu khoảng cách <= 8: về góc nhà (scatter corner)
      // Tạo cảm giác "nhút nhát", không dám đến quá gần
      return this.scatter_corner;
    }
  }
}

/**
 * Inky (Blue Ghost) - "The Bashful"
 *
 * Tính cách: Sử dụng vector từ Blinky để tạo bẫy
 * - Phức tạp nhất trong 4 con ma
 * - Cần tham chiếu đến Blinky để tính toán
 * - Tạo bẫy bằng cách sử dụng vector từ Blinky đến pivot point
 * - Hiệu quả khi phối hợp với Blinky
 */
class Inky extends Ghost {
  /**
   * Constructor
   * @param {number} x - Tọa độ X ban đầu
   * @param {number} y - Tọa độ Y ban đầu
   * @param {Blinky|null} blinkyRef - Tham chiếu đến Blinky (null nếu chưa có)
   */
  constructor(x, y, blinkyRef = null) {
    super(x, y, "blue");
    this.blinky = blinkyRef; // Tham chiếu đến Blinky
    // Scatter corner: Góc dưới phải
    this.scatter_corner = { x: 0, y: 0 };
  }

  /**
   * Cập nhật scatter corner (góc dưới phải)
   */
  updateScatterCorner() {
    if (!currentMap || currentMap.length === 0) return;
    const rows = currentMap.length;
    const cols = currentMap[0].length;
    // Góc dưới phải: x = cols - 2 (tránh tường biên), y = rows - 2 (tránh tường dưới)
    this.scatter_corner = { x: cols - 2, y: rows - 2 };
  }

  /**
   * Set tham chiếu đến Blinky
   * @param {Blinky} blinkyRef - Instance của Blinky
   */
  setBlinky(blinkyRef) {
    this.blinky = blinkyRef;
  }

  /**
   * Tính target dựa trên vector từ Blinky
   *
   * Thuật toán:
   * 1. Tìm điểm Pivot: PacMan + 2 ô theo hướng di chuyển
   * 2. Tính Vector từ Blinky -> Pivot
   * 3. Nhân đôi vector: Pivot + Vector * 2
   * 4. Điểm cuối cùng là target của Inky
   *
   * Mục đích: Tạo bẫy bằng cách phối hợp với Blinky
   * - Blinky đuổi trực tiếp từ phía sau
   * - Inky chặn phía trước bằng cách tính vector
   *
   * @returns {Object} {x: number, y: number} - Vị trí mục tiêu
   */
  get_target() {
    // Cập nhật scatter corner
    this.updateScatterCorner();
    // Nếu chưa có tham chiếu đến Blinky, đuổi trực tiếp (fallback)
    if (!this.blinky) {
      return { x: pacMan.x, y: pacMan.y };
    }

    // === BƯỚC 1: TÌM ĐIỂM PIVOT ===
    // Pivot = PacMan + 2 ô theo hướng di chuyển
    // Lấy hướng PacMan đang di chuyển
    let dx = pacMan.dx;
    let dy = pacMan.dy;

    // Nếu PacMan đứng yên, sử dụng hướng dự kiến
    if (dx === 0 && dy === 0) {
      dx = pacMan.nextDx;
      dy = pacMan.nextDy;
    }

    // Tính pivot (PacMan + 2 ô)
    let pivotX = pacMan.x + dx * 2;
    let pivotY = pacMan.y + dy * 2;

    // Xử lý trường hợp vượt quá biên map
    const rows = currentMap.length;
    const cols = currentMap[0].length;

    // Xử lý tunnel cho trục X
    if (pivotX < 0) {
      pivotX = 0;
    } else if (pivotX >= cols) {
      pivotX = cols - 1;
    }

    // Giới hạn trục Y
    if (pivotY < 0) {
      pivotY = 0;
    } else if (pivotY >= rows) {
      pivotY = rows - 1;
    }

    // === BƯỚC 2: TÍNH VECTOR TỪ BLINKY -> PIVOT ===
    const vectorX = pivotX - this.blinky.x;
    const vectorY = pivotY - this.blinky.y;

    // === BƯỚC 3: NHÂN ĐÔI VECTOR VÀ CỘNG VÀO PIVOT ===
    // Target = Pivot + Vector * 2
    // Điều này tạo ra một điểm phía trước pivot, tạo bẫy
    let targetX = pivotX + vectorX;
    let targetY = pivotY + vectorY;

    // Xử lý trường hợp vượt quá biên map
    if (targetX < 0) {
      targetX = 0;
    } else if (targetX >= cols) {
      targetX = cols - 1;
    }

    if (targetY < 0) {
      targetY = 0;
    } else if (targetY >= rows) {
      targetY = rows - 1;
    }

    return { x: targetX, y: targetY };
  }
}

// ============================================================================
// GHOST MANAGEMENT - QUẢN LÝ CÁC CON MA
// ============================================================================

/**
 * Mảng chứa tất cả các con ma trong game
 * @type {Array<Ghost>}
 */
let ghosts = [];

/**
 * Spawn (tạo) các con ma từ map data
 *
 * Logic:
 * 1. Tìm tất cả ô nhà ma (cell = 2) trong map
 * 2. Lấy vị trí giữa danh sách
 * 3. Tạo 4 con ma với tính cách riêng:
 *    - Blinky (Đỏ) - Giữa: Đuổi trực tiếp
 *    - Pinky (Hồng) - Trái Đỏ: Đuổi 4 ô phía trước
 *    - Clyde (Cam) - Phải Đỏ: Đuổi khi xa, về góc khi gần
 *    - Inky (Xanh) - Phải Cam: Sử dụng vector từ Blinky
 * 4. Đảm bảo Inky có tham chiếu đến Blinky
 *
 * @param {Array<Array<number>>} mapData - Dữ liệu map (2D array)
 * @returns {Array<Ghost>} Mảng các ghost đã được tạo
 */
function spawnGhosts(mapData) {
  let spawnedGhosts = [];
  let houseTiles = [];
  let blinkyRef = null; // Tham chiếu đến Blinky cho Inky

  // === BƯỚC 1: TÌM TẤT CẢ Ô NHÀ MA (CELL = 2) ===
  for (let y = 0; y < mapData.length; y++) {
    for (let x = 0; x < mapData[0].length; x++) {
      if (mapData[y][x] === 2) {
        houseTiles.push({ x: x, y: y });
      }
    }
  }

  // Nếu không có ô nhà ma, trả về mảng rỗng
  if (houseTiles.length === 0) return [];

  // === BƯỚC 2: LẤY VỊ TRÍ GIỮA DANH SÁCH ===
  let mid = Math.floor(houseTiles.length / 2);

  // === BƯỚC 3: TẠO 4 CON MA VỚI TÍNH CÁCH RIÊNG ===

  // Blinky (Đỏ) - Giữa
  // Tính cách: Đuổi trực tiếp, hung dữ nhất
  if (houseTiles[mid]) {
    blinkyRef = new Blinky(houseTiles[mid].x, houseTiles[mid].y);
    spawnedGhosts.push(blinkyRef);
  }

  // Pinky (Hồng) - Trái Đỏ
  // Tính cách: Đuổi 4 ô phía trước PacMan (ambush)
  if (houseTiles[mid - 1]) {
    spawnedGhosts.push(new Pinky(houseTiles[mid - 1].x, houseTiles[mid - 1].y));
  }

  // Clyde (Cam) - Phải Đỏ
  // Tính cách: Đuổi khi xa (>8), về góc khi gần (<=8)
  if (houseTiles[mid + 1]) {
    spawnedGhosts.push(new Clyde(houseTiles[mid + 1].x, houseTiles[mid + 1].y));
  }

  // Inky (Xanh) - Phải Cam
  // Tính cách: Sử dụng vector từ Blinky để tạo bẫy
  if (houseTiles[mid + 2]) {
    const inky = new Inky(
      houseTiles[mid + 2].x,
      houseTiles[mid + 2].y,
      blinkyRef
    );
    spawnedGhosts.push(inky);
  }

  return spawnedGhosts;
}

/**
 * Cập nhật tất cả các con ma
 *
 * Flow cho mỗi ghost:
 * 1. ghost.update() - Tính target tile dựa trên tính cách
 * 2. ghost.updateDirection() - Tính hướng di chuyển (Target Tile Algorithm)
 * 3. ghost.move() - Di chuyển đến vị trí tiếp theo
 */
function updateGhosts() {
  // Kiểm tra ghosts có tồn tại không
  if (!ghosts || ghosts.length === 0) return;

  // Cập nhật từng ghost
  for (let ghost of ghosts) {
    // Bước 1: Cập nhật trạng thái và tính target tile
    // get_target() sẽ được gọi trong update() để tính target_tile
    ghost.update();

    // Bước 2: Sử dụng thuật toán Target Tile để tính hướng di chuyển
    // calculate_next_move() sẽ chọn neighbor gần nhất đến target
    ghost.updateDirection(ghost.target_tile);

    // Bước 3: Di chuyển ghost đến vị trí tiếp theo
    // Xử lý tunnel và collision với tường
    ghost.move();
  }
}

/**
 * Vẽ tất cả các con ma lên canvas
 *
 * Logic:
 * - Nếu ghost ở chế độ Frightened: Vẽ hình scared (màu xanh)
 * - Nếu không: Vẽ hình theo màu của ghost (red, pink, orange, blue)
 */
function drawGhosts() {
  // Kiểm tra ghosts có tồn tại không
  if (!ghosts || ghosts.length === 0) return;

  // Vẽ từng ghost
  for (let ghost of ghosts) {
    // Chọn hình ảnh dựa trên trạng thái
    let img;
    if (ghost.isFrightened()) {
      // Frightened mode: Vẽ hình scared (màu xanh)
      img = ghostImages.scared || ghostImages.red;
    } else {
      // Normal mode: Vẽ hình theo màu của ghost
      img = ghostImages[ghost.color] || ghostImages.red;
    }

    // Vẽ ghost lên canvas
    ctx.drawImage(
      img,
      ghost.x * TILE_SIZE,
      ghost.y * TILE_SIZE,
      TILE_SIZE,
      TILE_SIZE
    );
  }
}

