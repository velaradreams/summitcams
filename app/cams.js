// Cam registry — the single source of truth for every camera on the site.
// The proxy allowlist, health checks, snow lookups, and the page all derive from this.
// Rules: never rename an `id` once shipped (it's the localStorage prefs key);
// stake cams over scenic cams; `seasonal: true` means expected to go dark in summer.

export const CAMS = [
  {
    id: "copper",
    resort: "Copper Mountain",
    cam: "Snow Stake",
    region: "Summit County",
    elevation: "11,050'",
    lat: 39.501,
    lon: -106.151,
    seasonal: true,
    type: "image",
    src: "https://img.hdrelay.com/frames/fb469125-f1f3-459f-aeb4-98cb674e395f/default/last.jpg",
  },
  {
    id: "abay",
    resort: "Arapahoe Basin",
    cam: "Snow Stake",
    region: "Summit County",
    elevation: "10,780'",
    lat: 39.642,
    lon: -105.872,
    seasonal: true,
    type: "image",
    src: "https://img.hdrelay.com/frames/929449a8-672b-46c4-8191-b1a6d0842a3f/default/last.jpg",
  },
  {
    id: "breck",
    resort: "Breckenridge",
    cam: "Snow Stake",
    region: "Summit County",
    elevation: "11,800'",
    lat: 39.481,
    lon: -106.067,
    seasonal: true,
    type: "timecam",
    baseUrl:
      "https://terra.timecam.tv/express/mediablock/timestreams/vailresort/breckenridge-snowstake-ca~640/hour",
    camId: "breckenridge-snowstake-ca~640",
  },
  {
    id: "keystone",
    resort: "Keystone",
    cam: "Snow Stake",
    region: "Summit County",
    elevation: "11,640'",
    lat: 39.58,
    lon: -105.94,
    seasonal: true,
    type: "image",
    src: "https://cache.snow.com/Mtncams/KeySnowStake.jpg",
  },
  {
    id: "vail-summit",
    resort: "Vail Summit",
    cam: "Snow Stake",
    region: "Vail Valley",
    elevation: "11,250'",
    lat: 39.606,
    lon: -106.355,
    seasonal: true,
    type: "image",
    src: "https://live9.brownrice.com/cam-images/vailsnowsummit.jpg",
  },
  {
    id: "vail-bluesky",
    resort: "Vail Blue Sky Basin",
    cam: "Snow Stake",
    region: "Vail Valley",
    elevation: "11,440'",
    lat: 39.585,
    lon: -106.334,
    seasonal: true,
    type: "image",
    src: "https://live6.brownrice.com/cam-images/vailbluesky.jpg",
  },
  {
    id: "beaver",
    resort: "Beaver Creek",
    cam: "Snow Stake",
    region: "Vail Valley",
    elevation: "11,440'",
    lat: 39.604,
    lon: -106.517,
    seasonal: true,
    type: "iframe",
    src: "https://player.brownrice.com/embed/bcsnowstake2",
  },
  {
    id: "winterpark",
    resort: "Winter Park",
    cam: "Snow Stake",
    region: "Winter Park",
    elevation: "10,700'",
    lat: 39.887,
    lon: -105.762,
    seasonal: true,
    type: "youtube",
    videoId: "_wOIgFEMypY",
  },
  {
    id: "steamboat-mid",
    resort: "Steamboat Mid-Mountain",
    cam: "Mid-Mountain Stake",
    region: "Steamboat",
    elevation: "9,080'",
    lat: 40.457,
    lon: -106.805,
    seasonal: true,
    type: "youtube",
    videoId: "lKc9xwndUK4",
  },
  {
    id: "steamboat-summit",
    resort: "Steamboat Summit",
    cam: "Champagne Powder",
    region: "Steamboat",
    elevation: "10,384'",
    lat: 40.455,
    lon: -106.744,
    seasonal: false,
    type: "youtube",
    videoId: "8w4tZE2k7AE",
  },
];

// Upstream URL for a timecam-type cam (frames are named by 10-minute UTC buckets).
export function timecamUpstreamUrl(cam, now = new Date()) {
  const mins = now.getUTCMinutes();
  const rounded = Math.floor(mins / 10) * 10 - 10;
  const adj = new Date(now);
  adj.setUTCMinutes(rounded < 0 ? rounded + 60 : rounded);
  if (rounded < 0) adj.setUTCHours(adj.getUTCHours() - 1);
  adj.setUTCSeconds(0);
  adj.setUTCMilliseconds(0);
  const p = (n) => String(n).padStart(2, "0");
  const Y = adj.getUTCFullYear(),
    M = p(adj.getUTCMonth() + 1),
    D = p(adj.getUTCDate());
  const H = p(adj.getUTCHours()),
    m = p(adj.getUTCMinutes());
  const hour = `${Y}_${M}_${D}_${H}`;
  return `${cam.baseUrl}/${hour}/${cam.camId}_${Y}_${M}_${D}_${H}_${m}_00_00.jpg`;
}

// Upstream image URL for any proxied cam (image or timecam), or null.
export function upstreamUrl(cam) {
  if (cam.type === "image") return cam.src;
  if (cam.type === "timecam") return timecamUpstreamUrl(cam);
  return null;
}

// Proxy allowlist, derived — a new registry entry is automatically allowed.
export function proxiedHostnames() {
  const hosts = new Set();
  for (const cam of CAMS) {
    const url = upstreamUrl(cam);
    if (url) hosts.add(new URL(url).hostname);
  }
  return [...hosts];
}

// Some cam hosts hotlink-protect; these Referers make us look like the resort's own page.
export const REFERER_MAP = {
  "img.hdrelay.com": "https://www.hdrelay.com/",
  "terra.timecam.tv": "https://www.breckenridge.com/",
  "cache.snow.com": "https://www.keystoneresort.com/",
};

export function upstreamHeaders(hostname) {
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
  };
  if (REFERER_MAP[hostname]) headers["Referer"] = REFERER_MAP[hostname];
  return headers;
}

// May–October: a dark seasonal cam is off-season, not broken.
export function isSummer(date = new Date()) {
  const m = date.getMonth();
  return m >= 4 && m <= 9;
}
