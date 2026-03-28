const mysql = require("mysql2");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "0000",
    database: "tonez"
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