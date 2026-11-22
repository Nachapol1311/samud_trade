// ===== เว็บเซอร์วิสจัดการบัญชีผู้ใช้ (เฉพาะ admin): ค้นหา / ดู / เพิ่ม / แก้ไข / ลบ =====
const express = require("express");
const db = require("../db");
const upload = require("../upload");
const { requireAdmin } = require("../auth");
const { asyncHandler, escapeLike, removeUpload } = require("../util");

const router = express.Router();
router.use(requireAdmin); // ทุก route ในไฟล์นี้ต้องเป็น admin

const ACC_COLS = `u.acc_id AS id, u.acc_role AS role, u.acc_username AS username,
  i.acc_name AS firstname, i.acc_surname AS lastname, i.acc_email AS email, i.acc_picture_link AS picture`;
const ACC_FROM = "FROM user_Account u LEFT JOIN information_Account i ON i.acc_id = u.acc_id";

// ตรวจข้อมูลบัญชี (password ไม่บังคับตอนแก้ไข)
function validateAccount(body, passwordRequired) {
  const role = String(body.role || "");
  const firstname = String(body.firstname || "").trim();
  const lastname = String(body.lastname || "").trim();
  const username = String(body.username || "").trim();
  const email = String(body.email || "").trim();
  const password = String(body.password || "");

  if (!["admin", "user"].includes(role)) return { error: "Role must be admin or user" };
  if (!firstname || firstname.length > 20) return { error: "First name is required (max 20 characters)" };
  if (!lastname || lastname.length > 20) return { error: "Last name is required (max 20 characters)" };
  if (!/^[A-Za-z0-9_.-]{3,20}$/.test(username)) return { error: "Username must be 3-20 characters (letters, numbers, _ . -)" };
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 100) return { error: "Please enter a valid email" };
  if ((passwordRequired || password) && password.length < 6) return { error: "Password must be at least 6 characters" };
  return { data: { role, firstname, lastname, username, email, password } };
}

function duplicateMessage(err) {
  return String(err.sqlMessage || "").includes("username") ? "Username already exists" : "Email already exists";
}

// ---------------------------------------------------------------
// ค้นหาบัญชี: ไม่ใส่เกณฑ์ = ทั้งหมด / ใส่ได้ทุกเกณฑ์พร้อมกันหรือบางส่วน (เงื่อนไขทุกข้อต้องตรงพร้อมกัน)
// เกณฑ์การค้นหา (query string, ไม่บังคับทุกตัว):
//   username = ค้นบางส่วนจากชื่อผู้ใช้
//   name     = ค้นบางส่วนจากชื่อจริงหรือนามสกุล
//   email    = ค้นบางส่วนจากอีเมล
//   role     = admin หรือ user (ตรงทั้งคำ)
//   keyword  = ค้นบางส่วนจากทุกช่องข้างต้นพร้อมกัน (ใช้กับช่องค้นหาในหน้า user-manage)
// Testing 1: ค้นหาทั้งหมด
// method: get
// URL: http://localhost:3000/accounts
//
// Testing 2: ค้นหาด้วยบางเกณฑ์ (ชื่อผู้ใช้มีคำว่า som)
// method: get
// URL: http://localhost:3000/accounts?username=som
//
// Testing 3: ค้นหาด้วยหลายเกณฑ์พร้อมกัน (เป็น user และอีเมลมีคำว่า gmail)
// method: get
// URL: http://localhost:3000/accounts?role=user&email=gmail
//
// Testing 4: ค้นหาด้วยชื่อหรือนามสกุล + role
// method: get
// URL: http://localhost:3000/accounts?name=kim&role=user
// (ต้อง login เป็น admin ก่อน ด้วย POST /auth/login)
// ---------------------------------------------------------------
router.get("/", asyncHandler(async (req, res) => {
  const text = (value) => String(value || "").trim();
  const username = text(req.query.username);
  const name = text(req.query.name);
  const email = text(req.query.email);
  const role = text(req.query.role);
  const keyword = text(req.query.keyword);

  if (role && !["admin", "user"].includes(role)) {
    return res.status(400).json({ message: "role must be admin or user" });
  }

  const conditions = [];
  const params = [];
  const like = (value) => "%" + escapeLike(value) + "%";

  if (username) {
    conditions.push("u.acc_username LIKE ?");
    params.push(like(username));
  }
  if (name) {
    conditions.push("(i.acc_name LIKE ? OR i.acc_surname LIKE ?)");
    params.push(like(name), like(name));
  }
  if (email) {
    conditions.push("i.acc_email LIKE ?");
    params.push(like(email));
  }
  if (role) {
    conditions.push("u.acc_role = ?");
    params.push(role);
  }
  if (keyword) {
    conditions.push("(u.acc_username LIKE ? OR i.acc_name LIKE ? OR i.acc_surname LIKE ? OR i.acc_email LIKE ?)");
    params.push(like(keyword), like(keyword), like(keyword), like(keyword));
  }

  const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";
  const [rows] = await db.query(`SELECT ${ACC_COLS} ${ACC_FROM} ${where} ORDER BY u.acc_id`, params);
  res.json(rows);
}));

// ---------------------------------------------------------------
// ดูบัญชี 1 รายการ
// Testing 1: method: get  URL: http://localhost:3000/accounts/3
// Testing 2: method: get  URL: http://localhost:3000/accounts/1
// ---------------------------------------------------------------
router.get("/:id", asyncHandler(async (req, res) => {
  const [rows] = await db.query(`SELECT ${ACC_COLS} ${ACC_FROM} WHERE u.acc_id = ?`, [req.params.id]);
  if (!rows.length) return res.status(404).json({ message: "Account not found" });
  res.json(rows[0]);
}));

