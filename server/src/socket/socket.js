const { Server } = require("socket.io");

let io;

const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*", // Allow all origins for now (adjust for production)
            methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
        }
    });

    io.on("connection", (socket) => {
        console.log("Details: New Client Connected:", socket.id);

        // Join user to their specific room if authenticated (optional, for future use)
        // if (socket.handshake.auth.userId) {
        //   socket.join(`user:${socket.handshake.auth.userId}`);
        // }

        socket.on("disconnect", () => {
            console.log("Client Disconnected:", socket.id);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};

module.exports = { initializeSocket, getIO };
