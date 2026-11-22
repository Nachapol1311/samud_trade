// หน้า home / admin-home: แสดงหนังสือล่าสุด 12 เล่ม
document.addEventListener("DOMContentLoaded", async () => {
    const box = document.getElementById("home_content");
    try {
        renderBooks(box, await api("/books?limit=12"));
    } catch (err) {
        showMessage(box, err.message);
    }
});
