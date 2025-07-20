const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("./Models/User");
const userRoutes = require("./routes/user");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: "*" }));
app.use(express.json());
app.use("/user", userRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.error("MongoDB connection error:", err));

// Setup Socket.IO
const io = new Server(server, {
  cors: { origin: "*" }
});

// Authentication middleware
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error("Authentication error: No token provided"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "value");
    const user = await User.findOne({ email: decoded.email });
    if (!user) return next(new Error("User not found"));
    socket.user = user;
    next();
  } catch (err) {
    next(new Error("Authentication error: Invalid token"));
  }
});

// Socket.IO logic
io.on("connection", (socket) => {
  console.log("A user connected:", socket.user?.email);

  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    socket.data.roomId = roomId; // safer storage than socket.roomId
    console.log(`${socket.user.email} joined room ${roomId}`);
    
    // Notify others
    socket.to(roomId).emit("new", {
      email: socket.user.email
    });
  });

  socket.on("body", (msg) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    
    // Broadcast to everyone else in the room
    socket.to(roomId).emit("chat-message", {
      user: socket.user.email,
      message: msg
    });
  });

  socket.on("disconnect", () => {
    console.log(`${socket.user?.email} disconnected`);
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () =>
  console.log(`Server running on port http://localhost:${PORT}`)
);
