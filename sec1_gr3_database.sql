CREATE DATABASE IF NOT EXISTS samud_trade;

use samud_trade;

CREATE TABLE if not EXISTS book(
    book_id varchar(45) not null,

    book_name varchar(45) not null,
    book_cat varchar(45) not null,
    book_price int(10) not null,
    book_con int(1) not null,
    book_owner varchar(45) not null,
    book_detail varchar(100) null,

    PRIMARY KEY (book_id)
);

INSERT into book VALUE
    ('b101', 'onepeice v112', 'manga', 85, 4, 'admin', 'ปกมีรอยยับเล็กน้อย'),
    ('b102', 'ภาพปริศนา 2', 'manga', 195, 5, 'admin', null);


select * from book;