const express = require("express");
const auth = require("../middleware/auth");
const History = require("../models/History");
const router = express.Router();

router.get("/", auth, async (req, res) => {
  try {
    const history = await History.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ history });
  } catch (e) {
    res.status(500).json({ message: "Could not load history." });
  }
});

module.exports = router;