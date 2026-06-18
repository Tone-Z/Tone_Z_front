"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const frames = [
  { id: "original", src: "/img/Photo_Original.webp", name: "오리지널" },
  { id: "fourseason1", src: "/img/Photo_FourSeason_1.webp", name: "사계절1" },
  { id: "fourseason2", src: "/img/Photo_FourSeason_2.webp", name: "사계절2" },
  { id: "spring", src: "/img/Photo_Spring.webp", name: "봄" },
  { id: "summer", src: "/img/Photo_Summer.webp", name: "여름" },
  { id: "autumn", src: "/img/Photo_Autumn.webp", name: "가을" },
  { id: "winter", src: "/img/Photo_Winter.webp", name: "겨울" },
];

function toneToFrame(tone) {
  if (!tone) return "spring";
  if (tone.startsWith("spring")) return "spring";
  if (tone.startsWith("summer")) return "summer";
  if (tone.startsWith("autumn")) return "autumn";
  if (tone.startsWith("winter")) return "winter";
  return "spring";
}

export default function PhotoCardPage() {
  const [selected, setSelected] = useState("spring");
  const router = useRouter();

  useEffect(() => {
    const timer = { id: null };
    const reset = () => { clearTimeout(timer.id); timer.id = setTimeout(() => router.push("/"), 30000); };
    const events = ["mousemove", "scroll", "click", "touchstart", "keypress"];
    events.forEach((e) => window.addEventListener(e, reset));
    reset();
    return () => { clearTimeout(timer.id); events.forEach((e) => window.removeEventListener(e, reset)); };
  }, [router]);

  useEffect(() => {
    const tone = sessionStorage.getItem("user_tone");
    setSelected(toneToFrame(tone));
  }, []);

  const handleStart = () => {
    const frame = frames.find((f) => f.id === selected);
    sessionStorage.setItem("photocard_frame", JSON.stringify(frame));
    sessionStorage.removeItem("photocard_photos");
    router.push("/photocard/camera");
  };

  return (
    <main className="relative min-h-screen bg-[#fde8f0]" style={{ backgroundImage: "url('/img/Photo_Page.webp')", backgroundSize: "cover", backgroundPosition: "center top" }}>
      <div className="flex items-center justify-between px-8 pt-8 pb-8">
        <a href="/">
          <img src="/img/logo.png" alt="Tone-Z" className="h-[clamp(36px,4vw,56px)]" />
        </a>
        <button
          className="transition hover:opacity-80"
          onClick={() => {
            const stored = sessionStorage.getItem("loginUser");
            window.location.href = stored ? "/mypage" : "/login?redirect=/mypage";
          }}
        >
          <img src="/img/MyPage_button.png" alt="My Page" className="h-auto w-[clamp(100px,10vw,160px)] drop-shadow-[0_2px_8px_rgba(0,0,0,0.2)]" />
        </button>
      </div>

      <div className="mx-auto max-w-[1200px] px-6 pt-130 pb-24">
        <div className="flex flex-col gap-6">
          <div className="flex justify-center gap-6">
            {frames.slice(0, 3).map((frame) => (
              <div
                key={frame.id}
                onClick={() => setSelected(frame.id)}
                className={`w-[300px] flex-shrink-0 cursor-pointer transition-all duration-200 ${
                  selected === frame.id
                    ? "scale-[1.05] drop-shadow-[0_0_10px_rgba(255,139,135,0.8)]"
                    : "hover:scale-[1.02]"
                }`}
              >
                <div className="relative w-full">
                  <img src="/img/white_page.webp" alt="" className="w-full" />
                  <img src={frame.src} alt={frame.name} className="absolute inset-0 h-full w-full object-contain p-8" />
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-6">
            {frames.slice(3).map((frame) => (
              <div
                key={frame.id}
                onClick={() => setSelected(frame.id)}
                className={`w-[300px] flex-shrink-0 cursor-pointer transition-all duration-200 ${
                  selected === frame.id
                    ? "scale-[1.05] drop-shadow-[0_0_10px_rgba(255,139,135,0.8)]"
                    : "hover:scale-[1.02]"
                }`}
              >
                <div className="relative w-full">
                  <img src="/img/white_page.webp" alt="" className="w-full" />
                  <img src={frame.src} alt={frame.name} className="absolute inset-0 h-full w-full object-contain p-8" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex justify-center">
          <button onClick={handleStart} className="transition hover:opacity-90">
            <img src="/img/photo_button.png" alt="네컷사진 찍으러 가기" className="h-auto w-[180px]" />
          </button>
        </div>
      </div>
    </main>
  );
}
