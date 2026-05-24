"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toneData } from "../data";

export default function ResultPage({ params }) {
  const { tone } = use(params);
  const data = toneData[tone];
  const [userName, setUserName] = useState("사용자");

  useEffect(() => {
    sessionStorage.setItem("user_tone", tone);
    const stored = sessionStorage.getItem("loginUser");
    if (stored) {
      try {
        const user = JSON.parse(stored);
        if (user.nickname) setUserName(user.nickname);
        fetch("http://localhost:8080/diagnosis/save", {
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
      <div className="mx-auto w-full max-w-[1691px] bg-white">
        <ResultHeader data={data} userName={userName} />
        <BestColor data={data} />
        <MakeupSection data={data} />
        <VideoSection data={data} />
        <TipSection data={data} />
        <BottomButtons data={data} tone={tone} />
      </div>
    </main>
  );
}

function ResultHeader({ data, userName }) {
  return (
    <section className="relative w-full overflow-hidden border-0">
      <div
        className="relative flex h-[88px] w-full items-center px-[40px] border-0"
        style={{ backgroundColor: data.headerBar }}
      >
        <a href="/"><img src="/img/logo.png" alt="Tone-Z" className="h-[42px]" /></a>

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
          className="mb-[1vw] text-[clamp(10px,1vw,16px)]"
          style={{ color: data.mainColor }}
        >
          {userName}님의 퍼스널 컬러는
        </p>

        <h1
          className="whitespace-pre-line text-[clamp(22px,2.3vw,42px)] font-bold leading-[1.35]"
          style={{ color: data.mainColor }}
          dangerouslySetInnerHTML={{ __html: data.title }}
        />

        <p
          style={{
            color: data.descColor,
          }}
        >
          {data.desc}
        </p>

        <div className="mt-[1vw] flex flex-wrap gap-2">
          {data.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full px-4 py-1 text-[clamp(9px,0.8vw,13px)] font-semibold text-white"
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

function VideoSection({ data }) {
  const [center, setCenter] = useState(1);
  const [move, setMove] = useState(false);
  const [videos, setVideos] = useState([]);
  const [playing, setPlaying] = useState(false);

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
    if (videos.length === 0) return;
    setPlaying(false);
    setMove(true);
    setTimeout(() => {
      if (type === "prev") {
        setCenter((prev) => (prev === 0 ? videos.length - 1 : prev - 1));
      } else {
        setCenter((prev) => (prev === videos.length - 1 ? 0 : prev + 1));
      }
      setMove(false);
    }, 180);
  };

  const getVideo = (offset) => {
    if (videos.length === 0) return null;
    return videos[(center + offset + videos.length) % videos.length];
  };

  const VideoCard = ({ video, size }) => {
    const isLarge = size === "large";
    const wrapClass = isLarge
      ? "w-[70%] overflow-hidden rounded-2xl border border-[#eee] bg-white shadow-md transition-all duration-500 md:w-[44%]"
      : "hidden w-[22%] overflow-hidden rounded-2xl border border-[#eee] bg-white shadow-sm md:block";
    const thumbClass = isLarge
      ? "h-[24vw] max-h-[340px] min-h-[210px]"
      : "h-[12vw] max-h-[170px] min-h-[115px]";

    if (!video) {
      return (
        <div className={wrapClass}>
          <div className={thumbClass + (isLarge ? " bg-[#ffeaea]" : " bg-[#ffdede]")} />
        </div>
      );
    }

    if (isLarge && playing) {
      return (
        <div className={wrapClass}>
          <iframe
            className={"w-full " + thumbClass}
            src={"https://www.youtube.com/embed/" + video.videoId + "?autoplay=1"}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
          <p className="line-clamp-2 p-5 text-left text-[clamp(12px,1vw,16px)] text-[#777]">
            {video.title}
          </p>
          <p className="px-4 pb-3 text-[11px] text-[#bbb]">{video.channel}</p>
        </div>
      );
    }

    return (
      <div
        className={wrapClass + (isLarge ? " cursor-pointer" : "")}
        onClick={isLarge ? () => setPlaying(true) : undefined}
      >
        <div className="relative overflow-hidden">
          <img
            src={video.thumbnail}
            alt={video.title}
            className={"w-full object-cover " + thumbClass}
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
        <p
          className={
            "line-clamp-2 text-left text-[#777] " +
            (isLarge ? "p-5 text-[clamp(12px,1vw,16px)]" : "p-4 text-sm")
          }
        >
          {video.title}
        </p>
        <p className="px-4 pb-3 text-[11px] text-[#bbb]">{video.channel}</p>
      </div>
    );
  };

  return (
    <section className="px-[8%] py-[7%] text-center">
      <h2 className="mb-10 text-[clamp(13px,1vw,18px)] font-bold text-[#999]">
        {data.koreanType} 메이크업 가이드
      </h2>

      {videos.length === 0 ? (
        <p className="text-[#999]">영상을 불러오는 중이에요...</p>
      ) : (
        <div
          className={
            "flex items-center justify-center gap-10 transition-all duration-300 " +
            (move ? "translate-x-3 opacity-70" : "translate-x-0 opacity-100")
          }
        >
          <VideoCard video={getVideo(-1)} size="small" />

          <button
            onClick={() => changeVideo("prev")}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#ffd1d1] text-2xl font-bold text-white transition hover:scale-110"
          >
            ‹
          </button>

          <VideoCard video={getVideo(0)} size="large" />

          <button
            onClick={() => changeVideo("next")}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#ffd1d1] text-2xl font-bold text-white transition hover:scale-110"
          >
            ›
          </button>

          <VideoCard video={getVideo(1)} size="small" />
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

function BottomButtons({ data, tone }) {
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
              className="mb-3 w-full rounded-xl border border-[#eee] px-4 py-3 text-[14px] outline-none focus:border-[#ffb7b1]"
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
        onClick={() => router.push("/chatbot")}
        className="fixed bottom-8 right-8 h-[70px] w-[70px]"
      >
        <img src="/img/chatbot_icon.png" alt="챗봇" className="h-full w-full" />
      </button>
    </section>
    </>
  );
}