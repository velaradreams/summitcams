"use client";

import { useState, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { CAMS, proxySrc } from "./cams";
import { PREFS_KEY, loadPrefs, useLiveData, useVisibleInterval } from "./lib/client";

const mono = "var(--font-mono), monospace";
// Text colors on the dark background: status messages / secondary text.
const STATUS_TEXT = "#94a3b8"; // ~7:1
const DIM_TEXT = "#7b8798"; // ~5:1, passes 4.5:1 on every background here
const UNDO_MS = 6000;

const minuteBucket = () => Math.floor(Date.now() / 60000);

const frame = (bg, aspect = "16/9") => ({
  position: "relative",
  width: "100%",
  aspectRatio: aspect,
  background: bg,
  borderRadius: 10,
  overflow: "hidden",
});

function CamFeed({ cam, priority }) {
  const wrapRef = useRef(null);
  const [seen, setSeen] = useState(false);
  const [bucket, setBucket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [frameAt, setFrameAt] = useState(null);
  const isImage = cam.type === "image" || cam.type === "timecam";

  // Mount the feed once its (always-visible) box gets near the screen. Observe
  // the wrapper, never the <img>: the img is display:none until it loads, and a
  // hidden element never intersects — that's the old lazy-loading deadlock.
  useEffect(() => {
    if (seen) return;
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          io.disconnect();
        }
      },
      { rootMargin: "300px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);

  useEffect(() => {
    if (!seen || !isImage) return;
    setBucket(minuteBucket());
    setLoading(true);
    setError(false);
  }, [seen, cam, isImage]);

  // New frame every minute, only while the tab is visible.
  useVisibleInterval(() => {
    if (seen && isImage) setBucket(minuteBucket());
  }, 60000);

  if (cam.type === "youtube") {
    return (
      <div ref={wrapRef} style={frame("#000")}>
        {seen && (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${cam.videoId}?autoplay=0&mute=1&controls=1&modestbranding=1&rel=0`}
            style={{ width: "100%", height: "100%", border: "none" }}
            allow="autoplay; encrypted-media"
            allowFullScreen
            loading="lazy"
            title={`${cam.resort} ${cam.cam}`}
          />
        )}
      </div>
    );
  }
  if (cam.type === "iframe") {
    // tapToPlay players stream video on their own; wait for a tap.
    const show = seen && (!cam.tapToPlay || playing);
    return (
      <div ref={wrapRef} style={frame("#000")}>
        {show ? (
          <iframe
            src={cam.src}
            style={{ width: "100%", height: "100%", border: "none" }}
            allow="autoplay; encrypted-media"
            allowFullScreen
            loading="lazy"
            title={`${cam.resort} ${cam.cam}`}
          />
        ) : (
          cam.tapToPlay && (
            <button
              onClick={() => setPlaying(true)}
              title={`Play the ${cam.resort} live video`}
              style={{
                width: "100%",
                height: "100%",
                border: "none",
                cursor: "pointer",
                background: "linear-gradient(135deg, #0c1220 0%, #111827 100%)",
                color: STATUS_TEXT,
                fontFamily: mono,
                fontSize: 12,
                letterSpacing: "0.08em",
              }}
            >
              ▶ LIVE VIDEO — TAP TO PLAY
            </button>
          )
        )}
      </div>
    );
  }
  const imgSrc = bucket !== null ? proxySrc(cam, bucket) : null;
  return (
    <div ref={wrapRef} style={frame("#0a0f1a", cam.aspect)}>
      {/* No loading="lazy" on this img: it's display:none until onLoad, and a
          hidden img never intersects the viewport, so lazy would never fetch.
          The wrapper's IntersectionObserver above does the lazy part. */}
      {imgSrc && (
        <a
          href={`${imgSrc}&full=1`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open the full ${cam.resort} frame`}
          style={{ display: "block", width: "100%", height: "100%" }}
        >
          <img
            src={imgSrc}
            alt={`${cam.resort} ${cam.cam}`}
            fetchPriority={priority ? "high" : "auto"}
            style={{
              width: "100%",
              height: "100%",
              // contain, not cover: 4:3 frames would lose the bottom of the
              // ruler and the timestamp bar to a 16:9 crop.
              objectFit: "contain",
              display: loading && !error ? "none" : "block",
              opacity: error ? 0 : 1,
            }}
            onLoad={() => {
              setLoading(false);
              setError(false);
              // The timing entry is filed just after the load event fires.
              const src = imgSrc;
              setTimeout(() => setFrameAt(readFrameTime(src)), 50);
            }}
            onError={() => {
              setLoading(false);
              setError(true);
            }}
          />
        </a>
      )}
      {loading && !error && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
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
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #0c1220 0%, #111827 100%)",
            pointerEvents: "none",
          }}
        >
          <span
            style={{
              fontSize: 12,
              color: STATUS_TEXT,
              fontFamily: mono,
              letterSpacing: "0.05em",
            }}
          >
            Feed unavailable — retrying every minute
          </span>
        </div>
      )}
      {!loading && !error && frameAt && <PhotoAge at={frameAt} />}
    </div>
  );
}

