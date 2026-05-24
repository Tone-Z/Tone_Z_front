const express = require("express");
const router = express.Router();
const db = require("../db");

router.post("/save", (req, res) => {
    const { userId, tone } = req.body;
    if (!userId || !tone) return res.status(400).json({ ok: false, message: "필수 값 누락" });
    db.query(
        "INSERT INTO diagnoses (user_id, tone) VALUES (?, ?)",
        [userId, tone],
        (err) => {
            if (err) return res.status(500).json({ ok: false, message: err.message });
            res.json({ ok: true });
        }
    );
});

router.get("/history/:userId", (req, res) => {
    const { userId } = req.params;
    db.query(
        "SELECT id, tone, created_at FROM diagnoses WHERE user_id = ? ORDER BY created_at DESC LIMIT 20",
        [userId],
        (err, results) => {
            if (err) return res.status(500).json({ ok: false, message: err.message });
            res.json({ ok: true, history: results });
        }
    );
});

module.exports = router;
