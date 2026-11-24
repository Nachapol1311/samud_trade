CREATE DATABASE IF NOT EXISTS samud_trade
  DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE samud_trade;

-- ---------- ตาราง ----------
CREATE TABLE IF NOT EXISTS user_Account (
  acc_id INT NOT NULL AUTO_INCREMENT,
  acc_role VARCHAR(20) NOT NULL,           -- 'admin' หรือ 'user'
  acc_username VARCHAR(20) NOT NULL,
  acc_passwd VARCHAR(100) NOT NULL,        -- เก็บเป็น hash ไม่เก็บรหัสจริง

  CONSTRAINT acc_pk PRIMARY KEY (acc_id),
  CONSTRAINT acc_username_uq UNIQUE (acc_username)
);

CREATE TABLE IF NOT EXISTS information_Account (
  acc_email VARCHAR(100) NOT NULL,
  acc_name VARCHAR(20) NOT NULL,
  acc_surname VARCHAR(20) NOT NULL,        -- แก้จากเดิมที่ acc_name ซ้ำสองคอลัมน์
  acc_picture_link VARCHAR(100) NULL,
  acc_id INT NOT NULL,

  CONSTRAINT information_Account_pk PRIMARY KEY (acc_email),
  CONSTRAINT information_Account_fk FOREIGN KEY (acc_id) REFERENCES user_Account(acc_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS book (
  book_id INT NOT NULL AUTO_INCREMENT,
  book_name VARCHAR(100) NOT NULL,
  book_cat VARCHAR(20) NOT NULL,           -- ใช้ค่าเดียวกับ option ในหน้า search เช่น programming, sci-fi
  book_price INT NOT NULL,
  book_detail VARCHAR(255) NOT NULL,
  book_condition INT NOT NULL,             -- 1-5 ดาว
  book_owner VARCHAR(100) NULL,
  book_lick_pic VARCHAR(255) NULL,
  acc_id INT NOT NULL,

  CONSTRAINT book_pk PRIMARY KEY (book_id),
  CONSTRAINT book_fk FOREIGN KEY (acc_id) REFERENCES user_Account(acc_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS login_log (
  login_log_id INT NOT NULL AUTO_INCREMENT,
  login_status VARCHAR(20) NOT NULL,
  login_datetime DATETIME NOT NULL,
  logout_datetime DATETIME NULL,           -- แก้เป็น NULL ได้ เพราะตอน login ยังไม่มีเวลา logout
  acc_id INT NOT NULL,

  CONSTRAINT login_log_pk PRIMARY KEY (login_log_id),
  CONSTRAINT login_log_fk FOREIGN KEY (acc_id) REFERENCES user_Account(acc_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS manage_admin_book (
  acc_id INT NOT NULL,
  book_id INT NOT NULL,
  operating VARCHAR(20) NOT NULL,
  managed_book_datetime DATETIME NULL,

  CONSTRAINT manage_admin_book_pk PRIMARY KEY (acc_id, book_id),
  CONSTRAINT manage_admin_book_fk1 FOREIGN KEY (acc_id) REFERENCES user_Account(acc_id) ON DELETE CASCADE,
  CONSTRAINT manage_admin_book_fk2 FOREIGN KEY (book_id) REFERENCES book(book_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS manage_admin_account (
  acc_id INT NOT NULL,
  super_acc_id INT NOT NULL,
  managed_acc_datetime DATETIME NULL,

  CONSTRAINT manage_admin_account_pk PRIMARY KEY (acc_id, super_acc_id),
  CONSTRAINT manage_admin_account_fk1 FOREIGN KEY (acc_id) REFERENCES user_Account(acc_id) ON DELETE CASCADE,
  CONSTRAINT manage_admin_account_fk2 FOREIGN KEY (super_acc_id) REFERENCES user_Account(acc_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS trade_request (
  trade_id INT NOT NULL AUTO_INCREMENT,
  requester_acc_id INT NOT NULL,           -- คนที่ขอแลก (เห็นในหน้า wait)
  owner_acc_id INT NOT NULL,               -- เจ้าของหนังสือที่ถูกขอแลก (เห็นในหน้า match)
  offer_book_id INT NOT NULL,              -- หนังสือของคนขอแลก
  want_book_id INT NOT NULL,               -- หนังสือของเจ้าของที่อยากได้
  trade_status VARCHAR(20) NOT NULL DEFAULT 'pending',   -- pending / accepted / declined / cancelled
  created_datetime DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  responded_datetime DATETIME NULL,

  CONSTRAINT trade_request_pk PRIMARY KEY (trade_id),
  CONSTRAINT trade_request_fk1 FOREIGN KEY (requester_acc_id) REFERENCES user_Account(acc_id) ON DELETE CASCADE,
  CONSTRAINT trade_request_fk2 FOREIGN KEY (owner_acc_id) REFERENCES user_Account(acc_id) ON DELETE CASCADE,
  CONSTRAINT trade_request_fk3 FOREIGN KEY (offer_book_id) REFERENCES book(book_id) ON DELETE CASCADE,
  CONSTRAINT trade_request_fk4 FOREIGN KEY (want_book_id) REFERENCES book(book_id) ON DELETE CASCADE
);

-- ---------- ข้อมูลจำลอง: account (10) ----------
INSERT INTO user_Account (acc_id, acc_role, acc_username, acc_passwd) VALUES
  (01, 'admin', 'admin_aomsin', SHA2('Admin@1234', 256)),
  (02, 'admin', 'admin_dada', SHA2('Admin@1234', 256)),
  (03, 'user', 'kim', SHA2('User@1234', 256)),
  (04, 'user', 'chai', SHA2('User@1234', 256)),
  (05, 'user', 'mai', SHA2('User@1234', 256)),
  (06, 'user', 'north', SHA2('User@1234', 256)),
  (07, 'user', 'fang', SHA2('User@1234', 256)),
  (08, 'user', 'bebe', SHA2('User@1234', 256)),
  (09, 'user', 'gun', SHA2('User@1234', 256)),
  (10, 'user', 'job', SHA2('User@1234', 256));

INSERT INTO information_Account (acc_email, acc_name, acc_surname, acc_picture_link, acc_id) VALUES
  ('aomsinn@samudtrade.com', 'polly', 'pin', '/uploads/acc01.jpg', 01),
  ('dada@samudtrade.com', 'patta', 'pong', '/uploads/acc02.jpg', 02),
  ('kim@gmail.com', 'nutty', 'kong', '/uploads/acc03.jpg', 03),
  ('chai@gmail.com', 'chaiyaaa', 'naja', '/uploads/acc04.jpg', 04),
  ('mai@gmail.com', 'suksog', 'yunee', '/uploads/acc05.jpg', 05),
  ('north@hotmail.com', 'Napat', 'Phanit', '/uploads/acc06.jpg', 06),
  ('fang@gmail.com', 'monny', 'Sirikul', '/uploads/acc07.jpg', 07),
  ('bebe@gmail.com', 'bebabe', 'Kaewmanee', '/uploads/acc08.jpg', 08),
  ('gun@gmail.com', 'gunt', 'Thongdee', '/uploads/acc09.jpg', 09),
  ('job@gmail.com', 'tana', 'Lertwit', '/uploads/acc10.jpg', 10);

-- ---------- ข้อมูลจำลอง: book (5 เล่ม x 10 account = 50) ----------
INSERT INTO book (book_id, book_name, book_cat, book_price, book_detail, book_condition, book_owner, book_lick_pic, acc_id) VALUES
  (1, 'one piece v59', 'comic', 0, 'เพื่อนซื้อมาฝากจากญี่ปุ่น ยังไม่ได้เอาออกจากแพ็ค สภาพดีเยี่ยมพร้อมเก็บสะสม', 5, 'admin_aomsin', '/uploads/b01.jpg', 01),
  (2, "เมื่อเราเริ่มมองหา 'ความหมาย'", 'other', 395, 'รอยยับนิดหน่อย เนื้อหาดี', 4, 'admin_aomsin', '/uploads/b02.jpg', 01),
  (3, 'ภาพปริศนา 3', 'manga', 195, 'สภาพผ่านการใช้งาน อ่านสนุกลุ้นไปกับตัวละคร', 3, 'admin_aomsin', '/uploads/b03.jpg', 01),
  (4, 'วันพีซ vol.114', 'manga', 85, 'หน้าแกมีรอยยับ ผ่านการใช้งานจริง สนุกคู่ควรแก่การอ่าน', 2, 'admin_aomsin', '/uploads/b04.jpg', 01),
  (5, 'คากุบาราจิ 06', 'manga', 115, 'มีรอยเปียกน้ำ', 1, 'admin_aomsin', '/uploads/b05.jpg', 01),

  (6, 'BUILBING your MONEY MACHINE', 'business', 350, 'ปกบวมน้ำ', 1, 'admin_dada', '/uploads/b06.jpg', 02),
  (7, 'THE ONE%', 'finance', 249, 'สภาพดี หน้าปกมีรอยขีดข่วนเล็กน้อย', 4, 'admin_dada', '/uploads/b07.jpg', 02),
  (8, 'THE HUNGER GAMES III', 'novel', 295, 'เหลืองขอบเลอะ', 3, 'admin_dada', '/uploads/b08.jpg', 02),
  (9, 'กลิ่นดอกไม้ราตรี', 'novel', 229, 'สภาพดี', 5, 'admin_dada', '/uploads/b09.jpg', 02),
  (10, 'THE HUNGER GAMES I', 'novel', 245, 'ปกเปิกมุมงอ', 2, 'admin_dada', '/uploads/b10.jpg', 02),

  (11, 'THE HUNGER GAMES II', 'fantasy', 295, 'ขอบเหลือง มีรอยขีดข่วนเล็กน้อย', 4, 'kim', '/uploads/b11.jpg', 03),
  (12, 'BETTER THAN THE MOVIE', 'romance', 477, 'หนังสืองอ ปกงอ มีรสนิดหน่อยไม่เยอะมาก', 3, 'kim', '/uploads/b12.jpg', 03),
  (13, 'aboutTime', 'romance', 199, 'มุมงอ ที่เหลือโอเคหมด', 5, 'kim', '/uploads/b13.jpg', 03),
  (14, 'เป็นนางร้ายมันเสี่ยงเลยลองเลี้ยงลาสต์บอสดูสักตั้ง 3', 'manga', 165, 'หนังสืองอ', 4, 'kim', '/uploads/b14.jpg', 03),
  (15, 'เป็นนางร้ายมันเสี่ยงเลยลองเลี้ยงลาสต์บอสดูสักตั้ง 1', 'manga', 165, 'หนังสืองอและมีรอยยับนิดนึง', 4, 'kim', '/uploads/b15.jpg', 03),

  (16, 'The Millionaire Fastlane',  'self-help',  395,  'Good condition',     5,  'chai',   '/uploads/b16.jpg',  04),
  (17, 'Four Thousand weeks',       'self-help',  265,  'Good condition',     4,  'chai',   '/uploads/b17.jpg',  04),
  (18, 'The Psychology of Money',   'self-help',  312,  'Good condition',     4,  'chai',   '/uploads/b18.jpg',  04),
  (19, 'Atomic Habits',             'self-help',  435,  'Fair condition',     3,  'chai',   '/uploads/b19.jpg',  04),
  (20, 'Manifest',                  'self-help',  265,  'Slightly Damaged',   2,  'chai',   '/uploads/b20.jpg',  04),

  (21, 'เดนดาว NEVERDIE', 'novel', 380, 'หนังสืองอ ขอบขาดนิดหน่อย', 4, 'mai', '/uploads/b21.jpg', 05),
  (22, 'ละครสัตว์รัตติกาล NIGHT CIRCUS', 'fantasy', 315, 'หนังสือมีรอยเลอะน้ำและปกมีรอยขีดข่วน', 2, 'mai', '/uploads/b22.jpg', 05),
  (23, 'Skip and Loafer 2', 'manga', 150, 'สภาพดีมาก ไม่มีรอยอะไรเลย', 5, 'mai', '/uploads/b23.jpg', 05),
  (24, 'กลิ่นแดดไอทะเลและลาดไหล่สีคาราเมล', 'novel', 200, 'สภาพดีมาก ไม่มีรอยขีดข่วน', 5, 'mai', '/uploads/b24.jpg', 05),
  (25, 'Her เธอคนที่ 1440', 'novel', 185, 'สภาพดีมาก', 5, 'mai', '/uploads/b25.jpg', 05),

  (26, 'Murder on Orient', 'mystery', 160, 'Agatha Christie. Paperback with clean pages.', 4, 'north', '/uploads/b26.jpg', 06),
  (27, 'Sherlock Holmes', 'mystery', 240, 'Complete short stories, thick edition. Spine worn.', 3, 'north', '/uploads/b27.jpg', 06),
  (28, 'Gone Girl', 'thriller', 190, 'Gillian Flynn. Read once.', 4, 'north', '/uploads/b28.jpg', 06),
  (29, 'The Da Vinci Code', 'thriller', 180, 'Dan Brown. Cover peeling slightly.', 3, 'north', '/uploads/b29.jpg', 06),
  (30, 'The Silent Patient', 'thriller', 210, 'Alex Michaelides. Like new.', 5, 'north', '/uploads/b30.jpg', 06),

  (31, 'Salt Fat Acid Heat', 'cooking', 550, 'Samin Nosrat. Hardcover, no kitchen stains.', 5, 'fang', '/uploads/b31.jpg', 07),
  (32, 'Thai Street Food', 'cooking', 420, 'David Thompson. Colour photos, minor shelf wear.', 4, 'fang', '/uploads/b32.jpg', 07),
  (33, 'Bento Box Basics', 'cooking', 260, 'Japanese lunch recipes. Some pages dog-eared.', 3, 'fang', '/uploads/b33.jpg', 07),
  (34, 'Mindful Eating', 'health', 230, 'Guide to healthy eating habits. Clean copy.', 4, 'fang', '/uploads/b34.jpg', 07),
  (35, 'Why We Sleep', 'health', 290, 'Matthew Walker. Brand new condition.', 5, 'fang', '/uploads/b35.jpg', 07),

  (36, 'One Piece Vol.1', 'manga', 120, 'English edition, Romance Dawn. Good condition.', 4, 'bebe', '/uploads/b36.jpg', 08),
  (37, 'One Piece Vol.2', 'manga', 120, 'English edition. Small crease on cover.', 4, 'bebe', '/uploads/b37.jpg', 08),
  (38, 'Naruto Vol.1', 'manga', 110, 'English edition. Pages slightly yellowed.', 3, 'bebe', '/uploads/b38.jpg', 08),
  (39, 'Attack on Titan 1', 'manga', 130, 'English edition. Practically new.', 5, 'bebe', '/uploads/b39.jpg', 08),
  (40, 'Slam Dunk Vol.1', 'comic', 150, 'Thai edition. Cover has light scratches.', 3, 'bebe', '/uploads/b40.jpg', 08),

  (41, 'English Grammar Use', 'language', 320, 'Raymond Murphy. A few exercises filled in pencil.', 4, 'gun', '/uploads/b41.jpg', 09),
  (42, 'TOEIC Prep 2024', 'exam-prep', 350, 'Unused, includes practice tests.', 5, 'gun', '/uploads/b42.jpg', 09),
  (43, 'IELTS Cambridge 16', 'exam-prep', 380, 'Practice tests unused, audio code intact.', 4, 'gun', '/uploads/b43.jpg', 09),
  (44, 'Japanese N5 Kanji', 'language', 240, 'Kanji workbook, half completed in pencil.', 3, 'gun', '/uploads/b44.jpg', 09),
  (45, 'Korean for Beginner', 'language', 260, 'Textbook with workbook, good condition.', 4, 'gun', '/uploads/b45.jpg', 09),

  (46, 'Spirited Away Art', 'art-design', 650, 'Art book, hardcover. Kept in plastic cover.', 5, 'job', '/uploads/b46.jpg', 10),
  (47, 'Don''t Make Me Think', 'technology', 330, 'Steve Krug on web usability. Clean.', 4, 'job', '/uploads/b47.jpg', 10),
  (48, 'The Design of Every', 'art-design', 360, 'Don Norman. Corners slightly bent.', 3, 'job', '/uploads/b48.jpg', 10),
  (49, 'Lonely Planet Japan', 'travel', 290, 'Travel guide, 2022 edition. Some pages marked.', 3, 'job', '/uploads/b49.jpg', 10),
  (50, 'Into the Wild', 'biography', 170, 'Jon Krakauer. Good paperback.', 4, 'job', '/uploads/b50.jpg', 10);

-- ---------- ข้อมูลจำลอง: คำขอแลกเปลี่ยน ----------
-- account 3 (somchai) จะมี 2 คำขอเข้า (หน้า match) และส่งคำขอออก 2 รายการ (หน้า wait)
INSERT INTO trade_request (trade_id, requester_acc_id, owner_acc_id, offer_book_id, want_book_id, trade_status) VALUES
  (1, 4, 3, 16, 11, 'pending'),
  (2, 5, 3, 21, 12, 'pending'),
  (3, 3, 6, 13, 26, 'pending'),
  (4, 3, 7, 15, 31, 'pending');

-- ตรวจสอบ: SELECT acc_id, COUNT(*) FROM book GROUP BY acc_id;  (ควรได้ account ละ 5 เล่ม)
