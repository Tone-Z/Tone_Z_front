import { toneData } from "../../result/data";

const cache = new Map();

async function fetchItem(name) {
  try {
    const res = await fetch(
      `https://openapi.naver.com/v1/search/shop.json?query=${encodeURIComponent(name)}&display=1&sort=sim`,
      {
        headers: {
          "X-Naver-Client-Id": process.env.NAVER_CLIENT_ID,
          "X-Naver-Client-Secret": process.env.NAVER_CLIENT_SECRET,
        },
      }
    );
    const data = await res.json();
    return data.items?.[0] ?? null;
  } catch {
    return null;
  }
}

async function warmTone(tone) {
  const productItems = toneData[tone].productItems ?? [];
  const apiResults = await Promise.all(productItems.map((p) => fetchItem(p.name)));
  const items = productItems.map((p, i) => {
    const apiItem = apiResults[i];
    return {
      image: apiItem?.image || null,
      title: p.name,
      shade: p.shade,
      link: apiItem?.link || null,
      price: apiItem?.lprice || null,
      brand: apiItem?.brand || apiItem?.maker || "",
    };
  });
  cache.set(tone, items);
}

// 서버 시작 시 모든 톤 캐시 미리 채우기
(async () => {
  for (const tone of Object.keys(toneData)) {
    warmTone(tone).catch(() => {});
  }
})();

async function fetchItem(name) {
  try {
    const res = await fetch(
      `https://openapi.naver.com/v1/search/shop.json?query=${encodeURIComponent(name)}&display=1&sort=sim`,
      {
        headers: {
          "X-Naver-Client-Id": process.env.NAVER_CLIENT_ID,
          "X-Naver-Client-Secret": process.env.NAVER_CLIENT_SECRET,
        },
      }
    );
    const data = await res.json();
    return data.items?.[0] ?? null;
  } catch {
    return null;
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const tone = searchParams.get("tone");

  if (!tone || !toneData[tone]) {
    return Response.json({ items: [] });
  }

  if (cache.has(tone)) {
    return Response.json({ items: cache.get(tone) });
  }

  await warmTone(tone);
  return Response.json({ items: cache.get(tone) ?? [] });
}
