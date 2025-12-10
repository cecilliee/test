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
