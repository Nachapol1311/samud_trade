// หน้า detail-item: แสดงรายละเอียดหนังสือตาม ?id=
// ignore = กลับหน้าเดิม, interest = ไปเลือกหนังสือของเราเพื่อแลก (select-book)
document.addEventListener("DOMContentLoaded", async () => {
    const id = queryId();
    if (!id) return (location.href = "/search");

    const set = (key, value) => (document.getElementById(key).textContent = value);
    try {
        const [book, me] = await Promise.all([api("/books/" + id), getMe()]);

        const img = document.getElementById("d_img");
        img.src = imgSrc(book.picture);
        img.onerror = () => {
            img.onerror = null;
            img.src = PLACEHOLDER_IMG;
        };
        set("d_name", book.name);
        set("d_category", book.category);
        set("d_price", book.price + " ฿");
        set("d_condition", stars(book.condition));
        set("d_owner", book.owner);
        set("d_detail", book.detail || "-");

        const ignoreBtn = document.getElementById("d_ignore");
        const interestBtn = document.getElementById("d_interest");
        const actions = interestBtn.parentElement;

        // admin และเจ้าของหนังสือไม่ต้องแสดงปุ่มสนใจ
        if (me && (me.role === "admin" || me.id === book.ownerId)) actions.hidden = true;

        ignoreBtn.addEventListener("click", () => {
            if (history.length > 1) history.back();
            else location.href = "/search";
        });
        interestBtn.addEventListener("click", () => {
            location.href = me ? "/select-book?want=" + book.id : "/login";
        });
    } catch (err) {
        alert(err.message);
        location.href = "/search";
    }
});
