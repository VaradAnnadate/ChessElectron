import { findBestMove } from './ai.js';

self.onmessage = (event) => {
  const { id, fen, difficulty } = event.data;
  self.postMessage({ id, move: findBestMove(fen, difficulty) });
};
