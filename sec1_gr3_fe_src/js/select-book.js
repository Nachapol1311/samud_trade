// หน้า select-book: เลือกหนังสือของเราเพื่อแลกกับเล่มที่สนใจ (?want=id) แล้วกด Trade
// สำเร็จ -> คำขอไปอยู่หน้า match ของเจ้าของ และหน้า wait ของเรา
document.addEventListener("DOMContentLoaded", async () => {
    const me = await requireLogin("user");
    const wantId = queryId("want");
    if (!wantId) return (location.href = "/trade");

    const picker = document.getElementById("my-book");
    const status = document.getElementById("status");
    const dialog = document.getElementById("confirm-dialog");
    const tradeButton = document.getElementById("trade");

    let target, myBooks;
    try {
        [target, myBooks] = await Promise.all([api("/books/" + wantId), api("/books/mine")]);
    } catch (err) {
        alert(err.message);
        return (location.href = "/trade");
    }
    if (target.ownerId === me.id) {
        alert("You cannot trade for your own book");
        return (location.href = "/trade");
    }

    // แสดงรูปหนังสือในช่อง cover (ถ้าไม่มีรูปแสดงข้อความ)
    function setCover(div, book) {
        if (book && book.picture) {
            div.textContent = "";
            div.style.backgroundImage = `url("${imgSrc(book.picture)}")`;
            div.style.backgroundSize = "cover";
            div.style.backgroundPosition = "center";
        } else {
            div.style.backgroundImage = "";
            div.textContent = book ? "No image" : "Select a book";
        }
    }

    // หนังสือเป้าหมาย (ฝั่งขวา)
    setCover(document.getElementById("target-cover"), target);
    document.getElementById("target-title").textContent = target.name;
    document.getElementById("target-author").textContent = `${target.category} | by ${target.owner}`;

    // รายการหนังสือของเรา
    myBooks.forEach((book) => {
        const option = el("option", null, book.name);
        option.value = book.id;
        picker.append(option);
    });
    if (!myBooks.length) status.textContent = "You have no books to offer. Please add a book first.";

    const selectedBook = () => myBooks.find((b) => String(b.id) === picker.value);

    picker.addEventListener("change", () => {
        const book = selectedBook();
        setCover(document.getElementById("my-cover"), book);
        document.getElementById("my-title").textContent = book ? book.name : "Your book";
        document.getElementById("my-author").textContent = book ? `${book.category} | ${book.price} ฿` : "No book selected";
        tradeButton.disabled = !book;
        status.textContent = "";
    });

    // ปุ่ม detail เปิดหน้ารายละเอียดในแท็บใหม่
    document.getElementById("my-detail").addEventListener("click", () => {
        const book = selectedBook();
        if (book) window.open("/detail-item?id=" + book.id, "_blank");
        else alert("Please select your book first.");
    });
    document.getElementById("target-detail").addEventListener("click", () => {
        window.open("/detail-item?id=" + target.id, "_blank");
    });

    document.getElementById("cancel").addEventListener("click", () => (location.href = "/trade"));

    tradeButton.addEventListener("click", () => {
        const book = selectedBook();
        if (!book) return;
        document.getElementById("confirm-text").textContent = `Trade "${book.name}" for "${target.name}"?`;
        dialog.showModal();
    });
    document.getElementById("close-dialog").addEventListener("click", () => dialog.close());

    document.getElementById("confirm-trade").addEventListener("click", async () => {
        const book = selectedBook();
        dialog.close();
        if (!book) return;
        tradeButton.disabled = true;
        try {
            await api("/trades", { method: "POST", body: { want_book_id: target.id, offer_book_id: book.id } });
            location.href = "/wait";
        } catch (err) {
            status.textContent = err.message;
            tradeButton.disabled = false;
        }
    });
});
