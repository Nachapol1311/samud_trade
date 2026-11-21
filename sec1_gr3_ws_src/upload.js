// ตั้งค่า multer สำหรับอัปโหลดรูปภาพ (เก็บไฟล์ในโฟลเดอร์ uploads)
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");
const { UPLOAD_DIR } = require("./util");

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_EXT = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(4).toString("hex")}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (file.mimetype.startsWith("image/") && ALLOWED_EXT.includes(ext)) return cb(null, true);
    const err = new Error("Only image files (jpg, png, gif, webp) are allowed");
    err.status = 400;
    cb(err);
  },
});

module.exports = upload;
