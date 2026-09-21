import { io, type Socket } from "socket.io-client";
import { getToken, type AppNotification } from "@/lib/api";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"
).replace(/\/+$/, "");

export type NotificationSocketHandlers = {
  onNotification?: (notification: AppNotification) => void;
};

let sharedSocket: Socket | null = null;
let sharedToken: string | null = null;
const listeners = new Set<(notification: AppNotification) => void>();

function ensureSocket(token: string) {
  if (sharedSocket && sharedToken === token) return sharedSocket;

  if (sharedSocket) {
    sharedSocket.removeAllListeners();
    sharedSocket.disconnect();
    sharedSocket = null;
  }

  sharedToken = token;
  sharedSocket = io(`${API_URL}/notifications`, {
    auth: { token },
    transports: ["websocket", "polling"],
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1500,
  });

  sharedSocket.on("notification", (payload: AppNotification) => {
    for (const listener of listeners) {
      listener(payload);
    }
  });

  return sharedSocket;
}

export function subscribeNotifications(
  onNotification: (notification: AppNotification) => void,
) {
  const token = getToken();
  if (!token) {
    return () => undefined;
  }

  listeners.add(onNotification);
  ensureSocket(token);

  return () => {
    listeners.delete(onNotification);
    if (listeners.size === 0 && sharedSocket) {
      sharedSocket.removeAllListeners();
      sharedSocket.disconnect();
      sharedSocket = null;
      sharedToken = null;
    }
  };
}

export function disconnectNotificationsSocket() {
  listeners.clear();
  if (sharedSocket) {
    sharedSocket.removeAllListeners();
    sharedSocket.disconnect();
    sharedSocket = null;
    sharedToken = null;
  }
}
