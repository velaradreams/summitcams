// Cam registry — the single source of truth for every camera on the site.
// The proxy allowlist, health checks, snow lookups, and the page all derive from this.
// Rules: never rename an `id` once shipped (it's the localStorage prefs key);
// stake cams over scenic cams; `seasonal: true` means expected to go dark in summer.
// `aspect` (default "16/9") sizes the card box to the frame so there are no bars.
// `pass`: "ikon" | "epic" | "independent" (2026-27 season; Telluride is an Epic
// partner with 7 days) — drives the pass filter on the home page.
// `opens`: announced 2026-27 opening day (only where resorts confirmed one;
// shown in the off-season list until it passes). Update each fall.

export const CAMS = [
  {
    id: "copper",
    opens: "2026-11-06",
    pass: "ikon",
    website: "https://www.coppercolorado.com/",
    verification: "validated",
    resort: "Copper Mountain",
    cam: "Snow Stake",
    region: "Summit County",
    elevation: "11,050'",
    lat: 39.501,
    lon: -106.151,
    seasonal: true,
    stakeClear: "4 AM",
    aspect: "4/3",
    type: "image",
    src: "https://img.hdrelay.com/frames/fb469125-f1f3-459f-aeb4-98cb674e395f/default/last.jpg",
  },
  {
    id: "abay",
    pass: "ikon",
    website: "https://www.arapahoebasin.com/",
    verification: "validated",
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
    opens: "2026-11-06",
    pass: "epic",
    website: "https://www.breckenridge.com/",
    verification: "validated",
    resort: "Breckenridge",
    cam: "Snow Stake",
    region: "Summit County",
    elevation: "11,800'",
    lat: 39.481,
    lon: -106.067,
    seasonal: true,
    stakeClear: "5 AM",
    type: "timecam",
    baseUrl:
      "https://terra.timecam.tv/express/mediablock/timestreams/vailresort/breckenridge-snowstake-ca~640/hour",
    camId: "breckenridge-snowstake-ca~640",
  },
  {
    id: "keystone",
    pass: "epic",
    website: "https://www.keystoneresort.com/",
    verification: "validated",
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
    opens: "2026-11-13",
    pass: "epic",
    website: "https://www.vail.com/",
    verification: "validated",
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
    pass: "epic",
    website: "https://www.vail.com/",
    verification: "validated",
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
    opens: "2026-11-25",
    pass: "epic",
    website: "https://www.beavercreek.com/",
    verification: "validated",
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
    id: "loveland-stake",
    pass: "independent",
    website: "https://skiloveland.com/",
    verification: "validated",
    resort: "Loveland",
    cam: "Snow Stake",
    region: "Front Range",
    elevation: "10,800'",
    lat: 39.68,
    lon: -105.9,
    seasonal: true,
    aspect: "4/3",
    type: "image",
    src: "https://cams.skiloveland.com/snowcam/snowcam.jpg",
  },
  {
    id: "eldora-stake",
    opens: "2026-11-13",
    pass: "ikon",
    website: "https://www.eldora.com/",
    verification: "untested",
    resort: "Eldora",
    cam: "Snow Stake",
    region: "Front Range",
    elevation: "9,200'",
    lat: 39.937,
    lon: -105.583,
    seasonal: true,
    type: "image",
    // GUID from eldora.com page-data (POWDR/HDRelay, same as Copper). Not yet
    // serving frames (stake section hidden off-season) — re-pull it from the
    // page when Eldora opens if this still 404s.
    src: "https://img.hdrelay.com/frames/811b9e59-6da4-4e8e-ac5b-d9aec82b0186/default/last.jpg",
  },
  {
    id: "winterpark",
    pass: "ikon",
    website: "https://www.winterparkresort.com/",
    verification: "validated",
    resort: "Winter Park",
    cam: "Snow Stake",
    region: "Winter Park",
    elevation: "10,700'",
    lat: 39.887,
    lon: -105.762,
    seasonal: true,
    type: "youtube",
    videoId: "yj-5Q1vBMaA",
  },
  {
    id: "steamboat-mid",
    opens: "2026-11-21",
    pass: "ikon",
    website: "https://www.steamboat.com/",
    verification: "validated",
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
    opens: "2026-11-21",
    pass: "ikon",
    website: "https://www.steamboat.com/",
    verification: "validated",
    resort: "Steamboat Summit",
    cam: "Champagne Powder",
    region: "Steamboat",
    elevation: "10,384'",
    lat: 40.455,
    lon: -106.744,
    seasonal: true,
    type: "youtube",
    videoId: "Vz_BJ5NJOM0",
  },
  {
    id: "aspen-mtn-stake",
    opens: "2026-11-26",
    pass: "ikon",
    website: "https://www.aspensnowmass.com/",
    verification: "untested",
    resort: "Aspen Mountain",
    cam: "Snow Stake",
    region: "Aspen",
    elevation: "7,945'",
    lat: 39.186,
    lon: -106.818,
    seasonal: true,
    type: "image",
    src: "https://g1.ipcamlive.com/player/snapshot.php?alias=5c8193f8ba576",
  },
  {
    id: "aspen-highlands-stake",
    opens: "2026-12-12",
    pass: "ikon",
    website: "https://www.aspensnowmass.com/",
    verification: "untested",
    resort: "Aspen Highlands",
    cam: "Snow Stake",
    region: "Aspen",
    elevation: "8,040'",
    lat: 39.182,
    lon: -106.856,
    seasonal: true,
    type: "image",
    src: "https://g3.ipcamlive.com/player/snapshot.php?alias=5fb419457d74f",
  },
  {
    id: "snowmass-stake",
    opens: "2026-11-26",
    pass: "ikon",
    website: "https://www.aspensnowmass.com/",
    verification: "untested",
    resort: "Snowmass",
    cam: "Snow Stake",
    region: "Aspen",
    elevation: "8,104'",
    lat: 39.209,
    lon: -106.955,
    seasonal: true,
    type: "image",
    src: "https://g1.ipcamlive.com/player/snapshot.php?alias=5c6d8ba5a8388",
  },
  {
    id: "buttermilk-stake",
    opens: "2026-12-12",
    pass: "ikon",
    website: "https://www.aspensnowmass.com/",
    verification: "untested",
    resort: "Buttermilk",
    cam: "Snow Stake",
    region: "Aspen",
    elevation: "7,870'",
    lat: 39.205,
    lon: -106.859,
    seasonal: true,
    type: "image",
    src: "https://g1.ipcamlive.com/player/snapshot.php?alias=613a4e47724d8",
  },
  // cb-pow: pulled 2026-10-18 — the brownrice snapshot was frozen on a daylight
  // frame at night. Re-check when Crested Butte opens; the id stays reserved.
  // {
  //   id: "cb-pow",
  //   pass: "epic",
  //   website: "https://www.skicb.com/",
  //   verification: "untested",
  //   resort: "Crested Butte",
  //   cam: "PowCam Snow Stake",
  //   region: "Crested Butte",
  //   elevation: "9,375'",
  //   lat: 38.899,
  //   lon: -106.965,
  //   seasonal: true,
  //   type: "image",
  //   src: "https://player.brownrice.com/snapshot/crestedbuttepow",
  // },
  {
    id: "telluride-powcam",
    pass: "epic",
    website: "https://tellurideskiresort.com/",
    verification: "untested",
    resort: "Telluride",
    cam: "PowCam Snow Stake",
    region: "Telluride",
    elevation: "9,545'",
    lat: 37.937,
    lon: -107.846,
    seasonal: true,
    type: "image",
    // Summer-dark; alias is the stable key (snapshot.php 302s to the live stream).
    // The resort's webcam page no longer lists a PowCam — if this alias is still
    // dark after Telluride opens, delete the entry (keep the id reserved).
    src: "https://g1.ipcamlive.com/player/snapshot.php?alias=powcam",
  },
  {
    id: "monarch-powder",
    pass: "independent",
    website: "https://skimonarch.com/",
    verification: "untested",
    resort: "Monarch",
    cam: "Powder Cam (stake)",
    region: "Southern Colorado",
    elevation: "10,790'",
    lat: 38.512,
    lon: -106.332,
    seasonal: true,
    type: "image",
    // webcam.io: latest.jpg keeps returning 200 with the last frame when the cam
    // stops — the health check's Last-Modified staleness test catches that.
    src: "https://assets2.webcam.io/w/z7Arw9/latest.jpg",
  },
  {
    id: "cooper-stake",
    pass: "independent",
    verification: "untested",
    website: "https://www.skicooper.com/",
    resort: "Ski Cooper",
    cam: "Snow Stake",
    region: "Leadville",
    elevation: "11,700'",
    lat: 39.3606,
    lon: -106.3033,
    seasonal: true,
    type: "iframe",
    // Self-hosted 1080p HLS player that autoplays (~13 MB/min); no snapshot
    // endpoint exists. tapToPlay: show a placeholder until the visitor taps.
    src: "https://skicooper.com:8443/stake/",
    tapToPlay: true,
  },
  {
    id: "sunlight-stake",
    pass: "independent",
    verification: "untested",
    website: "https://sunlightmtn.com/",
    resort: "Sunlight",
    cam: "Snow Stake",
    region: "Western Slope",
    elevation: "9,000'",
    lat: 39.3995,
    lon: -107.3384,
    seasonal: true,
    type: "image",
    src: "https://g0.ipcamlive.com/player/snapshot.php?alias=sunlightsnowstake",
  },
  {
    id: "powderhorn-stake",
    pass: "independent",
    verification: "untested",
    website: "https://powderhorn.com/",
    resort: "Powderhorn",
    cam: "Snow Stake",
    region: "Western Slope",
    elevation: "8,200'",
    lat: 39.0694,
    lon: -108.1507,
    seasonal: true,
    type: "image",
    // HDRelay new-style endpoint; host b16 comes from the player JSON at
    // manage.hdrelay.com/player/<playerid> — re-fetch that if b16 ever breaks.
    // Its Last-Modified is stamped with the request time: no staleness check.
    freshness: "none",
    src: "https://b16.hdrelay.com/camera/635ff973ec60cc4e98eca6ec/snapshot",
  },
  {
    id: "granby-base",
    pass: "independent",
    verification: "untested",
    website: "https://granbyranch.com/",
    resort: "Granby Ranch",
    cam: "Base Cam (no stake cam)",
    region: "Grand County",
    elevation: "8,202'",
    lat: 40.045,
    lon: -105.906,
    seasonal: false,
    type: "image",
    src: "https://player.brownrice.com/snapshot/granby2",
  },
  {
    id: "purgatory-stake",
    pass: "independent",
    verification: "validated",
    website: "https://www.purgatory.ski/",
    resort: "Purgatory",
    cam: "Snow Stake",
    region: "Southern Colorado",
    elevation: "8,793'",
    lat: 37.63,
    lon: -107.814,
    seasonal: true,
    type: "image",
    src: "https://player.brownrice.com/snapshot/purgatorysnowstake1",
  },
  {
    id: "wolfcreek-base",
    pass: "independent",
    website: "https://wolfcreekski.com/",
    verification: "untested",
    resort: "Wolf Creek",
    cam: "Base Cam (no stake cam)",
    region: "Southern Colorado",
    elevation: "10,300'",
    lat: 37.472,
    lon: -106.793,
    seasonal: false,
    type: "image",
    src: "https://live2.brownrice.com/snapshot/wolfcreektreasure",
  },
];

