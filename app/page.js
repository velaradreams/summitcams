"use client";

import { useState, useEffect, useMemo } from "react";
import { CAMS, timecamUpstreamUrl } from "./cams";

const PREFS_KEY = "sc:prefs:v1";

function loadPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { favs: [], hidden: [] };
    const p = JSON.parse(raw);
    return {
      favs: Array.isArray(p.favs) ? p.favs : [],
      hidden: Array.isArray(p.hidden) ? p.hidden : [],
    };
  } catch {
    return { favs: [], hidden: [] };
  }
}

function proxySrc(cam) {
  const src = cam.type === "timecam" ? timecamUpstreamUrl(cam) : cam.src;
  return `/api/cam?src=${src}`;
}

const mono = "var(--font-mono), monospace";

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
      const base = proxySrc(cam);
      // Bucket the cache-buster to the minute so all visitors share one URL
      // per minute and the CDN cache (s-maxage=30) actually absorbs traffic.
      const bucket = Math.floor(Date.now() / 60000);
      return base + (base.includes("?") ? "&" : "?") + "t=" + bucket;
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
          src={cam.src}
          style={{ width: "100%", height: "100%", border: "none" }}
          allow="autoplay; encrypted-media"
          allowFullScreen
          loading="lazy"
          title={`${cam.resort} ${cam.cam}`}
        />
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
          loading="lazy"
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
              fontFamily: mono,
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

function CtrlButton({ onClick, title, active, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: "none",
        border: "none",
        padding: "0 3px",
        cursor: "pointer",
        fontSize: 12,
        lineHeight: 1,
        color: active ? "#6ee7b7" : "#334155",
        fontFamily: mono,
      }}
    >
      {children}
    </button>
  );
}

