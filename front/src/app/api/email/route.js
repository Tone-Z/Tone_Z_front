import nodemailer from "nodemailer";

export async function POST(request) {
  const { to, tone, koreanType } = await request.json();

  if (!to) {
    return Response.json({ ok: false, message: "이메일 주소가 없습니다." }, { status: 400 });
  }

  const accounts = [
    { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    { user: process.env.EMAIL_USER_2, pass: process.env.EMAIL_PASS_2 },
  ].filter((a) => a.user && a.pass);
  const account = accounts[Math.floor(Math.random() * accounts.length)];

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: account.user, pass: account.pass },
  });

  const resultUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/result/${tone}`;

  await transporter.sendMail({
    from: `"Tone-Z" <${account.user}>`,
    to,
    subject: `나의 퍼스널컬러는 ${koreanType}!`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #fff8f8; border-radius: 16px;">
        <h2 style="color: #ff7070; margin-bottom: 8px;">Tone-Z 퍼스널컬러 진단 결과</h2>
        <p style="color: #555; font-size: 16px; margin-bottom: 24px;">
          나의 퍼스널컬러는 <strong style="color: #ff8b87;">${koreanType}</strong> 입니다!
        </p>
        <a href="${resultUrl}"
          style="display: inline-block; background: linear-gradient(to right, #ffb7b1, #ff7070); color: white; padding: 14px 32px; border-radius: 999px; text-decoration: none; font-weight: bold; font-size: 15px;">
          결과 자세히 보기
        </a>
        <p style="color: #bbb; font-size: 12px; margin-top: 24px;">Tone-Z에서 보내드린 메일입니다.</p>
      </div>
    `,
  });

  return Response.json({ ok: true });
}
