// หน้า match: คำขอแลกที่คนอื่นส่งมาหาเรา
// ซ้าย = หนังสือของเขา, ขวา = หนังสือของเรา  กด Accept = ตกลงแลก, Decline = ไม่แลก
document.addEventListener("DOMContentLoaded", async () => {
    await requireLogin("user");
    const box = document.querySelector(".match-container");

    // ตอบรับ / ปฏิเสธ แล้วโหลดรายการใหม่
    async function respond(trade, action, button) {
        const verb = action === "accept" ? "Accept" : "Decline";
        if (!confirm(`${verb} the trade: "${trade.theirBook.name}" for "${trade.myBook.name}"?`)) return;
        button.disabled = true;
        try {
            await api(`/trades/${trade.id}/${action}`, { method: "POST" });
            if (action === "accept") alert("Trade completed! The books have been swapped.");
            load();
        } catch (err) {
            alert(err.message);
            button.disabled = false;
        }
    }

    function buildRequest(trade) {
        const wrap = el("div", "match-request");
        const books = el("div", "match-books");

        const left = el("div", "match-book");
        left.append(el("h2", null, "Offered by " + trade.from), bookCard(trade.theirBook));
        const right = el("div", "match-book");
        right.append(el("h2", null, "Your Book"), bookCard(trade.myBook));
        books.append(left, el("div", "swap-icon", "⇄"), right);

        const actions = el("div", "match-actions");
        const decline = el("button", "decline-btn", "× Decline");
        const accept = el("button", "accept-btn", "✓ Accept");
        decline.type = accept.type = "button";
        decline.addEventListener("click", () => respond(trade, "decline", decline));
        accept.addEventListener("click", () => respond(trade, "accept", accept));
        actions.append(decline, accept);

        wrap.append(books, actions);
        return wrap;
    }

    async function load() {
        try {
            const trades = await api("/trades/incoming");
            if (!trades.length) return showMessage(box, "No trade requests yet.");
            box.replaceChildren(...trades.map(buildRequest));
        } catch (err) {
            showMessage(box, err.message);
        }
    }
    load();
});
