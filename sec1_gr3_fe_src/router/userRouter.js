const express = require("express");
const path = require("path");
const router = express.Router();

// User's router home page in app.js

router.get("/profile", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "html", "home.html"));
});

router.get("/myittem", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "html", "myitem.html"));
});

router.get("/team", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "html", "team.html"));
});

module.exports = router;