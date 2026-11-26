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
// Testing 1: Search by name
// method: GET
// URL: http://localhost:3000/books?name=atomic
// Body: none
// Expected: 200 OK
// Result: 
// [
//     {
//         "id": 19,
//         "name": "Atomic Habits",
//         "category": "self-help",
//         "price": 435,
//         "detail": "Fair condition",
//         "condition": 3,
//         "owner": "chai",
//         "picture": "/uploads/b19.jpg",
//         "ownerId": 4,
//         "score": 3
//     }
// ]

// Testing 2: Search by name
// method: GET
// URL: http://localhost:3000/books?name=business
// Body: none
// Expected: 200 OK
// Result: 
// [
//     {
//         "id": 6,
//         "name": "BUILBING your MONEY MACHINE",
//         "category": "business",
//         "price": 350,
//         "detail": "ปกบวมน้ำ",
//         "condition": 1,
//         "owner": "admin_dada",
//         "picture": "/uploads/b06.jpg",
//         "ownerId": 2,
//         "score": 0
//     }
// ]

// Testing 3: Search by category
// method: GET
// URL: http://localhost:3000/books?category=business
// Body: none
// Expected: 200 OK
// Result: 
// [
//     {
//         "id": 6,
//         "name": "BUILBING your MONEY MACHINE",
//         "category": "business",
//         "price": 350,
//         "detail": "ปกบวมน้ำ",
//         "condition": 1,
//         "owner": "admin_dada",
//         "picture": "/uploads/b06.jpg",
//         "ownerId": 2,
//         "score": 0
//     }
// ]

// Testing 4: Search by category
// method: GET
// URL: http://localhost:3000/books?category=comic
// Body: none
// Expected: 200 OK
// Result: 
// [
//     {
//         "id": 1,
//         "name": "one piece v59",
//         "category": "comic",
//         "price": 0,
//         "detail": "เพื่อนซื้อมาฝากจากญี่ปุ่น ยังไม่ได้เอาออกจากแพ็ค สภาพดีเยี่ยมพร้อมเก็บสะสม",
//         "condition": 5,
//         "owner": "admin_aomsin",
//         "picture": "/uploads/b01.jpg",
//         "ownerId": 1,
//         "score": 0
//     }
// ]

// Testing 5: Search by price
// method: GET
// URL: http://localhost:3000/books?max=0
// Body: none
// Expected: 200 OK
// Result: 
// [
//     {
//         "id": 46,
//         "name": "หลักธรรมคำสอนของพระพุทธเจ้ากับประเทศไทย 4.0",
//         "category": "psychology",
//         "price": 0,
//         "detail": "พระให้มา สภาพดี",
//         "condition": 5,
//         "owner": "job",
//         "picture": "/uploads/b46.jpg",
//         "ownerId": 10,
//         "score": 0
//     },
//     {
//         "id": 1,
//         "name": "one piece v59",
//         "category": "comic",
//         "price": 0,
//         "detail": "เพื่อนซื้อมาฝากจากญี่ปุ่น ยังไม่ได้เอาออกจากแพ็ค สภาพดีเยี่ยมพร้อมเก็บสะสม",
//         "condition": 5,
//         "owner": "admin_aomsin",
//         "picture": "/uploads/b01.jpg",
//         "ownerId": 1,
//         "score": 0
//     }
// ]

// Testing 6: Search by price
// method: GET
// URL: http://localhost:3000/books?max=390
// Body: none
// Expected: 200 OK
// Result: 
// [
//     {
//         "id": 47,
//         "name": "รักกันได้จริงด้วยบางสิ่งที่ไม่ใช่รัก",
//         "category": "self-help",
//         "price": 389,
//         "detail": "สะอาด สภาพดี",
//         "condition": 5,
//         "owner": "job",
//         "picture": "/uploads/b47.jpg",
//         "ownerId": 10,
//         "score": 0
//     },
//     {
//         "id": 34,
//         "name": "Ghostly Brews",
//         "category": "other",
//         "price": 390,
//         "detail": "อ่านสนุกมีรอยเขียนเล็กน้อย",
//         "condition": 4,
//         "owner": "fang",
//         "picture": "/uploads/b34.jpg",
//         "ownerId": 7,
//         "score": 0
//     }
// ]

// Testing 7: Search product by name
// method: GET
// URL: http://localhost:3000/books?limit=500&scope=manage&name=The%20Hunger%20Games
// Body: none
// Expected: 200 OK
// Result: 
// [
//     {
//         "id": 11,
//         "name": "THE HUNGER GAMES II",
//         "category": "fantasy",
//         "price": 295,
//         "detail": "ขอบเหลือง มีรอยขีดข่วนเล็กน้อย",
//         "condition": 4,
//         "owner": "kim",
//         "picture": "/uploads/b11.jpg",
//         "ownerId": 3,
//         "score": 0
//     },
//     {
//         "id": 10,
//         "name": "THE HUNGER GAMES I",
//         "category": "novel",
//         "price": 245,
//         "detail": "ปกเปิกมุมงอ",
//         "condition": 2,
//         "owner": "admin_dada",
//         "picture": "/uploads/b10.jpg",
//         "ownerId": 2,
//         "score": 0
//     },
//     {
//         "id": 8,
//         "name": "THE HUNGER GAMES III",
//         "category": "novel",
//         "price": 295,
//         "detail": "เหลืองขอบเลอะ",
//         "condition": 3,
//         "owner": "admin_dada",
//         "picture": "/uploads/b08.jpg",
//         "ownerId": 2,
//         "score": 0
//     }
// ]

