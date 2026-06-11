"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const frames = [
  { id: "original", src: "/img/Photo_Original.png", name: "오리지널" },
  { id: "fourseason1", src: "/img/Photo_FourSeason_1.png", name: "사계절1" },
  { id: "fourseason2", src: "/img/Photo_FourSeason_2.png", name: "사계절2" },
  { id: "spring", src: "/img/Photo_Spring.png", name: "봄" },
  { id: "summer", src: "/img/Photo_Summer.png", name: "여름" },
  { id: "autumn", src: "/img/Photo_Autumn.png", name: "가을" },
  { id: "winter", src: "/img/Photo_Winter.png", name: "겨울" },
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
    <main
      className="min-h-screen"
      style={{ backgroundImage: "url('/img/Photo_Page.png')", backgroundSize: "cover", backgroundPosition: "center top" }}
    >
      <div className="flex flex-col items-start px-8 pt-8 pb-8">
        <a href="/">
          <img src="/img/logo.png" alt="Tone-Z" className="h-[clamp(36px,4vw,56px)]" />
        </a>
      </div>

      <div className="mx-auto max-w-[1100px] px-6 pt-130 pb-24">
        <div className="grid grid-cols-3 gap-6">
          {frames.slice(0, 3).map((frame) => (
            <div
              key={frame.id}
              onClick={() => setSelected(frame.id)}
              className={`cursor-pointer transition-all duration-200 ${
                selected === frame.id
                  ? "scale-[1.05] drop-shadow-[0_0_8px_rgba(255,139,135,0.7)]"
                  : "hover:scale-[1.02]"
              }`}
            >
              <div className="relative w-full">
                <img src="/img/white_page.png" alt="" className="w-full" />
                <img src={frame.src} alt={frame.name} className="absolute inset-0 h-full w-full object-contain p-2" />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 grid grid-cols-4 gap-6">
          {frames.slice(3).map((frame) => (
            <div
              key={frame.id}
              onClick={() => setSelected(frame.id)}
              className={`cursor-pointer transition-all duration-200 ${
                selected === frame.id
                  ? "scale-[1.05] drop-shadow-[0_0_8px_rgba(255,139,135,0.7)]"
                  : "hover:scale-[1.02]"
              }`}
            >
              <div className="relative w-full">
                <img src="/img/white_page.png" alt="" className="w-full" />
                <img src={frame.src} alt={frame.name} className="absolute inset-0 h-full w-full object-contain p-2" />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <button onClick={handleStart} className="transition hover:opacity-90">
            <img src="/img/photo_button.png" alt="네컷사진 찍으러 가기" className="h-auto w-[280px]" />
          </button>
        </div>
      </div>
    </main>
  );
}
