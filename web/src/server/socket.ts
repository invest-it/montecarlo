import { Server } from "socket.io";
import { Server as Engine } from "@socket.io/bun-engine";

const io = new Server({
    cors: {
        origin: "http://localhost:3000",
    },
});

const engine = new Engine({});

io.bind(engine);

io.on("connection", (socket) => {
    console.log("a user connected");
    socket.on("disconnect", () => {
        console.log("user disconnected");
    });
});

const { websocket } = engine.handler();

const socket = {
    ws: websocket,
    handler: engine.handleRequest.bind(engine),
};

export default socket;
