"use client";

import { useState, useEffect } from "react";

const CAMS = [
  {
    id: "copper",
    resort: "Copper Mountain",
    cam: "Static image updates every 5 minutes",
    elevation: "11,050'",
    type: "image",
    proxyUrl:
      "/api/cam?src=https://img.hdrelay.com/frames/fb469125-f1f3-459f-aeb4-98cb674e395f/default/last.jpg",
  },
  {
    id: "abay",
    resort: "Arapahoe Basin",
    cam: "Static image updates every 5 minutes",
    elevation: "10,780'",
    type: "image",
    proxyUrl:
      "/api/cam?src=https://img.hdrelay.com/frames/929449a8-672b-46c4-8191-b1a6d0842a3f/default/last.jpg",
  },
  {
    id: "vail-summit",
    resort: "Vail Summit",
    cam: "Static image updates every 5 minutes",
    elevation: "11,250'",
    type: "image",
    proxyUrl:
      "/api/cam?src=https://live9.brownrice.com/cam-images/vailsnowsummit.jpg",
  },
  {
    id: "vail-bluesky",
    resort: "Vail Blue Sky Basin",
    cam: "Static image updates every 5 minutes",
    elevation: "11,440'",
    type: "image",
    proxyUrl:
      "/api/cam?src=https://live6.brownrice.com/cam-images/vailbluesky.jpg",
  },
  {
    id: "breck",
    resort: "Breckenridge",
    cam: "Static image updates every 10 minutes",
    elevation: "11,800'",
    type: "timecam",
    baseUrl:
      "https://terra.timecam.tv/express/mediablock/timestreams/vailresort/breckenridge-snowstake-ca~640/hour",
    camId: "breckenridge-snowstake-ca~640",
  },
  {
    id: "keystone",
    resort: "Keystone",
    cam: "Static image updates every 5 minutes",
    elevation: "11,640'",
    type: "image",
    proxyUrl:
      "/api/cam?src=https://cache.snow.com/Mtncams/KeySnowStake.jpg",
  },
  {
    id: "winterpark",
    resort: "Winter Park",
    cam: "Snow Stake",
    elevation: "10,700'",
    type: "youtube",
    videoId: "_wOIgFEMypY",
  },
    {
    id: "beaver",
    resort: "Beaver Creek",
    cam: "Snow Stake",
    elevation: "11,440'",
    type: "iframe",
    src: "https://player.brownrice.com/embed/bcsnowstake2",
  },
  {
    id: "steamboat-mid",
    resort: "Steamboat Mid-Mountain",
    cam: "Mid-Mountain Stake",
    elevation: "9,080'",
    type: "youtube",
    videoId: "lKc9xwndUK4",
  },
  {
    id: "steamboat-summit",
    resort: "Steamboat Summit",
    cam: "Champagne Powder",
    elevation: "10,384'",
    type: "youtube",
    videoId: "8w4tZE2k7AE",
  },
];

function getTimecamUrl(cam) {
  const now = new Date();
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
  return `/api/cam?src=${cam.baseUrl}/${hour}/${cam.camId}_${Y}_${M}_${D}_${H}_${m}_00_00.jpg`;
}

function CamFeed({ cam }) {
  const [imgSrc, setImgSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (cam.type === "youtube" || cam.type === "iframe") {
      setLoading(false);
      return;
    }
    const getSrc = () => {
      const base =
        cam.type === "timecam" ? getTimecamUrl(cam) : cam.proxyUrl;
      return base + (base.includes("?") ? "&" : "?") + "t=" + Date.now();
    };
    setImgSrc(getSrc());
    setLoading(true);
    setError(false);

    const interval = setInterval(() => {
      setImgSrc(getSrc());
    }, 60000);
    return () => clearInterval(interval);
  }, [cam]);

  if (cam.type === "youtube") {
    return (
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "16/9",
          background: "#000",
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        <iframe
          src={`https://www.youtube.com/embed/${cam.videoId}?autoplay=0&mute=1&controls=1&modestbranding=1&rel=0`}
          style={{ width: "100%", height: "100%", border: "none" }}
          allow="autoplay; encrypted-media"
          allowFullScreen
          loading="lazy"
          title={`${cam.resort} ${cam.cam}`}
        />
      </div>
    );
  }
