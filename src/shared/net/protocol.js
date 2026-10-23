// Message types shared by the chess server and every client (web or desktop).
export const CLIENT = {
  HELLO: 'hello',
  CREATE_ROOM: 'create_room',
  JOIN_ROOM: 'join_room',
  QUICK_MATCH: 'quick_match',
  CANCEL_SEARCH: 'cancel_search',
  MOVE: 'move',
  RESIGN: 'resign',
  OFFER_DRAW: 'offer_draw',
  ACCEPT_DRAW: 'accept_draw',
  DECLINE_DRAW: 'decline_draw',
  CHAT: 'chat',
  LEAVE: 'leave',
  LIST_ROOMS: 'list_rooms',
};

export const SERVER = {
  WELCOME: 'welcome',
  ROOM_CREATED: 'room_created',
  SEARCHING: 'searching',
  GAME_START: 'game_start',
  MOVE: 'move',
  GAME_OVER: 'game_over',
  DRAW_OFFERED: 'draw_offered',
  DRAW_DECLINED: 'draw_declined',
  CHAT: 'chat',
  OPPONENT_LEFT: 'opponent_left',
  ROOMS: 'rooms',
  ERROR: 'error',
};

export const DEFAULT_SERVER_URL = 'ws://localhost:3001';

export function encode(type, payload = {}) {
  return JSON.stringify({ type, ...payload });
}

export function decode(raw) {
  try {
    const message = JSON.parse(typeof raw === 'string' ? raw : raw.toString());
    return message && typeof message.type === 'string' ? message : null;
  } catch {
    return null;
  }
}
