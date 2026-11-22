// ============================================================
// Samud Trade - Front-end server
// หน้าที่: ส่งหน้า HTML / CSS / JS / รูปภาพ ให้เบราว์เซอร์
// ใช้ path สวย ๆ แทนชื่อไฟล์ เช่น /home แทน /home.html
// รัน: npm install แล้ว npm start  ->  http://localhost:3030
// ============================================================
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3030;

// ------------------------------------------------------------
// ตาราง path -> ไฟล์ HTML  (เพิ่มหน้าใหม่ให้เพิ่มที่นี่ที่เดียว)
// ------------------------------------------------------------
const pages = {
  // หน้า user
  "/home": "home.html",
  "/login": "login.html",
  "/search": "search.html",
  "/detail-item": "detailitem.html",
  "/trade": "trade.html",
  "/select-book": "select-book.html",
  "/my-item": "myitem.html",
  "/add-item": "additem.html",
  "/edit-item": "edititem.html",
  "/match": "match.html",
  "/wait": "wait.html",
  "/profile": "profile.html",
  "/team": "team.html",

  // หน้า admin (ไฟล์อยู่ใน html/admin/)
  "/admin-home": "admin/admin-home.html",
  "/admin-management": "admin/admin-management.html",
  "/admin-profile": "admin/admin-profile.html",
  "/admin-product-add": "admin/admin-product-add.html",
  "/admin-user-add": "admin/admin-user-add.html",
  "/product-manage": "admin/productmanage.html",
  "/user-manage": "admin/usermanage.html",
  "/edit-user": "admin/edituser.html",
};

const htmlDir = path.join(__dirname, "html");

// ไฟล์ static (HTML อ้างด้วย ../css/..., ../js/..., ../pic/... ซึ่งจะกลายเป็น /css/..., /js/..., /pic/...)
app.use("/css", express.static(path.join(__dirname, "css")));
// JavaScript ฝั่งเบราว์เซอร์ (เรียก web service ด้วย fetch) อยู่ในโฟลเดอร์ js/ ของ front-end นี้
app.use("/js", express.static(path.join(__dirname, "js")));
app.use("/pic", express.static(path.join(__dirname, "pic")));

// หน้าแรก -> /home
app.get("/", (req, res) => res.redirect("/home"));

// สร้าง route ให้ทุกหน้าจากตารางด้านบน
Object.entries(pages).forEach(([route, file]) => {
  app.get(route, (req, res) => res.sendFile(path.join(htmlDir, file)));
});

// ลิงก์เก่าแบบ /xxx.html -> redirect ไป path ใหม่
app.get("/:name.html", (req, res, next) => {
  const wanted = req.params.name.toLowerCase();
  const route = Object.keys(pages).find(
    (r) => path.basename(pages[r], ".html").toLowerCase() === wanted
  );
  return route ? res.redirect(301, route) : next();
});

// ไม่พบหน้า
app.use((req, res) => {
  res.status(404).send("404 - Page not found");
});

app.listen(PORT, () => {
  console.log(`Samud Trade front-end running at http://localhost:${PORT}`);
});
