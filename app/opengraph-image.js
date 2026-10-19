import { ImageResponse } from "next/og";

// Link-preview card (texts, social). Text-only on purpose: the cam frames
// belong to the resorts.
export const alt = "SummitCams — Colorado snow stake webcams";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 90px",
          background: "#060a13",
          color: "#fff",
        }}
      >
        <div style={{ display: "flex", fontSize: 96, fontWeight: 800, letterSpacing: 2 }}>
          SUMMIT<span style={{ color: "#6ee7b7" }}>CAMS</span>
        </div>
        <div style={{ fontSize: 40, color: "#94a3b8", marginTop: 24 }}>
          Every Colorado snow stake cam, live, on one page.
        </div>
        <div style={{ fontSize: 30, color: "#7dd3fc", marginTop: 40 }}>
          ❄ Copper · A-Basin · Vail · Breck · Keystone · Loveland · Winter Park · Steamboat
        </div>
      </div>
    ),
    size
  );
}
