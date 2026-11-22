// ระบบ cookie + ตรวจสอบสิทธิ์
// cookie เก็บ {id, logId, exp} เซ็นชื่อด้วย HMAC-SHA256 (แก้ค่าเองไม่ได้)
// ส่วน role จะอ่านจากฐานข้อมูลทุกครั้ง จึงเปลี่ยน role แล้วมีผลทันที
const crypto = require("crypto");
const db = require("./db");
const { asyncHandler } = require("./util");

const COOKIE_NAME = "samud_session";
const SECRET = process.env.COOKIE_SECRET || "samud-trade-dev-secret";
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 1 วัน

function sign(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
  return `${data}.${sig}`;
}

function verify(token) {
  if (!token || !token.includes(".")) return null;
  const [data, sig] = token.split(".");
  const expected = crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString());
    return payload.exp > Date.now() ? payload : null;
  } catch (e) {
    return null;
  }
}

// อ่าน cookie จาก header (ไม่ต้องใช้ library เพิ่ม)
function parseCookies(header) {
  const out = {};
  (header || "").split(";").forEach((part) => {
    const i = part.indexOf("=");
    if (i < 0) return;
    try {
      out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
    } catch (e) {
      /* ข้าม cookie ที่อ่านไม่ได้ */
    }
  });
  return out;
}

function setSessionCookie(res, accId, logId) {
  const token = sign({ id: accId, logId, exp: Date.now() + MAX_AGE_MS });
  res.cookie(COOKIE_NAME, token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: MAX_AGE_MS });
}

function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME, { httpOnly: true, sameSite: "lax", path: "/" });
}

function readSession(req) {
  return verify(parseCookies(req.headers.cookie)[COOKIE_NAME]);
}

// ใส่ req.user ถ้า login อยู่ (ไม่บังคับ)
const optionalLogin = asyncHandler(async (req, res, next) => {
  req.user = null;
  const session = readSession(req);
  if (session) {
    const [rows] = await db.query(
      "SELECT acc_id AS id, acc_role AS role, acc_username AS username FROM user_Account WHERE acc_id = ?",
      [session.id]
    );
    if (rows.length) req.user = { ...rows[0], logId: session.logId };
  }
  next();
});

// ต้อง login
const requireLogin = [
  optionalLogin,
  (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Please log in" });
    next();
  },
];

// ต้องเป็น admin
const requireAdmin = [
  ...requireLogin,
  (req, res, next) => {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Admin only" });
    next();
  },
];

module.exports = { setSessionCookie, clearSessionCookie, readSession, optionalLogin, requireLogin, requireAdmin };
