import * as dotenv from "dotenv";

import express from "express";
import { getPort } from "./utils";
import path from "path";
import WebSocketServer from "./webSocketServer";
import http from "http";
import PeerServer from "./peerServer";

dotenv.config();

const PORT = getPort();

const app = express();
const httpServer = http.createServer(app);

app.use(express.static(path.join(__dirname, "client")));

app.get("/", async (req, res) => {
  return res.sendFile(path.join(__dirname, "client", "join.html"));
});

app.get("/room/:room", async (req, res) => {
  return res.sendFile(path.join(__dirname, "client", "room.html"));
});

const websocketServer = new WebSocketServer();
const peerServer = new PeerServer(httpServer);

app.use("/", peerServer.peerExpressApp);
httpServer.on("upgrade", (request, socket, head) => {
  const pathname = new URL(request.url, `http://${request.headers.host}`)
    .pathname;

  if (pathname === "/socket") {
    websocketServer.server.handleUpgrade(request, socket, head, (ws) => {
      websocketServer.server.emit("connection", ws);
    });
  } else if (pathname === "/peerjs") {
    peerServer.websocket?.handleUpgrade(request, socket, head, (ws) => {
      peerServer.websocket?.emit("connection", ws, request);
    });
  }
});

// redirect all invalid reqs to /
app.get("*", async (req, res) => {
  return res.redirect("/");
});

httpServer.listen(PORT, () => {
  console.log(`HTTP server listening on port ${PORT}`);
});
