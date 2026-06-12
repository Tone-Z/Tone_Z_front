import { NextResponse } from "next/server";

export async function POST(request) {
  const formData = await request.formData();
  const backendUrl = process.env.AI_BACKEND_URL || "http://127.0.0.1:8000";

  try {
    const res = await fetch(`${backendUrl}/diagnosis/video`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json(
      { error: "영상 진단 서버와 연결할 수 없어요." },
      { status: 500 },
    );
  }
}
