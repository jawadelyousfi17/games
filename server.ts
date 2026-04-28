/**
 * Custom Next.js bootstrap that runs on the same Node process as a
 * Socket.IO server. The single process handles both HTTP / SSR and
 * WebSocket traffic, which lets server actions push state to subscribed
 * clients via the in-process `socket-bus` module.
 *
 * Also tracks per-game attendance so a player who disconnects (tab close,
 * network drop, laptop sleep) loses by forfeit if they don't reconnect
 * within FORFEIT_GRACE_MS.
 */
import { createServer } from "node:http";
import next from "next";
import { Server as IoServer, type Socket } from "socket.io";
import {
  setIoInstance,
  gameRoom,
  PRESENCE_EVENT,
  userRoom,
} from "./lib/chess/socket-bus";
import {
  recordPresence,
  recordAbsence,
  dropSocket,
  presenceSnapshot,
} from "./lib/chess/attendance";
import {
  trackUserConnect,
  trackUserDisconnect,
  LOBBY_ROOM,
} from "./lib/chess/online-tracker";
import { userIdFromCookies } from "./lib/auth/session-from-cookies";

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT ?? "3000", 10);
const hostname = process.env.HOSTNAME ?? "0.0.0.0";

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

void app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    void handle(req, res);
  });

  const io = new IoServer(httpServer, {
    cors: { origin: true, credentials: true },
    path: "/socket.io",
    serveClient: false,
    transports: ["websocket", "polling"],
  });

  setIoInstance(io);

  // Auth handshake: parse the session cookie so we can tag every socket
  // with the underlying user id. Anonymous sockets are still allowed to
  // connect — they just won't be tracked for forfeit/presence.
  io.use(async (socket, nextMiddleware) => {
    const cookieHeader = socket.handshake.headers.cookie;
    try {
      const userId = await userIdFromCookies(cookieHeader);
      if (userId) socket.data.userId = userId;
      console.log(
        "[chess] auth handshake →",
        userId ? `userId=${userId}` : "anonymous",
        "(cookie len:",
        cookieHeader?.length ?? 0,
        ")",
      );
    } catch (err) {
      console.warn("[chess] auth handshake error", err);
    }
    nextMiddleware();
  });

  io.on("connection", (socket: Socket) => {
    const userId = socket.data.userId as string | undefined;
    console.log("[chess] socket connected", socket.id, "user:", userId ?? "—");

    // Always join the lobby room so global events (user:online/offline,
    // forthcoming challenges) can fan out via `io.to(LOBBY_ROOM)`. Auth'd
    // sockets also auto-join their personal user room for direct messages.
    void socket.join(LOBBY_ROOM);
    if (userId) {
      void socket.join(userRoom(userId));
      trackUserConnect(socket.id, userId);
    }

    socket.on("join", (gameId: unknown) => {
      if (typeof gameId !== "string" || gameId.length >= 100) return;
      void socket.join(gameRoom(gameId));
      if (userId) recordPresence(gameId, userId, socket.id);
      console.log(
        `[chess] ${socket.id} joined ${gameRoom(gameId)} (user ${userId ?? "anon"})`,
      );

      // Hydrate the joining socket with the current presence of every other
      // user in the game so the UI can show "opponent disconnected · 47s"
      // even if the absence transition happened before this socket joined.
      const snapshot = presenceSnapshot(gameId);
      for (const entry of snapshot) {
        if (entry.userId === userId) continue;
        socket.emit(PRESENCE_EVENT, entry);
      }
    });

    socket.on("leave", (gameId: unknown) => {
      if (typeof gameId !== "string" || gameId.length >= 100) return;
      void socket.leave(gameRoom(gameId));
      if (userId) recordAbsence(gameId, userId, socket.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("[chess] socket disconnected", socket.id, reason);
      dropSocket(socket.id);
      trackUserDisconnect(socket.id);
    });
  });

  httpServer.listen(port, () => {
    console.log(
      `> Ready on http://${hostname === "0.0.0.0" ? "localhost" : hostname}:${port} (Socket.IO attached)`,
    );
  });
});
