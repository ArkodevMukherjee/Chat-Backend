const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const router = express.Router();

const User = require("../Models/User")

router.post("/signup", async (req, res) => {
  const { username,email, password } = req.body;

  if (!username || !email || !password)
    return res.status(400).json({ message: "Email and password required" });

  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username:username ,email, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ email }, process.env.JWT_SECRET || "value", { expiresIn: "1h" });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: "Signup failed", error: err.message });
  }
});

router.post("/login", async(req, res) => {
  const { email,password } = req.body;

  const user = await User.findOne({email:email})

  if(!user){
    res.json({message:"User not found in the server"});
  }

  else{
    const valid = bcrypt.compare(password,user.password);
    if(!valid){
      res.json({message:"Password is not correct from the client"});
    }
    else{
      const token = jwt.sign({ email }, process.env.JWT_SECRET || "value", { expiresIn: "1h" });
      res.json({ access_token:token });
    }
  }
});

module.exports = router;