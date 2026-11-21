// หน้า product-manage (admin): ค้นหา / แก้ไข / ลบ หนังสือ
document.addEventListener("DOMContentLoaded", async () => {
    await requireLogin("admin");

    const body = document.getElementById("productTableBody");
    const form = document.getElementById("productSearchForm");
    const input = document.getElementById("productSearchInput");

    function row(book) {
        const tr = el("tr");
        const actions = el("div", "manage-buttons");

        const edit = el("a", "edit-btn", "Edit");
        edit.href = "/edit-item?id=" + book.id;
        const remove = el("button", "remove-btn", "Remove");
        remove.type = "button";
        remove.addEventListener("click", async () => {
            if (!confirm(`Remove "${book.name}"?`)) return;
            try {
                await api("/books/" + book.id, { method: "DELETE" });
                load();
            } catch (err) {
                alert(err.message);
            }
        });
        actions.append(edit, remove);

        const manage = el("td");
        manage.append(actions);
        tr.append(el("td", null, book.id), el("td", null, `${book.name} (by ${book.owner})`), manage);
        return tr;
    }

    async function load() {
        try {
            const books = await api("/books?limit=500&name=" + encodeURIComponent(input.value.trim()));
            if (!books.length) {
                const td = el("td", null, "No books found.");
                td.colSpan = 3;
                const tr = el("tr");
                tr.append(td);
                return body.replaceChildren(tr);
            }
            body.replaceChildren(...books.map(row));
        } catch (err) {
            alert(err.message);
        }
    }

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        load();
    });
    load();
});
