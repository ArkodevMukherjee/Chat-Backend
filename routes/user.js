const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const router = express.Router();
const User = require("../Models/User");

router.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;
  console.log("Sign Up");

  if (!username || !email || !password)
    return res.status(400).json({ message: "Username, email, and password required" });

  try {
    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ email, username }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: "Signup failed", error: err.message });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    console.log(user);
    if (!user)
      return res.status(404).json({ message: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ message: "Incorrect password" });

    const token = jwt.sign({ email: user.email, username: user.username }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
});

module.exports = router;