// ---------------------------------------------------------------
// เพิ่มบัญชี (รหัสผ่านเก็บเป็น SHA-256)
// Testing 1: method: post  URL: http://localhost:3000/accounts
// body: raw JSON
// { "role": "user", "firstname": "Test", "lastname": "User", "username": "test_user",
//   "email": "test.user@gmail.com", "password": "User@1234" }
//
// Testing 2: method: post  URL: http://localhost:3000/accounts
// body: raw JSON
// { "role": "admin", "firstname": "Second", "lastname": "Admin", "username": "admin_two",
//   "email": "admin.two@samudtrade.com", "password": "Admin@1234" }
// ---------------------------------------------------------------
router.post("/", asyncHandler(async (req, res) => {
  const { error, data } = validateAccount(req.body, true);
  if (error) return res.status(400).json({ message: error });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query(
      "INSERT INTO user_Account (acc_role, acc_username, acc_passwd) VALUES (?, ?, SHA2(?, 256))",
      [data.role, data.username, data.password]
    );
    await conn.query(
      "INSERT INTO information_Account (acc_email, acc_name, acc_surname, acc_id) VALUES (?, ?, ?, ?)",
      [data.email, data.firstname, data.lastname, result.insertId]
    );
    await conn.commit();
    res.status(201).json({ message: "Account added", id: result.insertId });
  } catch (err) {
    await conn.rollback();
    if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ message: duplicateMessage(err) });
    throw err;
  } finally {
    conn.release();
  }
}));

// ---------------------------------------------------------------
// แก้ไขบัญชี (ไม่ใส่ password = ไม่เปลี่ยนรหัสผ่าน, image ไม่บังคับ)
// Testing 1: method: put  URL: http://localhost:3000/accounts/4
// body: form-data
//   role = user, firstname = Mali, lastname = Rakdee, username = mali_reads, email = mali.r@gmail.com
//
// Testing 2: method: put  URL: http://localhost:3000/accounts/5
// body: form-data
//   role = user, firstname = Krit, lastname = Wongsawat, username = krit_dev,
//   email = krit.w@gmail.com, password = NewPass@123, image = (เลือกไฟล์รูป)
// ---------------------------------------------------------------
router.put("/:id", upload.single("image"), asyncHandler(async (req, res) => {
  const newFile = req.file ? "/uploads/" + req.file.filename : null;
  const fail = (status, message) => {
    removeUpload(newFile);
    return res.status(status).json({ message });
  };

  const [exist] = await db.query(
    "SELECT u.acc_id, i.acc_picture_link FROM user_Account u LEFT JOIN information_Account i ON i.acc_id = u.acc_id WHERE u.acc_id = ?",
    [req.params.id]
  );
  if (!exist.length) return fail(404, "Account not found");

  const { error, data } = validateAccount(req.body, false);
  if (error) return fail(400, error);
  if (Number(req.params.id) === req.user.id && data.role !== "admin") {
    return fail(400, "You cannot remove your own admin role");
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    if (data.password) {
      await conn.query("UPDATE user_Account SET acc_role = ?, acc_username = ?, acc_passwd = SHA2(?, 256) WHERE acc_id = ?",
        [data.role, data.username, data.password, req.params.id]);
    } else {
      await conn.query("UPDATE user_Account SET acc_role = ?, acc_username = ? WHERE acc_id = ?",
        [data.role, data.username, req.params.id]);
    }
    const [info] = await conn.query(
      "UPDATE information_Account SET acc_name = ?, acc_surname = ?, acc_email = ?, acc_picture_link = ? WHERE acc_id = ?",
      [data.firstname, data.lastname, data.email, newFile || exist[0].acc_picture_link, req.params.id]
    );
    if (info.affectedRows === 0) {
      await conn.query(
        "INSERT INTO information_Account (acc_email, acc_name, acc_surname, acc_picture_link, acc_id) VALUES (?, ?, ?, ?, ?)",
        [data.email, data.firstname, data.lastname, newFile, req.params.id]
      );
    }
    // อัปเดตชื่อเจ้าของในหนังสือให้ตรงกับ username ใหม่
    await conn.query("UPDATE book SET book_owner = ? WHERE acc_id = ?", [data.username, req.params.id]);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    removeUpload(newFile);
    if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ message: duplicateMessage(err) });
    throw err;
  } finally {
    conn.release();
  }
  if (newFile) removeUpload(exist[0].acc_picture_link);
  res.json({ message: "Account updated" });
}));

// ---------------------------------------------------------------
// ลบบัญชี (หนังสือ ประวัติ login และคำขอแลกของบัญชีนั้นจะถูกลบตามอัตโนมัติ) ลบบัญชีตัวเองไม่ได้
// Testing 1: method: delete  URL: http://localhost:3000/accounts/10
// Testing 2: method: delete  URL: http://localhost:3000/accounts/9
// ---------------------------------------------------------------
router.delete("/:id", asyncHandler(async (req, res) => {
  if (Number(req.params.id) === req.user.id) {
    return res.status(400).json({ message: "You cannot remove your own account" });
  }
  const [exist] = await db.query("SELECT acc_id FROM user_Account WHERE acc_id = ?", [req.params.id]);
  if (!exist.length) return res.status(404).json({ message: "Account not found" });

  // เก็บรายการไฟล์รูปไว้ลบหลังลบข้อมูลสำเร็จ
  const [pics] = await db.query(
    "SELECT book_lick_pic AS pic FROM book WHERE acc_id = ? UNION SELECT acc_picture_link FROM information_Account WHERE acc_id = ?",
    [req.params.id, req.params.id]
  );
  await db.query("DELETE FROM user_Account WHERE acc_id = ?", [req.params.id]);
  pics.forEach((p) => removeUpload(p.pic));
  res.json({ message: "Account removed" });
}));

module.exports = router;
