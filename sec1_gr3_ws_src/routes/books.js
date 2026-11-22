// ===== เว็บเซอร์วิสสำหรับหนังสือ: ค้นหา / ดู / เพิ่ม / แก้ไข / ลบ =====
const express = require("express");
const db = require("../db");
const upload = require("../upload");
const { optionalLogin, requireLogin } = require("../auth");
const { asyncHandler, CATEGORIES, toInt, escapeLike, removeUpload } = require("../util");

const router = express.Router();

// คอลัมน์ที่ส่งกลับ (ชื่อ owner มาจาก username ของเจ้าของจริงเสมอ)
const BOOK_COLS = `b.book_id AS id, b.book_name AS name, b.book_cat AS category, b.book_price AS price,
  b.book_detail AS detail, b.book_condition AS \`condition\`, u.acc_username AS owner,
  b.book_lick_pic AS picture, b.acc_id AS ownerId`;
const BOOK_FROM = "FROM book b JOIN user_Account u ON u.acc_id = b.acc_id";

// ตรวจข้อมูลหนังสือจากฟอร์ม คืน { error } หรือ { data }
function validateBook(body) {
  const name = String(body.name || "").trim();
  const category = String(body.category || "").trim();
  const price = toInt(body.price);
  const condition = toInt(body.condition);
  const detail = String(body.detail || "").trim();

  if (!name || name.length > 100) return { error: "Book name is required (max 100 characters)" };
  if (!CATEGORIES.includes(category)) return { error: "Please select a category" };
  if (price === null || price < 0) return { error: "Price must be a number (0 or more)" };
  if (condition === null || condition < 1 || condition > 5) return { error: "Please select condition (1-5 stars)" };
  if (detail.length > 255) return { error: "Detail must not exceed 255 characters" };
  return { data: { name, category, price, condition, detail } };
}

// ---------------------------------------------------------------
// ค้นหาหนังสือ (ไม่ต้อง login)  ค้นหาแบบไม่มีเกณฑ์ = ได้หนังสือทั้งหมด
// keyword (name) ใช้ค้นแบบบางส่วนในชื่อ/หมวดหมู่/รายละเอียด/ชื่อเจ้าของ
// ไม่ต้องครบทุกคำ คำไหนตรงก็แสดง และเรียงตามจำนวนคำที่ตรง
// เกณฑ์อื่น: category, min, max (ราคา), condition (ตั้งแต่กี่ดาวขึ้นไป), limit
// Testing 1: ค้นหาทั้งหมด
// method: get
// URL: http://localhost:3000/books
//
// Testing 2: ค้นหาด้วยคำบางส่วน + เกณฑ์
// method: get
// URL: http://localhost:3000/books?name=prog harry&category=programming&min=200&max=500&condition=4
// ---------------------------------------------------------------
router.get("/", asyncHandler(async (req, res) => {
  const where = [];
  const whereParams = [];
  const scoreParams = [];
  let score = "0";

  const keyword = String(req.query.name || "").trim();
  if (keyword) {
    const tokens = keyword.split(/\s+/).slice(0, 8);
    const cond = [];
    const scoreParts = [];
    tokens.forEach((t) => {
      const like = "%" + escapeLike(t) + "%";
      cond.push("(b.book_name LIKE ? OR b.book_cat LIKE ? OR b.book_detail LIKE ? OR u.acc_username LIKE ?)");
      whereParams.push(like, like, like, like);
      scoreParts.push("((b.book_name LIKE ?) * 3 + (b.book_cat LIKE ?) * 2 + (b.book_detail LIKE ?) + (u.acc_username LIKE ?))");
      scoreParams.push(like, like, like, like);
    });
    where.push("(" + cond.join(" OR ") + ")");
    score = scoreParts.join(" + ");
  }
  if (req.query.category) {
    where.push("b.book_cat = ?");
    whereParams.push(String(req.query.category));
  }
  const min = toInt(req.query.min);
  const max = toInt(req.query.max);
  const cond = toInt(req.query.condition);
  if (min !== null) { where.push("b.book_price >= ?"); whereParams.push(min); }
  if (max !== null) { where.push("b.book_price <= ?"); whereParams.push(max); }
  if (cond !== null) { where.push("b.book_condition >= ?"); whereParams.push(cond); }

  const limit = Math.min(Math.max(toInt(req.query.limit) || 200, 1), 500);
  const sql = `SELECT ${BOOK_COLS}, (${score}) AS score ${BOOK_FROM}
               ${where.length ? "WHERE " + where.join(" AND ") : ""}
               ORDER BY score DESC, b.book_id DESC LIMIT ?`;
  const [rows] = await db.query(sql, [...scoreParams, ...whereParams, limit]);
  res.json(rows);
}));

