const mongoose = require("mongoose");

const historySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  notes: { type: String, required: true },
  infographic: { type: Object, required: true },
}, { timestamps: true });

module.exports = mongoose.model("History", historySchema);