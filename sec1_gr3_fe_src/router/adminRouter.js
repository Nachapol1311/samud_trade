const express = require("express")
const path = require("path")
const router = express.Router()

// admin home
router.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "html", "admin", "admin-home.html"))
});

// admin management
router.get("/management", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "html", "admin", "admin-management.html"))
});

// admin product-add
router.get("/product-add", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "html", "admin", "admin-product-add.html"))
});

// admin profile
router.get("/profile", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "html", "admin", "admin-profile.html"))
});

// admin user-add
router.get("/user-add", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "html", "admin", "admin-user-add.html"))
});

// admin edituser
router.get("/edituser", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "html", "admin", "edituser.html"))
});

// admin productManagement
router.get("/productManagement", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "html", "admin", "productManagement.html"))
});

// admin userManagement
router.get("/userManagement", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "html", "admin", "userManagement.html"))
});

module.exports = router;