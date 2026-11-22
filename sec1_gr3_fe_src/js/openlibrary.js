// ============================================================
// เชื่อมต่อ Public Web Service: Open Library (https://openlibrary.org)
// ใช้ในหน้า additem (user) และ admin-product-add (admin)
//
// วิธีทำงาน
//   1. ผู้ใช้พิมพ์ชื่อหนังสือในช่อง Book แล้วกดปุ่ม "Search Open Library"
//   2. เรียก  GET https://openlibrary.org/search.json?q=...   ด้วย fetch
//   3. แสดงผลลัพธ์สูงสุด 5 เล่ม (ปก / ชื่อ / ผู้แต่ง / ปีที่พิมพ์)
//   4. เมื่อเลือกเล่มใดเล่มหนึ่ง จะเติมข้อมูลลงฟอร์มให้อัตโนมัติ
//        - ชื่อหนังสือ, รายละเอียด (ผู้แต่ง + ปี + แหล่งที่มา)
//        - หมวดหมู่ (เดาจาก subject ถ้ายังไม่ได้เลือก)
//        - รูปปก (ดาวน์โหลดแล้วใส่ในช่องอัปโหลดรูป เพื่อส่งไปเก็บที่ web service ของเรา)
//
// เอกสาร API: https://openlibrary.org/dev/docs/api/search
// แหล่งข้อมูล/รูปปกทั้งหมดมาจาก Open Library จึงต้องแสดงการอ้างอิงในหน้าเว็บทุกครั้ง
// ต้องใส่ <script src="../js/openlibrary.js" defer> ต่อจาก additem.js
// ============================================================

const OL_SEARCH_URL = "https://openlibrary.org/search.json";
const OL_COVER_URL = "https://covers.openlibrary.org/b/id/"; // + {cover_i}-S.jpg | -L.jpg
const OL_TIMEOUT_MS = 8000;

// คำใน subject ของ Open Library -> ค่า category ของเว็บเรา (เรียงจากเฉพาะเจาะจงไปทั่วไป)
const OL_CATEGORY_RULES = [
    ["science fiction", "sci-fi"],
    ["sci-fi", "sci-fi"],
    ["fantasy", "fantasy"],
    ["horror", "horror"],
    ["thriller", "thriller"],
    ["mystery", "mystery"],
    ["detective", "mystery"],
    ["romance", "romance"],
    ["manga", "manga"],
    ["graphic novel", "comic"],
    ["comic", "comic"],
    ["biography", "biography"],
    ["self-help", "self-help"],
    ["psychology", "psychology"],
    ["programming", "programming"],
    ["computer", "programming"],
    ["cooking", "cooking"],
    ["cookbook", "cooking"],
    ["finance", "finance"],
    ["business", "business"],
    ["health", "health"],
    ["religion", "religion"],
    ["history", "history"],
    ["travel", "travel"],
    ["children", "children"],
    ["juvenile", "children"],
    ["textbook", "textbook"],
    ["art", "art-design"],
    ["technology", "technology"],
    ["science", "science"],
    ["fiction", "novel"],
];

// เดาหมวดหมู่จากรายการ subject (ไม่เจอให้คืน "")
function guessCategory(subjects) {
    const text = (subjects || []).join(" | ").toLowerCase();
    for (const [keyword, category] of OL_CATEGORY_RULES) {
        if (text.includes(keyword)) return category;
    }
    return "";
}

// เรียก Open Library ค้นหาหนังสือด้วยชื่อ (คืน array ของเล่มที่เจอ)
async function searchOpenLibrary(query) {
    const url =
        OL_SEARCH_URL +
        "?q=" + encodeURIComponent(query) +
        "&limit=5&fields=key,title,author_name,first_publish_year,cover_i,subject";

    // กันค้าง: ยกเลิกคำขอถ้าเกิน OL_TIMEOUT_MS
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), OL_TIMEOUT_MS);
    try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error("Open Library error (" + res.status + ")");
        const data = await res.json();
        return data.docs || [];
    } catch (err) {
        if (err.name === "AbortError") throw new Error("Open Library took too long to respond");
        throw new Error("Cannot reach Open Library: " + err.message);
    } finally {
        clearTimeout(timer);
    }
}

