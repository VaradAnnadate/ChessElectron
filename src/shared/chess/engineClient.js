import AiWorker from './ai.worker.js?worker&inline';

let worker = null;
let nextId = 0;
const pending = new Map();

function getWorker() {
  if (!worker) {
    worker = new AiWorker();
    worker.onmessage = (event) => {
      const { id, move } = event.data;
      pending.get(id)?.(move);
      pending.delete(id);
    };
  }
  return worker;
}

export function requestBestMove(fen, difficulty) {
  const id = (nextId += 1);
  return new Promise((resolve) => {
    pending.set(id, resolve);
    getWorker().postMessage({ id, fen, difficulty });
  });
}
