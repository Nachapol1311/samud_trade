const express = require("express");
const router = express.Router();
const path = require("path");
const app = express();
const dotenv = require('dotenv').config();
const port = process.env.PORT;

app.use(router);


// Import Page Routers
const adminRouter = require("./sec1_gr3_fe_src/router/adminRouter");
const authRouter = require("./sec1_gr3_fe_src/router/authRouter");
const bookRouter = require("./sec1_gr3_fe_src/router/bookRouter");
const tradeRouter = require("./sec1_gr3_fe_src/router/tradeRouter");
const userRouter = require("./sec1_gr3_fe_src/router/userRouter");

app.use(express.static(path.join(__dirname, "sec1_gr3_fe_src")));

// Mount Page Routers
app.use("/auth", authRouter);
app.use("/user", userRouter);
app.use("/books", bookRouter);
app.use("/trade", tradeRouter);
app.use("/admin", adminRouter);


router.get('/', (req,res) => {
    res.sendFile(path.join(__dirname, "html", "home.html"));
});

app.listen(port, () => {
    console.log(`Frontend server listening on port: ${port}`)
});