/**
 * Classic 1-25 Pen-and-Paper BINGO Game Logic
 * 5x5 Grid with numbers 1 to 25.
 * 12 Possible Lines: 5 Rows, 5 Columns, 2 Diagonals.
 * Each completed line strikes off a letter in B - I - N - G - O.
 * First to cross all 5 letters (5 lines) wins!
 */
class BingoLogic {
  constructor() {
    this.TOTAL_CELLS = 25;
    this.LETTERS = ['B', 'I', 'N', 'G', 'O'];

    // All 12 possible lines on a 5x5 board (cell indices 0..24)
    this.LINES = [
      // 5 Rows
      { id: 'row-0', type: 'row', index: 0, cells: [0, 1, 2, 3, 4] },
      { id: 'row-1', type: 'row', index: 1, cells: [5, 6, 7, 8, 9] },
      { id: 'row-2', type: 'row', index: 2, cells: [10, 11, 12, 13, 14] },
      { id: 'row-3', type: 'row', index: 3, cells: [15, 16, 17, 18, 19] },
      { id: 'row-4', type: 'row', index: 4, cells: [20, 21, 22, 23, 24] },

      // 5 Columns
      { id: 'col-0', type: 'col', index: 0, cells: [0, 5, 10, 15, 20] },
      { id: 'col-1', type: 'col', index: 1, cells: [1, 6, 11, 16, 21] },
      { id: 'col-2', type: 'col', index: 2, cells: [2, 7, 12, 17, 22] },
      { id: 'col-3', type: 'col', index: 3, cells: [3, 8, 13, 18, 23] },
      { id: 'col-4', type: 'col', index: 4, cells: [4, 9, 14, 19, 24] },

      // 2 Diagonals
      { id: 'diag-0', type: 'diag', index: 0, cells: [0, 6, 12, 18, 24] },
      { id: 'diag-1', type: 'diag', index: 1, cells: [4, 8, 12, 16, 20] }
    ];
  }

  // Generate random 1 to 25 shuffled numbers for 5x5 grid
  generateRandomBoard() {
    const numbers = Array.from({ length: 25 }, (_, i) => i + 1);
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }
    return numbers;
  }

  // Validate if board has exactly numbers 1 to 25
  isValidBoard(boardArray) {
    if (!Array.isArray(boardArray) || boardArray.length !== 25) return false;
    const set = new Set(boardArray);
    if (set.size !== 25) return false;
    for (let n = 1; n <= 25; n++) {
      if (!set.has(n)) return false;
    }
    return true;
  }

  // Calculate completed lines based on called numbers
  // board: array of 25 numbers
  // calledNumbers: Set of numbers called so far
  evaluateBoard(board, calledNumbers) {
    const calledSet = (calledNumbers instanceof Set) ? calledNumbers : new Set(calledNumbers);

    // Map each board index to whether it's crossed
    const crossedIndices = new Set();
    board.forEach((num, idx) => {
      if (calledSet.has(num)) {
        crossedIndices.add(idx);
      }
    });

    const completedLines = [];
    const completedLineIds = new Set();
    const winningCells = new Set();

    for (const line of this.LINES) {
      const isComplete = line.cells.every(idx => crossedIndices.has(idx));
      if (isComplete) {
        completedLines.push(line);
        completedLineIds.add(line.id);
        line.cells.forEach(idx => winningCells.add(idx));
      }
    }

    const lineCount = completedLines.length;
    const earnedLettersCount = Math.min(5, lineCount);
    const lettersEarned = this.LETTERS.slice(0, earnedLettersCount);
    const isBingo = lineCount >= 5;

    return {
      lineCount,
      completedLines,
      completedLineIds,
      winningCells,
      lettersEarned,
      isBingo,
      nextLetter: earnedLettersCount < 5 ? this.LETTERS[earnedLettersCount] : null
    };
  }

  // Smart Computer AI move selection
  // Evaluates which uncrossed number on AI's board completes a line or has highest weight
  getBestComputerMove(aiBoard, calledNumbers) {
    const calledSet = (calledNumbers instanceof Set) ? calledNumbers : new Set(calledNumbers);
    const uncalledNumbers = aiBoard.filter(num => !calledSet.has(num));

    if (uncalledNumbers.length === 0) return null;

    let bestNumber = uncalledNumbers[0];
    let bestScore = -1;

    for (const candidate of uncalledNumbers) {
      // Simulate calling candidate
      const simulatedCalled = new Set(calledSet);
      simulatedCalled.add(candidate);

      const evalBefore = this.evaluateBoard(aiBoard, calledSet);
      const evalAfter = this.evaluateBoard(aiBoard, simulatedCalled);

      // Score:
      // Completing a line gives 100 points
      // Getting 4 in a line gives 20 points
      // Getting 3 in a line gives 5 points
      let score = (evalAfter.lineCount - evalBefore.lineCount) * 100;

      for (const line of this.LINES) {
        let count = 0;
        let containsCandidate = false;
        for (const idx of line.cells) {
          const num = aiBoard[idx];
          if (simulatedCalled.has(num)) count++;
          if (num === candidate) containsCandidate = true;
        }
        if (containsCandidate) {
          if (count === 4) score += 25;
          else if (count === 3) score += 10;
          else if (count === 2) score += 3;
        }
      }

      // Add a slight random factor to make bot feel natural
      score += Math.random() * 2;

      if (score > bestScore) {
        bestScore = score;
        bestNumber = candidate;
      }
    }

    return bestNumber;
  }
}

window.BingoLogic = new BingoLogic();
