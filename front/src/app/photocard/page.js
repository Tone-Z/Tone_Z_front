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
          {frames.map((frame) => (
            <div
              key={frame.id}
              onClick={() => setSelected(frame.id)}
              className={`cursor-pointer overflow-hidden rounded-2xl border-2 bg-white shadow-sm transition-all duration-200 ${
                selected === frame.id
                  ? "border-[#ff8b87] shadow-md scale-[1.03]"
                  : "border-transparent hover:border-[#ffd1d1]"
              }`}
            >
              <img
                src={frame.src}
                alt={frame.name}
                className="w-full object-contain"
              />
            </div>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <button
            onClick={handleStart}
            className="rounded-full bg-gradient-to-r from-[#ffb7b1] to-[#ff7070] px-10 py-4 text-[15px] font-bold text-white shadow-md transition hover:opacity-90"
          >
            📷 네컷사진 찍으러 가기
          </button>
        </div>
      </div>
    </main>
  );
}
