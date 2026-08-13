require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dns = require("dns");
const path = require("path");

const app = express();
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

// Middleware
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  process.env.CLIENT_URL,
  process.env.ADMIN_URL,
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, origin || true);
        return;
      }

      callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Routes
// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/projects", require("./routes/projects"));
app.use("/api/messages", require("./routes/messages"));
app.use("/api/compliments", require("./routes/compliments"));

app.use("/api/profile", require("./routes/profile"));
app.use("/api/skills", require("./routes/skills"));
app.use("/api/upload", require("./routes/upload"));

// Health Check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Jaydip Parmar Portfolio API Running",
  });
});

// MongoDB Connection
const { verifyEmailConnection } = require("./utils/mailer");

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ MongoDB Connected");

    await verifyEmailConnection();

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Failed");
    console.error(err);
    process.exit(1);
  });