// ดาวน์โหลดรูปปกแล้วใส่ลงช่อง <input type="file"> เพื่อให้ฟอร์มอัปโหลดไปเก็บที่ web service ของเรา
// ถ้าดาวน์โหลดไม่ได้ (เช่น เครือข่าย/CORS) จะข้ามไปเฉย ๆ ผู้ใช้ยังเลือกรูปเองได้
async function attachCover(coverId, fileInput) {
    try {
        const res = await fetch(OL_COVER_URL + coverId + "-L.jpg");
        if (!res.ok) return false;
        const blob = await res.blob();
        if (!blob.type.startsWith("image/")) return false;
        const file = new File([blob], "cover-" + coverId + ".jpg", { type: blob.type });
        const transfer = new DataTransfer();
        transfer.items.add(file);
        fileInput.files = transfer.files;
        return true;
    } catch (err) {
        return false;
    }
}

// เติมข้อมูลของเล่มที่เลือกลงฟอร์ม
async function fillFormFromBook(doc, statusEl) {
    const authors = (doc.author_name || []).slice(0, 3).join(", ");
    const year = doc.first_publish_year ? " First published " + doc.first_publish_year + "." : "";
    const detail = ("By " + (authors || "unknown author") + "." + year + " (Source: Open Library)").slice(0, 255);

    document.getElementById("book_name").value = (doc.title || "").slice(0, 100);
    document.getElementById("book_detail").value = detail;

    // เติมหมวดหมู่เฉพาะเมื่อผู้ใช้ยังไม่ได้เลือกเอง
    const categorySelect = document.getElementById("category");
    if (!categorySelect.value) categorySelect.value = guessCategory(doc.subject);

    if (doc.cover_i) {
        statusEl.textContent = "Downloading cover...";
        const ok = await attachCover(doc.cover_i, document.getElementById("book_image"));
        statusEl.textContent = ok
            ? "Filled from Open Library (cover attached). Please set price and condition."
            : "Filled from Open Library (cover unavailable, you can choose an image yourself).";
    } else {
        statusEl.textContent = "Filled from Open Library (no cover available). Please set price and condition.";
    }
}

// สร้างรายการผลลัพธ์ 1 แถว (ใช้ textContent ทั้งหมด ไม่ใส่ HTML จากภายนอกลงหน้าเว็บโดยตรง)
function buildResultItem(doc, onPick) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ol-item";

    const img = document.createElement("img");
    img.alt = "";
    img.src = doc.cover_i ? OL_COVER_URL + doc.cover_i + "-S.jpg" : PLACEHOLDER_IMG;
    img.width = 40;
    img.height = 56;

    const text = document.createElement("span");
    const title = document.createElement("strong");
    title.textContent = doc.title || "(untitled)";
    const meta = document.createElement("small");
    const author = (doc.author_name || ["unknown author"])[0];
    meta.textContent = author + (doc.first_publish_year ? " · " + doc.first_publish_year : "");
    text.append(title, document.createElement("br"), meta);

    btn.append(img, text);
    btn.addEventListener("click", () => onPick(doc));
    li.appendChild(btn);
    return li;
}

document.addEventListener("DOMContentLoaded", () => {
    const searchBtn = document.getElementById("olBtn");
    const list = document.getElementById("olResults");
    const statusEl = document.getElementById("olStatus");
    if (!searchBtn || !list || !statusEl) return; // หน้านี้ไม่มีส่วนค้นหา Open Library

    async function runSearch() {
        const query = document.getElementById("book_name").value.trim();
        if (!query) return alert("Type a book title in the Book field first");

        list.replaceChildren();
        statusEl.textContent = "Searching Open Library...";
        searchBtn.disabled = true;
        try {
            const docs = await searchOpenLibrary(query);
            if (!docs.length) {
                statusEl.textContent = "No books found on Open Library. You can still fill the form manually.";
                return;
            }
            statusEl.textContent = "Pick a book to fill the form:";
            docs.forEach((doc) =>
                list.appendChild(
                    buildResultItem(doc, async (picked) => {
                        list.replaceChildren();
                        await fillFormFromBook(picked, statusEl);
                    })
                )
            );
        } catch (err) {
            statusEl.textContent = err.message + ". You can still fill the form manually.";
        } finally {
            searchBtn.disabled = false;
        }
    }

    searchBtn.addEventListener("click", runSearch);
});
