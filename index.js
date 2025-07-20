const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("./Models/User");
const user = require("./routes/user");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: "*" }));
app.use(express.json());
app.use("/user", user);

mongoose.connect(process.env.MONGODB_URI).then(() =>
  console.log("MongoDB Connected")
);

const io = new Server(server, {
  cors: { origin: "*" }
});

io.use(async(socket, next) => {
  const access_token = socket.handshake.auth.token;
  if (!access_token) {
    return next(new Error("Authentication error: No token provided"));
  }

  try {
    const decoded = jwt.verify(access_token, process.env.JWT_SECRET || "value");
    let user = await User.findOne({email:decoded.email}) 
    socket.user = user;
    // console.log("Authenticated user:", socket.user);
    next();
  } catch (err) {
    next(new Error("Authentication error: Invalid token"));
  }
});

io.on("connection", (socket) => {
  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    socket.roomId = roomId;
    console.log("User")
    console.log(`${socket.user.email} joined room ${roomId}`);

    io.to(roomId).emit("new", socket.user);
  });

  socket.on("body", (msg) => {
    if (!socket.roomId) return;
    socket.to(socket.roomId).emit("chat-message", {
      user: socket.user.email,
      message: msg
    });
  });
});

const PORT = process.env.PORT
server.listen(PORT, () => console.log("Server running on port http://127.0.0.1:3000"));