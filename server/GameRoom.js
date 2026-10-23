import { Chess } from 'chess.js';
import { gameStatus } from '../src/shared/chess/game.js';
import { TIME_CONTROLS } from '../src/shared/chess/timeControls.js';

const ROOM_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateRoomId(length = 5, random = Math.random) {
  let id = '';
  for (let i = 0; i < length; i += 1) {
    id += ROOM_ALPHABET[Math.floor(random() * ROOM_ALPHABET.length)];
  }
  return id;
}

export default class GameRoom {
  constructor({ id, timeControl = 'none', now = () => Date.now() }) {
    this.id = id;
    this.timeControl = TIME_CONTROLS[timeControl] ? timeControl : 'none';
    this.now = now;
    this.chess = new Chess();
    this.players = { w: null, b: null };
    this.result = null;
    this.drawOfferBy = null;
    const initial = TIME_CONTROLS[this.timeControl].initial * 1000;
    this.clocks = { w: initial, b: initial };
    this.turnStartedAt = null;
    this.createdAt = now();
  }

  get hasClock() {
    return TIME_CONTROLS[this.timeControl].initial > 0;
  }

  get isFull() {
    return Boolean(this.players.w && this.players.b);
  }

  get isOver() {
    return Boolean(this.result);
  }

  colorOf(playerId) {
    if (this.players.w?.id === playerId) return 'w';
    if (this.players.b?.id === playerId) return 'b';
    return null;
  }

  opponentOf(playerId) {
    const color = this.colorOf(playerId);
    if (!color) return null;
    return this.players[color === 'w' ? 'b' : 'w'];
  }

  addPlayer(player, preferredColor = null) {
    if (this.colorOf(player.id)) return this.colorOf(player.id);
    if (this.isFull) throw new Error('Room is full');
    let color = preferredColor;
    if (!color || this.players[color]) color = this.players.w ? 'b' : 'w';
    this.players[color] = player;
    return color;
  }

  start() {
    this.chess.setHeader('Event', 'Online game');
    this.chess.setHeader('Site', 'Chess Desktop');
    this.chess.setHeader('Date', new Date(this.now()).toISOString().slice(0, 10).replaceAll('-', '.'));
    this.chess.setHeader('White', this.players.w?.name ?? '?');
    this.chess.setHeader('Black', this.players.b?.name ?? '?');
    this.turnStartedAt = this.now();
  }

  liveClocks() {
    if (!this.hasClock || this.turnStartedAt === null || this.isOver) return { ...this.clocks };
    const turn = this.chess.turn();
    const elapsed = this.now() - this.turnStartedAt;
    return { ...this.clocks, [turn]: Math.max(0, this.clocks[turn] - elapsed) };
  }

  checkTimeout() {
    if (!this.hasClock || this.isOver || this.turnStartedAt === null) return null;
    const clocks = this.liveClocks();
    const turn = this.chess.turn();
    if (clocks[turn] <= 0) {
      this.clocks = clocks;
      return this.finish({ winner: turn === 'w' ? 'b' : 'w', reason: 'timeout' });
    }
    return null;
  }

  makeMove(playerId, move) {
    if (this.isOver) throw new Error('Game is over');
    if (!this.isFull) throw new Error('Waiting for opponent');
    const color = this.colorOf(playerId);
    if (!color) throw new Error('You are not playing in this room');
    if (color !== this.chess.turn()) throw new Error('Not your turn');
    if (this.checkTimeout()) throw new Error('Time is up');

    const clocksBeforeMove = this.hasClock ? this.liveClocks() : null;
    let result;
    try {
      result = this.chess.move({ from: move.from, to: move.to, promotion: move.promotion });
    } catch {
      throw new Error('Illegal move');
    }

    if (this.hasClock) {
      const control = TIME_CONTROLS[this.timeControl];
      this.clocks = clocksBeforeMove;
      this.clocks[color] += control.increment * 1000;
    }
    this.turnStartedAt = this.now();
    this.drawOfferBy = null;

    const status = gameStatus(this.chess);
    if (status.over) {
      this.finish({ winner: status.winner, reason: status.reason });
    }
    return result;
  }

  resign(playerId) {
    const color = this.colorOf(playerId);
    if (!color || this.isOver) return null;
    return this.finish({ winner: color === 'w' ? 'b' : 'w', reason: 'resignation' });
  }

  offerDraw(playerId) {
    const color = this.colorOf(playerId);
    if (!color || this.isOver || !this.isFull) return false;
    this.drawOfferBy = color;
    return true;
  }

  acceptDraw(playerId) {
    const color = this.colorOf(playerId);
    if (!color || this.isOver || !this.drawOfferBy || this.drawOfferBy === color) return null;
    return this.finish({ winner: null, reason: 'agreement' });
  }

  declineDraw(playerId) {
    const color = this.colorOf(playerId);
    if (!color || !this.drawOfferBy || this.drawOfferBy === color) return false;
    this.drawOfferBy = null;
    return true;
  }

  abandon(playerId) {
    const color = this.colorOf(playerId);
    if (!color || this.isOver) return null;
    if (!this.isFull) return this.finish({ winner: null, reason: 'aborted' });
    return this.finish({ winner: color === 'w' ? 'b' : 'w', reason: 'abandonment' });
  }

  finish({ winner, reason }) {
    if (this.isOver) return this.result;
    if (this.hasClock && this.turnStartedAt !== null) this.clocks = this.liveClocks();
    let score = '1/2-1/2';
    if (winner === 'w') score = '1-0';
    if (winner === 'b') score = '0-1';
    this.result = { winner, reason, result: score };
    this.chess.setHeader('Result', score);
    return this.result;
  }

  snapshot() {
    return {
      roomId: this.id,
      fen: this.chess.fen(),
      pgn: this.chess.pgn(),
      history: this.chess.history(),
      turn: this.chess.turn(),
      timeControl: this.timeControl,
      clocks: this.liveClocks(),
      white: this.players.w?.name ?? null,
      black: this.players.b?.name ?? null,
      result: this.result,
    };
  }

  summary() {
    const host = this.players.w ?? this.players.b;
    return {
      roomId: this.id,
      host: host?.name ?? 'Unknown',
      timeControl: this.timeControl,
      createdAt: this.createdAt,
    };
  }
}
