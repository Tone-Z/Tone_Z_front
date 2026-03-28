const express = require("express");
const router = express.Router();
const db = require("../db");

router.post("/", function (req, res) {
    const nic = req.body.nic;
    const pwd = req.body.pwd;

    const chk = "SELECT * FROM users WHERE nickname = ?";

    db.query(chk, [nic], function (err, result) {
        if (err) {
            return res.status(500).json({
                ok: false,
                msg: "서버 오류"
            });
        }

        if (result.length > 0) {
            return res.json({
                ok: false,
                msg: "이미 존재하는 닉네임"
            });
        }

        const sql = "INSERT INTO users (nickname, password) VALUES (?, ?)";

        db.query(sql, [nic, pwd], function (err2, result2) {
            if (err2) {
                return res.status(500).json({
                    ok: false,
                    msg: "회원가입 실패"
                });
            }

            res.json({
                ok: true,
                msg: "회원가입 성공"
            });
        });
    });
});

module.exports = router;