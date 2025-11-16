const GAME_MODES = {
    easy: { width: 10, height: 8, mines: 10, name: "Easy" },
    medium: { width: 18, height: 14, mines: 40, name: "Medium" },
    hard: { width: 24, height: 20, mines: 99, name: "Hard" },
};

let width = GAME_MODES.easy.width;
let height = GAME_MODES.easy.height;
let mines = GAME_MODES.easy.mines;
let flagsLeft = mines;
let cellSize = 30;
let timeLeft = 0;
let timerInterval = null;
let boardData = [];
let revealed = [];
let flagged = [];
let isFirstClick = true;
let isGameOver = false;

function setGameMode(modeKey) {
    const mode = GAME_MODES[modeKey];
    if (!mode) return;

    width = mode.width;
    height = mode.height;
    mines = mode.mines;

    if (modeKey === "hard") {
        cellSize = 20;
    } else {
        cellSize = 30;
    }

    resetGame();
}

function generateSafeBoard(startX, startY) {
    boardData = [];
    for (let i = 0; i < height; i++) {
        boardData.push(new Array(width).fill("."));
    }

    let placed = 0;
    while (placed < mines) {
        let x = Math.floor(Math.random() * width);
        let y = Math.floor(Math.random() * height);

        if (
            boardData[y][x] !== "X" &&
            !(Math.abs(x - startX) <= 1 && Math.abs(y - startY) <= 1)
        ) {
            boardData[y][x] = "X";
            placed++;
        }
    }

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (boardData[y][x] === "X") continue;

            let count = 0;
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    let nx = x + dx;
                    let ny = y + dy;
                    if (
                        nx >= 0 &&
                        nx < width &&
                        ny >= 0 &&
                        ny < height &&
                        boardData[ny][nx] === "X"
                    ) {
                        count++;
                    }
                }
            }
            boardData[y][x] = count === 0 ? "." : count.toString();
        }
    }

    revealed = boardData.map((r) => r.map(() => false));
    flagged = boardData.map((r) => r.map(() => false));
    isGameOver = false;
    flagsLeft = mines;
    updateMinesLeftDisplay();
    startTimer();
    displayStatus("", "");
}

function toggleResetButton(show) {
    const resetButton = document.getElementById("reset-button");
    if (resetButton) {
        if (show) resetButton.classList.add("show-button");
        else resetButton.classList.remove("show-button");
    }
}

function resetGame() {
    isFirstClick = true;
    isGameOver = false;
    stopTimer();
    timeLeft = 0;
    displayStatus("", "");
    flagsLeft = mines;
    updateMinesLeftDisplay();
    renderEmptyBoard();
    enableCellEvents();
    toggleResetButton(false);
    console.log("Game direset, menunggu klik pertama...");
}

function renderEmptyBoard() {
    const board = document.getElementById("board");
    board.style.gridTemplateColumns = `repeat(${width}, ${cellSize}px)`;
    board.innerHTML = "";

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const cell = document.createElement("div");
            cell.classList.add("cell");
            if (cellSize === 20) cell.classList.add("cell-small");
            else cell.classList.add("cell-medium");

            cell.dataset.x = x;
            cell.dataset.y = y;
            board.appendChild(cell);
        }
    }
}

function displayStatus(message, className) {
    const statusEl = document.getElementById("game-status");
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.className = className;
    }
}

function openCell(x, y) {
    if (x == null || y == null || isGameOver) return;

    if (isFirstClick) {
        generateSafeBoard(x, y);
        isFirstClick = false;
    }

    if (flagged[y][x]) return;

    const queue = [[x, y]];

    while (queue.length > 0) {
        const [cx, cy] = queue.shift();
        if (cx < 0 || cx >= width || cy < 0 || cy >= height) continue;
        if (revealed[cy][cx]) continue;

        revealed[cy][cx] = true;
        const cell = document.querySelector(
            `.cell[data-x="${cx}"][data-y="${cy}"]`
        );
        const val = boardData[cy][cx];

        cell.classList.add("open");

        if (val === "X") {
            cell.textContent = "💣";
            console.log("BOOM! GAME OVER");
            handleLose();
            return;
        }

        if (val !== ".") {
            cell.textContent = val;
            switch (val) {
                case "1":
                    cell.style.color = "blue";
                    break;
                case "2":
                    cell.style.color = "green";
                    break;
                case "3":
                    cell.style.color = "red";
                    break;
                case "4":
                    cell.style.color = "darkblue";
                    break;
                case "5":
                    cell.style.color = "brown";
                    break;
                case "6":
                    cell.style.color = "cyan";
                    break;
                case "7":
                    cell.style.color = "black";
                    break;
                case "8":
                    cell.style.color = "gray";
                    break;
            }
            continue;
        }

        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx !== 0 || dy !== 0) queue.push([cx + dx, cy + dy]);
            }
        }
    }

    checkWin();
}

