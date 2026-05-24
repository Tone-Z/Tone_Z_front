import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request) {
  const { imageDataUrl, userId } = await request.json();

  if (!imageDataUrl) {
    return Response.json({ ok: false, message: "이미지가 없습니다." }, { status: 400 });
  }

  const base64 = imageDataUrl.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64, "base64");
  const filename = `${crypto.randomUUID()}.jpg`;
  const dir = path.join(process.cwd(), "public", "photocards");

  try {
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), buffer);
  } catch (err) {
    return Response.json({ ok: false, message: "파일 저장 실패" }, { status: 500 });
  }

  // DB에 기록 (백엔드 서버)
  try {
    await fetch("http://localhost:8080/photocard/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: userId ?? null, filename }),
    });
  } catch {
    // DB 저장 실패해도 파일 저장은 성공으로 처리
  }

  return Response.json({ ok: true, filename });
}
