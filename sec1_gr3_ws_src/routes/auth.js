// ===== เว็บเซอร์วิสสำหรับการพิสูจน์ตัวตน (Authentication) และโปรไฟล์ =====
const express = require("express");
const db = require("../db");
const upload = require("../upload");
const { setSessionCookie, clearSessionCookie, readSession, requireLogin } = require("../auth");
const { asyncHandler, removeUpload } = require("../util");

const router = express.Router();

// ---------------------------------------------------------------
// Login: ตรวจ username/password แล้วตั้ง cookie
// Testing 1: admin login (Postman จะเก็บ cookie ให้อัตโนมัติ)
// method: post
// URL: http://localhost:3000/auth/login
// body: raw JSON
// { "username": "admin_ploy", "password": "Admin@1234" }
// -> { "role": "admin", "redirect": "/admin-home" }
//
// Testing 2: user login
// method: post
// URL: http://localhost:3000/auth/login
// body: raw JSON
// { "username": "somchai", "password": "User@1234" }
// -> { "role": "user", "redirect": "/home" }
// ---------------------------------------------------------------
router.post("/login", asyncHandler(async (req, res) => {
  const username = String(req.body.username || "").trim();
  const password = String(req.body.password || "");
  if (!username || !password) return res.status(400).json({ message: "Username and password are required" });

  const [rows] = await db.query(
    "SELECT acc_id, acc_role FROM user_Account WHERE acc_username = ? AND acc_passwd = SHA2(?, 256)",
    [username, password]
  );
  if (!rows.length) return res.status(401).json({ message: "Invalid username or password" });

  const user = rows[0];
  // บันทึกประวัติการเข้าสู่ระบบ
  const [log] = await db.query(
    "INSERT INTO login_log (login_status, login_datetime, acc_id) VALUES ('success', NOW(), ?)",
    [user.acc_id]
  );
  setSessionCookie(res, user.acc_id, log.insertId);
  res.json({ role: user.acc_role, redirect: user.acc_role === "admin" ? "/admin-home" : "/home" });
}));

// ---------------------------------------------------------------
// Logout: ลบ cookie และบันทึกเวลาออกจากระบบ
// Testing 1 / 2 (ต้อง login ก่อน 1 ครั้ง)
// method: post
// URL: http://localhost:3000/auth/logout
// body: none
// -> { "message": "Logged out" }
// ---------------------------------------------------------------
router.post("/logout", asyncHandler(async (req, res) => {
  const session = readSession(req);
  if (session && session.logId) {
    await db.query("UPDATE login_log SET logout_datetime = NOW() WHERE login_log_id = ? AND acc_id = ?", [
      session.logId,
      session.id,
    ]);
  }
  clearSessionCookie(res);
  res.json({ message: "Logged out" });
}));

// ---------------------------------------------------------------
// ดูข้อมูลบัญชีที่ login อยู่ (ใช้ในหน้า profile / admin-profile)
// Testing 1 / 2 (หลัง login ด้วย admin_ploy และ somchai)
// method: get
// URL: http://localhost:3000/auth/me
// -> { "id": 3, "role": "user", "username": "somchai", "firstname": "Somchai", ... }
// ---------------------------------------------------------------
router.get("/me", requireLogin, asyncHandler(async (req, res) => {
  const [rows] = await db.query(
    `SELECT u.acc_id AS id, u.acc_role AS role, u.acc_username AS username,
            i.acc_name AS firstname, i.acc_surname AS lastname,
            i.acc_email AS email, i.acc_picture_link AS picture
     FROM user_Account u LEFT JOIN information_Account i ON i.acc_id = u.acc_id
     WHERE u.acc_id = ?`,
    [req.user.id]
  );
  res.json(rows[0]);
}));

// ---------------------------------------------------------------
// แก้ไขโปรไฟล์ตัวเอง (ชื่อ นามสกุล อีเมล และรูปโปรไฟล์)
// Testing 1: เปลี่ยนชื่อ
// method: put
// URL: http://localhost:3000/auth/me
// body: raw JSON
// { "firstname": "Ploy", "lastname": "Suksan", "email": "ploy.suksan@samudtrade.com" }
//
// Testing 2: เปลี่ยนรูป
// method: put
// URL: http://localhost:3000/auth/me
// body: form-data  (image = ไฟล์รูป)
// ---------------------------------------------------------------
router.put("/me", requireLogin, upload.single("image"), asyncHandler(async (req, res) => {
  const [rows] = await db.query(
    "SELECT acc_name, acc_surname, acc_email, acc_picture_link FROM information_Account WHERE acc_id = ?",
    [req.user.id]
  );
  if (!rows.length) {
    if (req.file) removeUpload("/uploads/" + req.file.filename);
    return res.status(404).json({ message: "Profile not found" });
  }
  const old = rows[0];
  const firstname = String(req.body.firstname ?? old.acc_name).trim();
  const lastname = String(req.body.lastname ?? old.acc_surname).trim();
  const email = String(req.body.email ?? old.acc_email).trim();
  const picture = req.file ? "/uploads/" + req.file.filename : old.acc_picture_link;

  if (!firstname || !lastname || !/^\S+@\S+\.\S+$/.test(email) || firstname.length > 20 || lastname.length > 20) {
    if (req.file) removeUpload(picture);
    return res.status(400).json({ message: "Please enter a valid first name, last name (max 20 chars) and email" });
  }
  try {
    await db.query(
      "UPDATE information_Account SET acc_name = ?, acc_surname = ?, acc_email = ?, acc_picture_link = ? WHERE acc_id = ?",
      [firstname, lastname, email, picture, req.user.id]
    );
  } catch (err) {
    if (req.file) removeUpload(picture);
    if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "Email already exists" });
    throw err;
  }
  if (req.file) removeUpload(old.acc_picture_link); // ลบรูปเก่า
  res.json({ message: "Profile updated" });
}));

module.exports = router;
