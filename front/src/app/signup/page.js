"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import "../login/login.css";

export default function SignupPage() {
    const router = useRouter();

    const [nic, setNic] = useState("");
    const [pwd, setPwd] = useState("");
    const [msg, setMsg] = useState("");
    const [showModal, setShowModal] = useState(false);

    const onSignup = async function (e) {
        e.preventDefault();

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/signup`, {
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
                setMsg("");
                setShowModal(true);
            } else {
                setMsg("이미 존재하는 회원입니다.");
            }
        } catch (err) {
            console.log(err);
            setMsg("서버 오류");
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
                    alt="signup background"
                    className="bg"
                />
            </div>

            <div className="right">
                <h1 className="title">회원가입</h1>

                <p className="desc">
                    새로운 계정을 만들어 주세요.
                </p>

                <form
                    className="form-box"
                    onSubmit={onSignup}
                    autoComplete="off"
                >
                    <label className="label" htmlFor="nic">
                        닉네임
                    </label>

                    <input
                        id="nic"
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
                        회원가입
                    </button>
                </form>

                <div
                    className="signup"
                    onClick={function () {
                        router.push("/login");
                    }}
                >
                    이미 계정이 있으신가요?
                </div>

                {msg && <div className="error-msg">{msg}</div>}
            </div>

            {showModal && (
                <div className="modal-wrap">
                    <div className="modal">
                        <div className="modal-text">
                            회원가입이 완료되었습니다.
                        </div>

                        <div className="modal-text2">
                            로그인 페이지로 이동하시겠습니까?
                        </div>

                        <button
                            className="modal-btn"
                            onClick={function () {
                                router.push("/login");
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