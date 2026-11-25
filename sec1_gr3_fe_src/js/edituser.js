// หน้า edit-user (admin): แก้ไขบัญชีผู้ใช้ตาม ?id= (ไม่กรอก password = ไม่เปลี่ยนรหัสผ่าน)
document.addEventListener("DOMContentLoaded", async () => {
    await requireLogin("admin");
    const id = queryId();
    if (!id) return (location.href = "/user-manage");

    const form = document.getElementById("editUserForm");
    const preview = document.getElementById("profilePreview");
    const fileInput = document.getElementById("profileImage");
    const value = (key) => document.getElementById(key);

    try {
        const acc = await api("/accounts/" + id);
        value("role").value = acc.role;
        value("firstname").value = acc.firstname || "";
        value("lastname").value = acc.lastname || "";
        value("username").value = acc.username;
        value("email").value = acc.email || "";
        if (acc.picture) preview.src = imgSrc(acc.picture);
    } catch (err) {
        alert(err.message);
        return (location.href = "/user-manage");
    }

    fileInput.addEventListener("change", () => {
        if (fileInput.files[0]) preview.src = URL.createObjectURL(fileInput.files[0]);
    });

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const password = value("password").value;
        if (password !== value("confirmPassword").value) return alert("Password does not match");

        const data = new FormData();
        ["role", "firstname", "lastname", "username", "email"].forEach((k) => data.append(k, value(k).value));
        if (password) data.append("password", password);
        if (fileInput.files[0]) data.append("image", fileInput.files[0]);

        const button = form.querySelector(".save-btn");
        button.disabled = true;
        try {
            await api("/accounts/" + id, { method: "PUT", form: data });
            location.href = "/user-manage";
        } catch (err) {
            alert(err.message);
            button.disabled = false;
        }
    });
});

