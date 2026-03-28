const express = require("express");
const router = express.Router();
const db = require("../db");

router.post("/", function (req, res) {
    const nic = req.body.nic;
    const pwd = req.body.pwd;

    const sql = "SELECT * FROM users WHERE nickname = ? AND password = ?";

    db.query(sql, [nic, pwd], function (err, result) {
        if (err) {
            return res.status(500).json({
                ok: false,
                msg: "서버 오류"
            });
        }

        if (result.length > 0) {
            res.json({
                ok: true,
                msg: "로그인 성공",
                user: result[0]
            });
        } else {
            res.json({
                ok: false,
                msg: "회원정보 없음"
            });
        }
    });
});

module.exports = router;