const toneLabels = {
  "spring-light": "봄 웜 라이트",
  "spring-bright": "봄 웜 브라이트",
  "spring-soft": "봄 웜 소프트",
  "summer-light": "여름 쿨 라이트",
  "summer-mute": "여름 쿨 뮤트",
  "autumn-mute": "가을 웜 뮤트",
  "autumn-deep": "가을 웜 딥",
  "winter-bright": "겨울 쿨 브라이트",
  "winter-deep": "겨울 쿨 딥",
};

export async function POST(request) {
  const { message, history = [], tone, userId, conversationId, userName } =
    await request.json();

  if (!message) {
    return Response.json({ ok: false, message: "메시지가 없습니다." }, { status: 400 });
  }

  const toneLabel = toneLabels[tone] ?? null;
  const systemPrompt = [
    "당신은 Tone-Z의 퍼스널컬러 전문 챗봇입니다. 퍼스널컬러 진단, 메이크업, 코디, 화장품 추천 등 뷰티와 관련된 질문에 친근하게 답변해 드립니다.",
    toneLabel ? `사용자의 퍼스널컬러는 ${toneLabel}입니다. 이에 맞는 추천을 해주세요.` : "",
    userName ? `사용자 이름: ${userName}` : "",
    "답변은 간결하고 친근하게, 한국어로 해주세요. 이모지를 적절히 사용해도 좋아요.",
  ]
    .filter(Boolean)
    .join("\n");

  const apiMessages = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: message },
  ];

  const groqMessages = [
    { role: "system", content: systemPrompt },
    ...apiMessages,
  ];

  let reply = "";
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: groqMessages,
        max_tokens: 1024,
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      console.error("Groq API error:", JSON.stringify(json));
      return Response.json({ ok: false, message: json.error?.message || "AI 응답 실패" }, { status: 500 });
    }

    reply = json.choices?.[0]?.message?.content || "죄송해요, 응답을 받지 못했어요.";
  } catch (err) {
    console.error("Chatbot API error:", err);
    return Response.json({ ok: false, message: "AI 연결 실패" }, { status: 500 });
  }

  // Save to DB only for logged-in users
  let newConvId = conversationId ?? null;
  if (userId) {
    try {
      if (!newConvId) {
        const convRes = await fetch("http://localhost:8080/chatbot/conversation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, title: message.slice(0, 30) }),
        });
        const convJson = await convRes.json();
        if (convJson.ok) newConvId = convJson.conversationId;
      }
      if (newConvId) {
        await fetch("http://localhost:8080/chatbot/message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: newConvId,
            userMessage: message,
            assistantMessage: reply,
          }),
        });
      }
    } catch (err) {
      console.error("DB save error:", err);
    }
  }

  return Response.json({ ok: true, reply, conversationId: newConvId });
}
