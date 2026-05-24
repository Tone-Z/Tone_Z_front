const express = require("express");
const router = express.Router();
const db = require("../db");

router.post("/conversation", (req, res) => {
  const { userId, title } = req.body;
  if (!userId) return res.status(400).json({ ok: false, message: "userId 누락" });
  db.query(
    "INSERT INTO conversations (user_id, title) VALUES (?, ?)",
    [userId, title || "대화"],
    (err, result) => {
      if (err) return res.status(500).json({ ok: false, message: err.message });
      res.json({ ok: true, conversationId: result.insertId });
    }
  );
});

router.get("/conversations/:userId", (req, res) => {
  db.query(
    "SELECT id, title, created_at FROM conversations WHERE user_id = ? ORDER BY created_at DESC LIMIT 30",
    [req.params.userId],
    (err, rows) => {
      if (err) return res.status(500).json({ ok: false, message: err.message });
      res.json({ ok: true, conversations: rows });
    }
  );
});

router.get("/conversation/:id/messages", (req, res) => {
  db.query(
    "SELECT role, content FROM chat_messages WHERE conversation_id = ? ORDER BY created_at ASC",
    [req.params.id],
    (err, rows) => {
      if (err) return res.status(500).json({ ok: false, message: err.message });
      res.json({ ok: true, messages: rows });
    }
  );
});

router.post("/message", (req, res) => {
  const { conversationId, userMessage, assistantMessage } = req.body;
  if (!conversationId) return res.status(400).json({ ok: false, message: "conversationId 누락" });
  db.query(
    "INSERT INTO chat_messages (conversation_id, role, content) VALUES (?, 'user', ?), (?, 'assistant', ?)",
    [conversationId, userMessage, conversationId, assistantMessage],
    (err) => {
      if (err) return res.status(500).json({ ok: false, message: err.message });
      res.json({ ok: true });
    }
  );
});

module.exports = router;
