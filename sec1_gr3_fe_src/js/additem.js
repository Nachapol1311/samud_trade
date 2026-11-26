// หน้า additem (user) และ admin-product-add (admin): เพิ่มหนังสือ + อัปโหลดรูป
// owner จะแสดงและบันทึกเป็น username ของบัญชีที่ login อยู่
document.addEventListener("DOMContentLoaded", async () => {
    const isAdminPage = location.pathname.startsWith("/admin");
    const me = await requireLogin(isAdminPage ? "admin" : "user");

    document.getElementById("book_owner").textContent = me.username;
    const saveBtn = document.getElementById("saveBtn");
    const bookForm = document.getElementById("bookForm");

    bookForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const name = document.getElementById("book_name").value.trim();
        const category = document.getElementById("category").value;
        const price = document.getElementById("book_price").value.trim();
        const cond = document.querySelector('input[name="condition"]:checked');
        const detail = document.getElementById("book_detail").value.trim();
        const image = document.getElementById("book_image").files[0];

        if (!name) return alert("Please enter the book name");
        if (!category) return alert("Please select a category");
        if (price === "" || Number(price) < 0 || isNaN(Number(price))) return alert("Please enter a valid price");
        if (!cond) return alert("Please select the condition");

        const form = new FormData();
        form.append("name", name);
        form.append("category", category);
        form.append("price", price);
        form.append("condition", cond.value);
        form.append("detail", detail);
        if (image) form.append("image", image);

        saveBtn.disabled = true;
        try {
            await api("/books", { method: "POST", form });
            location.href = isAdminPage ? "/product-manage" : "/my-item";
        } catch (err) {
            alert(err.message);
            saveBtn.disabled = false;
        }
    });
});
