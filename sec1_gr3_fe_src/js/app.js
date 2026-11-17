const express = require("express");
const router = express.Router();
const path = require("path");
const app = express();
const dotenv = require('dotenv').config();
const port = process.env.PORT;