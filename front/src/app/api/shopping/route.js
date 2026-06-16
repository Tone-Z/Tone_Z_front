const cache = new Map();

function decodeHtml(str) {
  if (!str) return str;
  return str.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query) return Response.json({ items: [] });

  if (cache.has(query)) return Response.json(cache.get(query));

  async function fetchFromNaver(q) {
    const res = await fetch(
      `https://openapi.naver.com/v1/search/shop.json?query=${encodeURIComponent(q)}&display=20&sort=sim`,
      {
        headers: {
          "X-Naver-Client-Id": process.env.NAVER_CLIENT_ID,
          "X-Naver-Client-Secret": process.env.NAVER_CLIENT_SECRET,
        },
      }
    );
    const data = await res.json();
    return (data.items ?? []).map((item) => ({
      ...item,
      image: decodeHtml(item.image),
      link: decodeHtml(item.link),
    }));
  }

  try {
    let items = await fetchFromNaver(query);

    // 이미지 있는 결과가 없으면 첫 단어(브랜드명)만으로 재검색
    if (!items.some((i) => i.image)) {
      const shortQuery = query.split(" ").slice(0, 2).join(" ");
      if (shortQuery !== query) {
        items = await fetchFromNaver(shortQuery);
      }
    }

    const result = { items };
    // 이미지 있는 결과가 하나라도 있을 때만 캐시
    if (items.some((i) => i.image)) {
      cache.set(query, result);
    }
    return Response.json(result);
  } catch {
    return Response.json({ items: [] });
  }
}
