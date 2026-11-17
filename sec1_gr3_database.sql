CREATE DATABASE IF NOT EXISTS samud_trade CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE samud_trade;

CREATE TABLE IF NOT EXISTS Account (
  account_ID INT NOT NULL AUTO_INCREMENT,
  username VARCHAR(20) NOT NULL,
  a_fname VARCHAR(20) NOT NULL,
  a_lname VARCHAR(20) NOT NULL,
  a_password VARCHAR(100) NOT NULL,
  a_email VARCHAR(100) NOT NULL,
  acount_picture_link VARCHAR(100) NULL,
  PRIMARY KEY (account_ID)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Admin_Account (
  admin_ID INT NOT NULL AUTO_INCREMENT,
  username VARCHAR(20) NOT NULL,
  password VARCHAR(100) NOT NULL,
  PRIMARY KEY (admin_ID)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Book (
  book_ID INT NOT NULL AUTO_INCREMENT,
  book_name VARCHAR(20) NOT NULL,
  category VARCHAR(20) NOT NULL,
  price DECIMAL(9,2) NOT NULL,
  detail VARCHAR(500) NOT NULL,
  `condition` VARCHAR(20) NOT NULL,
  owner VARCHAR(20) NOT NULL,
  book_picture_link VARCHAR(100) NULL,
  account_ID INT NOT NULL,
  PRIMARY KEY (book_ID),
  CONSTRAINT fk_book_account FOREIGN KEY (account_ID) REFERENCES Account(account_ID)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Information_Admin_Account (
  email VARCHAR(100) NOT NULL,
  f_name VARCHAR(20) NOT NULL,
  l_name VARCHAR(20) NOT NULL,
  admin_picture_link VARCHAR(100) NULL,
  admin_ID INT NOT NULL,
  PRIMARY KEY (email),
  CONSTRAINT fk_admin_information FOREIGN KEY (admin_ID) REFERENCES Admin_Account(admin_ID)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS login_log (
  login_log_ID INT NOT NULL AUTO_INCREMENT,
  login_status VARCHAR(20) NOT NULL,
  login_datetime DATETIME NOT NULL,
  logout_datetime DATETIME NOT NULL,
  admin_ID INT NOT NULL,
  PRIMARY KEY (login_log_ID),
  CONSTRAINT fk_login_admin FOREIGN KEY (admin_ID) REFERENCES Admin_Account(admin_ID)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Manage_admin_book (
  account_ID INT NOT NULL,
  book_ID INT NOT NULL,
  operating VARCHAR(20) NOT NULL,
  managed_datetime DATETIME NULL,
  PRIMARY KEY (account_ID, book_ID),
  CONSTRAINT fk_manage_book_account FOREIGN KEY (account_ID) REFERENCES Account(account_ID),
  CONSTRAINT fk_manage_book_book FOREIGN KEY (book_ID) REFERENCES Book(book_ID)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Manage_admin_admin (
  admin_ID INT NOT NULL,
  super_admin_ID INT NOT NULL,
  managed_datetime DATETIME NULL,
  PRIMARY KEY (admin_ID, super_admin_ID),
  CONSTRAINT fk_manage_admin FOREIGN KEY (admin_ID) REFERENCES Admin_Account(admin_ID),
  CONSTRAINT fk_manage_super_admin FOREIGN KEY (super_admin_ID) REFERENCES Admin_Account(admin_ID)
) ENGINE=InnoDB;

