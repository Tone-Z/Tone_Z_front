const cache = new Map();

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query) {
    return Response.json({ items: [] });
  }

  if (cache.has(query)) {
    return Response.json(cache.get(query));
  }

  const response = await fetch(
    `https://openapi.naver.com/v1/search/shop.json?query=${encodeURIComponent(query)}&display=1&sort=sim`,
    {
      headers: {
        "X-Naver-Client-Id": process.env.NAVER_CLIENT_ID,
        "X-Naver-Client-Secret": process.env.NAVER_CLIENT_SECRET,
      },
    }
  );

  const data = await response.json();
  cache.set(query, data);
  return Response.json(data);
}
