"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const MAX_FRAME_COUNT = 7;
const FRAME_CAPTURE_INTERVAL_MS = 500;

export default function ScanPage() {
  const router = useRouter();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const framesRef = useRef([]);
  const isDiagnosingRef = useRef(false);

  const [mounted, setMounted] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const captureFrame = useCallback(async () => {
    if (!videoRef.current) return null;

    const video = videoRef.current;

    if (!video.videoWidth || !video.videoHeight) return null;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.9);
    });
  }, []);

  const requestSingleFrameDiagnosis = useCallback(
    async (fallbackBlob = null) => {
      const blob = fallbackBlob || (await captureFrame());

      if (!blob) {
        throw new Error("이미지 캡처에 실패했어요.");
      }

      const formData = new FormData();
      formData.append("file", blob, "capture.jpg");

      const res = await fetch("/api/ai/diagnosis", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || data.error || !data.season) {
        throw new Error(data.error || "단일 프레임 진단에 실패했어요.");
      }

      return data;
    },
    [captureFrame],
  );

  const finishDiagnosis = useCallback(async () => {
    if (isDiagnosingRef.current) return;

    isDiagnosingRef.current = true;

    const frames = framesRef.current.slice(0, MAX_FRAME_COUNT);
    let data = null;

    try {
      if (frames.length >= 2) {
        const formData = new FormData();

        frames.forEach((blob, index) => {
          formData.append("files", blob, `frame-${index}.jpg`);
        });

        const res = await fetch("/api/ai/diagnosis/video", {
          method: "POST",
          body: formData,
        });

        data = await res.json();

        if (!res.ok || data.error || !data.season) {
          throw new Error(data.error || "영상 기반 진단에 실패했어요.");
        }
      } else {
        data = await requestSingleFrameDiagnosis(frames[0]);
      }
    } catch (videoError) {
      try {
        data = await requestSingleFrameDiagnosis(frames[0]);
      } catch (singleError) {
        stopCamera();
        setError(singleError.message || "진단 서버와 연결할 수 없어요.");
        return;
      }
    }

    sessionStorage.setItem("diagnosisResult", JSON.stringify(data));
    sessionStorage.setItem("freshDiagnosis", "true");

    stopCamera();
    router.push(`/result/${data.season}`);
  }, [requestSingleFrameDiagnosis, router, stopCamera]);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        videoRef.current.onloadedmetadata = async () => {
          try {
            await videoRef.current.play();
            setCameraOn(true);
            setError("");
          } catch (e) {
            setCameraOn(false);
            setError("카메라 화면을 재생할 수 없어요.");
          }
        };
      }
    } catch (e) {
      setCameraOn(false);
      setError("카메라를 사용할 수 없어요. 권한을 허용해주세요.");
    }
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    startCamera();

    return () => {
      stopCamera();
    };
  }, [mounted, startCamera, stopCamera]);

  useEffect(() => {
    if (!mounted || !cameraOn) return;

    framesRef.current = [];
    setProgress(0);
    isDiagnosingRef.current = false;

    const captureAndStoreFrame = async () => {
      if (framesRef.current.length >= MAX_FRAME_COUNT || isDiagnosingRef.current) {
        return;
      }

      const blob = await captureFrame();

      if (!blob) return;

      framesRef.current = [...framesRef.current, blob].slice(0, MAX_FRAME_COUNT);

      const nextProgress = Math.round(
        (framesRef.current.length / MAX_FRAME_COUNT) * 100,
      );

      setProgress(nextProgress);

      if (framesRef.current.length >= MAX_FRAME_COUNT) {
        await finishDiagnosis();
      }
    };

    captureAndStoreFrame();

    const timer = setInterval(() => {
      captureAndStoreFrame();
    }, FRAME_CAPTURE_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [mounted, cameraOn, captureFrame, finishDiagnosis]);

  if (!mounted) return null;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#FFF6F6]">
      <header className="relative z-30 flex h-[72px] w-full items-center justify-between px-8">
        <Link href="/">
          <Image
            src="/img/logo.png"
            alt="logo"
            width={120}
            height={44}
            priority
            className="w-[120px]"
            style={{ height: "auto" }}
          />
        </Link>
      </header>

      <main className="relative h-[calc(100vh-72px)] overflow-hidden">
        <div className="pointer-events-none absolute inset-0 z-0">
          <Image
            src="/img/scan_bg.png"
            alt="scan background"
            fill
            priority
            className="object-cover"
          />
        </div>

        <div className="absolute left-1/2 top-[20px] z-20 -translate-x-1/2 text-center">
          <div className="flex items-center justify-center gap-6">
            <span className="text-[34px] text-[#ff9db5]">♥</span>
            <p className="text-[76px] font-black leading-none text-[#ff91a8] drop-shadow-[0_0_18px_rgba(255,145,168,0.65)]">
              {progress}%
            </p>
            <span className="text-[34px] text-[#ff9db5]">♥</span>
          </div>
        </div>

        <div className="absolute left-1/2 top-[47%] z-20 -translate-x-1/2 -translate-y-1/2">
          <div className="relative h-[470px] w-[600px] overflow-hidden rounded-[42px] border-[5px] border-[#ffd1dc] bg-black shadow-[0_0_35px_rgba(255,145,168,0.75)]">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 h-full w-full scale-x-[-1] object-cover"
            />

            {!cameraOn && (
              <div className="absolute inset-0 z-20 flex items-center justify-center px-6 text-center text-[18px] text-white">
                {error ? error : "카메라를 불러오는 중이에요."}
              </div>
            )}

            <div className="pointer-events-none absolute left-8 top-8 h-16 w-16 rounded-tl-[16px] border-l-[5px] border-t-[5px] border-white"></div>
            <div className="pointer-events-none absolute right-8 top-8 h-16 w-16 rounded-tr-[16px] border-r-[5px] border-t-[5px] border-white"></div>
            <div className="pointer-events-none absolute bottom-8 left-8 h-16 w-16 rounded-bl-[16px] border-b-[5px] border-l-[5px] border-white"></div>
            <div className="pointer-events-none absolute bottom-8 right-8 h-16 w-16 rounded-br-[16px] border-b-[5px] border-r-[5px] border-white"></div>

            <div className="pointer-events-none absolute left-0 top-0 z-30 h-full w-full animate-scanMove">
              <div className="absolute left-0 top-1/2 h-[3px] w-full -translate-y-1/2 bg-[#ff8fb0] shadow-[0_0_18px_6px_rgba(255,143,176,0.9)]"></div>
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[40px] text-white drop-shadow-[0_0_12px_rgba(255,143,176,1)]">
                ♥
              </div>
            </div>

            <div className="absolute bottom-5 left-1/2 z-30 -translate-x-1/2 rounded-full bg-[#6f3e4b]/90 px-7 py-2 text-[17px] font-bold text-white">
              ♥ 얼굴 인식 중...
            </div>
          </div>
        </div>

        <div className="absolute bottom-[78px] left-1/2 z-20 w-[72%] max-w-[980px] -translate-x-1/2">
          <div className="flex items-center gap-5">
            <span className="text-[30px] text-[#ff91a8]">♥</span>

            <div className="h-[32px] flex-1 overflow-hidden rounded-full bg-[#f2dfe2]">
              <div
                className="flex h-full items-center justify-center rounded-full bg-[#f78f9b] text-[15px] font-bold text-white transition-all duration-200"
                style={{ width: progress + "%" }}
              >
                {progress >= 6 ? progress + "%" : ""}
              </div>
            </div>

            <span className="text-[30px] text-[#ff91a8]">♥</span>
          </div>

          <div className="mt-5 flex justify-center">
            <div className="rounded-[16px] bg-[#fff4f6] px-10 py-4 text-[22px] font-bold text-[#1F1F1F]">
              ♥ 퍼스널컬러를 측정 중이에요!
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        @keyframes scanMove {
          0% {
            transform: translateY(-170px);
          }
          50% {
            transform: translateY(170px);
          }
          100% {
            transform: translateY(-170px);
          }
        }

        .animate-scanMove {
          animation: scanMove 2.2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
