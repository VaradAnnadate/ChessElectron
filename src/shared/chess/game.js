import { Chess } from 'chess.js';

export const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
export const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

export const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

export const PIECE_SYMBOLS = {
  w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
  b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' },
};

export const COLOR_NAMES = { w: 'White', b: 'Black' };

export function createGame(fen) {
  return fen ? new Chess(fen) : new Chess();
}

export function cloneGame(game) {
  const copy = new Chess();
  const pgn = game.pgn();
  if (pgn) copy.loadPgn(pgn);
  else copy.load(game.fen());
  return copy;
}

export function boardSquares(orientation = 'w') {
  const ranks = orientation === 'w' ? RANKS : [...RANKS].reverse();
  const files = orientation === 'w' ? FILES : [...FILES].reverse();
  return ranks.flatMap((rank) => files.map((file) => `${file}${rank}`));
}

export function isLightSquare(square) {
  const file = FILES.indexOf(square[0]);
  const rank = Number(square[1]);
  return (file + rank) % 2 === 0;
}

export function legalTargets(game, square) {
  return game.moves({ square, verbose: true }).map((move) => move.to);
}

export function isPromotionMove(game, from, to) {
  return game
    .moves({ square: from, verbose: true })
    .some((move) => move.to === to && move.promotion);
}

export function findKingSquare(game, color) {
  for (const row of game.board()) {
    for (const cell of row) {
      if (cell && cell.type === 'k' && cell.color === color) return cell.square;
    }
  }
  return null;
}

export function capturedPieces(game) {
  const captured = { w: [], b: [] };
  for (const move of game.history({ verbose: true })) {
    if (move.captured) {
      const victimColor = move.color === 'w' ? 'b' : 'w';
      captured[move.color].push({ type: move.captured, color: victimColor });
    }
  }
  const order = ['q', 'r', 'b', 'n', 'p'];
  for (const color of ['w', 'b']) {
    captured[color].sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));
  }
  return captured;
}

export function materialAdvantage(game) {
  const captured = capturedPieces(game);
  const score = (list) => list.reduce((sum, piece) => sum + PIECE_VALUES[piece.type], 0);
  return score(captured.w) - score(captured.b);
}

export function gameStatus(game) {
  const turn = game.turn();
  const status = {
    turn,
    inCheck: game.inCheck(),
    over: game.isGameOver(),
    result: null,
    reason: null,
    winner: null,
  };

  if (game.isCheckmate()) {
    status.winner = turn === 'w' ? 'b' : 'w';
    status.result = status.winner === 'w' ? '1-0' : '0-1';
    status.reason = 'checkmate';
  } else if (game.isStalemate()) {
    status.result = '1/2-1/2';
    status.reason = 'stalemate';
  } else if (game.isThreefoldRepetition()) {
    status.result = '1/2-1/2';
    status.reason = 'threefold repetition';
  } else if (game.isInsufficientMaterial()) {
    status.result = '1/2-1/2';
    status.reason = 'insufficient material';
  } else if (game.isDraw()) {
    status.result = '1/2-1/2';
    status.reason = '50-move rule';
  }

  return status;
}

export function describeStatus(status) {
  if (status.reason === 'checkmate') {
    return `Checkmate — ${COLOR_NAMES[status.winner]} wins`;
  }
  if (status.winner) {
    return `${COLOR_NAMES[status.winner]} wins by ${status.reason}`;
  }
  if (status.result === '1/2-1/2') return `Draw by ${status.reason}`;
  const prefix = `${COLOR_NAMES[status.turn]} to move`;
  return status.inCheck ? `${prefix} — check!` : prefix;
}

export function movePairs(history) {
  const pairs = [];
  for (let i = 0; i < history.length; i += 2) {
    pairs.push({ number: i / 2 + 1, white: history[i], black: history[i + 1] ?? null });
  }
  return pairs;
}
