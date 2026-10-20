"use client";

import { useEffect, useRef, useState } from "react";
import { CAMS } from "../cams";

// Shared by the home page and the White Room.
export const PREFS_KEY = "sc:prefs:v1";
const KNOWN = new Set(CAMS.map((c) => c.id));

// Favorites + hidden cams from localStorage, cleaned up: strings only, no
// duplicates, and a hidden cam is never also a favorite. Ids of pulled cams are
// kept (they come back when the cam does) but never rendered.
export function loadPrefs() {
  const clean = (a) => (Array.isArray(a) ? [...new Set(a.filter((x) => typeof x === "string"))] : []);
  try {
    const p = JSON.parse(localStorage.getItem(PREFS_KEY) || "{}");
    const hidden = clean(p.hidden);
    const favs = clean(p.favs).filter((id) => !hidden.includes(id));
    return { favs, hidden };
  } catch {
    return { favs: [], hidden: [] };
  }
}

export function isKnownCam(id) {
  return KNOWN.has(id);
}

// Run fn now-ish and every `ms` while the tab is visible; catch up on return.
export function useVisibleInterval(fn, ms) {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  useEffect(() => {
    let last = Date.now();
    const tick = () => {
      if (document.hidden) return;
      last = Date.now();
      fnRef.current();
    };
    const t = setInterval(tick, ms);
    const onVis = () => {
      if (!document.hidden && Date.now() - last >= ms) tick();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [ms]);
}

const REFRESH_MS = 10 * 60 * 1000;
// Just past the 4 s health-check timeout: a cold sweep finishes before the
// fallback fires, so cams never render as live and then jump away. Normal
// visits get the CDN's cached status in ~0.15 s and never wait this long.
const STATUS_FALLBACK_MS = 4500;

// Cam statuses + snowfall, refreshed every 10 minutes while the tab is visible.
// statusReady flips once status and snow land — or after 4.5 s, so a failed
// call never blanks the page (cams then render as live until status arrives).
export function useLiveData() {
  const [statuses, setStatuses] = useState({});
  const [statusReady, setStatusReady] = useState(false);
  const [snow, setSnow] = useState({ snow: {}, forecast: {} });

  useEffect(() => {
    const fallback = setTimeout(() => setStatusReady(true), STATUS_FALLBACK_MS);
    // Wait for snow too: the snow strip sits above the cams, so drawing the
    // list before it arrives would push everything down when it pops in.
    Promise.allSettled([loadStatus(), loadSnow()]).then(() => {
      clearTimeout(fallback);
      setStatusReady(true);
    });
    return () => clearTimeout(fallback);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function loadStatus() {
    return fetch("/api/status")
      .then((r) => r.json())
      .then((d) => d.statuses && setStatuses(d.statuses))
      .catch(() => {});
  }
  function loadSnow() {
    return fetch("/api/snow")
      .then((r) => r.json())
      .then((d) => d.snow && setSnow({ snow: d.snow, forecast: d.forecast || {} }))
      .catch(() => {});
  }

  useVisibleInterval(refreshBoth, REFRESH_MS);
  function refreshBoth() {
    loadStatus();
    loadSnow();
  }

  return { statuses, statusReady, snow: snow.snow, forecast: snow.forecast };
}
