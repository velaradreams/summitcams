import { DM_Sans, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { CAMS } from "./cams";

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

// Every resort on the site, from the registry, for the search description.
const resorts = [...new Set(CAMS.map((c) => c.resort.replace(/ (Mid-Mountain|Summit|Blue Sky Basin)$/, "")))];

export const metadata = {
  metadataBase: new URL("https://www.summitcams.live"),
  title: "SummitCams — Colorado Snow Stake Webcams",
  description: `Live snow stake webcams from ${resorts.length} Colorado ski resorts on one page: ${resorts.join(", ")}.`,
  // No openGraph.url / canonical here: both pages would fold into the home page.
  openGraph: {
    title: "SummitCams — Colorado Snow Stake Webcams",
    description: "Live snow stake webcams from Colorado ski resorts, all on one page.",
    siteName: "SummitCams",
    type: "website",
  },
};

export const viewport = {
  themeColor: "#060a13",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={jetbrainsMono.variable}>
      <body
        className={dmSans.className}
        style={{
          margin: 0,
          padding: 0,
          background: "#060a13",
          minHeight: "100vh",
        }}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
