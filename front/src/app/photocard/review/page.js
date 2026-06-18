"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { detectFrameSlots } from "../utils";

export default function ReviewPage() {
  const [photos, setPhotos] = useState([]);
  const [frame, setFrame] = useState(null);
  const [slots, setSlots] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const canvasRef = useRef(null);
  const savedUrlRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const timer = { id: null };
    const reset = () => {
      clearTimeout(timer.id);
      timer.id = setTimeout(() => router.push("/"), 30000);
    };
    const events = ["mousemove", "scroll", "click", "touchstart", "keypress"];
    events.forEach((e) => window.addEventListener(e, reset));
    reset();
    return () => {
      clearTimeout(timer.id);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [router]);

  useEffect(() => {
    const storedPhotos = sessionStorage.getItem("photocard_photos");
    const storedFrame = sessionStorage.getItem("photocard_frame");
    if (storedPhotos) setPhotos(JSON.parse(storedPhotos));
    if (storedFrame) {
      const f = JSON.parse(storedFrame);
      setFrame(f);
      detectFrameSlots(f.src).then(setSlots);
    }
  }, []);

  const savedRef = useRef(false);
  useEffect(() => {
    if (slots && photos.length > 0 && !savedRef.current) {
      savedRef.current = true;
      setTimeout(async () => {
        try {
          const result = await saveImage();
          savedUrlRef.current = result.url;
        } catch {}
      }, 500);
    }
  }, [slots, photos]);

  const composeImage = () =>
    new Promise((resolve) => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      const drawAll = (W, H) => {
        canvas.width = W;
        canvas.height = H;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, W, H);

        const drawSlots = slots ?? [
          { left: 0, top: 0, width: 50, height: 50 },
          { left: 50, top: 0, width: 50, height: 50 },
          { left: 0, top: 50, width: 50, height: 50 },
          { left: 50, top: 50, width: 50, height: 50 },
        ];

        const photoPromises = drawSlots.map((s, i) => {
          if (!photos[i]) return Promise.resolve();
          return new Promise((res) => {
            const img = new Image();
            img.onload = () => {
              const dx = (s.left / 100) * W;
              const dy = (s.top / 100) * H;
              const dw = (s.width / 100) * W;
              const dh = (s.height / 100) * H;
              // object-cover: 비율 유지하며 슬롯을 꽉 채움
              const scale = Math.max(dw / img.width, dh / img.height);
              const sw = dw / scale;
              const sh = dh / scale;
              const sx = (img.width - sw) / 2;
              const sy = (img.height - sh) / 2;
              ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
              res();
            };
            img.onerror = res;
            img.src = photos[i];
          });
        });

        Promise.all(photoPromises).then(() => {
          if (!frame) return resolve(canvas.toDataURL("image/jpeg", 0.9));
          const frameImg = new Image();
          frameImg.onload = () => {
            ctx.drawImage(frameImg, 0, 0, W, H);
            resolve(canvas.toDataURL("image/jpeg", 0.9));
          };
          frameImg.onerror = () => resolve(canvas.toDataURL("image/jpeg", 0.9));
          frameImg.src = frame.src;
        });
      };

      // 프레임의 실제 비율로 캔버스 크기 결정
      if (frame) {
        const tmp = new Image();
        tmp.onload = () => drawAll(tmp.naturalWidth, tmp.naturalHeight);
        tmp.onerror = () => drawAll(600, 800);
        tmp.src = frame.src;
      } else {
        drawAll(600, 800);
      }
    });

  const saveImage = async () => {
    const imageDataUrl = await composeImage();
    const loginUser = sessionStorage.getItem("loginUser");
    const loginObj = loginUser ? JSON.parse(loginUser) : null;
    const userId = loginObj?.id ?? null;
    const saveRes = await fetch("/api/photocard-save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageDataUrl, userId }),
    });
    const saveJson = await saveRes.json();
    if (!saveRes.ok || !saveJson.filename) throw new Error(saveJson.message || "저장 실패");
    return saveJson;
  };

  const handleSend = async () => {
    if (!email) { setStatus("이메일을 입력해주세요."); return; }
    setStatus("전송 중...");
    try {
      const loginUser = sessionStorage.getItem("loginUser");
      const loginObj = loginUser ? JSON.parse(loginUser) : null;
      const userName = loginObj?.nickname ? `${loginObj.nickname}님` : "사용자";

      let url = savedUrlRef.current;
      if (!url) {
        setStatus("이미지 저장 중...");
        const saveJson = await saveImage();
        url = saveJson.url;
        savedUrlRef.current = url;
      }

      setStatus("전송 중...");
      const res = await fetch("/api/photocard-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: email, url, userName }),
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

  const handleGoHome = () => {
    router.push("/");
  };

  return (
    <>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[90%] max-w-[400px] rounded-2xl bg-white px-8 py-7 shadow-xl">
            <h3 className="mb-1 text-[18px] font-bold text-[#555]">이메일로 보내기</h3>
            <p className="mb-5 text-[13px] text-[#999]">네컷사진을 이메일로 전송해드릴게요.</p>
            <input
              type="email"
              placeholder="이메일 주소를 입력하세요"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
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
                onClick={handleSend}
                className="flex-1 rounded-xl bg-gradient-to-r from-[#ffb7b1] to-[#ff7070] py-3 text-[13px] font-semibold text-white hover:opacity-90"
              >
                보내기
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="relative h-screen overflow-hidden">
        <img src="/img/Photo_Background.png" alt="" className="absolute inset-0 h-full w-full object-cover" style={{ zIndex: 0 }} />
        <div className="relative z-10 flex h-full flex-col">
          <div className="flex items-center justify-between px-8 py-2">
            <a href="/photocard">
              <img src="/img/logo.png" alt="Tone-Z" className="h-[clamp(36px,4vw,56px)]" />
            </a>
            <button
              onClick={() => router.push("/photocard/camera")}
              className="text-[17px] font-semibold text-[#ffb7b1] hover:text-[#ff7070] transition"
            >
              다시 찍기
            </button>
          </div>
          <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col justify-center overflow-hidden px-4 py-4">
          {/* 완성된 프레임 */}
          <div className="relative mb-8 w-full overflow-hidden rounded-2xl shadow-lg">
            <img
              src={frame?.src ?? "/img/Photo_Spring.png"}
              alt=""
              className="block w-full opacity-0"
            />

            {slots && slots.map((s, i) => (
              <div
                key={i}
                className="absolute overflow-hidden"
                style={{
                  left: `${s.left}%`,
                  top: `${s.top}%`,
                  width: `${s.width}%`,
                  height: `${s.height}%`,
                }}
              >
                {photos[i] ? (
                  <img src={photos[i]} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-white" />
                )}
              </div>
            ))}

            {frame && (
              <img
                src={frame.src}
                alt="frame"
                className="pointer-events-none absolute inset-0 h-full w-full object-cover"
              />
            )}
          </div>

          <div className="flex flex-col items-center gap-3">
            <button
              onClick={() => setShowModal(true)}
              className="w-full rounded-full bg-gradient-to-r from-[#ffb7b1] to-[#ff7070] py-4 text-[15px] font-bold text-white shadow-md hover:opacity-90 transition"
            >
              이메일로 보내기
            </button>
            <button
              onClick={handleGoHome}
              className="w-full rounded-full border-2 border-[#ffb7b1] py-4 text-[15px] font-semibold text-[#ff8b87] hover:bg-[#fff0f0] transition"
            >
              첫화면으로 돌아가기
            </button>
          </div>

          <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>
      </main>
    </>
  );
}
