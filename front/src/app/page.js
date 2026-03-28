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
    <div className="relative min-h-screen overflow-hidden bg-[#fff7f7]">
      <Image
        src="/img/main_bg.png"
        alt="main background"
        fill
        quality={100}
        priority
        className="object-cover object-center"
      />

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

      <main className="relative z-10 flex flex-col items-center pt-[95px] text-center">
        <h1 className="text-[64px] font-medium leading-tight text-[#7D5A5A] xl:text-[78px]">
          나에게 어울리는
          <br />
          퍼스널 컬러를 찾아보세요
        </h1>

        <p className="mt-6 text-[20px] text-[#7D5A5A]">
          과학적인 진단을 통해 당신만의 색상을 발견하세요
        </p>

        <button
          onClick={startTest}
          className="mt-8 rounded-full bg-[#F7A4A8] px-10 py-4 text-[20px] text-white"
        >
          진단하기
        </button>
      </main>
    </div>
  );
}