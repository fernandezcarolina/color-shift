// Vercel function: GET /api/photos?count=N
// Fetches random Unsplash photos server-side so the access key never reaches
// the browser. Same behaviour as server.py (local); uses Matt's query pool,
// two queries per batch (see fetchBatch).
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

// One request returns several photos for one query. Two queries per batch keep
// palettes varied while using 2 of Unsplash's 50 requests/hour instead of 10.
async function fetchBatch(query, count, key) {
  try {
    const res = await fetch(
      `https://api.unsplash.com/photos/random?orientation=landscape&count=${count}&query=${encodeURIComponent(query)}`,
      { headers: { Authorization: `Client-ID ${key}`, 'Accept-Version': 'v1' } },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (Array.isArray(data) ? data : [data]).map(p => ({
      id: p.id,
      url: p.urls.regular,
      color: p.color || '#888888',
      photographer: p.user.name,
      photographerUrl: withUtm(p.user.links.html),
      photoUrl: withUtm(p.links.html),
      alt: p.alt_description || 'Unsplash photo',
    }));
  } catch {
    return [];
  }
}

// Other sites may only call this from the Color Shift React Native web build
// (and local development), so strangers can't spend the Unsplash quota.
// The native iPhone app sends no Origin header and isn't affected.
const ALLOWED_ORIGINS = [
  'https://color-shift-native.vercel.app',
  'http://localhost:8081',
  'http://127.0.0.1:8650',
];

export default async function handler(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  if (req.method === 'OPTIONS') return res.status(204).end();

  const key = process.env.UNSPLASH_ACCESS_KEY;
  res.setHeader('Cache-Control', 'no-store');
  if (!key) return res.status(500).json({ error: 'UNSPLASH_ACCESS_KEY is not set' });

  const count = Math.max(1, Math.min(30, Number.parseInt(req.query.count, 10) || 10));
  const [q1, q2] = [...QUERIES].sort(() => Math.random() - 0.5);
  const half = Math.ceil(count / 2);
  const batches = await Promise.all([fetchBatch(q1, half, key), count > half ? fetchBatch(q2, count - half, key) : []]);
  // Interleave the two queries so neighbouring photos differ.
  const photos = [];
  for (let i = 0; i < half; i++) for (const b of batches) if (b[i]) photos.push(b[i]);

  if (photos.length === 0) return res.status(502).json({ error: 'No photos returned (rate limit or network)' });
  res.status(200).json(photos);
}
