"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { detectFrameSlots } from "../utils";

const MAX = 4;

export default function CameraPage() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const photosRef = useRef([]);
  const timerRef = useRef(null);
  const snapGuardRef = useRef(false); // 중복 snap 방지
  const startedRef = useRef(false);   // onloadedmetadata 중복 방지
  const router = useRouter();

  const [frame, setFrame] = useState(null);
  const [slots, setSlots] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [countdown, setCountdown] = useState(5);
  const [flash, setFlash] = useState(false); // 찍힐 때 플래시 효과

  function snap() {
    if (snapGuardRef.current) return;
    snapGuardRef.current = true;

    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c) { snapGuardRef.current = false; return; }

    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const ctx = c.getContext("2d");
    ctx.translate(c.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(v, 0, 0);
    const url = c.toDataURL("image/jpeg", 0.9);
    photosRef.current = [...photosRef.current, url];
    setPhotos([...photosRef.current]);
    setFlash(true);
    setTimeout(() => setFlash(false), 200);
    sessionStorage.setItem("photocard_photos", JSON.stringify(photosRef.current));

    if (photosRef.current.length >= MAX) {
      v.srcObject?.getTracks().forEach((t) => t.stop());
      router.push("/photocard/review");
    } else {
      // 다음 사진 카운트다운 전 1초 대기 — 사진이 슬롯에 채워지는 걸 보여줌
      setTimeout(() => {
        snapGuardRef.current = false;
        startCountdown();
      }, 800);
    }
  }

  function startCountdown() {
    clearInterval(timerRef.current);
    let c = 5;
    setCountdown(c);
    timerRef.current = setInterval(() => {
      c--;
      setCountdown(c);
      if (c <= 0) {
        clearInterval(timerRef.current);
        snap();
      }
    }, 1000);
  }

  useEffect(() => {
    const stored = sessionStorage.getItem("photocard_frame");
    if (stored) {
      const f = JSON.parse(stored);
      setFrame(f);
      detectFrameSlots(f.src).then(setSlots);
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user", aspectRatio: { ideal: 3 / 4 } } })
      .then((stream) => {
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          if (startedRef.current) return; // 중복 실행 차단
          startedRef.current = true;
          startCountdown();
        };
      })
      .catch(() => alert("카메라 접근 권한이 필요해요."));
    return () => {
      clearInterval(timerRef.current);
      videoRef.current?.srcObject?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const currentSlot = photos.length;

  const cameraStyle =
    slots && currentSlot < slots.length
      ? {
          left: `${slots[currentSlot].left}%`,
          top: `${slots[currentSlot].top}%`,
          width: `${slots[currentSlot].width}%`,
          height: `${slots[currentSlot].height}%`,
        }
      : { inset: 0 };

  return (
    <main className="relative h-screen overflow-hidden" style={{ backgroundImage: "url('/img/Photo_Background.png')", backgroundSize: "cover", backgroundRepeat: "no-repeat", backgroundPosition: "center" }}>
      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-center justify-between px-8 py-2">
          <a href="/photocard">
            <img src="/img/logo.png" alt="Tone-Z" className="h-[clamp(36px,4vw,56px)]" />
          </a>
          <span className="text-[13px] text-[#bbb]">{photos.length} / {MAX}장</span>
        </div>
        <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col justify-center overflow-hidden px-4 py-4">

        <div className="relative w-full overflow-hidden rounded-2xl shadow-lg">
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
              {i < photos.length ? (
                <img src={photos[i]} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-white" />
              )}
            </div>
          ))}

          {currentSlot < MAX && (
            <div className="absolute overflow-hidden" style={cameraStyle}>
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="h-full w-full object-cover"
                style={{ transform: "scaleX(-1)" }}
              />
              {/* 찍힐 때 흰색 플래시 */}
              {flash && <div className="absolute inset-0 bg-white opacity-80" />}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/30">
                  <span className="text-[24px] font-bold text-white">{countdown}</span>
                </div>
              </div>
            </div>
          )}

          {frame && (
            <img
              src={frame.src}
              alt="frame"
              className="pointer-events-none absolute inset-0 h-full w-full object-cover"
            />
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>
    </main>
  );
}
