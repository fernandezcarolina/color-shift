// Vercel function: GET /api/photos?count=N
// Fetches random Unsplash photos server-side so the access key never reaches
// the browser. Same behaviour as server.py (local) and Matt's /api/photos route:
// rotate through a varied query pool, one landscape photo per query.
// The key comes from the UNSPLASH_ACCESS_KEY environment variable in Vercel.

const QUERIES = [
  'nature', 'architecture', 'abstract', 'texture', 'city', 'landscape',
  'portrait', 'street', 'minimal', 'ocean', 'mountain', 'forest',
  'desert', 'sky', 'neon', 'vintage', 'food', 'macro', 'wildlife',
  'interior', 'fashion', 'art', 'industrial', 'graffiti', 'flower',
  'space', 'night', 'rain', 'fog', 'sunset', 'snow', 'autumn',
  'reflection', 'shadow', 'bokeh', 'pattern', 'travel', 'coffee',
  'music', 'sport', 'vehicle', 'technology', 'plant', 'bird',
];
const UTM = 'utm_source=color_shift_prototype&utm_medium=referral';
const withUtm = url => `${url}${url.includes('?') ? '&' : '?'}${UTM}`;

async function fetchOne(query, key) {
  try {
    const res = await fetch(
      `https://api.unsplash.com/photos/random?orientation=landscape&query=${encodeURIComponent(query)}`,
      { headers: { Authorization: `Client-ID ${key}`, 'Accept-Version': 'v1' } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const p = Array.isArray(data) ? data[0] : data;
    if (!p) return null;
    return {
      id: p.id,
      url: p.urls.regular,
      color: p.color || '#888888',
      photographer: p.user.name,
      photographerUrl: withUtm(p.user.links.html),
      photoUrl: withUtm(p.links.html),
      alt: p.alt_description || 'Unsplash photo',
    };
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  res.setHeader('Cache-Control', 'no-store');
  if (!key) return res.status(500).json({ error: 'UNSPLASH_ACCESS_KEY is not set' });

  const count = Math.max(1, Math.min(30, Number.parseInt(req.query.count, 10) || 10));
  const queries = [...QUERIES].sort(() => Math.random() - 0.5).slice(0, count);
  const photos = (await Promise.all(queries.map(q => fetchOne(q, key)))).filter(Boolean);

  if (photos.length === 0) return res.status(502).json({ error: 'No photos returned (rate limit or network)' });
  res.status(200).json(photos);
}
