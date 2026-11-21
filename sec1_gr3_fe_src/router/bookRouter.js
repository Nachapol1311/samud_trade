const express = require("express");
const path = require("path");
const router = express.Router();


router.get("/search", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "html", "search.html"));
});

router.get("/select-book", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "html", "select-book.html"));
});

router.get("/detailitem", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "html", "detailitem.html"));
});

router.get("/additem", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "html", "additem.html"));
});

router.get("/edititem", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "html", "edititem.html"));
});

module.exports = router;