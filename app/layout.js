import { DM_Sans, JetBrains_Mono } from "next/font/google";

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata = {
  title: "SummitCams — Colorado Snow Stake Webcams",
  description:
    "Live snow stake webcams from Colorado ski resorts. Copper, A-Basin, Vail, Beaver Creek, Breckenridge, Keystone, Winter Park, and Steamboat — all in one place.",
  openGraph: {
    title: "SummitCams — Colorado Snow Stake Webcams",
    description:
      "Live snow stake webcams from Colorado ski resorts, all on one page.",
    url: "https://summitcams.live",
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
      </body>
    </html>
  );
}