function CamCard({ cam, state, snowIn, prefs, actions, isFav }) {
  const favIndex = prefs.favs.indexOf(cam.id);
  return (
    <div className="cam-entry" id={`cam-${cam.id}`}>
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
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>
            {cam.resort}
          </span>
          <span style={{ fontSize: 11, color: "#475569", fontWeight: 500 }}>
            {cam.cam}
          </span>
          {snowIn > 0 && (
            <span
              style={{
                fontSize: 10,
                color: "#7dd3fc",
                fontWeight: 700,
                fontFamily: mono,
              }}
              title="Snowfall last 24h (model estimate — trust the stake)"
            >
              ❄ {snowIn}&quot; 24h
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {cam.type === "youtube" && state === "ok" && (
            <span
              style={{
                fontSize: 8,
                fontWeight: 700,
                color: "#dc2626",
                letterSpacing: "0.1em",
                fontFamily: mono,
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
              fontFamily: mono,
              opacity: 0.8,
            }}
          >
            {cam.elevation}
          </span>
          {isFav && (
            <>
              <CtrlButton
                title="Move up"
                onClick={() => actions.moveFav(cam.id, -1)}
              >
                ↑
              </CtrlButton>
              <CtrlButton
                title="Move down"
                onClick={() => actions.moveFav(cam.id, 1)}
              >
                ↓
              </CtrlButton>
            </>
          )}
          <CtrlButton
            title={favIndex >= 0 ? "Unpin from favorites" : "Pin to top"}
            active={favIndex >= 0}
            onClick={() => actions.toggleFav(cam.id)}
          >
            {favIndex >= 0 ? "★" : "☆"}
          </CtrlButton>
          <CtrlButton title="Hide this cam" onClick={() => actions.toggleHide(cam.id)}>
            ✕
          </CtrlButton>
        </div>
      </div>

      {/* Feed, or compact down-state */}
      {state === "down" ? (
        <div
          style={{
            borderRadius: 10,
            border: "1px solid #1e293b",
            background: "linear-gradient(135deg, #0c1220 0%, #111827 100%)",
            padding: "14px 16px",
            fontSize: 10,
            color: "#475569",
            fontFamily: mono,
            letterSpacing: "0.05em",
          }}
        >
          ⚠ feed offline — flagged, back soon
        </div>
      ) : (
        <CamFeed cam={cam} />
      )}
    </div>
  );
}

export default function Home() {
  const [time, setTime] = useState(null);
  const [statuses, setStatuses] = useState({});
  const [snow, setSnow] = useState({});
  const [prefs, setPrefs] = useState({ favs: [], hidden: [] });
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [showHidden, setShowHidden] = useState(false);

  useEffect(() => {
    setTime(new Date());
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    setPrefs(loadPrefs());
    setPrefsLoaded(true);
    fetch("/api/status")
      .then((r) => r.json())
      .then((d) => setStatuses(d.statuses || {}))
      .catch(() => {});
    fetch("/api/snow")
      .then((r) => r.json())
      .then((d) => setSnow(d.snow || {}))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!prefsLoaded) return;
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {}
  }, [prefs, prefsLoaded]);

  const actions = useMemo(
    () => ({
      toggleFav: (id) =>
        setPrefs((p) => ({
          ...p,
          favs: p.favs.includes(id)
            ? p.favs.filter((f) => f !== id)
            : [...p.favs, id],
        })),
      moveFav: (id, dir) =>
        setPrefs((p) => {
          const favs = [...p.favs];
          const i = favs.indexOf(id);
          const j = i + dir;
          if (i < 0 || j < 0 || j >= favs.length) return p;
          [favs[i], favs[j]] = [favs[j], favs[i]];
          return { ...p, favs };
        }),
      toggleHide: (id) =>
        setPrefs((p) => ({
          ...p,
          hidden: p.hidden.includes(id)
            ? p.hidden.filter((h) => h !== id)
            : [...p.hidden, id],
          favs: p.favs.filter((f) => f !== id),
        })),
    }),
    []
  );

  const stateOf = (id) => statuses[id]?.state || "ok";
  const byId = useMemo(() => Object.fromEntries(CAMS.map((c) => [c.id, c])), []);

  const favCams = prefs.favs.map((id) => byId[id]).filter(Boolean);
  const hiddenCams = CAMS.filter((c) => prefs.hidden.includes(c.id));
  const mainCams = CAMS.filter(
    (c) => !prefs.hidden.includes(c.id) && !prefs.favs.includes(c.id)
  );
  const activeCams = mainCams.filter((c) => stateOf(c.id) !== "offseason");
  const offseasonCams = mainCams.filter((c) => stateOf(c.id) === "offseason");

  const regions = [];
  for (const cam of activeCams) {
    let g = regions.find((r) => r.name === cam.region);
    if (!g) {
      g = { name: cam.region, cams: [] };
      regions.push(g);
    }
    g.cams.push(cam);
  }

  const timeStr = time
    ? time.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "America/Denver",
        timeZoneName: "short",
      })
    : "";

  const sectionHeader = (label) => (
    <div
      style={{
        fontSize: 9,
        fontWeight: 700,
        color: "#475569",
        letterSpacing: "0.18em",
        fontFamily: mono,
        margin: "8px 2px 0",
      }}
    >
      {label}
    </div>
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#060a13",
        color: "#e2e8f0",
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
        .chip {
          font-family: var(--font-mono), monospace;
          font-size: 9px; letter-spacing: 0.08em;
          color: #64748b; background: #0c1220;
          border: 1px solid #1e293b; border-radius: 999px;
          padding: 4px 10px; cursor: pointer; white-space: nowrap;
        }
        .chip:hover { color: #6ee7b7; border-color: #334155; }
        html { scroll-behavior: smooth; }
      `}</style>

      {/* Header */}
      <header
        style={{
          padding: "18px 20px 10px",
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
          <span style={{ fontSize: 9, color: "#1e293b", fontFamily: mono }}>
            .live
          </span>
        </div>
        {timeStr && (
          <span style={{ fontSize: 11, color: "#475569", fontFamily: mono }}>
            {timeStr}
          </span>
        )}
      </header>

      {/* Region quick-nav */}
      {regions.length > 1 && (
        <nav
          style={{
            maxWidth: 900,
            margin: "0 auto",
            padding: "0 20px 4px",
            display: "flex",
            gap: 6,
            overflowX: "auto",
          }}
        >
          {regions.map((r) => (
            <button
              key={r.name}
              className="chip"
              onClick={() =>
                document
                  .getElementById(`region-${r.name.replace(/\s+/g, "-")}`)
                  ?.scrollIntoView({ block: "start" })
              }
            >
              {r.name.toUpperCase()}
            </button>
          ))}
        </nav>
      )}

      {/* Cam list */}
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "0 20px 60px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Favorites */}
          {favCams.length > 0 && (
            <>
              {sectionHeader("★ FAVORITES")}
              {favCams.map((cam) => (
                <CamCard
                  key={cam.id}
                  cam={cam}
                  state={stateOf(cam.id)}
                  snowIn={snow[cam.id]}
                  prefs={prefs}
                  actions={actions}
                  isFav
                />
              ))}
            </>
          )}

          {/* Regions */}
          {regions.map((r) => (
            <div
              key={r.name}
              id={`region-${r.name.replace(/\s+/g, "-")}`}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 20,
                scrollMarginTop: 16,
              }}
            >
              {regions.length > 1 && sectionHeader(r.name.toUpperCase())}
              {r.cams.map((cam) => (
                <CamCard
                  key={cam.id}
                  cam={cam}
                  state={stateOf(cam.id)}
                  snowIn={snow[cam.id]}
                  prefs={prefs}
                  actions={actions}
                  isFav={false}
                />
              ))}
            </div>
          ))}

          {/* Off-season */}
          {offseasonCams.length > 0 && (
            <div style={{ marginTop: 12 }}>
              {sectionHeader("❄ OFF-SEASON — BACK WHEN THE LIFTS SPIN")}
              <div
                style={{
                  marginTop: 10,
                  border: "1px solid #131c2e",
                  borderRadius: 10,
                  overflow: "hidden",
                }}
              >
                {offseasonCams.map((cam, i) => (
                  <div
                    key={cam.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 14px",
                      borderTop: i > 0 ? "1px solid #0c1220" : "none",
                    }}
                  >
                    <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                      <span
                        style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}
                      >
                        {cam.resort}
                      </span>
                      <span style={{ fontSize: 10, color: "#334155" }}>
                        {cam.cam}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: 9,
                        color: "#334155",
                        fontFamily: mono,
                      }}
                    >
                      {cam.elevation}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hidden */}
          {hiddenCams.length > 0 && (
            <div style={{ textAlign: "center" }}>
              <button
                className="chip"
                onClick={() => setShowHidden((s) => !s)}
              >
                {showHidden
                  ? "COLLAPSE HIDDEN"
                  : `${hiddenCams.length} HIDDEN CAM${hiddenCams.length > 1 ? "S" : ""} — SHOW`}
              </button>
              {showHidden && (
                <div style={{ marginTop: 10 }}>
                  {hiddenCams.map((cam) => (
                    <div
                      key={cam.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 14px",
                        fontSize: 11,
                        color: "#475569",
                      }}
                    >
                      <span>
                        {cam.resort} — {cam.cam}
                      </span>
                      <CtrlButton
                        title="Unhide"
                        onClick={() => actions.toggleHide(cam.id)}
                      >
                        unhide
                      </CtrlButton>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
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
              fontFamily: mono,
              lineHeight: 2,
            }}
          >
            summitcams.live — Colorado snow stake webcam aggregator
            <br />
            Not affiliated with any resort · Camera feeds from public resort
            webcam pages · Snowfall estimates from Open-Meteo
          </div>
        </footer>
      </main>
    </div>
  );
}
