"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toneData } from "../result/data";

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}


function toneToIcon(tone) {
  if (!tone) return "/img/basic_icon.png";
  if (tone.startsWith("spring")) return "/img/spring_icon.png";
  if (tone.startsWith("summer")) return "/img/summer_icon.png";
  if (tone.startsWith("autumn")) return "/img/autumn_icon.png";
  if (tone.startsWith("winter")) return "/img/winter_icon.png";
  return "/img/basic_icon.png";
}

export default function MyPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 3;

  useEffect(() => {
    const stored = sessionStorage.getItem("loginUser");
    if (!stored) { router.push("/login"); return; }
    const u = JSON.parse(stored);
    setUser(u);

    fetch(`http://localhost:8080/diagnosis/history/${u.id}`)
      .then((r) => r.json())
      .then((json) => { if (json.ok) setHistory(json.history); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const logout = () => {
    sessionStorage.removeItem("loginUser");
    router.push("/");
  };

  const latestTone = history[0]?.tone ?? null;

  const handleSendEmail = async () => {
    if (!email) { setStatus("이메일을 입력해주세요."); return; }
    if (!latestTone) { setStatus("진단 결과가 없어요."); return; }
    setStatus("전송 중...");
    try {
      const resultUrl = `${window.location.origin}/result/${latestTone}`;
      const res = await fetch("/api/result-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: email, resultUrl, userName: user.nickname }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setStatus("전송 완료!");
        setTimeout(() => { setShowModal(false); setEmail(""); setStatus(""); }, 1500);
      } else {
        setStatus("전송 실패: " + (json.message || ""));
      }
    } catch {
      setStatus("전송 실패. 다시 시도해주세요.");
    }
  };

  if (!user) return null;

  return (
    <>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[90%] max-w-[400px] rounded-2xl bg-white px-8 py-7 shadow-xl">
            <h3 className="mb-1 text-[18px] font-bold text-[#555]">이메일로 결과 보내기</h3>
            <p className="mb-5 text-[13px] text-[#999]">가장 최근 진단 결과를 이미지로 보내드릴게요.</p>
            <input
              type="email"
              placeholder="이메일 주소를 입력하세요"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendEmail()}
              className="mb-3 w-full rounded-xl border border-[#eee] px-4 py-3 text-[14px] text-[#333] outline-none focus:border-[#ffb7b1]"
            />
            {status && <p className="mb-3 text-[13px] text-[#ff8b87]">{status}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => { setShowModal(false); setEmail(""); setStatus(""); }}
                className="flex-1 rounded-xl border border-[#eee] py-3 text-[13px] text-[#999] hover:bg-[#f9f9f9]"
              >
                취소
              </button>
              <button
                onClick={handleSendEmail}
                className="flex-1 rounded-xl bg-gradient-to-r from-[#ffb7b1] to-[#ff7070] py-3 text-[13px] font-semibold text-white hover:opacity-90"
              >
                보내기
              </button>
            </div>
          </div>
        </div>
      )}

      <main
        className="h-screen overflow-hidden"
        style={{ backgroundImage: "url('/img/My_Page.png')", backgroundSize: "cover", backgroundPosition: "center top" }}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-8 pt-6">
          <a href="/">
            <img src="/img/logo.png" alt="Tone-Z" className="h-[36px]" />
          </a>
          <button
            onClick={logout}
            className="rounded-full border border-[#ffb7b1] bg-white/70 px-5 py-2 text-[13px] text-[#ff8b87] backdrop-blur-sm hover:bg-white transition"
          >
            로그아웃
          </button>
        </div>

        <div className="mx-auto max-w-[720px] px-6 pb-24">
          {/* 프로필 */}
          <div className="mb-6 flex flex-col items-center pt-36">
            <div className="mb-3 h-[100px] w-[100px] overflow-hidden rounded-full border-4 border-white shadow-md">
              <img
                src={toneToIcon(latestTone)}
                alt="avatar"
                className="h-full w-full object-cover"
                onError={(e) => { e.target.src = "/img/basic_icon.png"; }}
              />
            </div>
            <p className="text-[22px] font-bold text-[#555]">{user.nickname} 님</p>
          </div>

          {/* 이전 결과 */}
          <div className="rounded-2xl bg-white/90 px-6 py-6 shadow-sm backdrop-blur-sm">
            <h3 className="mb-4 text-center text-[16px] font-bold text-[#555]">이전 결과</h3>
            {loading ? (
              <p className="text-center text-[13px] text-[#aaa]">불러오는 중...</p>
            ) : history.length === 0 ? (
              <p className="py-4 text-center text-[13px] text-[#aaa]">아직 진단 결과가 없어요.</p>
            ) : (() => {
                const totalPages = Math.ceil(history.length / PAGE_SIZE);
                const pageItems = history.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
                return (
                  <>
                    <div className="space-y-3">
                      {pageItems.map((item) => {
                        const d = toneData[item.tone];
                        return (
                          <div key={item.id} className="rounded-xl border border-[#f5f5f5] bg-white px-5 py-4 shadow-sm">
                            <p className="text-[12px] text-[#bbb]">{formatDate(item.created_at)}</p>
                            <p className="text-[14px] font-semibold text-[#555]">{d?.type ?? item.tone}</p>
                            <p className="mt-1 truncate text-[12px] text-[#888]">{d?.desc ?? ""}</p>
                          </div>
                        );
                      })}
                    </div>
                    {totalPages > 1 && (
                      <div className="mt-5 flex items-center justify-center gap-2">
                        {Array.from({ length: totalPages }).map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setPage(i)}
                            className={`h-[8px] rounded-full transition-all duration-300 ${
                              i === page ? "w-[28px] bg-[#ffb7b1]" : "w-[8px] bg-[#e0e0e0]"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="fixed bottom-5 left-0 right-0 flex justify-center gap-4 bg-white/80 px-6 py-4 backdrop-blur-sm">
          <button
            onClick={() => router.push("/scan")}
            className="rounded-full border-2 border-[#ffb7b1] px-8 py-3 text-[14px] font-semibold text-[#ff8b87] hover:bg-[#fff0f0] transition"
          >
            {history.length > 0 ? "다시 진단하기" : "진단하기"}
          </button>
          {history.length > 0 && (
            <button
              onClick={() => setShowModal(true)}
              className="rounded-full bg-gradient-to-r from-[#ffb7b1] to-[#ff7070] px-8 py-3 text-[14px] font-semibold text-white shadow-md hover:opacity-90 transition"
            >
              이메일로 결과 공유하기
            </button>
          )}
        </div>
      </main>

      <button
        onClick={() => router.push("/chatbot")}
        className="fixed bottom-8 right-8 h-[70px] w-[70px]"
      >
        <img src="/img/chatbot_icon.png" alt="챗봇" className="h-full w-full" />
      </button>

    </>
  );
}
