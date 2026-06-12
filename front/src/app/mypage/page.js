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
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const [photoPage, setPhotoPage] = useState(0);
  const PHOTO_PAGE_SIZE = 4;
  const [photocards, setPhotocards] = useState([]);
  const [tab, setTab] = useState("results");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const PAGE_SIZE = isFullscreen ? 5 : 3;

  useEffect(() => {
    const update = () => setIsFullscreen(window.innerHeight >= window.screen.height - 50);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    const stored = sessionStorage.getItem("loginUser");
    if (!stored) { router.push("/login"); return; }
    const u = JSON.parse(stored);
    setUser(u);

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/diagnosis/history/${u.id}`)
      .then((r) => r.json())
      .then((json) => { if (json.ok) setHistory(json.history); })
      .catch(() => {})
      .finally(() => setLoading(false));

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/photocard/list?userId=${u.id}`)
      .then((r) => r.json())
      .then((json) => { if (json.ok) setPhotocards(json.photocards.filter(p => p.url)); })
      .catch(() => {});
  }, [router]);

  const logout = () => {
    sessionStorage.removeItem("loginUser");
    router.push("/");
  };

  const latestTone = history[0]?.tone ?? null;

  const handleSendResultEmail = async () => {
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
        setTimeout(() => { setShowResultModal(false); setEmail(""); setStatus(""); }, 1500);
      } else {
        setStatus("전송 실패: " + (json.message || ""));
      }
    } catch {
      setStatus("전송 실패. 다시 시도해주세요.");
    }
  };

  const handleSendPhotoEmail = async () => {
    if (!email) { setStatus("이메일을 입력해주세요."); return; }
    if (!selectedPhoto) return;
    setStatus("전송 중...");
    try {
      const res = await fetch("/api/photocard-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: email, url: selectedPhoto.url, userName: user.nickname }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setStatus("전송 완료!");
        setTimeout(() => { setSelectedPhoto(null); setEmail(""); setStatus(""); }, 1500);
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
      {/* 결과 이메일 모달 */}
      {showResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[90%] max-w-[400px] rounded-2xl bg-white px-8 py-7 shadow-xl">
            <h3 className="mb-1 text-[18px] font-bold text-[#555]">이메일로 결과 보내기</h3>
            <p className="mb-5 text-[13px] text-[#999]">가장 최근 진단 결과를 이미지로 보내드릴게요.</p>
            <input
              type="email"
              placeholder="이메일 주소를 입력하세요"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendResultEmail()}
              className="mb-3 w-full rounded-xl border border-[#eee] px-4 py-3 text-[14px] text-[#333] outline-none focus:border-[#ffb7b1]"
            />
            {status && <p className="mb-3 text-[13px] text-[#ff8b87]">{status}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => { setShowResultModal(false); setEmail(""); setStatus(""); }}
                className="flex-1 rounded-xl border border-[#eee] py-3 text-[13px] text-[#999] hover:bg-[#f9f9f9]"
              >
                취소
              </button>
              <button
                onClick={handleSendResultEmail}
                className="flex-1 rounded-xl bg-gradient-to-r from-[#ffb7b1] to-[#ff7070] py-3 text-[13px] font-semibold text-white hover:opacity-90"
              >
                보내기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 사진 클릭 모달 */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => { setSelectedPhoto(null); setEmail(""); setStatus(""); }}>
          <div className="w-[90%] max-w-[400px] rounded-2xl bg-white px-6 py-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <img src={selectedPhoto.url} alt="인생네컷" className="mb-4 w-full rounded-xl" />
            <input
              type="email"
              placeholder="이메일로 전송하기"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendPhotoEmail()}
              className="mb-3 w-full rounded-xl border border-[#eee] px-4 py-3 text-[14px] text-[#333] outline-none focus:border-[#ffb7b1]"
            />
            {status && <p className="mb-3 text-[13px] text-[#ff8b87]">{status}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => { setSelectedPhoto(null); setEmail(""); setStatus(""); }}
                className="flex-1 rounded-xl border border-[#eee] py-3 text-[13px] text-[#999] hover:bg-[#f9f9f9]"
              >
                닫기
              </button>
              <button
                onClick={handleSendPhotoEmail}
                className="flex-1 rounded-xl bg-gradient-to-r from-[#ffb7b1] to-[#ff7070] py-3 text-[13px] font-semibold text-white hover:opacity-90"
              >
                보내기
              </button>
            </div>
          </div>
        </div>
      )}

      <main
        className="min-h-screen overflow-y-auto"
        style={{ backgroundImage: "url('/img/My_Page.png')", backgroundSize: "cover", backgroundPosition: "center top" }}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-8 pt-6">
          <a href="/">
            <img src="/img/logo.png" alt="Tone-Z" className="h-[52px]" />
          </a>
          <button
            onClick={logout}
            className="rounded-full border border-[#ffb7b1] bg-white/70 px-8 py-3 text-[17px] text-[#ff8b87] backdrop-blur-sm hover:bg-white transition"
          >
            로그아웃
          </button>
        </div>

        <div className="mx-auto max-w-[720px] px-6 pb-32">
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
            <p className="text-[26px] font-bold text-[#555]">{user.nickname} 님</p>
          </div>

          {/* 탭 버튼 */}
          <div className="mb-4 flex justify-center">
            <div className="flex rounded-full bg-white/80 p-1 shadow-sm backdrop-blur-sm">
              <button
                onClick={() => setTab("results")}
                className={`rounded-full px-8 py-2.5 text-[15px] font-semibold transition ${
                  tab === "results" ? "bg-gradient-to-r from-[#ffb7b1] to-[#ff7070] text-white shadow" : "text-[#aaa]"
                }`}
              >
                이전 결과
              </button>
              <button
                onClick={() => setTab("photos")}
                className={`rounded-full px-8 py-2.5 text-[15px] font-semibold transition ${
                  tab === "photos" ? "bg-gradient-to-r from-[#ffb7b1] to-[#ff7070] text-white shadow" : "text-[#aaa]"
                }`}
              >
                내 인생네컷
              </button>
            </div>
          </div>

          {/* 탭 콘텐츠 */}
          <div className={`rounded-2xl bg-white/90 px-6 py-6 shadow-sm backdrop-blur-sm ${isFullscreen ? "min-h-[540px]" : "min-h-[420px]"}`}>
            {tab === "results" ? (
              loading ? (
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
                            <div key={item.id} onClick={() => router.push(`/result/${item.tone}`)} className="cursor-pointer rounded-xl border border-[#f5f5f5] bg-white px-5 py-4 shadow-sm hover:border-[#ffb7b1] hover:shadow-md transition">
                              <p className="text-[13px] text-[#bbb]">{formatDate(item.created_at)}</p>
                              <p className="text-[16px] font-semibold text-[#555]">{d?.type ?? item.tone ?? "알 수 없음"}</p>
                              <p className="mt-1 truncate text-[13px] text-[#888]">{d?.desc ?? ""}</p>
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
                })()
            ) : photocards.length === 0 ? (
              <p className="py-4 text-center text-[13px] text-[#aaa]">아직 찍은 사진이 없어요.</p>
            ) : (() => {
                const totalPhotoPages = Math.ceil(photocards.length / PHOTO_PAGE_SIZE);
                const pagePhotos = photocards.slice(photoPage * PHOTO_PAGE_SIZE, photoPage * PHOTO_PAGE_SIZE + PHOTO_PAGE_SIZE);
                return (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      {pagePhotos.map((p) => (
                        <img
                          key={p.id}
                          src={p.url}
                          alt="인생네컷"
                          className="w-full cursor-pointer rounded-xl object-cover shadow-sm hover:opacity-90 transition"
                          onClick={() => { setSelectedPhoto(p); setEmail(""); setStatus(""); }}
                        />
                      ))}
                    </div>
                    {totalPhotoPages > 1 && (
                      <div className="mt-5 flex items-center justify-center gap-2">
                        {Array.from({ length: totalPhotoPages }).map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setPhotoPage(i)}
                            className={`h-[8px] rounded-full transition-all duration-300 ${
                              i === photoPage ? "w-[28px] bg-[#ffb7b1]" : "w-[8px] bg-[#e0e0e0]"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </>
                );
              })()
            }
          </div>

          {/* 하단 버튼 */}
          <div className="mt-8 flex justify-center gap-4 pb-16">
            <button
              onClick={() => router.push("/scan")}
              className="rounded-full border-2 border-[#ffb7b1] px-10 py-3.5 text-[16px] font-semibold text-[#ff8b87] hover:bg-[#fff0f0] transition"
            >
              {history.length > 0 ? "다시 진단하기" : "진단하기"}
            </button>
            {history.length > 0 && (
              <button
                onClick={() => setShowResultModal(true)}
                className="rounded-full bg-gradient-to-r from-[#ffb7b1] to-[#ff7070] px-10 py-3.5 text-[16px] font-semibold text-white shadow-md hover:opacity-90 transition"
              >
                이메일로 결과 공유하기
              </button>
            )}
          </div>
        </div>
      </main>

      <button
        onClick={() => router.push("/chatbot")}
        className="fixed bottom-8 right-8 h-[90px] w-[90px]"
      >
        <img src="/img/chatbot_icon.png" alt="챗봇" className="h-full w-full" />
      </button>
    </>
  );
}
