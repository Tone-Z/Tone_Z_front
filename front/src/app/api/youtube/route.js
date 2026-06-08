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
    `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=40&relevanceLanguage=ko&key=${process.env.YOUTUBE_API_KEY}`
  );

  const data = await response.json();
  cache.set(query, data);
  return Response.json(data);
}
