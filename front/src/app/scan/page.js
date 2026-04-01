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
    if (!mounted) {
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [mounted]);

  useEffect(() => {
    if (!mounted || !cameraOn) {
      return;
    }

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);

          setTimeout(() => {
            router.push("/result");
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

  if (!mounted) {
    return null;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#343434]">
      <header className="relative z-20 flex h-[72px] w-full items-center px-8">
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
        {/* 왼쪽: 곰 아래, 토끼 위 */}
        <div className="pointer-events-none absolute left-[-55px] top-[355px] z-10">
          <Image
            src="/img/bear.png"
            alt="bear"
            width={460}
            height={500}
            priority
            className="h-auto w-[460px]"
          />
        </div>

        <div className="pointer-events-none absolute left-[-30px] top-[125px] z-20">
          <Image
            src="/img/rabbit.png"
            alt="rabbit"
            width={460}
            height={500}
            priority
            className="h-auto w-[460px]"
          />
        </div>

        {/* 오른쪽: 햄스터 아래, 여우 위 */}
        <div className="pointer-events-none absolute right-[-55px] top-[360px] z-10">
          <Image
            src="/img/hamster.png"
            alt="hamster"
            width={460}
            height={500}
            priority
            className="h-auto w-[460px]"
          />
        </div>

        <div className="pointer-events-none absolute right-[-30px] top-[120px] z-20">
          <Image
            src="/img/fox.png"
            alt="fox"
            width={460}
            height={500}
            priority
            className="h-auto w-[460px]"
          />
        </div>

        {/* 중앙 카메라 타원 */}
        <div className="absolute left-1/2 top-[42%] z-30 -translate-x-1/2 -translate-y-1/2">
          <div className="relative h-[520px] w-[300px] overflow-hidden rounded-[999px] bg-[#9E9E9E]">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 h-full w-full scale-x-[-1] object-cover"
            />

            {!cameraOn && (
              <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-[16px] text-white">
                {error ? error : "카메라를 불러오는 중이에요."}
              </div>
            )}

            <div className="pointer-events-none absolute inset-0 rounded-[999px] border-[6px] border-dashed border-white"></div>
          </div>
        </div>

        {/* 진행바 */}
        <div className="absolute bottom-[88px] left-1/2 z-30 w-[72%] max-w-[980px] -translate-x-1/2">
          <div className="h-[28px] w-full overflow-hidden rounded-full bg-[#E8D7D8]">
            <div
              className="flex h-full items-center justify-center rounded-full bg-[#F79191] text-[14px] font-medium text-white transition-all duration-200"
              style={{ width: progress + "%" }}
            >
              {progress >= 6 ? progress + "%" : ""}
            </div>
          </div>

          <div className="mt-5 flex justify-center">
            <div className="rounded-[10px] bg-[#F2F2F2] px-5 py-3 text-[15px] text-[#1F1F1F]">
              {cameraOn
                ? "퍼스널컬러를 측정 중이에요!"
                : error
                ? "카메라 연결이 필요해요."
                : "카메라를 준비 중이에요."}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}