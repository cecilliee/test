// --- GRID SYSTEM UTILITIES ---
// Hệ thống lưới và các hàm tiện ích cho tính toán trên grid

/**
 * Tính khoảng cách Euclidean giữa hai ô
 * @param {Object} tile_a - Ô đầu tiên {x: number, y: number}
 * @param {Object} tile_b - Ô thứ hai {x: number, y: number}
 * @returns {number} Khoảng cách Euclidean
 */
function get_euclidean_distance(tile_a, tile_b) {
  const dx = tile_b.x - tile_a.x;
  const dy = tile_b.y - tile_a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Lấy danh sách các ô lân cận hợp lệ (không phải tường)
 * @param {Object} current_tile - Ô hiện tại {x: number, y: number}
 * @param {Object} previous_tile - Ô trước đó {x: number, y: number} (null nếu không có)
 * @param {boolean} is_frightened - Có đang ở chế độ Frightened không (cho phép quay đầu)
 * @returns {Array} Mảng các ô lân cận hợp lệ [{x: number, y: number, dx: number, dy: number}, ...]
 */
function get_valid_neighbors(current_tile, previous_tile = null, is_frightened = false) {
  if (!currentMap || currentMap.length === 0) return [];

  const rows = currentMap.length;
  const cols = currentMap[0].length;
  const validNeighbors = [];

  // 4 hướng: right, down, left, up
  const directions = [
    { dx: 1, dy: 0 },  // right
    { dx: 0, dy: 1 },  // down
    { dx: -1, dy: 0 }, // left
    { dx: 0, dy: -1 }, // up
  ];

  for (let dir of directions) {
    let nextX = current_tile.x + dir.dx;
    let nextY = current_tile.y + dir.dy;

    // Xử lý tunnel (wrap around) cho trục X
    if (nextX < 0) nextX = cols - 1;
    else if (nextX >= cols) nextX = 0;

    // Kiểm tra biên trục Y
    if (nextY < 0 || nextY >= rows) continue;

    // Kiểm tra không phải tường
    if (currentMap[nextY][nextX] === 1) continue;

    // Logic chặn quay đầu (trừ khi ở mode Frightened)
    if (!is_frightened && previous_tile) {
      // Nếu ô tiếp theo là ô vừa bước ra, bỏ qua
      if (nextX === previous_tile.x && nextY === previous_tile.y) {
        continue;
      }
    }

    // Thêm vào danh sách hợp lệ
    validNeighbors.push({
      x: nextX,
      y: nextY,
      dx: dir.dx,
      dy: dir.dy,
    });
  }

  return validNeighbors;
}

/**
 * Kiểm tra một ô có hợp lệ không (trong phạm vi map và không phải tường)
 * @param {Object} tile - Ô cần kiểm tra {x: number, y: number}
 * @returns {boolean} true nếu hợp lệ, false nếu không
 */
function is_valid_tile(tile) {
  if (!currentMap || currentMap.length === 0) return false;
  
  const rows = currentMap.length;
  const cols = currentMap[0].length;

  // Kiểm tra biên
  if (tile.y < 0 || tile.y >= rows) return false;
  
  // Xử lý tunnel cho trục X (wrap around)
  let x = tile.x;
  if (x < 0) x = cols - 1;
  else if (x >= cols) x = 0;

  // Kiểm tra không phải tường
  return currentMap[tile.y][x] !== 1;
}

/**
 * Lấy giá trị của một ô trong map
 * @param {Object} tile - Ô cần lấy giá trị {x: number, y: number}
 * @returns {number|null} Giá trị của ô (0, 1, 2, 3) hoặc null nếu không hợp lệ
 */
function get_tile_value(tile) {
  if (!is_valid_tile(tile)) return null;
  
  const cols = currentMap[0].length;
  let x = tile.x;
  
  // Xử lý tunnel cho trục X
  if (x < 0) x = cols - 1;
  else if (x >= cols) x = 0;
  
  return currentMap[tile.y][x];
}