// Testing 8: Search product by name
// method: GET
// URL: http://localhost:3000/books?limit=500&scope=manage&name=ร้านขายเวลา
// Body: none
// Expected: 200 OK
// Result: 
// [
//     {
//         "id": 39,
//         "name": "ร้านขายเวลา",
//         "category": "novel",
//         "price": 200,
//         "detail": "good",
//         "condition": 4,
//         "owner": "bebe",
//         "picture": "/uploads/b39.jpg",
//         "ownerId": 8,
//         "score": 0
//     }
// ]


// ---------------------------------------------------------------
router.get("/", asyncHandler(async (req, res) => {
  const where = [];
  const whereParams = [];
  const scoreParams = [];
  let score = "0";

  const keyword = String(req.query.name || "").trim();
  
// ทำให้ search ชื่อหนังสือ กับ id
  if (keyword && req.query.scope === "manage") {
    // โหมดหน้า product-manage: ค้นเฉพาะชื่อหนังสือ และ product id
    const tokens = keyword.split(/\s+/).slice(0, 8);
    const nameCond = tokens.map(() => "b.book_name LIKE ?").join(" AND "); // ทุกคำต้องอยู่ในชื่อ
    const nameParams = tokens.map((t) => "%" + escapeLike(t) + "%");

    if (/^\d{1,9}$/.test(keyword)) {
      // พิมพ์ตัวเลขล้วน: ตรงกับ id เป๊ะ หรือชื่อมีเลขนั้น
      where.push(`(b.book_id = ? OR (${nameCond}))`);
      whereParams.push(Number(keyword), ...nameParams);
      score = "(b.book_id = ?)";           // ให้เล่มที่ id ตรงขึ้นก่อน
      scoreParams.push(Number(keyword));
    } else {
      where.push(`(${nameCond})`);
      whereParams.push(...nameParams);
    }
  }

  else if (keyword) {
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

router.get("/mine", requireLogin, asyncHandler(async (req, res) => {
  const [rows] = await db.query(`SELECT ${BOOK_COLS} ${BOOK_FROM} WHERE b.acc_id = ? ORDER BY b.book_id DESC`, [
    req.user.id,
  ]);
  res.json(rows);
}));


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
// ดูรายละเอียดหนังสือ 1 เล่ม
// Testing 1: Book detail
// method: get  
// URL: http://localhost:3000/books/"27"
// Body: none
// Expected: 200 OK
// Result:
// {
//     "id": 27,
//     "name": "A Christmas Carol",
//     "category": "novel",
//     "price": 250,
//     "detail": "มีรอยนิดหน่อย",
//     "condition": 4,
//     "owner": "north",
//     "picture": "/uploads/b27.jpg",
//     "ownerId": 6
// }

// Testing 2: Book detail
// method: get  
// URL: http://localhost:3000/books/"45"
// Body: none
// Expected: 200 OK
// Result:
// {
//     "id": 45,
//     "name": "อย่าเป็นคนเก่งที่คุยไม่เป็น",
//     "category": "self-help",
//     "price": 220,
//     "detail": "ขอบหนังสือยับนิดหน่อย",
//     "condition": 4,
//     "owner": "gun",
//     "picture": "/uploads/b45.jpg",
//     "ownerId": 9
// }
// ---------------------------------------------------------------
router.get("/:id", optionalLogin, asyncHandler(async (req, res) => {
  const [rows] = await db.query(`SELECT ${BOOK_COLS} ${BOOK_FROM} WHERE b.book_id = ?`, [req.params.id]);
  if (!rows.length) return res.status(404).json({ message: "Book not found" });
  res.json(rows[0]);
}));

// ---------------------------------------------------------------
// Testing 1: Add product
// method: POST
// URL: http://localhost:3000/books
// Body: raw -> JSON
// {
//     "name": "Test01B",
//     "category": "fantasy",
//     "price": 250,
//     "condition": 4,
//     "detail": "A Testter fiction adventure novel"
// }
// Expected: 201 Created
// Result: 
// {
//     "message": "Book added",
//     "id": 51
// }

// Testing 1: Add product
// method: POST
// URL: http://localhost:3000/books
// Body: raw -> JSON
// {
//     "name": "Test02B",
//     "category": "fantasy",
//     "price": 250,
//     "condition": 4,
//     "detail": "A Testter2 fiction adventure novel"
// }
// Expected: 201 Created
// Result: 
// {
//     "message": "Book added",
//     "id": 52
// }


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
// Testing 1: Edit product
// method: PUT
// URL: http://localhost:3000/books/51
// Body: raw -> JSON
// {
//     "name": "Test01BE",
//     "category": "fantasy",
//     "price": 250,
//     "condition": 4,
//     "detail": "A Testter2 fiction adventure novel Edittt"
// }
// Expected: 200 OK
// Result: 
// {
//     "message": "Book updated"
// }

// Testing 2: Edit product
// method: PUT
// URL: http://localhost:3000/books/52
// Body: raw -> JSON
// {
//     "name": "Test02BE",
//     "category": "fantasy",
//     "price": 250,
//     "condition": 4,
//     "detail": "A Testter2 fiction adventure novel Edittt"
// }
// Expected: 200 OK
// Result: 
// {
//     "message": "Book updated"
// }
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
// Testing 1: Delete product
// method: DELETE
// URL: http://localhost:3000/books/51
// Body: none
// Expected: 200 OK
// Result:
// {
//     "message": "Book removed"
// }

// Testing 2: Delete product
// method: DELETE
// URL: http://localhost:3000/books/52
// Body: none
// Expected: 200 OK
// Result:
// {
//     "message": "Book removed"
// }
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
