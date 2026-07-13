"use client";

import { useState, useEffect } from "react";
import { CAMS, WHITE_ROOM_DEFAULT, proxySrc } from "../cams";

const mono = "var(--font-mono), monospace";
const PREFS_KEY = "sc:prefs:v1";

function loadFavs() {
  try {
    const p = JSON.parse(localStorage.getItem(PREFS_KEY) || "{}");
    return Array.isArray(p.favs) ? p.favs : [];
  } catch {
    return [];
  }
}

// Roster: favorites first, then the local-default nine, then any other live
// cam — live cams only, capped at 9.
function buildRoster(favs, statuses) {
  const byId = Object.fromEntries(CAMS.map((c) => [c.id, c]));
  const isLive = (id) => (statuses[id]?.state || "ok") === "ok";
  const seen = new Set();
  const roster = [];
  const push = (id) => {
    if (roster.length >= 9 || seen.has(id) || !byId[id] || !isLive(id)) return;
    seen.add(id);
    roster.push(byId[id]);
  };
  favs.forEach(push);
  WHITE_ROOM_DEFAULT.forEach(push);
  CAMS.forEach((c) => push(c.id));
  return roster;
}

function Tile({ cam, snowIn }) {
  const [src, setSrc] = useState(null);

  useEffect(() => {
    if (cam.type === "youtube" || cam.type === "iframe") return;
    const getSrc = () =>
      proxySrc(cam) + "&t=" + Math.floor(Date.now() / 60000);
    setSrc(getSrc());
    const t = setInterval(() => setSrc(getSrc()), 60000);
    return () => clearInterval(t);
  }, [cam]);

  return (
    <div
      style={{
        position: "relative",
        aspectRatio: "16/9",
        background: "#0a0f1a",
        borderRadius: 8,
        overflow: "hidden",
        border: "1px solid #131c2e",
      }}
    >
      {cam.type === "youtube" ? (
        <iframe
          src={`https://www.youtube.com/embed/${cam.videoId}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0`}
          style={{ width: "100%", height: "100%", border: "none" }}
          allow="autoplay; encrypted-media"
          loading="lazy"
          title={cam.resort}
        />
      ) : cam.type === "iframe" ? (
        <iframe
          src={cam.src}
          style={{ width: "100%", height: "100%", border: "none" }}
          allow="autoplay; encrypted-media"
          loading="lazy"
          title={cam.resort}
        />
      ) : (
        src && (
          <img
            src={src}
            alt={`${cam.resort} ${cam.cam}`}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        )
      )}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          padding: "14px 10px 6px",
          background: "linear-gradient(transparent, rgba(6,10,19,0.85))",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          pointerEvents: "none",
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>
          {cam.resort}
        </span>
        {snowIn > 0 && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#7dd3fc",
              fontFamily: mono,
            }}
          >
            ❄ {snowIn}&quot;
          </span>
        )}
      </div>
    </div>
  );
}

export default function WhiteRoom() {
  const [roster, setRoster] = useState([]);
  const [snow, setSnow] = useState({});

  useEffect(() => {
    const favs = loadFavs();
    // Render immediately assuming everything is live; refine once status lands.
    setRoster(buildRoster(favs, {}));
    fetch("/api/status")
      .then((r) => r.json())
      .then((d) => setRoster(buildRoster(favs, d.statuses || {})))
      .catch(() => {});
    fetch("/api/snow")
      .then((r) => r.json())
      .then((d) => setSnow(d.snow || {}))
      .catch(() => {});
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#060a13", color: "#e2e8f0" }}>
      {/* Header */}
      <header
        style={{
          padding: "14px 16px 10px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <a
          href="/"
          style={{
            fontSize: 11,
            color: "#475569",
            fontFamily: mono,
            textDecoration: "none",
          }}
        >
          ← summitcams
        </a>
        <span
          style={{
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: "0.22em",
            color: "#fff",
          }}
        >
          THE WHITE<span style={{ color: "#6ee7b7" }}> ROOM</span>
        </span>
        <span style={{ fontSize: 9, color: "#334155", fontFamily: mono }}>
          {roster.length} LIVE
        </span>
      </header>

      {/* The wall — always 3 wide (the box geometry), stepping down on small screens */}
      <style>{`
        .wall { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        @media (max-width: 900px) { .wall { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 560px) { .wall { grid-template-columns: 1fr; } }
      `}</style>
      <main style={{ padding: "0 16px 40px", maxWidth: 1400, margin: "0 auto" }}>
        <div className="wall">
          {roster.map((cam) => (
            <Tile key={cam.id} cam={cam} snowIn={snow[cam.id]} />
          ))}
        </div>
        {roster.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "80px 0",
              fontSize: 11,
              color: "#334155",
              fontFamily: mono,
            }}
          >
            loading the wall…
          </div>
        )}
      </main>
    </div>
  );
}
