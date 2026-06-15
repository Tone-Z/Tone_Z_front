"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [user, setUser] = useState(null);
  const [btnTop, setBtnTop] = useState("54%");
  const [bgPos, setBgPos] = useState("center 100%");
  const router = useRouter();

  useEffect(() => {
    const data = sessionStorage.getItem("loginUser");
    setUser(data ? JSON.parse(data) : null);
  }, []);

  useEffect(() => {
    const update = () => {
      const fs = window.innerHeight >= window.screen.height - 50;
      setBtnTop(fs ? "49%" : "47%");
      setBgPos(fs ? "center 45%" : "center 100%");
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const startTest = () => {
    router.push("/scan");
  };

  return (
    <div className="min-h-screen bg-[#fff7f7]">

      {/* 헤더 */}
      <header className="fixed top-0 left-0 right-0 z-20 flex h-[80px] w-full items-center justify-between bg-white px-8">
        <Link href="/">
          <Image
            src="/img/logo.png"
            alt="logo"
            width={160}
            height={56}
            quality={100}
            priority
            className="w-[160px]"
            style={{ height: "auto" }}
          />
        </Link>

        {user ? (
          <div
            onClick={() => router.push("/mypage")}
            className="cursor-pointer rounded-full border border-[#f3b7bc] px-6 py-2.5 text-[16px] text-[#f3a0a8]"
          >
            {user.nickname}님
          </div>
        ) : (
          <Link href="/login">
            <img src="/img/login_button.png" alt="로그인" className="h-auto w-[200px]" />
          </Link>
        )}
      </header>

      {/* 메인 */}
      <main
        className="relative h-screen w-full bg-top bg-no-repeat"
        style={{
          backgroundImage: "url('/img/main.png?v=3')",
          backgroundSize: "cover",
          backgroundPosition: bgPos,
        }}
      >
        {/* 버튼 위치 */}
        <button
          onClick={startTest}
          className="absolute left-1/2 z-10 -translate-x-1/2"
          style={{ top: btnTop }}
        >
          <img src="/img/main_button.png" alt="진단하기" className="h-auto w-[240px]" />
        </button>
      </main>
    </div>
  );
}
