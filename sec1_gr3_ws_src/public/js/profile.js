// หน้า profile (user) และ admin-profile: แสดงข้อมูลบัญชีที่ login อยู่ และ Logout
// admin-profile มีปุ่ม Edit Profile (แก้ชื่อ นามสกุล อีเมล) และ Edit Photo (เปลี่ยนรูป)
document.addEventListener("DOMContentLoaded", async () => {
    const me = await requireLogin();

    const fields = ["username", "firstname", "lastname", "email"];
    const avatar = document.getElementById("avatar");

    function showProfile(data) {
        fields.forEach((key) => (document.getElementById(key).value = data[key] || ""));
        if (data.picture) {
            let img = avatar.querySelector("img");
            if (!img) {
                img = el("img");
                avatar.append(img);
            }
            img.alt = "Profile Image";
            img.hidden = false;
            img.src = imgSrc(data.picture);
        }
    }
    showProfile(me);

    // Logout: ลบ cookie แล้วกลับไปหน้า login
    document.querySelector(".logout-btn").addEventListener("click", async (e) => {
        e.preventDefault();
        try {
            await api("/auth/logout", { method: "POST", redirectOn401: false });
        } finally {
            location.href = "/login";
        }
    });

    // ----- เฉพาะหน้า admin-profile -----
    const editBtn = document.getElementById("editBtn");
    if (!editBtn) return;

    const editable = ["firstname", "lastname", "email"].map((k) => document.getElementById(k));
    let editing = false;

    editBtn.addEventListener("click", async () => {
        if (!editing) {
            editing = true;
            editable.forEach((i) => (i.disabled = false));
            editBtn.textContent = "Save";
            editable[0].focus();
            return;
        }
        try {
            await api("/auth/me", {
                method: "PUT",
                body: {
                    firstname: editable[0].value,
                    lastname: editable[1].value,
                    email: editable[2].value,
                },
            });
            editing = false;
            editable.forEach((i) => (i.disabled = true));
            editBtn.textContent = "Edit Profile";
            alert("Profile updated");
        } catch (err) {
            alert(err.message);
        }
    });

    // เปลี่ยนรูปโปรไฟล์
    const upload = document.getElementById("uploadProfile");
    upload.addEventListener("change", async () => {
        if (!upload.files[0]) return;
        const form = new FormData();
        form.append("image", upload.files[0]);
        try {
            await api("/auth/me", { method: "PUT", form });
            showProfile(await api("/auth/me"));
        } catch (err) {
            alert(err.message);
        }
    });
});
