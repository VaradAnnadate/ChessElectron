import { Chess } from 'chess.js';

const PIECE_WEIGHTS = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

// Piece-square tables from White's point of view, rank 8 first.
const PST = {
  p: [
    0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5,
    10, 25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20,
    -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0,
  ],
  n: [
    -50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10,
    0, -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10,
    5, -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50,
  ],
  b: [
    -20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0,
    -10, -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10,
    -10, -10, 5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20,
  ],
  r: [
    0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0,
    0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0,
    5, 5, 0, 0, 0,
  ],
  q: [
    -20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10,
    -5, 0, 5, 5, 5, 5, 0, -5, 0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0,
    0, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20,
  ],
  k: [
    -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40,
    -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -20, -30, -30, -40, -40, -30,
    -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0,
    10, 30, 20,
  ],
};

export const DIFFICULTIES = {
  easy: { label: 'Easy', depth: 1, randomness: 120 },
  medium: { label: 'Medium', depth: 2, randomness: 30 },
  hard: { label: 'Hard', depth: 3, randomness: 0 },
};

const MATE_SCORE = 1_000_000;

export function evaluate(game) {
  let score = 0;
  const board = game.board();
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const piece = board[row][col];
      if (!piece) continue;
      const index = piece.color === 'w' ? row * 8 + col : (7 - row) * 8 + col;
      const value = PIECE_WEIGHTS[piece.type] + PST[piece.type][index];
      score += piece.color === 'w' ? value : -value;
    }
  }
  return score;
}

function orderMoves(moves) {
  return moves.sort((a, b) => {
    const scoreOf = (move) =>
      (move.captured ? 10 * PIECE_WEIGHTS[move.captured] - PIECE_WEIGHTS[move.piece] : 0) +
      (move.promotion ? PIECE_WEIGHTS[move.promotion] : 0);
    return scoreOf(b) - scoreOf(a);
  });
}

function search(game, depth, alpha, beta, ply) {
  if (game.isCheckmate()) {
    return game.turn() === 'w' ? -MATE_SCORE + ply : MATE_SCORE - ply;
  }
  if (game.isDraw()) return 0;
  if (depth === 0) return evaluate(game);

  const maximizing = game.turn() === 'w';
  let best = maximizing ? -Infinity : Infinity;

  for (const move of orderMoves(game.moves({ verbose: true }))) {
    game.move(move);
    const score = search(game, depth - 1, alpha, beta, ply + 1);
    game.undo();

    if (maximizing) {
      best = Math.max(best, score);
      alpha = Math.max(alpha, score);
    } else {
      best = Math.min(best, score);
      beta = Math.min(beta, score);
    }
    if (beta <= alpha) break;
  }
  return best;
}

export function findBestMove(fen, difficulty = 'medium', random = Math.random) {
  const settings = DIFFICULTIES[difficulty] ?? DIFFICULTIES.medium;
  const game = new Chess(fen);
  const moves = orderMoves(game.moves({ verbose: true }));
  if (moves.length === 0) return null;

  const sign = game.turn() === 'w' ? 1 : -1;
  let bestMove = null;
  let bestScore = -Infinity;

  for (const move of moves) {
    game.move(move);
    const score =
      sign * search(game, settings.depth - 1, -Infinity, Infinity, 1) +
      random() * settings.randomness;
    game.undo();
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return { from: bestMove.from, to: bestMove.to, promotion: bestMove.promotion };
}
