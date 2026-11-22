// หน้า my-item: แสดงหนังสือของเราทั้งหมด พร้อมปุ่มแก้ไข (edit) และลบ (remove)
document.addEventListener("DOMContentLoaded", async () => {
    await requireLogin("user");
    const box = document.getElementById("myitem_list");

    async function load() {
        try {
            const books = await api("/books/mine");
            if (!books.length) return showMessage(box, "You have no books yet. Click add product to add one.");

            box.replaceChildren(
                ...books.map((book) => {
                    const edit = el("a", "editbtn", "edit");
                    edit.href = "/edit-item?id=" + book.id;

                    const remove = el("button", "removebtn", "remove");
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
                    // ไม่แสดงปุ่ม detail ในหน้านี้ (เปลี่ยนเป็น remove)
                    return bookCard(book, { detail: false, extra: [edit, remove] });
                })
            );
        } catch (err) {
            showMessage(box, err.message);
        }
    }
    load();
});
