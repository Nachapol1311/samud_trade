// ===== เว็บเซอร์วิสการแลกเปลี่ยนหนังสือ (trade / match / wait) =====
// สถานะคำขอ: pending (รอ) -> accepted (ตกลง) / declined (ไม่แลก) / cancelled (ผู้ขอยกเลิก)
const express = require("express");
const db = require("../db");
const { requireLogin } = require("../auth");
const { asyncHandler, toInt } = require("../util");

const router = express.Router();
router.use(requireLogin);

// สร้างรายการคอลัมน์ของหนังสือ โดยตั้งชื่อนำหน้า เช่น offer_id, want_name
function bookCols(alias, prefix) {
  return `${alias}.book_id AS ${prefix}_id, ${alias}.book_name AS ${prefix}_name, ${alias}.book_cat AS ${prefix}_category,
    ${alias}.book_price AS ${prefix}_price, ${alias}.book_detail AS ${prefix}_detail,
    ${alias}.book_condition AS ${prefix}_condition, ${alias}.book_lick_pic AS ${prefix}_picture`;
}

// แปลงแถวที่ได้จาก SQL เป็นอ็อบเจ็กต์หนังสือ
function pickBook(row, prefix, owner) {
  return {
    id: row[`${prefix}_id`],
    name: row[`${prefix}_name`],
    category: row[`${prefix}_category`],
    price: row[`${prefix}_price`],
    detail: row[`${prefix}_detail`],
    condition: row[`${prefix}_condition`],
    picture: row[`${prefix}_picture`],
    owner,
  };
}

const TRADE_FROM = `FROM trade_request t
  JOIN book ob ON ob.book_id = t.offer_book_id
  JOIN book wb ON wb.book_id = t.want_book_id
  JOIN user_Account ru ON ru.acc_id = t.requester_acc_id
  JOIN user_Account ou ON ou.acc_id = t.owner_acc_id`;

// ---------------------------------------------------------------
// ขอแลกหนังสือ (หน้า select-book) ส่งไปแสดงที่หน้า match ของเจ้าของ และหน้า wait ของเรา
// Testing 1: (login ด้วย kim) ขอแลกหนังสือ id 37 ของ bebe ด้วยหนังสือ id 12 ของเรา
// method: post
// URL: http://localhost:3000/trades
// body: raw JSON
// { "want_book_id": 37, "offer_book_id": 12 }
// Expected: 201 Created
// Result: 
//{
//   "message": "Trade request sent",
//   "id": 5
// }
// ---------------------------------------------------------------
router.post("/", asyncHandler(async (req, res) => {
  const wantId = toInt(req.body.want_book_id);
  const offerId = toInt(req.body.offer_book_id);
  if (wantId === null || offerId === null) return res.status(400).json({ message: "Please select both books" });

  const [books] = await db.query("SELECT book_id, acc_id FROM book WHERE book_id IN (?, ?)", [wantId, offerId]);
  const want = books.find((b) => b.book_id === wantId);
  const offer = books.find((b) => b.book_id === offerId);
  if (!want || !offer) return res.status(404).json({ message: "Book not found" });
  if (want.acc_id === req.user.id) return res.status(400).json({ message: "You cannot trade for your own book" });
  if (offer.acc_id !== req.user.id) return res.status(403).json({ message: "You can offer only your own books" });

  const [dup] = await db.query(
    "SELECT trade_id FROM trade_request WHERE offer_book_id = ? AND want_book_id = ? AND trade_status = 'pending'",
    [offerId, wantId]
  );
  if (dup.length) return res.status(409).json({ message: "You already sent this trade request" });

  const [result] = await db.query(
    "INSERT INTO trade_request (requester_acc_id, owner_acc_id, offer_book_id, want_book_id) VALUES (?, ?, ?, ?)",
    [req.user.id, want.acc_id, offerId, wantId]
  );
  res.status(201).json({ message: "Trade request sent", id: result.insertId });
}));