// Capture time the proxy sent for this image (Server-Timing "frame"), or null.
function readFrameTime(src) {
  try {
    const url = new URL(src, window.location.href).href;
    const entry = performance.getEntriesByName(url).pop();
    const st = entry?.serverTiming?.find((t) => t.name === "frame");
    const ms = st ? Date.parse(st.description) : NaN;
    // Keep the timing buffer from filling up on a page left open for hours.
    if (performance.getEntriesByType("resource").length > 200) performance.clearResourceTimings();
    return Number.isFinite(ms) ? ms : null;
  } catch {
    return null;
  }
}

// "photo 4 min ago" in the frame's corner; amber once it's over an hour old.
// The feed refreshes every minute, which re-renders this with a fresh age.
function PhotoAge({ at }) {
  const mins = Math.max(0, Math.round((Date.now() - at) / 60000));
  const text =
    mins < 1 ? "photo just now" : mins < 60 ? `photo ${mins} min ago` : `photo ${Math.floor(mins / 60)} h ${mins % 60} min old`;
  return (
    <span
      style={{
        position: "absolute",
        left: 8,
        top: 8, // top: most cams burn their own timestamp into the bottom
        fontSize: 12,
        fontFamily: mono,
        color: mins >= 60 ? "#fbbf24" : "#e2e8f0",
        background: "rgba(6,10,19,0.72)",
        borderRadius: 6,
        padding: "3px 7px",
        pointerEvents: "none",
      }}
    >
      {text}
    </span>
  );
}

function CtrlButton({ onClick, label, pressed, active, children }) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={pressed}
      className="ctrl"
      style={{
        background: "none",
        border: "none",
        // 30px tap target (WCAG minimum is 24) without growing the row.
        minWidth: 30,
        minHeight: 30,
        padding: "0 6px",
        margin: "-7px 0",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        fontSize: 15,
        lineHeight: 1,
        color: active ? "#6ee7b7" : DIM_TEXT,
        fontFamily: mono,
      }}
    >
      {children}
    </button>
  );
}

