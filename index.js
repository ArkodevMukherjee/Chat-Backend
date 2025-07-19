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

app.use(cors({ origin: "http://127.0.0.1:5500" }));
app.use(express.json());
app.use("/user", user);

mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017").then(() =>
  console.log("MongoDB Connected")
);

const io = new Server(server, {
  cors: { origin: "http://127.0.0.1:5500" }
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
  const roomId = socket.roomId;
  socket.join(roomId);
  console.log(`${socket.user.email} joined room ${roomId}`);

  socket.emit("User Data", socket.user);

  socket.on("body", (msg) => {
    io.to(roomId).emit("chat-message", {
      user: socket.user.email,
      message: msg
    });
  });
});

server.listen(3000, () => console.log("Server running on port http://127.0.0.1:3000"));