if (cam.type === "iframe") {
    return (
      <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", background: "#000", borderRadius: 10, overflow: "hidden" }}>
        <iframe src={cam.src} style={{ width: "100%", height: "100%", border: "none" }} allow="autoplay; encrypted-media" allowFullScreen title={`${cam.resort} ${cam.cam}`} />
      </div>
    );
  }
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "16/9",
        background: "#0a0f1a",
        borderRadius: 10,
        overflow: "hidden",
      }}
    >
      {imgSrc && (
        <img
          src={imgSrc}
          alt={`${cam.resort} ${cam.cam}`}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: loading && !error ? "none" : "block",
            opacity: error ? 0 : 1,
          }}
          onLoad={() => {
            setLoading(false);
            setError(false);
          }}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
        />
      )}
      {loading && !error && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div className="spinner" />
        </div>
      )}
      {error && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            background: "linear-gradient(135deg, #0c1220 0%, #111827 100%)",
          }}
        >
          <span
            style={{
              fontSize: 10,
              color: "#334155",
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: "0.05em",
            }}
          >
            Feed unavailable — retrying in 60s
          </span>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [time, setTime] = useState(null);

  useEffect(() => {
    setTime(new Date());
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const timeStr = time
    ? time.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "America/Denver",
      })
    : "";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#060a13",
        color: "#e2e8f0",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .spinner {
          width: 22px; height: 22px;
          border: 2px solid #1e293b;
          border-top: 2px solid #6ee7b7;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        .cam-entry { animation: fadeUp 0.5s ease both; }
      `}</style>

      {/* Header */}
      <header
        style={{
          padding: "18px 20px 14px",
          maxWidth: 900,
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#6ee7b7",
              animation: "pulse 2.5s ease-in-out infinite",
              boxShadow: "0 0 6px rgba(110,231,183,0.4)",
            }}
          />
          <span
            style={{
              fontSize: 16,
              fontWeight: 800,
              letterSpacing: "0.02em",
              color: "#fff",
            }}
          >
            SUMMIT<span style={{ color: "#6ee7b7" }}>CAMS</span>
          </span>
          <span
            style={{
              fontSize: 9,
              color: "#1e293b",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            .live
          </span>
        </div>
        {timeStr && (
          <span
            style={{
              fontSize: 11,
              color: "#475569",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {timeStr}{" "}
            <span style={{ color: "#1e293b", fontSize: 9 }}>MST</span>
          </span>
        )}
      </header>

      {/* Cam list */}
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "0 20px 60px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {CAMS.map((cam, i) => (
            <div
              key={cam.id}
              className="cam-entry"
              style={{ animationDelay: `${i * 0.04}s` }}
            >
              {/* Label bar */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: 6,
                  padding: "0 2px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#e2e8f0",
                    }}
                  >
                    {cam.resort}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: "#475569",
                      fontWeight: 500,
                    }}
                  >
                    {cam.cam}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {cam.type === "youtube" && (
                    <span
                      style={{
                        fontSize: 8,
                        fontWeight: 700,
                        color: "#dc2626",
                        letterSpacing: "0.1em",
                        fontFamily: "'JetBrains Mono', monospace",
                        display: "flex",
                        alignItems: "center",
                        gap: 3,
                      }}
                    >
                      <span
                        style={{
                          width: 4,
                          height: 4,
                          borderRadius: "50%",
                          background: "#dc2626",
                          animation: "pulse 1.5s ease infinite",
                        }}
                      />
                      LIVE
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: 10,
                      color: "#6ee7b7",
                      fontWeight: 600,
                      fontFamily: "'JetBrains Mono', monospace",
                      opacity: 0.8,
                    }}
                  >
                    {cam.elevation}
                  </span>
                </div>
              </div>

              {/* Feed */}
              <CamFeed cam={cam} />
            </div>
          ))}
        </div>

        {/* Footer */}
        <footer
          style={{
            marginTop: 48,
            paddingTop: 20,
            borderTop: "1px solid rgba(255,255,255,0.03)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 9,
              color: "#1e293b",
              fontFamily: "'JetBrains Mono', monospace",
              lineHeight: 2,
            }}
          >
            summitcams.live — Colorado snow stake webcam aggregator
            <br />
            Not affiliated with any resort · Camera feeds from public resort
            webcam pages
          </div>
        </footer>
      </main>
    </div>
  );
}
