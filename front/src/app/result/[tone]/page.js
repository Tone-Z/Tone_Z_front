"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toneData } from "../data";

export default function ResultPage({ params }) {
  const { tone } = use(params);
  const data = toneData[tone];
  const [userName, setUserName] = useState("사용자");
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    sessionStorage.setItem("user_tone", tone);
    const stored = sessionStorage.getItem("loginUser");
    if (stored) {
      try {
        const user = JSON.parse(stored);
        if (user.nickname) setUserName(user.nickname);
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/diagnosis/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, tone }),
        }).catch(() => {});
      } catch {}
    }
  }, [tone]);


  if (!data) {
    return <div>결과를 찾을 수 없어요.</div>;
  }

  return (
    <main className="min-h-screen bg-[#e9e9e9]">
      <div className="w-full bg-white">
        <ResultHeader data={data} userName={userName} tone={tone} />
        <BestColor data={data} />
        <MakeupSection data={data} />
        <VideoSection data={data} tone={tone} />
        <TipSection data={data} />
        <BottomButtons data={data} tone={tone} onChatOpen={() => setChatOpen(true)} />
      </div>
      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} tone={tone} />
    </main>
  );
}

function getSeasonLogo(tone) {
  if (!tone) return "/img/logo.png";
  if (tone.startsWith("spring")) return "/img/Spring_logo.png";
  if (tone.startsWith("summer")) return "/img/Summer_logo.png";
  if (tone.startsWith("autumn")) return "/img/Autumn_logo.png";
  if (tone.startsWith("winter")) return "/img/Winter_logo.png";
  return "/img/logo.png";
}

