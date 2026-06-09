"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function ScanPage() {
  const router = useRouter();
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [mounted, setMounted] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    startCamera();

    return () => {
      stopCamera();
    };
  }, [mounted]);

  useEffect(() => {
    if (!mounted || !cameraOn) return;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);

          setTimeout(() => {
            sessionStorage.setItem("freshDiagnosis", "true");
            router.push("/result/spring-light");
          }, 500);

          return 100;
        }

        return prev + 1;
      });
    }, 60);

    return () => clearInterval(timer);
  }, [mounted, cameraOn, router]);

  const startCamera = async () => {
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
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  if (!mounted) return null;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#171717]">
      <header className="relative z-30 flex h-[72px] w-full items-center justify-between px-8">
        <Link href="/">
          <Image
            src="/img/logo.png"
            alt="logo"
            width={120}
            height={44}
            priority
            className="h-auto w-[120px]"
          />
        </Link>
      </header>

      <main className="relative h-[calc(100vh-72px)] overflow-hidden">
        {/* 배경 동물 이미지 */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <Image
            src="/img/scan_bg.png"
            alt="scan background"
            fill
            priority
            className="object-cover"
          />
        </div>

        {/* 위쪽 퍼센트 */}
        <div className="absolute left-1/2 top-[20px] z-20 -translate-x-1/2 text-center">
          <div className="flex items-center justify-center gap-6">
            <span className="text-[34px] text-[#ff9db5]">♥</span>
            <p className="text-[76px] font-black leading-none text-[#ff91a8] drop-shadow-[0_0_18px_rgba(255,145,168,0.65)]">
              {progress}%
            </p>
            <span className="text-[34px] text-[#ff9db5]">♥</span>
          </div>
        </div>

        {/* 중앙 스캔 박스 */}
        <div className="absolute left-1/2 top-[47%] z-20 -translate-x-1/2 -translate-y-1/2">
          <div className="relative h-[430px] w-[560px] overflow-hidden rounded-[42px] border-[5px] border-[#ffd1dc] bg-black shadow-[0_0_35px_rgba(255,145,168,0.75)]">
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

            {/* 모서리 가이드 */}
            <div className="pointer-events-none absolute left-8 top-8 h-16 w-16 rounded-tl-[16px] border-l-[5px] border-t-[5px] border-white"></div>
            <div className="pointer-events-none absolute right-8 top-8 h-16 w-16 rounded-tr-[16px] border-r-[5px] border-t-[5px] border-white"></div>
            <div className="pointer-events-none absolute bottom-8 left-8 h-16 w-16 rounded-bl-[16px] border-b-[5px] border-l-[5px] border-white"></div>
            <div className="pointer-events-none absolute bottom-8 right-8 h-16 w-16 rounded-br-[16px] border-b-[5px] border-r-[5px] border-white"></div>

            {/* 움직이는 스캔 라인 + 하트 */}
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

        {/* 진행바 */}
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