// The White Room default roster — 9 cams for Denver/Summit County locals,
// in display order. User favorites take precedence; live cams backfill.
export const WHITE_ROOM_DEFAULT = [
  "copper",
  "abay",
  "breck",
  "keystone",
  "loveland-stake",
  "winterpark",
  "vail-summit",
  "vail-bluesky",
  "beaver",
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

// Same-origin proxy URL for a proxied cam (image or timecam types). The proxy
// takes a cam id, not a URL, so it can only ever serve registered cams. `t` is
// the minute bucket: every visitor shares one URL per minute, so the CDN cache
// absorbs traffic. Never make it per-request.
export function proxySrc(cam, bucket = Math.floor(Date.now() / 60000)) {
  return `/api/cam?id=${encodeURIComponent(cam.id)}&t=${bucket}`;
}

// Upstream image URL for any proxied cam (image or timecam), or null.
export function upstreamUrl(cam) {
  if (cam.type === "image") return cam.src;
  if (cam.type === "timecam") return timecamUpstreamUrl(cam);
  return null;
}

// Breckenridge's timecam host has blocked hotlinking before; it gets the
// resort's own site as Referer until Breck can be re-tested in season. If it
// still needs it then, link out instead. Rule: if a host blocks us or asks us to
// stop, remove the cam rather than routing around it.
export const REFERER_MAP = {
  "terra.timecam.tv": "https://www.breckenridge.com/",
};

export function upstreamHeaders(hostname) {
  const headers = {
    "User-Agent": "SummitCams/1.0 (+https://www.summitcams.live)",
    Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
  };
  if (REFERER_MAP[hostname]) headers["Referer"] = REFERER_MAP[hostname];
  return headers;
}

// May–November: a dark seasonal cam is off-season, not broken. Most resorts
// open mid-to-late November, so dark cams stay in the off-season list through
// November instead of showing as "offline" from Nov 1. Server time is UTC.
export function isSummer(date = new Date()) {
  const m = date.getMonth();
  return m >= 4 && m <= 10;
}

// Elevation string ("11,050'") to meters, for the snowfall model.
export function elevationMeters(cam) {
  const ft = parseInt(String(cam.elevation || "").replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(ft) && ft > 0 ? Math.round(ft * 0.3048) : null;
}
