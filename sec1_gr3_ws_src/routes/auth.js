// ===== เว็บเซอร์วิสสำหรับการพิสูจน์ตัวตน (Authentication) และโปรไฟล์ =====
const express = require("express");
const db = require("../db");
const upload = require("../upload");
const { setSessionCookie, clearSessionCookie, readSession, requireLogin } = require("../auth");
const { asyncHandler, removeUpload } = require("../util");

const router = express.Router();

// ---------------------------------------------------------------
// Login: ตรวจ username/password แล้วตั้ง cookie (valid)
// Testing 1: admin login (Postman จะเก็บ cookie ให้อัตโนมัติ)
// method: POST
// URL: http://localhost:3000/auth/login
// body: raw JSON
// {
//   "username": "admin_aomsin",
//   "password": "Admin@1234"
// }
// Expected: 200 OK
// Result: { "role": "admin", "redirect": "/admin-home" }
// ---------------------------------------------------------------
// Login: ตรวจ username/password (Invalid)
// Testing 1: admin login 
// method: POST
// URL: http://localhost:3000/auth/login
// Body: raw
// {
//     "username" : "admin_aomsin",
//     "password" : "error"
// }
// Expected: 401 Unauthorized
// Result: 
// {
//     "message": "Invalid username or password"
// }
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
// Testing 1: logout หลังจาก login สำเร็จ
// method: POST
// URL: http://localhost:3000/auth/logout
// body: none
// Expected: 200 OK
// Result: { "message": "Logged out" }
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
// ดูข้อมูลบัญชีที่ login อยู่ (หน้า profile / admin-profile)
// Testing 1: ดูข้อมูลบัญชี admin_aomsin หลัง login
// method: GET
// URL: http://localhost:3000/auth/me
// Expected: 200 OK
// Result: แสดงข้อมูลบัญชี เช่น id, role, username,
//         firstname, lastname, email และ picture
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
// แก้ไขโปรไฟล์ตัวเอง (ต้อง login ก่อน)
// Testing 1: แก้ไขข้อมูลโปรไฟล์
// method: PUT
// URL: http://localhost:3000/auth/me
// body: raw JSON
// {
//     "id": 1,
//     "role": "admin",
//     "username": "admin_aomsin_update",
//     "firstname": "yo",
//     "lastname": "pin",
//     "email": "aomsinn@samudtrade.com",
//     "picture": "/uploads/1795293750751-7d64cc71.jpg"
// }
// Expected: 200 OK
// Result: { "message": "Profile updated" }
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
