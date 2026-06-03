import nodemailer from "nodemailer";

export async function POST(request) {
  const { to, filename, url, userName = "사용자" } = await request.json();

  if (!to || (!filename && !url)) {
    return Response.json({ ok: false, message: "필수 값이 없습니다." }, { status: 400 });
  }

  const imageUrl = url || `${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET_NAME}/${filename}`;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: `"Tone-Z" <${process.env.EMAIL_USER}>`,
      to,
      subject: `${userName}의 Tone-Z 네컷사진이 완성됐어요!`,
      text: `${userName}만의 네컷사진이 완성됐어요! Tone-Z에서 보내드린 메일입니다.`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #fff8f8; border-radius: 16px;">
          <h2 style="color: #ff7070; margin-bottom: 8px;">Tone-Z 네컷사진</h2>
          <p style="color: #555; font-size: 16px; margin-bottom: 24px;">
            ${userName}만의 네컷사진이 완성됐어요! 🎞️
          </p>
          <img src="${imageUrl}" style="width: 100%; border-radius: 12px; display: block;" alt="네컷사진" />
          <p style="color: #bbb; font-size: 12px; margin-top: 24px;">Tone-Z에서 보내드린 메일입니다.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("[photocard-email] 전송 실패:", err.message);
    return Response.json({ ok: false, message: "전송 실패: " + err.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