// ---------------------------------------------------------------
// หนังสือของตัวเองทั้งหมด (หน้า my item, select-book)
// Testing 1 / 2 (login ด้วย somchai และ mali_reads ก่อน)
// method: get
// URL: http://localhost:3000/books/mine
// ---------------------------------------------------------------
router.get("/mine", requireLogin, asyncHandler(async (req, res) => {
  const [rows] = await db.query(`SELECT ${BOOK_COLS} ${BOOK_FROM} WHERE b.acc_id = ? ORDER BY b.book_id DESC`, [
    req.user.id,
  ]);
  res.json(rows);
}));

// ---------------------------------------------------------------
// หนังสือของคนอื่น 1 เล่มแบบสุ่ม (หน้า trade)
// seen = id ที่เคยกดไม่สนใจแล้ว (คั่นด้วย ,) จะไม่แสดงซ้ำ
// ไม่แสดงหนังสือที่เราส่งคำขอแลกค้างอยู่แล้ว
// Testing 1: method: get  URL: http://localhost:3000/books/next
// Testing 2: method: get  URL: http://localhost:3000/books/next?seen=16,17,18
// -> { "book": {...} } หรือ { "book": null } เมื่อไม่มีเล่มเหลือ
// ---------------------------------------------------------------
router.get("/next", requireLogin, asyncHandler(async (req, res) => {
  const seen = String(req.query.seen || "").split(",").map(toInt).filter((n) => n !== null);
  const params = [req.user.id, req.user.id];
  let sql = `SELECT ${BOOK_COLS} ${BOOK_FROM}
             WHERE b.acc_id <> ?
               AND b.book_id NOT IN (SELECT want_book_id FROM trade_request
                                     WHERE requester_acc_id = ? AND trade_status = 'pending')`;
  if (seen.length) {
    sql += ` AND b.book_id NOT IN (${seen.map(() => "?").join(",")})`;
    params.push(...seen);
  }
  sql += " ORDER BY RAND() LIMIT 1";
  const [rows] = await db.query(sql, params);
  res.json({ book: rows[0] || null });
}));

// ---------------------------------------------------------------
// ดูรายละเอียดหนังสือ 1 เล่ม (ไม่ต้อง login)
// Testing 1: method: get  URL: http://localhost:3000/books/1
// Testing 2: method: get  URL: http://localhost:3000/books/16
// ---------------------------------------------------------------
router.get("/:id", optionalLogin, asyncHandler(async (req, res) => {
  const [rows] = await db.query(`SELECT ${BOOK_COLS} ${BOOK_FROM} WHERE b.book_id = ?`, [req.params.id]);
  if (!rows.length) return res.status(404).json({ message: "Book not found" });
  res.json(rows[0]);
}));

