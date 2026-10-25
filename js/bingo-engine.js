/**
 * Bingo Game Engine & Logic
 * Handles 75-Ball Classic & Custom Word Themes, Card Generation,
 * Pattern Evaluation, and Host Win Verification.
 */
class BingoEngine {
  constructor() {
    this.COL_LETTERS = ['B', 'I', 'N', 'G', 'O'];
    this.COL_RANGES = [
      { min: 1, max: 15, letter: 'B' },
      { min: 16, max: 30, letter: 'I' },
      { min: 31, max: 45, letter: 'N' },
      { min: 46, max: 60, letter: 'G' },
      { min: 61, max: 75, letter: 'O' }
    ];

    this.PATTERNS = {
      line: {
        id: 'line',
        name: 'Single Line (Any)',
        description: 'Any 1 row, column, or diagonal line'
      },
      any2: {
        id: 'any2',
        name: 'Two Lines',
        description: 'Any 2 lines (rows, cols, or diagonals)'
      },
      corners: {
        id: 'corners',
        name: 'Four Corners',
        description: 'The 4 outside corner squares'
      },
      cross: {
        id: 'cross',
        name: 'Plus / Cross (+)',
        description: 'Center horizontal row & center vertical column'
      },
      stamp: {
        id: 'stamp',
        name: 'Postage Stamp',
        description: 'Any 2x2 square in one of the 4 corners'
      },
      blackout: {
        id: 'blackout',
        name: 'Blackout / Full Card',
        description: 'All 25 squares covered'
      }
    };

    this.PRESET_THEMES = {
      tech: {
        name: 'Tech & Dev Night',
        words: [
          'Git Conflict', 'Docker Crash', 'Works on Machine', 'Stack Overflow',
          '404 Not Found', 'CI/CD Failed', 'Merge Conflict', 'Sprint Planning',
          'Fix Later (TODO)', 'Dark Mode', 'Syntax Error', 'Rubber Duck',
          'Push to Main', 'Hotfix', 'Legacy Code', 'Unit Test Passes',
          'AI Generated', 'API Timeout', 'Infinite Loop', 'Cached Data',
          'Typo in Prod', 'Console.log', 'Zero Bugs', 'Kubernetes',
          'Coffee Break', 'Pull Request', 'Refactor', 'Null Pointer'
        ]
      },
      office: {
        name: 'Remote Work / Office',
        words: [
          'You\'re on mute', 'Can you see screen?', 'Let\'s take offline', 'Dog barking',
          'Camera on accident', 'Connection lost', 'Quick sync', 'Synergy',
          'Touch base', 'Per my last email', 'Circle back', 'Hard stop',
          'Drop off call', 'Send invite', 'Screen frozen', 'Echoing sound',
          'Friday feeling', 'Coffee refill', 'Slack ping', 'Awkward pause',
          'Typing loudly', 'Unmuted breathing', 'Background blur', 'Double booked'
        ]
      },
      party: {
        name: 'Party & Friends',
        words: [
          'Someone spills drink', 'Selfie time', 'Song request', 'Dance battle',
          'Dad joke', 'Snack refill', 'Group hug', 'Loud laughter',
          'Phone drops', 'Sing-along', 'Someone is late', 'Cheers toast',
          'Photo bombed', 'Pet appearance', 'Trivia master', 'Snack thief',
          'Inside joke', 'Game rematch', 'Awkward silence', 'High five',
          'Spontaneous clap', 'Party playlist', 'Story time', 'Compliment'
        ]
      }
    };
  }

  // Generate complete list of 75 balls for classic bingo
  generateAllClassicBalls() {
    const balls = [];
    this.COL_RANGES.forEach(col => {
      for (let n = col.min; n <= col.max; n++) {
        balls.push({
          id: `${col.letter}-${n}`,
          letter: col.letter,
          number: n,
          label: `${col.letter}-${n}`,
          colorClass: `ball-${col.letter.toLowerCase()}`
        });
      }
    });
    return balls;
  }

