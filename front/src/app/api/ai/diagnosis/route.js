import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const backendUrl = process.env.AI_BACKEND_URL || "http://127.0.0.1:8000";
    const files = formData.getAll("files");

    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) await new Promise((r) => setTimeout(r, 1000 * attempt));

      try {
        const body = new FormData();
        if (files.length > 0) {
          files.forEach((f, i) => body.append("files", f, `frame-${i}.jpg`));
        } else {
          for (const [key, value] of formData.entries()) {
            body.append(key, value);
          }
        }

        const res = await fetch(`${backendUrl}/diagnosis`, {
          method: "POST",
          body,
        });

        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) continue;

        const data = await res.json();
        if (res.ok && data.season) return NextResponse.json(data);
      } catch {}
    }

    return NextResponse.json(
      { error: "진단 서버와 연결할 수 없어요." },
      { status: 500 },
    );
  } catch (e) {
    return NextResponse.json(
      { error: "진단 서버와 연결할 수 없어요." },
      { status: 500 },
    );
  }
}