// ---------------------------------------------------------------
// เพิ่มหนังสือ (เจ้าของ = บัญชีที่ login อยู่ ทั้ง user และ admin)
// Testing 1: เพิ่มโดยไม่มีรูป
// method: post
// URL: http://localhost:3000/books
// body: form-data
//   name = Test Book, category = novel, price = 120, condition = 4, detail = Good condition
//
// Testing 2: เพิ่มพร้อมรูป
// method: post
// URL: http://localhost:3000/books
// body: form-data
//   name = Dune Messiah, category = sci-fi, price = 250, condition = 5,
//   detail = Like new, image = (เลือกไฟล์รูป)
// ---------------------------------------------------------------
router.post("/", requireLogin, upload.single("image"), asyncHandler(async (req, res) => {
  const { error, data } = validateBook(req.body);
  if (error) {
    if (req.file) removeUpload("/uploads/" + req.file.filename);
    return res.status(400).json({ message: error });
  }
  const picture = req.file ? "/uploads/" + req.file.filename : null;
  const [result] = await db.query(
    `INSERT INTO book (book_name, book_cat, book_price, book_detail, book_condition, book_owner, book_lick_pic, acc_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [data.name, data.category, data.price, data.detail, data.condition, req.user.username, picture, req.user.id]
  );
  res.status(201).json({ message: "Book added", id: result.insertId });
}));

// ---------------------------------------------------------------
// แก้ไขหนังสือ (เจ้าของหรือ admin เท่านั้น) ถ้าไม่ส่งรูปใหม่จะใช้รูปเดิม
// Testing 1: method: put  URL: http://localhost:3000/books/11
//   body: form-data  name = Harry Potter 1 (2nd), category = fantasy, price = 220, condition = 4, detail = Updated
// Testing 2: method: put  URL: http://localhost:3000/books/12
//   body: form-data  name = Harry Potter 2, category = fantasy, price = 190, condition = 3, detail = Cover worn,
//   image = (เลือกไฟล์รูป)
// ---------------------------------------------------------------
router.put("/:id", requireLogin, upload.single("image"), asyncHandler(async (req, res) => {
  const newFile = req.file ? "/uploads/" + req.file.filename : null;
  const [rows] = await db.query("SELECT acc_id, book_lick_pic FROM book WHERE book_id = ?", [req.params.id]);
  if (!rows.length) {
    removeUpload(newFile);
    return res.status(404).json({ message: "Book not found" });
  }
  if (rows[0].acc_id !== req.user.id && req.user.role !== "admin") {
    removeUpload(newFile);
    return res.status(403).json({ message: "You can edit only your own books" });
  }
  const { error, data } = validateBook(req.body);
  if (error) {
    removeUpload(newFile);
    return res.status(400).json({ message: error });
  }
  await db.query(
    `UPDATE book SET book_name = ?, book_cat = ?, book_price = ?, book_detail = ?, book_condition = ?,
                     book_lick_pic = ? WHERE book_id = ?`,
    [data.name, data.category, data.price, data.detail, data.condition, newFile || rows[0].book_lick_pic, req.params.id]
  );
  if (newFile) removeUpload(rows[0].book_lick_pic);
  res.json({ message: "Book updated" });
}));

// ---------------------------------------------------------------
// ลบหนังสือ (เจ้าของหรือ admin เท่านั้น) คำขอแลกที่เกี่ยวข้องจะถูกลบตามอัตโนมัติ
// Testing 1: method: delete  URL: http://localhost:3000/books/14
// Testing 2: method: delete  URL: http://localhost:3000/books/15
// ---------------------------------------------------------------
router.delete("/:id", requireLogin, asyncHandler(async (req, res) => {
  const [rows] = await db.query("SELECT acc_id, book_lick_pic FROM book WHERE book_id = ?", [req.params.id]);
  if (!rows.length) return res.status(404).json({ message: "Book not found" });
  if (rows[0].acc_id !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({ message: "You can remove only your own books" });
  }
  await db.query("DELETE FROM book WHERE book_id = ?", [req.params.id]);
  removeUpload(rows[0].book_lick_pic);
  res.json({ message: "Book removed" });
}));

module.exports = router;