function ResultHeader({ data, userName, tone }) {
  return (
    <section className="relative w-full overflow-hidden border-0">
      <div
        className="relative flex h-[88px] w-full items-center px-[40px] border-0"
        style={{ backgroundColor: data.headerBar }}
      >
        <a href="/"><img src={getSeasonLogo(tone)} alt="Tone-Z" className="h-[42px]" /></a>

        <div
          className="absolute left-1/2 top-[55px] z-10 -translate-x-1/2 rounded-full px-[5vw] py-[1vw] text-[clamp(12px,1.2vw,20px)] font-semibold text-white"
          style={{ backgroundColor: data.badgeColor }}
        >
          {data.badge}
        </div>
      </div>

      <img
        src={data.headerImg}
        alt={data.type + " 헤더"}
        className="block w-full object-cover border-0"
      />

      <div className="absolute left-[43%] top-[30%] w-[45%]">
        <p
          className="mb-[1.2vw] text-[clamp(12px,1.2vw,18px)]"
          style={{ color: data.mainColor }}
        >
          {userName}님의 퍼스널 컬러는
        </p>

        <h1
          className="whitespace-nowrap text-[clamp(19px,2vw,36px)] font-bold leading-[1.35] mb-[1.2vw]"
          style={{ color: data.mainColor }}
        >
          {(() => {
            const idx = data.title.lastIndexOf("입니다");
            if (idx === -1) return data.title;
            return (
              <>
                {data.title.substring(0, idx)}
                <span className="font-normal text-[clamp(12px,1.2vw,18px)]">입니다.</span>
              </>
            );
          })()}
        </h1>

        <p
          className="mb-[1.2vw] text-[clamp(11px,1vw,16px)] whitespace-pre-line leading-relaxed"
          style={{
            color: data.descColor,
          }}
        >
          {data.desc}
        </p>

        <div className="mt-[3vw] flex flex-wrap gap-3">
          {data.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md px-5 py-2 text-[clamp(13px,1.2vw,19px)] font-semibold text-white"
              style={{ backgroundColor: data.badgeColor }}
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function BestColor({ data }) {
  return (
    <section className="px-[8%] py-[6%]">
      <h2 className="mb-10 text-[clamp(13px,1vw,18px)] font-bold text-[#999]">
        {data.koreanType} BEST COLOR
      </h2>

      <div className="grid grid-cols-1 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
        {data.colors.map((color) => (
          <div key={color.name} className="flex items-center gap-5">
            <div
              className="h-[clamp(36px,3vw,56px)] w-[clamp(36px,3vw,56px)] rounded-full"
              style={{ backgroundColor: color.code }}
            />
            <p className="text-[clamp(12px,1vw,16px)] text-[#888]">
              {color.name}{" "}
              <span className="text-[#aaa]">({color.eng})</span>
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function MakeupSection({ data }) {
  const [page, setPage] = useState(0);
  const [products, setProducts] = useState([]);
  const itemCount = 6;

  useEffect(() => {
    async function fetchItem(name) {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const res = await fetch("/api/shopping?query=" + encodeURIComponent(name));
          const data = await res.json();
          if (data.items?.length > 0) return data;
        } catch {}
        if (attempt < 2) await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
      }
      return { items: [] };
    }

    async function getProducts() {
      try {
        const BATCH = 3;
        const results = [];
        for (let i = 0; i < data.productItems.length; i += BATCH) {
          const batch = data.productItems.slice(i, i + BATCH);
          const batchResults = await Promise.all(
            batch.map((item) => fetchItem(item.name))
          );
          results.push(...batchResults);
          if (i + BATCH < data.productItems.length) {
            await new Promise((r) => setTimeout(r, 250));
          }
        }

        const items = results
          .map((result, index) => {
            const apiItem = result.items?.[0];
            const productItem = data.productItems[index];

            return {
              image: apiItem?.image || null,
              title: productItem.name,
              shade: productItem.shade,
              link: apiItem?.link || null,
              price: apiItem?.lprice || null,
              brand: apiItem?.brand || apiItem?.maker || "",
              tags: ["추천", "Naver"],
            };
          });

        setProducts(items);
      } catch (error) {
        console.log(error);
        setProducts([]);
      }
    }

    getProducts();
  }, [data.productItems]);

  const totalPage = Math.ceil(products.length / itemCount);

  useEffect(() => {
    if (totalPage === 0) return;

    const timer = setInterval(() => {
      setPage((prev) => (prev + 1) % totalPage);
    }, 3500);

    return () => clearInterval(timer);
  }, [totalPage]);

  const start = page * itemCount;
  const currentItems = products.slice(start, start + itemCount);

  return (
    <section className="overflow-hidden px-[8%] py-[4%]">
      <h2 className="mb-8 text-[clamp(13px,1vw,18px)] font-bold text-[#999]">
        추천 메이크업 아이템
      </h2>

      {products.length === 0 ? (
        <p className="text-[#999]">추천 화장품을 불러오는 중이에요...</p>
      ) : (
        <div key={page} className="space-y-5 animate-makeupFlow">
          {[0, 1, 2].map((row) => (
            <div
              key={row}
              className={
                "grid grid-cols-1 gap-5 transition-all duration-700 md:grid-cols-2 " +
                (row === 1 ? "md:translate-x-10" : "md:-translate-x-6")
              }
            >
              {currentItems.slice(row * 2, row * 2 + 2).map((item, index) => (
                <a
                  key={(item.link || item.title) + index}
                  href={item.link || undefined}
                  target={item.link ? "_blank" : undefined}
                  className="flex min-h-[135px] items-center gap-5 rounded-2xl border border-[#eee] bg-white px-6 py-4 shadow-sm"
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-24 w-24 shrink-0 object-contain"
                    />
                  ) : (
                    <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-[#ffeaea] text-[28px]">
                      🎨
                    </div>
                  )}

                  <div>
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-[#ffd1d1] px-3 py-1 text-[10px] text-white"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {item.brand && (
                      <p className="text-[11px] text-[#bbb] mb-1">
                        {item.brand}
                      </p>
                    )}

                    <h3 className="text-[clamp(12px,0.95vw,15px)] font-semibold text-[#777]">
                      {item.title}
                    </h3>

                    {item.shade && (
                      <p className="mt-1 text-[12px] text-[#ff8b87] font-medium">
                        🎨 {item.shade}
                      </p>
                    )}

                    {item.price && (
                      <p className="mt-2 text-[13px] font-bold text-[#ff8b87]">
                        {Number(item.price).toLocaleString()}원
                      </p>
                    )}
                  </div>
                </a>
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function VideoCard({ video, isLarge, playing, onPlay }) {
  const thumbH = "h-[22vw] max-h-[320px] min-h-[180px]";
  const wrap = `w-full overflow-hidden rounded-2xl border border-[#eee] bg-white ${isLarge ? "shadow-md" : "shadow-sm"}`;

  if (!video) return (
    <div className={wrap}>
      <div className={`${thumbH} ${isLarge ? "bg-[#ffeaea]" : "bg-[#ffdede]"}`} />
    </div>
  );

  if (isLarge && playing) return (
    <div className={wrap}>
      <iframe
        className={`w-full ${thumbH}`}
        src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1`}
        title={video.title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
      <p className="line-clamp-2 p-4 text-left text-[clamp(11px,0.9vw,14px)] text-[#777]">{video.title}</p>
    </div>
  );

  return (
    <div className={`${wrap}${isLarge ? " cursor-pointer" : ""}`} onClick={isLarge ? onPlay : undefined}>
      <div className="relative overflow-hidden">
        <img
          src={video.thumbnail}
          alt={video.title}
          className={`w-full object-cover ${thumbH}`}
          onError={(e) => { e.target.src = video.thumbnailFallback; }}
        />
        {isLarge && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 transition hover:opacity-100">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90">
              <span className="ml-1 text-xl text-red-500">▶</span>
            </div>
          </div>
        )}
      </div>
      <p className={`line-clamp-2 text-left text-[#777] ${isLarge ? "p-4 text-[clamp(11px,0.9vw,14px)]" : "p-2 text-[10px]"}`}>
        {video.title}
      </p>
    </div>
  );
}

// 모든 카드: left 28%, width 44% 고정 → transform만 GPU로 변경
// translateX: 카드 자신의 width(44%) 기준 %
//   left 슬롯:  center(50%) → 13%  차이 37% of container = 84% of card
//   right 슬롯: center(50%) → 87%  차이 37% of container = 84% of card
//   off 슬롯:   container 밖 65% of container = 148% of card
const CARD_TRANSFORM = {
  offLeft:  { transform: "translate(-155%, -50%) scale(0.5)", opacity: 0, zIndex: 1 },
  left:     { transform: "translate(-90%,  -50%) scale(0.5)", opacity: 1, zIndex: 5 },
  center:   { transform: "translate(0%,    -50%) scale(1)",   opacity: 1, zIndex: 10 },
  right:    { transform: "translate(90%,   -50%) scale(0.5)", opacity: 1, zIndex: 5 },
  offRight: { transform: "translate(155%,  -50%) scale(0.5)", opacity: 0, zIndex: 1 },
};

function getSeasonPrefix(tone) {
  if (!tone) return "Spring";
  if (tone.startsWith("spring")) return "Spring";
  if (tone.startsWith("summer")) return "Summer";
  if (tone.startsWith("autumn")) return "Autumn";
  if (tone.startsWith("winter")) return "Winter";
  return "Spring";
}

function VideoSection({ data, tone }) {
  const [videos, setVideos] = useState([]);
  const [center, setCenter] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [animDir, setAnimDir] = useState(null);
  const [animating, setAnimating] = useState(false);
  const isChanging = useRef(false);

  useEffect(() => {
    async function getVideos() {
      try {
        const query = data.koreanType + " 메이크업";
        const res = await fetch("/api/youtube?query=" + encodeURIComponent(query));
        const result = await res.json();
        const items = (result.items || []).map((item) => {
          const videoId = item.id.videoId;
          return {
            videoId,
            title: item.snippet.title,
            channel: item.snippet.channelTitle,
            thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
            thumbnailFallback: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          };
        });
        if (items.length > 0) setVideos(items);
      } catch {}
    }
    getVideos();
  }, [data.koreanType]);

  const changeVideo = (type) => {
    if (videos.length === 0 || isChanging.current) return;
    setPlaying(false);
    isChanging.current = true;
    setAnimDir(type);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setAnimating(true);
        setTimeout(() => {
          setCenter(prev =>
            type === "next"
              ? (prev + 1) % videos.length
              : (prev - 1 + videos.length) % videos.length
          );
          setAnimating(false);
          setAnimDir(null);
          isChanging.current = false;
        }, 360);
      });
    });
  };

  const getVideoAt = (offset) =>
    videos.length === 0 ? null : videos[(center + offset + videos.length) % videos.length];

  const getVideoIdx = (offset) => (center + offset + videos.length) % videos.length;

  // 어떤 카드를 어떤 위치에 렌더할지 결정
  let slots;
  if (!animDir) {
    slots = [
      { offset: -1, pos: "left" },
      { offset:  0, pos: "center" },
      { offset:  1, pos: "right" },
    ];
  } else if (animDir === "next") {
    slots = [
      { offset: -1, pos: animating ? "offLeft"  : "left"     },
      { offset:  0, pos: animating ? "left"     : "center"   },
      { offset:  1, pos: animating ? "center"   : "right"    },
      { offset:  2, pos: animating ? "right"    : "offRight" },
    ];
  } else {
    slots = [
      { offset: -2, pos: animating ? "left"     : "offLeft"  },
      { offset: -1, pos: animating ? "center"   : "left"     },
      { offset:  0, pos: animating ? "right"    : "center"   },
      { offset:  1, pos: animating ? "offRight" : "right"    },
    ];
  }

  return (
    <section className="px-[8%] py-[7%] text-center">
      <h2 className="mb-10 text-[clamp(13px,1vw,18px)] font-bold text-[#999]">
        {data.koreanType} 메이크업 가이드
      </h2>
      {videos.length === 0 ? (
        <p className="text-[#999]">영상을 불러오는 중이에요...</p>
      ) : (
        <div className="relative" style={{ height: "clamp(300px, 30vw, 460px)" }}>
          {slots.map(({ offset, pos }) => (
            <div
              key={getVideoIdx(offset)}
              className="absolute"
              style={{
                left: "28%",
                top: "50%",
                width: "44%",
                transformOrigin: "center center",
                ...CARD_TRANSFORM[pos],
                transition: animDir
                  ? "transform 0.38s ease-out, opacity 0.28s ease-out"
                  : "none",
              }}
            >
              <VideoCard
                video={getVideoAt(offset)}
                isLarge={pos === "center"}
                playing={playing}
                onPlay={() => setPlaying(true)}
              />
            </div>
          ))}
          {/* 네비게이션 버튼 — 중앙 카드 양쪽 여백에 고정 */}
          <button
            onClick={() => changeVideo("prev")}
            className="absolute z-20 -translate-y-1/2 transition hover:scale-110"
            style={{ left: "calc(25% - 32px)", top: "50%" }}
          >
            <img src={`/img/${getSeasonPrefix(tone)}_left.png`} alt="prev" className="h-16 w-16" />
          </button>
          <button
            onClick={() => changeVideo("next")}
            className="absolute z-20 -translate-y-1/2 transition hover:scale-110"
            style={{ left: "calc(75% - 32px)", top: "50%" }}
          >
            <img src={`/img/${getSeasonPrefix(tone)}_right.png`} alt="next" className="h-16 w-16" />
          </button>
        </div>
      )}
    </section>
  );
}

function TipSection({ data }) {
  return (
    <section className="px-[8%] py-[8%]">
      <div
        className="mx-auto w-full max-w-[1364px] rounded-[20px] border-[1.5px] px-[6%] py-[5%]"
        style={{
          backgroundColor: data.tipBg,
          borderColor: data.tipBorder,
        }}
      >
        <div className="mb-6 flex items-center gap-3">
          <img src={data.groupImg} alt="전구" className="h-8 w-8" />

          <h2
            className="text-[clamp(20px,2vw,36px)] font-bold"
            style={{ color: data.tipColor ?? data.mainColor }}
          >
            스타일링 팁
          </h2>
        </div>

        <div className="space-y-4">
          {data.tips.map((tip) => (
            <div key={tip} className="flex items-start gap-3">
              <img src={data.checkImg} alt="체크" className="mt-1 h-4 w-4" />

              <p
                className="text-[clamp(12px,1vw,17px)] leading-7"
                style={{ color: data.tipColor ?? data.mainColor }}
              >
                {tip}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BottomButtons({ data, tone, onChatOpen }) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");

  const handleSend = async () => {
    if (!email) { setStatus("이메일을 입력해주세요."); return; }
    setStatus("전송 중...");
    try {
      const loginUser = sessionStorage.getItem("loginUser");
      const userName = loginUser ? JSON.parse(loginUser).nickname : "사용자";
      const resultUrl = `${window.location.origin}/result/${tone}`;

      const res = await fetch("/api/result-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: email, resultUrl, userName }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setStatus("전송 완료!");
        setTimeout(() => { setShowModal(false); setEmail(""); setStatus(""); }, 1500);
      } else {
        setStatus("전송 실패: " + (json.message || "다시 시도해주세요."));
      }
    } catch {
      setStatus("전송에 실패했어요. 다시 시도해주세요.");
    }
  };

  return (
    <>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[90%] max-w-[420px] rounded-2xl bg-white px-8 py-7 shadow-xl">
            <h3 className="mb-1 text-[18px] font-bold text-[#555]">결과 공유하기</h3>
            <p className="mb-5 text-[13px] text-[#999]">
              <span className="font-semibold text-[#ff8b87]">{data.koreanType}</span> 결과를 이메일로 보내드릴게요.
            </p>
            <input
              type="email"
              placeholder="이메일 주소를 입력하세요"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="mb-3 w-full rounded-xl border border-[#eee] px-4 py-3 text-[14px] text-[#111] outline-none focus:border-[#ffb7b1]"
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
                onClick={handleSend}
                className="flex-1 rounded-xl bg-gradient-to-r from-[#ffb7b1] to-[#ff7070] py-3 text-[13px] font-semibold text-white hover:opacity-90"
              >
                보내기
              </button>
            </div>
          </div>
        </div>
      )}

    <section className="relative flex justify-center px-[8%] pb-24">
      <div className="flex w-full max-w-[850px] items-center justify-center rounded-full border border-[#ff7979] bg-gradient-to-r from-[#ffb7b1] to-[#ff7070] px-5 py-4 text-white">
        <button
          onClick={() => router.push("/scan")}
          className="flex flex-1 items-center justify-center gap-2 text-[clamp(10px,0.9vw,14px)] font-semibold"
        >
          <img src="/img/again.png" alt="다시 진단" className="h-5 w-5" />
          다시 진단하기
        </button>

        <span className="mx-3 h-5 w-[1px] bg-white opacity-70" />

        <button
          onClick={() => setShowModal(true)}
          className="flex flex-1 items-center justify-center gap-2 text-[clamp(10px,0.9vw,14px)] font-semibold"
        >
          <img src="/img/email.png" alt="이메일" className="h-5 w-5 invert" />
          이메일로 결과 공유하기
        </button>

        <span className="mx-3 h-5 w-[1px] bg-white opacity-70" />

        <a href="/photocard" className="flex flex-1 items-center justify-center gap-2 text-[clamp(10px,0.9vw,14px)] font-semibold">
          <img src="/img/picture.png" alt="네컷" className="h-5 w-5" />
          네컷사진
        </a>
      </div>

      <button
        onClick={onChatOpen}
        className="fixed bottom-8 right-8 h-[80px] w-[80px]"
      >
        <img src="/img/chatbot_icon.png" alt="챗봇" className="h-full w-full" />
      </button>
    </section>
    </>
  );
}

function getToneKeywords(tone) {
  if (!tone) return ["봄웜 코디 추천", "여름쿨 립 추천", "가을웜 코디 추천", "겨울쿨 코디 추천"];
  if (tone.startsWith("spring")) return ["봄웜 유튜버 추천", "봄웜 립 추천", "봄웜 치크 추천", "봄웜 코디 추천"];
  if (tone.startsWith("summer")) return ["여름쿨 유튜버 추천", "여름쿨 립 추천", "여름쿨 블러셔 추천", "여름쿨 코디 추천"];
  if (tone.startsWith("autumn")) return ["가을웜 유튜버 추천", "가을웜 립 추천", "가을웜 치크 추천", "가을웜 코디 추천"];
  if (tone.startsWith("winter")) return ["겨울쿨 유튜버 추천", "겨울쿨 립 추천", "겨울쿨 블러셔 추천", "겨울쿨 코디 추천"];
  return ["봄웜 코디 추천", "여름쿨 립 추천", "가을웜 코디 추천", "겨울쿨 코디 추천"];
}

function ChatPanel({ open, onClose, tone }) {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showKeywords, setShowKeywords] = useState(true);
  const [position, setPosition] = useState(null);
  const [size, setSize] = useState({ width: 380, height: 560 });
  const sizeRef = useRef({ width: 380, height: 560 });
  const messagesEndRef = useRef(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ mouseX: 0, mouseY: 0, panelX: 0, panelY: 0 });
  const isResizing = useRef(false);
  const resizeStart = useRef({ mouseX: 0, mouseY: 0, w: 380, h: 560 });
  const keywords = getToneKeywords(tone);

  useEffect(() => { sizeRef.current = size; }, [size]);

  useEffect(() => {
    setPosition({ x: window.innerWidth - 380 - 24, y: window.innerHeight - 560 - 24 });
  }, []);

  useEffect(() => {
    if (open) {
      setPosition({ x: window.innerWidth - 380 - 24, y: window.innerHeight - 560 - 24 });
      setSize({ width: 380, height: 560 });
      sizeRef.current = { width: 380, height: 560 };
    }
  }, [open]);

  useEffect(() => {
    const onMouseMove = (e) => {
      if (isResizing.current) {
        const dw = e.clientX - resizeStart.current.mouseX;
        const dh = e.clientY - resizeStart.current.mouseY;
        const newSize = {
          width: Math.max(320, Math.min(700, resizeStart.current.w + dw)),
          height: Math.max(400, Math.min(900, resizeStart.current.h + dh)),
        };
        sizeRef.current = newSize;
        setSize(newSize);
        return;
      }
      if (!isDragging.current) return;
      const dx = e.clientX - dragStart.current.mouseX;
      const dy = e.clientY - dragStart.current.mouseY;
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - sizeRef.current.width, dragStart.current.panelX + dx)),
        y: Math.max(0, Math.min(window.innerHeight - sizeRef.current.height, dragStart.current.panelY + dy)),
      });
    };
    const onMouseUp = () => {
      isDragging.current = false;
      isResizing.current = false;
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  const handleDragStart = (e) => {
    if (!position) return;
    isDragging.current = true;
    dragStart.current = { mouseX: e.clientX, mouseY: e.clientY, panelX: position.x, panelY: position.y };
    e.preventDefault();
  };

  const handleResizeStart = (e) => {
    e.stopPropagation();
    isResizing.current = true;
    resizeStart.current = { mouseX: e.clientX, mouseY: e.clientY, w: size.width, h: size.height };
    e.preventDefault();
  };

  useEffect(() => {
    const stored = sessionStorage.getItem("loginUser");
    let nickname = "사용자";
    if (stored) {
      try {
        const u = JSON.parse(stored);
        setUser(u);
        nickname = u.nickname || "사용자";
      } catch {}
    }
    setMessages([{
      role: "assistant",
      content: `안녕 ${nickname}님! 톤즈에요!! 오늘은 뷰티 관련해서 어떤 도와줄 일이 있나요? 💄👀`,
    }]);
  }, []);

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

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
        body: JSON.stringify({ message: msg, history: messages, tone, userId: user?.id, userName: user?.nickname }),
      });
      const json = await res.json();
      setMessages([...newMessages, {
        role: "assistant",
        content: json.ok ? json.reply : "오류: " + (json.message || "알 수 없는 오류"),
      }]);
    } catch (e) {
      setMessages([...newMessages, { role: "assistant", content: "연결 실패: " + e.message }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`fixed z-50 flex flex-col rounded-2xl bg-white shadow-2xl border border-[#f0e0e0] transition-opacity duration-300 ${
        open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      style={{
        width: size.width,
        height: size.height,
        ...(position ? { left: position.x, top: position.y } : { right: 24, bottom: 24 }),
      }}
    >
      {/* 헤더 — 드래그 핸들 */}
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-t-2xl bg-gradient-to-r from-[#ffb7b1] to-[#ff7070] flex-shrink-0 cursor-move select-none"
        onMouseDown={handleDragStart}
      >
        <img src="/img/chatbot_icon.png" alt="chatbot" className="w-11 h-11" />
        <span className="text-white font-semibold text-[15px]">톤즈 뷰티 챗봇</span>
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={onClose}
          className="ml-auto text-white/80 hover:text-white text-2xl leading-none"
        >×</button>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} items-end gap-2`}>
            {msg.role === "assistant" && (
              <img src="/img/chatbot_icon.png" className="w-9 h-9 flex-shrink-0" />
            )}
            <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap ${
              msg.role === "user"
                ? "bg-gradient-to-r from-[#ffb7b1] to-[#ff7070] text-white rounded-br-sm"
                : "bg-[#f8f8f8] text-[#444] rounded-bl-sm"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start items-end gap-2">
            <img src="/img/chatbot_icon.png" className="w-7 h-7 flex-shrink-0" />
            <div className="bg-[#f8f8f8] rounded-2xl rounded-bl-sm px-4 py-2.5 text-[13px] text-[#bbb]">
              생각 중...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 키워드 */}
      {showKeywords && (
        <div className="px-4 pb-2 flex flex-wrap gap-2 flex-shrink-0">
          {keywords.map((kw, i) => (
            <button
              key={i}
              onClick={() => sendMessage(kw)}
              className="rounded-full border border-[#f0e0e0] bg-white px-3 py-1.5 text-[12px] text-[#666] hover:bg-[#fff0f0] hover:border-[#ffb7b1] transition"
            >
              {kw}
            </button>
          ))}
        </div>
      )}

      {/* 입력 */}
      <div className="px-4 pb-4 flex-shrink-0">
        <div className="flex items-center gap-2 rounded-xl border border-[#eee] bg-[#fdf8f8] px-4 py-2.5">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="무엇이든 물어보세요"
            className="flex-1 bg-transparent text-[13px] text-[#333] outline-none placeholder:text-[#ccc]"
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="w-8 h-8 rounded-full bg-gradient-to-r from-[#ffb7b1] to-[#ff7070] flex items-center justify-center disabled:opacity-40 transition flex-shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-4 h-4">
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </div>
      </div>
      {/* 리사이즈 핸들 */}
      <div
        onMouseDown={handleResizeStart}
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize rounded-br-2xl"
        style={{ background: "linear-gradient(135deg, transparent 50%, #ffb7b1 50%)" }}
      />
    </div>
  );
}