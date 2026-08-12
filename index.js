require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const convertRoutes = require("./routes/convert");
const historyRoutes = require("./routes/history");
const extractRoutes = require("./routes/extract");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/convert", convertRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/extract", extractRoutes);

app.get("/", (req, res) => res.send("NoteViz backend is running."));

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));
  })
  .catch(err => console.error("MongoDB connection error:", err));