function toggleFlag(x, y) {
    if (isFirstClick || isGameOver || revealed[y][x]) return;

    if (!flagged[y][x]) {
        if (flagsLeft <= 0) return;
        flagged[y][x] = true;
        flagsLeft--;
    } else {
        flagged[y][x] = false;
        flagsLeft++;
    }

    updateMinesLeftDisplay();
    const cell = document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);

    if (flagged[y][x]) {
        cell.textContent = "🚩";
        cell.classList.add("flag");
    } else {
        cell.textContent = "";
        cell.classList.remove("flag");
    }
}

function handleLose() {
    isGameOver = true;
    stopTimer();
    displayStatus("BOOM! GAME OVER 💥", "status-lose");
    toggleResetButton(true);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (boardData[y][x] === "X") {
                const cell = document.querySelector(
                    `.cell[data-x="${x}"][data-y="${y}"]`
                );
                cell.textContent = "💣";
                cell.classList.add("open", "bomb");
            }
        }
    }
}

function handleWin() {
    isGameOver = true;
    stopTimer();
    displayStatus("🎉 YOU WIN! 🎉", "status-win");
    toggleResetButton(true);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (boardData[y][x] === "X") {
                const cell = document.querySelector(
                    `.cell[data-x="${x}"][data-y="${y}"]`
                );
                cell.textContent = "🌸";
                cell.classList.add("open", "win-bomb");
                if (flagged[y][x]) cell.classList.remove("flag");
            }
        }
    }
    flagsLeft = 0;
    updateMinesLeftDisplay();
}

function revealAllBombs() {
    isGameOver = true;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (boardData[y][x] === "X") {
                const cell = document.querySelector(
                    `.cell[data-x="${x}"][data-y="${y}"]`
                );
                cell.textContent = "💣";
                cell.classList.add("open", "bomb");
            }
        }
    }
}

function checkWin() {
    let safeCells = width * height - mines;
    let revealedCount = 0;
    revealed.forEach((row) =>
        row.forEach((v) => {
            if (v) revealedCount++;
        })
    );
    if (revealedCount === safeCells) handleWin();
}

function enableCellEvents() {
    document.querySelectorAll(".cell").forEach((cell) => {
        cell.addEventListener("click", () => {
            const x = Number(cell.dataset.x);
            const y = Number(cell.dataset.y);
            openCell(x, y);
        });

        cell.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            const x = Number(cell.dataset.x);
            const y = Number(cell.dataset.y);
            toggleFlag(x, y);
        });

        cell.addEventListener("dblclick", (e) => {
            const x = Number(cell.dataset.x);
            const y = Number(cell.dataset.y);
            chord(x, y);
        });
    });
}

function countAdjacentFlags(x, y) {
    let flagCount = 0;
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            let nx = x + dx;
            let ny = y + dy;
            if (
                nx >= 0 &&
                nx < width &&
                ny >= 0 &&
                ny < height &&
                flagged[ny][nx]
            )
                flagCount++;
        }
    }
    return flagCount;
}

function chord(x, y) {
    if (isGameOver || !revealed[y][x]) return;
    const cellValue = boardData[y][x];
    if (cellValue === "X" || cellValue === ".") return;

    const adjacentMines = parseInt(cellValue, 10);
    const adjacentFlags = countAdjacentFlags(x, y);

    if (adjacentFlags === adjacentMines) {
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                let nx = x + dx;
                let ny = y + dy;
                if (
                    nx >= 0 &&
                    nx < width &&
                    ny >= 0 &&
                    ny < height &&
                    !revealed[ny][nx] &&
                    !flagged[ny][nx]
                ) {
                    openCell(nx, ny);
                }
            }
        }
    }
}

function updateMinesLeftDisplay() {
    const minesLeftEl = document.getElementById("mines-left");
    if (minesLeftEl) minesLeftEl.textContent = flagsLeft;
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timeLeft = 0;
    const timerEl = document.getElementById("timer");
    if (timerEl) timerEl.textContent = timeLeft;

    timerInterval = setInterval(() => {
        timeLeft++;
        if (timerEl) timerEl.textContent = timeLeft;
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

renderEmptyBoard();
enableCellEvents();
