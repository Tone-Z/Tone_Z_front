import { NextResponse } from "next/server";

export async function POST(request) {
  const formData = await request.formData();
  const backendUrl = process.env.AI_BACKEND_URL || "http://127.0.0.1:8000";
  const endpoint = formData.has("files") ? "/diagnosis/video" : "/diagnosis";

  try {
    const res = await fetch(`${backendUrl}${endpoint}`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json(
      { error: "진단 서버와 연결할 수 없어요." },
      { status: 500 },
    );
  }
}
