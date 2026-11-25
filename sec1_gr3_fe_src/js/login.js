// หน้า login: ส่ง username / password ไปที่ web service
// สำเร็จ -> admin ไป /admin-home, user ไป /home (web service ตั้ง cookie ให้)
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("login_form");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const button = form.querySelector("button");
        button.disabled = true;
        try {
            const data = await api("/auth/login", {
                method: "POST",
                body: {
                    username: document.getElementById("username").value,
                    password: document.getElementById("password").value,
                },
                redirectOn401: false,
            });
            location.href = data.redirect;
        } catch (err) {
            alert(err.message);
            button.disabled = false;
        }
    });
});

