// ============================================================================
// GHOST TIMER - BỘ ĐẾM THỜI GIAN CHO TRẠNG THÁI GHOST
// ============================================================================
// File này quản lý timer để luân phiên đổi trạng thái Scatter/Chase
// ============================================================================

/**
 * Khởi tạo Ghost State Timer
 * Timer luân phiên: 7s Scatter -> 20s Chase -> 7s Scatter -> ...
 */
function initGhostStateTimer() {
  ghostStateTimer = {
    elapsed: 0, // Thời gian đã trôi qua (giây)
    currentState: GHOST_STATE.SCATTER, // Trạng thái hiện tại (bắt đầu với Scatter)
    scatterDuration: 7, // Thời gian Scatter (giây)
    chaseDuration: 20, // Thời gian Chase (giây)
    frameCount: 0, // Counter để đếm frame (gameLoop chạy mỗi 200ms = 0.2s)
  };
}

/**
 * Cập nhật Ghost State Timer
 * Game loop chạy mỗi 200ms, nên mỗi 5 frame = 1 giây
 */
function updateGhostStateTimer() {
  if (!ghostStateTimer) return;

  // Tăng frame counter
  ghostStateTimer.frameCount++;

  // Mỗi 5 frame = 1 giây (200ms * 5 = 1000ms)
  if (ghostStateTimer.frameCount >= 5) {
    ghostStateTimer.frameCount = 0;
    ghostStateTimer.elapsed += 1; // Tăng 1 giây

    // Kiểm tra cần đổi trạng thái không
    let shouldSwitch = false;
    let nextState = null;

    if (ghostStateTimer.currentState === GHOST_STATE.SCATTER) {
      // Đang ở Scatter, kiểm tra đã hết thời gian chưa
      if (ghostStateTimer.elapsed >= ghostStateTimer.scatterDuration) {
        shouldSwitch = true;
        nextState = GHOST_STATE.CHASE;
        ghostStateTimer.elapsed = 0; // Reset timer
      }
    } else if (ghostStateTimer.currentState === GHOST_STATE.CHASE) {
      // Đang ở Chase, kiểm tra đã hết thời gian chưa
      if (ghostStateTimer.elapsed >= ghostStateTimer.chaseDuration) {
        shouldSwitch = true;
        nextState = GHOST_STATE.SCATTER;
        ghostStateTimer.elapsed = 0; // Reset timer
      }
    }

    // Đổi trạng thái nếu cần
    if (shouldSwitch && nextState) {
      ghostStateTimer.currentState = nextState;
      updateAllGhostsState(nextState);
    }
  }
}

/**
 * Cập nhật trạng thái của tất cả ghosts
 * @param {string} newState - Trạng thái mới (GHOST_STATE.CHASE hoặc GHOST_STATE.SCATTER)
 */
function updateAllGhostsState(newState) {
  if (!ghosts || ghosts.length === 0) return;

  for (let ghost of ghosts) {
    // Chỉ đổi trạng thái nếu không đang ở Frightened
    // Frightened mode có độ ưu tiên cao hơn
    if (!ghost.isFrightened()) {
      ghost.current_state = newState;
    }
  }
}

/**
 * Kích hoạt Frightened mode cho tất cả ghosts
 * Khi PacMan ăn power pellet
 */
function activateFrightenedMode() {
  if (!ghosts || ghosts.length === 0) return;

  // Reset frightened timer
  frightenedTimer = FRIGHTENED_DURATION;

  // Chuyển tất cả ghosts sang Frightened mode
  for (let ghost of ghosts) {
    ghost.current_state = GHOST_STATE.FRIGHTENED;
  }
}

// Frame counter cho Frightened Timer (static variable)
let frightenedFrameCount = 0;

/**
 * Cập nhật Frightened Timer
 * Game loop chạy mỗi 200ms, nên mỗi 5 frame = 1 giây
 */
function updateFrightenedTimer() {
  if (frightenedTimer > 0) {
    // Tăng frame counter
    frightenedFrameCount++;

    // Mỗi 5 frame = 1 giây (200ms * 5 = 1000ms)
    if (frightenedFrameCount >= 5) {
      frightenedFrameCount = 0;
      frightenedTimer -= 1;

      // Nếu hết thời gian Frightened, quay về trạng thái từ timer
      if (frightenedTimer <= 0) {
        frightenedTimer = 0;
        if (ghostStateTimer) {
          updateAllGhostsState(ghostStateTimer.currentState);
        }
      }
    }
  } else {
    // Reset frame counter khi không còn Frightened
    frightenedFrameCount = 0;
  }
}

