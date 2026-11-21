// ============================================================
// ไฟล์กลางที่ทุกหน้าใช้ร่วมกัน: เรียก web service, ตรวจ login, สร้างการ์ดหนังสือ
// ต้องใส่ <script src="../js/api.js" defer> ก่อนไฟล์ js ของหน้านั้นเสมอ
// ============================================================

// ที่อยู่ web service (port 3000) ใช้ hostname เดียวกับหน้าเว็บเพื่อให้ cookie ส่งไปด้วย
const WS_URL = `http://${location.hostname}:3000`;

// รูป placeholder ใช้เมื่อหนังสือไม่มีรูป
const PLACEHOLDER_IMG =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400">' +
        '<rect width="100%" height="100%" fill="#d9d2d6"/>' +
        '<text x="50%" y="50%" fill="#8a7a84" font-family="sans-serif" font-size="22" ' +
        'text-anchor="middle">No image</text></svg>'
    );

// เรียก web service
// options: method, body (JSON), form (FormData), redirectOn401 (ค่าเริ่มต้น true = ไปหน้า login)
async function api(path, { method = "GET", body, form, redirectOn401 = true } = {}) {
    const options = { method, credentials: "include", headers: {} };
    if (form) {
        options.body = form;
    } else if (body !== undefined) {
        options.headers["Content-Type"] = "application/json";
        options.body = JSON.stringify(body);
    }

    let res;
    try {
        res = await fetch(WS_URL + path, options);
    } catch (err) {
        throw new Error("Cannot connect to the web service (" + WS_URL + ")");
    }

    let data = null;
    try {
        data = await res.json();
    } catch (err) {
        /* ไม่มี body */
    }

    if (res.status === 401 && redirectOn401) {
        location.href = "/login";
        throw new Error("Please log in");
    }
    if (!res.ok) {
        throw new Error((data && data.message) || "Request failed (" + res.status + ")");
    }
    return data;
}

// ข้อมูลผู้ใช้ที่ login อยู่ (null ถ้ายังไม่ login) เรียกซ้ำได้โดยไม่ยิงซ้ำ
let mePromise = null;
function getMe() {
    if (!mePromise) {
        mePromise = api("/auth/me", { redirectOn401: false }).catch(() => null);
    }
    return mePromise;
}

// บังคับ login (และ role ถ้าระบุ) ถ้าไม่ผ่านจะเปลี่ยนหน้าและหยุดการทำงานของสคริปต์
// หมายเหตุ: นี่เป็นเพียงการเปลี่ยนหน้าเพื่อความสะดวก การตรวจสิทธิ์จริงทำที่ web service
async function requireLogin(role) {
    const me = await getMe();
    if (!me) {
        location.href = "/login";
        return new Promise(() => {});
    }
    if (role && me.role !== role) {
        location.href = me.role === "admin" ? "/admin-home" : "/home";
        return new Promise(() => {});
    }
    return me;
}

// ปรับเมนูตาม role: ซ่อน/แสดง userNav, adminNav และตั้งลิงก์ home / profile
async function applyRoleNav() {
    const me = await getMe();
    const isAdmin = !!me && me.role === "admin";

    const userNav = document.getElementById("userNav");
    const adminNav = document.getElementById("adminNav");
    const homeLink = document.getElementById("homeLink");
    if (userNav) userNav.hidden = isAdmin;
    if (adminNav) adminNav.hidden = !isAdmin;
    if (homeLink) homeLink.href = isAdmin ? "/admin-home" : "/home";

    document.querySelectorAll("a.profile").forEach((a) => {
        a.href = me ? (isAdmin ? "/admin-profile" : "/profile") : "/login";
    });
}
document.addEventListener("DOMContentLoaded", applyRoleNav);

// ---------- ฟังก์ชันช่วยสร้างหน้าเว็บ ----------

// สร้าง element (ใช้ textContent เพื่อป้องกัน XSS)
function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

// แปลง path รูปให้เป็น URL ที่ใช้ได้ (รูปที่อัปโหลดอยู่ที่ web service)
function imgSrc(path) {
    if (!path) return PLACEHOLDER_IMG;
    if (/^https?:|^data:/.test(path)) return path;
    if (path.startsWith("/uploads/")) return WS_URL + path;
    return path;
}

function stars(n) {
    return "★".repeat(n) + "☆".repeat(5 - n);
}

// ข้อความย่อใต้ชื่อหนังสือ
function bookInfo(book) {
    return `${book.category} | ${book.price} ฿ | ${stars(book.condition)} | by ${book.owner}`;
}

// สร้างการ์ดหนังสือ (class "item" ตาม css เดิม)
// options.detail = false: ไม่แสดงปุ่ม detail, options.extra = [element,...] ปุ่มเพิ่มเติม
function bookCard(book, options = {}) {
    const card = el("div", "item");
    const img = el("img");
    img.alt = book.name;
    img.src = imgSrc(book.picture);
    img.onerror = () => {
        img.onerror = null;
        img.src = PLACEHOLDER_IMG;
    };
    card.append(img, el("p", "itemname", book.name), el("p", "info", bookInfo(book)));

    (options.extra || []).forEach((node) => card.append(node, " "));
    if (options.detail !== false) {
        const link = el("a", null, "detail");
        link.href = "/detail-item?id=" + book.id;
        card.append(link);
    }
    return card;
}

// แทนที่เนื้อหาใน container ด้วยข้อความ
function showMessage(container, text) {
    container.replaceChildren(el("p", "info", text));
}

// ใส่การ์ดหนังสือหลายเล่มลงใน container
function renderBooks(container, books, options) {
    if (!books.length) return showMessage(container, "No books found.");
    container.replaceChildren(...books.map((b) => bookCard(b, options)));
}

// อ่านค่า id จาก query string เช่น /detail-item?id=3
function queryId(name = "id") {
    return new URLSearchParams(location.search).get(name);
}
