// ============================================================================
// GHOST AI - LOGIC DI CHUYỂN VÀ TÌM ĐƯỜNG
// ============================================================================
// File này chứa:
// - Class Ghost (Parent Class)
// - Thuật toán Target Tile
// - Logic di chuyển và tìm đường
// ============================================================================

// --- GHOST STATES - CÁC TRẠNG THÁI CỦA GHOST ---
/**
 * Enum các trạng thái của Ghost
 * - CHASE: Đuổi theo mục tiêu (PacMan hoặc target tile)
 * - SCATTER: Về góc nhà (scatter corner)
 * - FRIGHTENED: Sợ hãi, chạy trốn (khi PacMan ăn power pellet)
 */
const GHOST_STATE = {
  CHASE: "chase",
  SCATTER: "scatter",
  FRIGHTENED: "frightened",
};

// ============================================================================
// CLASS GHOST - CLASS CHA CHO TẤT CẢ CÁC CON MA
// ============================================================================
/**
 * Class Ghost - Class cha cho tất cả các con ma
 * Triển khai bộ não chung (Core AI Logic) cho các con ma
 *
 * Thuật toán Target Tile:
 * 1. Tính target tile dựa trên tính cách (get_target)
 * 2. Lấy danh sách neighbors hợp lệ
 * 3. Chọn neighbor có khoảng cách nhỏ nhất đến target
 * 4. Di chuyển theo hướng đó
 */
class Ghost {
  /**
   * Constructor - Khởi tạo Ghost
   * @param {number} x - Tọa độ X ban đầu
   * @param {number} y - Tọa độ Y ban đầu
   * @param {string} color - Màu của ghost ("red", "pink", "orange", "blue")
   */
  constructor(x, y, color) {
    // === VỊ TRÍ VÀ HƯỚNG ===
    this.x = x; // Tọa độ X hiện tại
    this.y = y; // Tọa độ Y hiện tại
    this.dx = 0; // Hướng di chuyển X (-1: trái, 0: đứng, 1: phải)
    this.dy = 0; // Hướng di chuyển Y (-1: lên, 0: đứng, 1: xuống)

    // === VỊ TRÍ TRƯỚC ĐÓ (ĐỂ CHẶN QUAY ĐẦU) ===
    this.previousX = x; // Vị trí X trước đó
    this.previousY = y; // Vị trí Y trước đó

    // === THUỘC TÍNH ===
    this.baseSpeed = 1; // Tốc độ cơ bản (số ô mỗi frame)
    this.speed = 1; // Tốc độ di chuyển hiện tại
    this.moveCounter = 0; // Counter để xử lý tốc độ chậm
    this.current_state = GHOST_STATE.CHASE; // Trạng thái hiện tại
    this.target_tile = { x: x, y: y }; // Điểm đến hiện tại (target tile)
    this.color = color; // Màu của ghost
    this.scatter_corner = null; // Góc nhà (scatter corner) - sẽ được set bởi subclass
  }

  // ========================================================================
  // GETTERS - CÁC PHƯƠNG THỨC LẤY THÔNG TIN
  // ========================================================================

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
   * @returns {boolean} true nếu đang ở chế độ Frightened
   */
  isFrightened() {
    return this.current_state === GHOST_STATE.FRIGHTENED;
  }

  // ========================================================================
  // CORE AI LOGIC - THUẬT TOÁN TÌM ĐƯỜNG
  // ========================================================================

  /**
   * Tính toán và trả về hướng di chuyển tiếp theo dựa trên target tile
   *
   * Thuật toán:
   * - Frightened mode: Chọn hướng ngẫu nhiên
   * - Normal mode: Target Tile (Greedy) - Chọn neighbor gần nhất đến target
   *
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

    // Lấy danh sách các ô lân cận hợp lệ
    // - Không phải tường (cell !== 1)
    // - Không quay đầu (trừ khi ở mode Frightened)
    // - Xử lý tunnel (wrap around cho trục X)
    const validNeighbors = get_valid_neighbors(
      current_tile,
      previous_tile,
      this.isFrightened()
    );

    // Nếu không có ô lân cận hợp lệ, trả về null
    if (validNeighbors.length === 0) {
      return null;
    }

    // === FRIGHTENED MODE: CHỌN HƯỚNG NGẪU NHIÊN ===
    if (this.isFrightened()) {
      // Chọn ngẫu nhiên một neighbor
      const randomIndex = Math.floor(Math.random() * validNeighbors.length);
      const randomNeighbor = validNeighbors[randomIndex];
      return {
        dx: randomNeighbor.dx,
        dy: randomNeighbor.dy,
      };
    }

    // === NORMAL MODE: TARGET TILE ALGORITHM ===
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
   * Cập nhật tốc độ dựa trên trạng thái
   */
  updateSpeed() {
    if (this.isFrightened()) {
      // Frightened mode: Giảm tốc độ xuống 50% (di chuyển mỗi 2 frame)
      this.speed = 0.5;
    } else {
      // Normal mode: Tốc độ bình thường (di chuyển mỗi frame)
      this.speed = 1;
    }
  }

