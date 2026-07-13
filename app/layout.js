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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
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
