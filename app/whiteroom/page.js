"use client";

import { useState, useEffect, useMemo } from "react";
import { CAMS, WHITE_ROOM_DEFAULT, proxySrc } from "../cams";
import { loadPrefs, useLiveData, useVisibleInterval } from "../lib/client";

const mono = "var(--font-mono), monospace";
const DIM_TEXT = "#7b8798";

// Roster: favorites first, then the local-default nine, then any other live
// cam — live, un-hidden cams only, capped at 9.
function buildRoster({ favs, hidden }, statuses) {
  const byId = Object.fromEntries(CAMS.map((c) => [c.id, c]));
  const isLive = (id) => (statuses[id]?.state || "ok") === "ok";
  const seen = new Set();
  const roster = [];
  const push = (id) => {
    if (roster.length >= 9 || seen.has(id) || !byId[id] || hidden.includes(id) || !isLive(id)) return;
    seen.add(id);
    roster.push(byId[id]);
  };
  favs.forEach(push);
  WHITE_ROOM_DEFAULT.forEach(push);
  CAMS.forEach((c) => push(c.id));
  return roster;
}

function Tile({ cam, snowIn }) {
  const [bucket, setBucket] = useState(null);
  const [failed, setFailed] = useState(false);
  const isImage = cam.type === "image" || cam.type === "timecam";

  useEffect(() => {
    if (isImage) setBucket(Math.floor(Date.now() / 60000));
  }, [cam, isImage]);
  // New frame every minute while the tab is visible; a failed tile recovers here.
  useVisibleInterval(() => {
    if (isImage) setBucket(Math.floor(Date.now() / 60000));
  }, 60000);

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
          src={`https://www.youtube-nocookie.com/embed/${cam.videoId}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0`}
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
        bucket !== null && (
          <img
            src={proxySrc(cam, bucket)}
            alt={`${cam.resort} ${cam.cam}`}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              opacity: failed ? 0 : 1,
            }}
            onLoad={() => setFailed(false)}
            onError={() => setFailed(true)}
          />
        )
      )}
      {failed && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            color: "#94a3b8",
            fontFamily: mono,
          }}
        >
          feed unavailable — retrying
        </div>
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
        <a
          href={cam.website}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "#fff",
            textDecoration: "none",
            pointerEvents: "auto",
          }}
        >
          {cam.resort}
        </a>
        {snowIn > 0 && (
          <span
            style={{ fontSize: 11, fontWeight: 700, color: "#7dd3fc", fontFamily: mono }}
            title="Snowfall in the last 24h — model estimate"
          >
            ❄ ~{snowIn}&quot; est.
          </span>
        )}
      </div>
    </div>
  );
}

export default function WhiteRoom() {
  const { statuses, statusReady, snow } = useLiveData();
  const [prefs, setPrefs] = useState(null);

  useEffect(() => {
    setPrefs(loadPrefs());
  }, []);

  // Rebuilt whenever statuses refresh (every 10 min), so recovered cams return.
  const roster = useMemo(
    () => (prefs && statusReady ? buildRoster(prefs, statuses) : []),
    [prefs, statuses, statusReady]
  );
  const ready = prefs && statusReady;

  return (
    <div style={{ minHeight: "100vh", background: "#060a13", color: "#e2e8f0" }}>
      {/* Header */}
      <header
        style={{
          padding: "14px var(--wr-gutter) 10px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <a href="/" style={{ fontSize: 12, color: DIM_TEXT, fontFamily: mono, textDecoration: "none" }}>
          ← summitcams
        </a>
        <h1 style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.22em", color: "#fff", margin: 0 }}>
          THE WHITE<span style={{ color: "#6ee7b7" }}> ROOM</span>
        </h1>
        <span style={{ fontSize: 10, color: DIM_TEXT, fontFamily: mono }}>
          {ready ? `${roster.length} LIVE` : ""}
        </span>
      </header>

      {/* The wall — always 3 wide (the box geometry), stepping down on small screens */}
      <style>{`
        :root { --wr-gutter: 16px; }
        @media (max-width: 480px) { :root { --wr-gutter: 10px; } }
        a { -webkit-tap-highlight-color: transparent; }
        .wall { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        @media (max-width: 900px) { .wall { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 560px) { .wall { grid-template-columns: 1fr; } }
      `}</style>
      <main style={{ padding: "0 var(--wr-gutter) 40px", maxWidth: 1400, margin: "0 auto" }}>
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
              fontSize: 12,
              color: DIM_TEXT,
              fontFamily: mono,
            }}
          >
            {ready ? (
              <>
                No live cams right now. <a href="/" style={{ color: "#6ee7b7" }}>See the full list</a>
              </>
            ) : (
              "loading the wall…"
            )}
          </div>
        )}
        <div
          style={{
            marginTop: 24,
            textAlign: "center",
            fontSize: 11,
            color: DIM_TEXT,
            fontFamily: mono,
          }}
        >
          Snowfall: 24h totals from{" "}
          <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer" style={{ color: "#94a3b8" }}>
            Open-Meteo.com
          </a>{" "}
          weather data · Not affiliated with any resort
        </div>
      </main>
    </div>
  );
}
