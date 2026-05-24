const express = require("express");
const router = express.Router();
const db = require("../db");

// 포토카드 저장
router.post("/save", function (req, res) {
    const { userId, filename } = req.body;
    const sql = "INSERT INTO photocards (user_id, filename) VALUES (?, ?)";
    db.query(sql, [userId ?? null, filename], function (err) {
        if (err) {
            console.error("photocard save error:", err);
            return res.status(500).json({ ok: false });
        }
        res.json({ ok: true });
    });
});

// 유저별 포토카드 목록
router.get("/list", function (req, res) {
    const { userId } = req.query;
    const sql = "SELECT * FROM photocards WHERE user_id = ? ORDER BY created_at DESC";
    db.query(sql, [userId], function (err, result) {
        if (err) return res.status(500).json({ ok: false });
        res.json({ ok: true, photocards: result });
    });
});

module.exports = router;
