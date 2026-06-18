import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const backendUrl = process.env.AI_BACKEND_URL || "http://127.0.0.1:8000";
    const files = formData.getAll("files");

    const pickIndices = [
      Math.floor(files.length * 0.5),
      Math.floor(files.length * 0.25),
      Math.floor(files.length * 0.75),
    ];

    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) await new Promise((r) => setTimeout(r, 800));
      try {
        const body = new FormData();
        const file = files[pickIndices[attempt]] ?? files[0];
        body.append("file", file, "frame.jpg");

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
      { error: "얼굴을 최대한 가까이 하고 카메라을 바라봐 주세요." },
      { status: 500 },
    );
  } catch (e) {
    return NextResponse.json(
      { error: "얼굴을 최대한 가까이 하고 카메라을 바라봐 주세요." },
      { status: 500 },
    );
  }
}
