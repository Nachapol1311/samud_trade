# Samud Trade

เว็บแอปพลิเคชันสำหรับแลกเปลี่ยนหนังสือมือสอง (ITDS242 Web Technologies Lab, Section 1 Group 3)

UX/UI design: [Figma](https://www.figma.com/site/xTVThcl4ufSjm26Wln06Aw/samud-trade?node-id=0-1&t=lABmWiwHzc8Kair1-1)

## โครงสร้างโปรเจกต์

| โฟลเดอร์ / ไฟล์ | หน้าที่ | Port |
| --- | --- | --- |
| `sec1_gr3_fe_src/` | Front-end: หน้า HTML (`html/`, หน้าของผู้ดูแลระบบอยู่ใน `html/admin/`), CSS (`css/`), JavaScript ที่เรียก web service (`js/`), รูปภาพ (`pic/`) ส่งให้เบราว์เซอร์ผ่าน Express | **3030** |
| `sec1_gr3_ws_src/` | Back-end: Web service (Node.js + Express) ต่อฐานข้อมูล MySQL | **3000** |
| `sec1_gr3_database.sql` | ฐานข้อมูล MySQL (โครงสร้างตาราง + ข้อมูลตัวอย่าง) | 3306 |

ต้องรัน **3 ส่วนพร้อมกัน**: MySQL, web service (3000) และ front-end (3030)

## สิ่งที่ต้องติดตั้งก่อน

- [Node.js](https://nodejs.org) เวอร์ชัน 18 ขึ้นไป (ตรวจสอบด้วย `node -v`)
- MySQL 8 หรือ MariaDB (แนะนำ [XAMPP](https://www.apachefriends.org) เพราะมี MySQL และ phpMyAdmin มาให้)
- (ถ้าจะทดสอบ web service) [Postman](https://www.postman.com)

## ขั้นตอนที่ 1: สร้างฐานข้อมูล

เลือกวิธีใดวิธีหนึ่ง

**วิธี A: phpMyAdmin (XAMPP)**
1. เปิด XAMPP Control Panel แล้วกด Start ที่ MySQL (และ Apache)
2. เปิด http://localhost/phpmyadmin
3. เลือกแท็บ **Import** > Choose File > เลือก `sec1_gr3_database.sql` > กด Import

**วิธี B: MySQL Workbench**
1. ต่อเข้า local instance
2. เลือก **File > Open SQL Script...** เลือก `sec1_gr3_database.sql`
3. กดไอคอนสายฟ้า (Run)

**วิธี C: คำสั่ง (Command Prompt / Terminal)**
```
mysql -u root -p < sec1_gr3_database.sql
```
(ถ้า Windows หาคำสั่ง `mysql` ไม่เจอ ให้ใส่ path เต็ม เช่น `C:\xampp\mysql\bin\mysql.exe`)

ไฟล์ SQL จะสร้างฐานข้อมูล `samud_trade` ให้เอง ไม่ต้องสร้างล่วงหน้า

## ขั้นตอนที่ 2: รัน Web service (back-end)

```
cd sec1_gr3_ws_src
npm install
```

สร้างไฟล์ `.env` จากไฟล์ตัวอย่าง แล้วแก้ค่าให้ตรงกับ MySQL ของเครื่องคุณ

```
copy .env.example .env      (Windows)
cp .env.example .env        (Mac / Linux)
```

ค่าสำคัญใน `.env`

| ตัวแปร | ความหมาย | ตัวอย่าง |
| --- | --- | --- |
| `DB_HOST` / `DB_PORT` | ที่อยู่ MySQL | `localhost` / `3306` |
| `DB_USER` | ชื่อผู้ใช้ MySQL | `root` |
| `DB_PASSWORD` | รหัสผ่าน MySQL (XAMPP ให้เว้นว่าง) | |
| `DB_NAME` | ชื่อฐานข้อมูล | `samud_trade` |
| `PORT` | port ของ web service | `3000` |
| `COOKIE_SECRET` | ข้อความสุ่มสำหรับเซ็น cookie login | ตั้งเอง |
| `FRONTEND_ORIGIN` | origin ของ front-end ที่อนุญาต (CORS) | `http://localhost:3030` |

จากนั้นรัน

```
npm start
```

ตรวจสอบว่าทำงาน
- http://localhost:3000/health ต้องได้ `{"status":"ok", ...}`
- http://localhost:3000/health/db ต้องได้ `{"status":"ok","database":"connected"}`

## ขั้นตอนที่ 3: รัน Front-end

เปิดเทอร์มินัลอีกหน้าต่าง (ปล่อย web service ให้รันค้างไว้)

```
cd sec1_gr3_fe_src
npm install
npm start
```

เปิดเบราว์เซอร์ที่ **http://localhost:3030**

> ต้องเข้าผ่านพอร์ต 3030 (หรือ `127.0.0.1:3030`) เพราะ web service อนุญาต CORS เฉพาะ origin นี้
> ถ้าเปลี่ยน port ของ web service ต้องแก้ `WS_URL` ใน `sec1_gr3_fe_src/js/api.js` ด้วย

## บัญชีสำหรับทดลองใช้

| Role | Username | Password |
| --- | --- | --- |
| admin | `admin_aomsin` | `Admin@1234` |
| admin | `admin_dada` | `Admin@1234` |
| user | `kim`, `chai`, `mai`, `north`, `fang`, `bebe`, `gun`, `job` | `User@1234` |

## หน้าเว็บหลัก

| Path | หน้า |
| --- | --- |
| `/home`, `/search`, `/detail-item`, `/team` | หน้าหลัก, ค้นหาหนังสือ, รายละเอียด, About us |
| `/login` | เข้าสู่ระบบ (admin และ user) |
| `/my-item`, `/add-item`, `/edit-item` | จัดการหนังสือของตัวเอง |
| `/match`, `/select-book`, `/trade`, `/wait` | ขอแลกหนังสือและติดตามสถานะ |
| `/admin-home`, `/admin-management` | หน้าหลักและเมนูจัดการของผู้ดูแลระบบ |
| `/product-manage`, `/admin-product-add` | ผู้ดูแล: ค้นหา / เพิ่ม / แก้ไข / ลบหนังสือ |
| `/user-manage`, `/admin-user-add`, `/edit-user` | ผู้ดูแล: ค้นหา / เพิ่ม / แก้ไข / ลบบัญชีผู้ใช้ |

## Web service ของเรา (Back-end API)

Base URL: `http://localhost:3000` (ตัวอย่างข้อมูลสำหรับทดสอบด้วย Postman อยู่ในคอมเมนต์ `Testing` เหนือแต่ละ route ในโฟลเดอร์ `routes/`)

| ไฟล์ | Method และ path | หน้าที่ | สิทธิ์ |
| --- | --- | --- | --- |
| `routes/auth.js` | `POST /auth/login`, `POST /auth/logout` | เข้า / ออกจากระบบ (Authentication) | ทุกคน |
| | `GET /auth/me`, `PUT /auth/me` | ดู / แก้ไขโปรไฟล์ตัวเอง | ต้อง login |
| `routes/books.js` | `GET /books` | ค้นหาหนังสือ (ไม่ใส่เกณฑ์ = ทั้งหมด; เกณฑ์: `name`, `category`, `min`/`max`, `condition`) | ทุกคน |
| | `GET /books/:id`, `GET /books/mine`, `GET /books/next` | ดูรายละเอียด / หนังสือของตัวเอง / เล่มถัดไปสำหรับ match | ต้อง login (ยกเว้น `/:id`) |
| | `POST /books`, `PUT /books/:id`, `DELETE /books/:id` | เพิ่ม / แก้ไข / ลบหนังสือ | ต้อง login |
| `routes/accounts.js` | `GET /accounts`, `GET /accounts/:id` | ค้นหา / ดูบัญชีผู้ใช้ (ไม่ใส่เกณฑ์ = ทั้งหมด; เกณฑ์: `username`, `name`, `email`, `role` ใช้ร่วมกันได้; `keyword` ค้นข้ามทุกช่อง) | admin |
| | `POST /accounts`, `PUT /accounts/:id`, `DELETE /accounts/:id` | เพิ่ม / แก้ไข / ลบบัญชี | admin |
| `routes/trades.js` | `POST /trades`, `GET /trades/incoming`, `GET /trades/outgoing` | ส่งคำขอแลก / ดูคำขอที่ได้รับและที่ส่งไป | ต้อง login |
| | `POST /trades/:id/accept`, `/decline`, `/cancel` | ตอบรับ / ปฏิเสธ / ยกเลิกคำขอแลก | ต้อง login |

## Public web service ที่เชื่อมต่อ: Open Library

หน้า **Add New Book** (`/add-item`) และ **admin-product-add** (`/admin-product-add`) เชื่อมต่อกับ
[Open Library Search API](https://openlibrary.org/dev/docs/api/search) (ไม่ต้องใช้ API key)

วิธีใช้
1. พิมพ์ชื่อหนังสือในช่อง **Book** แล้วกด **Search Open Library**
2. เลือกเล่มที่ต้องการจากรายการผลลัพธ์ (ปก / ชื่อ / ผู้แต่ง / ปีที่พิมพ์)
3. ระบบเติมชื่อหนังสือ รายละเอียด (ผู้แต่ง ปีที่พิมพ์ และแหล่งที่มา) หมวดหมู่ และรูปปกให้อัตโนมัติ
4. กรอกราคากับสภาพหนังสือ แล้วกด Add

โค้ดอยู่ที่ `sec1_gr3_fe_src/js/openlibrary.js` ต้องต่ออินเทอร์เน็ตตอนใช้งานฟีเจอร์นี้
ถ้าเชื่อมต่อ Open Library ไม่ได้ ยังกรอกฟอร์มเองตามปกติได้

แหล่งข้อมูลและรูปปกจาก [Open Library](https://openlibrary.org) (Internet Archive)

## ปัญหาที่พบบ่อย

| อาการ | วิธีแก้ |
| --- | --- |
| `'mysql' is not recognized` | ใช้ phpMyAdmin / Workbench แทน หรือเรียก `mysql.exe` ด้วย path เต็ม |
| `/health/db` ขึ้น error | เช็ค `DB_USER` / `DB_PASSWORD` ใน `.env` และเปิด MySQL แล้วหรือยัง |
| `Cannot find module 'express'` | ยังไม่ได้รัน `npm install` ในโฟลเดอร์นั้น |
| หน้าเว็บขึ้นแต่ login ไม่ได้ / `Cannot connect to the web service` | web service (port 3000) ยังไม่ได้รันหรือล้ม ดูข้อความในเทอร์มินัลของ web service |
| `EADDRINUSE` (port ถูกใช้อยู่) | ปิดโปรแกรมที่ใช้ port นั้น หรือตั้ง `PORT` ใหม่ (ถ้าเปลี่ยน port 3000 ต้องแก้ `WS_URL` ใน `api.js` ด้วย) |
| รูปหนังสือ / โปรไฟล์ไม่ขึ้น | ตรวจว่ามีโฟลเดอร์ `sec1_gr3_ws_src/uploads/` และ web service รันอยู่ |

## ข้อความเปิดเผยการใช้เทคโนโลยีปัญญาประดิษฐ์

> **กลุ่มต้องกรอกส่วนนี้เองให้ตรงกับความจริง** (เอกสารโครงงานกำหนดให้เปิดเผยหากมีการใช้ Generative AI)

กลุ่มของข้าพเจ้าขอรับรองว่าได้มีการใช้เทคโนโลยี Generative AI ในการจัดทำชิ้นงานนี้ โดยนำเครื่องมือ Generative AI (______, ______) มาใช้เพื่อวัตถุประสงค์ดังต่อไปนี้:

- [ ] ระดมความคิด
- [ ] ร่างชิ้นงานเบื้องต้น
- [ ] ตรวจสอบและแก้ไขภาษา ไวยากรณ์หรือการแปล
- [ ] สรุปและถอดความเนื้อหา
- [ ] แก้ไขและตรวจสอบโค้ด
- [ ] เขียนโค้ด
- [ ] ใช้ AI เป็นส่วนหนึ่งในผลงาน
- [ ] อื่น ๆ (โปรดระบุ): ______