// "opens Nov 6" while a resort's announced opening day is still ahead (Denver
// dates), otherwise null.
function opensLabel(opens) {
  if (!opens) return null;
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Denver" });
  if (opens <= today) return null;
  const d = new Date(opens + "T12:00:00");
  return `opens ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

const fmtDenver = (iso) =>
  new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Denver",
  });

function darkMessage(status) {
  if (status.state === "offseason") return "❄ off-season — back when the lifts spin";
  if (status.reason === "stale" && status.frameAt)
    return `⚠ camera stuck — last photo ${fmtDenver(status.frameAt)}`;
  if (status.reason === "ended") return "⚠ stream ended — waiting on a new link";
  return "⚠ feed offline right now";
}

function SnowBadges({ snowIn, fcstIn }) {
  const fcst = Math.round(fcstIn || 0);
  return (
    <>
      {snowIn > 0 && (
        <span
          style={{ fontSize: 12, color: "#7dd3fc", fontWeight: 700, fontFamily: mono }}
          title="Snowfall in the last 24h — model estimate at the stake's elevation. Trust the stake."
        >
          ❄ ~{snowIn}&quot; est. 24h
        </span>
      )}
      {fcst >= 1 && (
        <span
          style={{ fontSize: 12, color: "#c4b5fd", fontWeight: 700, fontFamily: mono }}
          title="Forecast snowfall for the next 24h (model estimate)"
        >
          → ~{fcst}&quot; forecast
        </span>
      )}
    </>
  );
}

function CamCard({ cam, status, snowIn, fcstIn, prefs, actions, isFav, favCount, priority }) {
  const favIndex = prefs.favs.indexOf(cam.id);
  const state = status?.state || "ok";
  return (
    <div className="cam-entry" id={`cam-${cam.id}`}>
      {/* Label bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          marginBottom: 6,
          padding: "0 2px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            flexWrap: "wrap",
            columnGap: 8,
            rowGap: 2,
            minWidth: 0,
          }}
        >
          {cam.website ? (
            <a
              href={cam.website}
              target="_blank"
              rel="noopener noreferrer"
              className="resort-link"
              title={`${cam.resort} official site`}
              style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", textDecoration: "none" }}
            >
              {cam.resort}
            </a>
          ) : (
            <span style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>{cam.resort}</span>
          )}
          <span style={{ fontSize: 12, color: DIM_TEXT, fontWeight: 500 }}>{cam.cam}</span>
          {cam.stakeClear && (
            <span
              style={{ fontSize: 12, color: DIM_TEXT, fontFamily: mono }}
              title="The stake is wiped clean daily at this time, so it shows snow since then"
            >
              cleared {cam.stakeClear} daily
            </span>
          )}
          <SnowBadges snowIn={snowIn} fcstIn={fcstIn} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
          {cam.type === "youtube" && state === "ok" && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#ef4444",
                letterSpacing: "0.1em",
                fontFamily: mono,
                display: "flex",
                alignItems: "center",
                gap: 3,
                marginRight: 4,
              }}
            >
              <span
                className="pulse"
                style={{ width: 5, height: 5, borderRadius: "50%", background: "#ef4444" }}
              />
              LIVE
            </span>
          )}
          <span
            style={{ fontSize: 12, color: "#6ee7b7", fontWeight: 600, fontFamily: mono, marginRight: 2 }}
          >
            {cam.elevation}
          </span>
          {isFav && favCount > 1 && (
            <>
              <CtrlButton label={`Move ${cam.resort} up`} onClick={() => actions.moveFav(cam.id, -1)}>
                ↑
              </CtrlButton>
              <CtrlButton label={`Move ${cam.resort} down`} onClick={() => actions.moveFav(cam.id, 1)}>
                ↓
              </CtrlButton>
            </>
          )}
          <CtrlButton
            label={favIndex >= 0 ? `Unpin ${cam.resort} from favorites` : `Pin ${cam.resort} to the top`}
            pressed={favIndex >= 0}
            active={favIndex >= 0}
            onClick={(e) => actions.toggleFav(cam.id, e)}
          >
            {favIndex >= 0 ? "★" : "☆"}
          </CtrlButton>
          <CtrlButton label={`Hide ${cam.resort}`} onClick={(e) => actions.toggleHide(cam.id, e)}>
            ✕
          </CtrlButton>
        </div>
      </div>

      {/* Feed, or a compact box when the cam is dark */}
      {state !== "ok" ? (
        <div
          style={{
            borderRadius: 10,
            border: "1px solid #1e293b",
            background: "linear-gradient(135deg, #0c1220 0%, #111827 100%)",
            padding: "14px 16px",
            fontSize: 12,
            color: STATUS_TEXT,
            fontFamily: mono,
            letterSpacing: "0.05em",
          }}
        >
          {darkMessage(status)}
        </div>
      ) : (
        <CamFeed cam={cam} priority={priority} />
      )}
    </div>
  );
}

// Holds the spot of a card that just left (hidden / pinned / unpinned), so a
// second tap lands on "Undo" instead of the next card's identical button.
function UndoStub({ recent, onUndo }) {
  const text = { hide: "Hidden", pin: "Pinned to top", unpin: "Removed from favorites" }[recent.kind];
  return (
    <div
      data-undo-stub
      style={{
        height: recent.height,
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "0 16px",
        borderRadius: 10,
        border: "1px dashed #1e293b",
        fontSize: 12,
        color: STATUS_TEXT,
        fontFamily: mono,
        boxSizing: "border-box",
      }}
    >
      <span>
        {recent.resort} · {text}
      </span>
      <button
        onClick={onUndo}
        style={{
          background: "none",
          border: "1px solid #334155",
          borderRadius: 999,
          color: "#6ee7b7",
          fontFamily: mono,
          fontSize: 12,
          padding: "6px 14px",
          cursor: "pointer",
        }}
      >
        Undo
      </button>
    </div>
  );
}

function Clock() {
  const [time, setTime] = useState(null);
  useEffect(() => {
    setTime(new Date());
    const t = setInterval(() => setTime(new Date()), 15000);
    return () => clearInterval(t);
  }, []);
  // The server-rendered page has no time yet: hold the clock's width with an
  // invisible placeholder, or the header can re-wrap after load and push the
  // whole page down (a layout shift Lighthouse caught on 412px phones).
  return (
    <span
      style={{
        fontSize: 12,
        color: DIM_TEXT,
        fontFamily: mono,
        whiteSpace: "nowrap",
        visibility: time ? "visible" : "hidden",
      }}
    >
      {!time ? "12:00 AM MDT" : time.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "America/Denver",
        timeZoneName: "short",
      })}
    </span>
  );
}

// "Where did it snow": the top 5 by 24h snowfall, when anything got an inch.
// Two compact lines: what the numbers are, then the resorts (scrolls sideways).
function SnowStrip({ cams, snow }) {
  const top = cams
    .filter((c) => (snow[c.id] || 0) >= 1)
    .sort((a, b) => snow[b.id] - snow[a.id])
    .slice(0, 5);
  if (top.length === 0) return null;
  return (
    <section
      aria-label="Estimated new snow in the last 24 hours"
      style={{
        border: "1px solid #1e293b",
        borderRadius: 10,
        padding: "8px 10px",
        background: "#0a0f1a",
      }}
    >
      <div style={{ fontSize: 12, color: DIM_TEXT, fontFamily: mono, letterSpacing: "0.06em", marginBottom: 6 }}>
        ❄ NEW SNOW, 24H · <span style={{ color: STATUS_TEXT }}>model estimate, not measured</span>
      </div>
      <div className="navrow" style={{ display: "flex", gap: 6, overflowX: "auto" }}>
        {top.map((c) => (
          <button
            key={c.id}
            className="chip"
            style={{ color: "#7dd3fc" }}
            onClick={() => document.getElementById(`cam-${c.id}`)?.scrollIntoView({ block: "start" })}
          >
            {c.resort.toUpperCase()} ~{snow[c.id]}&quot;
          </button>
        ))}
      </div>
    </section>
  );
}

const PASSES = [
  ["all", "All"],
  ["ikon", "Ikon"],
  ["epic", "Epic"],
  ["independent", "Independent"],
];

// All / Ikon / Epic / Independent as one segmented control. Starts on All
// every visit.
function PassFilter({ value, onChange }) {
  return (
    <div role="group" aria-label="Filter by ski pass" className="seg">
      {PASSES.map(([key, label]) => (
        <button key={key} aria-pressed={value === key} onClick={() => onChange(key)} aria-label={label}>
          {key === "independent" ? (
            <>
              INDEP<span className="hide-xs">ENDENT</span>
              <span className="show-xs">.</span>
            </>
          ) : (
            label.toUpperCase()
          )}
        </button>
      ))}
    </div>
  );
}

// Region jump: a native picker (the phone's own wheel/list), so it never
// competes with the pass filter for the one sticky row.
function RegionJump({ regions, regionId }) {
  return (
    <label className="jump">
      <span className="sr-only">Jump to region</span>
      <select
        value=""
        onChange={(e) => {
          const id = e.target.value;
          e.target.value = "";
          if (id) document.getElementById(id)?.scrollIntoView({ block: "start" });
        }}
      >
        <option value="">REGION ▾</option>
        {regions.map((r) => (
          <option key={r.name} value={regionId(r.name)}>
            {r.name}
          </option>
        ))}
      </select>
    </label>
  );
}

const sectionHeader = (label) => (
  <h2
    style={{
      fontSize: 12,
      fontWeight: 700,
      color: DIM_TEXT,
      letterSpacing: "0.16em",
      fontFamily: mono,
      margin: "8px 2px 0",
    }}
  >
    {label}
  </h2>
);

export default function Home() {
  const { statuses, statusReady, snow, forecast } = useLiveData();
  const [prefs, setPrefs] = useState({ favs: [], hidden: [] });
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [recent, setRecent] = useState(null); // the card that just left, for Undo
  const [passFilter, setPassFilter] = useState("all");
  const anchorRef = useRef(null); // where the tapped card sat on screen

  useEffect(() => {
    setPrefs(loadPrefs());
    setPrefsLoaded(true);
  }, []);

  useEffect(() => {
    if (!prefsLoaded) return;
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {}
  }, [prefs, prefsLoaded]);

  useEffect(() => {
    if (!recent) return;
    const t = setTimeout(() => setRecent(null), UNDO_MS);
    return () => clearTimeout(t);
  }, [recent]);

  // Keep the undo stub exactly where the card was, even when pinning grows the
  // favorites section above it (Safari has no scroll anchoring).
  useLayoutEffect(() => {
    if (!recent || anchorRef.current == null) return;
    const stub = document.querySelector("[data-undo-stub]");
    // behavior "instant": the page's smooth scrolling would animate this, and a
    // quick second tap would land mid-scroll on whatever slid under the finger.
    if (stub) window.scrollBy({ top: stub.getBoundingClientRect().top - anchorRef.current, behavior: "instant" });
    anchorRef.current = null;
  }, [recent]);

  const byId = useMemo(() => Object.fromEntries(CAMS.map((c) => [c.id, c])), []);
  const stateOf = (id) => statuses[id]?.state || "ok";

  // The pass filter applies to every list except the hidden-cams manager.
  const inPass = (c) => passFilter === "all" || c.pass === passFilter;
  const favCams = prefs.favs.map((id) => byId[id]).filter(Boolean).filter(inPass);
  const hiddenCams = CAMS.filter((c) => prefs.hidden.includes(c.id));
  const mainCams = CAMS.filter(
    (c) => !prefs.hidden.includes(c.id) && !prefs.favs.includes(c.id) && inPass(c)
  );
  const activeCams = mainCams.filter((c) => stateOf(c.id) !== "offseason");
  const offseasonCams = mainCams.filter((c) => stateOf(c.id) === "offseason");

  // Regions in registry order. A region whose only cam was just pinned or hidden
  // stays (empty) while its undo stub shows, so the layout doesn't jump.
  const activeIds = new Set(activeCams.map((c) => c.id));
  const regions = [];
  for (const cam of CAMS) {
    const keepForStub = recent && cam.id === recent.id && recent.section === cam.region;
    if (!activeIds.has(cam.id) && !keepForStub) continue;
    let g = regions.find((r) => r.name === cam.region);
    if (!g) {
      g = { name: cam.region, cams: [] };
      regions.push(g);
    }
    if (activeIds.has(cam.id)) g.cams.push(cam);
  }

  // Section a card is listed in, and its index there (for the undo stub).
  const placeOf = (id) => {
    const fi = favCams.findIndex((c) => c.id === id);
    if (fi >= 0) return { section: "fav", index: fi };
    for (const r of regions) {
      const i = r.cams.findIndex((c) => c.id === id);
      if (i >= 0) return { section: r.name, index: i };
    }
    return null;
  };

  const act = (kind, id, e) => {
    const place = placeOf(id);
    const card = document.getElementById(`cam-${id}`);
    const wasFavIndex = prefs.favs.indexOf(id);
    const wasHidden = prefs.hidden.includes(id);
    setPrefs((p) => {
      if (kind === "hide")
        return { favs: p.favs.filter((f) => f !== id), hidden: [...p.hidden.filter((h) => h !== id), id] };
      if (kind === "pin") return { ...p, favs: [...p.favs, id] };
      return { ...p, favs: p.favs.filter((f) => f !== id) };
    });
    if (place && card && e) {
      anchorRef.current = card.getBoundingClientRect().top;
      setRecent({
        kind,
        id,
        resort: byId[id].resort,
        height: card.offsetHeight,
        wasFavIndex,
        wasHidden,
        ...place,
      });
    }
  };

  const undo = () => {
    if (!recent) return;
    const { id, wasFavIndex, wasHidden } = recent;
    setPrefs((p) => {
      const favs = p.favs.filter((f) => f !== id);
      if (wasFavIndex >= 0) favs.splice(Math.min(wasFavIndex, favs.length), 0, id);
      const hidden = p.hidden.filter((h) => h !== id);
      if (wasHidden) hidden.push(id);
      return { favs, hidden };
    });
    setRecent(null);
  };

  const actions = {
    toggleFav: (id, e) => act(prefs.favs.includes(id) ? "unpin" : "pin", id, e),
    toggleHide: (id, e) => act("hide", id, e),
    unhide: (id) => setPrefs((p) => ({ ...p, hidden: p.hidden.filter((h) => h !== id) })),
    moveFav: (id, dir) =>
      setPrefs((p) => {
        const favs = [...p.favs];
        const i = favs.indexOf(id);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= favs.length) return p;
        [favs[i], favs[j]] = [favs[j], favs[i]];
        return { ...p, favs };
      }),
  };

  // The first two image cams on screen load at high priority (the LCP image).
  const priorityIds = new Set(
    favCams
      .concat(regions.flatMap((r) => r.cams))
      .filter((c) => (c.type === "image" || c.type === "timecam") && stateOf(c.id) === "ok")
      .slice(0, 2)
      .map((c) => c.id)
  );

  const renderList = (cams, section, isFav) => {
    const items = cams.map((cam) => (
      <CamCard
        key={cam.id}
        cam={cam}
        status={statuses[cam.id]}
        snowIn={snow[cam.id]}
        fcstIn={forecast[cam.id]}
        prefs={prefs}
        actions={actions}
        isFav={isFav}
        favCount={favCams.length}
        priority={priorityIds.has(cam.id)}
      />
    ));
    if (recent && recent.section === section) {
      const at = Math.min(recent.index, items.length);
      items.splice(at, 0, <UndoStub key={`undo-${recent.id}`} recent={recent} onUndo={undo} />);
    }
    return items;
  };

  const stripCams = CAMS.filter(
    (c) => !prefs.hidden.includes(c.id) && stateOf(c.id) !== "offseason" && inPass(c)
  );
  const showFavSection = favCams.length > 0 || recent?.section === "fav";
  const regionId = (name) => `region-${name.replace(/\s+/g, "-")}`;

  return (
    <div style={{ minHeight: "100vh", background: "#060a13", color: "#e2e8f0" }}>
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
        .pulse { animation: pulse 1.5s ease infinite; }
        .brand-dot { animation: pulse 2.5s ease-in-out infinite; }
        .cam-entry { animation: fadeUp 0.5s ease both; scroll-margin-top: 62px; }
        .chip {
          font-family: var(--font-mono), monospace;
          font-size: 12px; letter-spacing: 0.06em;
          color: ${DIM_TEXT}; background: #0c1220;
          border: 1px solid #1e293b; border-radius: 999px;
          padding: 6px 11px; cursor: pointer; white-space: nowrap;
        }
        .chip:hover { color: #6ee7b7; border-color: #334155; }
        .wrap { max-width: 900px; margin: 0 auto; padding-left: 20px; padding-right: 20px; box-sizing: border-box; }
        @media (max-width: 480px) { .wrap { padding-left: 12px; padding-right: 12px; } }
        @media (max-width: 400px) { .hide-narrow { display: none; } }
        .show-xs { display: none; }
        .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
        .seg { display: inline-flex; border: 1px solid #1e293b; border-radius: 999px; overflow: hidden; flex-shrink: 0; }
        .seg button {
          font-family: var(--font-mono), monospace; font-size: 12px; letter-spacing: 0.04em;
          color: ${DIM_TEXT}; background: #0c1220; border: none; padding: 8px 10px;
          min-height: 34px; cursor: pointer; white-space: nowrap;
        }
        .seg button + button { border-left: 1px solid #1e293b; }
        .seg button[aria-pressed="true"] { color: #060a13; background: #6ee7b7; font-weight: 700; }
        .jump select {
          font-family: var(--font-mono), monospace; font-size: 12px; letter-spacing: 0.04em;
          color: ${DIM_TEXT}; background: #0c1220; border: 1px solid #1e293b; border-radius: 999px;
          padding: 8px 10px; min-height: 34px; cursor: pointer; appearance: none; -webkit-appearance: none;
          width: 96px; text-overflow: ellipsis; /* else it sizes to its longest option */
        }
        /* After the base .seg/.jump rules so these win on the narrowest phones. */
        @media (max-width: 360px) {
          .hide-xs { display: none; }
          .show-xs { display: inline; }
          .seg button { padding: 8px 7px; }
          .jump select { width: 84px; }
        }
        a, button, select { -webkit-tap-highlight-color: transparent; }
        html { -webkit-text-size-adjust: 100%; }
        .navrow { scrollbar-width: none; }
        .navrow::-webkit-scrollbar { display: none; }
        .ctrl:hover { color: #6ee7b7 !important; }
        .resort-link:hover { color: #6ee7b7 !important; text-decoration: underline !important; }
        button:focus-visible, a:focus-visible { outline: 2px solid #6ee7b7; outline-offset: 2px; border-radius: 4px; }
        html { scroll-behavior: smooth; }
        @media (prefers-reduced-motion: reduce) {
          html { scroll-behavior: auto; }
          .cam-entry, .pulse, .brand-dot, .spinner { animation: none; }
        }
      `}</style>

      {/* Header: one row on phones — wordmark with the Denver clock under it,
          White Room on the right. */}
      <header
        className="wrap"
        style={{
          paddingTop: 14,
          paddingBottom: 8,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              className="brand-dot"
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#6ee7b7",
                boxShadow: "0 0 8px rgba(110,231,183,0.5)",
                flexShrink: 0,
              }}
            />
            <h1 style={{ fontSize: 21, fontWeight: 800, letterSpacing: "0.01em", color: "#fff", margin: 0, lineHeight: 1.1 }}>
              SUMMIT<span style={{ color: "#6ee7b7" }}>CAMS</span>
            </h1>
          </div>
          <div style={{ paddingLeft: 16, marginTop: 2 }}>
            <Clock />
          </div>
        </div>
        <a
          href="/whiteroom"
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.1em",
            fontFamily: mono,
            color: "#6ee7b7",
            background: "rgba(110,231,183,0.08)",
            border: "1px solid rgba(110,231,183,0.35)",
            borderRadius: 999,
            padding: "8px 12px",
            textDecoration: "none",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          ❄ <span className="hide-narrow">THE </span>WHITE ROOM
        </a>
      </header>

      {/* One sticky row: pass filter + region picker. Always rendered at full
          height (the picker fills in once status lands), so nothing below it
          moves after the first paint. */}
      <nav
        aria-label="Filters"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 5,
          background: "rgba(6,10,19,0.94)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          borderBottom: "1px solid #0f172a",
        }}
      >
        <div
          className="wrap"
          style={{
            paddingTop: 8,
            paddingBottom: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            minHeight: 50,
          }}
        >
          <PassFilter value={passFilter} onChange={setPassFilter} />
          {statusReady && regions.length > 1 && <RegionJump regions={regions} regionId={regionId} />}
        </div>
      </nav>

      {/* Cam list */}
      <main className="wrap" style={{ paddingTop: 12, paddingBottom: 60 }}>
        {!statusReady ? (
          // A full screen tall, so the footer starts below the fold and doesn't
          // jump down when the cams render.
          <div style={{ display: "flex", justifyContent: "center", padding: "80px 0", minHeight: "100vh", boxSizing: "border-box" }}>
            <div className="spinner" />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <SnowStrip cams={stripCams} snow={snow} />

            {favCams.length === 0 && regions.length === 0 && (
              <div style={{ fontSize: 13, color: STATUS_TEXT, fontFamily: mono, padding: "24px 2px" }}>
                No live {PASSES.find(([k]) => k === passFilter)[1]} cams right now.
              </div>
            )}

            {/* Favorites */}
            {showFavSection && (
              <>
                {sectionHeader("★ FAVORITES")}
                {renderList(favCams, "fav", true)}
              </>
            )}

            {/* Regions */}
            {regions.map((r) => (
              <div
                key={r.name}
                id={regionId(r.name)}
                style={{ display: "flex", flexDirection: "column", gap: 20, scrollMarginTop: 62 }}
              >
                {regions.length > 1 && sectionHeader(r.name.toUpperCase())}
                {renderList(r.cams, r.name, false)}
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
                        <a
                          href={cam.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="resort-link"
                          style={{ fontSize: 13, fontWeight: 600, color: STATUS_TEXT, textDecoration: "none" }}
                        >
                          {cam.resort}
                        </a>
                        <span style={{ fontSize: 12, color: DIM_TEXT }}>{cam.cam}</span>
                      </div>
                      <span
                        style={{
                          fontSize: 12,
                          color: opensLabel(cam.opens) ? "#6ee7b7" : DIM_TEXT,
                          fontFamily: mono,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {opensLabel(cam.opens) || cam.elevation}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hidden */}
            {hiddenCams.length > 0 && (
              <div style={{ textAlign: "center" }}>
                <button className="chip" onClick={() => setShowHidden((s) => !s)}>
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
                          fontSize: 12,
                          color: STATUS_TEXT,
                        }}
                      >
                        <span>
                          {cam.resort} — {cam.cam}
                        </span>
                        <CtrlButton label={`Unhide ${cam.resort}`} onClick={() => actions.unhide(cam.id)}>
                          unhide
                        </CtrlButton>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <footer
          style={{
            marginTop: 48,
            paddingTop: 20,
            borderTop: "1px solid rgba(255,255,255,0.05)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 12, color: DIM_TEXT, fontFamily: mono, lineHeight: 1.9 }}>
            summitcams.live — Colorado snow stake webcam aggregator
            <br />
            Not affiliated with any resort · Cameras belong to the resorts — tap a resort name for its site
            <br />
            Snowfall: 24h totals and forecasts from{" "}
            <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer" style={{ color: STATUS_TEXT }}>
              Open-Meteo.com
            </a>{" "}
            weather data
            <br />
            Resort or camera owner? Email{" "}
            <a href="mailto:aj@summitcams.live" style={{ color: STATUS_TEXT }}>
              aj@summitcams.live
            </a>{" "}
            to change or remove a feed.
          </div>
        </footer>
      </main>
    </div>
  );
}
