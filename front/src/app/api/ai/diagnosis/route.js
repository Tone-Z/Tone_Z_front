import { NextResponse } from "next/server";

export async function POST(request) {
  const formData = await request.formData();

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  try {
    const res = await fetch(`${backendUrl}/diagnosis`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: "백엔드 서버와 연결할 수 없어요." }, { status: 500 });
  }
}
