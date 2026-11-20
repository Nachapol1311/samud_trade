document.addEventListener("DOMContentLoaded", () => {
    const userNav = document.getElementById("userNav");
    const adminNav = document.getElementById("adminNav");

    const homeLink = document.getElementById("homeLink");
    const profileLink = document.getElementById("profileLink");

    // ทดลองก่อนเชื่อม Database
    //ตอนนี้ const role = "user" เป็นค่าทดลองเท่านั้น ไม่ได้ตรวจสอบบัญชีจริง เมื่อเชื่อม Login กับ Database ต้องให้ Backend ยืนยันตัวตนและส่ง Role ของบัญชีที่ Login มาให้ JavaScript ใช้ โดยไม่เชื่อค่าที่ผู้ใช้แก้เองในเบราว์เซอร์สำหรับการอนุญาตเข้าถึงหน้าจัดการ
    const role = sessionStorage.getItem("role") || "user";

    if (role === "admin") {
        userNav.hidden = true;
        adminNav.hidden = false;

        homeLink.href = "admin-home.html";
        profileLink.href = "admin-profile.html";
    } else {
        userNav.hidden = false;
        adminNav.hidden = true;

        homeLink.href = "home.html";
        profileLink.href = "profile.html";
    }
});
