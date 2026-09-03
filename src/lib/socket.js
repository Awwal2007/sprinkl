/**
 * Singleton Socket.IO client instance.
 *
 * - Connects lazily on first import.
 * - Auto-reconnects on disconnect.
 * - Shared by SupportChatWidget and AdminDashboardPage.
 */
import { io } from 'socket.io-client';

const SOCKET_URL =
  import.meta.env?.VITE_API_URL?.replace('/api', '') ||
  'https://api.sprinkl.biz';

// Create a single persistent socket connection
const socket = io(SOCKET_URL, {
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 10000,
});

export default socket;

/**
 * Join a support chat session room so this client receives
 * real-time events for the given sessionId.
 */
export function joinSession(sessionId) {
  if (sessionId) socket.emit('join_session', sessionId);
}

/**
 * Leave a support chat session room.
 */
export function leaveSession(sessionId) {
  if (sessionId) socket.emit('leave_session', sessionId);
}

/**
 * Join the admin broadcast room (requires a valid JWT access token).
 */
export function joinAdminRoom(accessToken) {
  if (accessToken) socket.emit('join_admin', accessToken);
}
