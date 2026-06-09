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

  const crisisWords = ["자살", "ㅈㅅ", "자해", "ㅈㅎ", "죽고 싶다", "죽고싶다", "죽고싶", "죽고 싶", "죽어버리고 싶", "죽어버리고 싶다", "죽인다", "목숨", "스스로 목숨", "손목"];
  const sexualWords = ["섹스", "ㅅㅅ", "섹시", "야동", "ㅇㄷ", "야동배우", "포르노", "ㅍㄹㄴ", "성관계", "관계", "ㅅㄱㄱ", "자위", "ㅈㅇ", "성기", "ㅅㅇ", "음란", "AV", "av"];
  const bannedWords = [
    "썌끼", "썌끼야", "썌끼아", "쌔기", "쌔끼", "쌔끼야", "쌔기야", "새끼", "새끼야", "씨발", "시발", "씨발년", "시발년", "년", "Tlqkf", "tlqkf", "ㅅㅂ", "개새끼", "개새", "ㄱㅅㄲ", "병신", "ㅂㅅ", "지랄", "ㅈㄹ", "좆", "ㅈ같",
    "미친놈", "미친년", "ㅁㅊㄴ", "애미", "애비", "느금마", "쌍놈", "쌍년", "꺼져", "닥쳐",
  ];

  const allFilterWords = [...crisisWords, ...sexualWords, ...bannedWords];
  const hasFiltered = allFilterWords.some((word) => message.includes(word));

  if (hasFiltered) {
    let censoredMessage = message;
    for (const word of allFilterWords) {
      censoredMessage = censoredMessage.replaceAll(word, "❤️".repeat(word.length));
    }

    let reply;
    if (crisisWords.some((word) => message.includes(word))) {
      reply = "많이 힘드신가요? 💙 혼자 감당하지 않으셔도 돼요.\n자살예방상담전화 ☎ 1393 (24시간) 에 전화하시면 전문가가 도와드릴 수 있어요.";
    } 
    else if (sexualWords.some((word) => message.includes(word))) {
      reply = "해당 내용은 답변드리기 어려워요 🚫 퍼스널컬러나 뷰티 관련 질문을 해주세요 😊";
    } 
    else {
      reply = "욕설이나 비속어는 사용할 수 없어요 🚫 퍼스널컬러나 뷰티에 관해 편하게 질문해 주세요 😊";
    }

    return Response.json({ ok: true, reply, censoredMessage, conversationId: conversationId ?? null });
  }

  const toneLabel = toneLabels[tone] ?? null;
  const systemPrompt = [
    "당신은 Tone-Z의 퍼스널컬러 전문 챗봇입니다. 퍼스널컬러 진단, 메이크업, 코디, 화장품 추천 등 뷰티 분야의 전문가입니다.",
    toneLabel ? `사용자의 퍼스널컬러는 ${toneLabel}입니다. 모든 추천은 이 톤에 맞춰 구체적으로 해주세요.` : "",
    userName ? `사용자 이름: ${userName}` : "",
    "답변할 때는 다음 원칙을 따르세요:\n1. 추천할 때는 색상명, 제품 종류, 이유를 함께 설명해 주세요.\n2. 단순히 '좋아요'가 아니라 '왜 잘 어울리는지' 근거를 설명해 주세요.\n3. 가능하면 구체적인 컬러 예시(예: 코랄 핑크, 테라코타, 버건디 등)를 들어주세요.\n4. 질문이 모호하면 어떤 상황(데일리/특별한 날 등)인지 되물어보세요.",
    "퍼스널컬러 톤별 유튜버 목록 (유튜버 추천 시 이 목록만 사용하고, 목록에 없는 유튜버는 절대 추천하지 마세요):\n- 봄 웜 라이트: 유채, 효블리, 매거지민, 뽐니, 미닝, 꼬민지\n- 봄 웜 브라이트: 채니, 안다\n- 봄 웜 소프트: 단비, 쎄씰, 그날씨, 펄진주, 김서땅\n- 여름 쿨 라이트: 리피, 새얀, 썸블리, 김크리스탈\n- 여름 쿨 뮤트: 프롬하정, 다채, 지냐\n- 가을 웜 뮤트: 아르몽, 아즐, 애고, 송아현\n- 가을 웜 딥: 아르몽, 선리움, 민스코\n- 겨울 쿨 브라이트: 민베리, 베령, 블럼, 희소\n- 겨울 쿨 딥: 알라, 하나, 채히",
    "사용자가 욕설, 비속어, 혐오 표현을 사용하면 단호하게 사용 자제를 요청하고 대화를 중단하세요.",
    "정치, 종교, 사회적 논쟁 등 민감한 주제가 나오면 답변을 거절하고 퍼스널컬러 관련 주제로 대화를 유도하세요.",
    "뷰티, 퍼스널컬러, 메이크업, 패션, 화장품과 전혀 관련 없는 질문도 정중히 거절하고 퍼스널컬러 관련 질문으로 유도해 주세요.",
    "답변은 친근하고 자세하게, 한국어로 해주세요. 이모지를 적절히 사용해도 좋아요.",
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
    // 한글, 영어, 숫자, 이모지, 기본 기호 외 문자 제거 (중국어, 일본어, 아랍어 등)
    reply = reply.replace(/[一-鿿㐀-䶿぀-ヿ豈-﫿؀-ۿ֐-׿ऀ-ॿ฀-๿]/g, "");
  } catch (err) {
    console.error("Chatbot API error:", err);
    return Response.json({ ok: false, message: "AI 연결 실패" }, { status: 500 });
  }

  // Save to DB only for logged-in users
  let newConvId = conversationId ?? null;
  if (userId) {
    try {
      if (!newConvId) {
        const convRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chatbot/conversation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, title: message.slice(0, 30) }),
        });
        const convJson = await convRes.json();
        if (convJson.ok) {
          newConvId = convJson.conversationId;
        }
      }
      if (newConvId) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chatbot/message`, {
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
