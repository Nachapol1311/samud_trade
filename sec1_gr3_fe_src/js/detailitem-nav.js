
document.addEventListener("DOMContentLoaded", () => {

    // Role สำหรับทดลองก่อนเชื่อม Database
    const role = sessionStorage.getItem("role") || "user";

    const userNav = document.getElementById("userNav");
    const adminNav = document.getElementById("adminNav");

    const homeLink = document.getElementById("homeLink");
    const profileLink = document.getElementById("profileLink");

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
