// เชื่อมต่อฐานข้อมูล MySQL ด้วย connection pool
require("dotenv").config();
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "itds242",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "samud_trade",
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool;
