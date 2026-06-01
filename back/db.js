const mysql = require("mysql2");
require("dotenv").config();

const db = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "0000",
    database: process.env.DB_NAME || "tonez"
});

db.connect(function (err) {
    if (err) {
        console.log("DB 연결 실패");
        console.log(err);
        return;
    }
    console.log("DB 연결 성공");
});

module.exports = db;