// ---------------------------------------------------------------
// หน้า match: คำขอที่คนอื่นอยากแลกกับเรา (ซ้าย = หนังสือของเขา, ขวา = หนังสือของเรา)
// Testing 1: (login ด้วย kim) 
// method: get
// URL: http://localhost:3000/trades/incoming
// Expected: 200 OK
// Result:
// [
//     {
//         "id": 2,
//         "from": "mai",
//         "theirBook": {
//             "id": 21,
//             "name": "เดนดาว NEVERDIE",
//             "category": "novel",
//             "price": 380,
//             "detail": "หนังสืองอ ขอบขาดนิดหน่อย",
//             "condition": 4,
//             "picture": "/uploads/b21.jpg",
//             "owner": "mai"
//         },
//         "myBook": {
//             "id": 12,
//             "name": "BETTER THAN THE MOVIE",
//             "category": "romance",
//             "price": 477,
//             "detail": "หนังสืองอ ปกงอ มีรสนิดหน่อยไม่เยอะมาก",
//             "condition": 3,
//             "picture": "/uploads/b12.jpg",
//             "owner": "kim"
//         }
//     },
//      ...
// ]
// ---------------------------------------------------------------
router.get("/incoming", asyncHandler(async (req, res) => {
  const [rows] = await db.query(
    `SELECT t.trade_id, ru.acc_username AS other_user, ou.acc_username AS my_user,
            ${bookCols("ob", "offer")}, ${bookCols("wb", "want")}
     ${TRADE_FROM}
     WHERE t.owner_acc_id = ? AND t.trade_status = 'pending' ORDER BY t.trade_id DESC`,
    [req.user.id]
  );
  res.json(rows.map((r) => ({
    id: r.trade_id,
    from: r.other_user,
    theirBook: pickBook(r, "offer", r.other_user),
    myBook: pickBook(r, "want", r.my_user),
  })));
}));

// ---------------------------------------------------------------
// หน้า wait: คำขอที่เราส่งไปและยังรอการตอบรับ (ซ้าย = หนังสือที่เราอยากได้, ขวา = หนังสือของเรา)
// Testing 1: (login ด้วย kim) 
// method: get
// URL: http://localhost:3000/trades/outgoing
// Expected: 200 OK
// Result:
// [
//     {
//         "id": 5,
//         "to": "bebe",
//         "theirBook": {
//             "id": 37,
//             "name": "My Return to the Walter boys",
//             "category": "novel",
//             "price": 299,
//             "detail": "มีรอยพับหน้า",
//             "condition": 4,
//             "picture": "/uploads/b37.jpg",
//             "owner": "bebe"
//         },
//         "myBook": {
//             "id": 12,
//             "name": "BETTER THAN THE MOVIE",
//             "category": "romance",
//             "price": 477,
//             "detail": "หนังสืองอ ปกงอ มีรสนิดหน่อยไม่เยอะมาก",
//             "condition": 3,
//             "picture": "/uploads/b12.jpg",
//             "owner": "kim"
//         }
//     },
//     ...
//]
// ---------------------------------------------------------------
router.get("/outgoing", asyncHandler(async (req, res) => {
  const [rows] = await db.query(
    `SELECT t.trade_id, ou.acc_username AS other_user, ru.acc_username AS my_user,
            ${bookCols("ob", "offer")}, ${bookCols("wb", "want")}
     ${TRADE_FROM}
     WHERE t.requester_acc_id = ? AND t.trade_status = 'pending' ORDER BY t.trade_id DESC`,
    [req.user.id]
  );
  res.json(rows.map((r) => ({
    id: r.trade_id,
    to: r.other_user,
    theirBook: pickBook(r, "want", r.other_user),
    myBook: pickBook(r, "offer", r.my_user),
  })));
}));

