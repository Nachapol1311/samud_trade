CREATE DATABASE if not EXISTS samud_trade;

use samud_trade;

CREATE TABLE if not EXISTS user_Account(
  acc_id int(10) not null,
  acc_role varchar(20) not null,
  acc_username VARCHAR(20) not null,
  acc_passwd VARCHAR(100) not null,

  CONSTRAINT acc_pk PRIMARY KEY(acc_id)
);

CREATE TABLE if not EXISTS information_Account(
  acc_email VARCHAR(100) not null,
  acc_name VARCHAR(20) not null,
  acc_name VARCHAR(20) not null,
  acc_picture_link VARCHAR(100) null,
  acc_id int(10) not null,
  
  CONSTRAINT information_Account_pk PRIMARY KEY (acc_email),
  CONSTRAINT information_Account_fk FOREIGN KEY (acc_id) REFERENCES user_Account(acc_id)
);

CREATE TABLE if not EXISTS book(
  book_id int(10) not null,
  book_name VARCHAR(20) not null,
  book_cat VARCHAR(20) not null,
  book_price INT(10) not null,
  book_detail VARCHAR(255) not null,
  book_condition INT(10) not null,
  book_owner VARCHAR(100) null,
  book_lick_pic VARCHAR(255) null,
  acc_id int(10) not null,

  CONSTRAINT book_pk PRIMARY KEY (book_id),
  CONSTRAINT book_fk FOREIGN KEY (acc_id) REFERENCES user_Account(acc_id)
);


-- select * from userAccount;
-- select * from book;

CREATE TABLE if not EXISTS login_log(
  login_log_id int(10) not null,
  login_status VARCHAR(20) not null,
  login_datetime DATETIME not null,
  logout_datetime DATETIME not null,
  acc_id int(10) not null,


  CONSTRAINT book_pk PRIMARY KEY (login_log_id),
  CONSTRAINT book_fk FOREIGN KEY (acc_id) REFERENCES user_Account(acc_id)
);


CREATE TABLE if not EXISTS manage_admin_book(
  acc_id int(10) not null,
  book_id int(10) not null,
  operating VARCHAR(20) not null,
  managed_book_datetime DATETIME null,

  CONSTRAINT manage_admin_book_pk PRIMARY KEY (acc_id, book_id),
  CONSTRAINT manage_admin_book_fk1 FOREIGN KEY (acc_id) REFERENCES user_Account(acc_id),
  CONSTRAINT manage_admin_book_fk2 FOREIGN KEY (book_id) REFERENCES book(book_id)
);


CREATE TABLE if not EXISTS manage_admin_account(
  acc_id int(10) not null,
  super_acc_id int(10) not null,
  managed_acc_datetime DATETIME null,

  CONSTRAINT manage_admin_account_pk PRIMARY KEY (acc_id, super_acc_id),
  CONSTRAINT manage_admin_account_fk1 FOREIGN KEY (acc_id) REFERENCES user_Account(acc_id),
  CONSTRAINT manage_admin_account_fk2 FOREIGN KEY (super_acc_id) REFERENCES user_Account(acc_id)
);
