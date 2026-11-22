// ============================================================
// Samud Trade - Web service (Back-end)
// รัน: npm install -> คัดลอก .env.example เป็น .env -> npm start
// ทำงานที่ http://localhost:3000  (front-end อยู่ที่ port 3030)
// ============================================================
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./db");
const { UPLOAD_DIR } = require("./util");

const app = express();
const PORT = process.env.PORT || 3000;

// อนุญาตให้ front-end เรียกด้วย fetch พร้อมส่ง cookie (credentials)
const allowedOrigins = (process.env.FRONTEND_ORIGIN || "http://localhost:3030,http://127.0.0.1:3030")
  .split(",")
  .map((s) => s.trim());
app.use(
  cors({
    origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin)),
    credentials: true,
  })
);
app.use(express.json());

// รูปที่อัปโหลด เช่น http://localhost:3000/uploads/xxxx.jpg
app.use("/uploads", express.static(UPLOAD_DIR));

// ตรวจว่า web service ทำงานอยู่ / ต่อฐานข้อมูลได้
// Testing: method GET, URL http://localhost:3000/health  และ  http://localhost:3000/health/db
app.get("/health", (req, res) => res.json({ status: "ok", service: "samud_trade_ws" }));
app.get("/health/db", async (req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

app.use("/auth", require("./routes/auth"));
app.use("/books", require("./routes/books"));
app.use("/accounts", require("./routes/accounts"));
app.use("/trades", require("./routes/trades"));

app.use((req, res) => res.status(404).json({ message: "Not found" }));

// จัดการ error ทั้งหมด (รวมถึง error จากการอัปโหลดไฟล์)
app.use((err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") return res.status(400).json({ message: "Image must be smaller than 5 MB" });
  if (err.status) return res.status(err.status).json({ message: err.message });
  console.error(err);
  res.status(500).json({ message: "Server error" });
});

app.listen(PORT, () => {
  console.log(`Samud Trade web service running at http://localhost:${PORT}`);
});
