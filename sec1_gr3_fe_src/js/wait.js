// หน้า wait: คำขอแลกที่เราส่งไปแล้วและเจ้าของยังไม่ตอบรับ (กดยกเลิกได้)
// ซ้าย = หนังสือที่เราอยากได้, ขวา = หนังสือของเราที่เสนอ
document.addEventListener("DOMContentLoaded", async () => {
    await requireLogin("user");
    const box = document.querySelector(".wait-container");

    function buildRequest(trade) {
        const wrap = el("div", "wait-request");
        const books = el("div", "wait-books");

        const left = el("div", "wait-book");
        left.append(el("h2", null, "You want (" + trade.to + ")"), bookCard(trade.theirBook));
        const right = el("div", "wait-book");
        right.append(el("h2", null, "Your Book (offered)"), bookCard(trade.myBook));
        books.append(left, el("div", "wait-swap", "⇄"), right);

        const actions = el("div", "wait-actions");
        const cancel = el("button", "cancel-request-btn", "× Cancel Request");
        cancel.type = "button";
        cancel.addEventListener("click", async () => {
            if (!confirm("Cancel this trade request?")) return;
            cancel.disabled = true;
            try {
                await api(`/trades/${trade.id}/cancel`, { method: "POST" });
                load();
            } catch (err) {
                alert(err.message);
                cancel.disabled = false;
            }
        });
        actions.append(cancel);

        wrap.append(books, actions);
        return wrap;
    }

    async function load() {
        try {
            const trades = await api("/trades/outgoing");
            if (!trades.length) return showMessage(box, "You have no pending trade requests.");
            box.replaceChildren(...trades.map(buildRequest));
        } catch (err) {
            showMessage(box, err.message);
        }
    }
    load();
});
