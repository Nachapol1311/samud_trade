
document.addEventListener("DOMContentLoaded", () => {

    // Role สำหรับทดลองก่อนเชื่อม Database
    const role = sessionStorage.getItem("role") || "user";

    const homeLink = document.getElementById("homeLink");
    const cancelLink = document.getElementById("cancelLink");

    if (role === "admin") {

        homeLink.href = "admin-home.html";
        cancelLink.href = "ProductManage.html";

    } else {

        homeLink.href = "home.html";
        cancelLink.href = "myitem.html";

    }

});
