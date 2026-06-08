"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const keywordsByTone = {
  spring: ["봄웜 유튜버 추천", "봄웜 립 추천", "봄웜 치크 추천", "봄웜 코디 추천"],
  summer: ["여름쿨 유튜버 추천", "여름쿨 립 추천", "여름쿨 블러셔 추천", "여름쿨 코디 추천"],
  autumn: ["가을웜 유튜버 추천", "가을웜 립 추천", "가을웜 치크 추천", "가을웜 코디 추천"],
  winter: ["겨울쿨 유튜버 추천", "겨울쿨 립 추천", "겨울쿨 블러셔 추천", "겨울쿨 코디 추천"],
  default: ["봄웜 코디 추천", "여름쿨 립 추천", "가을웜 유튜버 추천", "겨울쿨 코디 추천", "퍼스널컬러란?"],
};

function getKeywords(tone) {
  if (!tone) return keywordsByTone.default;
  if (tone.startsWith("spring")) return keywordsByTone.spring;
  if (tone.startsWith("summer")) return keywordsByTone.summer;
  if (tone.startsWith("autumn")) return keywordsByTone.autumn;
  if (tone.startsWith("winter")) return keywordsByTone.winter;
  return keywordsByTone.default;
}

export default function ChatbotPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [tone, setTone] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [showKeywords, setShowKeywords] = useState(true);
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [currentConvId, setCurrentConvId] = useState(null);
  const [loadingConv, setLoadingConv] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("loginUser");
    const userTone = sessionStorage.getItem("user_tone");

    let nickname = "사용자";
    if (stored) {
      const u = JSON.parse(stored);
      setUser(u);
      nickname = u.nickname || "사용자";
      if (userTone) {
        setTone(userTone);
      } else {
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/diagnosis/history/${u.id}`)
          .then((r) => r.json())
          .then((json) => {
            if (json.ok && json.history.length > 0) setTone(json.history[0].tone);
          })
          .catch(() => {});
      }
      fetchConversations(u.id);
    } else {
      if (userTone) setTone(userTone);
    }

    setMessages([
      {
        role: "assistant",
        content: `안녕 ${nickname}님! 톤즈에요!! 오늘은 뷰티 관련해서 어떤 도와줄 일이 있나요? 💄👀`,
      },
    ]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchConversations = async (userId) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chatbot/conversations/${userId}`);
      const json = await res.json();
      if (json.ok) setConversations(json.conversations);
    } catch {}
  };

  const loadConversation = async (convId) => {
    setCurrentConvId(convId);
    setShowKeywords(false);
    setLoadingConv(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chatbot/conversation/${convId}/messages`);
      const json = await res.json();
      if (json.ok) {
        setMessages(json.messages.map((m) => ({ role: m.role, content: m.content })));
      }
    } catch {}
    setLoadingConv(false);
  };

  const startNew = () => {
    setCurrentConvId(null);
    setMessages([]);
    setShowKeywords(true);
    setInput("");
  };

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput("");
    setShowKeywords(false);

    const newMessages = [...messages, { role: "user", content: msg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          history: messages,
          tone,
          userId: user?.id,
          conversationId: currentConvId,
          userName: user?.nickname,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        const baseMessages = json.censoredMessage
          ? [...messages, { role: "user", content: json.censoredMessage }]
          : newMessages;
        setMessages([...baseMessages, { role: "assistant", content: json.reply }]);
        if (json.conversationId && !currentConvId) {
          setCurrentConvId(json.conversationId);
          if (user) fetchConversations(user.id);
        }
      } else {
        setMessages([...newMessages, { role: "assistant", content: "오류: " + (json.message || "알 수 없는 오류") }]);
      }
    } catch (e) {
      setMessages([...newMessages, { role: "assistant", content: "연결 실패: " + e.message }]);
    } finally {
      setLoading(false);
    }
  };

  const keywords = getKeywords(tone);
  const displayName = user?.nickname ?? "사용자";

  return (
    <div className="flex h-screen overflow-hidden bg-[#fff8f8]">
      {/* Sidebar — logged-in users only */}
      {user && (
        <aside className="w-[220px] flex-shrink-0 flex flex-col bg-[#f9f0f1] border-r border-[#f0e0e0]">
          <div className="px-5 py-4 border-b border-[#f0e0e0]">
            <Link href="/">
              <img src="/img/logo.png" alt="Tone-Z" className="h-[40px]" />
            </Link>
          </div>
          <button
            onClick={startNew}
            className="mx-3 mt-3 rounded-xl border border-[#ffb7b1] bg-white px-3 py-2 text-[13px] text-[#ff8b87] hover:bg-[#fff0f0] transition text-left"
          >
            + 새 대화
          </button>
          <div className="flex-1 overflow-y-auto mt-2 px-2 pb-4">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => loadConversation(conv.id)}
                className={`w-full text-left rounded-xl px-3 py-2 mb-1 text-[13px] text-[#666] hover:bg-white transition truncate ${
                  currentConvId === conv.id ? "bg-white font-semibold text-[#ff8b87]" : ""
                }`}
              >
                {conv.title || "대화"}
              </button>
            ))}
          </div>
        </aside>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between px-8 py-4 border-b border-[#f0e0e0] bg-white flex-shrink-0">
          {!user ? (
            <Link href="/">
              <img src="/img/logo.png" alt="Tone-Z" className="h-[40px]" />
            </Link>
          ) : (
            <div />
          )}
          <div>
            {user ? (
              <button
                onClick={() => router.push("/mypage")}
                className="text-[20px] text-[#ff8b87]"
              >
                {user.nickname}님
              </button>
            ) : (
              <Link href="/login" className="text-[20px] text-[#ff8b87]">
                로그인
              </Link>
            )}
          </div>
        </header>

        {/* Chat content */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 && !loadingConv ? (
            <div className="flex flex-col items-center justify-center h-full pb-32">
              <p className="text-[15px] font-bold text-[#ff8b87] mb-4">Chat Bot</p>
              <div className="w-[76px] h-[76px] rounded-full bg-gradient-to-br from-[#ffb7b1] to-[#ff7070] flex items-center justify-center mb-5 shadow-md">
                <img src="/img/chatbot_icon.png" alt="chatbot" className="w-[46px] h-[46px]" />
              </div>
              <p className="text-[18px] font-bold text-[#555]">
                {displayName}님 무엇을 도와드릴까요?
              </p>
            </div>
          ) : (
            <div className="max-w-[800px] mx-auto w-full px-6 py-8 space-y-6">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} items-end gap-3`}
                >
                  {msg.role === "assistant" && (
                    <img src="/img/chatbot_icon.png" className="w-[44px] h-[44px] flex-shrink-0" />
                  )}
                  <div
                    className={`max-w-[72%] rounded-2xl px-5 py-4 text-[16px] leading-relaxed whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-gradient-to-r from-[#ffb7b1] to-[#ff7070] text-white rounded-br-sm"
                        : "bg-white text-[#444] shadow-sm rounded-bl-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start items-end gap-3">
                  <img src="/img/chatbot_icon.png" className="w-[44px] h-[44px] flex-shrink-0" />
                  <div className="bg-white rounded-2xl rounded-bl-sm px-5 py-4 text-[16px] text-[#bbb] shadow-sm">
                    생각 중...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="flex-shrink-0 px-6 py-5 bg-white border-t border-[#f0e0e0]">
          <div className="max-w-[800px] mx-auto">
            <div className="flex items-center gap-3 rounded-2xl border border-[#eeeeee] bg-[#fdf8f8] px-5 py-4">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="무엇이든 물어보세요"
                className="flex-1 bg-transparent text-[16px] text-[#333] outline-none placeholder:text-[#ccc]"
              />
              <button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                className="w-[44px] h-[44px] rounded-full bg-gradient-to-r from-[#ffb7b1] to-[#ff7070] flex items-center justify-center disabled:opacity-40 transition flex-shrink-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                  <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                </svg>
              </button>
            </div>
            {showKeywords && (
              <div className="mt-4 flex flex-wrap gap-3">
                {keywords.map((kw, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(kw)}
                    className="rounded-full border border-[#f0e0e0] bg-white px-5 py-2.5 text-[15px] text-[#666] hover:bg-[#fff0f0] hover:border-[#ffb7b1] transition"
                  >
                    {i === 0 && <span className="mr-1">🌸</span>}
                    {kw}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
