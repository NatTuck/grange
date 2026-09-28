import { createServer } from "node:http";
import express from "express";
import { Server } from "socket.io";
import ViteExpress from "vite-express";
import { registerSocketHandlers } from "./sockets";
import { state } from "./state";

const app = express();
app.use(express.json());

const server = createServer(app);
const io = new Server(server);

// health-check / debug route
app.get("/api/state", (_req, res) => {
	res.json({
		playerCount: state.players.length,
		farmCount: Object.keys(state.farms).length,
	});
});

// Test hook: wipe in-memory state so e2e runs start clean.
app.post("/api/reset", (_req, res) => {
	state.players = [];
	state.farms = {};
	res.json({ ok: true });
});

io.on("connection", (socket) => {
	socket.emit("connected", { ok: true });
});

registerSocketHandlers(io, state);

ViteExpress.bind(app, server);

const PORT = Number(process.env.PORT) || 3000;
server.listen(PORT, () => {
	console.log(`Grange running at http://localhost:${PORT}`);
});
