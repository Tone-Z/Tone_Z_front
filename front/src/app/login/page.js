"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "./login.css";

export default function LoginPage() {
    const router = useRouter();

    useEffect(() => {
        const timer = { id: null };
        const reset = () => { clearTimeout(timer.id); timer.id = setTimeout(() => router.push("/"), 30000); };
        const events = ["mousemove", "scroll", "click", "touchstart", "keypress"];
        events.forEach((e) => window.addEventListener(e, reset));
        reset();
        return () => { clearTimeout(timer.id); events.forEach((e) => window.removeEventListener(e, reset)); };
    }, [router]);

    const [nic, setNic] = useState("");
    const [pwd, setPwd] = useState("");
    const [showModal, setShowModal] = useState(false);

    const onLog = async function (e) {
        e.preventDefault();

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    nic: nic,
                    pwd: pwd
                })
            });

            const dat = await res.json();

            if (dat.ok) {
                localStorage.removeItem("loginUser");
                sessionStorage.setItem("loginUser", JSON.stringify(dat.user));
                router.push("/");
            } else {
                setShowModal(true);
            }
        } catch (err) {
            console.log(err);
        }
    };

    return (
        <div className="login-wrap">
            <a href="/" style={{ position: "fixed", top: "20px", right: "28px", zIndex: 100 }}>
                <img src="/img/logo.png" alt="Tone-Z" style={{ width: "110px" }} />
            </a>
            <div className="left">
                <img
                    src="/img/login_signup.png"
                    alt="login background"
                    className="bg"
                />
            </div>

            <div className="right">
                <h1 className="title">로그인</h1>

                <p className="desc">
                    다시 오신 것을 환영합니다. 계정에 로그인해 주세요.
                </p>

                <form className="form-box" onSubmit={onLog} autoComplete="off">
                    <label className="label" htmlFor="nic">
                        닉네임
                    </label>

                    <input
                        id="nic"
                        name="tonez_nickname"
                        type="text"
                        className="input"
                        placeholder="닉네임을 입력하세요"
                        value={nic}
                        autoComplete="off"
                        onChange={function (e) {
                            setNic(e.target.value);
                        }}
                    />

                    <label className="label" htmlFor="pwd">
                        비밀번호
                    </label>

                    <input
                        id="pwd"
                        name="tonez_password"
                        type="password"
                        className="input"
                        placeholder="비밀번호를 입력하세요"
                        value={pwd}
                        autoComplete="new-password"
                        onChange={function (e) {
                            setPwd(e.target.value);
                        }}
                    />

                    <button className="btn" type="submit">
                        로그인
                    </button>
                </form>

                <div
                    className="signup"
                    onClick={function () {
                        router.push("/signup");
                    }}
                >
                    회원가입 하시겠습니까?
                </div>
            </div>

            {showModal && (
                <div className="modal-wrap">
                    <div className="modal">
                        <div className="modal-text">
                            회원 정보가 틀렸습니다.
                        </div>

                        <div className="modal-text2">
                            닉네임 또는 비밀번호를 다시 확인해 주세요.
                        </div>

                        <button
                            className="modal-btn"
                            onClick={function () {
                                setShowModal(false);
                            }}
                        >
                            확인
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}