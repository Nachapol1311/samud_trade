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
  ('kim@gmail.com', 'nutty', 'kong', '/uploads/acc02.jpg', 03),
  ('chai@gmail.com', 'chaiyaaa', 'naja', '/uploads/acc02.jpg', 04),
  ('mai@gmail.com', 'suksog', 'yunee', '/uploads/acc02.jpg', 05),
  ('north@hotmail.com', 'Napat', 'Phanit', '/uploads/acc02.jpg', 06),
  ('fang@gmail.com', 'monny', 'Sirikul', '/uploads/acc02.jpg', 07),
  ('bebe@gmail.com', 'bebabe', 'Kaewmanee', '/uploads/acc02.jpg', 08),
  ('gun@gmail.com', 'gunt', 'Thongdee', '/uploads/acc09.jpg', 09),
  ('job@gmail.com', 'tana', 'Lertwit', '/uploads/acc02.jpg', 10);

-- ---------- ข้อมูลจำลอง: book (5 เล่ม x 10 account = 50) ----------
INSERT INTO book (book_id, book_name, book_cat, book_price, book_detail, book_condition, book_owner, book_lick_pic, acc_id) VALUES
  (1, 'law', 'programming', 350, 'Handbook of agile software craftsmanship by Robert C. Martin. Light pencil marks in chapter 3.', 4, 'admin_ploy', '/uploads/acc01.jpeg', 01),
  (2, 'The Pragmatic Prog.', 'programming', 420, 'Almost new copy, read once. Great for junior developers.', 5, 'admin_ploy', '/uploads/acc01.jpg', 01),
  (3, 'Sapiens', 'history', 280, 'A brief history of humankind by Yuval Noah Harari. Cover has small scratches.', 4, 'admin_ploy', '/uploads/acc01.jpg', 01),
  (4, 'Atomic Habits', 'self-help', 250, 'Tiny changes, remarkable results. Like new, no highlights.', 5, 'admin_ploy', '/uploads/acc01.jpg', 01),
  (5, 'The Alchemist', 'novel', 150, 'Paulo Coelho classic. Yellowed pages but fully readable.', 3, 'admin_ploy', '/uploads/acc01.jpg', 01),
  (6, 'Introduction to Algo', 'textbook', 600, 'CLRS textbook, 3rd edition. Used for one semester, few highlights.', 4, 'admin_nat', '/uploads/acc01.jpg', 02),
  (7, 'Design Patterns', 'programming', 450, 'Gang of Four classic. Spine slightly worn.', 3, 'admin_nat', '/uploads/acc01.jpg', 02),
  (8, 'Thinking Fast & Slow', 'psychology', 300, 'Daniel Kahneman. Clean pages, small bend on back cover.', 4, 'admin_nat', '/uploads/acc01.jpg', 02),
  (9, 'Rich Dad Poor Dad', 'finance', 180, 'Robert Kiyosaki. Thai translation, some page folds.', 3, 'admin_nat', '/uploads/acc01.jpg', 02),
  (10, 'Zero to One', 'business', 260, 'Peter Thiel on startups. Brand new, bought twice by mistake.', 5, 'admin_nat', '/uploads/acc01.jpg', 02),
  (11, 'Harry Potter 1', 'fantasy', 200, 'Philosopher''s Stone, English paperback. Slight cover wear.', 4, 'somchai', '/uploads/acc01.jpg', 03),
  (12, 'Harry Potter 2', 'fantasy', 200, 'Chamber of Secrets, English paperback. Good condition.', 4, 'somchai', '/uploads/acc01.jpg', 03),
  (13, 'The Hobbit', 'fantasy', 220, 'J.R.R. Tolkien. Old edition, pages slightly yellow.', 3, 'somchai', '/uploads/acc01.jpg', 03),
  (14, 'Dune', 'sci-fi', 320, 'Frank Herbert, new edition with map. Read once.', 5, 'somchai', '/uploads/acc01.jpg', 03),
  (15, 'Ender''s Game', 'sci-fi', 190, 'Orson Scott Card. Clean copy, no writing inside.', 4, 'somchai', '/uploads/acc01.jpg', 03),
  (16, 'Pride & Prejudice', 'romance', 150, 'Jane Austen. Well-loved copy with soft cover.', 3, 'mali_reads', '/uploads/acc01.jpg', 04),
  (17, 'Me Before You', 'romance', 170, 'Jojo Moyes. Read once, no damage.', 4, 'mali_reads', '/uploads/acc01.jpg', 04),
  (18, 'Norwegian Wood', 'novel', 210, 'Haruki Murakami. English translation, good condition.', 4, 'mali_reads', '/uploads/acc01.jpg', 04),
  (19, 'Kafka on the Shore', 'novel', 230, 'Haruki Murakami. Some underlines in pencil.', 3, 'mali_reads', '/uploads/acc01.jpg', 04),
  (20, 'The Notebook', 'romance', 140, 'Nicholas Sparks. Cover creased, pages intact.', 2, 'mali_reads', '/uploads/acc01.jpg', 04),
  (21, 'JavaScript Good Part', 'programming', 280, 'Douglas Crockford. Compact and clean.', 4, 'krit_dev', '/uploads/acc01.jpg', 05),
  (22, 'You Don''t Know JS', 'programming', 300, 'Kyle Simpson, Up & Going. Light wear on corners.', 4, 'krit_dev', '/uploads/acc01.jpg', 05),
  (23, 'Python Crash Course', 'programming', 420, 'Eric Matthes, 2nd edition. Practically unused.', 5, 'krit_dev', '/uploads/acc01.jpg', 05),
  (24, 'Refactoring', 'programming', 480, 'Martin Fowler. Some highlights in first half.', 3, 'krit_dev', '/uploads/acc01.jpg', 05),
  (25, 'The Phoenix Project', 'technology', 270, 'Novel about IT and DevOps. Good condition.', 4, 'krit_dev', '/uploads/acc01.jpg', 05),
  (26, 'Murder on Orient', 'mystery', 160, 'Agatha Christie. Paperback with clean pages.', 4, 'napat', '/uploads/acc01.jpg', 06),
  (27, 'Sherlock Holmes', 'mystery', 240, 'Complete short stories, thick edition. Spine worn.', 3, 'napat', '/uploads/acc01.jpg', 06),
  (28, 'Gone Girl', 'thriller', 190, 'Gillian Flynn. Read once.', 4, 'napat', '/uploads/acc01.jpg', 06),
  (29, 'The Da Vinci Code', 'thriller', 180, 'Dan Brown. Cover peeling slightly.', 3, 'napat', '/uploads/acc01.jpg', 06),
  (30, 'The Silent Patient', 'thriller', 210, 'Alex Michaelides. Like new.', 5, 'napat', '/uploads/acc01.jpg', 06),
  (31, 'Salt Fat Acid Heat', 'cooking', 550, 'Samin Nosrat. Hardcover, no kitchen stains.', 5, 'june_book', '/uploads/acc01.jpg', 07),
  (32, 'Thai Street Food', 'cooking', 420, 'David Thompson. Colour photos, minor shelf wear.', 4, 'june_book', '/uploads/acc01.jpg', 07),
  (33, 'Bento Box Basics', 'cooking', 260, 'Japanese lunch recipes. Some pages dog-eared.', 3, 'june_book', '/uploads/acc01.jpg', 07),
  (34, 'Mindful Eating', 'health', 230, 'Guide to healthy eating habits. Clean copy.', 4, 'june_book', '/uploads/acc01.jpg', 07),
  (35, 'Why We Sleep', 'health', 290, 'Matthew Walker. Brand new condition.', 5, 'june_book', '/uploads/acc01.jpg', 07),
  (36, 'One Piece Vol.1', 'manga', 120, 'English edition, Romance Dawn. Good condition.', 4, 'tanawat', '/uploads/acc01.jpg', 08),
  (37, 'One Piece Vol.2', 'manga', 120, 'English edition. Small crease on cover.', 4, 'tanawat', '/uploads/acc01.jpg', 08),
  (38, 'Naruto Vol.1', 'manga', 110, 'English edition. Pages slightly yellowed.', 3, 'tanawat', '/uploads/acc01.jpg', 08),
  (39, 'Attack on Titan 1', 'manga', 130, 'English edition. Practically new.', 5, 'tanawat', '/uploads/acc01.jpg', 08),
  (40, 'Slam Dunk Vol.1', 'comic', 150, 'Thai edition. Cover has light scratches.', 3, 'tanawat', '/uploads/acc01.jpg', 08),
  (41, 'English Grammar Use', 'language', 320, 'Raymond Murphy. A few exercises filled in pencil.', 4, 'pim_pim', '/uploads/acc01.jpg', 09),
  (42, 'TOEIC Prep 2024', 'exam-prep', 350, 'Unused, includes practice tests.', 5, 'pim_pim', '/uploads/acc01.jpg', 09),
  (43, 'IELTS Cambridge 16', 'exam-prep', 380, 'Practice tests unused, audio code intact.', 4, 'pim_pim', '/uploads/acc01.jpg', 09),
  (44, 'Japanese N5 Kanji', 'language', 240, 'Kanji workbook, half completed in pencil.', 3, 'pim_pim', '/uploads/acc01.jpg', 09),
  (45, 'Korean for Beginner', 'language', 260, 'Textbook with workbook, good condition.', 4, 'pim_pim', '/uploads/acc01.jpg', 09),
  (46, 'Spirited Away Art', 'art-design', 650, 'Art book, hardcover. Kept in plastic cover.', 5, 'arm_novel', '/uploads/acc01.jpg', 10),
  (47, 'Don''t Make Me Think', 'technology', 330, 'Steve Krug on web usability. Clean.', 4, 'arm_novel', '/uploads/acc01.jpg', 10),
  (48, 'The Design of Every', 'art-design', 360, 'Don Norman. Corners slightly bent.', 3, 'arm_novel', '/uploads/acc01.jpg', 10),
  (49, 'Lonely Planet Japan', 'travel', 290, 'Travel guide, 2022 edition. Some pages marked.', 3, 'arm_novel', '/uploads/acc01.jpg', 10),
  (50, 'Into the Wild', 'biography', 170, 'Jon Krakauer. Good paperback.', 4, 'arm_novel', '/uploads/acc01.jpg', 10);

-- ---------- ข้อมูลจำลอง: คำขอแลกเปลี่ยน ----------
-- account 3 (somchai) จะมี 2 คำขอเข้า (หน้า match) และส่งคำขอออก 2 รายการ (หน้า wait)
INSERT INTO trade_request (trade_id, requester_acc_id, owner_acc_id, offer_book_id, want_book_id, trade_status) VALUES
  (1, 4, 3, 16, 11, 'pending'),
  (2, 5, 3, 21, 12, 'pending'),
  (3, 3, 6, 13, 26, 'pending'),
  (4, 3, 7, 15, 31, 'pending');

-- ตรวจสอบ: SELECT acc_id, COUNT(*) FROM book GROUP BY acc_id;  (ควรได้ account ละ 5 เล่ม)
