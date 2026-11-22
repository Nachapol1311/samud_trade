// หน้า trade: แสดงหนังสือของคนอื่นทีละเล่ม
// ★ สนใจ -> ไปหน้า select-book, × ไม่สนใจ -> แสดงเล่มอื่นให้
document.addEventListener("DOMContentLoaded", async () => {
    await requireLogin("user");

    const content = document.querySelector(".trade-content");
    const card = document.getElementById("tradeCard");
    const buttons = document.querySelector(".trade-buttons");
    const accept = document.getElementById("tradeAccept");
    const reject = document.getElementById("tradeReject");
    const seen = []; // id ของเล่มที่กดไม่สนใจแล้ว

    // ข้อความเมื่อไม่มีหนังสือเหลือ + ปุ่มเริ่มใหม่
    const empty = el("div");
    empty.hidden = true;
    const emptyText = el("p", "info", "No more books to show.");
    const restart = el("button", null, "Start over");
    restart.type = "button";
    empty.append(emptyText, restart);
    content.prepend(empty);

    async function loadNext() {
        try {
            const { book } = await api("/books/next?seen=" + seen.join(","));
            const none = !book;
            card.hidden = none;
            buttons.hidden = none;
            empty.hidden = !none;
            if (none) return;

            const img = card.querySelector("img");
            img.src = imgSrc(book.picture);
            img.alt = book.name;
            img.onerror = () => {
                img.onerror = null;
                img.src = PLACEHOLDER_IMG;
            };
            card.querySelector(".itemname").textContent = book.name;
            card.querySelector(".info").textContent = bookInfo(book);
            card.querySelector("a").href = "/detail-item?id=" + book.id;
            accept.href = "/select-book?want=" + book.id;
            card.dataset.bookId = book.id;
        } catch (err) {
            card.hidden = true;
            buttons.hidden = true;
            empty.hidden = false;
            emptyText.textContent = err.message;
        }
    }

    reject.addEventListener("click", () => {
        seen.push(card.dataset.bookId);
        loadNext();
    });
    restart.addEventListener("click", () => {
        seen.length = 0;
        loadNext();
    });
    loadNext();
});
