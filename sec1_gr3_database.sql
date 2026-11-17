-- Samud Trade database schema | MySQL 8.0+
-- Import: mysql -u root -p < samud_trade.sql
CREATE DATABASE IF NOT EXISTS samud_trade CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE samud_trade;

CREATE TABLE IF NOT EXISTS users (
  user_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  role ENUM('user','admin') NOT NULL DEFAULT 'user',
  firstname VARCHAR(100) NOT NULL,
  lastname VARCHAR(100) NOT NULL,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  profile_image VARCHAR(500),
  account_status ENUM('active','suspended') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS books (
  book_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  owner_id BIGINT UNSIGNED NOT NULL,
  book_name VARCHAR(255) NOT NULL,
  category ENUM('art-design','biography','business','children','comic','cooking','exam-prep','fantasy','finance','health','history','horror','language','light-novel','magazine','manga','mystery','novel','other','programming','psychology','religion','romance','science','sci-fi','self-help','technology','textbook','thriller','travel') NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  book_condition TINYINT UNSIGNED NOT NULL COMMENT '1 to 5 stars',
  detail TEXT,
  image_path VARCHAR(500),
  availability ENUM('available','reserved','traded','hidden') NOT NULL DEFAULT 'available',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_books_owner FOREIGN KEY (owner_id) REFERENCES users(user_id) ON DELETE RESTRICT,
  CONSTRAINT chk_book_price CHECK (price >= 0),
  CONSTRAINT chk_book_condition CHECK (book_condition BETWEEN 1 AND 5),
  INDEX idx_books_owner (owner_id),
  INDEX idx_books_category (category),
  INDEX idx_books_availability (availability),
  INDEX idx_books_price (price),
  INDEX idx_books_condition (book_condition),
  INDEX idx_books_name (book_name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS interests (
  interest_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  book_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_interest_user_book (user_id, book_id),
  CONSTRAINT fk_interests_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_interests_book FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ignored_books (
  ignored_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  book_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_ignored_user_book (user_id, book_id),
  CONSTRAINT fk_ignored_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_ignored_book FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS trade_requests (
  trade_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  requester_id BIGINT UNSIGNED NOT NULL,
  recipient_id BIGINT UNSIGNED NOT NULL,
  offered_book_id BIGINT UNSIGNED NOT NULL COMMENT 'Your book on select_book page',
  requested_book_id BIGINT UNSIGNED NOT NULL COMMENT 'Trade book on select_book page',
  status ENUM('pending','accepted','rejected','cancelled','completed') NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  responded_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  CONSTRAINT fk_trade_requester FOREIGN KEY (requester_id) REFERENCES users(user_id) ON DELETE RESTRICT,
  CONSTRAINT fk_trade_recipient FOREIGN KEY (recipient_id) REFERENCES users(user_id) ON DELETE RESTRICT,
  CONSTRAINT fk_trade_offered FOREIGN KEY (offered_book_id) REFERENCES books(book_id) ON DELETE RESTRICT,
  CONSTRAINT fk_trade_requested FOREIGN KEY (requested_book_id) REFERENCES books(book_id) ON DELETE RESTRICT,
  CONSTRAINT chk_trade_users CHECK (requester_id <> recipient_id),
  CONSTRAINT chk_trade_books CHECK (offered_book_id <> requested_book_id),
  INDEX idx_trade_recipient_status (recipient_id, status),
  INDEX idx_trade_requester_status (requester_id, status),
  INDEX idx_trade_offered (offered_book_id),
  INDEX idx_trade_requested (requested_book_id)
) ENGINE=InnoDB;

-- Example queries for future Express routes (uncomment as needed):
-- SELECT * FROM books WHERE availability='available' ORDER BY created_at DESC;
-- SELECT * FROM books WHERE owner_id = ? ORDER BY created_at DESC;
-- SELECT * FROM books WHERE book_name LIKE CONCAT('%', ?, '%') AND availability='available';
-- SELECT * FROM trade_requests WHERE recipient_id = ? AND status='pending'; -- Match
-- SELECT * FROM trade_requests WHERE requester_id = ? AND status='pending'; -- Wait
-- Passwords must be hashed in the backend (e.g. bcrypt); never store plaintext.
-- Backend must verify that offered_book_id belongs to requester_id,
-- requested_book_id belongs to recipient_id, and both books are available.
-- Accepting/completing a trade must use a transaction and prevent conflicting trades.
