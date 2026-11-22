// หน้า user-manage (admin): ค้นหา / แก้ไข / ลบ บัญชีผู้ใช้
document.addEventListener("DOMContentLoaded", async () => {
    const me = await requireLogin("admin");

    const body = document.getElementById("userTableBody");
    const form = document.getElementById("userSearchForm");
    const input = document.getElementById("userSearchInput");
    const roleFilter = document.getElementById("userRoleFilter");

    function row(acc) {
        const tr = el("tr");
        const actions = el("div", "manage-buttons");

        const edit = el("a", "edit-btn", "Edit");
        edit.href = "/edit-user?id=" + acc.id;
        const remove = el("button", "remove-btn", "Remove");
        remove.type = "button";
        remove.disabled = acc.id === me.id; // ลบบัญชีตัวเองไม่ได้
        remove.addEventListener("click", async () => {
            if (!confirm(`Remove user "${acc.username}" and all of their books?`)) return;
            try {
                await api("/accounts/" + acc.id, { method: "DELETE" });
                load();
            } catch (err) {
                alert(err.message);
            }
        });
        actions.append(edit, remove);

        const manage = el("td");
        manage.append(actions);
        tr.append(
            el("td", null, acc.role),
            el("td", null, acc.username),
            el("td", null, `${acc.firstname || ""} ${acc.lastname || ""}`.trim()),
            manage
        );
        return tr;
    }

    async function load() {
        try {
            // ส่งเกณฑ์ค้นหาไปที่ web service: keyword (ค้นจากทุกช่อง) และ role (ถ้าเลือก)
            const params = new URLSearchParams();
            if (input.value.trim()) params.set("keyword", input.value.trim());
            if (roleFilter.value) params.set("role", roleFilter.value);
            const accounts = await api("/accounts?" + params.toString());
            if (!accounts.length) {
                const td = el("td", null, "No users found.");
                td.colSpan = 4;
                const tr = el("tr");
                tr.append(td);
                return body.replaceChildren(tr);
            }
            body.replaceChildren(...accounts.map(row));
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
