import { NextResponse } from "next/server";

const VALID_SEASONS = [
  "spring-light", "spring-bright", "spring-soft",
  "summer-light", "summer-mute",
  "autumn-mute", "autumn-deep",
  "winter-bright", "winter-deep",
];

async function analyzePersonalColor(imageBase64) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
              },
            },
            {
              type: "text",
              text: `You are a Korean personal color (퍼스널컬러) expert. Analyze this person's face — skin undertone (warm/cool), contrast level, brightness, and saturation — and determine their personal color season type.

Reply with ONLY one of these exact codes, nothing else:
spring-light
spring-bright
spring-soft
summer-light
summer-mute
autumn-mute
autumn-deep
winter-bright
winter-deep`,
            },
          ],
        },
      ],
      max_tokens: 20,
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`Groq error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content?.trim().toLowerCase() ?? "";

  if (VALID_SEASONS.includes(content)) return content;

  for (const season of VALID_SEASONS) {
    if (content.includes(season)) return season;
  }

  return null;
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files");

    if (files.length === 0) {
      return NextResponse.json({ error: "이미지가 없어요." }, { status: 400 });
    }

    const pickIndices = [
      Math.floor(files.length * 0.5),
      Math.floor(files.length * 0.25),
      Math.floor(files.length * 0.75),
    ];

    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) await new Promise((r) => setTimeout(r, 800));
      try {
        const file = files[pickIndices[attempt]] ?? files[0];
        const arrayBuffer = await file.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");

        const season = await analyzePersonalColor(base64);
        if (season) return NextResponse.json({ season });
      } catch (e) {
        console.error(`Diagnosis attempt ${attempt + 1} failed:`, e?.message);
      }
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
