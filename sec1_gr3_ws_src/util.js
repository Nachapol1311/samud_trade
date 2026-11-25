// ฟังก์ชันช่วยเหลือที่ใช้ร่วมกัน
const fs = require("fs");
const path = require("path");

// โฟลเดอร์เก็บรูปที่อัปโหลด
const UPLOAD_DIR = path.join(__dirname, "uploads");

// หมวดหมู่หนังสือ (ต้องตรงกับ option ในหน้าเว็บ)
const CATEGORIES = [
  "art-design", "biography", "business", "children", "comic", "cooking", "exam-prep",
  "fantasy", "finance", "health", "history", "horror", "language", "law", "light-novel",
  "magazine", "manga", "mystery", "novel", "other", "programming", "psychology",
  "religion", "romance", "science", "sci-fi", "self-help", "technology", "textbook",
  "thriller", "travel",
];

// ให้ async route ส่ง error ไปที่ error middleware (Express 4 ไม่จับให้เอง)
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// แปลงเป็นจำนวนเต็ม ถ้าแปลงไม่ได้คืน null
function toInt(v) {
  if (v === undefined || v === null || String(v).trim() === "") return null;
  const n = Number(v);
  return Number.isInteger(n) ? n : null;
}

// ป้องกันอักขระพิเศษของ LIKE (% _ \)
function escapeLike(s) {
  return s.replace(/[\\%_]/g, "\\$&");
}

// ลบไฟล์รูปที่อัปโหลดไว้ (ถ้า path เป็น /uploads/xxx) ไม่ error ถ้าไม่มีไฟล์
function removeUpload(urlPath) {
  if (!urlPath || !String(urlPath).startsWith("/uploads/")) return;
  const file = path.join(UPLOAD_DIR, path.basename(urlPath));
  fs.unlink(file, () => {});
}

// สร้าง error ที่มี status code
function httpError(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

module.exports = { UPLOAD_DIR, CATEGORIES, asyncHandler, toInt, escapeLike, removeUpload, httpError };
