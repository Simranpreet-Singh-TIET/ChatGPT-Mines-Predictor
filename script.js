const grid = document.getElementById("grid");
const predictBtn = document.getElementById("predictBtn");
var timerDisplay = document.getElementById("timer");
const statusMessage = document.getElementById("statusMessage");

const totalCells = 25;

let countdownInterval = null;
let countdownTime = 60;

function createGrid() {
  grid.innerHTML = "";
  for (let i = 0; i < totalCells; i++) {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    cell.dataset.index = i;
    grid.appendChild(cell);
  }
}

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function predictSafeCells() {
  statusMessage.textContent = "";
  predictBtn.disabled = true;
  predictBtn.style.opacity = 0.4;
  predictBtn.style.cursor = "pointer";
  const safeCellSelector = document.getElementById("safeCellSelector");
  const safeCellCount = parseInt(safeCellSelector.value);

  createGrid();

  function getDistributedSafeIndices(rows, cols, safeCount) {
    const totalCells = rows * cols;
    if (safeCount > totalCells) throw new Error("safeCount exceeds grid size");

    // Helper to get diagonals
    function getDiagonalsIdx(row, col) {
      return [
        row - col, // main diagonal (top-left to bottom-right)
        row + col, // anti-diagonal (top-right to bottom-left)
      ];
    }

    // Helper: Manhattan distance
    function distance([r1, c1], [r2, c2]) {
      return Math.abs(r1 - r2) + Math.abs(c1 - c2);
    }

    let attempt = 0;
    while (attempt < 1000) {
      attempt++;
      // Shuffle all cells for randomness
      const allIndices = Array.from({ length: totalCells }, (_, i) => i);
      for (let i = allIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allIndices[i], allIndices[j]] = [allIndices[j], allIndices[i]];
      }

      const selected = new Set();
      const rowCounts = Array(rows).fill(0);
      const colCounts = Array(cols).fill(0);
      const diagCounts = {};
      const antiDiagCounts = {};

      // Greedily select cells, biasing toward maximum spacing
      while (selected.size < safeCount) {
        let candidates = [];
        let maxMinDist = -1;
        for (let idx of allIndices) {
          if (selected.has(idx)) continue;
          const row = Math.floor(idx / cols);
          const col = idx % cols;
          const [diag, antiDiag] = getDiagonalsIdx(row, col);

          if (
            rowCounts[row] >= 3 ||
            colCounts[col] >= 3 ||
            (diagCounts[diag] || 0) >= 3 ||
            (antiDiagCounts[antiDiag] || 0) >= 3
          )
            continue;

          // Calculate min distance to existing selected cells
          let minDist = Infinity;
          for (let s of selected) {
            const sr = Math.floor(s / cols),
              sc = s % cols;
            minDist = Math.min(minDist, distance([row, col], [sr, sc]));
          }
          if (selected.size === 0) minDist = Infinity; // First pick is unconstrained

          if (minDist > maxMinDist) {
            candidates = [idx];
            maxMinDist = minDist;
          } else if (minDist === maxMinDist) {
            candidates.push(idx);
          }
        }

        if (candidates.length === 0) break; // No valid candidates, restart

        // Randomly pick among best candidates
        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        selected.add(pick);
        const row = Math.floor(pick / cols);
        const col = pick % cols;
        const [diag, antiDiag] = getDiagonalsIdx(row, col);
        rowCounts[row]++;
        colCounts[col]++;
        diagCounts[diag] = (diagCounts[diag] || 0) + 1;
        antiDiagCounts[antiDiag] = (antiDiagCounts[antiDiag] || 0) + 1;
      }

      if (selected.size === safeCount) {
        return selected;
      }
      // else, try again with a new shuffle
    }

    throw new Error(
      `Could not select ${safeCount} cells with the given constraints after multiple attempts.`
    );
  }

  // Example usage:
  const safeIndices = getDistributedSafeIndices(5, 5, safeCellCount);

  document.querySelectorAll(".cell").forEach((cell, index) => {
    if (safeIndices.has(index)) {
      cell.classList.add("safe");
      const img = document.createElement("img");
      img.src = "images/star.png"; // ✅ path to your image
      img.alt = "Safe Cell";
      img.classList.add("cell-icon"); // for styling
      cell.appendChild(img);
    } else {
      cell.textContent = "";
    }
  });

  // Start countdown
  countdownTime = 30;
  timerDisplay.innerText = "" + formatTime(countdownTime);

  clearInterval(countdownInterval);
  countdownInterval = setInterval(() => {
    countdownTime--;
    timerDisplay.innerText = "" + formatTime(countdownTime);

    if (countdownTime <= 0) {
      clearInterval(countdownInterval);
      statusMessage.textContent =
        "⏰ Prediction Expired.You can Start again...";
      timerDisplay.innerText = "00:30";
      document.querySelectorAll(".cell").forEach((cell) => {
        cell.classList.remove("safe");
        cell.innerHTML = "";
      });
      setTimeout(() => {
        predictBtn.disabled = false;
        predictBtn.style.opacity = 1;
        predictBtn.style.cursor = "pointer";
      }, 400);
    }
  }, 1000);
}

predictBtn.addEventListener("click", predictSafeCells);
window.onload = createGrid;

function startCountdown() {
  const progress = document.getElementById("progress");

  progress.classList.remove("animate");
  void progress.offsetWidth;
  progress.classList.add("animate");

  // Continue with your prediction logic
  predictSafeCells();
}
