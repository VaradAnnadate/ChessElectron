import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { WebSocketServer } from 'ws';
import GameRoom, { generateRoomId } from './GameRoom.js';
import { CLIENT, SERVER, decode, encode } from '../src/shared/net/protocol.js';

const MAX_NAME_LENGTH = 24;
const MAX_CHAT_LENGTH = 300;

export function createChessServer({ port = 3001, host = '0.0.0.0', log = console.log } = {}) {
  const rooms = new Map();
  const clients = new Map();
  const searching = new Map();

  const httpServer = http.createServer((req, res) => {
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, version: "1.0.0", rooms: rooms.size, players: clients.size }));
      return;
    }
    res.writeHead(404);
    res.end();
  });

  const wss = new WebSocketServer({ server: httpServer });

  const send = (client, type, payload) => {
    if (client?.socket.readyState === 1) client.socket.send(encode(type, payload));
  };

  const broadcastRoom = (room, type, payload) => {
    send(room.players.w, type, payload);
    send(room.players.b, type, payload);
  };

  const openRooms = () =>
    [...rooms.values()].filter((room) => !room.isFull && !room.isOver).map((room) => room.summary());

  const broadcastLobby = () => {
    const list = openRooms();
    for (const client of clients.values()) {
      if (!client.roomId) send(client, SERVER.ROOMS, { rooms: list });
    }
  };

  const startGame = (room) => {
    room.start();
    for (const color of ['w', 'b']) {
      send(room.players[color], SERVER.GAME_START, { ...room.snapshot(), color });
    }
    log(`[room ${room.id}] game started: ${room.players.w.name} vs ${room.players.b.name}`);
    broadcastLobby();
  };

  const endGame = (room, result) => {
    broadcastRoom(room, SERVER.GAME_OVER, room.snapshot());
    log(`[room ${room.id}] game over: ${result.result} (${result.reason})`);
  };

  const leaveRoom = (client) => {
    const room = rooms.get(client.roomId);
    client.roomId = null;
    if (!room) return;
    const opponent = room.opponentOf(client.id);
    const result = room.abandon(client.id);
    if (opponent) {
      send(opponent, SERVER.OPPONENT_LEFT, {});
      if (result) send(opponent, SERVER.GAME_OVER, room.snapshot());
    }
    const someoneLeft = [room.players.w, room.players.b].some((p) => p && p.roomId === room.id);
    if (!someoneLeft) rooms.delete(room.id);
    broadcastLobby();
  };

  const createRoom = (timeControl) => {
    let id = generateRoomId();
    while (rooms.has(id)) id = generateRoomId();
    const room = new GameRoom({ id, timeControl });
    rooms.set(id, room);
    return room;
  };

  const handlers = {
    [CLIENT.HELLO](client, { name }) {
      client.name = String(name || 'Guest').trim().slice(0, MAX_NAME_LENGTH) || 'Guest';
      send(client, SERVER.WELCOME, { playerId: client.id, name: client.name });
      send(client, SERVER.ROOMS, { rooms: openRooms() });
    },

    [CLIENT.LIST_ROOMS](client) {
      send(client, SERVER.ROOMS, { rooms: openRooms() });
    },

    [CLIENT.CREATE_ROOM](client, { timeControl, color }) {
      if (client.roomId) leaveRoom(client);
      const room = createRoom(timeControl);
      room.addPlayer(client, color === 'w' || color === 'b' ? color : null);
      client.roomId = room.id;
      send(client, SERVER.ROOM_CREATED, { roomId: room.id, timeControl: room.timeControl });
      log(`[room ${room.id}] created by ${client.name}`);
      broadcastLobby();
    },

    [CLIENT.JOIN_ROOM](client, { roomId }) {
      const room = rooms.get(String(roomId || '').toUpperCase());
      if (!room) return send(client, SERVER.ERROR, { message: 'Room not found' });
      if (room.colorOf(client.id)) return undefined;
      if (room.isFull || room.isOver) {
        return send(client, SERVER.ERROR, { message: 'Room is no longer available' });
      }
      if (client.roomId) leaveRoom(client);
      room.addPlayer(client);
      client.roomId = room.id;
      return startGame(room);
    },

    [CLIENT.QUICK_MATCH](client, { timeControl = 'blitz' }) {
      if (client.roomId) leaveRoom(client);
      const match = [...searching.entries()].find(
        ([id, entry]) => id !== client.id && entry.timeControl === timeControl,
      );
      if (!match) {
        searching.set(client.id, { client, timeControl });
        return send(client, SERVER.SEARCHING, { timeControl });
      }
      const [opponentId, { client: opponent }] = match;
      searching.delete(opponentId);
      const room = createRoom(timeControl);
      const firstIsWhite = Math.random() < 0.5;
      room.addPlayer(firstIsWhite ? opponent : client, 'w');
      room.addPlayer(firstIsWhite ? client : opponent, 'b');
      client.roomId = room.id;
      opponent.roomId = room.id;
      return startGame(room);
    },

    [CLIENT.CANCEL_SEARCH](client) {
      searching.delete(client.id);
    },

    [CLIENT.MOVE](client, { from, to, promotion }) {
      const room = rooms.get(client.roomId);
      if (!room) return send(client, SERVER.ERROR, { message: 'You are not in a game' });
      try {
        const move = room.makeMove(client.id, { from, to, promotion });
        broadcastRoom(room, SERVER.MOVE, { move: { from: move.from, to: move.to, san: move.san, promotion: move.promotion }, ...room.snapshot() });
        if (room.result) endGame(room, room.result);
      } catch (error) {
        send(client, SERVER.ERROR, { message: error.message, ...room.snapshot() });
        const timeout = room.result;
        if (timeout) endGame(room, timeout);
      }
      return undefined;
    },

    [CLIENT.RESIGN](client) {
      const room = rooms.get(client.roomId);
      const result = room?.resign(client.id);
      if (result) endGame(room, result);
    },

    [CLIENT.OFFER_DRAW](client) {
      const room = rooms.get(client.roomId);
      if (room?.offerDraw(client.id)) send(room.opponentOf(client.id), SERVER.DRAW_OFFERED, {});
    },

    [CLIENT.ACCEPT_DRAW](client) {
      const room = rooms.get(client.roomId);
      const result = room?.acceptDraw(client.id);
      if (result) endGame(room, result);
    },

    [CLIENT.DECLINE_DRAW](client) {
      const room = rooms.get(client.roomId);
      if (room?.declineDraw(client.id)) send(room.opponentOf(client.id), SERVER.DRAW_DECLINED, {});
    },

    [CLIENT.CHAT](client, { text }) {
      const room = rooms.get(client.roomId);
      const message = String(text || '').trim().slice(0, MAX_CHAT_LENGTH);
      if (!room || !message) return;
      broadcastRoom(room, SERVER.CHAT, { from: client.name, color: room.colorOf(client.id), text: message, at: Date.now() });
    },

    [CLIENT.LEAVE](client) {
      searching.delete(client.id);
      leaveRoom(client);
    },
  };

  wss.on('connection', (socket) => {
    const client = { id: randomUUID(), name: 'Guest', socket, roomId: null };
    clients.set(client.id, client);

    socket.on('message', (raw) => {
      const message = decode(raw);
      const handler = message && handlers[message.type];
      if (!handler) return send(client, SERVER.ERROR, { message: 'Unknown message' });
      return handler(client, message);
    });

    socket.on('close', () => {
      searching.delete(client.id);
      leaveRoom(client);
      clients.delete(client.id);
    });
  });

  const timeoutTimer = setInterval(() => {
    for (const room of rooms.values()) {
      const result = room.checkTimeout();
      if (result) endGame(room, result);
    }
  }, 250);

  return {
    rooms,
    clients,
    listen() {
      return new Promise((resolve) => {
        httpServer.listen(port, host, () => {
          const address = httpServer.address();
          log(`Chess server listening on ws://${host}:${address.port}`);
          resolve(address.port);
        });
      });
    },
    close() {
      clearInterval(timeoutTimer);
      for (const client of clients.values()) client.socket.terminate();
      return new Promise((resolve) => {
        wss.close(() => httpServer.close(() => resolve()));
      });
    },
  };
}

const isEntryPoint = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isEntryPoint) {
  const server = createChessServer({ port: Number(process.env.PORT) || 3001 });
  server.listen();
  const shutdown = () => server.close().then(() => process.exit(0));
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