// ---------------------------------------------------------------
// ตกลงแลกเปลี่ยน (เฉพาะเจ้าของหนังสือที่ถูกขอ): สลับเจ้าของหนังสือทั้งสองเล่ม
// และยกเลิกคำขออื่นที่ยัง pending ที่เกี่ยวกับหนังสือสองเล่มนี้
// Testing 1: (login ด้วย kim) 
// method: post
// URL: http://localhost:3000/trades/1/accept
// Expected: 200 OK
// Result:
// {
//     "message": "Trade completed"
// }
// ---------------------------------------------------------------
router.post("/:id/accept", asyncHandler(async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [trades] = await conn.query("SELECT * FROM trade_request WHERE trade_id = ? FOR UPDATE", [req.params.id]);
    const t = trades[0];
    if (!t || t.owner_acc_id !== req.user.id) {
      await conn.rollback();
      return res.status(404).json({ message: "Trade request not found" });
    }
    if (t.trade_status !== "pending") {
      await conn.rollback();
      return res.status(409).json({ message: "This request is no longer pending" });
    }

    // ตรวจว่าหนังสือยังเป็นของเจ้าของเดิมอยู่
    const [books] = await conn.query("SELECT book_id, acc_id FROM book WHERE book_id IN (?, ?) FOR UPDATE", [
      t.offer_book_id,
      t.want_book_id,
    ]);
    const offer = books.find((b) => b.book_id === t.offer_book_id);
    const want = books.find((b) => b.book_id === t.want_book_id);
    if (!offer || !want || offer.acc_id !== t.requester_acc_id || want.acc_id !== t.owner_acc_id) {
      await conn.query("UPDATE trade_request SET trade_status = 'cancelled', responded_datetime = NOW() WHERE trade_id = ?", [t.trade_id]);
      await conn.commit();
      return res.status(409).json({ message: "The books have changed, this request was cancelled" });
    }

    const [users] = await conn.query("SELECT acc_id, acc_username FROM user_Account WHERE acc_id IN (?, ?)", [
      t.requester_acc_id,
      t.owner_acc_id,
    ]);
    const nameOf = (id) => users.find((u) => u.acc_id === id).acc_username;

    // สลับเจ้าของ: หนังสือของผู้ขอ -> เจ้าของ, หนังสือของเจ้าของ -> ผู้ขอ
    await conn.query("UPDATE book SET acc_id = ?, book_owner = ? WHERE book_id = ?", [t.owner_acc_id, nameOf(t.owner_acc_id), t.offer_book_id]);
    await conn.query("UPDATE book SET acc_id = ?, book_owner = ? WHERE book_id = ?", [t.requester_acc_id, nameOf(t.requester_acc_id), t.want_book_id]);

    await conn.query("UPDATE trade_request SET trade_status = 'accepted', responded_datetime = NOW() WHERE trade_id = ?", [t.trade_id]);
    // คำขออื่นที่ใช้หนังสือสองเล่มนี้ใช้ต่อไม่ได้แล้ว
    await conn.query(
      `UPDATE trade_request SET trade_status = 'cancelled', responded_datetime = NOW()
       WHERE trade_status = 'pending' AND trade_id <> ?
         AND (offer_book_id IN (?, ?) OR want_book_id IN (?, ?))`,
      [t.trade_id, t.offer_book_id, t.want_book_id, t.offer_book_id, t.want_book_id]
    );
    await conn.commit();
    res.json({ message: "Trade completed" });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}));

// เปลี่ยนสถานะคำขอที่ยัง pending (ใช้ร่วมกันสำหรับ decline / cancel)
async function changeStatus(req, res, column, status, message) {
  const [result] = await db.query(
    `UPDATE trade_request SET trade_status = ?, responded_datetime = NOW()
     WHERE trade_id = ? AND ${column} = ? AND trade_status = 'pending'`,
    [status, req.params.id, req.user.id]
  );
  if (!result.affectedRows) return res.status(404).json({ message: "Pending trade request not found" });
  res.json({ message });
}

// ---------------------------------------------------------------
// ไม่แลกเปลี่ยน (เฉพาะเจ้าของหนังสือที่ถูกขอ)
// Testing 1: (login ด้วย somchai) method: post  URL: http://localhost:3000/trades/2/decline
// Testing 2: (login ด้วย napat)   method: post  URL: http://localhost:3000/trades/3/decline
// ---------------------------------------------------------------
router.post("/:id/decline", asyncHandler((req, res) => changeStatus(req, res, "owner_acc_id", "declined", "Trade declined")));

// ---------------------------------------------------------------
// ยกเลิกคำขอที่เราส่ง (เฉพาะผู้ขอ) หน้า wait
// Testing 1: (login ด้วย somchai) method: post  URL: http://localhost:3000/trades/3/cancel
// Testing 2: (login ด้วย somchai) method: post  URL: http://localhost:3000/trades/4/cancel
// ---------------------------------------------------------------
router.post("/:id/cancel", asyncHandler((req, res) => changeStatus(req, res, "requester_acc_id", "cancelled", "Trade request cancelled")));

module.exports = router;
