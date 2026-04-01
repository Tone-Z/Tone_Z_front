"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [user, setUser] = useState(null);
  const [showMenu, setShowMenu] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const data = sessionStorage.getItem("loginUser");

    if (data) {
      setUser(JSON.parse(data));
    } else {
      setUser(null);
    }
  }, []);

  const logout = () => {
    sessionStorage.removeItem("loginUser");
    localStorage.removeItem("loginUser");
    setUser(null);
    setShowMenu(false);
    router.refresh();
  };

  const startTest = () => {
    router.push("/scan");
  };

  return (
    <div className="min-h-screen bg-[#fff7f7]">
      
      {/* 헤더 */}
      <header className="relative z-20 flex h-[72px] w-full items-center justify-between bg-white px-6">
        <Link href="/">
          <Image
            src="/img/logo.png"
            alt="logo"
            width={110}
            height={40}
            quality={100}
            priority
            className="h-auto w-[110px]"
          />
        </Link>

        {user ? (
          <div className="relative">
            <div
              onClick={() => setShowMenu(!showMenu)}
              className="cursor-pointer rounded-full border border-[#f3b7bc] px-4 py-2 text-[#f3a0a8]"
            >
              {user.nickname}님
            </div>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-[120px] rounded-lg border bg-white shadow-md">
                <button
                  onClick={logout}
                  className="w-full py-2 text-[16px] text-[#444444] hover:bg-[#ffe3e3]"
                >
                  로그아웃
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-2 rounded-full border border-[#f3b7bc] px-4 py-2 text-[#f3a0a8]"
          >
            <Image
              src="/img/login_icon.png"
              alt="login"
              width={20}
              height={20}
              quality={100}
              priority
            />
            로그인
          </Link>
        )}
      </header>

      {/* 메인 */}
      <main
        className="relative h-[calc(100vh-72px)] w-full bg-top bg-no-repeat"
        style={{
          backgroundImage: "url('/img/main.png?v=3')",
          backgroundSize: "cover",
          backgroundPosition: "center 100%",
        }}
      >
        {/* 버튼 위치 */}
        <button
          onClick={startTest}
          className="absolute left-1/2 top-[46%] z-10 -translate-x-1/2 rounded-full bg-[#F7A4A8] px-10 py-4 text-[20px] text-white"
        >
          진단하기
        </button>
      </main>
    </div>
  );
}