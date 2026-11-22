// หน้า search: ค้นหาหนังสือ (ไม่ใส่เกณฑ์ = แสดงทั้งหมด, ใส่คำบางส่วนก็ค้นเจอ)
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("search_form");
    const results = document.getElementById("search_results");
    const status = document.getElementById("search_status");

    async function runSearch() {
        const params = new URLSearchParams();
        const add = (key, value) => value && params.set(key, value);
        add("name", document.getElementById("name").value.trim());
        add("category", document.getElementById("category").value);
        add("min", document.getElementById("min").value);
        add("max", document.getElementById("max").value);
        const cond = form.querySelector('input[name="condition"]:checked');
        add("condition", cond ? cond.value : "");

        try {
            const books = await api("/books?" + params.toString());
            status.textContent = `${books.length} book(s) found`;
            renderBooks(results, books);
        } catch (err) {
            status.textContent = "";
            showMessage(results, err.message);
        }
    }

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        runSearch();
    });
    // กด Clear แล้วแสดงหนังสือทั้งหมดอีกครั้ง
    form.addEventListener("reset", () => setTimeout(runSearch, 0));
    runSearch();
});
