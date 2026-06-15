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

  const searchRes = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=40&relevanceLanguage=ko&key=${process.env.YOUTUBE_API_KEY}`
  );
  const searchData = await searchRes.json();

  const items = searchData.items ?? [];
  const videoIds = items.map((item) => item.id.videoId).filter(Boolean).join(",");

  if (!videoIds) {
    const result = { items: [] };
    cache.set(query, result);
    return Response.json(result);
  }

  const statusRes = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=status&id=${videoIds}&key=${process.env.YOUTUBE_API_KEY}`
  );
  const statusData = await statusRes.json();

  const embeddableIds = new Set(
    (statusData.items ?? [])
      .filter((v) => v.status?.embeddable)
      .map((v) => v.id)
  );

  const filtered = { ...searchData, items: items.filter((item) => embeddableIds.has(item.id.videoId)) };
  cache.set(query, filtered);
  return Response.json(filtered);
}
