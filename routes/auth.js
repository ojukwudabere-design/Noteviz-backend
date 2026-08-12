const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const router = express.Router();

function makeToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "30d" });
}

// SIGNUP
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "An account with this email already exists." });
    }
    const user = await User.create({ name, email, password });
    const token = makeToken(user._id);
    res.json({ token, user: { name: user.name, email: user.email } });
} catch (e) {
    console.error("SIGNUP ERROR:", e);
    res.status(500).json({ message: "Signup failed. Try again." });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "No account found with this email." });
    }
    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(400).json({ message: "Incorrect password." });
    }
    const token = makeToken(user._id);
    res.json({ token, user: { name: user.name, email: user.email } });
  } catch (e) {
    res.status(500).json({ message: "Login failed. Try again." });
  }
});

module.exports = router;