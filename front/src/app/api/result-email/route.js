import nodemailer from "nodemailer";

export async function POST(request) {
  const { to, resultUrl, userName = "사용자" } = await request.json();

  if (!to || !resultUrl) {
    return Response.json({ ok: false, message: "필수 값이 없습니다." }, { status: 400 });
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

  try {
    await transporter.sendMail({
      from: `"Tone-Z" <${account.user}>`,
      to,
      subject: `${userName}님의 Tone-Z 퍼스널컬러 진단 결과예요!`,
      text: `${userName}님의 퍼스널컬러 진단 결과를 확인해보세요: ${resultUrl}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #fff8f8; border-radius: 16px; text-align: center;">
          <h2 style="color: #ff7070; margin-bottom: 8px;">Tone-Z 퍼스널컬러 진단 결과</h2>
          <p style="color: #555; font-size: 16px; margin-bottom: 32px;">
            ${userName}님의 퍼스널컬러 진단 결과가 완성됐어요! 🎨<br/>
            아래 버튼을 눌러 결과를 확인해보세요.
          </p>
          <a href="${resultUrl}"
            style="display: inline-block; background: linear-gradient(to right, #ffb7b1, #ff7070); color: white; padding: 16px 40px; border-radius: 50px; text-decoration: none; font-size: 16px; font-weight: bold;">
            결과 보러가기
          </a>
          <p style="color: #bbb; font-size: 12px; margin-top: 32px;">Tone-Z에서 보내드린 메일입니다.</p>
        </div>
      `,
    });
  } catch (err) {
    return Response.json({ ok: false, message: "전송 실패: " + err.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
