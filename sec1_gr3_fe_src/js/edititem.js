// หน้า edit-item: แก้ไขหนังสือตาม ?id= (เจ้าของหรือ admin เท่านั้น)
document.addEventListener("DOMContentLoaded", async () => {
    const id = queryId();
    const me = await requireLogin();
    const isAdmin = me.role === "admin";

    // Cancel / กลับหลังบันทึก: admin -> product-manage, user -> my-item
    const backUrl = isAdmin ? "/product-manage" : "/my-item";
    document.getElementById("cancelLink").href = backUrl;
    if (!id) return (location.href = backUrl);

    const preview = document.getElementById("book_preview");
    const fileInput = document.getElementById("book_image");
    const saveBtn = document.getElementById("saveBtn");

    let book;
    try {
        book = await api("/books/" + id);
    } catch (err) {
        alert(err.message);
        return (location.href = backUrl);
    }
    if (!isAdmin && book.ownerId !== me.id) {
        alert("You can edit only your own books");
        return (location.href = backUrl);
    }

    // ใส่ข้อมูลเดิมลงฟอร์ม
    document.getElementById("book_name").value = book.name;
    document.getElementById("category").value = book.category;
    document.getElementById("book_price").value = book.price;
    document.getElementById("book_detail").value = book.detail || "";
    document.getElementById("book_owner").textContent = book.owner;
    const radio = document.querySelector(`input[name="condition"][value="${book.condition}"]`);
    if (radio) radio.checked = true;
    preview.src = imgSrc(book.picture);
    preview.onerror = () => {
        preview.onerror = null;
        preview.src = PLACEHOLDER_IMG;
    };

    // แสดงตัวอย่างรูปใหม่ที่เลือก
    fileInput.addEventListener("change", () => {
        if (fileInput.files[0]) preview.src = URL.createObjectURL(fileInput.files[0]);
    });

    saveBtn.addEventListener("click", async () => {
        const name = document.getElementById("book_name").value.trim();
        const category = document.getElementById("category").value;
        const price = document.getElementById("book_price").value.trim();
        const cond = document.querySelector('input[name="condition"]:checked');

        if (!name) return alert("Please enter the book name");
        if (!category) return alert("Please select a category");
        if (price === "" || Number(price) < 0 || isNaN(Number(price))) return alert("Please enter a valid price");
        if (!cond) return alert("Please select the condition");

        const form = new FormData();
        form.append("name", name);
        form.append("category", category);
        form.append("price", price);
        form.append("condition", cond.value);
        form.append("detail", document.getElementById("book_detail").value.trim());
        if (fileInput.files[0]) form.append("image", fileInput.files[0]);

        saveBtn.disabled = true;
        try {
            await api("/books/" + id, { method: "PUT", form });
            location.href = backUrl;
        } catch (err) {
            alert(err.message);
            saveBtn.disabled = false;
        }
    });
});

// Testing Update book
// method: put
// http://localhost:3000/books/id
// body: raw JSON
// {
//   "name": "newtestBook",
//   "category": "novel",
//   "price": 250,
//   "condition": 2,
//   "detail": "good"
// }