// --- CẤU HÌNH & BIẾN TOÀN CỤC ---
const TILE_SIZE = 20;

// Các biến DOM & Canvas
let canvas, ctx, scoreEl;

// Trạng thái game
let currentMap = [];
let currentWallColor = "#09f";
let score = 0;
let gameOver = false;
let gameInterval = null;
let gameStarted = false; // Trạng thái game đã bắt đầu chưa
let lives = 3; // Số mạng của PacMan

// === GHOST STATE TIMER - BỘ ĐẾM THỜI GIAN CHO TRẠNG THÁI GHOST ===
// Timer sẽ được khởi tạo trong GhostTimer.js sau khi GHOST_STATE được định nghĩa
let ghostStateTimer = null;

// === FRIGHTENED MODE - CHẾ ĐỘ SỢ HÃI ===
let frightenedTimer = 0; // Thời gian còn lại của Frightened mode (giây)
const FRIGHTENED_DURATION = 10; // Thời gian Frightened mode (giây)

// === POWER PELLET - KẸO NĂNG LƯỢNG ===
// Giá trị trong map: 4 = power pellet (kẹo lớn)
const POWER_PELLET_VALUE = 4;

// --- LOAD HÌNH ẢNH ---
const pacImages = {
  right: new Image(),
  left: new Image(),
  up: new Image(),
  down: new Image(),
};
pacImages.right.src = "../assets/pacmanRight.png";
pacImages.left.src = "../assets/pacmanLeft.png";
pacImages.up.src = "../assets/pacmanUp.png";
pacImages.down.src = "../assets/pacmanDown.png";

const ghostImages = {
  red: new Image(),
  pink: new Image(),
  orange: new Image(),
  blue: new Image(),
  scared: new Image(),
};
ghostImages.red.src = "../assets/redGhost.png";
ghostImages.pink.src = "../assets/pinkGhost.png";
ghostImages.orange.src = "../assets/orangeGhost.png";
ghostImages.blue.src = "../assets/blueGhost.png";
ghostImages.scared.src = "../assets/scaredGhost.png";

// Hình ảnh mạng
const heartImage = new Image();
heartImage.src = "../assets/player-heart.png";

// Hình ảnh cherry cho power pellet
const cherryImage = new Image();
cherryImage.src = "../assets/cherry.png";