  // Shuffle utility
  shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Pick N unique numbers in [min, max]
  pickRandomUnique(min, max, count) {
    const pool = [];
    for (let i = min; i <= max; i++) pool.push(i);
    return this.shuffle(pool).slice(0, count);
  }

  // Generate a player's card
  generateCard(gameType = 'classic', customWords = null) {
    const grid = [];

    if (gameType === 'classic') {
      const colB = this.pickRandomUnique(1, 15, 5);
      const colI = this.pickRandomUnique(16, 30, 5);
      const colN = this.pickRandomUnique(31, 45, 4); // 4 numbers, middle is FREE
      const colG = this.pickRandomUnique(46, 60, 5);
      const colO = this.pickRandomUnique(61, 75, 5);

      let nIdx = 0;
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          const index = r * 5 + c;
          const letter = this.COL_LETTERS[c];
          const isFree = (r === 2 && c === 2);

          let num = 0;
          if (c === 0) num = colB[r];
          else if (c === 1) num = colI[r];
          else if (c === 2) {
            if (isFree) num = null;
            else { num = colN[nIdx]; nIdx++; }
          }
          else if (c === 3) num = colG[r];
          else if (c === 4) num = colO[r];

          grid.push({
            index,
            row: r,
            col: c,
            letter: letter,
            value: isFree ? 'FREE' : num,
            label: isFree ? 'FREE' : `${letter}-${num}`,
            isFree: isFree
          });
        }
      }
    } else {
      // Custom word theme
      let wordPool = (customWords && customWords.length >= 24) ? customWords : this.PRESET_THEMES.tech.words;
      const shuffledWords = this.shuffle(wordPool).slice(0, 24);
      let wordIdx = 0;

      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          const index = r * 5 + c;
          const letter = this.COL_LETTERS[c];
          const isFree = (r === 2 && c === 2);
          const val = isFree ? 'FREE' : shuffledWords[wordIdx++];

          grid.push({
            index,
            row: r,
            col: c,
            letter: letter,
            value: val,
            label: isFree ? 'FREE' : val,
            isFree: isFree
          });
        }
      }
    }

    return grid;
  }

  // Precomputed line combinations (indices 0..24)
  getLineCombos() {
    const combos = [];
    // 5 Rows
    for (let r = 0; r < 5; r++) {
      combos.push([r * 5, r * 5 + 1, r * 5 + 2, r * 5 + 3, r * 5 + 4]);
    }
    // 5 Columns
    for (let c = 0; c < 5; c++) {
      combos.push([c, c + 5, c + 10, c + 15, c + 20]);
    }
    // 2 Diagonals
    combos.push([0, 6, 12, 18, 24]);
    combos.push([4, 8, 12, 16, 20]);
    return combos;
  }

  // Evaluate card marks against chosen pattern
  // marks: Set of marked indices (or array)
  evaluateCard(marks, patternKey = 'line') {
    const markedSet = (marks instanceof Set) ? marks : new Set(marks);
    // FREE space (index 12) is always marked
    markedSet.add(12);

    const lineCombos = this.getLineCombos();

    if (patternKey === 'line') {
      let minAway = 5;
      let won = false;
      let winningIndices = [];

      for (const line of lineCombos) {
        const missing = line.filter(idx => !markedSet.has(idx)).length;
        if (missing === 0) {
          won = true;
          winningIndices = line;
          minAway = 0;
          break;
        }
        if (missing < minAway) {
          minAway = missing;
        }
      }
      return { won, minAway, winningIndices, patternName: 'Single Line' };
    }

    if (patternKey === 'any2') {
      const completedLines = [];
      const lineDeficits = [];

      for (const line of lineCombos) {
        const missing = line.filter(idx => !markedSet.has(idx)).length;
        if (missing === 0) {
          completedLines.push(line);
        } else {
          lineDeficits.push(missing);
        }
      }

      if (completedLines.length >= 2) {
        const winningIndices = Array.from(new Set([...completedLines[0], ...completedLines[1]]));
        return { won: true, minAway: 0, winningIndices, patternName: 'Two Lines' };
      }

      lineDeficits.sort((a, b) => a - b);
      let minAway = 2;
      if (completedLines.length === 1) {
        minAway = lineDeficits[0] || 1;
      } else {
        minAway = (lineDeficits[0] || 2) + (lineDeficits[1] || 2);
      }
      return { won: false, minAway, winningIndices: [], patternName: 'Two Lines' };
    }

    if (patternKey === 'corners') {
      const corners = [0, 4, 20, 24];
      const missing = corners.filter(idx => !markedSet.has(idx)).length;
      return {
        won: missing === 0,
        minAway: missing,
        winningIndices: missing === 0 ? corners : [],
        patternName: 'Four Corners'
      };
    }

    if (patternKey === 'cross') {
      // Row 2 (10,11,12,13,14) + Col 2 (2,7,12,17,22)
      const crossIndices = [10, 11, 12, 13, 14, 2, 7, 17, 22];
      const missing = crossIndices.filter(idx => !markedSet.has(idx)).length;
      return {
        won: missing === 0,
        minAway: missing,
        winningIndices: missing === 0 ? crossIndices : [],
        patternName: 'Plus / Cross (+)'
      };
    }

    if (patternKey === 'stamp') {
      // 4 possible 2x2 stamps in corners
      const stamps = [
        [0, 1, 5, 6],       // Top-left
        [3, 4, 8, 9],       // Top-right
        [15, 16, 20, 21],   // Bottom-left
        [18, 19, 23, 24]    // Bottom-right
      ];

      let minAway = 4;
      let winningIndices = [];
      for (const stamp of stamps) {
        const missing = stamp.filter(idx => !markedSet.has(idx)).length;
        if (missing === 0) {
          return { won: true, minAway: 0, winningIndices: stamp, patternName: 'Postage Stamp' };
        }
        if (missing < minAway) minAway = missing;
      }
      return { won: false, minAway, winningIndices: [], patternName: 'Postage Stamp' };
    }

    if (patternKey === 'blackout') {
      const allIndices = Array.from({ length: 25 }, (_, i) => i);
      const missing = allIndices.filter(idx => !markedSet.has(idx)).length;
      return {
        won: missing === 0,
        minAway: missing,
        winningIndices: missing === 0 ? allIndices : [],
        patternName: 'Blackout'
      };
    }

    return { won: false, minAway: 5, winningIndices: [], patternName: 'Unknown' };
  }

  // Host verification: Verifies whether player's claim is genuine
  verifyBingoClaim(playerCard, claimedMarks, calledBallsList, patternKey = 'line') {
    // 1. Evaluate if marks satisfy the pattern
    const evalResult = this.evaluateCard(claimedMarks, patternKey);
    if (!evalResult.won) {
      return { valid: false, error: `Card does not satisfy pattern "${this.PATTERNS[patternKey]?.name || patternKey}"` };
    }

    // 2. Check if every winning index marked by player was actually called
    const calledSet = new Set(calledBallsList.map(b => (typeof b === 'object' ? b.label : b)));

    for (const idx of evalResult.winningIndices) {
      const tile = playerCard[idx];
      if (!tile || tile.isFree) continue;

      if (!calledSet.has(tile.label) && !calledSet.has(tile.value) && !calledSet.has(String(tile.value))) {
        return {
          valid: false,
          error: `Square "${tile.label || tile.value}" has not been called yet!`
        };
      }
    }

    return {
      valid: true,
      patternName: evalResult.patternName,
      winningIndices: evalResult.winningIndices
    };
  }
}

window.BingoEngine = new BingoEngine();
