import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export async function POST(request) {
  const { imageDataUrl, userId } = await request.json();

  if (!imageDataUrl) {
    return Response.json({ ok: false, message: "이미지가 없습니다." }, { status: 400 });
  }

  const base64 = imageDataUrl.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64, "base64");
  const filename = `${crypto.randomUUID()}.jpg`;

  try {
    await s3.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: filename,
      Body: buffer,
      ContentType: "image/jpeg",
    }));
  } catch (err) {
    console.error("R2 업로드 실패:", err);
    return Response.json({ ok: false, message: "파일 저장 실패" }, { status: 500 });
  }

  const url = `${process.env.R2_PUBLIC_URL}/${filename}`;

  try {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/photocard/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: userId ?? null, filename, url }),
    });
  } catch {
    // DB 저장 실패해도 파일 저장은 성공으로 처리
  }

  return Response.json({ ok: true, filename, url });
}
