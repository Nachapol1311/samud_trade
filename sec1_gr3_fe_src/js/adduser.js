// หน้า admin-user-add (admin): สร้างบัญชีผู้ใช้ใหม่
document.addEventListener("DOMContentLoaded", async () => {
    await requireLogin("admin");
    const form = document.getElementById("addUserForm");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const password = document.getElementById("password").value;
        if (password !== document.getElementById("confirmPassword").value) {
            return alert("Password does not match");
        }
        const button = form.querySelector(".save-btn");
        button.disabled = true;
        try {
            await api("/accounts", {
                method: "POST",
                body: {
                    role: document.getElementById("admin_user_add_role").value,
                    firstname: document.getElementById("firstname").value,
                    lastname: document.getElementById("lastname").value,
                    username: document.getElementById("username").value,
                    email: document.getElementById("email").value,
                    password,
                },
            });
            location.href = "/user-manage";
        } catch (err) {
            alert(err.message);
            button.disabled = false;
        }
    });
});