  /**
   * Di chuyển ghost đến vị trí tiếp theo
   * Xử lý tunnel (wrap around) và kiểm tra collision với tường
   * Hỗ trợ tốc độ di chuyển (speed < 1 sẽ di chuyển chậm hơn)
   */
  move() {
    // Cập nhật tốc độ dựa trên trạng thái
    this.updateSpeed();

    // Xử lý tốc độ chậm: Nếu speed < 1, chỉ di chuyển mỗi N frame
    if (this.speed < 1) {
      this.moveCounter += this.speed;
      if (this.moveCounter < 1) {
        return; // Chưa đến lúc di chuyển
      }
      this.moveCounter = 0; // Reset counter
    }

    // Lưu vị trí hiện tại trước khi di chuyển (để chặn quay đầu)
    this.previousX = this.x;
    this.previousY = this.y;

    // Tính vị trí tiếp theo
    let nextX = this.x + this.dx;
    let nextY = this.y + this.dy;

    // Xử lý tunnel (wrap around) cho trục X
    const cols = currentMap[0].length;
    if (nextX < 0) {
      nextX = cols - 1; // Đi quá bên trái -> Về bên phải
    } else if (nextX >= cols) {
      nextX = 0; // Đi quá bên phải -> Về bên trái
    }

    // Kiểm tra có thể di chuyển không (không phải tường và trong biên)
    if (
      nextY >= 0 &&
      nextY < currentMap.length &&
      currentMap[nextY][nextX] !== 1 // Không phải tường
    ) {
      this.x = nextX;
      this.y = nextY;
    }
  }

  // ========================================================================
  // TARGET CALCULATION - TÍNH TOÁN MỤC TIÊU
  // ========================================================================

  /**
   * Lấy target tile dựa trên trạng thái và tính cách
   * Phương thức này sẽ được override bởi các class con
   *
   * @returns {Object} {x: number, y: number} - Vị trí mục tiêu
   */
  get_target() {
    // Logic mặc định: Chase mode - đuổi theo PacMan
    return { x: pacMan.x, y: pacMan.y };
  }

  /**
   * Cập nhật trạng thái của ghost và tính target tile
   * Phương thức này gọi get_target() để tính target_tile
   *
   * Flow:
   * 1. Xác định trạng thái (CHASE/SCATTER/FRIGHTENED)
   * 2. Nếu Scatter: ép buộc target = scatter_corner (gọi updateScatterCorner nếu có)
   * 3. Nếu không: Gọi get_target() để tính target tile
   * 4. Cập nhật target_tile
   */
  update() {
    // === SCATTER MODE: ÉP BUỘC VỀ GÓC NHÀ ===
    if (this.current_state === GHOST_STATE.SCATTER) {
      // Cập nhật scatter corner nếu ghost có phương thức updateScatterCorner
      if (typeof this.updateScatterCorner === "function") {
        this.updateScatterCorner();
      }
      if (this.scatter_corner) {
        this.target_tile = this.scatter_corner;
      } else {
        // Fallback nếu chưa có scatter corner
        this.target_tile = this.get_target();
      }
    }
    // === FRIGHTENED MODE: KHÔNG CẦN TARGET (SẼ CHỌN RANDOM) ===
    else if (this.current_state === GHOST_STATE.FRIGHTENED) {
      // Frightened mode không cần target, sẽ chọn random trong calculate_next_move
      // Nhưng vẫn cần một target để tính toán (có thể dùng vị trí hiện tại)
      this.target_tile = this.position;
    }
    // === CHASE MODE: TÍNH TOÁN TARGET DỰA TRÊN TÍNH CÁCH ===
    else if (this.current_state === GHOST_STATE.CHASE) {
      this.target_tile = this.get_target();
    }
  }
}
