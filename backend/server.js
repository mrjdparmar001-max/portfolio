require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dns = require("dns");
const path = require("path");

const isProduction = process.env.NODE_ENV === "production";
const isRender = Boolean(process.env.RENDER);

if (!isProduction && !isRender) {
  dns.setDefaultResultOrder("ipv4first");
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
}

const requiredEnv = ["MONGO_URI", "JWT_SECRET"];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);

if (missingEnv.length > 0) {
  console.error(`Missing required environment variables: ${missingEnv.join(", ")}`);
  console.error("Add them in the Render dashboard under Environment.");
  process.exit(1);
}

const app = express();
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

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

app.use("/api/auth", require("./routes/auth"));
app.use("/api/projects", require("./routes/projects"));
app.use("/api/messages", require("./routes/messages"));
app.use("/api/compliments", require("./routes/compliments"));
app.use("/api/profile", require("./routes/profile"));
app.use("/api/skills", require("./routes/skills"));
app.use("/api/upload", require("./routes/upload"));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Jaydip Parmar Portfolio API Running",
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

const { verifyEmailConnection } = require("./utils/mailer");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 15000,
  })
  .then(async () => {
    console.log("✅ MongoDB Connected");
    await verifyEmailConnection();
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Failed");
    console.error(err.message);
    console.error("Check MONGO_URI in Render and MongoDB Atlas Network Access (allow 0.0.0.0/0).");
  });
