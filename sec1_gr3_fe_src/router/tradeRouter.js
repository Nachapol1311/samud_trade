const express = require("express");
const path = require("path");
const router = express.Router();


router.get("/trade", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "html", "trade.html"));
});

router.get("/match", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "html", "match.html"));
});

router.get("/wait", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "html", "wait.html"));
});

module.exports = router;